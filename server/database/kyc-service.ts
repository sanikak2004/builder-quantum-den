import { prisma, updateSystemStats } from "./prisma";
import {
  KYCStatus,
  VerificationLevel,
  DocumentType,
  AuditAction,
} from "@prisma/client";
import {
  KYCRecord as SharedKYCRecord,
  KYCDocument as SharedKYCDocument,
} from "@shared/api";
import { prisma, updateSystemStats } from "./prisma";

export interface CreateKYCRecordInput {
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
  documents: Array<{
    type: DocumentType;
    fileName: string;
    fileSize: number;
    mimeType: string;
    documentHash: string;
    ipfsHash: string;
    ipfsUrl: string;
  }>;
  blockchainTxHash?: string;
  userId?: string;
}

export interface UpdateKYCStatusInput {
  status: KYCStatus;
  remarks?: string;
  verifiedBy?: string;
  blockchainTxHash?: string;
}

export class KYCService {
  // Create a new KYC record
  static async createKYCRecord(data: CreateKYCRecordInput): Promise<any> {
    try {
      const result = await prisma.$transaction(async (tx) => {
        // Create the main KYC record
        const kycRecord = await tx.kYCRecord.create({
          data: {
            userId: data.userId,
            name: data.name,
            email: data.email,
            phone: data.phone,
            pan: data.pan,
            dateOfBirth: data.dateOfBirth,
            address: data.address,
            status: "PENDING",
            verificationLevel: "L1",
            blockchainTxHash: data.blockchainTxHash,
          },
        });

        // Create documents
        const documents = await Promise.all(
          data.documents.map((doc) =>
            tx.document.create({
              data: {
                kycRecordId: kycRecord.id,
                type: doc.type,
                fileName: doc.fileName,
                fileSize: doc.fileSize,
                mimeType: doc.mimeType || 'application/octet-stream',
                documentHash: doc.documentHash,
                ipfsHash: doc.ipfsHash,
                ipfsUrl: doc.ipfsUrl,
              } as any,
            }),
          ),
        );

        // Create audit log
        await tx.auditLog.create({
          data: {
            kycRecordId: kycRecord.id,
            userId: data.userId,
            action: "CREATED",
            performedBy: data.email,
            txId: data.blockchainTxHash,
            details: {
              documentCount: data.documents.length,
              submissionSource: "web",
            },
            remarks: "KYC record created and submitted for verification",
          },
        });

        return { kycRecord, documents };
      });

      // Update system statistics
      await updateSystemStats();

      return result;
    } catch (error) {
      console.error("Error creating KYC record:", error);
      throw error;
    }
  }

