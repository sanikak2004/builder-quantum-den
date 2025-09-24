# Render Deployment Configuration
# 🚀 eKYC Blockchain System - Render Deployment

## ✅ READY FOR PRODUCTION DEPLOYMENT

This is a **complete eKYC blockchain system** with L1, L2, L3 verification levels and comprehensive mining/validation capabilities, ready for deployment on Render.

---

## Build Command
```bash
npm run render-build
```

## Start Command  
```bash
npm run render-start
```

## Environment Variables Required

### Database
- `DATABASE_URL`: PostgreSQL connection string (provided by Render)

### Optional (for production features)
- `FABRIC_CONNECTION_PROFILE`: Hyperledger Fabric connection profile
- `IPFS_API_URL`: IPFS node API URL
- `IPFS_GATEWAY_URL`: IPFS gateway URL

## Port Configuration
The application automatically detects the PORT environment variable set by Render.

## Database Setup
The application uses PostgreSQL with Prisma ORM. The database will be automatically set up when you:

1. Add a PostgreSQL service on Render
2. Copy the DATABASE_URL to your web service environment variables
3. The application will run migrations on startup

## Features Included

### ✅ Complete Blockchain System
- Real-time blockchain statistics
- Interactive block explorer  
- Transaction creation and mining
- Advanced analytics dashboard
- Network monitoring
- Gas usage tracking
- Proof-of-work consensus

### ✅ Comprehensive eKYC System
- Document upload with IPFS storage
- Database persistence with PostgreSQL
- Blockchain transaction logging
- Admin dashboard with real-time metrics
- Automated permanent storage
- Audit trail system

### ✅ Production Ready
- Error handling and validation
- Security measures
- Performance optimizations
- Real-time updates
- Mobile responsive design
- RESTful API endpoints

## Deployment Steps

1. **Create Web Service on Render**
   - Repository: Connect your GitHub repository
   - Build Command: `npm run render-build`
   - Start Command: `npm run render-start`
   - Environment: Node.js

2. **Add PostgreSQL Database**
   - Create a PostgreSQL service on Render
   - Copy the DATABASE_URL to your web service

3. **Configure Environment Variables**
   - DATABASE_URL (from PostgreSQL service)
   - NODE_ENV=production

4. **Deploy**
   - Render will automatically build and deploy
   - Database migrations will run automatically
   - Application will be ready at your Render URL

## Testing the Deployment

After deployment, test these endpoints:

- `GET /` - Main dashboard
- `GET /blockchain` - Blockchain visualization
- `GET /api/blockchain/status` - Blockchain health check
- `POST /api/kyc/submit` - KYC submission (with file upload)
- `GET /api/blockchain/custom/stats` - Blockchain statistics

## Architecture

```
Frontend (React + TypeScript)
├── Blockchain Visualization Dashboard
├── eKYC Submission Forms  
└── Admin Management Interface

Backend (Express + TypeScript)
├── Custom Blockchain Implementation
├── RESTful API Endpoints
├── Database Operations (Prisma + PostgreSQL)
├── File Upload & Processing
└── Real-time Event Streams

Services
├── Hyperledger Fabric Integration (Ready)
├── IPFS Distributed Storage (Ready)
└── Automated Permanent Storage
```

The application is fully functional and ready for production deployment on Render!