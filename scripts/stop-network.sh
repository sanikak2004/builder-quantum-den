#!/bin/bash

# eKYC Hyperledger Fabric Network Stop Script

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_step() {
    echo -e "${BLUE}[STEP]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

echo -e "${YELLOW}========================================${NC}"
echo -e "${YELLOW} Stopping eKYC Hyperledger Fabric Network${NC}"
echo -e "${YELLOW}========================================${NC}"
echo ""

print_step "Stopping all containers..."
docker-compose down

print_step "Stopping any remaining containers..."
docker stop $(docker ps -aq --filter "name=ekyc") 2>/dev/null || true
docker stop $(docker ps -aq --filter "name=peer0.org") 2>/dev/null || true
docker stop $(docker ps -aq --filter "name=orderer.ekyc.com") 2>/dev/null || true
docker stop $(docker ps -aq --filter "name=couchdb") 2>/dev/null || true
docker stop $(docker ps -aq --filter "name=cli") 2>/dev/null || true
docker stop $(docker ps -aq --filter "name=ipfs") 2>/dev/null || true

print_success "Network stopped successfully"

echo ""
echo "Network has been stopped. To start again, run: ./scripts/deploy-network.sh"
echo "To completely clean up, run: ./scripts/cleanup-network.sh"
