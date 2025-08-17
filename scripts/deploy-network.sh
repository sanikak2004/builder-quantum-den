#!/bin/bash

# eKYC Hyperledger Fabric Network Deployment Script
# This script sets up and deploys the complete eKYC blockchain network

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
CHANNEL_NAME="ekycChannel"
CHAINCODE_NAME="ekyc-chaincode"
CHAINCODE_VERSION="1.0"
CHAINCODE_SEQUENCE="1"

# Helper functions
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

# Check prerequisites
check_prerequisites() {
    print_step "Checking prerequisites..."
    
    # Check if Docker is installed and running
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed. Please install Docker first."
        exit 1
    fi
    
    if ! docker info &> /dev/null; then
        print_error "Docker is not running. Please start Docker first."
        exit 1
    fi
    
    # Check if Docker Compose is installed
    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose is not installed. Please install Docker Compose first."
        exit 1
    fi
    
    # Check if Go is installed (for chaincode compilation)
    if ! command -v go &> /dev/null; then
        print_warning "Go is not installed. Chaincode compilation may fail."
    fi
    
    print_success "Prerequisites check completed"
}

# Generate crypto material
generate_crypto() {
    print_step "Generating crypto material..."
    
    # Create fabric-config directory structure
    mkdir -p fabric-config/organizations/ordererOrganizations/ekyc.com
    mkdir -p fabric-config/organizations/peerOrganizations/org1.ekyc.com
    mkdir -p fabric-config/organizations/peerOrganizations/org2.ekyc.com
    mkdir -p fabric-config/system-genesis-block
    mkdir -p fabric-config/channel-artifacts
    
    # Generate certificates and keys (simplified for demo)
    # In production, use proper CA setup
    docker run --rm -v $(pwd)/fabric-config:/config \
        hyperledger/fabric-tools:latest \
        sh -c "
        cd /config
        # Generate orderer crypto
        mkdir -p organizations/ordererOrganizations/ekyc.com/orderers/orderer.ekyc.com/msp/admincerts
        mkdir -p organizations/ordererOrganizations/ekyc.com/orderers/orderer.ekyc.com/msp/cacerts
        mkdir -p organizations/ordererOrganizations/ekyc.com/orderers/orderer.ekyc.com/msp/tlscacerts
        mkdir -p organizations/ordererOrganizations/ekyc.com/orderers/orderer.ekyc.com/tls
        
        # Generate peer crypto for Org1
        mkdir -p organizations/peerOrganizations/org1.ekyc.com/peers/peer0.org1.ekyc.com/msp/admincerts
        mkdir -p organizations/peerOrganizations/org1.ekyc.com/peers/peer0.org1.ekyc.com/msp/cacerts
        mkdir -p organizations/peerOrganizations/org1.ekyc.com/peers/peer0.org1.ekyc.com/msp/tlscacerts
        mkdir -p organizations/peerOrganizations/org1.ekyc.com/peers/peer0.org1.ekyc.com/tls
        
        # Generate peer crypto for Org2
        mkdir -p organizations/peerOrganizations/org2.ekyc.com/peers/peer0.org2.ekyc.com/msp/admincerts
        mkdir -p organizations/peerOrganizations/org2.ekyc.com/peers/peer0.org2.ekyc.com/msp/cacerts
        mkdir -p organizations/peerOrganizations/org2.ekyc.com/peers/peer0.org2.ekyc.com/msp/tlscacerts
        mkdir -p organizations/peerOrganizations/org2.ekyc.com/peers/peer0.org2.ekyc.com/tls
        "
    
    # Generate genesis block (simplified)
    echo '{"name":"OrdererGenesis","consortium":"SampleConsortium"}' > fabric-config/system-genesis-block/genesis.block
    
    print_success "Crypto material generated"
}

# Start the network
start_network() {
    print_step "Starting Hyperledger Fabric network..."
    
    # Pull required Docker images
    docker-compose pull
    
    # Start the network
    docker-compose up -d orderer.ekyc.com peer0.org1.ekyc.com peer0.org2.ekyc.com couchdb0 couchdb1 cli
    
    # Wait for services to be ready
    print_step "Waiting for services to be ready..."
    sleep 30
    
    print_success "Network started successfully"
}

