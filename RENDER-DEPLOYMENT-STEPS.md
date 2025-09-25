# Render Deployment Steps for eKYC Blockchain System

## Database Configuration

Based on your current .env file, you're using an Aiven PostgreSQL database:
```
DATABASE_URL=postgres://avnadmin:AVNS_ltoOZ6TzwV4Xg61XsSI@blockchain-maskeriya338-1f80.f.aivencloud.com:27251/defaultdb?sslmode=require
```

You have two options for deployment:

### Option 1: Use Your Existing Aiven Database (Recommended for continuity)

1. **Create Web Service on Render**
   - Log into Render Dashboard
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Configure service:
     - **Name**: `ekyc-blockchain-app`
     - **Environment**: `Node`
     - **Region**: Choose closest to your users
     - **Branch**: `main`
     - **Build Command**: `npm run build:render`
     - **Start Command**: `npm run start:render`
     - **Instance Type**: `Starter` (0.5 CPU, 1GB RAM)

2. **Environment Variables**
   Add these environment variables in Render dashboard:
   ```
   DATABASE_URL=postgres://avnadmin:AVNS_ltoOZ6TzwV4Xg61XsSI@blockchain-maskeriya338-1f80.f.aivencloud.com:27251/defaultdb?sslmode=require
   NODE_ENV=production
   JWT_SECRET=your_super_secure_jwt_secret_here_32_chars
   ENCRYPTION_KEY=your_32_character_encryption_key_here
   ```

### Option 2: Create New PostgreSQL Database on Render

1. **Create PostgreSQL Database on Render**
   - Log into Render Dashboard
   - Click "New +" → "PostgreSQL"
   - Configure database:
     - **Name**: `ekyc-blockchain-db`
     - **Database**: `ekyc_production`
     - **User**: `ekyc_user`
     - **Region**: Choose closest to your users
     - **Plan**: Free tier (256MB) or paid plan
   - Click "Create Database"
   - Copy the **External Database URL** for later use

2. **Migrate Your Data**
   If you want to keep your existing data, you'll need to:
   - Export data from your Aiven database
   - Import data to your new Render database

3. **Create Web Service**
   - Follow the same steps as Option 1
   - Use the new Render database URL in DATABASE_URL

## Deployment Process

### Step-by-Step Instructions:

1. **Prepare Your Repository**
   - Ensure your code is pushed to GitHub
   - Verify that your main branch is up to date

2. **Set Up Environment Variables**
   In Render dashboard, add these required environment variables:
   ```
   DATABASE_URL=postgres://avnadmin:AVNS_ltoOZ6TzwV4Xg61XsSI@blockchain-maskeriya338-1f80.f.aivencloud.com:27251/defaultdb?sslmode=require
   NODE_ENV=production
   JWT_SECRET=your_super_secure_jwt_secret_here_32_chars_minimum
   ENCRYPTION_KEY=your_32_character_encryption_key_here_for_data_protection
   ```

3. **Configure Build and Start Commands**
   - **Build Command**: `npm run build:render`
   - **Start Command**: `npm run start:render`

4. **Deploy**
   - Click "Create Web Service"
   - Render will automatically:
     - Clone your repository
     - Install dependencies
     - Generate Prisma client
     - Run database migrations
     - Build the application
     - Start the service

5. **Verify Deployment**
   - Wait for deployment to complete (usually 5-10 minutes)
   - Open your service URL: `https://your-service-name.onrender.com`
   - Test health endpoint: `https://your-service-name.onrender.com/api/health`

## Required Environment Variables for Production

Based on your project requirements, these are the essential environment variables:

1. `DATABASE_URL` - Your PostgreSQL database connection string
2. `NODE_ENV=production` - Sets the environment to production
3. `JWT_SECRET` - Secret key for JWT token generation (minimum 32 characters)
4. `ENCRYPTION_KEY` - 32-character key for data encryption

## Post-Deployment Verification

After deployment, verify these endpoints work:
- Health check: `/api/health`
- KYC stats: `/api/kyc/stats`
- Admin stats: `/api/admin/stats`
- KYC records: `/api/admin/kyc/all`

## Troubleshooting Common Issues

1. **Database Connection Failures**
   - Verify DATABASE_URL format and credentials
   - Ensure your Aiven database allows connections from Render IPs
   - Check if SSL mode is correctly configured

2. **Build Failures**
   - Check Node.js version compatibility
   - Verify all dependencies are correctly specified
   - Ensure Prisma schema is up to date

3. **Runtime Errors**
   - Check logs in Render dashboard
   - Verify environment variables are correctly set
   - Ensure database migrations have run successfully

## Security Considerations

1. **Environment Variables**
   - Never commit secrets to version control
   - Use Render's environment variable management
   - Rotate secrets regularly

2. **Database Security**
   - Restrict database access to specific IPs if possible
   - Use strong authentication
   - Enable SSL connections

3. **Application Security**
   - Keep dependencies updated
   - Implement proper input validation
   - Use HTTPS for all communications

Your application should now be ready for deployment on Render with your existing Aiven PostgreSQL database.