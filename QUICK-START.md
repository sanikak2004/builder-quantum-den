# ⚡ Quick Start Guide - Authen Ledger

Get up and running with Authen Ledger in under 5 minutes!

## 🎯 One-Command Setup

```bash
# Clone, install, and setup everything
git clone https://github.com/aryanmaske052005/builder-quantum-den.git && \
cd builder-quantum-den && \
chmod +x setup.sh && \
./setup.sh
```

## 📋 Manual Setup (Step by Step)

### 1. Clone the Repository
```bash
git clone https://github.com/aryanmaske052005/builder-quantum-den.git
cd builder-quantum-den
```

### 2. Install Dependencies
```bash
pnpm install
```

### 3. Start the Application
```bash
pnpm run dev
```

### 4. Open in Browser
```
http://localhost:8080
```

## 🎮 Try These Features

### 📝 Submit a KYC Application
1. Go to `http://localhost:8080/submit`
2. Fill out the multi-step form
3. Upload sample documents (PDF, JPG, PNG)
4. Submit and get your KYC ID

### 👨‍💼 Verify as Admin
1. Go to `http://localhost:8080/admin`
2. See submitted applications
3. Click "Review" to see details
4. Approve or reject applications
5. Watch real-time status updates

### 📊 Check Status
1. Go to `http://localhost:8080/verify`
2. Enter your KYC ID or PAN number
3. See current verification status
4. View complete details

### 📈 View History
1. Go to `http://localhost:8080/history`
2. Enter KYC ID to see audit trail
3. View all actions and timestamps
4. Export history as CSV

## 🛠️ Development Commands

```bash
# Start development server
pnpm run dev

# Build for production
pnpm run build

# Start production server
pnpm start

# Run type checking
pnpm run typecheck

# Format code
pnpm run format.fix
```

## 🔧 API Testing

Test the REST API endpoints:

```bash
# Health check
curl http://localhost:8080/api/ping

# Get KYC statistics
curl http://localhost:8080/api/kyc/stats

# Check blockchain status
curl http://localhost:8080/api/blockchain/status
```

## 📁 Important Files

- `client/` - Frontend React application
- `server/` - Backend Express API
- `shared/` - Shared types and interfaces
- `INSTALLATION-GUIDE.md` - Detailed setup instructions
- `REAL-BLOCKCHAIN-SETUP.md` - Full blockchain integration

## 🚨 Troubleshooting

### Port Already in Use
```bash
npx kill-port 8080
pnpm run dev
```

### Dependencies Issues
```bash
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

### Permission Issues (Linux/Mac)
```bash
chmod +x setup.sh
chmod +x scripts/*.sh
```

## 🎯 What's Included

✅ **Clean, Functional Application** - No dummy data, real workflows  
✅ **Modern UI** - React 18 + TailwindCSS + Shadcn/UI  
✅ **Complete KYC Flow** - Submit → Admin Review → Verification  
✅ **Real-time Updates** - Live status changes and notifications  
✅ **Document Upload** - File processing and validation  
✅ **Admin Dashboard** - Verification and management tools  
✅ **Audit Trail** - Complete history tracking  
✅ **Blockchain Ready** - Prepared for real Hyperledger Fabric integration  

## 🔗 Next Steps

1. **Explore the Application** - Try all the features
2. **Customize the UI** - Modify branding and styling
3. **Add Real Blockchain** - Follow `REAL-BLOCKCHAIN-SETUP.md`
4. **Deploy to Production** - Use the deployment guides

---

**🎉 You're ready to go! Start building your blockchain eKYC solution.**
