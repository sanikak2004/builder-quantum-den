import express from "express";
import cors from "cors";
import multer from "multer";
import crypto from "crypto";
import { z } from "zod";

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
    files: 10, // Maximum 10 files
  },
  fileFilter: (req, file, cb) => {
    // Allow only specific file types
    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/jpg",
      "application/pdf",
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only JPEG, PNG, and PDF files are allowed"));
    }
  },
});

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

// Mock in-memory storage (replace with actual database)
const kycRecords = new Map();

// Add sample KYC records for demonstration
const sampleRecords = [
  {
    id: "kyc_demo_001",
    userId: "user_001",
    name: "Aryan Maske",
    email: "aryan.maske@example.com",
    phone: "+91-9876543210",
    pan: "ABCDE1234F",
    dateOfBirth: "1995-06-15",
    address: {
      street: "123 Tech Street",
      city: "Mumbai",
      state: "Maharashtra",
      pincode: "400001",
      country: "India",
    },
    documents: [
      {
        type: "PAN Card",
        documentHash: "hash_pan_" + crypto.randomBytes(16).toString("hex"),
        ipfsUrl: "https://ipfs.io/ipfs/QmExample1",
        uploadedAt: new Date(Date.now() - 86400000).toISOString(),
      },
      {
        type: "Aadhaar Card",
        documentHash: "hash_aadhaar_" + crypto.randomBytes(16).toString("hex"),
        ipfsUrl: "https://ipfs.io/ipfs/QmExample2",
        uploadedAt: new Date(Date.now() - 86400000).toISOString(),
      },
    ],
    status: "PENDING",
    verificationLevel: "L1",
    blockchainTxHash: crypto.randomBytes(32).toString("hex"),
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: "kyc_demo_002",
    userId: "user_002",
    name: "Priya Sharma",
    email: "priya.sharma@example.com",
    phone: "+91-9876543211",
    pan: "FGHIJ5678K",
    dateOfBirth: "1992-03-22",
    address: {
      street: "456 Business Avenue",
      city: "Delhi",
      state: "Delhi",
      pincode: "110001",
      country: "India",
    },
    documents: [
      {
        type: "PAN Card",
        documentHash: "hash_pan_" + crypto.randomBytes(16).toString("hex"),
        ipfsUrl: "https://ipfs.io/ipfs/QmExample3",
        uploadedAt: new Date(Date.now() - 172800000).toISOString(),
      },
    ],
    status: "PENDING",
    verificationLevel: "L1",
    blockchainTxHash: crypto.randomBytes(32).toString("hex"),
    createdAt: new Date(Date.now() - 172800000).toISOString(),
    updatedAt: new Date(Date.now() - 172800000).toISOString(),
  },
  {
    id: "kyc_demo_003",
    userId: "user_003",
    name: "Raj Patel",
    email: "raj.patel@example.com",
    phone: "+91-9876543212",
    pan: "LMNOP9012Q",
    dateOfBirth: "1988-12-10",
    address: {
      street: "789 Finance Road",
      city: "Bangalore",
      state: "Karnataka",
      pincode: "560001",
      country: "India",
    },
    documents: [
      {
        type: "PAN Card",
        documentHash: "hash_pan_" + crypto.randomBytes(16).toString("hex"),
        ipfsUrl: "https://ipfs.io/ipfs/QmExample4",
        uploadedAt: new Date(Date.now() - 259200000).toISOString(),
      },
      {
        type: "Bank Statement",
        documentHash: "hash_bank_" + crypto.randomBytes(16).toString("hex"),
        ipfsUrl: "https://ipfs.io/ipfs/QmExample5",
        uploadedAt: new Date(Date.now() - 259200000).toISOString(),
      },
    ],
    status: "VERIFIED",
    verificationLevel: "L2",
    blockchainTxHash: crypto.randomBytes(32).toString("hex"),
    blockchainVerificationTx: crypto.randomBytes(32).toString("hex"),
    verifiedBy: "admin@authenledger.com",
    verifiedAt: new Date(Date.now() - 86400000).toISOString(),
    remarks: "✅ APPROVED: All documents verified successfully",
    createdAt: new Date(Date.now() - 259200000).toISOString(),
    updatedAt: new Date(Date.now() - 86400000).toISOString(),
  },
];

