import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { AuthService } from '../auth/auth-service';
import { AuthMiddleware } from '../auth/auth-middleware';
import { AuthUtils } from '../auth/auth-utils';
import { UserRole, WalletProvider } from '@prisma/client';

const router = Router();

// Validation schemas
const RegisterSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Valid email is required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  phone: z.string().optional(),
  role: z.enum(['USER', 'VERIFIER', 'ORGANIZATION']).default('USER')
});

const LoginSchema = z.object({
  email: z.string().email('Valid email is required'),
  password: z.string().min(1, 'Password is required')
});

const WalletConnectSchema = z.object({
  walletAddress: z.string().min(1, 'Wallet address is required'),
  signature: z.string().min(1, 'Signature is required'),
  message: z.string().min(1, 'Message is required'),
  provider: z.enum(['METAMASK', 'WALLET_CONNECT', 'COINBASE_WALLET', 'OTHER'])
});

const AccessTokenSchema = z.object({
  purpose: z.string().min(1, 'Purpose is required'),
  permissions: z.object({}).passthrough(),
  expiresInHours: z.number().min(1).max(8760).default(24) // Max 1 year
});

// Rate limiting for auth endpoints
const authRateLimit = AuthMiddleware.rateLimit(5, 15 * 60 * 1000); // 5 requests per 15 minutes

// Register new user
router.post('/register', authRateLimit, async (req: Request, res: Response) => {
  try {
    const validatedData = RegisterSchema.parse(req.body);
    const result = await AuthService.register(validatedData);

    if (result.success && result.sessionToken) {
      // Set session cookie
      res.cookie('sessionToken', result.sessionToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
        sameSite: 'strict'
      });
    }

    res.status(result.success ? 201 : 400).json({
      ...result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: error.errors,
        timestamp: new Date().toISOString()
      });
    } else {
      console.error('Registration error:', error);
      res.status(500).json({
        success: false,
        message: 'Registration failed',
        timestamp: new Date().toISOString()
      });
    }
  }
});

// Login with email/password
router.post('/login', authRateLimit, async (req: Request, res: Response) => {
  try {
    const validatedData = LoginSchema.parse(req.body);
    const result = await AuthService.login(validatedData);

    if (result.success && result.sessionToken) {
      // Set session cookie
      res.cookie('sessionToken', result.sessionToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
        sameSite: 'strict'
      });
    }

    res.status(result.success ? 200 : 401).json({
      ...result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: error.errors,
        timestamp: new Date().toISOString()
      });
    } else {
      console.error('Login error:', error);
      res.status(500).json({
        success: false,
        message: 'Login failed',
        timestamp: new Date().toISOString()
      });
    }
  }
});

// Connect Web3 wallet
router.post('/connect-wallet', 
  AuthMiddleware.authenticateToken, 
  async (req: Request, res: Response) => {
    try {
      const validatedData = WalletConnectSchema.parse(req.body);
      const result = await AuthService.connectWallet(req.user!.id, validatedData);

      res.status(result.success ? 200 : 400).json({
        ...result,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: error.errors,
          timestamp: new Date().toISOString()
        });
      } else {
        console.error('Wallet connection error:', error);
        res.status(500).json({
          success: false,
          message: 'Wallet connection failed',
          timestamp: new Date().toISOString()
        });
      }
    }
  }
);

// Generate wallet challenge message
router.post('/wallet-challenge', 
  AuthMiddleware.authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const challenge = AuthUtils.generateWalletChallenge(req.user!.email);
      
      res.json({
        success: true,
        challenge,
        message: 'Wallet challenge generated',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Wallet challenge error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to generate wallet challenge',
        timestamp: new Date().toISOString()
      });
    }
  }
);

// Get current user profile
router.get('/profile', 
  AuthMiddleware.authenticateToken, 
  async (req: Request, res: Response) => {
    try {
      const profile = await AuthService.getProfile(req.user!.id);
      
      if (!profile) {
        res.status(404).json({
          success: false,
          message: 'User profile not found',
          timestamp: new Date().toISOString()
        });
        return;
      }

      res.json({
        success: true,
        data: profile,
        message: 'Profile retrieved successfully',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Profile fetch error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch profile',
        timestamp: new Date().toISOString()
      });
    }
  }
);

// Generate access token for organization sharing
router.post('/generate-access-token',
  AuthMiddleware.authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const validatedData = AccessTokenSchema.parse(req.body);
      const result = await AuthService.generateAccessToken(
        req.user!.id,
        validatedData.purpose,
        validatedData.permissions,
        validatedData.expiresInHours
      );

      res.status(result.success ? 201 : 400).json({
        ...result,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: error.errors,
          timestamp: new Date().toISOString()
        });
      } else {
        console.error('Access token generation error:', error);
        res.status(500).json({
          success: false,
          message: 'Failed to generate access token',
          timestamp: new Date().toISOString()
        });
      }
    }
  }
);

// Verify access token (for organizations)
router.post('/verify-access-token', async (req: Request, res: Response) => {
  try {
    const { token } = req.body;
    
    if (!token) {
      res.status(400).json({
        success: false,
        message: 'Access token is required',
        timestamp: new Date().toISOString()
      });
      return;
    }

    const accessTokenData = await AuthService.verifyAccessToken(token);
    
    if (!accessTokenData) {
      res.status(401).json({
        success: false,
        message: 'Invalid or expired access token',
        timestamp: new Date().toISOString()
      });
      return;
    }

    res.json({
      success: true,
      data: {
        userId: accessTokenData.userId,
        permissions: accessTokenData.permissions,
        purpose: accessTokenData.purpose,
        usageCount: accessTokenData.usageCount,
        expiresAt: accessTokenData.expiresAt
      },
      message: 'Access token verified',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Access token verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify access token',
      timestamp: new Date().toISOString()
    });
  }
});

// Logout
router.post('/logout', async (req: Request, res: Response) => {
  try {
    const sessionToken = req.cookies?.sessionToken;
    
    if (sessionToken) {
      await AuthService.logout(sessionToken);
    }

    // Clear session cookie
    res.clearCookie('sessionToken');
    
    res.json({
      success: true,
      message: 'Logged out successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Logout failed',
      timestamp: new Date().toISOString()
    });
  }
});

// Refresh token
router.post('/refresh', 
  AuthMiddleware.validateSession,
  async (req: Request, res: Response) => {
    try {
      // Generate new JWT token
      const token = AuthUtils.generateJWT({
        userId: req.user!.id,
        email: req.user!.email,
        role: req.user!.role,
        walletAddress: req.user!.walletAddress
      });

      res.json({
        success: true,
        token,
        message: 'Token refreshed successfully',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Token refresh error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to refresh token',
        timestamp: new Date().toISOString()
      });
    }
  }
);

// Health check for auth service
router.get('/health', (req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'Authentication service is healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

export default router;
