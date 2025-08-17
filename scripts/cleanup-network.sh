#!/bin/bash

# eKYC Hyperledger Fabric Network Cleanup Script

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

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

echo -e "${RED}========================================${NC}"
echo -e "${RED} Cleaning up eKYC Hyperledger Fabric   ${NC}"
echo -e "${RED}========================================${NC}"
echo ""

print_warning "This will remove all containers, volumes, and data!"
read -p "Are you sure you want to continue? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Cleanup cancelled."
    exit 1
fi

print_step "Stopping all containers..."
docker-compose down -v

print_step "Removing containers..."
docker rm -f $(docker ps -aq --filter "name=ekyc") 2>/dev/null || true
docker rm -f $(docker ps -aq --filter "name=peer0.org") 2>/dev/null || true
docker rm -f $(docker ps -aq --filter "name=orderer.ekyc.com") 2>/dev/null || true
docker rm -f $(docker ps -aq --filter "name=couchdb") 2>/dev/null || true
docker rm -f $(docker ps -aq --filter "name=cli") 2>/dev/null || true
docker rm -f $(docker ps -aq --filter "name=ipfs") 2>/dev/null || true

print_step "Removing volumes..."
docker volume rm -f $(docker volume ls -q --filter "name=ekyc") 2>/dev/null || true
docker volume rm -f orderer.ekyc.com 2>/dev/null || true
docker volume rm -f peer0.org1.ekyc.com 2>/dev/null || true
docker volume rm -f peer0.org2.ekyc.com 2>/dev/null || true
docker volume rm -f couchdb0 2>/dev/null || true
docker volume rm -f couchdb1 2>/dev/null || true

print_step "Removing networks..."
docker network rm ekyc_network 2>/dev/null || true

print_step "Cleaning up generated files..."
rm -rf fabric-config/
rm -rf ipfs_data/
rm -rf ipfs_staging/
rm -f *.block
rm -f *.tx

print_step "Pruning unused Docker resources..."
docker system prune -f

print_success "Cleanup completed successfully"

echo ""
echo "All eKYC network components have been cleaned up."
echo "To deploy a fresh network, run: ./scripts/deploy-network.sh"
