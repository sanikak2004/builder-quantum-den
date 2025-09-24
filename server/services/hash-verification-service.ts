import { prisma } from "../database/prisma";
import { 
  ForgeryType, 
  RiskLevel, 
  VerificationStatus,
  AuditAction 
} from "@prisma/client";
import { prisma } from "../database/prisma";
import crypto from "crypto";

export interface HashVerificationResult {
  isValid: boolean;
  isDuplicate: boolean;
  isForgery: boolean;
  forgeryType?: ForgeryType;
  originalSubmission?: {
    kycRecordId: string;
    submittedBy: string;
    submissionTime: Date;
  };
  evidence: any;
  severity: RiskLevel;
}

export interface TransactionVerificationResult {
  isValid: boolean;
  exists: boolean;
  isConfirmed: boolean;
  blockNumber?: number;
  contentMatches: boolean;
  forgeryDetected: boolean;
  evidence: any;
}

export class HashVerificationService {
  
  /**
   * Verify document hash and detect duplicates/forgery
   */
  static async verifyDocumentHash(
    documentHash: string,
    ipfsHash: string,
    kycRecordId: string,
    submittedBy: string,
    fileName: string,
    fileSize: number,
    mimeType: string
  ): Promise<HashVerificationResult> {
    try {
      console.log(`🔍 Verifying document hash: ${documentHash.substring(0, 16)}...`);
      
      // Check if this hash already exists
      const existingHash = await prisma.documentHashRegistry.findUnique({
        where: { documentHash }
      });

      if (existingHash) {
        // Document hash already exists - potential duplicate or resubmission
        console.log(`⚠️ Duplicate document hash detected!`);
        
        // Update existing record
        await prisma.documentHashRegistry.update({
          where: { id: existingHash.id },
          data: {
            submissionCount: existingHash.submissionCount + 1,
            lastSubmittedBy: submittedBy,
            lastSubmissionTime: new Date(),
            lastKycRecordId: kycRecordId
          }
        });

        // Check if it's a legitimate resubmission by same user
        const isLegitimateResubmission = existingHash.firstSubmittedBy === submittedBy;
        
        if (!isLegitimateResubmission) {
          // Create forgery report
          await this.createForgeryReport({
            forgeryType: ForgeryType.DUPLICATE_SUBMISSION,
            severity: RiskLevel.HIGH,
            title: "Duplicate Document Detected",
            description: `Document with hash ${documentHash.substring(0, 16)}... has been submitted before by different user`,
            suspiciousKycRecordId: kycRecordId,
            originalKycRecordId: existingHash.firstKycRecordId,
            documentHashId: existingHash.id,
            detectedBy: "system",
            detectionMethod: "Document hash comparison",
            evidence: {
              originalSubmission: {
                submittedBy: existingHash.firstSubmittedBy,
                submissionTime: existingHash.firstSubmissionTime,
                kycRecordId: existingHash.firstKycRecordId
              },
              currentSubmission: {
                submittedBy,
                submissionTime: new Date(),
                kycRecordId
              },
              hashDetails: {
                documentHash,
                ipfsHash,
                fileName,
                fileSize,
                mimeType
              }
            }
          });

          // Log audit event
          await this.logAuditEvent({
            kycRecordId,
            action: AuditAction.DUPLICATE_DOCUMENT,
            performedBy: "system",
            details: {
              duplicateHash: documentHash,
              originalSubmission: existingHash.firstSubmittedBy
            },
            remarks: "Duplicate document hash detected - potential forgery"
          });
        }

        return {
          isValid: false,
          isDuplicate: true,
          isForgery: !isLegitimateResubmission,
          forgeryType: isLegitimateResubmission ? undefined : ForgeryType.DUPLICATE_SUBMISSION,
          originalSubmission: {
            kycRecordId: existingHash.firstKycRecordId,
            submittedBy: existingHash.firstSubmittedBy,
            submissionTime: existingHash.firstSubmissionTime
          },
          evidence: {
            submissionCount: existingHash.submissionCount + 1,
            isLegitimateResubmission
          },
          severity: isLegitimateResubmission ? RiskLevel.LOW : RiskLevel.HIGH
        };
      }

      // New document hash - register it
      console.log(`✅ New document hash registered`);
      
      await prisma.documentHashRegistry.create({
        data: {
          documentHash,
          ipfsHash,
          originalFileName: fileName,
          fileSize,
          mimeType,
          firstSubmittedBy: submittedBy,
          firstKycRecordId: kycRecordId,
          lastSubmittedBy: submittedBy,
          lastKycRecordId: kycRecordId,
          submissionCount: 1,
          verificationStatus: VerificationStatus.VERIFIED
        }
      });

      // Log audit event
      await this.logAuditEvent({
        kycRecordId,
        action: AuditAction.DOCUMENT_UPLOADED,
        performedBy: submittedBy,
        details: {
          documentHash: documentHash.substring(0, 16) + "...",
          fileName,
          fileSize
        },
        remarks: "New document hash registered successfully"
      });

      return {
        isValid: true,
        isDuplicate: false,
        isForgery: false,
        evidence: {
          isNewSubmission: true,
          registeredAt: new Date()
        },
        severity: RiskLevel.LOW
      };

    } catch (error) {
      console.error("❌ Error in document hash verification:", error);
      throw new Error(`Document hash verification failed: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  /**
   * Verify transaction hash and detect blockchain forgery
   */
  static async verifyTransactionHash(
    transactionHash: string,
    kycRecordId: string,
    documentHashes: string[],
    submittedBy: string
  ): Promise<TransactionVerificationResult> {
    try {
      console.log(`🔍 Verifying transaction hash: ${transactionHash.substring(0, 16)}...`);
      
      // Check if transaction hash already exists
      const existingTx = await prisma.transactionHashRegistry.findUnique({
        where: { transactionHash }
      });

      if (existingTx) {
        // Transaction hash exists - verify content matches
        const storedDocHashes = existingTx.documentHashes as string[];
        const contentMatches = this.compareArrays(storedDocHashes, documentHashes);
        
        if (!contentMatches) {
          // Content mismatch - potential forgery
          console.log(`🚨 Transaction hash content mismatch detected!`);
          
          await this.createForgeryReport({
            forgeryType: ForgeryType.FAKE_TRANSACTION_HASH,
            severity: RiskLevel.CRITICAL,
            title: "Transaction Hash Content Mismatch",
            description: `Transaction hash ${transactionHash} exists but content doesn't match`,
            suspiciousKycRecordId: kycRecordId,
            originalKycRecordId: existingTx.kycRecordId,
            transactionHash,
            detectedBy: "system",
            detectionMethod: "Transaction content verification",
            evidence: {
              existingTransaction: {
                kycRecordId: existingTx.kycRecordId,
                submittedBy: existingTx.submittedBy,
                documentHashes: storedDocHashes
              },
              currentSubmission: {
                kycRecordId,
                submittedBy,
                documentHashes
              }
            }
          });

          return {
            isValid: false,
            exists: true,
            isConfirmed: existingTx.isConfirmed,
            blockNumber: existingTx.blockNumber || undefined,
            contentMatches: false,
            forgeryDetected: true,
            evidence: {
              originalDocumentHashes: storedDocHashes,
              providedDocumentHashes: documentHashes,
              mismatchCount: storedDocHashes.length + documentHashes.length - 
                           this.findCommonElements(storedDocHashes, documentHashes).length
            }
          };
        }

