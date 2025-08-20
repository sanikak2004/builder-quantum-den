import { RequestHandler } from "express";
import multer from "multer";
import { z } from "zod";
import crypto from "crypto";
import { kycService } from "../database/kyc-service";
import {
  ApiResponse,
  KYCRecord,
  KYCSubmissionRequest,
  KYCVerificationResponse,
} from "@shared/api";

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (
      file.mimetype === "application/pdf" ||
      file.mimetype.startsWith("image/")
    ) {
      cb(null, true);
    } else {
      cb(new Error("Only PDF and image files are allowed"), false);
    }
  },
});

// Validation schemas
const KYCSubmissionSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(10, "Phone number must be at least 10 digits"),
  pan: z
    .string()
    .regex(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, "Invalid PAN format"),
  dateOfBirth: z.string().min(1, "Date of birth is required"),
  address: z.object({
    street: z.string().min(1, "Street address is required"),
    city: z.string().min(1, "City is required"),
    state: z.string().min(1, "State is required"),
    pincode: z.string().min(1, "PIN code is required"),
    country: z.string().min(1, "Country is required"),
  }),
});

const KYCStatusUpdateSchema = z.object({
  status: z.enum(["VERIFIED", "REJECTED"]),
  remarks: z.string().min(1, "Remarks are required"),
  verifiedBy: z.string().min(1, "Verifier information is required"),
});

/**
 * Submit KYC Application
 * POST /api/kyc/submit
 */
export const submitKYC: RequestHandler[] = [
  upload.array("documents", 10),
  async (req, res) => {
    console.log("\n🚀 === KYC SUBMISSION STARTED ===");
    console.log(`📅 Timestamp: ${new Date().toISOString()}`);

    try {
      // Parse and validate form data
      const formData = JSON.parse(req.body.data);
      console.log(`👤 User: ${formData.name} (${formData.email})`);
      console.log(`🆔 PAN: ${formData.pan}`);

      const validatedData = KYCSubmissionSchema.parse(formData);
      const files = req.files as Express.Multer.File[];

      if (!files || files.length === 0) {
        console.log("❌ No documents uploaded");
        return res.status(400).json({
          success: false,
          message: "At least one document is required",
          timestamp: new Date().toISOString(),
        } as ApiResponse);
      }

      console.log(`📎 Documents uploaded: ${files.length}`);

      // Check for duplicate PAN
      console.log("🔍 Checking for duplicate PAN...");
      const existingRecord = await kycService.searchKYCRecord({
        pan: validatedData.pan,
      });

      if (existingRecord) {
        console.log(`❌ DUPLICATE PAN DETECTED: ${validatedData.pan}`);
        return res.status(409).json({
          success: false,
          message: `KYC record with PAN ${validatedData.pan} already exists. Each PAN can only be used once.`,
          error: "DUPLICATE_PAN",
          timestamp: new Date().toISOString(),
        } as ApiResponse);
      }

      // Generate unique KYC ID
      const kycId = `KYC_${Date.now()}_${crypto.randomBytes(4).toString("hex").toUpperCase()}`;
      console.log(`🆔 Generated KYC ID: ${kycId}`);

      // Process documents and generate hashes
      console.log("🔐 Processing documents and generating hashes...");
      const processedDocuments = files.map((file, index) => {
        const documentHash = crypto
          .createHash("sha256")
          .update(file.buffer)
          .digest("hex");
        const ipfsHash = `Qm${crypto.randomBytes(20).toString("hex")}`; // Mock IPFS hash
        const ipfsUrl = `https://ipfs.io/ipfs/${ipfsHash}`;

        console.log(`📄 Document ${index + 1}:`);
        console.log(`   - Type: ${file.originalname}`);
        console.log(`   - Size: ${(file.size / 1024 / 1024).toFixed(2)} MB`);
        console.log(`   - Hash: ${documentHash.substring(0, 16)}...`);
        console.log(`   - IPFS: ${ipfsHash.substring(0, 16)}...`);

        return {
          type: this.detectDocumentType(file.originalname),
          fileName: file.originalname,
          fileSize: file.size,
          documentHash,
          ipfsHash,
          ipfsUrl,
        };
      });

      // Mock blockchain transaction
      const blockchainTxHash = `0x${crypto.randomBytes(32).toString("hex")}`;
      console.log(`⛓️  Blockchain Transaction: ${blockchainTxHash.substring(0, 20)}...`);

      // Create KYC record in database
      console.log("💾 Storing KYC record in database...");
      const kycData = {
        id: kycId,
        ...validatedData,
      };

      const result = await kycService.createKYCRecord(
        kycData,
        processedDocuments,
        blockchainTxHash,
      );

      if (result.success) {
        console.log("✅ KYC record created successfully!");
        console.log(`📊 Record ID: ${result.data.id}`);
        console.log(`📊 Status: ${result.data.status}`);
        console.log(`📊 Documents: ${result.data.documents.length}`);
        console.log("🚀 === KYC SUBMISSION COMPLETED ===\n");

        res.status(201).json({
          success: true,
          data: result.data,
          message: "KYC submitted successfully",
          timestamp: new Date().toISOString(),
        } as ApiResponse<KYCRecord>);
      } else {
        throw new Error("Database operation failed");
      }
    } catch (error) {
      console.error("❌ KYC SUBMISSION FAILED:", error);
      console.log("🚀 === KYC SUBMISSION COMPLETED ===\n");

      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          message: "Validation failed",
          error: error.errors[0]?.message || "Invalid data",
          timestamp: new Date().toISOString(),
        } as ApiResponse);
      } else {
        res.status(500).json({
          success: false,
          message: "Internal server error",
          error: error instanceof Error ? error.message : "Unknown error",
          timestamp: new Date().toISOString(),
        } as ApiResponse);
      }
    }
  },
];