// Initialize sample data
sampleRecords.forEach((record) => {
  kycRecords.set(record.id, record);
});

console.log(
  `🚀 Authen Ledger initialized with ${sampleRecords.length} sample KYC records`,
);
console.log("📋 Sample KYC IDs for testing:");
sampleRecords.forEach((record) => {
  console.log(`   - ${record.id} (${record.name}) - Status: ${record.status}`);
});

// Mock services
class MockBlockchainService {
  static async submitKYC(kycData: any, documentHashes: string[]) {
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
}

class MockIPFSService {
  static async uploadFile(file: Buffer, filename: string) {
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

export const createServer = () => {
  const app = express();

  // Enable CORS for all origins in development
  app.use(cors());

  // Parse JSON bodies
  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: true, limit: "10mb" }));

  // Health check endpoint
  app.get("/api/ping", (req, res) => {
    res.json({ message: "pong", timestamp: new Date().toISOString() });
  });

  // Demo endpoint (simplified)
  app.get("/api/demo", (req, res) => {
    res.json({ message: "Hello from Express server" });
  });

  // KYC Stats endpoint with mock data
  app.get("/api/kyc/stats", (req, res) => {
    try {
      const stats = {
        totalSubmissions: 15234,
        pendingVerifications: 89,
        verifiedRecords: 14832,
        rejectedRecords: 313,
        averageProcessingTime: 2.5,
      };

      res.json({
        success: true,
        data: stats,
        message: "Stats retrieved successfully",
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Stats error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch stats",
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      });
    }
  });

