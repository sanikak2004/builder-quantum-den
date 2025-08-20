import { prisma } from "./prisma";
// Import Prisma enums (will be available after db:generate)
// import { KYCStatus, VerificationLevel, DocumentType, AuditAction } from '@prisma/client';

// Temporary enum definitions until Prisma client is generated
enum KYCStatus {
  PENDING = "PENDING",
  UNDER_REVIEW = "UNDER_REVIEW",
  VERIFIED = "VERIFIED",
  REJECTED = "REJECTED",
  EXPIRED = "EXPIRED",
}

enum VerificationLevel {
  L1 = "L1",
  L2 = "L2",
  L3 = "L3",
}

enum DocumentType {
  PAN = "PAN",
  AADHAAR = "AADHAAR",
  PASSPORT = "PASSPORT",
  BANK_STATEMENT = "BANK_STATEMENT",
  UTILITY_BILL = "UTILITY_BILL",
  DRIVING_LICENSE = "DRIVING_LICENSE",
  VOTER_ID = "VOTER_ID",
  OTHER = "OTHER",
}

enum AuditAction {
  CREATED = "CREATED",
  UPDATED = "UPDATED",
  VERIFIED = "VERIFIED",
  REJECTED = "REJECTED",
  DOCUMENT_UPLOADED = "DOCUMENT_UPLOADED",
  STATUS_CHANGED = "STATUS_CHANGED",
  ADMIN_REVIEW = "ADMIN_REVIEW",
  BLOCKCHAIN_TRANSACTION = "BLOCKCHAIN_TRANSACTION",
}

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
    blockchainTxHash?: string,
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
          },
        });

        // Create documents
        const documentRecords = await Promise.all(
          documents.map((doc) =>
            tx.document.create({
              data: {
                kycRecordId: kycRecord.id,
                type: this.mapDocumentType(doc.type),
                fileName: doc.fileName,
                fileSize: doc.fileSize,
                documentHash: doc.documentHash,
                ipfsHash: doc.ipfsHash,
                ipfsUrl: doc.ipfsUrl,
              },
            }),
          ),
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
            remarks: "Initial KYC submission",
          },
        });

        // Update system stats
        await this.updateSystemStats(tx, "increment", "totalSubmissions");
        await this.updateSystemStats(tx, "increment", "pendingVerifications");

        return {
          ...kycRecord,
          documents: documentRecords,
        };
      });

      console.log(`✅ KYC record created successfully: ${kycData.id}`);
      return { success: true, data: result };
    } catch (error) {
      console.error("❌ Failed to create KYC record:", error);
      throw new Error(
        `Database creation failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
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
            orderBy: { performedAt: "desc" },
          },
        },
      });

      return record;
    } catch (error) {
      console.error(`❌ Failed to get KYC record ${id}:`, error);
      throw error;
    }
  }

  // Search KYC records
  async searchKYCRecord(criteria: {
    id?: string;
    pan?: string;
    email?: string;
  }) {
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
            orderBy: { performedAt: "desc" },
          },
        },
      });

      return record;
    } catch (error) {
      console.error("❌ Failed to search KYC record:", error);
      throw error;
    }
  }

  // Update KYC status (admin action)
  async updateKYCStatus(
    kycId: string,
    status: string,
    remarks: string,
    verifiedBy: string,
    blockchainTxHash?: string,
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

        if (status === "VERIFIED") {
          updateData.verifiedAt = new Date();
          updateData.verificationLevel = VerificationLevel.L2;
          updateData.blockchainVerificationTx = blockchainTxHash;
        } else if (status === "REJECTED") {
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
          },
        });

        // Create audit log entry
        await tx.auditLog.create({
          data: {
            kycRecordId: kycId,
            action:
              status === "VERIFIED"
                ? AuditAction.VERIFIED
                : AuditAction.REJECTED,
            performedBy: verifiedBy,
            txId: blockchainTxHash,
            details: { newStatus: status },
            remarks,
          },
        });

        // Update system stats
        const oldRecord = await tx.kYCRecord.findUnique({
          where: { id: kycId },
        });
        if (oldRecord?.status === "PENDING") {
          await this.updateSystemStats(tx, "decrement", "pendingVerifications");
        }

        if (status === "VERIFIED") {
          await this.updateSystemStats(tx, "increment", "verifiedRecords");
        } else if (status === "REJECTED") {
          await this.updateSystemStats(tx, "increment", "rejectedRecords");
        }

        return kycRecord;
      });

      console.log(`✅ KYC status updated successfully: ${kycId}`);
      return { success: true, data: result };
    } catch (error) {
      console.error("❌ Failed to update KYC status:", error);
      throw new Error(
        `Database update failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  // Get all KYC records (admin)
  async getAllKYCRecords(
    filters: {
      status?: string;
      limit?: number;
      offset?: number;
    } = {},
  ) {
    try {
      const { status, limit = 50, offset = 0 } = filters;

      const where: any = {};
      if (status && status !== "all") {
        where.status = status as KYCStatus;
      }

      const [records, total] = await Promise.all([
        prisma.kYCRecord.findMany({
          where,
          include: {
            documents: true,
            auditLogs: {
              take: 5,
              orderBy: { performedAt: "desc" },
            },
          },
          orderBy: { createdAt: "desc" },
          take: limit,
          skip: offset,
        }),
        prisma.kYCRecord.count({ where }),
      ]);

      return {
        records,
        total,
        offset,
        limit,
      };
    } catch (error) {
      console.error("❌ Failed to get all KYC records:", error);
      throw error;
    }
  }

  // Get KYC history/audit logs
  async getKYCHistory(kycId: string, action?: string) {
    try {
      const where: any = { kycRecordId: kycId };
      if (action && action !== "all") {
        where.action = action as AuditAction;
      }

      const history = await prisma.auditLog.findMany({
        where,
        orderBy: { performedAt: "desc" },
      });

      return history;
    } catch (error) {
      console.error("❌ Failed to get KYC history:", error);
      throw error;
    }
  }

  // Get system statistics from REAL DATABASE
  async getSystemStats() {
    try {
      console.log("📊 === REAL DATABASE QUERY: SYSTEM STATS ===");

      // Get real statistics from PostgreSQL database
      const stats = await prisma.systemStats.findUnique({
        where: { id: "system_stats" }
      });

      if (stats) {
        console.log("✅ REAL DATABASE STATS RETRIEVED:");
        console.log(`   - Total Submissions: ${stats.totalSubmissions}`);
        console.log(`   - Pending: ${stats.pendingVerifications}`);
        console.log(`   - Verified: ${stats.verifiedRecords}`);
        console.log(`   - Rejected: ${stats.rejectedRecords}`);
        console.log("📊 === REAL DATABASE QUERY COMPLETED ===\n");

        return {
          id: stats.id,
          totalSubmissions: stats.totalSubmissions,
          pendingVerifications: stats.pendingVerifications,
          verifiedRecords: stats.verifiedRecords,
          rejectedRecords: stats.rejectedRecords,
          averageProcessingTimeHours: stats.averageProcessingTimeHours,
          lastUpdated: stats.lastUpdated,
        };
      } else {
        // Initialize stats if they don't exist
        const newStats = await prisma.systemStats.create({
          data: {
            id: "system_stats",
            totalSubmissions: 0,
            pendingVerifications: 0,
            verifiedRecords: 0,
            rejectedRecords: 0,
            averageProcessingTimeHours: 0
          }
        });

        console.log("📊 REAL DATABASE: New stats record created");
        return newStats;
      }
    } catch (error) {
      console.error("❌ REAL DATABASE ERROR - Failed to get system stats:", error);

      // Only return zero stats if database is completely unavailable
      return {
        id: "system_stats",
        totalSubmissions: 0,
        pendingVerifications: 0,
        verifiedRecords: 0,
        rejectedRecords: 0,
        averageProcessingTimeHours: 0,
        lastUpdated: new Date(),
      };
    }
  }

  // Helper method to update system stats
  private async updateSystemStats(
    tx: any,
    operation: "increment" | "decrement",
    field: string,
  ) {
    try {
      const increment = operation === "increment" ? 1 : -1;
      await tx.systemStats.update({
        where: { id: "system_stats" },
        data: {
          [field]: {
            increment,
          },
        },
      });
    } catch (error) {
      console.warn(`⚠️  Could not update system stats ${field}:`, error);
    }
  }

  // Helper method to map document types
  private mapDocumentType(type: string): DocumentType {
    const typeMap: { [key: string]: DocumentType } = {
      PAN: DocumentType.PAN,
      AADHAAR: DocumentType.AADHAAR,
      PASSPORT: DocumentType.PASSPORT,
      BANK_STATEMENT: DocumentType.BANK_STATEMENT,
      UTILITY_BILL: DocumentType.UTILITY_BILL,
      DRIVING_LICENSE: DocumentType.DRIVING_LICENSE,
      VOTER_ID: DocumentType.VOTER_ID,
    };

    return typeMap[type.toUpperCase()] || DocumentType.OTHER;
  }
}

export const kycService = new KYCDatabaseService();
