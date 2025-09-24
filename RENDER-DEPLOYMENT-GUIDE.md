# Render Deployment Guide
# Complete guide for deploying eKYC Blockchain System to Render

## Prerequisites
- GitHub repository with your code
- Render account (free tier available)
- PostgreSQL database (can be created on Render)

## Step 1: Create PostgreSQL Database on Render

1. Log into Render Dashboard
2. Click "New +" → "PostgreSQL"
3. Configure database:
   - **Name**: `ekyc-blockchain-db`
   - **Database**: `ekyc_production`
   - **User**: `ekyc_user`
   - **Region**: Choose closest to your users
   - **Plan**: Free tier (256MB) or paid plan
4. Click "Create Database"
5. Copy the **External Database URL** for later use

## Step 2: Create Web Service on Render

1. Click "New +" → "Web Service"
2. Connect your GitHub repository
3. Configure service:
   - **Name**: `ekyc-blockchain-app`
   - **Environment**: `Node`
   - **Region**: Same as your database
   - **Branch**: `main`
   - **Build Command**: `npm run build:render`
   - **Start Command**: `npm run start:render`
   - **Instance Type**: `Starter` (0.5 CPU, 1GB RAM)

## Step 3: Environment Variables

Add these environment variables in Render dashboard:

### Required Variables:
```
DATABASE_URL=<your-postgresql-external-url-from-step-1>
NODE_ENV=production
VITE_API_URL=https://your-service-name.onrender.com
```

### Optional Variables (recommended):
```
JWT_SECRET=your_super_secure_jwt_secret_here_32_chars
ENCRYPTION_KEY=your_32_character_encryption_key_here
LOG_LEVEL=info
MAX_FILE_SIZE=5242880
MAX_FILES_PER_UPLOAD=10
ADMIN_EMAIL=admin@yourcompany.com
SYSTEM_NAME=Authen Ledger eKYC System
```

## Step 4: Deploy

1. Click "Create Web Service"
2. Render will automatically:
   - Clone your repository
   - Install dependencies
   - Generate Prisma client
   - Run database migrations
   - Build the application
   - Start the service

## Step 5: Verify Deployment

1. Wait for deployment to complete (usually 5-10 minutes)
2. Open your service URL: `https://your-service-name.onrender.com`
3. Test health endpoint: `https://your-service-name.onrender.com/api/health`
4. Test main features:
   - KYC Submission: `/submit`
   - Transaction Verification: `/transaction-verifier` 
   - Admin Dashboard: `/admin/dashboard`
   - Forgery Detection: `/admin/forgery`

## Step 6: Custom Domain (Optional)

1. In service settings, go to "Custom Domains"
2. Add your domain name
3. Configure DNS CNAME record:
   - Type: `CNAME`
   - Name: `your-subdomain` (or `@` for root)
   - Value: `your-service-name.onrender.com`

## Monitoring and Maintenance

### Health Monitoring
- Health endpoint: `GET /api/health`
- Status endpoint: `GET /api/status`
- Render provides automatic health checks

### Logs and Debugging
- View logs in Render dashboard under "Logs" tab
- Monitor performance in "Metrics" tab
- Set up alerts for downtime

### Database Management
- Access database via Render dashboard
- Use connection info to connect with tools like pgAdmin
- Regular backups are handled automatically

### Updates and Redeployment
- Push to main branch triggers automatic redeploy
- Manual redeploy available in Render dashboard
- Zero-downtime deployments

## Production Checklist

✅ **Database Setup**
- [ ] PostgreSQL database created
- [ ] Connection string configured
- [ ] Migrations applied

✅ **Service Configuration**
- [ ] Build and start commands correct
- [ ] Environment variables set
- [ ] Health checks passing

✅ **Security**
- [ ] JWT secret configured
- [ ] Encryption keys set
- [ ] Admin credentials secured

✅ **Features Testing**
- [ ] KYC submission works
- [ ] Document upload functional
- [ ] Hash verification active
- [ ] Admin panel accessible
- [ ] Forgery detection operational

✅ **Performance**
- [ ] Application loads quickly
- [ ] Database queries optimized
- [ ] File uploads working
- [ ] Real-time features functional

## Expected Performance
- **Build Time**: 5-10 minutes
- **Start Time**: 30-60 seconds
- **Response Time**: < 500ms for API calls
- **Uptime**: 99.9% (Render SLA)

## Troubleshooting

### Common Issues:
1. **Build fails**: Check dependencies and Node.js version
2. **Database connection fails**: Verify DATABASE_URL format
3. **503 errors**: Check health endpoint and logs
4. **File upload issues**: Verify MAX_FILE_SIZE setting

### Support Resources:
- Render documentation: https://render.com/docs
- GitHub repository issues
- Health endpoint for system status

## Cost Estimation (Monthly)
- **Web Service (Starter)**: $7/month
- **PostgreSQL (Free)**: $0/month (256MB)
- **PostgreSQL (Starter)**: $7/month (1GB)
- **Total**: $7-14/month for production-ready setup

## Security Features Included
- ✅ Automatic HTTPS
- ✅ DDoS protection
- ✅ Environment variable encryption
- ✅ Database encryption at rest
- ✅ Regular security updates
- ✅ Network isolation
- ✅ Document hash verification
- ✅ Transaction fraud detection
- ✅ Comprehensive audit logging

Your eKYC Blockchain System is now deployed and ready for production use!