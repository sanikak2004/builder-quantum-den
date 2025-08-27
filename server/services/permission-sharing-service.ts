import { prisma } from '../database/prisma';
import { AuthUtils } from '../auth/auth-utils';
import { EncryptionService } from './encryption-service';
import crypto from 'crypto';

export interface PermissionRequest {
  userId: string;
  organizationId: string;
  kycRecordId?: string;
  documentIds?: string[];
  permissions: {
    read: boolean;
    verify: boolean;
    download: boolean;
  };
  purpose: string;
  expiresInHours: number;
  requesterInfo: {
    organizationName: string;
    organizationType: 'BANK' | 'TELECOM' | 'GOVERNMENT' | 'UNIVERSITY' | 'HEALTHCARE' | 'OTHER';
    contactEmail: string;
    businessLicense?: string;
    verificationLevel: 'BASIC' | 'VERIFIED' | 'PREMIUM';
  };
}

export interface AccessGrant {
  id: string;
  token: string;
  userId: string;
  organizationId: string;
  permissions: any;
  purpose: string;
  expiresAt: Date;
  isActive: boolean;
  usageCount: number;
  maxUsage: number;
  createdAt: Date;
  requesterInfo: any;
}

export interface VerificationResponse {
  success: boolean;
  citizenStatus: 'VERIFIED' | 'PENDING' | 'REJECTED' | 'EXPIRED';
  verificationLevel: 'L1' | 'L2' | 'L3';
  lastUpdated: string;
  documentHashes?: string[];
  blockchainTxHash?: string;
  error?: string;
}

