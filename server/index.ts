import express from "express";
import cors from "cors";

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
