import { prisma } from '../database/prisma';
import { EncryptionService } from './encryption-service';
import { realIPFSService } from '../blockchain/real-ipfs-service';
import { ipfsService } from '../blockchain/simple-ipfs-service';

export interface DocumentRetrievalResult {
  success: boolean;
  documentData?: Buffer;
  metadata?: any;
  error?: string;
  source: 'ipfs' | 'fallback' | 'cache';
}

export interface DocumentAccessLog {
  documentId: string;
  accessedBy: string;
  accessedAt: Date;
  purpose: string;
  ipAddress?: string;
  userAgent?: string;
}

export class DocumentRetrievalService {
  /**
   * Retrieve and decrypt a document for authorized access
   * @param documentId Document ID from database
   * @param userId User ID requesting access (for authorization)
   * @param purpose Purpose of access (for logging)
   * @returns Decrypted document data and metadata
   */
  static async retrieveDocument(
    documentId: string,
    userId: string,
    purpose: string = 'view',
    accessInfo?: { ipAddress?: string; userAgent?: string }
  ): Promise<DocumentRetrievalResult> {
    try {
      console.log(`📥 Retrieving document: ${documentId} for user: ${userId}`);

      // Get document metadata from database
      const document = await prisma.document.findUnique({
        where: { id: documentId },
        include: {
          kycRecord: {
            include: {
              user: true
            }
          }
        }
      });

      if (!document) {
        return {
          success: false,
          error: 'Document not found',
          source: 'fallback'
        };
      }

      // Check authorization - user must own the document or be admin
      const user = await prisma.user.findUnique({
        where: { id: userId }
      });

      if (!user) {
        return {
          success: false,
          error: 'User not found',
          source: 'fallback'
        };
      }

      const isOwner = document.kycRecord.userId === userId;
      const isAdmin = user.role === 'ADMIN' || user.role === 'VERIFIER';

      if (!isOwner && !isAdmin) {
        // Log unauthorized access attempt
        await this.logDocumentAccess({
          documentId,
          accessedBy: userId,
          accessedAt: new Date(),
          purpose: 'unauthorized_attempt',
          ipAddress: accessInfo?.ipAddress,
          userAgent: accessInfo?.userAgent
        });

        return {
          success: false,
          error: 'Access denied - insufficient permissions',
          source: 'fallback'
        };
      }

      // Retrieve encrypted file from IPFS
      let encryptedData: Buffer | null = null;
      let source: 'ipfs' | 'fallback' = 'fallback';

      if (realIPFSService.isConnected()) {
        console.log(`🌐 Retrieving from real IPFS: ${document.ipfsHash}`);
        encryptedData = await realIPFSService.getFile(document.ipfsHash);
        source = 'ipfs';
      }

      // Fallback to simple IPFS service
      if (!encryptedData && ipfsService.isConnected()) {
        console.log(`🔄 Falling back to simple IPFS service`);
        encryptedData = await ipfsService.getFile(document.ipfsHash);
      }

      if (!encryptedData) {
        return {
          success: false,
          error: 'Failed to retrieve document from IPFS',
          source
        };
      }

      // Decrypt the document if it's encrypted
      let documentData: Buffer;
      let metadata: any = {};

      if (document.encrypted && document.encryptionKey) {
        console.log(`🔓 Decrypting document: ${document.fileName}`);
        
        try {
          const decryptionParams = {
            encryptedData,
            key: document.encryptionKey,
            iv: document.encryptionIV!,
            algorithm: document.encryptionAlgorithm!,
            authTag: document.encryptionAuthTag
          };

          const securePackage = await EncryptionService.extractSecurePackage(decryptionParams);
          documentData = securePackage.fileData;
          metadata = securePackage.metadata;

          console.log(`✅ Document decrypted successfully: ${document.fileName}`);
        } catch (error) {
          console.error('❌ Failed to decrypt document:', error);
          return {
            success: false,
            error: 'Failed to decrypt document - corrupted or invalid encryption',
            source
          };
        }
      } else {
        // Document is not encrypted (legacy or special case)
        documentData = encryptedData;
        metadata = {
          filename: document.fileName,
          contentType: 'application/octet-stream',
          fileSize: document.fileSize
        };
      }

      // Verify document integrity
      const expectedHash = document.documentHash;
      const actualHash = EncryptionService.hashFile(documentData);

      if (expectedHash !== actualHash) {
        console.error('❌ Document integrity verification failed');
        return {
          success: false,
          error: 'Document integrity verification failed - file may be corrupted',
          source
        };
      }

      // Log successful access
      await this.logDocumentAccess({
        documentId,
        accessedBy: userId,
        accessedAt: new Date(),
        purpose,
        ipAddress: accessInfo?.ipAddress,
        userAgent: accessInfo?.userAgent
      });

      console.log(`✅ Document retrieved successfully: ${document.fileName} (${documentData.length} bytes)`);

      return {
        success: true,
        documentData,
        metadata: {
          ...metadata,
          documentId: document.id,
          kycRecordId: document.kycRecordId,
          documentType: document.type,
          uploadedAt: document.uploadedAt,
          fileName: document.fileName,
          fileSize: document.fileSize
        },
        source
      };

    } catch (error) {
      console.error('❌ Document retrieval failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        source: 'fallback'
      };
    }
  }