export class PermissionSharingService {
  /**
   * Request access permission from user for organization
   * @param request Permission request details
   * @returns Permission grant with access token
   */
  static async requestPermission(request: PermissionRequest): Promise<{
    success: boolean;
    grant?: AccessGrant;
    error?: string;
  }> {
    try {
      console.log(`🔑 Creating permission grant for organization: ${request.organizationId}`);

      // Verify user exists and owns the KYC record
      const user = await prisma.user.findUnique({
        where: { id: request.userId }
      });

      if (!user) {
        return {
          success: false,
          error: 'User not found'
        };
      }

      // Verify organization exists
      const organization = await prisma.user.findUnique({
        where: { id: request.organizationId }
      });

      if (!organization || organization.role !== 'ORGANIZATION') {
        return {
          success: false,
          error: 'Invalid organization'
        };
      }

      // If KYC record specified, verify ownership
      if (request.kycRecordId) {
        const kycRecord = await prisma.kYCRecord.findUnique({
          where: { id: request.kycRecordId }
        });

        if (!kycRecord || kycRecord.userId !== request.userId) {
          return {
            success: false,
            error: 'KYC record not found or access denied'
          };
        }
      }

      // Generate secure access token
      const accessToken = AuthUtils.generateAccessToken(64); // 512-bit token
      const expiresAt = new Date(Date.now() + request.expiresInHours * 60 * 60 * 1000);

      // Create access grant
      const grant = await prisma.accessToken.create({
        data: {
          userId: request.userId,
          token: accessToken,
          purpose: 'ORGANIZATION_SHARE',
          expiresAt,
          isActive: true,
          usageCount: 0,
          maxUsage: request.permissions.verify ? 100 : 10, // More usage for verification
          permissions: {
            organizationId: request.organizationId,
            kycRecordId: request.kycRecordId,
            documentIds: request.documentIds || [],
            permissions: request.permissions,
            purpose: request.purpose,
            verificationLevel: request.requesterInfo.verificationLevel
          },
          requesterInfo: request.requesterInfo
        }
      });

      // Log permission grant
      await prisma.auditLog.create({
        data: {
          kycRecordId: request.kycRecordId || '',
          userId: request.userId,
          action: 'TOKEN_SHARED',
          performedBy: request.userId,
          details: {
            action: 'PERMISSION_GRANTED',
            organizationId: request.organizationId,
            organizationName: request.requesterInfo.organizationName,
            purpose: request.purpose,
            expiresAt: expiresAt.toISOString(),
            permissions: request.permissions
          },
          remarks: `Access granted to ${request.requesterInfo.organizationName} for ${request.purpose}`
        }
      });

      console.log(`✅ Permission grant created: ${grant.id} (expires in ${request.expiresInHours} hours)`);

      return {
        success: true,
        grant: {
          id: grant.id,
          token: grant.token,
          userId: grant.userId,
          organizationId: request.organizationId,
          permissions: grant.permissions,
          purpose: grant.purpose as any,
          expiresAt: grant.expiresAt,
          isActive: grant.isActive,
          usageCount: grant.usageCount,
          maxUsage: grant.maxUsage,
          createdAt: grant.createdAt,
          requesterInfo: grant.requesterInfo
        }
      };

    } catch (error) {
      console.error('❌ Failed to create permission grant:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Verify citizen status using access token (for organizations)
   * @param token Access token
   * @param kycRecordId Optional KYC record ID to verify
   * @returns Verification response
   */
  static async verifyCitizenStatus(
    token: string, 
    kycRecordId?: string
  ): Promise<VerificationResponse> {
    try {
      console.log(`🔍 Verifying citizen status with token: ${token.substring(0, 8)}...`);

      // Verify access token
      const accessToken = await prisma.accessToken.findUnique({
        where: { token },
        include: { user: true }
      });

      if (!accessToken || !accessToken.isActive || accessToken.expiresAt < new Date()) {
        return {
          success: false,
          citizenStatus: 'EXPIRED',
          verificationLevel: 'L1',
          lastUpdated: new Date().toISOString(),
          error: 'Invalid or expired access token'
        };
      }

      // Check usage limits
      if (accessToken.usageCount >= accessToken.maxUsage) {
        return {
          success: false,
          citizenStatus: 'EXPIRED',
          verificationLevel: 'L1',
          lastUpdated: new Date().toISOString(),
          error: 'Access token usage limit exceeded'
        };
      }

      // Get KYC record ID from token if not provided
      const targetKycId = kycRecordId || accessToken.permissions.kycRecordId;
      
      if (!targetKycId) {
        return {
          success: false,
          citizenStatus: 'REJECTED',
          verificationLevel: 'L1',
          lastUpdated: new Date().toISOString(),
          error: 'No KYC record specified'
        };
      }

      // Get KYC record
      const kycRecord = await prisma.kYCRecord.findUnique({
        where: { id: targetKycId },
        include: {
          documents: true,
          user: true
        }
      });

      if (!kycRecord) {
        return {
          success: false,
          citizenStatus: 'REJECTED',
          verificationLevel: 'L1',
          lastUpdated: new Date().toISOString(),
          error: 'KYC record not found'
        };
      }

      // Verify token owner matches KYC record owner
      if (kycRecord.userId !== accessToken.userId) {
        return {
          success: false,
          citizenStatus: 'REJECTED',
          verificationLevel: 'L1',
          lastUpdated: new Date().toISOString(),
          error: 'Access denied - token does not grant access to this KYC record'
        };
      }

      // Update token usage
      await prisma.accessToken.update({
        where: { id: accessToken.id },
        data: {
          usageCount: { increment: 1 },
          lastUsedAt: new Date()
        }
      });

      // Log verification access
      await prisma.auditLog.create({
        data: {
          kycRecordId: targetKycId,
          userId: accessToken.userId,
          action: 'VERIFIED',
          performedBy: `org:${accessToken.permissions.organizationId}`,
          details: {
            action: 'CITIZEN_VERIFICATION',
            organizationId: accessToken.permissions.organizationId,
            tokenId: accessToken.id,
            usageCount: accessToken.usageCount + 1,
            verificationMethod: 'ACCESS_TOKEN'
          },
          remarks: `Citizen verification by organization via access token`
        }
      });

      // Map KYC status to citizen status
      const citizenStatus = this.mapKYCStatusToCitizenStatus(kycRecord.status);
      
      // Get document hashes if permitted
      const documentHashes = accessToken.permissions.permissions?.read 
        ? kycRecord.documents.map(doc => doc.documentHash)
        : undefined;

      console.log(`✅ Citizen verification completed: ${citizenStatus} (Level: ${kycRecord.verificationLevel})`);

      return {
        success: true,
        citizenStatus,
        verificationLevel: kycRecord.verificationLevel as 'L1' | 'L2' | 'L3',
        lastUpdated: kycRecord.verifiedAt?.toISOString() || kycRecord.updatedAt.toISOString(),
        documentHashes,
        blockchainTxHash: kycRecord.blockchainTxHash || undefined
      };

    } catch (error) {
      console.error('❌ Citizen verification failed:', error);
      return {
        success: false,
        citizenStatus: 'REJECTED',
        verificationLevel: 'L1',
        lastUpdated: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Verification failed'
      };
    }
  }

  /**
   * Revoke access token
   * @param tokenId Token ID to revoke
   * @param userId User ID (must be token owner)
   * @returns Success status
   */
  static async revokeAccess(
    tokenId: string, 
    userId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      console.log(`🔒 Revoking access token: ${tokenId}`);

      const accessToken = await prisma.accessToken.findUnique({
        where: { id: tokenId }
      });

      if (!accessToken) {
        return {
          success: false,
          error: 'Access token not found'
        };
      }

      if (accessToken.userId !== userId) {
        return {
          success: false,
          error: 'Access denied - you can only revoke your own tokens'
        };
      }

      // Deactivate token
      await prisma.accessToken.update({
        where: { id: tokenId },
        data: { isActive: false }
      });

      // Log revocation
      await prisma.auditLog.create({
        data: {
          kycRecordId: '',
          userId: userId,
          action: 'UPDATED',
          performedBy: userId,
          details: {
            action: 'ACCESS_REVOKED',
            tokenId: tokenId,
            organizationId: accessToken.permissions.organizationId
          },
          remarks: 'Access token revoked by user'
        }
      });

      console.log(`✅ Access token revoked: ${tokenId}`);

      return { success: true };

    } catch (error) {
      console.error('❌ Failed to revoke access:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get user's active access grants
   * @param userId User ID
   * @returns List of active grants
   */
  static async getUserAccessGrants(userId: string): Promise<AccessGrant[]> {
    try {
      const grants = await prisma.accessToken.findMany({
        where: {
          userId,
          purpose: 'ORGANIZATION_SHARE',
          isActive: true,
          expiresAt: { gt: new Date() }
        },
        orderBy: { createdAt: 'desc' }
      });

      return grants.map(grant => ({
        id: grant.id,
        token: grant.token,
        userId: grant.userId,
        organizationId: grant.permissions.organizationId,
        permissions: grant.permissions,
        purpose: grant.purpose as any,
        expiresAt: grant.expiresAt,
        isActive: grant.isActive,
        usageCount: grant.usageCount,
        maxUsage: grant.maxUsage,
        createdAt: grant.createdAt,
        requesterInfo: grant.requesterInfo
      }));

    } catch (error) {
      console.error('❌ Failed to get user access grants:', error);
      return [];
    }
  }

  /**
   * Get organization's granted accesses
   * @param organizationId Organization user ID
   * @returns List of granted accesses
   */
  static async getOrganizationAccesses(organizationId: string): Promise<any[]> {
    try {
      const accesses = await prisma.accessToken.findMany({
        where: {
          isActive: true,
          expiresAt: { gt: new Date() },
          permissions: {
            path: ['organizationId'],
            equals: organizationId
          }
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      });

      return accesses.map(access => ({
        id: access.id,
        grantedBy: access.user,
        permissions: access.permissions,
        purpose: access.purpose,
        expiresAt: access.expiresAt,
        usageCount: access.usageCount,
        maxUsage: access.maxUsage,
        createdAt: access.createdAt
      }));

    } catch (error) {
      console.error('❌ Failed to get organization accesses:', error);
      return [];
    }
  }

  /**
   * Check subsidy/scheme eligibility
   * @param token Access token
   * @param schemeId Government scheme ID
   * @returns Eligibility status
   */
  static async checkSchemeEligibility(
    token: string,
    schemeId: string
  ): Promise<{
    success: boolean;
    eligible: boolean;
    reason?: string;
    lastUpdated: string;
    error?: string;
  }> {
    try {
      console.log(`🏛️ Checking scheme eligibility: ${schemeId}`);

      // First verify citizen status
      const citizenVerification = await this.verifyCitizenStatus(token);
      
      if (!citizenVerification.success || citizenVerification.citizenStatus !== 'VERIFIED') {
        return {
          success: true,
          eligible: false,
          reason: 'Citizen verification failed or pending',
          lastUpdated: new Date().toISOString()
        };
      }

      // For demonstration - in real implementation, this would integrate with government APIs
      const eligibilityRules = {
        'PMJAY': citizenVerification.verificationLevel === 'L2' || citizenVerification.verificationLevel === 'L3',
        'SCHOLARSHIP': citizenVerification.verificationLevel === 'L3',
        'RATION_CARD': citizenVerification.verificationLevel === 'L1' || citizenVerification.verificationLevel === 'L2' || citizenVerification.verificationLevel === 'L3',
        'DEFAULT': citizenVerification.verificationLevel === 'L2' || citizenVerification.verificationLevel === 'L3'
      };

      const isEligible = eligibilityRules[schemeId as keyof typeof eligibilityRules] ?? eligibilityRules.DEFAULT;

      return {
        success: true,
        eligible: isEligible,
        reason: isEligible 
          ? `Eligible based on verification level ${citizenVerification.verificationLevel}` 
          : `Insufficient verification level (${citizenVerification.verificationLevel}) for scheme ${schemeId}`,
        lastUpdated: citizenVerification.lastUpdated
      };

    } catch (error) {
      console.error('❌ Scheme eligibility check failed:', error);
      return {
        success: false,
        eligible: false,
        lastUpdated: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Eligibility check failed'
      };
    }
  }

  /**
   * Map KYC status to citizen status for organization responses
   */
  private static mapKYCStatusToCitizenStatus(status: string): 'VERIFIED' | 'PENDING' | 'REJECTED' | 'EXPIRED' {
    switch (status) {
      case 'VERIFIED':
        return 'VERIFIED';
      case 'PENDING':
      case 'UNDER_REVIEW':
        return 'PENDING';
      case 'REJECTED':
        return 'REJECTED';
      case 'EXPIRED':
        return 'EXPIRED';
      default:
        return 'PENDING';
    }
  }

  /**
   * Generate QR code for quick organization access
   * @param token Access token
   * @returns QR code data
   */
  static async generateQRCode(token: string): Promise<{ success: boolean; qrCode?: string; error?: string }> {
    try {
      const QRCode = require('qrcode');
      
      const qrData = {
        type: 'AUTHEN_LEDGER_ACCESS',
        token: token,
        timestamp: Date.now(),
        version: '1.0'
      };

      const qrCodeString = await QRCode.toDataURL(JSON.stringify(qrData));

      return {
        success: true,
        qrCode: qrCodeString
      };

    } catch (error) {
      console.error('❌ Failed to generate QR code:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'QR code generation failed'
      };
    }
  }
}
