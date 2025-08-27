import { prisma } from '../database/prisma';
import { AuthUtils } from './auth-utils';
import { UserRole, WalletProvider } from '@prisma/client';
import crypto from 'crypto';

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  phone?: string;
  role?: UserRole;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface WalletLoginRequest {
  walletAddress: string;
  signature: string;
  message: string;
  provider: WalletProvider;
}

export interface AuthResponse {
  success: boolean;
  user?: {
    id: string;
    email: string;
    name: string;
    role: UserRole;
    isVerified: boolean;
    walletAddress?: string;
    web3Verified: boolean;
  };
  token?: string;
  sessionToken?: string;
  message: string;
}

export class AuthService {
  // Register new user with email/password
  static async register(data: RegisterRequest): Promise<AuthResponse> {
    try {
      // Validate input
      if (!AuthUtils.validateEmail(data.email)) {
        return {
          success: false,
          message: 'Invalid email format.'
        };
      }

      const passwordValidation = AuthUtils.validatePasswordStrength(data.password);
      if (!passwordValidation.isValid) {
        return {
          success: false,
          message: `Password validation failed: ${passwordValidation.errors.join(', ')}`
        };
      }

      if (data.phone && !AuthUtils.validatePhone(data.phone)) {
        return {
          success: false,
          message: 'Invalid phone number format.'
        };
      }

      // Check if user already exists
      const existingUser = await prisma.user.findFirst({
        where: {
          OR: [
            { email: data.email },
            ...(data.phone ? [{ phone: data.phone }] : [])
          ]
        }
      });

      if (existingUser) {
        return {
          success: false,
          message: 'User with this email or phone already exists.'
        };
      }

      // Hash password
      const passwordHash = await AuthUtils.hashPassword(data.password);

      // Generate OTP secret for 2FA
      const otpSecret = AuthUtils.generateOTPSecret();

      // Create user
      const user = await prisma.user.create({
        data: {
          name: data.name,
          email: data.email,
          phone: data.phone,
          passwordHash,
          role: data.role || 'USER',
          otpSecret,
          isVerified: false // Will be verified via email/phone
        }
      });

      // Generate JWT token
      const token = AuthUtils.generateJWT({
        userId: user.id,
        email: user.email,
        role: user.role,
        walletAddress: user.walletAddress || undefined
      });

      // Create session
      const sessionToken = AuthUtils.generateSessionToken();
      await prisma.userSession.create({
        data: {
          userId: user.id,
          token: sessionToken,
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
        }
      });

      // Log registration
      await prisma.auditLog.create({
        data: {
          kycRecordId: '', // No KYC record yet
          userId: user.id,
          action: 'CREATED',
          performedBy: user.email,
          details: {
            action: 'USER_REGISTRATION',
            userRole: user.role
          },
          remarks: 'User account created'
        }
      });

      return {
        success: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name || '',
          role: user.role,
          isVerified: user.isVerified,
          walletAddress: user.walletAddress || undefined,
          web3Verified: user.web3Verified
        },
        token,
        sessionToken,
        message: 'Registration successful. Please verify your email.'
      };

    } catch (error) {
      console.error('Registration error:', error);
      return {
        success: false,
        message: 'Registration failed. Please try again.'
      };
    }
  }

  // Login with email/password
  static async login(data: LoginRequest): Promise<AuthResponse> {
    try {
      // Find user
      const user = await prisma.user.findUnique({
        where: { email: data.email }
      });

      if (!user || !user.passwordHash) {
        return {
          success: false,
          message: 'Invalid email or password.'
        };
      }

      // Verify password
      const isValidPassword = await AuthUtils.comparePassword(data.password, user.passwordHash);
      if (!isValidPassword) {
        return {
          success: false,
          message: 'Invalid email or password.'
        };
      }

      // Update last login
      await prisma.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() }
      });

      // Generate JWT token
      const token = AuthUtils.generateJWT({
        userId: user.id,
        email: user.email,
        role: user.role,
        walletAddress: user.walletAddress || undefined
      });

      // Create or update session
      const sessionToken = AuthUtils.generateSessionToken();
      await prisma.userSession.create({
        data: {
          userId: user.id,
          token: sessionToken,
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
        }
      });

      // Log login
      await prisma.auditLog.create({
        data: {
          kycRecordId: '', // No specific KYC record
          userId: user.id,
          action: 'USER_LOGIN',
          performedBy: user.email,
          details: {
            action: 'USER_LOGIN',
            loginMethod: 'EMAIL_PASSWORD'
          },
          remarks: 'User logged in'
        }
      });

      return {
        success: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name || '',
          role: user.role,
          isVerified: user.isVerified,
          walletAddress: user.walletAddress || undefined,
          web3Verified: user.web3Verified
        },
        token,
        sessionToken,
        message: 'Login successful.'
      };

    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        message: 'Login failed. Please try again.'
      };
    }
  }

  // Connect Web3 wallet to existing account
  static async connectWallet(
    userId: string, 
    walletData: {
      walletAddress: string;
      signature: string;
      message: string;
      provider: WalletProvider;
    }
  ): Promise<AuthResponse> {
    try {
      // Verify wallet signature
      const isValidSignature = AuthUtils.verifyWalletSignature(
        walletData.message,
        walletData.signature,
        walletData.walletAddress
      );

      if (!isValidSignature) {
        return {
          success: false,
          message: 'Invalid wallet signature.'
        };
      }

      // Check if wallet is already connected to another account
      const existingWallet = await prisma.user.findFirst({
        where: { 
          walletAddress: walletData.walletAddress,
          id: { not: userId }
        }
      });

      if (existingWallet) {
        return {
          success: false,
          message: 'This wallet is already connected to another account.'
        };
      }

      // Update user with wallet info
      const user = await prisma.user.update({
        where: { id: userId },
        data: {
          walletAddress: walletData.walletAddress,
          walletProvider: walletData.provider,
          web3Verified: true
        }
      });

      // Log wallet connection
      await prisma.auditLog.create({
        data: {
          kycRecordId: '',
          userId: user.id,
          action: 'WALLET_CONNECTED',
          performedBy: user.email,
          details: {
            action: 'WALLET_CONNECTED',
            walletAddress: walletData.walletAddress,
            provider: walletData.provider
          },
          remarks: 'Web3 wallet connected'
        }
      });

      return {
        success: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name || '',
          role: user.role,
          isVerified: user.isVerified,
          walletAddress: user.walletAddress || undefined,
          web3Verified: user.web3Verified
        },
        message: 'Wallet connected successfully.'
      };

    } catch (error) {
      console.error('Wallet connection error:', error);
      return {
        success: false,
        message: 'Failed to connect wallet. Please try again.'
      };
    }
  }

  // Logout and invalidate session
  static async logout(sessionToken: string): Promise<{ success: boolean; message: string }> {
    try {
      await prisma.userSession.delete({
        where: { token: sessionToken }
      });

      return {
        success: true,
        message: 'Logged out successfully.'
      };
    } catch (error) {
      console.error('Logout error:', error);
      return {
        success: false,
        message: 'Logout failed.'
      };
    }
  }

  // Get user profile
  static async getProfile(userId: string) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          name: true,
          phone: true,
          role: true,
          isVerified: true,
          emailVerifiedAt: true,
          phoneVerifiedAt: true,
          walletAddress: true,
          walletProvider: true,
          web3Verified: true,
          lastLoginAt: true,
          createdAt: true,
          kycRecords: {
            select: {
              id: true,
              status: true,
              verificationLevel: true,
              createdAt: true
            },
            orderBy: { createdAt: 'desc' },
            take: 1
          }
        }
      });

      return user;
    } catch (error) {
      console.error('Get profile error:', error);
      throw error;
    }
  }

  // Generate access token for organization sharing
  static async generateAccessToken(
    userId: string, 
    purpose: string, 
    permissions: any, 
    expiresInHours: number = 24
  ): Promise<{ success: boolean; token?: string; message: string }> {
    try {
      const token = AuthUtils.generateAccessToken();
      const expiresAt = new Date(Date.now() + expiresInHours * 60 * 60 * 1000);

      await prisma.accessToken.create({
        data: {
          userId,
          token,
          purpose: purpose as any,
          expiresAt,
          permissions: permissions,
          isActive: true
        }
      });

      return {
        success: true,
        token,
        message: 'Access token generated successfully.'
      };
    } catch (error) {
      console.error('Access token generation error:', error);
      return {
        success: false,
        message: 'Failed to generate access token.'
      };
    }
  }

  // Verify access token
  static async verifyAccessToken(token: string) {
    try {
      const accessToken = await prisma.accessToken.findUnique({
        where: { token },
        include: { user: true }
      });

      if (!accessToken || !accessToken.isActive || accessToken.expiresAt < new Date()) {
        return null;
      }

      // Update usage count
      await prisma.accessToken.update({
        where: { id: accessToken.id },
        data: { 
          usageCount: { increment: 1 },
          lastUsedAt: new Date()
        }
      });

      return accessToken;
    } catch (error) {
      console.error('Access token verification error:', error);
      return null;
    }
  }
}
