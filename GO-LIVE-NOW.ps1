# GO LIVE NOW - Deploy to Render
# This script will guide you through deploying your eKYC Blockchain System to Render

Write-Host "🚀 GO LIVE NOW - eKYC Blockchain System Deployment" -ForegroundColor Green
Write-Host "==================================================" -ForegroundColor Green
Write-Host ""

Write-Host "Step 1: Opening Render Dashboard..." -ForegroundColor Yellow
Start-Process "https://dashboard.render.com/select-repo?type=web"

Write-Host ""
Write-Host "Step 2: Please follow these instructions:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Sign in to Render (or create a free account)" -ForegroundColor Cyan
Write-Host "2. Connect your GitHub account when prompted" -ForegroundColor Cyan
Write-Host "3. Select repository: sanikak2004/builder-quantum-den" -ForegroundColor Cyan
Write-Host "4. Use these configuration settings:" -ForegroundColor Cyan
Write-Host ""
Write-Host "   SERVICE SETTINGS:" -ForegroundColor Magenta
Write-Host "   - Name: ekyc-blockchain-app" -ForegroundColor White
Write-Host "   - Environment: Node" -ForegroundColor White
Write-Host "   - Region: Ohio (or closest to your users)" -ForegroundColor White
Write-Host "   - Branch: main" -ForegroundColor White
Write-Host "   - Build Command: npm run build:render" -ForegroundColor White
Write-Host "   - Start Command: npm run start:render" -ForegroundColor White
Write-Host ""
Write-Host "   ENVIRONMENT VARIABLES:" -ForegroundColor Magenta
Write-Host "   DATABASE_URL=postgres://avnadmin:AVNS_ltoOZ6TzwV4Xg61XsSI@blockchain-maskeriya338-1f80.f.aivencloud.com:27251/defaultdb?sslmode=require" -ForegroundColor White
Write-Host "   NODE_ENV=production" -ForegroundColor White
Write-Host "   JWT_SECRET=super_secure_jwt_secret_key_here_32_characters_min" -ForegroundColor White
Write-Host "   ENCRYPTION_KEY=32_character_encryption_key_for_data_protection" -ForegroundColor White
Write-Host ""
Write-Host "5. Click 'Create Web Service'" -ForegroundColor Cyan
Write-Host "6. Wait 5-10 minutes for deployment to complete" -ForegroundColor Cyan
Write-Host "7. Your app will be live at: https://ekyc-blockchain-app.onrender.com" -ForegroundColor Green
Write-Host ""
Write-Host "🎉 Deployment in progress! Check your browser for the Render dashboard." -ForegroundColor Green

# Pause to keep the window open
Write-Host ""
Write-Host "Press any key to close this window..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")