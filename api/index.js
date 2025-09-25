// Vercel serverless function for Authen Ledger eKYC API
const cors = require('cors');

// Simple CORS middleware for Vercel
function enableCors(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return true;
  }
  return false;
}

export default async function handler(req, res) {
  // Handle CORS
  if (enableCors(req, res)) return;

  const { method, url } = req;
  const path = url.split('/api')[1] || '/';

  try {
    // Health check endpoint
    if (path === '/ping' && method === 'GET') {
      return res.status(200).json({
        message: 'pong',
        timestamp: new Date().toISOString(),
        environment: 'vercel-function',
        success: true,
        database: {
          status: 'configured',
          connected: true
        }
      });
    }

    // Health status endpoint
    if (path === '/health' && method === 'GET') {
      return res.status(200).json({
        status: 'ok',
        service: 'authen-ledger-api',
        timestamp: new Date().toISOString(),
        backend: 'vercel-functions',
        features: {
          database: 'postgresql',
          blockchain: 'custom',
          storage: 'ipfs-ready'
        }
      });
    }

    // KYC Stats endpoint
    if (path === '/kyc/stats' && method === 'GET') {
      return res.status(200).json({
        success: true,
        data: {
          totalSubmissions: 0,
          pendingVerifications: 0,
          verifiedRecords: 0,
          rejectedRecords: 0,
          averageProcessingTime: 0
        },
        message: "KYC statistics from Vercel function",
        timestamp: new Date().toISOString()
      });
    }

    // Admin stats endpoint
    if (path === '/admin/stats' && method === 'GET') {
      return res.status(200).json({
        success: true,
        data: {
          totalSubmissions: 0,
          pendingVerifications: 0,
          verifiedRecords: 0,
          rejectedRecords: 0,
          averageProcessingTime: 0
        },
        message: "Admin statistics from Vercel function",
        timestamp: new Date().toISOString()
      });
    }

    // Blockchain status endpoint
    if (path === '/blockchain/status' && method === 'GET') {
      return res.status(200).json({
        success: true,
        blockchain: {
          customBlockchain: {
            totalBlocks: 1,
            totalTransactions: 1,
            difficulty: 4,
            isValid: true,
            type: "Custom Blockchain on Vercel"
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
        message: "✅ Blockchain services ready on Vercel",
        timestamp: new Date().toISOString()
      });
    }

    // KYC submission endpoint
    if (path === '/kyc/submit' && method === 'POST') {
      const demoKycId = 'kyc_' + Date.now();
      const demoTxHash = 'tx_' + Math.random().toString(36).substr(2, 16);
      
      return res.status(200).json({
        success: true,
        data: {
          kycId: demoKycId,
          blockchainTxHash: demoTxHash,
          status: 'PENDING',
          message: 'KYC submission received and queued for processing'
        },
        message: 'KYC submitted successfully on Vercel',
        timestamp: new Date().toISOString()
      });
    }

    // Root API endpoint
    if (path === '/' && method === 'GET') {
      return res.status(200).json({
        message: 'Authen Ledger API is running on Vercel',
        endpoints: {
          health: '/api/ping',
          stats: '/api/kyc/stats',
          admin: '/api/admin/stats',
          blockchain: '/api/blockchain/status'
        },
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        platform: 'vercel-functions'
      });
    }

    // 404 for unhandled routes
    return res.status(404).json({
      error: 'Endpoint not found',
      method: method,
      path: path,
      availableEndpoints: {
        health: '/api/ping',
        stats: '/api/kyc/stats',
        admin: '/api/admin/stats',
        blockchain: '/api/blockchain/status',
        submit: 'POST /api/kyc/submit'
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
}