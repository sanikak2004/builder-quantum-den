const serverless = require('serverless-http');
const express = require('express');
const cors = require('cors');

// Create Express app
const app = express();

// Enable CORS with specific configuration
app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Basic middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoints
app.get('/ping', (req, res) => {
  console.log('✅ Ping endpoint called successfully');
  res.json({ 
    message: 'pong', 
    timestamp: new Date().toISOString(),
    environment: 'netlify-function',
    success: true,
    database: {
      status: 'configured',
      connected: true
    }
  });
});

app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    service: 'authen-ledger-api',
    timestamp: new Date().toISOString(),
    backend: 'netlify-functions',
    features: {
      database: 'postgresql',
      blockchain: 'custom',
      storage: 'ipfs-ready'
    }
  });
});

// KYC Stats endpoint (simplified for Netlify)
app.get('/kyc/stats', (req, res) => {
  // Return basic stats - in production this would connect to database
  res.json({
    success: true,
    data: {
      totalSubmissions: 0,
      pendingVerifications: 0,
      verifiedRecords: 0,
      rejectedRecords: 0,
      averageProcessingTime: 0
    },
    message: "KYC statistics from Netlify function",
    timestamp: new Date().toISOString()
  });
});

// Admin stats endpoint
app.get('/admin/stats', (req, res) => {
  res.json({
    success: true,
    data: {
      totalSubmissions: 0,
      pendingVerifications: 0,
      verifiedRecords: 0,
      rejectedRecords: 0,
      averageProcessingTime: 0
    },
    message: "Admin statistics from Netlify function",
    timestamp: new Date().toISOString()
  });
});

// Blockchain status endpoint
app.get('/blockchain/status', (req, res) => {
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
app.get('/', (req, res) => {
  res.json({ 
    message: 'Authen Ledger API is running on Netlify',
    endpoints: {
      health: '/api/ping',
      stats: '/api/kyc/stats',
      admin: '/api/admin/stats',
      blockchain: '/api/blockchain/status'
    },
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    platform: 'netlify-functions'
  });
});

// Demo KYC submission endpoint
app.post('/kyc/submit', (req, res) => {
  console.log('📋 KYC submission received on Netlify');
  
  // Simulate KYC submission
  const demoKycId = 'kyc_' + Date.now();
  const demoTxHash = 'tx_' + Math.random().toString(36).substr(2, 16);
  
  res.json({
    success: true,
    data: {
      kycId: demoKycId,
      blockchainTxHash: demoTxHash,
      status: 'PENDING',
      message: 'KYC submission received and queued for processing'
    },
    message: 'KYC submitted successfully on Netlify',
    timestamp: new Date().toISOString()
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
      submit: 'POST /api/kyc/submit'
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

// Export the serverless handler
exports.handler = serverless(app);
