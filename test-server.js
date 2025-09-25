const express = require('express');
const { PrismaClient } = require('@prisma/client');

const app = express();
const port = 3001;

// Enable CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// Parse JSON bodies
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Initialize Prisma Client
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
  log: ['query', 'info', 'warn', 'error'],
});

// Test endpoint
app.get('/api/test', async (req, res) => {
  res.json({ message: 'Test endpoint working' });
});

// KYC Stats endpoint
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

// Get all KYC records (admin only)
app.get('/api/admin/kyc/all', async (req, res) => {
  try {
    const { status = 'all', page = '1', limit = '20', sortBy = 'createdAt', sortOrder = 'desc', search = '' } = req.query;
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
        orderBy
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

    // Update the KYC record
    const updatePayload = {
      status,
      remarks: remarks || `KYC ${status.toLowerCase()} by admin`,
      verifiedBy: verifiedBy || "admin@system.com",
      updatedAt: new Date(),
    };

    if (status === "VERIFIED") {
      updatePayload.verifiedAt = new Date();
    } else if (status === "REJECTED") {
      updatePayload.rejectedAt = new Date();
    }

    const updatedRecord = await prisma.kYCRecord.update({
      where: { id },
      data: updatePayload,
    });

    res.json({
      success: true,
      data: updatedRecord,
      message: `KYC record ${status.toLowerCase()} successfully`,
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

app.listen(port, () => {
  console.log(`🚀 Test server running on port ${port}`);
  console.log(`🔧 API: http://localhost:${port}/api`);
});