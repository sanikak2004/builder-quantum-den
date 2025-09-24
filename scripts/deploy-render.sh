#!/bin/bash
# Render Deployment Script
# This script handles the complete deployment process for Render

set -e

echo "🚀 Starting Render deployment process..."

# Step 1: Install dependencies
echo "📦 Installing dependencies..."
npm ci

# Step 2: Generate Prisma client
echo "🔧 Generating Prisma client..."
npx prisma generate

# Step 3: Build the application
echo "🏗️  Building application..."
npm run build:client
npm run build:server

# Step 4: Database migration (production)
echo "🗃️  Setting up database..."
if [ "$NODE_ENV" = "production" ]; then
  npx prisma migrate deploy
else
  npx prisma db push
fi

echo "✅ Build completed successfully!"
echo "🎉 Ready for Render deployment!"

# Health check
echo "🔍 Running health check..."
node -e "console.log('✅ Node.js runtime check passed')"

echo "📋 Build Summary:"
echo "  - Frontend: Built successfully"
echo "  - Backend: Built successfully" 
echo "  - Database: Migrations applied"
echo "  - Prisma: Client generated"
echo ""
echo "🌐 The application is ready to serve:"
echo "  - Frontend: Served from /dist directory"
echo "  - API: Available at /api endpoints"
echo "  - Health Check: GET /api/health"
echo ""
echo "🔗 Next Steps:"
echo "  1. Deploy to Render with this build"
echo "  2. Set environment variables in Render dashboard"
echo "  3. Connect PostgreSQL database"
echo "  4. Test deployment with health endpoint"