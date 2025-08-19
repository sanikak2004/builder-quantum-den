# 🚀 Authen Ledger - Installation Guide

Welcome to **Authen Ledger**, a blockchain-powered eKYC (electronic Know Your Customer) platform built with Hyperledger Fabric technology.

## 📋 Prerequisites

Before you begin, ensure you have the following installed on your system:

### Required Software
- **Node.js** (v16 or higher) - [Download here](https://nodejs.org/)
- **pnpm** (v8 or higher) - [Installation guide](https://pnpm.io/installation)
- **Git** - [Download here](https://git-scm.com/)

### Optional (for full blockchain functionality)
- **Docker** & **Docker Compose** - [Download here](https://www.docker.com/)
- **Go** (v1.19+) - [Download here](https://golang.org/) (for chaincode development)

### Check Prerequisites
```bash
# Check Node.js version
node --version  # Should be v16+

# Check pnpm version  
pnpm --version  # Should be v8+

# Check Git
git --version

# Check Docker (optional)
docker --version
docker-compose --version
```

## 🔄 Installation Steps

### Step 1: Clone the Repository

```bash
# Clone the repository
git clone https://github.com/aryanmaske052005/builder-quantum-den.git

# Navigate to the project directory
cd builder-quantum-den

# Check the repository structure
ls -la
```

### Step 2: Install Dependencies

```bash
# Install all dependencies using pnpm
pnpm install

# If you encounter lockfile issues, use:
pnpm install --no-frozen-lockfile
```

### Step 3: Environment Configuration (Optional)

Create a `.env` file in the root directory for custom configuration:

```bash
# Create environment file
touch .env

# Add configuration (optional)
echo "PORT=3000" >> .env
echo "NODE_ENV=development" >> .env
```

### Step 4: Start the Development Server

```bash
# Start the development server
pnpm run dev
```

The application will start and be available at:
- **Frontend**: `http://localhost:8080`
- **API**: `http://localhost:8080/api`

### Step 5: Verify Installation

Open your browser and navigate to `http://localhost:8080`. You should see:
- ✅ Authen Ledger homepage
- ✅ Navigation menu with Submit KYC, Verify Status, History
- ✅ Statistics dashboard (showing 0 initially)
- ✅ Feature showcase section

## 🎯 Quick Start Guide

### Testing the Application

1. **Homepage**: Visit `http://localhost:8080` to see the main dashboard
2. **Submit KYC**: Go to `/submit` to test the KYC submission form
3. **Admin Panel**: Visit `/admin` to access the verification dashboard
4. **API Health**: Check `http://localhost:8080/api/ping` for API status

### Key Features Available

- ✅ **KYC Submission Form** - Multi-step form with document upload
- ✅ **Admin Verification Panel** - Real-time approval/rejection system
- ✅ **KYC History & Audit Trail** - Complete transaction tracking
- ✅ **Status Verification** - Check KYC application status
- ✅ **Blockchain Integration Ready** - Prepared for real Hyperledger Fabric

## 🛠️ Development Commands

```bash
# Start development server
pnpm run dev

# Build for production
pnpm run build

# Start production server
pnpm start

# Run tests
pnpm test

# Format code
pnpm run format.fix

# Type checking
pnpm run typecheck
```

## 📁 Project Structure

```
authen-ledger/
├── client/                 # Frontend React application
│   ├── components/        # Reusable UI components
│   ├── pages/            # Application pages
│   └── hooks/            # Custom React hooks
├── server/                # Backend Express server
│   ├── blockchain/       # Blockchain integration services
│   └── routes/           # API route handlers
├── shared/               # Shared types and utilities
├── chaincode/            # Hyperledger Fabric chaincode (Go)
├── scripts/              # Deployment and setup scripts
└── public/               # Static assets
```

## 🔧 Configuration Options

### Environment Variables

Create a `.env` file with the following options:

```bash
# Server Configuration
PORT=3000
NODE_ENV=development

# Blockchain Configuration (for future use)
FABRIC_CHANNEL_NAME=ekycChannel
FABRIC_CHAINCODE_NAME=ekyc-chaincode
FABRIC_MSP_ID=Org1MSP

# IPFS Configuration (for future use)
IPFS_API_URL=http://127.0.0.1:5001
IPFS_GATEWAY_URL=https://ipfs.io/ipfs/
```

### Application Features

The application comes with these features enabled by default:

- ✅ **Clean Storage** - No dummy data, only real submissions
- ✅ **Simplified Blockchain Services** - Ready for real integration
- ✅ **Multi-step KYC Form** - Document upload with validation
- ✅ **Admin Dashboard** - Live verification system
- ✅ **Audit Trail** - Complete history tracking
- ✅ **Real-time Updates** - Live status changes

## 🌐 Accessing the Application

### Frontend Routes

- `/` - Homepage with statistics and features
- `/submit` - KYC submission form
- `/verify` - Status verification page
- `/history` - KYC history and audit trail
- `/admin` - Admin verification dashboard
- `/auth/login` - Authentication (prepared)
- `/auth/register` - Registration (prepared)

### API Endpoints

- `GET /api/ping` - Health check
- `GET /api/kyc/stats` - KYC statistics
- `POST /api/kyc/submit` - Submit KYC application
- `GET /api/kyc/verify` - Verify KYC status
- `GET /api/admin/kyc/all` - Get all KYC records (admin)
- `PUT /api/admin/kyc/:id/status` - Update KYC status (admin)
- `GET /api/blockchain/status` - Blockchain service status

## 🚨 Troubleshooting

### Common Issues

**1. Port Already in Use**
```bash
# Kill process using port 8080
npx kill-port 8080

# Or use a different port
PORT=3001 pnpm run dev
```

**2. Dependencies Installation Issues**
```bash
# Clear cache and reinstall
pnpm store prune
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

**3. TypeScript Errors**
```bash
# Run type checking
pnpm run typecheck

# Clear and rebuild
rm -rf dist
pnpm run build
```

**4. Permission Issues (Linux/Mac)**
```bash
# Fix permissions
sudo chown -R $USER:$USER .
chmod +x scripts/*.sh
```

### Getting Help

If you encounter issues:

1. Check the console logs in your browser's developer tools
2. Check the terminal output where you ran `pnpm run dev`
3. Verify all prerequisites are installed correctly
4. Try clearing cache and reinstalling dependencies

## 🔒 Security Notes

- The application is configured for development use
- In production, enable HTTPS and proper authentication
- Configure CORS settings for your domain
- Set up proper environment variable management
- Use secure file upload validation

## 🚀 Next Steps

After successful installation:

1. **Test KYC Submission**: Submit a test KYC application with documents
2. **Try Admin Panel**: Access `/admin` to verify submitted applications
3. **Explore API**: Test the REST API endpoints
4. **Real Blockchain**: Follow `REAL-BLOCKCHAIN-SETUP.md` for full blockchain integration
5. **Customization**: Modify the UI and add your branding

## 📞 Support

- **Documentation**: Check the project files for detailed technical docs
- **Issues**: Report bugs via GitHub issues
- **Features**: Suggest improvements via GitHub discussions

---

## ⚡ Quick Test Commands

```bash
# 1. Clone and setup
git clone https://github.com/aryanmaske052005/builder-quantum-den.git
cd builder-quantum-den
pnpm install

# 2. Start development
pnpm run dev

# 3. Open browser
# Navigate to http://localhost:8080

# 4. Test features
# - Submit KYC: http://localhost:8080/submit
# - Admin Panel: http://localhost:8080/admin
# - API Health: http://localhost:8080/api/ping
```

**🎉 Congratulations!** You now have Authen Ledger running locally. The application is ready for KYC submissions and admin verification workflows.
