import { RequestHandler } from "express";
import {
  KYCRecord,
  KYCVerificationResponse,
  KYCHistoryEntry,
  KYCStats,
  ApiResponse,
  BlockchainTxResponse,
  IPFSUploadResponse,
} from "@shared/api";
import { z } from "zod";
import crypto from "crypto";

// Validation schemas
const KYCSubmissionSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Valid email is required"),
  phone: z.string().min(10, "Valid phone number is required"),
  pan: z
    .string()
    .regex(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, "Valid PAN format required"),
  dateOfBirth: z.string().min(1, "Date of birth is required"),
  address: z.object({
    street: z.string().min(1, "Street address is required"),
    city: z.string().min(1, "City is required"),
    state: z.string().min(1, "State is required"),
    pincode: z.string().min(6, "Valid pincode is required"),
    country: z.string().min(1, "Country is required"),
  }),
});

// Mock blockchain connection (replace with actual Hyperledger Fabric SDK)
class MockBlockchainService {
  async submitKYC(
    kycData: any,
    documentHashes: string[],
  ): Promise<BlockchainTxResponse> {
    // Simulate blockchain transaction
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const txHash = crypto.randomBytes(32).toString("hex");
    return {
      success: true,
      txHash,
      blockNumber: Math.floor(Math.random() * 1000000),
      gasUsed: Math.floor(Math.random() * 100000),
      message: "KYC record successfully recorded on blockchain",
    };
  }

  async verifyKYC(
    kycId: string,
  ): Promise<{ verified: boolean; txHash?: string }> {
    // Simulate blockchain verification
    await new Promise((resolve) => setTimeout(resolve, 500));

    return {
      verified: true,
      txHash: crypto.randomBytes(32).toString("hex"),
    };
  }

  async getKYCHistory(kycId: string): Promise<KYCHistoryEntry[]> {
    // Mock history data
    const mockHistory: KYCHistoryEntry[] = [
      {
        id: crypto.randomUUID(),
        kycId,
        action: "CREATED",
        performedBy: "system",
        performedAt: new Date(Date.now() - 86400000).toISOString(),
        blockchainTxHash: crypto.randomBytes(32).toString("hex"),
        details: { initialSubmission: true },
        remarks: "Initial KYC submission",
      },
      {
        id: crypto.randomUUID(),
        kycId,
        action: "VERIFIED",
        performedBy: "verifier@system.com",
        performedAt: new Date().toISOString(),
        blockchainTxHash: crypto.randomBytes(32).toString("hex"),
        details: { verificationLevel: "L2", automated: true },
        remarks: "Automated verification completed",
      },
    ];

    return mockHistory;
  }
}

// Mock IPFS service (replace with actual IPFS integration)
class MockIPFSService {
  async uploadFile(
    file: Buffer,
    filename: string,
  ): Promise<IPFSUploadResponse> {
    // Simulate IPFS upload
    await new Promise((resolve) => setTimeout(resolve, 500));

    const hash = crypto.createHash("sha256").update(file).digest("hex");
    return {
      success: true,
      hash: `Qm${hash.substring(0, 44)}`, // IPFS-style hash
      url: `https://ipfs.io/ipfs/Qm${hash.substring(0, 44)}`,
      size: file.length,
    };
  }
}

// Mock database (replace with actual database)
class MockDatabase {
  private static records: Map<string, KYCRecord> = new Map();
  private static stats: KYCStats = {
    totalSubmissions: 15234,
    pendingVerifications: 89,
    verifiedRecords: 14832,
    rejectedRecords: 313,
    averageProcessingTime: 2.5,
  };

  static async saveRecord(record: KYCRecord): Promise<void> {
    this.records.set(record.id, record);
    this.stats.totalSubmissions++;
  }

  static async getRecord(id: string): Promise<KYCRecord | null> {
    return this.records.get(id) || null;
  }

  static async findByPAN(pan: string): Promise<KYCRecord | null> {
    for (const record of this.records.values()) {
      if (record.pan === pan) return record;
    }
    return null;
  }

  static async findByEmail(email: string): Promise<KYCRecord | null> {
    for (const record of this.records.values()) {
      if (record.email === email) return record;
    }
    return null;
  }

  static async getStats(): Promise<KYCStats> {
    return this.stats;
  }
}

const blockchainService = new MockBlockchainService();
const ipfsService = new MockIPFSService();

