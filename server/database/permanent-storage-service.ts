import { prisma } from "./prisma";
import { fabricService } from "../blockchain/simple-fabric-service";
import { ipfsService } from "../blockchain/simple-ipfs-service";

export class PermanentStorageService {
  private static instance: PermanentStorageService;
  private isRunning = false;

  static getInstance(): PermanentStorageService {
    if (!PermanentStorageService.instance) {
      PermanentStorageService.instance = new PermanentStorageService();
    }
    return PermanentStorageService.instance;
  }

  // Start the permanent storage monitoring service
  async startMonitoring(): Promise<void> {
    if (this.isRunning) {
      console.log("📋 Permanent storage service already running");
      return;
    }

    this.isRunning = true;
    console.log("🔄 Starting permanent storage monitoring service...");

    // Run initial processing
    await this.processVerifiedRecords();

    // Set up periodic processing every 5 minutes
    setInterval(
      async () => {
        await this.processVerifiedRecords();
      },
      5 * 60 * 1000,
    ); // 5 minutes

    console.log("✅ Permanent storage service started successfully");
  }

  // Process verified records for permanent storage
  private async processVerifiedRecords(): Promise<void> {
    try {
      console.log(
        "🔍 Checking for verified records requiring permanent storage...",
      );

      // Find verified records that haven't been permanently stored yet
      const verifiedRecords = await prisma.kYCRecord.findMany({
        where: {
          status: "VERIFIED",
          // Only process records verified more than 1 hour ago to ensure finality
          verifiedAt: {
            lt: new Date(Date.now() - 60 * 60 * 1000), // 1 hour ago
          },
        },
        include: {
          documents: true,
          auditLogs: {
            where: {
              action: "VERIFIED",
            },
            orderBy: {
              performedAt: "desc",
            },
            take: 1,
          },
        },
      });

      console.log(
        `📊 Found ${verifiedRecords.length} verified records for permanent storage`,
      );

      for (const record of verifiedRecords) {
        await this.ensurePermanentStorage(record);
      }

      if (verifiedRecords.length > 0) {
        console.log(
          `✅ Processed ${verifiedRecords.length} records for permanent storage`,
        );
      }
    } catch (error) {
      console.error("❌ Error processing verified records:", error);
    }
  }

  // Ensure a specific record has permanent storage
  private async ensurePermanentStorage(record: any): Promise<void> {
    try {
      console.log(`🔐 Ensuring permanent storage for KYC record: ${record.id}`);

      // Check if already has blockchain verification transaction
      if (!record.blockchainVerificationTx) {
        console.log(
          `⛓️ Creating permanent blockchain record for ${record.id}...`,
        );

        // Create permanent blockchain record
        const permanentResult = await fabricService.createPermanentRecord({
          kycId: record.id,
          status: "VERIFIED",
          verifiedAt: record.verifiedAt.toISOString(),
          verifiedBy: record.verifiedBy,
          documentsCount: record.documents.length,
          permanentStorage: true,
        });

        if (permanentResult.success) {
          // Update record with permanent blockchain transaction
          await prisma.kYCRecord.update({
            where: { id: record.id },
            data: {
              blockchainVerificationTx: permanentResult.txId,
            },
          });

          console.log(
            `⛓️ Permanent blockchain record created: ${permanentResult.txId}`,
          );
        } else {
          console.warn(
            `⚠️ Failed to create permanent blockchain record for ${record.id}`,
          );
        }
      }

      // Ensure all documents are permanently stored in IPFS
      for (const document of record.documents) {
        await this.ensureDocumentPermanentStorage(document);
      }

      // Create audit log for permanent storage
      await prisma.auditLog.create({
        data: {
          kycRecordId: record.id,
          action: "VERIFIED",
          performedBy: "system@permanent-storage",
          txId: record.blockchainVerificationTx,
          details: {
            permanentStorageProcessed: true,
            documentsCount: record.documents.length,
            processedAt: new Date().toISOString(),
          },
          remarks:
            "Record processed for permanent storage and blockchain immutability",
        },
      });

      console.log(`✅ Permanent storage ensured for record ${record.id}`);
    } catch (error) {
      console.error(
        `❌ Error ensuring permanent storage for record ${record.id}:`,
        error,
      );
    }
  }

  // Ensure document permanent storage in IPFS
  private async ensureDocumentPermanentStorage(document: any): Promise<void> {
    try {
      // Check if document is accessible in IPFS
      const pinStatus = await ipfsService.pinDocument(document.ipfsHash);

      if (pinStatus.success) {
        console.log(`📌 Document ${document.id} permanently pinned in IPFS`);
      } else {
        console.warn(`⚠️ Failed to pin document ${document.id} in IPFS`);
      }
    } catch (error) {
      console.error(
        `❌ Error ensuring document permanent storage for ${document.id}:`,
        error,
      );
    }
  }

  // Get permanent storage statistics
  async getStorageStats(): Promise<{
    totalVerified: number;
    permanentlyStored: number;
    pendingPermanentStorage: number;
    blockchainRecords: number;
  }> {
    try {
      const [totalVerified, permanentlyStored, blockchainRecords] =
        await Promise.all([
          prisma.kYCRecord.count({
            where: { status: "VERIFIED" },
          }),
          prisma.kYCRecord.count({
            where: {
              status: "VERIFIED",
              blockchainVerificationTx: { not: null },
            },
          }),
          prisma.auditLog.count({
            where: {
              action: "VERIFIED",
              performedBy: "system@permanent-storage",
            },
          }),
        ]);

      const pendingPermanentStorage = totalVerified - permanentlyStored;

      return {
        totalVerified,
        permanentlyStored,
        pendingPermanentStorage,
        blockchainRecords,
      };
    } catch (error) {
      console.error("Error fetching storage stats:", error);
      return {
        totalVerified: 0,
        permanentlyStored: 0,
        pendingPermanentStorage: 0,
        blockchainRecords: 0,
      };
    }
  }

  // Manual trigger for permanent storage processing
  async processPermanentStorageNow(): Promise<{
    processed: number;
    errors: number;
  }> {
    console.log("🚀 Manual permanent storage processing triggered");

    try {
      await this.processVerifiedRecords();
      const stats = await this.getStorageStats();

      return {
        processed: stats.permanentlyStored,
        errors: 0,
      };
    } catch (error) {
      console.error("Error in manual permanent storage processing:", error);
      return {
        processed: 0,
        errors: 1,
      };
    }
  }

  // Stop the monitoring service
  stopMonitoring(): void {
    this.isRunning = false;
    console.log("���� Permanent storage monitoring service stopped");
  }
}

export const permanentStorageService = PermanentStorageService.getInstance();
export default permanentStorageService;
