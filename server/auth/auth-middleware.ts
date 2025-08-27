import { Request, Response, NextFunction } from 'express';
import { AuthUtils } from './auth-utils';
import { prisma } from '../database/prisma';

// Extend Express Request to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: string;
        walletAddress?: string;
      };
    }
  }
}

export interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    email: string;
    role: string;
    walletAddress?: string;
  };
}

export class AuthMiddleware {
  // Verify JWT token and attach user to request
  static async authenticateToken(
    req: Request, 
    res: Response, 
    next: NextFunction
  ): Promise<void> {
    try {
      const authHeader = req.headers.authorization;
      const token = AuthUtils.extractTokenFromHeader(authHeader);

      if (!token) {
        res.status(401).json({
          success: false,
          message: 'Access denied. No token provided.',
          timestamp: new Date().toISOString()
        });
        return;
      }

      const payload = AuthUtils.verifyJWT(token);
      if (!payload) {
        res.status(401).json({
          success: false,
          message: 'Invalid or expired token.',
          timestamp: new Date().toISOString()
        });
        return;
      }

      // Verify user still exists and is active
      const user = await prisma.user.findUnique({
        where: { id: payload.userId },
        select: {
          id: true,
          email: true,
          role: true,
          isVerified: true,
          walletAddress: true
        }
      });

      if (!user) {
        res.status(401).json({
          success: false,
          message: 'User not found.',
          timestamp: new Date().toISOString()
        });
        return;
      }

      // Attach user to request
      req.user = {
        id: user.id,
        email: user.email,
        role: user.role,
        walletAddress: user.walletAddress || undefined
      };

      next();
    } catch (error) {
      console.error('Authentication error:', error);
      res.status(500).json({
        success: false,
        message: 'Authentication failed.',
        timestamp: new Date().toISOString()
      });
    }
  }

  // Optional authentication - doesn't fail if no token
  static async optionalAuth(
    req: Request, 
    res: Response, 
    next: NextFunction
  ): Promise<void> {
    try {
      const authHeader = req.headers.authorization;
      const token = AuthUtils.extractTokenFromHeader(authHeader);

      if (token) {
        const payload = AuthUtils.verifyJWT(token);
        if (payload) {
          const user = await prisma.user.findUnique({
            where: { id: payload.userId },
            select: {
              id: true,
              email: true,
              role: true,
              isVerified: true,
              walletAddress: true
            }
          });

          if (user) {
            req.user = {
              id: user.id,
              email: user.email,
              role: user.role,
              walletAddress: user.walletAddress || undefined
            };
          }
        }
      }

      next();
    } catch (error) {
      console.error('Optional auth error:', error);
      next(); // Continue without authentication
    }
  }

  // Require specific role
  static requireRole(allowedRoles: string | string[]) {
    const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
    
    return (req: Request, res: Response, next: NextFunction): void => {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required.',
          timestamp: new Date().toISOString()
        });
        return;
      }

      if (!roles.includes(req.user.role)) {
        res.status(403).json({
          success: false,
          message: `Access denied. Required role: ${roles.join(' or ')}.`,
          timestamp: new Date().toISOString()
        });
        return;
      }

      next();
    };
  }

  // Require admin role
  static requireAdmin = AuthMiddleware.requireRole(['ADMIN']);

  // Require admin or verifier role
  static requireVerifier = AuthMiddleware.requireRole(['ADMIN', 'VERIFIER']);

  // Require organization role
  static requireOrganization = AuthMiddleware.requireRole(['ORGANIZATION']);

  // Check if user owns the resource or is admin
  static requireOwnership(userIdParam: string = 'userId') {
    return (req: Request, res: Response, next: NextFunction): void => {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required.',
          timestamp: new Date().toISOString()
        });
        return;
      }

      const resourceUserId = req.params[userIdParam] || req.body[userIdParam];
      const isOwner = req.user.id === resourceUserId;
      const isAdmin = req.user.role === 'ADMIN';

      if (!isOwner && !isAdmin) {
        res.status(403).json({
          success: false,
          message: 'Access denied. You can only access your own resources.',
          timestamp: new Date().toISOString()
        });
        return;
      }

      next();
    };
  }

  // Rate limiting middleware
  static rateLimit(maxRequests: number, windowMs: number) {
    const requests = new Map<string, { count: number; resetTime: number }>();

    return (req: Request, res: Response, next: NextFunction): void => {
      const identifier = req.ip || 'unknown';
      const now = Date.now();

      const record = requests.get(identifier);
      
      if (!record || now > record.resetTime) {
        // Reset window
        requests.set(identifier, {
          count: 1,
          resetTime: now + windowMs
        });
        next();
        return;
      }

      if (record.count >= maxRequests) {
        res.status(429).json({
          success: false,
          message: 'Too many requests. Please try again later.',
          timestamp: new Date().toISOString(),
          retryAfter: Math.ceil((record.resetTime - now) / 1000)
        });
        return;
      }

      record.count++;
      next();
    };
  }

  // Session validation for persistent login
  static async validateSession(
    req: Request, 
    res: Response, 
    next: NextFunction
  ): Promise<void> {
    try {
      const sessionToken = req.cookies?.sessionToken;

      if (!sessionToken) {
        res.status(401).json({
          success: false,
          message: 'No session found.',
          timestamp: new Date().toISOString()
        });
        return;
      }

      const session = await prisma.userSession.findUnique({
        where: { token: sessionToken },
        include: { user: true }
      });

      if (!session || session.expiresAt < new Date()) {
        res.status(401).json({
          success: false,
          message: 'Session expired.',
          timestamp: new Date().toISOString()
        });
        return;
      }

      // Update last used time
      await prisma.userSession.update({
        where: { id: session.id },
        data: { lastUsedAt: new Date() }
      });

      req.user = {
        id: session.user.id,
        email: session.user.email,
        role: session.user.role,
        walletAddress: session.user.walletAddress || undefined
      };

      next();
    } catch (error) {
      console.error('Session validation error:', error);
      res.status(500).json({
        success: false,
        message: 'Session validation failed.',
        timestamp: new Date().toISOString()
      });
    }
  }
}
