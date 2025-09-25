# 🚀 Netlify Deployment Guide - Authen Ledger eKYC System

## 📋 Prerequisites

1. **Netlify Account**: Sign up at [netlify.com](https://netlify.com)
2. **GitHub Repository**: Your code should be in a GitHub repository
3. **PostgreSQL Database**: Your Aiven PostgreSQL database is already configured

## 🔧 Step 1: Prepare Environment Variables

In your Netlify site dashboard, go to **Site settings > Environment variables** and add:

### Required Variables:
```
DATABASE_URL=postgresql://avnadmin:AVNS_ltoOZ6TzwV4Xg61XsSI@blockchain-maskeriya338-1f80.f.aivencloud.com:27251/defaultdb?sslmode=require
NODE_ENV=production
JWT_SECRET=your_super_secure_jwt_secret_here_replace_with_random_string
ENCRYPTION_KEY=your_32_character_encryption_key_here
```

### Optional Variables:
```
IPFS_API_URL=http://127.0.0.1:5001
IPFS_GATEWAY_URL=https://ipfs.io/ipfs/
MAX_FILE_SIZE=5242880
MAX_FILES_PER_UPLOAD=10
ALLOWED_FILE_TYPES=image/jpeg,image/png,image/jpg,application/pdf
```

## 🗄️ Step 2: Database Schema Setup

Before deploying, you need to set up the database schema. You have two options:

### Option A: Manual Schema Setup (Recommended)

1. Connect to your PostgreSQL database using a client like psql or pgAdmin
2. Run the migration SQL from the [prisma/migrations](file:///c:/Users/ARYAN/Desktop/newbuild/builder-quantum-den/prisma/migrations) directory

### Option B: Using Prisma CLI

If you have the Prisma CLI installed:

1. Set your DATABASE_URL environment variable locally:
   ```bash
   export DATABASE_URL=your_database_connection_string
   ```

2. Run the Prisma migration:
   ```bash
   npx prisma migrate deploy
   ```

For detailed database setup instructions, see [NETLIFY-DATABASE-SETUP.md](file:///c:/Users/ARYAN/Desktop/newbuild/builder-quantum-den/NETLIFY-DATABASE-SETUP.md).

## 🚀 Step 3: Deploy to Netlify

### Option A: Manual Deploy (Quick Start)

1. **Build the project locally:**
   ```bash
   npm run netlify-build
   ```

2. **Install Netlify CLI:**
   ```bash
   npm install -g netlify-cli
   ```

3. **Login to Netlify:**
   ```bash
   netlify login
   ```

4. **Deploy:**
   ```bash
   netlify deploy --prod --dir=dist/spa
   ```

### Option B: Git Integration (Recommended)

1. **Connect your repository:**
   - Go to [Netlify Dashboard](https://app.netlify.com)
   - Click "New site from Git"
   - Choose GitHub and select your repository

2. **Configure build settings:**
   - **Build command:** `npm run netlify-build`
   - **Publish directory:** `dist/spa`
   - **Functions directory:** `netlify/functions`

3. **Deploy:**
   - Click "Deploy site"
   - Netlify will automatically build and deploy your site

## 🔗 Step 4: Configure Custom Domain (Optional)

1. In your Netlify site dashboard, go to **Domain settings**
2. Add your custom domain
3. Configure DNS settings as instructed by Netlify

## 🧪 Step 5: Test Your Deployment

Once deployed, test these endpoints:

- **Health Check:** `https://your-site.netlify.app/api/ping`
- **KYC Stats:** `https://your-site.netlify.app/api/kyc/stats`
- **Admin Stats:** `https://your-site.netlify.app/api/admin/stats`
- **Blockchain Status:** `https://your-site.netlify.app/api/blockchain/status`

## 📊 Features Available on Netlify

### ✅ Working Features:
- **Frontend React App**: Complete eKYC interface
- **API Endpoints**: Full API functionality via Netlify Functions with database connectivity
- **Static Assets**: All CSS, JS, and images
- **Health Monitoring**: API status endpoints with database connection testing
- **CORS Configuration**: Proper cross-origin setup
- **Database Operations**: Full CRUD operations with PostgreSQL

### ⚠️ Limited Features (Due to Serverless):
- **File Uploads**: May need external storage service
- **Real-time Features**: WebSocket connections not supported
- **Background Jobs**: Limited execution time

## 🔄 Continuous Deployment

Once connected to GitHub:
1. Every push to `main` branch triggers automatic deployment
2. Preview deployments for pull requests
3. Automatic builds with environment variables

## 🛠️ Troubleshooting

### Build Issues:
```bash
# Clear cache and rebuild
npm run clean
npm run netlify-build
```

### Function Issues:
- Check Netlify function logs in dashboard
- Verify environment variables are set
- Test functions locally with `netlify dev`

### Database Connection:
- Ensure `DATABASE_URL` is correctly set
- Check if your PostgreSQL allows external connections
- Test the connection string locally with a PostgreSQL client

## 📈 Scaling Considerations

For production with full database features, consider:
1. **Upgrade to Netlify Pro** for longer function execution time
2. **Database Connection Pooling** using services like PlanetScale or Supabase
3. **External File Storage** using AWS S3 or Cloudinary
4. **Background Job Processing** using services like Zapier or Netlify Background Functions

## 🎉 Deployment Complete!

Your Authen Ledger eKYC system is now live on Netlify with:
- ✅ Frontend application
- ✅ API endpoints via serverless functions with full database connectivity
- ✅ Automatic deployments
- ✅ HTTPS by default
- ✅ Global CDN distribution

Visit your live application at: `https://your-site.netlify.app`

# Netlify Deployment Guide for Authen Ledger eKYC Application

## Prerequisites
1. A Netlify account
2. Access to your GitHub/GitLab/Bitbucket repository
3. The database URL and credentials (already configured)

## Deployment Steps

### 1. Connect Your Repository to Netlify
1. Go to [Netlify Dashboard](https://app.netlify.com/)
2. Click "New site from Git"
3. Select your Git provider and repository
4. Configure the build settings:
   - Build command: `npm run netlify-build`
   - Publish directory: `dist/spa`

### 2. Set Environment Variables
In Netlify Dashboard:
1. Go to Site settings > Environment variables
2. Add the following variables:
   ```
   DATABASE_URL=postgres://avnadmin:AVNS_ltoOZ6TzwV4Xg61XsSI@blockchain-maskeriya338-1f80.f.aivencloud.com:27251/defaultdb?sslmode=require
   NODE_ENV=production
   PORT=8080
   JWT_SECRET=your_super_secure_jwt_secret_here_replace_with_random_string
   ENCRYPTION_KEY=your_32_character_encryption_key_here
   CORS_ALLOWED_ORIGINS=https://your-netlify-app.netlify.app
   ```

### 3. Deploy
1. Click "Deploy site"
2. Wait for the build to complete
3. Your site will be available at the provided Netlify URL

## Troubleshooting

### Database Connection Issues
- Ensure the DATABASE_URL is correctly set in Netlify environment variables
- Verify the database is accessible from the internet
- Check that the database credentials are correct

### API Endpoint Issues
- All API requests should be prefixed with `/api/`
- The Netlify function handles all `/api/*` routes
- Check the function logs in Netlify for errors

## Custom Domain (Optional)
1. Go to Site settings > Domain management
2. Add your custom domain
3. Update the CORS_ALLOWED_ORIGINS environment variable to include your custom domain
4. Configure DNS records as instructed by Netlify

## Monitoring
- Check Netlify function logs for API errors
- Monitor database connection logs
- Use Netlify analytics for site performance
