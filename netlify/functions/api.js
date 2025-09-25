const serverless = require('serverless-http');
const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');

// Create Express app
const app = express();

// Initialize Prisma Client with better error handling
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
  log: ['query', 'info', 'warn', 'error'],
});

// Enable CORS with specific configuration
app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Handle preflight requests
app.options('*', cors());

// Basic middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Middleware to log all requests
app.use((req, res, next) => {
  console.log(`📥 ${req.method} ${req.path}`);
  next();
});

// Health check endpoints
app.get('/api/ping', async (req, res) => {
  console.log('✅ Ping endpoint called successfully');
  
  // Test database connection
  let dbStatus = 'disconnected';
  let dbError = null;
  
  try {
    await prisma.$queryRaw`SELECT 1`;
    dbStatus = 'connected';
  } catch (error) {
    dbError = error.message;
  }
  
  res.json({ 
    message: 'pong', 
    timestamp: new Date().toISOString(),
    environment: 'netlify-function',
    success: true,
    database: {
      status: dbStatus,
      error: dbError
    }
  });
});

app.get('/api/health', async (req, res) => {
  // Test database connection
  let dbConnected = false;
  try {
    await prisma.$queryRaw`SELECT 1`;
    dbConnected = true;
  } catch (error) {
    console.log('Database connection test failed:', error.message);
  }
  
  res.json({ 
    status: dbConnected ? 'ok' : 'degraded', 
    service: 'authen-ledger-api',
    timestamp: new Date().toISOString(),
    backend: 'netlify-functions',
    database: {
      connected: dbConnected
    },
    features: {
      database: 'postgresql',
      blockchain: 'custom',
      storage: 'ipfs-ready'
    }
  });
});

// KYC Stats endpoint with real database connection
app.get('/api/kyc/stats', async (req, res) => {
  try {
    // Get real stats from database
    const [totalSubmissions, pendingVerifications, verifiedRecords, rejectedRecords] =
      await Promise.all([
        prisma.kYCRecord.count(),
        prisma.kYCRecord.count({ where: { status: "PENDING" } }),
        prisma.kYCRecord.count({ where: { status: "VERIFIED" } }),
        prisma.kYCRecord.count({ where: { status: "REJECTED" } }),
      ]);

    // Get system stats for average processing time
    const systemStats = await prisma.systemStats.findUnique({
      where: { id: "system_stats" },
    });

    res.json({
      success: true,
      data: {
        totalSubmissions,
        pendingVerifications,
        verifiedRecords,
        rejectedRecords,
        averageProcessingTime: systemStats ? systemStats.averageProcessingTimeHours : 0
      },
      message: "KYC statistics from database",
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Error fetching KYC stats:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: "Failed to fetch KYC statistics",
      timestamp: new Date().toISOString()
    });
  }
});

// Admin stats endpoint with real database connection
app.get('/api/admin/stats', async (req, res) => {
  try {
    // Get real stats from database
    const [totalSubmissions, pendingVerifications, verifiedRecords, rejectedRecords] =
      await Promise.all([
        prisma.kYCRecord.count(),
        prisma.kYCRecord.count({ where: { status: "PENDING" } }),
        prisma.kYCRecord.count({ where: { status: "VERIFIED" } }),
        prisma.kYCRecord.count({ where: { status: "REJECTED" } }),
      ]);

    // Get system stats for average processing time
    const systemStats = await prisma.systemStats.findUnique({
      where: { id: "system_stats" },
    });

    res.json({
      success: true,
      data: {
        totalSubmissions,
        pendingVerifications,
        verifiedRecords,
        rejectedRecords,
        averageProcessingTime: systemStats ? systemStats.averageProcessingTimeHours : 0
      },
      message: "Admin statistics from database",
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Error fetching admin stats:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: "Failed to fetch admin statistics",
      timestamp: new Date().toISOString()
    });
  }
});

// Get all KYC records (admin only)
app.get('/api/admin/kyc/all', async (req, res) => {
  try {
    const { page = '1', limit = '50', status = 'all', search = '', sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    
    // Build where clause
    const where = {};
    if (status && status !== 'all' && ['PENDING', 'VERIFIED', 'REJECTED'].includes(status)) {
      where.status = status;
    }
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { pan: { contains: search, mode: 'insensitive' } }
      ];
    }
    
    // Build orderBy clause
    const orderBy = {};
    orderBy[sortBy] = sortOrder;
    
    // Fetch records with pagination
    const [records, total] = await Promise.all([
      prisma.kYCRecord.findMany({
        where,
        skip: (pageNum - 1) * limitNum,
        take: limitNum,
        orderBy,
        include: {
          documents: true
        }
      }),
      prisma.kYCRecord.count({ where })
    ]);
    
    res.json({
      success: true,
      data: {
        records,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum)
        }
      },
      message: "KYC records retrieved successfully",
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Error fetching KYC records:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: "Failed to fetch KYC records",
      timestamp: new Date().toISOString()
    });
  }
});

