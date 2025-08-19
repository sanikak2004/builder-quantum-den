import { prisma } from './prisma';
import { KYCStatus, VerificationLevel, DocumentType, AuditAction } from '@prisma/client';

export interface KYCSubmissionData {
  id: string;
  userId?: string;
  name: string;
  email: string;
  phone: string;
  pan: string;
  dateOfBirth: string;
  address: {
    street: string;
    city: string;
    state: string;
    pincode: string;
    country: string;
  };
}

export interface DocumentData {
  type: string;
  fileName: string;
  fileSize: number;
  documentHash: string;
  ipfsHash: string;
  ipfsUrl: string;
}

export class KYCDatabaseService {
  // Create new KYC record with documents
  async createKYCRecord(
    kycData: KYCSubmissionData,
    documents: DocumentData[],
    blockchainTxHash?: string
  ) {
    try {
      console.log(`💾 Creating KYC record in database: ${kycData.id}`);

      const result = await prisma.$transaction(async (tx) => {
        // Create KYC record
        const kycRecord = await tx.kYCRecord.create({
          data: {
            id: kycData.id,
            userId: kycData.userId,
            name: kycData.name,
            email: kycData.email,
            phone: kycData.phone,
            pan: kycData.pan,
            dateOfBirth: kycData.dateOfBirth,
            address: kycData.address,
            status: KYCStatus.PENDING,
            verificationLevel: VerificationLevel.L1,
            blockchainTxHash: blockchainTxHash,
          },
          include: {
            documents: true,
            auditLogs: true,
          }
        });

        // Create documents
        const documentRecords = await Promise.all(
          documents.map(doc => 
            tx.document.create({
              data: {
                kycRecordId: kycRecord.id,
                type: this.mapDocumentType(doc.type),
                fileName: doc.fileName,
                fileSize: doc.fileSize,
                documentHash: doc.documentHash,
                ipfsHash: doc.ipfsHash,
                ipfsUrl: doc.ipfsUrl,
              }
            })
          )
        );

        // Create audit log entry
        await tx.auditLog.create({
          data: {
            kycRecordId: kycRecord.id,
            userId: kycData.userId,
            action: AuditAction.CREATED,
            performedBy: kycData.email,
            txId: blockchainTxHash,
            details: {
              documentsCount: documents.length,
              initialSubmission: true,
            },
            remarks: 'Initial KYC submission',
          }
        });

        // Update system stats
        await this.updateSystemStats(tx, 'increment', 'totalSubmissions');
        await this.updateSystemStats(tx, 'increment', 'pendingVerifications');

        return {
          ...kycRecord,
          documents: documentRecords,
        };
      });

      console.log(`✅ KYC record created successfully: ${kycData.id}`);
      return { success: true, data: result };

    } catch (error) {
      console.error('❌ Failed to create KYC record:', error);
      throw new Error(`Database creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Get KYC record by ID
  async getKYCRecord(id: string) {
    try {
      const record = await prisma.kYCRecord.findUnique({
        where: { id },
        include: {
          documents: true,
          auditLogs: {
            orderBy: { performedAt: 'desc' }
          }
        }
      });

      return record;
    } catch (error) {
      console.error(`❌ Failed to get KYC record ${id}:`, error);
      throw error;
    }
  }

  // Search KYC records
  async searchKYCRecord(criteria: { id?: string; pan?: string; email?: string }) {
    try {
      const where: any = {};
      
      if (criteria.id) where.id = criteria.id;
      if (criteria.pan) where.pan = criteria.pan;
      if (criteria.email) where.email = criteria.email;

      const record = await prisma.kYCRecord.findFirst({
        where,
        include: {
          documents: true,
          auditLogs: {
            orderBy: { performedAt: 'desc' }
          }
        }
      });

      return record;
    } catch (error) {
      console.error('❌ Failed to search KYC record:', error);
      throw error;
    }
  }

  // Update KYC status (admin action)
  async updateKYCStatus(
    kycId: string,
    status: string,
    remarks: string,
    verifiedBy: string,
    blockchainTxHash?: string
  ) {
    try {
      console.log(`💾 Updating KYC status in database: ${kycId} -> ${status}`);

      const result = await prisma.$transaction(async (tx) => {
        const updateData: any = {
          status: status as KYCStatus,
          remarks,
          verifiedBy,
          updatedAt: new Date(),
          lastBlockchainTxHash: blockchainTxHash,
        };

        if (status === 'VERIFIED') {
          updateData.verifiedAt = new Date();
          updateData.verificationLevel = VerificationLevel.L2;
          updateData.blockchainVerificationTx = blockchainTxHash;
        } else if (status === 'REJECTED') {
          updateData.rejectedAt = new Date();
          updateData.blockchainRejectionTx = blockchainTxHash;
        }

        // Update KYC record
        const kycRecord = await tx.kYCRecord.update({
          where: { id: kycId },
          data: updateData,
          include: {
            documents: true,
            auditLogs: true,
          }
        });

        // Create audit log entry
        await tx.auditLog.create({
          data: {
            kycRecordId: kycId,
            action: status === 'VERIFIED' ? AuditAction.VERIFIED : AuditAction.REJECTED,
            performedBy: verifiedBy,
            txId: blockchainTxHash,
            details: { newStatus: status },
            remarks,
          }
        });

        // Update system stats
        const oldRecord = await tx.kYCRecord.findUnique({ where: { id: kycId } });
        if (oldRecord?.status === 'PENDING') {
          await this.updateSystemStats(tx, 'decrement', 'pendingVerifications');
        }
        
        if (status === 'VERIFIED') {
          await this.updateSystemStats(tx, 'increment', 'verifiedRecords');
        } else if (status === 'REJECTED') {
          await this.updateSystemStats(tx, 'increment', 'rejectedRecords');
        }

        return kycRecord;
      });

      console.log(`✅ KYC status updated successfully: ${kycId}`);
      return { success: true, data: result };

    } catch (error) {
      console.error('❌ Failed to update KYC status:', error);
      throw new Error(`Database update failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Get all KYC records (admin)
  async getAllKYCRecords(filters: {
    status?: string;
    limit?: number;
    offset?: number;
  } = {}) {
    try {
      const { status, limit = 50, offset = 0 } = filters;
      
      const where: any = {};
      if (status && status !== 'all') {
        where.status = status as KYCStatus;
      }

      const [records, total] = await Promise.all([
        prisma.kYCRecord.findMany({
          where,
          include: {
            documents: true,
            auditLogs: {
              take: 5,
              orderBy: { performedAt: 'desc' }
            }
          },
          orderBy: { createdAt: 'desc' },
          take: limit,
          skip: offset,
        }),
        prisma.kYCRecord.count({ where })
      ]);

      return {
        records,
        total,
        offset,
        limit,
      };
    } catch (error) {
      console.error('❌ Failed to get all KYC records:', error);
      throw error;
    }
  }

  // Get KYC history/audit logs
  async getKYCHistory(kycId: string, action?: string) {
    try {
      const where: any = { kycRecordId: kycId };
      if (action && action !== 'all') {
        where.action = action as AuditAction;
      }

      const history = await prisma.auditLog.findMany({
        where,
        orderBy: { performedAt: 'desc' }
      });

      return history;
    } catch (error) {
      console.error('❌ Failed to get KYC history:', error);
      throw error;
    }
  }

  // Get system statistics
  async getSystemStats() {
    try {
      let stats = await prisma.systemStats.findUnique({
        where: { id: 'system_stats' }
      });

      if (!stats) {
        // Create initial stats if they don't exist
        stats = await prisma.systemStats.create({
          data: {
            id: 'system_stats',
            totalSubmissions: 0,
            pendingVerifications: 0,
            verifiedRecords: 0,
            rejectedRecords: 0,
            averageProcessingTimeHours: 0,
          }
        });
      }

      // Calculate real-time averages
      const verifiedRecords = await prisma.kYCRecord.findMany({
        where: {
          status: KYCStatus.VERIFIED,
          verifiedAt: { not: null }
        },
        select: {
          createdAt: true,
          verifiedAt: true,
        }
      });

      let averageProcessingTime = 0;
      if (verifiedRecords.length > 0) {
        const totalProcessingTime = verifiedRecords.reduce((sum, record) => {
          if (record.verifiedAt) {
            const processingTime = (new Date(record.verifiedAt).getTime() - new Date(record.createdAt).getTime()) / (1000 * 60 * 60);
            return sum + processingTime;
          }
          return sum;
        }, 0);
        averageProcessingTime = totalProcessingTime / verifiedRecords.length;
      }

      return {
        ...stats,
        averageProcessingTimeHours: averageProcessingTime,
      };
    } catch (error) {
      console.error('❌ Failed to get system stats:', error);
      throw error;
    }
  }

  // Helper method to update system stats
  private async updateSystemStats(tx: any, operation: 'increment' | 'decrement', field: string) {
    try {
      const increment = operation === 'increment' ? 1 : -1;
      await tx.systemStats.update({
        where: { id: 'system_stats' },
        data: {
          [field]: {
            increment
          }
        }
      });
    } catch (error) {
      console.warn(`⚠️  Could not update system stats ${field}:`, error);
    }
  }

  // Helper method to map document types
  private mapDocumentType(type: string): DocumentType {
    const typeMap: { [key: string]: DocumentType } = {
      'PAN': DocumentType.PAN,
      'AADHAAR': DocumentType.AADHAAR,
      'PASSPORT': DocumentType.PASSPORT,
      'BANK_STATEMENT': DocumentType.BANK_STATEMENT,
      'UTILITY_BILL': DocumentType.UTILITY_BILL,
      'DRIVING_LICENSE': DocumentType.DRIVING_LICENSE,
      'VOTER_ID': DocumentType.VOTER_ID,
    };

    return typeMap[type.toUpperCase()] || DocumentType.OTHER;
  }
}

export const kycService = new KYCDatabaseService();
