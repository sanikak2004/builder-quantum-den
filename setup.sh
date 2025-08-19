#!/bin/bash

echo "🚀 Setting up Authen Ledger - Blockchain eKYC Platform"
echo "======================================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Check if Node.js is installed
check_nodejs() {
    if command -v node &> /dev/null; then
        NODE_VERSION=$(node --version)
        print_status "Node.js is installed: $NODE_VERSION"
        
        # Check if version is 16 or higher
        NODE_MAJOR_VERSION=$(echo $NODE_VERSION | cut -d. -f1 | sed 's/v//')
        if [ "$NODE_MAJOR_VERSION" -ge 16 ]; then
            print_status "Node.js version is compatible (v16+)"
        else
            print_warning "Node.js version should be v16 or higher. Current: $NODE_VERSION"
        fi
    else
        print_error "Node.js is not installed. Please install Node.js v16+ from https://nodejs.org/"
        exit 1
    fi
}

# Check if pnpm is installed
check_pnpm() {
    if command -v pnpm &> /dev/null; then
        PNPM_VERSION=$(pnpm --version)
        print_status "pnpm is installed: v$PNPM_VERSION"
    else
        print_warning "pnpm is not installed. Installing pnpm..."
        npm install -g pnpm
        if [ $? -eq 0 ]; then
            print_status "pnpm installed successfully"
        else
            print_error "Failed to install pnpm. Please install manually: npm install -g pnpm"
            exit 1
        fi
    fi
}

# Install dependencies
install_dependencies() {
    print_info "Installing project dependencies..."
    
    if [ -f "pnpm-lock.yaml" ]; then
        pnpm install --no-frozen-lockfile
    else
        pnpm install
    fi
    
    if [ $? -eq 0 ]; then
        print_status "Dependencies installed successfully"
    else
        print_error "Failed to install dependencies"
        exit 1
    fi
}

# Create environment file if it doesn't exist
create_env_file() {
    if [ ! -f ".env" ]; then
        print_info "Creating environment configuration file..."
        cat > .env << EOF
# Authen Ledger Configuration
PORT=3000
NODE_ENV=development

# Optional: Blockchain Configuration
FABRIC_CHANNEL_NAME=ekycChannel
FABRIC_CHAINCODE_NAME=ekyc-chaincode
FABRIC_MSP_ID=Org1MSP

# Optional: IPFS Configuration
IPFS_API_URL=http://127.0.0.1:5001
IPFS_GATEWAY_URL=https://ipfs.io/ipfs/
EOF
        print_status "Environment file (.env) created"
    else
        print_info "Environment file (.env) already exists"
    fi
}

# Test the application
test_application() {
    print_info "Testing application startup..."
    
    # Start the application in background
    pnpm run dev &
    APP_PID=$!
    
    # Wait a few seconds for startup
    sleep 5
    
    # Check if the application is running
    if kill -0 $APP_PID 2>/dev/null; then
        print_status "Application started successfully!"
        
        # Try to curl the health endpoint
        if command -v curl &> /dev/null; then
            HEALTH_CHECK=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/api/ping 2>/dev/null)
            if [ "$HEALTH_CHECK" = "200" ]; then
                print_status "API health check passed"
            else
                print_warning "API health check failed (this might be normal during startup)"
            fi
        fi
        
        # Stop the test application
        kill $APP_PID 2>/dev/null
        wait $APP_PID 2>/dev/null
        print_info "Test application stopped"
    else
        print_error "Failed to start application"
        exit 1
    fi
}

# Main setup process
main() {
    echo ""
    print_info "Step 1: Checking prerequisites..."
    check_nodejs
    check_pnpm
    
    echo ""
    print_info "Step 2: Installing dependencies..."
    install_dependencies
    
    echo ""
    print_info "Step 3: Setting up configuration..."
    create_env_file
    
    echo ""
    print_info "Step 4: Testing application..."
    test_application
    
    echo ""
    echo "🎉 Setup completed successfully!"
    echo ""
    echo "📋 Next steps:"
    echo "1. Start the application: ${GREEN}pnpm run dev${NC}"
    echo "2. Open your browser: ${BLUE}http://localhost:8080${NC}"
    echo "3. Try the features:"
    echo "   - Homepage: ${BLUE}http://localhost:8080${NC}"
    echo "   - Submit KYC: ${BLUE}http://localhost:8080/submit${NC}"
    echo "   - Admin Panel: ${BLUE}http://localhost:8080/admin${NC}"
    echo ""
    echo "📚 For detailed setup instructions, see: ${YELLOW}INSTALLATION-GUIDE.md${NC}"
    echo "🔗 For blockchain integration, see: ${YELLOW}REAL-BLOCKCHAIN-SETUP.md${NC}"
    echo ""
    echo "🚀 Ready to start your blockchain eKYC journey!"
}

# Run the main setup process
main
