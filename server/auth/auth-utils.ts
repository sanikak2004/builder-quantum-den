import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { authenticator } from 'otplib';

// Environment variables with defaults for development
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
const OTP_WINDOW = 1; // Allow 1 step before/after current time

export interface JWTPayload {
  userId: string;
  email: string;
  role: string;
  walletAddress?: string;
}

export class AuthUtils {
  // Password hashing
  static async hashPassword(password: string): Promise<string> {
    const saltRounds = 12;
    return bcrypt.hash(password, saltRounds);
  }

  static async comparePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  // JWT token management
  static generateJWT(payload: JWTPayload): string {
    return jwt.sign(payload, JWT_SECRET, { 
      expiresIn: JWT_EXPIRES_IN,
      issuer: 'authen-ledger',
      audience: 'authen-ledger-users'
    });
  }

  static verifyJWT(token: string): JWTPayload | null {
    try {
      return jwt.verify(token, JWT_SECRET) as JWTPayload;
    } catch (error) {
      console.error('JWT verification failed:', error);
      return null;
    }
  }

  // Session token generation
  static generateSessionToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  // Access token for organization sharing
  static generateAccessToken(length: number = 32): string {
    return crypto.randomBytes(length).toString('hex');
  }

  // OTP (One-Time Password) utilities
  static generateOTPSecret(): string {
    return authenticator.generateSecret();
  }

  static generateOTP(secret: string): string {
    return authenticator.generate(secret);
  }

  static verifyOTP(token: string, secret: string): boolean {
    return authenticator.verify({ token, secret, window: OTP_WINDOW });
  }

  // Email verification token
  static generateEmailVerificationToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  // Phone verification code (6 digits)
  static generatePhoneVerificationCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  // Wallet signature verification
  static verifyWalletSignature(
    message: string, 
    signature: string, 
    walletAddress: string
  ): boolean {
    try {
      // This would implement actual signature verification
      // For now, we'll return true for demo purposes
      // In production, use web3.eth.accounts.recover or similar
      console.log('Verifying wallet signature for:', walletAddress);
      return true;
    } catch (error) {
      console.error('Wallet signature verification failed:', error);
      return false;
    }
  }

  // Generate wallet connection challenge
  static generateWalletChallenge(userEmail: string): string {
    const timestamp = Date.now();
    const nonce = crypto.randomBytes(16).toString('hex');
    return `Authenticate with Authen Ledger
Email: ${userEmail}
Timestamp: ${timestamp}
Nonce: ${nonce}`;
  }

  // Extract token from Authorization header
  static extractTokenFromHeader(authHeader: string | undefined): string | null {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }
    return authHeader.substring(7);
  }

  // Rate limiting utilities
  static generateRateLimitKey(identifier: string, action: string): string {
    return `ratelimit:${action}:${identifier}`;
  }

  // Password strength validation
  static validatePasswordStrength(password: string): { 
    isValid: boolean; 
    errors: string[] 
  } {
    const errors: string[] = [];
    
    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }
    
    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }
    
    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }
    
    if (!/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    }
    
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Email validation
  static validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // Phone validation (basic)
  static validatePhone(phone: string): boolean {
    const phoneRegex = /^\+?[\d\s\-\(\)]{10,}$/;
    return phoneRegex.test(phone);
  }
}
