import crypto from "crypto";
import { prisma } from "../database/prisma";
import { KYCRecord, Document } from "@prisma/client";

export interface HashVerificationResult {
  isValid: boolean;
  isDuplicate: boolean;
  documentId?: string;
  duplicateCount: number;
  previousSubmissions: string[];
  forgeryDetected: boolean;
  forgeryType?: string;
  message: string;
}

export interface TransactionVerificationResult {
  found: boolean;
  isValid: boolean;
  isConfirmed?: boolean;
  confirmations?: number;
  blockNumber?: number;
  submittedAt?: Date;
  kycRecord?: any;
  hashVerification?: any;
  message: string;
  evidence?: any;
}

export class HashVerificationService {
  /**
   * Verify document hash and detect duplicates
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
      
      // Check for existing documents with the same hash
      const existingDocuments = await prisma.document.findMany({
        where: { documentHash },
        include: {
          kycRecord: {
            select: {
              userId: true,
              name: true,
              email: true,
              status: true,
              createdAt: true
            }
          }
        }
      });

      const isDuplicate = existingDocuments.length > 0;
      const duplicateCount = existingDocuments.length;
      
      if (isDuplicate) {
        console.log(`⚠️ Duplicate document detected! Found ${duplicateCount} existing submissions`);
        
        // Check if it's from different users (potential forgery)
        const uniqueUsers = new Set(existingDocuments.map(doc => doc.kycRecord.userId));
        const forgeryDetected = uniqueUsers.size > 1;
        
        // Create audit log for duplicate detection
        await prisma.auditLog.create({
          data: {
            kycRecordId,
            userId: submittedBy,
            action: "DOCUMENT_UPLOADED",
            performedBy: submittedBy,
            details: {
              duplicateDetected: true,
              duplicateCount,
              forgeryDetected,
              documentHash: documentHash.substring(0, 16) + "...",
              fileName,
              fileSize,
              existingSubmissions: existingDocuments.map(doc => ({
                userId: doc.kycRecord.userId,
                submittedAt: doc.uploadedAt,
                status: doc.kycRecord.status
              }))
            },
            remarks: forgeryDetected 
              ? `Potential forgery detected: Same document submitted by ${uniqueUsers.size} different users`
              : `Duplicate document detected from same user`
          }
        });

        return {
          isValid: !forgeryDetected,
          isDuplicate: true,
          duplicateCount,
          previousSubmissions: existingDocuments.map(doc => doc.kycRecord.email),
          forgeryDetected,
          forgeryType: forgeryDetected ? "DUPLICATE_SUBMISSION" : undefined,
          message: forgeryDetected 
            ? `FORGERY DETECTED: This document has been submitted by ${uniqueUsers.size} different users`
            : `Document already exists in the system (${duplicateCount} previous submissions)`
        };
      }

      console.log(`✅ Document hash verified - no duplicates found`);
      return {
        isValid: true,
        isDuplicate: false,
        duplicateCount: 0,
        previousSubmissions: [],
        forgeryDetected: false,
        message: "Document hash verified successfully"
      };

    } catch (error) {
      console.error("❌ Error verifying document hash:", error);
      throw new Error(`Hash verification failed: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  /**
   * Store transaction hash for verification
   */
  static async storeTransactionHash(
    transactionHash: string,
    kycRecordId: string,
    associatedUserId: string,
    documentHashes: string[],
    blockchainNetwork: string = "local"
  ): Promise<void> {
    try {
      console.log(`💾 Storing transaction hash: ${transactionHash.substring(0, 16)}...`);
      
      // Check if KYC record exists before creating audit log
      const kycRecordExists = await prisma.kYCRecord.findUnique({
        where: { id: kycRecordId }
      });
      
      // Only create audit log if KYC record exists
      if (kycRecordExists) {
        await prisma.auditLog.create({
          data: {
            kycRecordId,
            userId: associatedUserId,
            action: "BLOCKCHAIN_TRANSACTION",
            performedBy: "system",
            txId: transactionHash,
            details: {
              transactionHash,
              documentHashCount: documentHashes.length,
              blockchainNetwork,
              timestamp: new Date().toISOString()
            },
            remarks: `Transaction hash stored for blockchain verification`
          }
        });
      } else {
        // If KYC record doesn't exist, store in TransactionHashRegistry instead
        await prisma.transactionHashRegistry.create({
          data: {
            transactionHash,
            kycRecordId,
            documentHashes: documentHashes,
            contentHash: documentHashes.join(''), // Simple content hash
            submittedBy: associatedUserId,
            isVerified: true
          }
        });
      }

      console.log(`✅ Transaction hash stored successfully`);
    } catch (error) {
      console.error("❌ Error storing transaction hash:", error);
      throw new Error(`Failed to store transaction hash: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  /**
   * Check user transaction hash
   */
  static async checkUserTransactionHash(transactionHash: string, userPan?: string): Promise<TransactionVerificationResult> {
    try {
      console.log(`🔍 Checking transaction hash: ${transactionHash.substring(0, 16)}...`);
      
      // First, check in audit logs
      let auditLog = await prisma.auditLog.findFirst({
        where: { 
          txId: transactionHash,
          action: "BLOCKCHAIN_TRANSACTION"
        },
        include: {
          kycRecord: {
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
          }
        }
      });

      // If not found in audit logs, check in transaction hash registry
      let txRecord = null;
      let txKycRecord = null;
      if (!auditLog) {
        txRecord = await prisma.transactionHashRegistry.findUnique({
          where: { transactionHash }
        });
        
        // If found in registry, get the associated KYC record
        if (txRecord) {
          txKycRecord = await prisma.kYCRecord.findUnique({
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
        }
      }

      if (!auditLog && !txRecord) {
        return {
          found: false,
          isValid: false,
          message: "Transaction hash not found in our records",
          evidence: null
        };
      }

      // Use data from either source
      const recordData = auditLog ? auditLog.kycRecord : txKycRecord;
      const performedAt = auditLog ? auditLog.performedAt : txRecord?.submittedAt;
      const txId = auditLog ? auditLog.txId : txRecord?.transactionHash;
      const details = auditLog ? auditLog.details : {
        transactionHash: txRecord?.transactionHash,
        documentHashCount: txRecord?.documentHashes?.length || 0,
        blockchainNetwork: "local",
        timestamp: txRecord?.submittedAt?.toISOString()
      };

      // Check if user is authorized to view this transaction
      const isAuthorized = !userPan || recordData?.pan === userPan;

      if (!isAuthorized) {
        return {
          found: true,
          isValid: false,
          message: "You are not authorized to view this transaction",
          evidence: null
        };
      }

      return {
        found: true,
        isValid: true,
        isConfirmed: true,
        submittedAt: performedAt || new Date(),
        kycRecord: isAuthorized ? {
          name: recordData?.name,
          status: recordData?.status,
          createdAt: recordData?.createdAt,
          documentCount: recordData?.documents?.length || 0
        } : null,
        message: "Transaction verified successfully",
        evidence: {
          txId: txId,
          performedAt: performedAt,
          details: details
        }
      };

    } catch (error) {
      console.error("❌ Error checking transaction hash:", error);
      throw new Error(`Transaction hash check failed: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  /**
   * Get basic forgery statistics from audit logs
   */
  static async getForgeryStats() {
    try {
      const duplicateSubmissions = await prisma.auditLog.count({
        where: {
          action: "DOCUMENT_UPLOADED",
          details: {
            path: ["duplicateDetected"],
            equals: true
          }
        }
      });

      const forgeryDetected = await prisma.auditLog.count({
        where: {
          action: "DOCUMENT_UPLOADED",
          details: {
            path: ["forgeryDetected"],
            equals: true
          }
        }
      });

      return {
        totalForgeryReports: forgeryDetected,
        duplicateSubmissions,
        averageThreatLevel: forgeryDetected > 0 ? "HIGH" : "LOW",
        investigationsOpen: 0,
        investigationsResolved: forgeryDetected
      };
    } catch (error) {
      console.error("Error getting forgery stats:", error);
      return {
        totalForgeryReports: 0,
        duplicateSubmissions: 0,
        averageThreatLevel: "LOW",
        investigationsOpen: 0,
        investigationsResolved: 0
      };
    }
  }

  /**
   * Get recent forgery reports from audit logs
   */
  static async getRecentForgeryReports(limit: number = 20) {
    try {
      const reports = await prisma.auditLog.findMany({
        where: {
          action: "DOCUMENT_UPLOADED",
          details: {
            path: ["forgeryDetected"],
            equals: true
          }
        },
        include: {
          kycRecord: {
            select: {
              name: true,
              email: true,
              pan: true
            }
          }
        },
        orderBy: { performedAt: "desc" },
        take: limit
      });

      return reports.map(report => ({
        id: report.id,
        reportType: "DUPLICATE_SUBMISSION",
        description: report.remarks || "Duplicate document submission detected",
        severity: "HIGH",
        affectedUser: {
          name: report.kycRecord?.name,
          email: report.kycRecord?.email,
          pan: report.kycRecord?.pan
        },
        detectionMethod: "AUTOMATIC",
        investigationStatus: "RESOLVED",
        createdAt: report.performedAt.toISOString(),
        evidenceData: report.details
      }));
    } catch (error) {
      console.error("Error getting forgery reports:", error);
      return [];
    }
  }
}

export default HashVerificationService;