# Render Deployment Configuration
# This file contains the configuration needed for deploying to Render

## Service Configuration
- **Service Type**: Web Service
- **Build Command**: `npm run build:render`
- **Start Command**: `npm start`
- **Node Version**: 20.x
- **Environment**: Production

## Database Configuration
- **Database**: PostgreSQL 15
- **Connection**: External Database URL
- **Migration**: Automatic on deploy

## Environment Variables Required:
- `DATABASE_URL`: PostgreSQL connection string
- `NODE_ENV`: production
- `PORT`: Auto-assigned by Render
- `VITE_API_URL`: https://your-service-name.onrender.com

## Deployment Steps:
1. Connect GitHub repository to Render
2. Create PostgreSQL database service
3. Create web service with above configuration
4. Add environment variables
5. Deploy

## Health Check Endpoint:
- `GET /api/health` - Returns system status

## Static Files:
- Frontend assets served from `/dist` directory
- API routes prefixed with `/api`

## Scaling:
- **Instance Type**: Starter (1GB RAM)
- **Auto-scaling**: Enabled
- **Max Instances**: 3

## Domain:
- Default: `https://your-service-name.onrender.com`
- Custom domain can be configured

## Features Enabled:
- ✅ Automatic HTTPS
- ✅ CDN for static assets  
- ✅ Health checks
- ✅ Auto-deploys from main branch
- ✅ Build cache optimization
- ✅ Environment-based configuration