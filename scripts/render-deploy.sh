#!/bin/bash

# Render Production Deployment Script
# This script prepares and deploys the eKYC Blockchain application to Render

echo "🚀 Starting Render Deployment for eKYC Blockchain System..."

# Check if running on Render
if [ "$RENDER" = "true" ]; then
    echo "✅ Running on Render platform"
    
    # Install dependencies
    echo "📦 Installing dependencies..."
    npm install
    
    # Generate Prisma client
    echo "🔧 Generating Prisma client..."
    npx prisma generate
    
    # Run database migrations
    echo "🗄️ Running database migrations..."
    npx prisma migrate deploy
    
    # Build the application
    echo "🏗️ Building application..."
    npm run build:render
    
    echo "✅ Render deployment preparation complete!"
    
else
    echo "⚠️ Not running on Render platform"
    echo "📝 To deploy manually, follow these steps:"
    echo ""
    echo "1. Create PostgreSQL database on Render"
    echo "2. Create Web Service on Render"
    echo "3. Connect GitHub repository"
    echo "4. Set environment variables:"
    echo "   - DATABASE_URL"
    echo "   - NODE_ENV=production"
    echo "   - JWT_SECRET"
    echo "   - BLOCKCHAIN_NETWORK_ID"
    echo "   - IPFS_GATEWAY_URL"
    echo "   - FABRIC_NETWORK_CONFIG"
    echo ""
    echo "5. Use build command: npm run build:render"
    echo "6. Use start command: npm run start:render"
    echo ""
    echo "For detailed instructions, see RENDER-DEPLOYMENT-GUIDE.md"
fi