  /**
   * Retrieve multiple documents for a KYC record
   * @param kycRecordId KYC record ID
   * @param userId User ID requesting access
   * @param purpose Purpose of access
   * @returns Array of document retrieval results
   */
  static async retrieveKYCDocuments(
    kycRecordId: string,
    userId: string,
    purpose: string = 'kyc_review',
    accessInfo?: { ipAddress?: string; userAgent?: string }
  ): Promise<DocumentRetrievalResult[]> {
    try {
      console.log(`📥 Retrieving all documents for KYC: ${kycRecordId}`);

      // Get all documents for the KYC record
      const documents = await prisma.document.findMany({
        where: { kycRecordId },
        orderBy: { uploadedAt: 'asc' }
      });

      // Retrieve each document
      const results = await Promise.all(
        documents.map(doc => 
          this.retrieveDocument(doc.id, userId, purpose, accessInfo)
        )
      );

      console.log(`✅ Retrieved ${results.filter(r => r.success).length}/${documents.length} documents for KYC: ${kycRecordId}`);

      return results;

    } catch (error) {
      console.error('❌ Failed to retrieve KYC documents:', error);
      return [];
    }
  }

  /**
   * Check if user has access to a document
   * @param documentId Document ID
   * @param userId User ID
   * @returns True if user has access
   */
  static async checkDocumentAccess(documentId: string, userId: string): Promise<boolean> {
    try {
      const document = await prisma.document.findUnique({
        where: { id: documentId },
        include: {
          kycRecord: true
        }
      });

      if (!document) {
        return false;
      }

      const user = await prisma.user.findUnique({
        where: { id: userId }
      });

      if (!user) {
        return false;
      }

      const isOwner = document.kycRecord.userId === userId;
      const isAdmin = user.role === 'ADMIN' || user.role === 'VERIFIER';

      return isOwner || isAdmin;

    } catch (error) {
      console.error('❌ Failed to check document access:', error);
      return false;
    }
  }

  /**
   * Generate temporary access token for organization sharing
   * @param documentId Document ID
   * @param organizationId Organization user ID
   * @param expiresInHours Token expiry in hours
   * @returns Access token
   */
  static async generateDocumentAccessToken(
    documentId: string,
    organizationId: string,
    expiresInHours: number = 24
  ): Promise<{ success: boolean; token?: string; expiresAt?: Date; error?: string }> {
    try {
      // Verify document exists
      const document = await prisma.document.findUnique({
        where: { id: documentId }
      });

      if (!document) {
        return {
          success: false,
          error: 'Document not found'
        };
      }

      // Create access token
      const token = EncryptionService.generateRandomKey();
      const expiresAt = new Date(Date.now() + expiresInHours * 60 * 60 * 1000);

      await prisma.accessToken.create({
        data: {
          userId: organizationId,
          token: await token,
          purpose: 'DOCUMENT_ACCESS',
          expiresAt,
          permissions: {
            documentId,
            access: 'read',
            documentType: document.type
          },
          isActive: true,
          maxUsage: 10 // Allow up to 10 accesses
        }
      });

      return {
        success: true,
        token: await token,
        expiresAt
      };

    } catch (error) {
      console.error('❌ Failed to generate document access token:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Log document access for audit trail
   * @param accessLog Access log data
   */
  private static async logDocumentAccess(accessLog: DocumentAccessLog): Promise<void> {
    try {
      await prisma.auditLog.create({
        data: {
          kycRecordId: '', // Will be filled by document's KYC record
          userId: accessLog.accessedBy,
          action: 'DOCUMENT_ACCESSED',
          performedBy: accessLog.accessedBy,
          details: {
            documentId: accessLog.documentId,
            purpose: accessLog.purpose,
            ipAddress: accessLog.ipAddress,
            userAgent: accessLog.userAgent,
            timestamp: accessLog.accessedAt.toISOString()
          },
          remarks: `Document accessed for: ${accessLog.purpose}`
        }
      });

      console.log(`📋 Document access logged: ${accessLog.documentId} by ${accessLog.accessedBy}`);

    } catch (error) {
      console.error('❌ Failed to log document access:', error);
      // Don't throw error - this shouldn't break document retrieval
    }
  }

  /**
   * Get document access history for audit purposes
   * @param documentId Document ID
   * @param limit Number of records to return
   * @returns Access history
   */
  static async getDocumentAccessHistory(
    documentId: string,
    limit: number = 50
  ): Promise<any[]> {
    try {
      const accessLogs = await prisma.auditLog.findMany({
        where: {
          action: 'DOCUMENT_ACCESSED',
          details: {
            path: ['documentId'],
            equals: documentId
          }
        },
        orderBy: { performedAt: 'desc' },
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
              role: true
            }
          }
        }
      });

      return accessLogs.map(log => ({
        id: log.id,
        accessedBy: log.user?.email || log.performedBy,
        accessedAt: log.performedAt,
        purpose: log.details?.purpose || 'unknown',
        ipAddress: log.details?.ipAddress,
        userAgent: log.details?.userAgent,
        user: log.user
      }));

    } catch (error) {
      console.error('❌ Failed to get document access history:', error);
      return [];
    }
  }

  /**
   * Verify organization access token
   * @param token Access token
   * @returns Token data if valid, null if invalid
   */
  static async verifyAccessToken(token: string): Promise<any> {
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
      console.error('❌ Access token verification error:', error);
      return null;
    }
  }
}
