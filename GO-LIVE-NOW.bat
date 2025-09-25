@echo off
title GO LIVE NOW - eKYC Blockchain Deployment

color 0A

echo 🚀 GO LIVE NOW - eKYC Blockchain System Deployment
echo ==================================================
echo.

echo Step 1: Opening Render Dashboard...
start https://dashboard.render.com/select-repo?type=web

echo.
echo Step 2: Please follow these instructions:
echo.
echo 1. Sign in to Render (or create a free account)
echo 2. Connect your GitHub account when prompted
echo 3. Select repository: sanikak2004/builder-quantum-den
echo 4. Use these configuration settings:
echo.
echo    SERVICE SETTINGS:
echo    - Name: ekyc-blockchain-app
echo    - Environment: Node
echo    - Region: Ohio (or closest to your users)
echo    - Branch: main
echo    - Build Command: npm run build:render
echo    - Start Command: npm run start:render
echo.
echo    ENVIRONMENT VARIABLES:
echo    DATABASE_URL=postgres://avnadmin:AVNS_ltoOZ6TzwV4Xg61XsSI@blockchain-maskeriya338-1f80.f.aivencloud.com:27251/defaultdb?sslmode=require
echo    NODE_ENV=production
echo    JWT_SECRET=super_secure_jwt_secret_key_here_32_characters_min
echo    ENCRYPTION_KEY=32_character_encryption_key_for_data_protection
echo.
echo 5. Click 'Create Web Service'
echo 6. Wait 5-10 minutes for deployment to complete
echo 7. Your app will be live at: https://ekyc-blockchain-app.onrender.com
echo.
echo 🎉 Deployment in progress! Check your browser for the Render dashboard.
echo.
echo Press any key to close this window...
pause >nul