        return {
          isValid: true,
          exists: true,
          isConfirmed: existingTx.isConfirmed,
          blockNumber: existingTx.blockNumber || undefined,
          contentMatches: true,
          forgeryDetected: false,
          evidence: {
            originalSubmission: existingTx.submittedAt,
            confirmations: existingTx.confirmations
          }
        };
      }

      // New transaction hash - register it
      const contentHash = this.generateContentHash(documentHashes);
      
      await prisma.transactionHashRegistry.create({
        data: {
          transactionHash,
          kycRecordId,
          documentHashes: documentHashes,
          contentHash,
          submittedBy,
          isVerified: true
        }
      });

      console.log(`✅ New transaction hash registered: ${transactionHash.substring(0, 16)}...`);

      return {
        isValid: true,
        exists: false,
        isConfirmed: false,
        contentMatches: true,
        forgeryDetected: false,
        evidence: {
          isNewTransaction: true,
          contentHash,
          registeredAt: new Date()
        }
      };

    } catch (error) {
      console.error("❌ Error in transaction hash verification:", error);
      throw new Error(`Transaction hash verification failed: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  /**
   * Get comprehensive forgery dashboard data
   */
  static async getForgeryDashboard() {
    try {
      const [
        totalForgeryReports,
        pendingReports,
        resolvedReports,
        criticalReports,
        duplicateDocuments,
        suspiciousTransactions,
        recentReports
      ] = await Promise.all([
        prisma.forgeryReport.count(),
        prisma.forgeryReport.count({ where: { status: VerificationStatus.PENDING } }),
        prisma.forgeryReport.count({ where: { isResolved: true } }),
        prisma.forgeryReport.count({ where: { severity: RiskLevel.CRITICAL } }),
        prisma.documentHashRegistry.count({ where: { submissionCount: { gt: 1 } } }),
        prisma.transactionHashRegistry.count({ where: { isVerified: false } }),
        prisma.forgeryReport.findMany({
          take: 10,
          orderBy: { createdAt: "desc" },
          include: {
            documentHash: true
          }
        })
      ]);

      // Get forgery types breakdown
      const forgeryTypeBreakdown = await prisma.forgeryReport.groupBy({
        by: ["forgeryType"],
        _count: true
      });

      // Get daily forgery trend (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const dailyTrend = await prisma.forgeryReport.findMany({
        where: {
          createdAt: { gte: thirtyDaysAgo }
        },
        select: {
          createdAt: true,
          severity: true
        }
      });

      return {
        summary: {
          totalForgeryReports,
          pendingReports,
          resolvedReports,
          criticalReports,
          duplicateDocuments,
          suspiciousTransactions,
          resolutionRate: totalForgeryReports > 0 ? (resolvedReports / totalForgeryReports * 100) : 0
        },
        forgeryTypeBreakdown,
        dailyTrend,
        recentReports,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error("❌ Error fetching forgery dashboard:", error);
      throw new Error(`Failed to fetch forgery dashboard: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  /**
   * Check specific transaction hash for user
   */
  static async checkUserTransactionHash(transactionHash: string, userPan?: string) {
    try {
      const txRecord = await prisma.transactionHashRegistry.findUnique({
        where: { transactionHash }
      });

      if (!txRecord) {
        return {
          found: false,
          isValid: false,
          message: "Transaction hash not found in our records",
          evidence: null
        };
      }

      // Get related KYC record
      const kycRecord = await prisma.kYCRecord.findUnique({
        where: { id: txRecord.kycRecordId },
        select: {
          pan: true,
          name: true,
          status: true,
          createdAt: true,
          documents: {
            select: {
              documentHash: true,
              type: true,
              fileName: true
            }
          }
        }
      });

      // Check if user is authorized to view this transaction
      const isAuthorized = !userPan || kycRecord?.pan === userPan;

      if (!isAuthorized) {
        return {
          found: true,
          isValid: false,
          message: "You are not authorized to view this transaction",
          evidence: null
        };
      }

      // Verify document hashes match
      const storedHashes = txRecord.documentHashes as string[];
      const actualHashes = kycRecord?.documents.map(doc => doc.documentHash) || [];
      const hashesMatch = this.compareArrays(storedHashes, actualHashes);

      return {
        found: true,
        isValid: hashesMatch && txRecord.isVerified,
        isConfirmed: txRecord.isConfirmed,
        confirmations: txRecord.confirmations,
        blockNumber: txRecord.blockNumber,
        submittedAt: txRecord.submittedAt,
        kycRecord: isAuthorized ? {
          name: kycRecord?.name,
          status: kycRecord?.status,
          createdAt: kycRecord?.createdAt,
          documentCount: kycRecord?.documents.length
        } : null,
        hashVerification: {
          hashesMatch,
          storedHashCount: storedHashes.length,
          actualHashCount: actualHashes.length
        },
        message: hashesMatch ? "Transaction verified successfully" : "Transaction hash verification failed - content mismatch detected",
        evidence: {
          contentHash: txRecord.contentHash,
          lastVerified: txRecord.verifiedAt
        }
      };

    } catch (error) {
      console.error("❌ Error checking transaction hash:", error);
      throw new Error(`Transaction hash check failed: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  // Helper methods
  private static async createForgeryReport(data: any) {
    return await prisma.forgeryReport.create({ data });
  }

  private static async logAuditEvent(data: any) {
    return await prisma.auditLog.create({ data });
  }

  private static compareArrays(arr1: string[], arr2: string[]): boolean {
    if (arr1.length !== arr2.length) return false;
    const sorted1 = [...arr1].sort();
    const sorted2 = [...arr2].sort();
    return sorted1.every((val, idx) => val === sorted2[idx]);
  }

  private static findCommonElements(arr1: string[], arr2: string[]): string[] {
    return arr1.filter(item => arr2.includes(item));
  }

  private static generateContentHash(documentHashes: string[]): string {
    const combined = [...documentHashes].sort().join("");
    return crypto.createHash("sha256").update(combined).digest("hex");
  }
}