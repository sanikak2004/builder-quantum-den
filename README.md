[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy)

# 🔗 Authen Ledger - Blockchain eKYC Platform

A complete **electronic Know Your Customer (eKYC) system** built with **React**, **Express**, and **blockchain technology**. This modern platform provides secure identity verification with document management and admin verification workflows.

![eKYC System Architecture](https://img.shields.io/badge/Blockchain-Ready-blue) ![Frontend](https://img.shields.io/badge/Frontend-React%2018-61dafb) ![Backend](https://img.shields.io/badge/Backend-Node.js%20%2B%20Express-green) ![Storage](https://img.shields.io/badge/Ready-IPFS%20%2B%20Hyperledger-orange)

## 🏗️ System Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   React Frontend │    │   Express API    │    │ Hyperledger     │
│   (Port 3000)    │────│   (Port 8080)    │────│ Fabric Network  │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                        │                        │
         │              ┌──────────────────┐               │
         └──────────────│      IPFS        │───────────────┘
                        │   (Port 5001)    │
                        └──────────────────┘
                                 │
                        ┌──────────────────┐
                        │     CouchDB      │
                        │   (Port 5984)    │
                        └──────────────────┘
```

## ✨ Features

### 🔐 Blockchain Security

- **Immutable Records**: All KYC data hashes stored on Hyperledger Fabric
- **Consensus Mechanism**: Multi-peer validation with orderer consensus
- **Audit Trail**: Complete history of all KYC actions recorded on-chain
- **Smart Contracts**: Automated verification and validation logic

### 📄 Document Management

- **IPFS Storage**: Encrypted documents stored off-chain on IPFS
- **Hash Verification**: Document integrity verified via blockchain hashes
- **Multi-format Support**: PDF, JPG, PNG document uploads
- **Secure Access**: Role-based document access control

### 🌐 User Experience

- **Modern Interface**: React 18 with TailwindCSS and Shadcn/UI
- **Real-time Updates**: Live status tracking and notifications
- **Responsive Design**: Mobile-first responsive design
- **Multi-step Forms**: Guided KYC submission process

### 🔍 Verification System

- **Instant Verification**: Real-time KYC status checking
- **Multi-level KYC**: L1, L2, L3 verification levels
- **Blockchain Proof**: Cryptographic verification of authenticity
- **Export Features**: Generate verification certificates

## 🚀 Quick Installation Guide

### Prerequisites

- **Node.js** (v16+) - [Download here](https://nodejs.org/)
- **pnpm** (v8+) - [Installation guide](https://pnpm.io/installation)
- **Git** - [Download here](https://git-scm.com/)

### 1. Clone the Repository

```bash
# Clone the repository
git clone https://github.com/aryanmaske052005/builder-quantum-den.git
cd builder-quantum-den
```

### 2. Install Dependencies

```bash
# Install all dependencies
pnpm install

# If you encounter lockfile issues:
pnpm install --no-frozen-lockfile
```

### 3. Start the Application

```bash
# Start the development server
pnpm run dev
```

### 4. Access the Application

Once started, you can access:

- **🌐 Application**: http://localhost:8080 (Main eKYC interface)
- **📝 KYC Submission**: http://localhost:8080/submit
- **👨‍💼 Admin Panel**: http://localhost:8080/admin
- **🔗 API Health**: http://localhost:8080/api/ping

**📋 Detailed Installation Guide**: See [INSTALLATION-GUIDE.md](./INSTALLATION-GUIDE.md) for comprehensive setup instructions.

## ☁️ Netlify Deployment

### Prerequisites

- A Netlify account
- Access to your GitHub/GitLab/Bitbucket repository

### Deployment Steps

1. **Connect Your Repository to Netlify**
   - Go to [Netlify Dashboard](https://app.netlify.com/)
   - Click "New site from Git"
   - Select your Git provider and repository
   - Configure the build settings:
     - Build command: `npm run netlify-build`
     - Publish directory: `dist/spa`

2. **Set Environment Variables**
   In Netlify Dashboard:
   - Go to Site settings > Environment variables
   - Add the following variables:
     ```
     DATABASE_URL=postgres://avnadmin:AVNS_ltoOZ6TzwV4Xg61XsSI@blockchain-maskeriya338-1f80.f.aivencloud.com:27251/defaultdb?sslmode=require
     NODE_ENV=production
     PORT=8080
     JWT_SECRET=your_super_secure_jwt_secret_here_replace_with_random_string
     ENCRYPTION_KEY=your_32_character_encryption_key_here
     CORS_ALLOWED_ORIGINS=https://your-netlify-app.netlify.app
     ```

3. **Deploy**
   - Click "Deploy site"
   - Wait for the build to complete
   - Your site will be available at the provided Netlify URL

**📋 Detailed Deployment Guide**: See [NETLIFY-DEPLOYMENT-GUIDE.md](./NETLIFY-DEPLOYMENT-GUIDE.md) for comprehensive deployment instructions.

## 📋 Project Structure

```
ekyc-blockchain-system/
├── client/                     # React Frontend
│   ├── pages/                  # Route components
│   │   ├── Index.tsx          # Homepage
│   │   ├── KYCSubmission.tsx  # KYC submission form
│   │   ├── KYCVerification.tsx# Status verification
│   │   ├── KYCHistory.tsx     # Audit trail viewer
│   │   └── Auth.tsx           # Authentication
│   ├── components/ui/         # Reusable UI components
│   └── App.tsx                # Main app with routing
├── server/                    # Express Backend
│   ├── routes/
│   │   ├── kyc.ts            # KYC API endpoints
│   │   └── demo.ts           # Demo endpoints
│   └── index.ts              # Server configuration
├── shared/                    # Shared TypeScript types
│   └── api.ts                # API interfaces
├── chaincode/                 # Hyperledger Fabric Smart Contracts
│   ├── ekyc-chaincode.go     # Main chaincode logic
│   └── go.mod                # Go dependencies
├── scripts/                   # Deployment scripts
│   ├── deploy-network.sh     # Full deployment
│   ├── stop-network.sh       # Stop network
│   └── cleanup-network.sh    # Clean up all resources
├── docker-compose.yaml        # Docker orchestration
├── Dockerfile                 # Application container
└── nginx.conf                 # Reverse proxy config
```

## 🔧 API Endpoints

### KYC Operations

- `POST /api/kyc/submit` - Submit new KYC application
- `GET /api/kyc/verify?id={kycId}` - Verify KYC status
- `GET /api/kyc/verify?pan={panNumber}` - Verify by PAN
- `GET /api/kyc/verify?email={email}` - Verify by email
- `GET /api/kyc/history?kycId={id}` - Get audit trail
- `GET /api/kyc/stats` - Get system statistics

### System Health

- `GET /api/ping` - Health check endpoint

## 🧱 Hyperledger Fabric Network

### Network Components

#### Organizations

- **Orderer Org**: `ekyc.com` - Consensus management
- **Org1**: `org1.ekyc.com` - KYC verification entity
- **Org2**: `org2.ekyc.com` - Regulatory compliance entity

#### Peers

- **peer0.org1.ekyc.com:7051** - Primary peer for Org1
- **peer0.org2.ekyc.com:9051** - Primary peer for Org2

#### Services

- **Orderer**: `orderer.ekyc.com:7050` - Transaction ordering
- **CouchDB**: State database for rich queries
- **CLI**: Command-line interface for network operations

### Chaincode Functions

```go
// Core KYC operations
CreateKYC(kycData string) error
ReadKYC(id string) (*KYCRecord, error)
UpdateKYCStatus(id, status, verifiedBy, remarks string) error

// Query operations
GetKYCByPAN(pan string) ([]*KYCRecord, error)
GetKYCByEmail(email string) ([]*KYCRecord, error)
GetKYCHistory(kycID string) ([]*HistoryEntry, error)

// Verification
VerifyDocumentHash(kycID, documentHash string) (bool, error)
```

## 🔒 Security Features

### Data Protection

- **On-chain**: Only document hashes and metadata
- **Off-chain**: Encrypted documents on IPFS
- **Access Control**: Role-based permissions
- **Audit Trail**: Immutable transaction history

### Network Security

- **TLS Encryption**: All peer-to-peer communication
- **Certificate Authority**: PKI-based identity management
- **Multi-signature**: Consensus-based approvals
- **Rate Limiting**: API request protection

## 🛠️ Development

### Local Development

```bash
# Start development server
pnpm dev

# Build for production
pnpm build

# Run tests
pnpm test

# Type checking
pnpm typecheck
```

### Environment Variables

```bash
# .env file
NODE_ENV=development
FABRIC_NETWORK_PATH=./fabric-config
IPFS_API_URL=http://localhost:5001
COUCHDB_URL=http://admin:adminpw@localhost:5984
```

### Adding New Chaincode Functions

1. Update `chaincode/ekyc-chaincode.go`
2. Increment chaincode version in `scripts/deploy-network.sh`
3. Redeploy: `./scripts/deploy-network.sh`

## 🚢 Deployment

### Local Deployment

```bash
./scripts/deploy-network.sh
```

### Production Deployment

#### Using Docker Swarm

```bash
# Initialize swarm
docker swarm init

# Deploy stack
docker stack deploy -c docker-compose.prod.yaml ekyc
```

#### Using Kubernetes

```bash
# Generate K8s manifests
kompose convert -f docker-compose.yaml

# Deploy to cluster
kubectl apply -f ./k8s/
```

### Cloud Deployment

The system supports deployment on:

- **AWS** (using ECS/EKS)
- **Azure** (using Container Instances/AKS)
- **GCP** (using Cloud Run/GKE)
- **DigitalOcean** (using App Platform)

For cloud deployment guides, see `/docs/deployment/`

## 📊 Monitoring

### Health Checks

- Application: `GET /api/ping`
- Fabric Network: `docker exec cli peer channel list`
- IPFS: `curl http://localhost:5001/api/v0/version`

### Logs

```bash
# Application logs
docker logs ekyc_application

# Fabric peer logs
docker logs peer0.org1.ekyc.com

# Orderer logs
docker logs orderer.ekyc.com
```

### Metrics

- Prometheus metrics exposed on `/metrics`
- Grafana dashboards for visualization
- Custom KYC business metrics

## 🧪 Testing

### Unit Tests

```bash
pnpm test
```

### Integration Tests

```bash
# Test chaincode
cd chaincode && go test ./...

# Test API endpoints
pnpm test:api
```

### Load Testing

```bash
# Install k6
brew install k6

# Run load tests
k6 run tests/load/api-load-test.js
```

## 🔧 Troubleshooting

### Common Issues

#### Network Won't Start

```bash
# Check Docker
docker info

# Clean up and retry
./scripts/cleanup-network.sh
./scripts/deploy-network.sh
```

#### Chaincode Installation Fails

```bash
# Check Go installation
go version

# Verify chaincode syntax
cd chaincode && go build
```

#### IPFS Connection Issues

```bash
# Check IPFS daemon
docker logs ipfs_node

# Reset IPFS data
rm -rf ipfs_data && ./scripts/deploy-network.sh
```

### Debug Mode

```bash
# Enable debug logging
export FABRIC_LOGGING_SPEC=DEBUG
./scripts/deploy-network.sh
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/new-feature`
3. Commit changes: `git commit -am 'Add new feature'`
4. Push to branch: `git push origin feature/new-feature`
5. Submit a Pull Request

### Development Guidelines

- Follow TypeScript best practices
- Write comprehensive tests
- Update documentation for new features
- Follow conventional commit messages

## 📜 License

This project is licensed under the Apache 2.0 License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: [Wiki](../../wiki)
- **Issues**: [GitHub Issues](../../issues)
- **Discussions**: [GitHub Discussions](../../discussions)
- **Email**: support@ekyc-system.com

## 🏆 Acknowledgments

- [Hyperledger Fabric](https://hyperledger-fabric.readthedocs.io/) - Blockchain framework
- [IPFS](https://ipfs.io/) - Distributed storage
- [React](https://reactjs.org/) - Frontend framework
- [TailwindCSS](https://tailwindcss.com/) - CSS framework
- [Shadcn/UI](https://ui.shadcn.com/) - UI components

---

## 🎯 Roadmap

### Phase 1 (Current)

- ✅ Basic KYC submission and verification
- ✅ Hyperledger Fabric integration
- ✅ IPFS document storage
- ✅ React frontend

### Phase 2 (Next)

- 🔄 Advanced authentication (OAuth, SSO)
- 🔄 Role-based access control
- 🔄 Advanced analytics dashboard
- 🔄 Mobile application

### Phase 3 (Future)

- 📋 AI-powered document verification
- 📋 Cross-border KYC sharing
- 📋 Regulatory reporting tools
- 📋 Advanced privacy features

---

**Built with ❤️ for secure digital identity verification**