// Update KYC status (admin only)
app.put('/api/admin/kyc/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, remarks, verifiedBy } = req.body;

    console.log(`🔄 Admin status update request - ID: ${id}, Status: ${status}`);
    
    // Validate required fields
    if (!id) {
      return res.status(400).json({
        success: false,
        message: "KYC ID is required",
        timestamp: new Date().toISOString(),
      });
    }

    if (!status || !["VERIFIED", "REJECTED"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Valid status (VERIFIED or REJECTED) is required",
        timestamp: new Date().toISOString(),
      });
    }

    // Check if record exists before updating
    const existingRecord = await prisma.kYCRecord.findUnique({
      where: { id }
    });
    
    if (!existingRecord) {
      return res.status(404).json({
        success: false,
        message: `KYC record not found with ID: ${id}`,
        timestamp: new Date().toISOString(),
      });
    }

    // Update in database
    const updateData = {
      status: status,
      remarks: remarks || `KYC ${status.toLowerCase()} by admin`,
      verifiedBy: verifiedBy || "admin@system.com",
      updatedAt: new Date()
    };

    if (status === "VERIFIED") {
      updateData.verifiedAt = new Date();
    } else if (status === "REJECTED") {
      updateData.rejectedAt = new Date();
    }

    const updatedRecord = await prisma.kYCRecord.update({
      where: { id },
      data: updateData,
      include: {
        documents: true
      }
    });

    console.log(`✅ KYC record ${id} successfully updated to ${status}`);

    // Return comprehensive response
    res.json({
      success: true,
      data: updatedRecord,
      message: `✅ KYC record ${status.toLowerCase()} successfully`,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("❌ Error updating KYC status:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update KYC status",
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

// Get specific KYC record by ID
app.get('/api/kyc/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const record = await prisma.kYCRecord.findUnique({
      where: { id },
      include: {
        documents: true
      }
    });
    
    if (!record) {
      return res.status(404).json({
        success: false,
        message: "KYC record not found",
        timestamp: new Date().toISOString()
      });
    }
    
    res.json({
      success: true,
      data: record,
      message: "KYC record retrieved successfully",
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Error fetching KYC record:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: "Failed to fetch KYC record",
      timestamp: new Date().toISOString()
    });
  }
});

// Blockchain status endpoint
app.get('/api/blockchain/status', (req, res) => {
  res.json({
    success: true,
    blockchain: {
      customBlockchain: {
        totalBlocks: 1,
        totalTransactions: 1,
        difficulty: 4,
        isValid: true,
        type: "Custom Blockchain on Netlify"
      },
      hyperledgerFabric: {
        connected: false,
        network: "Ready for integration",
        type: "Hyperledger Fabric (configurable)"
      },
      ipfs: {
        connected: false,
        type: "IPFS Ready for integration"
      }
    },
    message: "✅ Blockchain services ready on Netlify",
    timestamp: new Date().toISOString()
  });
});

// Root endpoint
app.get('/api', (req, res) => {
  res.json({ 
    message: 'Authen Ledger API is running on Netlify',
    endpoints: {
      health: '/api/ping',
      stats: '/api/kyc/stats',
      admin: '/api/admin/stats',
      blockchain: '/api/blockchain/status',
      kycRecords: 'GET /api/admin/kyc/all',
      kycRecord: 'GET /api/kyc/:id'
    },
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    platform: 'netlify-functions'
  });
});

// Catch all for debugging
app.use('*', (req, res) => {
  console.log('❌ Unhandled request:', req.method, req.originalUrl, req.path);
  res.status(404).json({ 
    error: 'Endpoint not found',
    method: req.method,
    originalUrl: req.originalUrl,
    path: req.path,
    availableEndpoints: {
      health: '/api/ping',
      stats: '/api/kyc/stats',
      admin: '/api/admin/stats',
      blockchain: '/api/blockchain/status',
      kycRecords: 'GET /api/admin/kyc/all',
      kycRecord: 'GET /api/kyc/:id'
    },
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('❌ Function error:', error);
  res.status(500).json({ 
    error: 'Internal server error',
    message: error.message,
    timestamp: new Date().toISOString()
  });
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully');
  await prisma.$disconnect();
  process.exit(0);
});

// Export the serverless handler
exports.handler = serverless(app);