/**
 * Verify KYC Record
 * GET /api/kyc/verify
 */
export const verifyKYC: RequestHandler = async (req, res) => {
  console.log("\n🔍 === KYC VERIFICATION STARTED ===");
  console.log(`📅 Timestamp: ${new Date().toISOString()}`);

  try {
    const { id, pan, email } = req.query as {
      id?: string;
      pan?: string;
      email?: string;
    };

    console.log(`🔍 Search criteria:`, { id, pan, email });

    if (!id && !pan && !email) {
      return res.status(400).json({
        success: false,
        message: "Please provide KYC ID, PAN, or email for verification",
        timestamp: new Date().toISOString(),
      } as ApiResponse);
    }

    // Search for KYC record
    let record: any = null;
    if (id) {
      console.log(`🔍 Searching by KYC ID: ${id}`);
      record = await kycService.getKYCRecord(id);
    } else {
      console.log(`🔍 Searching by criteria:`, { pan, email });
      record = await kycService.searchKYCRecord({ pan, email });
    }

    if (!record) {
      console.log("❌ No KYC record found");
      console.log("🔍 === KYC VERIFICATION COMPLETED ===\n");
      return res.status(404).json({
        success: false,
        message: "No KYC record found with the provided criteria",
        timestamp: new Date().toISOString(),
      } as ApiResponse);
    }

    console.log(`✅ KYC record found: ${record.id}`);
    console.log(`📊 Status: ${record.status}`);
    console.log(`📊 Level: ${record.verificationLevel}`);
    console.log(`📊 Created: ${record.createdAt}`);

    const response: KYCVerificationResponse = {
      success: true,
      record,
      message: `KYC record found - Status: ${record.status}`,
      verificationLevel: record.verificationLevel,
      blockchainVerified: !!record.blockchainTxHash,
    };

    console.log("🔍 === KYC VERIFICATION COMPLETED ===\n");

    res.json({
      success: true,
      data: response,
      message: "Verification completed",
      timestamp: new Date().toISOString(),
    } as ApiResponse<KYCVerificationResponse>);
  } catch (error) {
    console.error("❌ KYC VERIFICATION FAILED:", error);
    console.log("🔍 === KYC VERIFICATION COMPLETED ===\n");

    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date().toISOString(),
    } as ApiResponse);
  }
};

/**
 * Get All KYC Records (Admin)
 * GET /api/admin/kyc/all
 */
export const getAllKYCRecords: RequestHandler = async (req, res) => {
  console.log("\n👑 === ADMIN: GET ALL KYC RECORDS ===");
  console.log(`📅 Timestamp: ${new Date().toISOString()}`);

  try {
    const { status, limit, offset } = req.query as {
      status?: string;
      limit?: string;
      offset?: string;
    };

    const filters = {
      status: status === "all" ? undefined : status,
      limit: limit ? parseInt(limit) : 50,
      offset: offset ? parseInt(offset) : 0,
    };

    console.log(`🔍 Filters:`, filters);

    const result = await kycService.getAllKYCRecords(filters);

    console.log(`📊 Found ${result.total} total records`);
    console.log(`📊 Returning ${result.records.length} records`);
    console.log("👑 === ADMIN: GET ALL KYC RECORDS COMPLETED ===\n");

    res.json({
      success: true,
      data: result,
      message: `Found ${result.total} KYC records`,
      timestamp: new Date().toISOString(),
    } as ApiResponse);
  } catch (error) {
    console.error("❌ ADMIN: GET ALL KYC RECORDS FAILED:", error);
    console.log("👑 === ADMIN: GET ALL KYC RECORDS COMPLETED ===\n");

    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date().toISOString(),
    } as ApiResponse);
  }
};

/**
 * Update KYC Status (Admin)
 * PUT /api/admin/kyc/:id/status
 */