  // Get KYC record by ID with all relations
  static async getKYCRecordById(id: string): Promise<any> {
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

      if (!record) {
        throw new Error("KYC record not found");
      }

      return this.formatKYCRecord(record);
    } catch (error) {
      console.error("Error fetching KYC record:", error);
      throw error;
    }
  }

  // Get KYC record by PAN or email
  static async getKYCRecordByIdentifier(identifier: {
    pan?: string;
    email?: string;
  }): Promise<any> {
    try {
      const where = identifier.pan
        ? { pan: identifier.pan }
        : { email: identifier.email };

      const record = await prisma.kYCRecord.findFirst({
        where,
        include: {
          documents: true,
          auditLogs: {
            orderBy: { performedAt: "desc" },
            take: 10,
          },
        },
        orderBy: { createdAt: "desc" },
      });

      if (!record) {
        return null;
      }

      return this.formatKYCRecord(record);
    } catch (error) {
      console.error("Error fetching KYC record by identifier:", error);
      throw error;
    }
  }

  // Get all KYC records with filters for admin
  static async getAllKYCRecords(
    params: {
      status?: string;
      page?: number;
      limit?: number;
      sortBy?: string;
      sortOrder?: "asc" | "desc";
      search?: string;
    } = {},
  ): Promise<{ records: any[]; total: number; pages: number }> {
    try {
      const {
        status = "all",
        page = 1,
        limit = 50,
        sortBy = "createdAt",
        sortOrder = "desc",
        search = "",
      } = params;

      const skip = (page - 1) * limit;

      // Build where clause
      const where: any = {};

      if (status !== "all") {
        where.status = status as KYCStatus;
      }

      if (search) {
        where.OR = [
          { name: { contains: search, mode: "insensitive" } },
          { email: { contains: search, mode: "insensitive" } },
          { pan: { contains: search, mode: "insensitive" } },
        ];
      }

      // Build orderBy clause
      const orderBy: any = {};
      orderBy[sortBy] = sortOrder;

      const [records, total] = await Promise.all([
        prisma.kYCRecord.findMany({
          where,
          include: {
            documents: true,
            auditLogs: {
              orderBy: { performedAt: "desc" },
              take: 5,
            },
          },
          orderBy,
          skip,
          take: limit,
        }),
        prisma.kYCRecord.count({ where }),
      ]);

      const formattedRecords = records.map((record) =>
        this.formatKYCRecord(record),
      );
      const pages = Math.ceil(total / limit);

      return { records: formattedRecords, total, pages };
    } catch (error) {
      console.error("Error fetching KYC records:", error);
      throw error;
    }
  }

  // Update KYC status with enhanced error handling and blockchain integration
  static async updateKYCStatus(
    id: string,
    updateData: UpdateKYCStatusInput,
  ): Promise<any> {
    try {
      console.log(`🔄 Updating KYC status for ID: ${id} to ${updateData.status}`);
      
      const result = await prisma.$transaction(async (tx) => {
        // First, fetch the current record to get previous status
        const currentRecord = await tx.kYCRecord.findUnique({
          where: { id },
          select: { status: true, name: true, email: true }
        });
        
        if (!currentRecord) {
          throw new Error(`KYC record not found with ID: ${id}`);
        }
        
        const previousStatus = currentRecord.status;
        
        // Update the KYC record
        const updatePayload: any = {
          status: updateData.status,
          remarks: updateData.remarks,
          verifiedBy: updateData.verifiedBy,
          lastBlockchainTxHash: updateData.blockchainTxHash,
          updatedAt: new Date(),
        };

        if (updateData.status === "VERIFIED") {
          updatePayload.verifiedAt = new Date();
          updatePayload.blockchainVerificationTx = updateData.blockchainTxHash;
          updatePayload.verificationLevel = "L2"; // Set verification level
        } else if (updateData.status === "REJECTED") {
          updatePayload.rejectedAt = new Date();
          updatePayload.blockchainRejectionTx = updateData.blockchainTxHash;
        }

        const updatedRecord = await tx.kYCRecord.update({
          where: { id },
          data: updatePayload,
          include: {
            documents: true,
            auditLogs: {
              orderBy: { performedAt: "desc" },
              take: 5
            }
          },
        });

        // Create comprehensive audit log
        const auditLogData = {
          kycRecordId: id,
          action: updateData.status === "VERIFIED" ? "VERIFIED" as const : "REJECTED" as const,
          performedBy: updateData.verifiedBy || "admin@system.com",
          txId: updateData.blockchainTxHash,
          details: {
            previousStatus,
            newStatus: updateData.status,
            blockchainTx: updateData.blockchainTxHash,
            verifiedBy: updateData.verifiedBy,
            userName: currentRecord.name,
            userEmail: currentRecord.email,
            timestamp: new Date().toISOString(),
            action: `KYC ${updateData.status.toLowerCase()} by admin`
          },
          remarks: updateData.remarks || `KYC ${updateData.status.toLowerCase()} by admin`,
        };
        
        await tx.auditLog.create({ data: auditLogData });
        
        console.log(`✅ KYC record ${id} updated successfully to ${updateData.status}`);
        return updatedRecord;
      });

      // Update system statistics after successful transaction
      await updateSystemStats();
      
      console.log(`📊 System statistics updated after status change`);
      return this.formatKYCRecord(result);
    } catch (error) {
      console.error("❌ Error updating KYC status:", error);
      throw new Error(`Failed to update KYC status: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Bulk update KYC records
  static async bulkUpdateKYCStatus(
    recordIds: string[],
    action: "VERIFIED" | "REJECTED",
    remarks?: string,
  ): Promise<number> {
    try {
      const result = await prisma.$transaction(async (tx) => {
        const updateData: any = {
          status: action,
          remarks: remarks || `Bulk ${action.toLowerCase()} by admin`,
          verifiedBy: "admin@system",
        };

        if (action === "VERIFIED") {
          updateData.verifiedAt = new Date();
        } else {
          updateData.rejectedAt = new Date();
        }

        // Update all records
        const updateResult = await tx.kYCRecord.updateMany({
          where: { id: { in: recordIds } },
          data: updateData,
        });

        // Create audit logs for each record
        await Promise.all(
          recordIds.map((recordId) =>
            tx.auditLog.create({
              data: {
                kycRecordId: recordId,
                action: action === "VERIFIED" ? "VERIFIED" : "REJECTED",
                performedBy: "admin@system",
                details: {
                  bulkAction: true,
                  recordCount: recordIds.length,
                },
                remarks: remarks,
              },
            }),
          ),
        );

        return updateResult.count;
      });

      // Update system statistics
      await updateSystemStats();

      return result;
    } catch (error) {
      console.error("Error bulk updating KYC records:", error);
      throw error;
    }
  }

  // Get system statistics
  static async getSystemStats(): Promise<any> {
    try {
      // First update the stats to ensure they're current
      await updateSystemStats();

      const stats = await prisma.systemStats.findUnique({
        where: { id: "system_stats" },
      });

      if (!stats) {
        throw new Error("System statistics not found");
      }

      return {
        totalSubmissions: stats.totalSubmissions,
        pendingVerifications: stats.pendingVerifications,
        verifiedRecords: stats.verifiedRecords,
        rejectedRecords: stats.rejectedRecords,
        averageProcessingTime: stats.averageProcessingTimeHours,
      };
    } catch (error) {
      console.error("Error fetching system stats:", error);
      throw error;
    }
  }

  // Get recent activity for admin dashboard
  static async getRecentActivity(limit: number = 20): Promise<any[]> {
    try {
      const activities = await prisma.auditLog.findMany({
        take: limit,
        orderBy: { performedAt: "desc" },
        include: {
          kycRecord: {
            select: {
              name: true,
              email: true,
            },
          },
        },
      });

      return activities.map((activity) => ({
        id: activity.id,
        action: activity.action,
        user: activity.performedBy,
        timestamp: activity.performedAt.toISOString(),
        status: "SUCCESS", // Assume success if it's logged
        details:
          activity.remarks ||
          `${activity.action} for ${activity.kycRecord?.name || "user"}`,
      }));
    } catch (error) {
      console.error("Error fetching recent activity:", error);
      throw error;
    }
  }

  // Format database record to match shared API interface
  private static formatKYCRecord(record: any): SharedKYCRecord {
    return {
      id: record.id,
      userId: record.userId || "",
      name: record.name,
      email: record.email,
      phone: record.phone,
      pan: record.pan,
      dateOfBirth: record.dateOfBirth,
      address: record.address as any,
      documents:
        record.documents?.map((doc: any) => ({
          id: doc.id,
          type: doc.type,
          documentHash: doc.documentHash,
          ipfsHash: doc.ipfsHash,
          ipfsUrl: doc.ipfsUrl,
          fileName: doc.fileName,
          fileSize: doc.fileSize,
          uploadedAt: doc.uploadedAt.toISOString(),
        })) || [],
      status: record.status,
      verificationLevel: record.verificationLevel,
      blockchainTxHash: record.blockchainTxHash,
      blockchainBlockNumber: undefined, // Would need separate tracking
      submissionHash: record.blockchainTxHash,
      adminBlockchainTxHash:
        record.blockchainVerificationTx || record.blockchainRejectionTx,
      ipfsHashes: record.documents?.map((doc: any) => doc.ipfsHash) || [],
      documentHashes:
        record.documents?.map((doc: any) => doc.documentHash) || [],
      permanentStorage: record.status === "VERIFIED",
      temporaryRecord: record.status === "PENDING",
      approvalRequired: record.status === "PENDING",
      createdAt: record.createdAt.toISOString(),
      updatedAt: record.updatedAt.toISOString(),
      submittedAt: record.createdAt.toISOString(),
      verifiedAt: record.verifiedAt?.toISOString(),
      rejectedAt: record.rejectedAt?.toISOString(),
      adminApprovalTimestamp: record.verifiedAt?.toISOString(),
      verifiedBy: record.verifiedBy,
      remarks: record.remarks,
    };
  }
}

export default KYCService;
