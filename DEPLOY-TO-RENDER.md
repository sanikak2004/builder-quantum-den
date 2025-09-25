# Automated Render Deployment Guide

## Prerequisites
1. A Render account (create one at https://render.com if you don't have one)
2. This repository pushed to GitHub (already done: https://github.com/sanikak2004/builder-quantum-den.git)

## Automated Deployment Steps

### Step 1: Prepare Your Render Account

1. Go to https://render.com and sign in or create an account
2. Connect your GitHub account to Render:
   - Click on your profile icon in the top right
   - Select "Settings"
   - Click on "Connected Accounts"
   - Connect your GitHub account

### Step 2: Create Web Service on Render

1. Click the button below to deploy directly to Render:

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy)

2. If the button doesn't work, follow these manual steps:
   - Go to your Render Dashboard
   - Click "New +" → "Web Service"
   - Select your GitHub repository: `sanikak2004/builder-quantum-den`
   - Configure the service with these settings:

### Manual Configuration Settings

**Basic Settings:**
- **Name**: `ekyc-blockchain-app`
- **Environment**: `Node`
- **Region**: `Ohio` (or select the closest region to your users)
- **Branch**: `main`
- **Root Directory**: Leave empty (root of repository)

**Build Settings:**
- **Build Command**: `npm run build:render`
- **Start Command**: `npm run start:render`

**Environment Variables:**
Add these environment variables in the Render dashboard:

```
DATABASE_URL=postgres://avnadmin:AVNS_ltoOZ6TzwV4Xg61XsSI@blockchain-maskeriya338-1f80.f.aivencloud.com:27251/defaultdb?sslmode=require
NODE_ENV=production
JWT_SECRET=super_secure_jwt_secret_key_here_32_characters_min
ENCRYPTION_KEY=32_character_encryption_key_for_data_protection
```

### Step 3: Deploy

1. Click "Create Web Service"
2. Render will automatically:
   - Clone your repository
   - Install dependencies
   - Generate Prisma client
   - Run database migrations
   - Build the application
   - Start the service

### Step 4: Monitor Deployment

1. Watch the build logs in the Render dashboard
2. Wait for deployment to complete (usually 5-10 minutes)
3. Once deployed, your app will be available at: `https://ekyc-blockchain-app.onrender.com`

### Step 5: Verify Deployment

Test these endpoints:
- Health check: `https://ekyc-blockchain-app.onrender.com/api/health`
- KYC stats: `https://ekyc-blockchain-app.onrender.com/api/kyc/stats`
- Admin stats: `https://ekyc-blockchain-app.onrender.com/api/admin/stats`

## Troubleshooting

If you encounter any issues:

1. **Database Connection Issues**:
   - Verify the DATABASE_URL is correct
   - Ensure your Aiven database allows connections from Render IPs

2. **Build Failures**:
   - Check the build logs for specific error messages
   - Ensure all dependencies are correctly specified in package.json

3. **Runtime Errors**:
   - Check the application logs in Render dashboard
   - Verify environment variables are correctly set

## Support

If you need help with deployment:
1. Check the Render documentation: https://render.com/docs
2. Contact Render support through their dashboard
3. Refer to the detailed [RENDER-DEPLOYMENT-GUIDE.md](RENDER-DEPLOYMENT-GUIDE.md) in this repository

Your application should now be successfully deployed to Render and accessible online!