export const updateKYCStatus: RequestHandler = async (req, res) => {
  console.log("\n👑 === ADMIN: UPDATE KYC STATUS ===");
  console.log(`📅 Timestamp: ${new Date().toISOString()}`);

  try {
    const { id } = req.params;
    const validatedData = KYCStatusUpdateSchema.parse(req.body);

    console.log(`🆔 KYC ID: ${id}`);
    console.log(`📊 New Status: ${validatedData.status}`);
    console.log(`👤 Verified By: ${validatedData.verifiedBy}`);
    console.log(`📝 Remarks: ${validatedData.remarks}`);

    // Check if record exists
    const existingRecord = await kycService.getKYCRecord(id);
    if (!existingRecord) {
      console.log("❌ KYC record not found");
      return res.status(404).json({
        success: false,
        message: "KYC record not found",
        timestamp: new Date().toISOString(),
      } as ApiResponse);
    }

    console.log(`📊 Current Status: ${existingRecord.status}`);

    // Generate blockchain transaction hash
    const blockchainTxHash = `0x${crypto.randomBytes(32).toString("hex")}`;
    console.log(`⛓️  Blockchain Transaction: ${blockchainTxHash.substring(0, 20)}...`);

    // Update status in database
    const result = await kycService.updateKYCStatus(
      id,
      validatedData.status,
      validatedData.remarks,
      validatedData.verifiedBy,
      blockchainTxHash,
    );

    if (result.success) {
      console.log("✅ KYC status updated successfully!");
      console.log(`📊 New Status: ${result.data.status}`);
      console.log(`📊 Updated At: ${result.data.updatedAt}`);
      console.log("👑 === ADMIN: UPDATE KYC STATUS COMPLETED ===\n");

      res.json({
        success: true,
        data: result.data,
        message: `KYC status updated to ${validatedData.status}`,
        timestamp: new Date().toISOString(),
      } as ApiResponse<KYCRecord>);
    } else {
      throw new Error("Database update failed");
    }
  } catch (error) {
    console.error("❌ ADMIN: UPDATE KYC STATUS FAILED:", error);
    console.log("👑 === ADMIN: UPDATE KYC STATUS COMPLETED ===\n");

    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        message: "Validation failed",
        error: error.errors[0]?.message || "Invalid data",
        timestamp: new Date().toISOString(),
      } as ApiResponse);
    } else {
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      } as ApiResponse);
    }
  }
};

/**
 * Get KYC History
 * GET /api/kyc/:id/history
 */
export const getKYCHistory: RequestHandler = async (req, res) => {
  console.log("\n📜 === GET KYC HISTORY ===");
  console.log(`📅 Timestamp: ${new Date().toISOString()}`);

  try {
    const { id } = req.params;
    const { action } = req.query as { action?: string };

    console.log(`🆔 KYC ID: ${id}`);
    console.log(`🔍 Filter Action: ${action || "all"}`);

    const history = await kycService.getKYCHistory(id, action);

    console.log(`📊 Found ${history.length} history entries`);
    console.log("📜 === GET KYC HISTORY COMPLETED ===\n");

    res.json({
      success: true,
      data: history,
      message: `Found ${history.length} history entries`,
      timestamp: new Date().toISOString(),
    } as ApiResponse);
  } catch (error) {
    console.error("❌ GET KYC HISTORY FAILED:", error);
    console.log("📜 === GET KYC HISTORY COMPLETED ===\n");

    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date().toISOString(),
    } as ApiResponse);
  }
};

/**
 * Get System Statistics
 * GET /api/admin/stats
 */
export const getSystemStats: RequestHandler = async (req, res) => {
  console.log("\n📊 === GET SYSTEM STATS ===");
  console.log(`📅 Timestamp: ${new Date().toISOString()}`);

  try {
    const stats = await kycService.getSystemStats();

    console.log(`📊 Stats retrieved:`, stats);
    console.log("📊 === GET SYSTEM STATS COMPLETED ===\n");

    res.json({
      success: true,
      data: stats,
      message: "System statistics retrieved",
      timestamp: new Date().toISOString(),
    } as ApiResponse);
  } catch (error) {
    console.error("❌ GET SYSTEM STATS FAILED:", error);
    console.log("📊 === GET SYSTEM STATS COMPLETED ===\n");

    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date().toISOString(),
    } as ApiResponse);
  }
};

// Helper function to detect document type from filename
function detectDocumentType(filename: string): string {
  const lower = filename.toLowerCase();
  if (lower.includes("pan")) return "PAN";
  if (lower.includes("aadhaar") || lower.includes("aadhar")) return "AADHAAR";
  if (lower.includes("passport")) return "PASSPORT";
  if (lower.includes("driving") || lower.includes("license")) return "DRIVING_LICENSE";
  if (lower.includes("voter")) return "VOTER_ID";
  if (lower.includes("bank") || lower.includes("statement")) return "BANK_STATEMENT";
  if (lower.includes("utility") || lower.includes("bill")) return "UTILITY_BILL";
  return "OTHER";
}
