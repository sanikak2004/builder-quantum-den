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
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only JPEG, PNG, and PDF files are allowed'));
    }
  },
});

// Validation schemas
const KYCSubmissionSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Valid email is required"),
  phone: z.string().min(10, "Valid phone number is required"),
  pan: z.string().regex(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, "Valid PAN format required"),
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

// Mock services
class MockBlockchainService {
  static async submitKYC(kycData: any, documentHashes: string[]) {
    // Simulate blockchain transaction
    await new Promise(resolve => setTimeout(resolve, 1000));

    const txHash = crypto.randomBytes(32).toString('hex');
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
    await new Promise(resolve => setTimeout(resolve, 500));

    const hash = crypto.createHash('sha256').update(file).digest('hex');
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

  // KYC Verify endpoint (mock)
  app.get("/api/kyc/verify", (req, res) => {
    res.json({
      success: false,
      message: "KYC verification not implemented yet",
      timestamp: new Date().toISOString(),
    });
  });

  // KYC Submit endpoint (mock)
  app.post("/api/kyc/submit", (req, res) => {
    res.json({
      success: false,
      message: "KYC submission not implemented yet",
      timestamp: new Date().toISOString(),
    });
  });

  // KYC History endpoint (mock)
  app.get("/api/kyc/history", (req, res) => {
    res.json({
      success: false,
      message: "KYC history not implemented yet",
      timestamp: new Date().toISOString(),
    });
  });

  // Basic error handling
  app.use(
    (
      error: any,
      req: express.Request,
      res: express.Response,
      next: express.NextFunction,
    ) => {
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