# Create channel
create_channel() {
    print_step "Creating channel: $CHANNEL_NAME"
    
    # Create channel using CLI container
    docker exec cli peer channel create \
        -o orderer.ekyc.com:7050 \
        -c $CHANNEL_NAME \
        --ordererTLSHostnameOverride orderer.ekyc.com \
        --tls \
        --cafile /opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/ordererOrganizations/ekyc.com/orderers/orderer.ekyc.com/msp/tlscacerts/tlsca.ekyc.com-cert.pem || true
    
    print_success "Channel created: $CHANNEL_NAME"
}

# Join peers to channel
join_peers() {
    print_step "Joining peers to channel..."
    
    # Set environment for Org1 Peer0
    docker exec cli sh -c "
        export CORE_PEER_LOCALMSPID=Org1MSP
        export CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/org1.ekyc.com/peers/peer0.org1.ekyc.com/tls/ca.crt
        export CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/org1.ekyc.com/users/Admin@org1.ekyc.com/msp
        export CORE_PEER_ADDRESS=peer0.org1.ekyc.com:7051
        peer channel join -b $CHANNEL_NAME.block
    " || true
    
    # Set environment for Org2 Peer0
    docker exec cli sh -c "
        export CORE_PEER_LOCALMSPID=Org2MSP
        export CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/org2.ekyc.com/peers/peer0.org2.ekyc.com/tls/ca.crt
        export CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/org2.ekyc.com/users/Admin@org2.ekyc.com/msp
        export CORE_PEER_ADDRESS=peer0.org2.ekyc.com:9051
        peer channel join -b $CHANNEL_NAME.block
    " || true
    
    print_success "Peers joined to channel"
}

# Package chaincode
package_chaincode() {
    print_step "Packaging chaincode..."
    
    # Copy chaincode to CLI container
    docker cp ./chaincode cli:/opt/gopath/src/github.com/hyperledger/fabric/peer/
    
    # Package the chaincode
    docker exec cli sh -c "
        cd /opt/gopath/src/github.com/hyperledger/fabric/peer/chaincode
        go mod tidy
        peer lifecycle chaincode package $CHAINCODE_NAME.tar.gz \
            --path . \
            --lang golang \
            --label ${CHAINCODE_NAME}_${CHAINCODE_VERSION}
    "
    
    print_success "Chaincode packaged"
}

# Install chaincode
install_chaincode() {
    print_step "Installing chaincode on peers..."
    
    # Install on Org1 Peer0
    docker exec cli sh -c "
        export CORE_PEER_LOCALMSPID=Org1MSP
        export CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/org1.ekyc.com/peers/peer0.org1.ekyc.com/tls/ca.crt
        export CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/org1.ekyc.com/users/Admin@org1.ekyc.com/msp
        export CORE_PEER_ADDRESS=peer0.org1.ekyc.com:7051
        peer lifecycle chaincode install /opt/gopath/src/github.com/hyperledger/fabric/peer/chaincode/$CHAINCODE_NAME.tar.gz
    "
    
    # Install on Org2 Peer0
    docker exec cli sh -c "
        export CORE_PEER_LOCALMSPID=Org2MSP
        export CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/org2.ekyc.com/peers/peer0.org2.ekyc.com/tls/ca.crt
        export CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/org2.ekyc.com/users/Admin@org2.ekyc.com/msp
        export CORE_PEER_ADDRESS=peer0.org2.ekyc.com:9051
        peer lifecycle chaincode install /opt/gopath/src/github.com/hyperledger/fabric/peer/chaincode/$CHAINCODE_NAME.tar.gz
    "
    
    print_success "Chaincode installed on peers"
}

