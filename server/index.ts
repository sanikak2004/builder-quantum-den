import express from "express";
import cors from "cors";
import { handleDemo } from "./routes/demo";
import { 
  handleKYCSubmission, 
  handleKYCVerification, 
  handleKYCHistory, 
  handleKYCStats 
} from "./routes/kyc";
import multer from "multer";

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
    files: 10 // Maximum 10 files
  },
  fileFilter: (req, file, cb) => {
    // Allow only specific file types
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only JPEG, PNG, and PDF files are allowed'));
    }
  }
});

export const createServer = () => {
  const app = express();

  // Enable CORS for all origins in development
  app.use(cors());

  // Parse JSON bodies
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Health check endpoint
  app.get("/api/ping", (req, res) => {
    res.json({ message: "pong", timestamp: new Date().toISOString() });
  });

  // Demo endpoint
  app.get("/api/demo", handleDemo);

  // KYC endpoints
  app.post("/api/kyc/submit", upload.array('documents'), handleKYCSubmission);
  app.get("/api/kyc/verify", handleKYCVerification);
  app.get("/api/kyc/history", handleKYCHistory);
  app.get("/api/kyc/stats", handleKYCStats);

  // Error handling middleware for multer
  app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (error instanceof multer.MulterError) {
      if (error.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          success: false,
          message: 'File too large. Maximum size is 5MB per file.',
          error: error.message,
          timestamp: new Date().toISOString()
        });
      }
      if (error.code === 'LIMIT_FILE_COUNT') {
        return res.status(400).json({
          success: false,
          message: 'Too many files. Maximum 10 files allowed.',
          error: error.message,
          timestamp: new Date().toISOString()
        });
      }
    }
    
    if (error.message === 'Only JPEG, PNG, and PDF files are allowed') {
      return res.status(400).json({
        success: false,
        message: error.message,
        timestamp: new Date().toISOString()
      });
    }

    console.error('Server error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  });

  // 404 handler for API routes
  app.use('/api/*', (req, res) => {
    res.status(404).json({
      success: false,
      message: `API endpoint not found: ${req.method} ${req.path}`,
      timestamp: new Date().toISOString()
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
    console.log(`   POST /api/kyc/submit          - Submit KYC documents`);
    console.log(`   GET  /api/kyc/verify          - Verify KYC status`);
    console.log(`   GET  /api/kyc/history         - Get KYC history`);
    console.log(`   GET  /api/kyc/stats           - Get KYC statistics`);
    console.log(`🔐 Blockchain: Hyperledger Fabric integration ready`);
    console.log(`📂 Storage: IPFS integration ready`);
  });
}
