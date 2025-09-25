# Automated Render Deployment for eKYC Blockchain System

## Overview

This document provides instructions for automatically deploying your eKYC Blockchain System to Render with minimal manual intervention.

## Prerequisites

1. A Render account (https://render.com)
2. Git installed and configured
3. Node.js and npm installed
4. This repository pushed to GitHub

## Automated Deployment Options

### Option 1: One-Click Deployment (Recommended)

1. Click the "Deploy to Render" button below:

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy)

2. Connect your GitHub account when prompted
3. Select your repository (`sanikak2004/builder-quantum-den`)
4. Configure the service with these settings:
   - **Name**: `ekyc-blockchain-app`
   - **Environment**: `Node`
   - **Region**: Select the closest region to your users
   - **Branch**: `main`

5. Add these environment variables:
   ```
   DATABASE_URL=postgres://avnadmin:AVNS_ltoOZ6TzwV4Xg61XsSI@blockchain-maskeriya338-1f80.f.aivencloud.com:27251/defaultdb?sslmode=require
   NODE_ENV=production
   JWT_SECRET=super_secure_jwt_secret_key_here_32_characters_min
   ENCRYPTION_KEY=32_character_encryption_key_for_data_protection
   ```

6. Click "Apply" to deploy

### Option 2: Script-Based Deployment

#### For Windows Users:

1. Run the deployment script:
   ```cmd
   scripts\render-deploy.bat
   ```

#### For macOS/Linux Users:

1. Make the script executable:
   ```bash
   chmod +x scripts/render-deploy.sh
   ```

2. Run the deployment script:
   ```bash
   ./scripts/render-deploy.sh
   ```

### Option 3: Manual Deployment via Render Dashboard

1. Go to https://render.com and sign in
2. Click "New +" → "Web Service"
3. Connect your GitHub repository: `sanikak2004/builder-quantum-den`
4. Configure with these settings:
   - **Name**: `ekyc-blockchain-app`
   - **Environment**: `Node`
   - **Region**: Select the closest region to your users
   - **Branch**: `main`
   - **Root Directory**: Leave empty
   - **Build Command**: `npm run build:render`
   - **Start Command**: `npm run start:render`

5. Add environment variables in the "Environment Variables" section:
   ```
   DATABASE_URL=postgres://avnadmin:AVNS_ltoOZ6TzwV4Xg61XsSI@blockchain-maskeriya338-1f80.f.aivencloud.com:27251/defaultdb?sslmode=require
   NODE_ENV=production
   JWT_SECRET=super_secure_jwt_secret_key_here_32_characters_min
   ENCRYPTION_KEY=32_character_encryption_key_for_data_protection
   ```

6. Click "Create Web Service"

## Deployment Process

Render will automatically perform these steps:

1. Clone your repository
2. Install dependencies using `pnpm`
3. Generate Prisma client
4. Run database migrations
5. Build the application
6. Start the service on port 10000

## Post-Deployment Verification

After deployment (usually 5-10 minutes):

1. Visit your service URL: `https://ekyc-blockchain-app.onrender.com`
2. Test these endpoints:
   - Health check: `https://ekyc-blockchain-app.onrender.com/api/health`
   - KYC stats: `https://ekyc-blockchain-app.onrender.com/api/kyc/stats`
   - Admin stats: `https://ekyc-blockchain-app.onrender.com/api/admin/stats`

## Custom Domain (Optional)

To use a custom domain:

1. In your Render service dashboard, go to "Settings" → "Custom Domains"
2. Add your domain name
3. Configure DNS with your domain provider:
   - Type: `CNAME`
   - Name: Your subdomain (or `@` for root domain)
   - Value: Your Render service URL (`ekyc-blockchain-app.onrender.com`)

## Monitoring and Maintenance

### Health Monitoring

- Render provides automatic health checks
- View application logs in the Render dashboard
- Monitor performance metrics in the "Metrics" tab

### Updates

- Push to your `main` branch to trigger automatic redeployment
- Manual redeployment is available in the Render dashboard

### Database Management

- Your Aiven PostgreSQL database is used directly
- No additional database setup is required
- All existing data is preserved

## Troubleshooting

### Common Issues

1. **Build Failures**:
   - Check dependencies in `package.json`
   - Ensure Node.js version compatibility

2. **Database Connection Issues**:
   - Verify `DATABASE_URL` format
   - Check if your Aiven database allows external connections

3. **Runtime Errors**:
   - Check application logs in Render dashboard
   - Verify environment variables are correctly set

### Support Resources

- Render documentation: https://render.com/docs
- GitHub repository issues
- Health endpoint for system status

## Cost Estimation

- **Web Service (Starter)**: $7/month
- **Your Aiven Database**: Based on your current Aiven plan
- **Total**: $7/month + your Aiven database cost

## Security Features

- ✅ Automatic HTTPS
- ✅ DDoS protection
- ✅ Environment variable encryption
- ✅ Database encryption at rest
- ✅ Document hash verification
- ✅ Transaction fraud detection

Your eKYC Blockchain System is now ready for automated deployment to Render!