# Netlify Deployment Checklist

## ✅ Pre-Deployment Verification
- [x] Database connection verified
- [x] Prisma client working correctly
- [x] API endpoints tested and functional
- [x] Environment variables configured
- [x] Netlify functions properly set up

## 🚀 Deployment Steps

### 1. Final Code Preparation
- [ ] Ensure all environment variables are in netlify.env
- [ ] Verify package.json dependencies include @prisma/client
- [ ] Confirm netlify.toml configuration is correct
- [ ] Test build process locally: `npm run netlify-build`

### 2. Netlify Setup
- [ ] Connect repository to Netlify
- [ ] Set build command to: `npm run netlify-build`
- [ ] Set publish directory to: `dist/spa`
- [ ] Configure environment variables in Netlify dashboard:
  - DATABASE_URL
  - NODE_ENV=production
  - PORT=8080
  - JWT_SECRET
  - ENCRYPTION_KEY
  - CORS_ALLOWED_ORIGINS

### 3. Deploy
- [ ] Trigger initial deployment
- [ ] Monitor build logs for errors
- [ ] Verify deployment success

### 4. Post-Deployment Testing
- [ ] Test API endpoints: `/api/ping`, `/api/health`
- [ ] Verify database connectivity through API
- [ ] Test admin panel functionality
- [ ] Check KYC submission and verification flow
- [ ] Verify document handling

## 🔧 Troubleshooting Guide

### Common Issues
1. **Database Connection Failed**
   - Check DATABASE_URL in Netlify environment variables
   - Verify database is accessible from internet
   - Ensure credentials are correct

2. **API Endpoints Not Working**
   - Verify netlify.toml redirects are correct
   - Check function logs in Netlify dashboard
   - Ensure API routes are prefixed with `/api/`

3. **Build Failures**
   - Check Prisma client generation
   - Verify Node.js version compatibility
   - Ensure all dependencies are correctly listed

### Monitoring
- [ ] Set up Netlify analytics
- [ ] Configure error tracking
- [ ] Monitor function execution logs
- [ ] Set up uptime monitoring

## 🎯 Success Criteria
- [ ] Application loads without errors
- [ ] Admin panel displays KYC records
- [ ] Database queries return correct data
- [ ] API endpoints respond with JSON (not HTML)
- [ ] All functionality works as expected