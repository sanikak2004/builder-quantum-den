#!/bin/bash

# Render Deployment Automation Script
# This script automates the deployment of your eKYC Blockchain System to Render

echo "🚀 Starting Render Deployment Automation..."

# Check if Render CLI is installed
if ! command -v render &> /dev/null
then
    echo "❌ Render CLI not found. Installing Render CLI..."
    npm install -g render-cli
fi

echo "✅ Render CLI is available"

# Create Render project
echo "🏗️ Creating Render project..."
render create --name ekyc-blockchain-app --env node

# Set environment variables
echo "🔐 Setting environment variables..."
render env set DATABASE_URL "postgres://avnadmin:AVNS_ltoOZ6TzwV4Xg61XsSI@blockchain-maskeriya338-1f80.f.aivencloud.com:27251/defaultdb?sslmode=require"
render env set NODE_ENV "production"
render env set JWT_SECRET "super_secure_jwt_secret_key_here_32_characters_min"
render env set ENCRYPTION_KEY "32_character_encryption_key_for_data_protection"

# Set build and start commands
echo "⚙️ Configuring build and start commands..."
render config set buildCommand "npm run build:render"
render config set startCommand "npm run start:render"

# Deploy the application
echo "🚀 Deploying application..."
render deploy

echo "🎉 Deployment initiated! Check your Render dashboard for progress."
echo "🔗 Your application will be available at: https://ekyc-blockchain-app.onrender.com"