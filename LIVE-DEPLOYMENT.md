# 🚀 Live Render Deployment Instructions

## Prerequisites
- GitHub repository connected to Render
- Render account with billing enabled
- All deployment files are ready

## Step 1: Create PostgreSQL Database

### 1.1 Go to Render Dashboard
- Visit [render.com](https://render.com)
- Click "New +" → "PostgreSQL"

### 1.2 Configure Database
```
Name: ekyc-blockchain-db
Database: ekyc_production
User: ekyc_user
Region: Oregon (US West)
PostgreSQL Version: 15
Plan: Starter ($7/month) or Free (with limitations)
```

### 1.3 Save Database Details
After creation, save these details:
- **Database URL**: `postgresql://username:password@hostname:port/database_name`
- **Internal Database URL**: For faster internal connections

## Step 2: Create Web Service

### 2.1 Create New Web Service
- Click "New +" → "Web Service"
- Connect your GitHub repository
- Select branch: `main` or `master`

### 2.2 Configure Web Service
```
Name: ekyc-blockchain-app
Runtime: Node
Region: Oregon (US West) - Same as database
Branch: main
Build Command: npm run build:render
Start Command: npm run start:render
Plan: Starter ($7/month minimum for production apps)
```

### 2.3 Environment Variables
Click "Environment" and add these variables:

**Required Variables:**
```
DATABASE_URL=your-postgresql-connection-string-from-step-1
NODE_ENV=production
JWT_SECRET=your-super-secure-jwt-secret-minimum-32-characters
SESSION_SECRET=your-session-secret-for-express-sessions
BLOCKCHAIN_NETWORK_ID=ekyc-mainnet
```

**Optional but Recommended:**
```
BLOCKCHAIN_DIFFICULTY=4
AUTOMATIC_MINING=true
IPFS_GATEWAY_URL=https://ipfs.io/ipfs/
LOG_LEVEL=info
ENABLE_PERFORMANCE_MONITORING=true
CORS_ORIGIN=https://your-app-name.onrender.com
ENABLE_HASH_VERIFICATION=true
FORGERY_DETECTION_ENABLED=true
```

## Step 3: Deploy

### 3.1 Trigger Deployment
- Click "Create Web Service"
- Render will automatically:
  - Clone your repository
  - Install dependencies (`npm install`)
  - Generate Prisma client (`npx prisma generate`)
  - Run database migrations (`npx prisma migrate deploy`)
  - Build the application (`npm run build:render`)
  - Start the server (`npm run start:render`)

### 3.2 Monitor Deployment
- Watch the logs in real-time
- Check for any errors during build/deployment
- Deployment typically takes 3-5 minutes

## Step 4: Verify Deployment

### 4.1 Health Check
Once deployed, verify these endpoints:
- `https://your-app-name.onrender.com/api/health`
- `https://your-app-name.onrender.com/api/status`

### 4.2 Frontend Access
- Main application: `https://your-app-name.onrender.com`
- Admin dashboard: `https://your-app-name.onrender.com/admin`

### 4.3 Database Verification
Check that all tables are created by accessing:
- `https://your-app-name.onrender.com/api/admin/users`
- `https://your-app-name.onrender.com/api/admin/kyc-records`

## Step 5: Post-Deployment Configuration

### 5.1 Create Admin User
Make a POST request to create the first admin user:
```bash
curl -X POST https://your-app-name.onrender.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@yourcompany.com",
    "password": "secure-password",
    "name": "Admin User",
    "isAdmin": true
  }'
```

### 5.2 Test Core Functionality
1. Register a regular user
2. Submit a KYC application
3. Upload documents
4. Verify automatic mining works
5. Check hash verification system
6. Test forgery detection

## Troubleshooting

### Common Issues

**Build Failures:**
- Check that all dependencies are in package.json
- Verify Node.js version compatibility
- Check for TypeScript compilation errors

**Database Connection Issues:**
- Verify DATABASE_URL is correct
- Ensure database and web service are in same region
- Check that database is running and accessible

**Application Not Starting:**
- Check start command is `npm run start:render`
- Verify port configuration (Render uses PORT environment variable)
- Check server logs for startup errors

**Migration Failures:**
- Ensure Prisma schema is valid
- Check that DATABASE_URL has correct permissions
- Verify PostgreSQL version compatibility

### Support Commands

**View Logs:**
```bash
# In Render dashboard, go to your service → Logs
```

**Manual Migration (if needed):**
```bash
# Connect to your service shell and run:
npx prisma migrate deploy
npx prisma generate
```

**Reset Database (if needed):**
```bash
# ⚠️ This will delete all data!
npx prisma migrate reset --force
```

## Performance Optimization

### 5.3 Production Optimizations
After successful deployment, consider:

1. **Database Optimization:**
   - Add database indexes for frequently queried fields
   - Set up connection pooling
   - Monitor query performance

2. **Caching:**
   - Implement Redis caching for frequently accessed data
   - Cache blockchain verification results
   - Use CDN for static assets

3. **Security:**
   - Set up SSL certificates (automatic on Render)
   - Configure proper CORS origins
   - Implement rate limiting
   - Set up monitoring and alerts

4. **Monitoring:**
   - Set up health check monitoring
   - Monitor database performance
   - Track API response times
   - Set up error alerting

## Success Indicators

✅ **Deployment Successful When:**
- Build completes without errors
- Health check endpoint returns 200
- Frontend loads properly
- Database connections work
- API endpoints respond correctly
- Automatic mining system is active
- Hash verification system is functional

Your eKYC Blockchain application is now live on Render! 🎉

---

**Need Help?**
- Check Render documentation: https://render.com/docs
- Review application logs in Render dashboard
- Test all endpoints using the health check URLs
- Monitor database performance through Render's database dashboard