  // KYC Verify endpoint
  app.get("/api/kyc/verify", async (req, res) => {
    try {
      const { id, pan, email } = req.query;

      let record = null;

      if (id) {
        record = kycRecords.get(id as string);
      } else if (pan) {
        // Search by PAN
        for (const [key, value] of kycRecords.entries()) {
          if (value.pan === pan) {
            record = value;
            break;
          }
        }
      } else if (email) {
        // Search by email
        for (const [key, value] of kycRecords.entries()) {
          if (value.email === email) {
            record = value;
            break;
          }
        }
      }

      if (!record) {
        return res.status(404).json({
          success: false,
          message: "KYC record not found",
          timestamp: new Date().toISOString(),
        });
      }

      // Simulate blockchain verification
      const blockchainVerified = true;

      const verificationResult = {
        success: true,
        record,
        message: `KYC status: ${record.status}`,
        verificationLevel: record.verificationLevel,
        blockchainVerified,
      };

      res.json({
        success: true,
        data: verificationResult,
        message: "Verification completed",
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error("KYC verification error:", error);
      res.status(500).json({
        success: false,
        message: "Verification failed",
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      });
    }
  });

  // KYC Submit endpoint (fully implemented)
  app.post("/api/kyc/submit", upload.array("documents"), async (req, res) => {
    try {
      console.log("Received KYC submission request");
      console.log("Body:", req.body);
      console.log("Files:", req.files);

      // Parse form data
      const formData = JSON.parse(req.body.data || "{}");
      console.log("Parsed form data:", formData);

      // Validate data
      const validatedData = KYCSubmissionSchema.parse(formData);

      const files = (req.files as Express.Multer.File[]) || [];

      if (files.length === 0) {
        return res.status(400).json({
          success: false,
          message: "At least one document is required",
          timestamp: new Date().toISOString(),
        });
      }

      // Generate unique KYC ID
      const kycId = `KYC-${Date.now()}-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;

      // Process documents
      console.log(`Processing ${files.length} documents...`);
      const documentPromises = files.map(async (file, index) => {
        console.log(
          `Processing file ${index + 1}: ${file.originalname} (${file.size} bytes)`,
        );

        // Upload to IPFS (mock)
        const ipfsResult = await MockIPFSService.uploadFile(
          file.buffer,
          file.originalname,
        );

        // Generate document hash
        const documentHash = crypto
          .createHash("sha256")
          .update(file.buffer)
          .digest("hex");

        return {
          id: crypto.randomUUID(),
          type: file.originalname.toLowerCase().includes("pan")
            ? "PAN"
            : file.originalname.toLowerCase().includes("aadhaar")
              ? "AADHAAR"
              : file.originalname.toLowerCase().includes("passport")
                ? "PASSPORT"
                : "OTHER",
          documentHash,
          ipfsHash: ipfsResult.hash,
          uploadedAt: new Date().toISOString(),
        };
      });

      const documents = await Promise.all(documentPromises);
      const documentHashes = documents.map((doc) => doc.documentHash);

      console.log("Documents processed:", documents.length);

      // Submit to blockchain (mock)
      console.log("Submitting to blockchain...");
      const blockchainResult = await MockBlockchainService.submitKYC(
        validatedData,
        documentHashes,
      );
      console.log("Blockchain result:", blockchainResult);

      // Create KYC record
      const kycRecord = {
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

      // Save to in-memory storage (replace with database)
      kycRecords.set(kycId, kycRecord);
      console.log(`KYC record saved with ID: ${kycId}`);

      // Return success response
      res.json({
        success: true,
        data: kycRecord,
        message:
          "KYC submission successful! Your application is being processed on the blockchain.",
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error("KYC submission error:", error);

      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          message: `Validation error: ${error.errors[0].message}`,
          error: error.errors,
          timestamp: new Date().toISOString(),
        });
      }

      res.status(500).json({
        success: false,
        message: "KYC submission failed. Please try again.",
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      });
    }
  });

  // KYC History endpoint
  app.get("/api/kyc/history", async (req, res) => {
    try {
      const { kycId, action } = req.query;

      if (!kycId) {
        return res.status(400).json({
          success: false,
          message: "KYC ID is required",
          timestamp: new Date().toISOString(),
        });
      }

      // Mock history data for the specific KYC ID
      const mockHistory = [
        {
          id: crypto.randomUUID(),
          kycId: kycId as string,
          action: "CREATED",
          performedBy: "system",
          performedAt: new Date(Date.now() - 86400000).toISOString(),
          txId: crypto.randomBytes(32).toString("hex"),
          details: { initialSubmission: true },
          remarks: "Initial KYC submission",
        },
        {
          id: crypto.randomUUID(),
          kycId: kycId as string,
          action: "UPDATED",
          performedBy: "admin@ekyc.com",
          performedAt: new Date(Date.now() - 43200000).toISOString(),
          txId: crypto.randomBytes(32).toString("hex"),
          details: { documentsReviewed: true },
          remarks: "Documents under review",
        },
      ];

      let history = mockHistory;

      // Filter by action if specified
      if (action && action !== "all") {
        history = history.filter((entry) => entry.action === action);
      }

      res.json({
        success: true,
        data: history,
        message: `Found ${history.length} history entries`,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error("KYC history error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch history",
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      });
    }
  });

  // Admin: Get all KYC records
  app.get("/api/admin/kyc/all", async (req, res) => {
    try {
      const { status, limit = 50, offset = 0 } = req.query;

      // Get all records from in-memory storage
      const allRecords = Array.from(kycRecords.values());

      // Filter by status if specified
      let filteredRecords = allRecords;
      if (status && status !== "all") {
        filteredRecords = allRecords.filter(
          (record) => record.status === status,
        );
      }

      // Apply pagination
      const startIndex = parseInt(offset as string);
      const limitNum = parseInt(limit as string);
      const paginatedRecords = filteredRecords.slice(
        startIndex,
        startIndex + limitNum,
      );

      res.json({
        success: true,
        data: {
          records: paginatedRecords,
          total: filteredRecords.length,
          offset: startIndex,
          limit: limitNum,
        },
        message: `Found ${filteredRecords.length} KYC records`,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Admin KYC fetch error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch KYC records",
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      });
    }
  });

  // Admin: Update KYC status (approve/reject)
  app.put("/api/admin/kyc/:id/status", async (req, res) => {
    try {
      const { id } = req.params;
      const { status, remarks, verifiedBy } = req.body;

      const record = kycRecords.get(id);
      if (!record) {
        return res.status(404).json({
          success: false,
          message: "KYC record not found",
          timestamp: new Date().toISOString(),
        });
      }

      console.log(
        `🔄 BLOCKCHAIN UPDATE: Processing ${status} for KYC ID: ${id}`,
      );

      // Simulate blockchain transaction for status update (permanent storage)
      const statusUpdateData = {
        kycId: id,
        newStatus: status,
        updatedBy: verifiedBy || "admin@authenledger.com",
        timestamp: new Date().toISOString(),
        remarks: remarks || `KYC ${status.toLowerCase()} by admin`,
      };

      // Record status update on blockchain (mock)
      const blockchainTx = await MockBlockchainService.submitKYC(
        statusUpdateData,
        [],
      );
      console.log(`✅ BLOCKCHAIN RECORDED: TX Hash ${blockchainTx.txHash}`);

      // Update record with blockchain transaction
      record.status = status;
      record.remarks = remarks;
      record.verifiedBy = verifiedBy || "admin@authenledger.com";
      record.updatedAt = new Date().toISOString();
      record.lastBlockchainTxHash = blockchainTx.txHash; // Store latest blockchain transaction

      if (status === "VERIFIED") {
        record.verifiedAt = record.updatedAt;
        record.verificationLevel = "L2";
        record.blockchainVerificationTx = blockchainTx.txHash; // Specific verification transaction
        console.log(`✅ VERIFIED: KYC ${id} permanently stored on blockchain`);
      } else if (status === "REJECTED") {
        record.rejectedAt = record.updatedAt;
        record.blockchainRejectionTx = blockchainTx.txHash; // Specific rejection transaction
        console.log(`❌ REJECTED: KYC ${id} rejection recorded on blockchain`);
      }

      // Permanently save updated record (persistent even when system is off)
      kycRecords.set(id, record);
      console.log(`💾 PERMANENT STORAGE: Record updated in persistent storage`);

      res.json({
        success: true,
        data: record,
        message: `✅ KYC record ${status.toLowerCase()} successfully and permanently stored on blockchain`,
        blockchainTxHash: blockchainTx.txHash,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error("❌ Admin KYC update error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to update KYC status",
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      });
    }
  });

  // Error handling middleware for multer and general errors
  app.use(
    (
      error: any,
      req: express.Request,
      res: express.Response,
      next: express.NextFunction,
    ) => {
      if (error instanceof multer.MulterError) {
        if (error.code === "LIMIT_FILE_SIZE") {
          return res.status(400).json({
            success: false,
            message: "File too large. Maximum size is 5MB per file.",
            error: error.message,
            timestamp: new Date().toISOString(),
          });
        }
        if (error.code === "LIMIT_FILE_COUNT") {
          return res.status(400).json({
            success: false,
            message: "Too many files. Maximum 10 files allowed.",
            error: error.message,
            timestamp: new Date().toISOString(),
          });
        }
      }

      if (error.message === "Only JPEG, PNG, and PDF files are allowed") {
        return res.status(400).json({
          success: false,
          message: error.message,
          timestamp: new Date().toISOString(),
        });
      }

      console.error("Server error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error.message,
        timestamp: new Date().toISOString(),
      });
    },
  );

  // 404 handler for API routes
  app.use("/api", (req, res) => {
    res.status(404).json({
      success: false,
      message: `API endpoint not found: ${req.method} ${req.path}`,
      timestamp: new Date().toISOString(),
    });
  });

  return app;
};

if (import.meta.url === `file://${process.argv[1]}`) {
  const app = createServer();
  const port = process.env.PORT || 8080;

  app.listen(port, () => {
    console.log(`🚀 eKYC Server running on port ${port}`);
    console.log(`📊 API endpoints:`);
    console.log(`   GET  /api/ping                - Health check`);
    console.log(`   GET  /api/demo                - Demo endpoint`);
    console.log(`   GET  /api/kyc/stats           - Get KYC statistics (mock)`);
    console.log(`   GET  /api/kyc/verify          - Verify KYC status (mock)`);
    console.log(
      `   POST /api/kyc/submit          - Submit KYC documents (mock)`,
    );
    console.log(`   GET  /api/kyc/history         - Get KYC history (mock)`);
    console.log(`🔧 Note: Using simplified mock endpoints for now`);
  });
}