// KYC Submission Handler
export const handleKYCSubmission: RequestHandler = async (req, res) => {
  try {
    const formData = JSON.parse(req.body.data);
    const validatedData = KYCSubmissionSchema.parse(formData);

    const files = (req.files as Express.Multer.File[]) || [];

    if (files.length === 0) {
      const response: ApiResponse = {
        success: false,
        message: "At least one document is required",
        timestamp: new Date().toISOString(),
      };
      return res.status(400).json(response);
    }

    // Generate unique KYC ID
    const kycId = `KYC-${Date.now()}-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;

    // Upload documents to IPFS and generate hashes
    const documentPromises = files.map(async (file) => {
      const ipfsResult = await ipfsService.uploadFile(
        file.buffer,
        file.originalname,
      );
      const documentHash = crypto
        .createHash("sha256")
        .update(file.buffer)
        .digest("hex");

      return {
        id: crypto.randomUUID(),
        type: "PAN" as const, // In real implementation, detect document type
        documentHash,
        ipfsHash: ipfsResult.hash,
        uploadedAt: new Date().toISOString(),
      };
    });

    const documents = await Promise.all(documentPromises);
    const documentHashes = documents.map((doc) => doc.documentHash);

    // Submit to blockchain
    const blockchainResult = await blockchainService.submitKYC(
      validatedData,
      documentHashes,
    );

    // Create KYC record
    const kycRecord: KYCRecord = {
      id: kycId,
      userId: crypto.randomUUID(), // In real implementation, get from authenticated user
      ...validatedData,
      documents,
      status: "PENDING",
      verificationLevel: "L1",
      blockchainTxHash: blockchainResult.txHash,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Save to database
    await MockDatabase.saveRecord(kycRecord);

    const response: ApiResponse<KYCRecord> = {
      success: true,
      data: kycRecord,
      message: "KYC submission successful",
      timestamp: new Date().toISOString(),
    };

    res.json(response);
  } catch (error) {
    console.error("KYC submission error:", error);

    const response: ApiResponse = {
      success: false,
      message:
        error instanceof z.ZodError
          ? error.errors[0].message
          : "Submission failed",
      error: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date().toISOString(),
    };

    res.status(500).json(response);
  }
};

// KYC Verification Handler
export const handleKYCVerification: RequestHandler = async (req, res) => {
  try {
    const { id, pan, email } = req.query;

    let record: KYCRecord | null = null;

    if (id) {
      record = await MockDatabase.getRecord(id as string);
    } else if (pan) {
      record = await MockDatabase.findByPAN(pan as string);
    } else if (email) {
      record = await MockDatabase.findByEmail(email as string);
    }

    if (!record) {
      const response: ApiResponse<KYCVerificationResponse> = {
        success: false,
        message: "KYC record not found",
        timestamp: new Date().toISOString(),
      };
      return res.status(404).json(response);
    }

    // Verify on blockchain
    const blockchainVerification = await blockchainService.verifyKYC(record.id);

    const verificationResult: KYCVerificationResponse = {
      success: true,
      record,
      message: `KYC status: ${record.status}`,
      verificationLevel: record.verificationLevel,
      blockchainVerified: blockchainVerification.verified,
    };

    const response: ApiResponse<KYCVerificationResponse> = {
      success: true,
      data: verificationResult,
      message: "Verification completed",
      timestamp: new Date().toISOString(),
    };

    res.json(response);
  } catch (error) {
    console.error("KYC verification error:", error);

    const response: ApiResponse = {
      success: false,
      message: "Verification failed",
      error: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date().toISOString(),
    };

    res.status(500).json(response);
  }
};

// KYC History Handler
export const handleKYCHistory: RequestHandler = async (req, res) => {
  try {
    const { kycId, action } = req.query;

    if (!kycId) {
      const response: ApiResponse = {
        success: false,
        message: "KYC ID is required",
        timestamp: new Date().toISOString(),
      };
      return res.status(400).json(response);
    }

    // Get history from blockchain
    let history = await blockchainService.getKYCHistory(kycId as string);

    // Filter by action if specified
    if (action && action !== "all") {
      history = history.filter((entry) => entry.action === action);
    }

    // Sort by date (newest first)
    history.sort(
      (a, b) =>
        new Date(b.performedAt).getTime() - new Date(a.performedAt).getTime(),
    );

    const response: ApiResponse<KYCHistoryEntry[]> = {
      success: true,
      data: history,
      message: `Found ${history.length} history entries`,
      timestamp: new Date().toISOString(),
    };

    res.json(response);
  } catch (error) {
    console.error("KYC history error:", error);

    const response: ApiResponse = {
      success: false,
      message: "Failed to fetch history",
      error: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date().toISOString(),
    };

    res.status(500).json(response);
  }
};

// KYC Stats Handler
export const handleKYCStats: RequestHandler = async (req, res) => {
  try {
    const stats = await MockDatabase.getStats();

    const response: ApiResponse<KYCStats> = {
      success: true,
      data: stats,
      message: "Stats retrieved successfully",
      timestamp: new Date().toISOString(),
    };

    res.json(response);
  } catch (error) {
    console.error("KYC stats error:", error);

    const response: ApiResponse = {
      success: false,
      message: "Failed to fetch stats",
      error: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date().toISOString(),
    };

    res.status(500).json(response);
  }
};