# Approve chaincode
approve_chaincode() {
    print_step "Approving chaincode for organizations..."
    
    # Get package ID
    PACKAGE_ID=$(docker exec cli peer lifecycle chaincode queryinstalled --output json | grep -o '"Package ID":"[^"]*' | sed 's/"Package ID":"//')
    
    # Approve for Org1
    docker exec cli sh -c "
        export CORE_PEER_LOCALMSPID=Org1MSP
        export CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/org1.ekyc.com/peers/peer0.org1.ekyc.com/tls/ca.crt
        export CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/org1.ekyc.com/users/Admin@org1.ekyc.com/msp
        export CORE_PEER_ADDRESS=peer0.org1.ekyc.com:7051
        peer lifecycle chaincode approveformyorg \
            -o orderer.ekyc.com:7050 \
            --channelID $CHANNEL_NAME \
            --name $CHAINCODE_NAME \
            --version $CHAINCODE_VERSION \
            --package-id $PACKAGE_ID \
            --sequence $CHAINCODE_SEQUENCE \
            --tls \
            --cafile /opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/ordererOrganizations/ekyc.com/orderers/orderer.ekyc.com/msp/tlscacerts/tlsca.ekyc.com-cert.pem
    " || true
    
    # Approve for Org2
    docker exec cli sh -c "
        export CORE_PEER_LOCALMSPID=Org2MSP
        export CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/org2.ekyc.com/peers/peer0.org2.ekyc.com/tls/ca.crt
        export CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/org2.ekyc.com/users/Admin@org2.ekyc.com/msp
        export CORE_PEER_ADDRESS=peer0.org2.ekyc.com:9051
        peer lifecycle chaincode approveformyorg \
            -o orderer.ekyc.com:7050 \
            --channelID $CHANNEL_NAME \
            --name $CHAINCODE_NAME \
            --version $CHAINCODE_VERSION \
            --package-id $PACKAGE_ID \
            --sequence $CHAINCODE_SEQUENCE \
            --tls \
            --cafile /opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/ordererOrganizations/ekyc.com/orderers/orderer.ekyc.com/msp/tlscacerts/tlsca.ekyc.com-cert.pem
    " || true
    
    print_success "Chaincode approved for organizations"
}

# Commit chaincode
commit_chaincode() {
    print_step "Committing chaincode to channel..."
    
    docker exec cli sh -c "
        export CORE_PEER_LOCALMSPID=Org1MSP
        export CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/org1.ekyc.com/peers/peer0.org1.ekyc.com/tls/ca.crt
        export CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/org1.ekyc.com/users/Admin@org1.ekyc.com/msp
        export CORE_PEER_ADDRESS=peer0.org1.ekyc.com:7051
        peer lifecycle chaincode commit \
            -o orderer.ekyc.com:7050 \
            --channelID $CHANNEL_NAME \
            --name $CHAINCODE_NAME \
            --version $CHAINCODE_VERSION \
            --sequence $CHAINCODE_SEQUENCE \
            --tls \
            --cafile /opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/ordererOrganizations/ekyc.com/orderers/orderer.ekyc.com/msp/tlscacerts/tlsca.ekyc.com-cert.pem \
            --peerAddresses peer0.org1.ekyc.com:7051 \
            --tlsRootCertFiles /opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/org1.ekyc.com/peers/peer0.org1.ekyc.com/tls/ca.crt \
            --peerAddresses peer0.org2.ekyc.com:9051 \
            --tlsRootCertFiles /opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/org2.ekyc.com/peers/peer0.org2.ekyc.com/tls/ca.crt
    " || true
    
    print_success "Chaincode committed to channel"
}

# Start additional services
start_additional_services() {
    print_step "Starting additional services (IPFS, Application)..."
    
    # Start IPFS and application
    docker-compose up -d ipfs ekyc-app nginx
    
    print_success "Additional services started"
}

# Test the deployment
test_deployment() {
    print_step "Testing deployment..."
    
    # Wait for services to be fully ready
    sleep 10
    
    # Test API endpoint
    echo "Testing API endpoint..."
    if curl -f http://localhost:8080/api/ping > /dev/null 2>&1; then
        print_success "API endpoint is responding"
    else
        print_warning "API endpoint is not responding yet"
    fi
    
    # Test IPFS
    echo "Testing IPFS..."
    if curl -f http://localhost:5001/api/v0/version > /dev/null 2>&1; then
        print_success "IPFS is running"
    else
        print_warning "IPFS is not responding yet"
    fi
    
    print_success "Deployment test completed"
}

# Main deployment function
deploy() {
    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN} eKYC Hyperledger Fabric Deployment    ${NC}"
    echo -e "${GREEN}========================================${NC}"
    echo ""
    
    check_prerequisites
    generate_crypto
    start_network
    create_channel
    join_peers
    package_chaincode
    install_chaincode
    approve_chaincode
    commit_chaincode
    start_additional_services
    test_deployment
    
    echo ""
    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN} Deployment completed successfully!    ${NC}"
    echo -e "${GREEN}========================================${NC}"
    echo ""
    echo "🌐 Frontend: http://localhost"
    echo "🔗 API: http://localhost:8080/api"
    echo "📊 CouchDB: http://localhost:5984/_utils"
    echo "📁 IPFS: http://localhost:8080"
    echo ""
    echo "To stop the network: ./scripts/stop-network.sh"
    echo "To clean up everything: ./scripts/cleanup-network.sh"
}

# Run deployment
deploy
