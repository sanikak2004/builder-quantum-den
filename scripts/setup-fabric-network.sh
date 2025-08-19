#!/bin/bash

echo "🚀 Setting up Hyperledger Fabric Network for Authen Ledger"
echo "============================================================"

# Check if Docker is running
if ! docker info >/dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker and try again."
    exit 1
fi

# Check if required tools are installed
check_tool() {
    if ! command -v $1 &> /dev/null; then
        echo "❌ $1 is not installed. Please install it first."
        exit 1
    fi
}

echo "🔍 Checking prerequisites..."
check_tool "docker"
check_tool "docker-compose"

# Create network directory structure
echo "📁 Creating network directory structure..."
mkdir -p server/blockchain/network
mkdir -p server/blockchain/wallet
mkdir -p server/blockchain/crypto-config

cd server/blockchain/network

# Download Hyperledger Fabric binaries and Docker images
echo "📥 Downloading Hyperledger Fabric binaries..."
curl -sSL https://bit.ly/2ysbOFE | bash -s -- 2.5.4 1.5.7

# Create docker-compose file for the network
echo "📝 Creating Docker Compose configuration..."
cat > docker-compose-authen-ledger.yaml << EOF
version: '3.7'

networks:
  authen-ledger:
    name: authen-ledger

services:
  ca.org1.example.com:
    image: hyperledger/fabric-ca:1.5.7
    environment:
      - FABRIC_CA_HOME=/etc/hyperledger/fabric-ca-server
      - FABRIC_CA_SERVER_CA_NAME=ca.org1.example.com
      - FABRIC_CA_SERVER_TLS_ENABLED=false
      - FABRIC_CA_SERVER_PORT=7054
    ports:
      - "7054:7054"
    command: sh -c 'fabric-ca-server start -b admin:adminpw -d'
    volumes:
      - ../crypto-config/peerOrganizations/org1.example.com/ca/:/etc/hyperledger/fabric-ca-server
    container_name: ca.org1.example.com
    networks:
      - authen-ledger

  orderer.example.com:
    image: hyperledger/fabric-orderer:2.5.4
    environment:
      - FABRIC_LOGGING_SPEC=INFO
      - ORDERER_GENERAL_LISTENADDRESS=0.0.0.0
      - ORDERER_GENERAL_LISTENPORT=7050
      - ORDERER_GENERAL_LOCALMSPID=OrdererMSP
      - ORDERER_GENERAL_LOCALMSPDIR=/var/hyperledger/orderer/msp
      - ORDERER_GENERAL_TLS_ENABLED=false
      - ORDERER_GENERAL_BOOTSTRAPMETHOD=none
      - ORDERER_ADMIN_LISTENADDRESS=0.0.0.0:7053
      - ORDERER_ADMIN_TLS_ENABLED=false
    working_dir: /opt/gopath/src/github.com/hyperledger/fabric
    command: orderer
    volumes:
      - ../crypto-config/ordererOrganizations/example.com/orderers/orderer.example.com/msp:/var/hyperledger/orderer/msp
      - ../crypto-config/ordererOrganizations/example.com/orderers/orderer.example.com/tls:/var/hyperledger/orderer/tls
    ports:
      - "7050:7050"
      - "7053:7053"
    container_name: orderer.example.com
    networks:
      - authen-ledger

  peer0.org1.example.com:
    image: hyperledger/fabric-peer:2.5.4
    environment:
      - CORE_VM_ENDPOINT=unix:///host/var/run/docker.sock
      - CORE_VM_DOCKER_HOSTCONFIG_NETWORKMODE=authen-ledger
      - FABRIC_LOGGING_SPEC=INFO
      - CORE_PEER_TLS_ENABLED=false
      - CORE_PEER_PROFILE_ENABLED=false
      - CORE_PEER_TLS_CERT_FILE=/etc/hyperledger/fabric/tls/server.crt
      - CORE_PEER_TLS_KEY_FILE=/etc/hyperledger/fabric/tls/server.key
      - CORE_PEER_TLS_ROOTCERT_FILE=/etc/hyperledger/fabric/tls/ca.crt
      - CORE_PEER_ID=peer0.org1.example.com
      - CORE_PEER_ADDRESS=peer0.org1.example.com:7051
      - CORE_PEER_LISTENADDRESS=0.0.0.0:7051
      - CORE_PEER_CHAINCODEADDRESS=peer0.org1.example.com:7052
      - CORE_PEER_CHAINCODELISTENADDRESS=0.0.0.0:7052
      - CORE_PEER_GOSSIP_BOOTSTRAP=peer0.org1.example.com:7051
      - CORE_PEER_GOSSIP_EXTERNALENDPOINT=peer0.org1.example.com:7051
      - CORE_PEER_LOCALMSPID=Org1MSP
      - CORE_OPERATIONS_LISTENADDRESS=peer0.org1.example.com:9444
      - CORE_METRICS_PROVIDER=prometheus
      - CHAINCODE_AS_A_SERVICE_BUILDER_CONFIG={"peername":"peer0org1"}
      - CORE_CHAINCODE_EXECUTETIMEOUT=300s
    volumes:
      - /var/run/docker.sock:/host/var/run/docker.sock
      - ../crypto-config/peerOrganizations/org1.example.com/peers/peer0.org1.example.com:/etc/hyperledger/fabric
      - peer0.org1.example.com:/var/hyperledger/production
    working_dir: /opt/gopath/src/github.com/hyperledger/fabric/peer
    command: peer node start
    ports:
      - "7051:7051"
      - "9444:9444"
    container_name: peer0.org1.example.com
    networks:
      - authen-ledger

  cli:
    image: hyperledger/fabric-tools:2.5.4
    tty: true
    stdin_open: true
    environment:
      - GOPATH=/opt/gopath
      - CORE_VM_ENDPOINT=unix:///host/var/run/docker.sock
      - FABRIC_LOGGING_SPEC=INFO
      - CORE_PEER_ID=cli
      - CORE_PEER_ADDRESS=peer0.org1.example.com:7051
      - CORE_PEER_LOCALMSPID=Org1MSP
      - CORE_PEER_TLS_ENABLED=false
      - CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp
    working_dir: /opt/gopath/src/github.com/hyperledger/fabric/peer
    command: /bin/bash
    volumes:
      - /var/run/docker.sock:/host/var/run/docker.sock
      - ../crypto-config:/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/
      - ../../chaincode/:/opt/gopath/src/github.com/chaincode/
    container_name: cli
    networks:
      - authen-ledger

volumes:
  peer0.org1.example.com:
EOF

# Create cryptogen config
echo "🔐 Creating cryptographic material configuration..."
cat > crypto-config.yaml << EOF
OrdererOrgs:
  - Name: Orderer
    Domain: example.com
    Specs:
      - Hostname: orderer

PeerOrgs:
  - Name: Org1
    Domain: org1.example.com
    EnableNodeOUs: true
    Template:
      Count: 1
    Users:
      Count: 1
EOF

# Generate cryptographic material
echo "🔑 Generating cryptographic material..."
./bin/cryptogen generate --config=crypto-config.yaml --output="../crypto-config"

# Create configtx.yaml
echo "⚙️  Creating channel configuration..."
cat > configtx.yaml << EOF
Organizations:
  - &OrdererOrg
      Name: OrdererOrg
      ID: OrdererMSP
      MSPDir: ../crypto-config/ordererOrganizations/example.com/msp
      Policies:
        Readers:
          Type: Signature
          Rule: "OR('OrdererMSP.member')"
        Writers:
          Type: Signature
          Rule: "OR('OrdererMSP.member')"
        Admins:
          Type: Signature
          Rule: "OR('OrdererMSP.admin')"

  - &Org1
      Name: Org1MSP
      ID: Org1MSP
      MSPDir: ../crypto-config/peerOrganizations/org1.example.com/msp
      Policies:
        Readers:
          Type: Signature
          Rule: "OR('Org1MSP.admin', 'Org1MSP.peer', 'Org1MSP.client')"
        Writers:
          Type: Signature
          Rule: "OR('Org1MSP.admin', 'Org1MSP.client')"
        Admins:
          Type: Signature
          Rule: "OR('Org1MSP.admin')"
        Endorsement:
          Type: Signature
          Rule: "OR('Org1MSP.peer')"
      AnchorPeers:
        - Host: peer0.org1.example.com
          Port: 7051

Capabilities:
  Channel: &ChannelCapabilities
    V2_0: true
  Orderer: &OrdererCapabilities
    V2_0: true
  Application: &ApplicationCapabilities
    V2_0: true

Application: &ApplicationDefaults
  Organizations:
  Policies:
    Readers:
      Type: ImplicitMeta
      Rule: "ANY Readers"
    Writers:
      Type: ImplicitMeta
      Rule: "ANY Writers"
    Admins:
      Type: ImplicitMeta
      Rule: "MAJORITY Admins"
    LifecycleEndorsement:
      Type: ImplicitMeta
      Rule: "MAJORITY Endorsement"
    Endorsement:
      Type: ImplicitMeta
      Rule: "MAJORITY Endorsement"
  Capabilities:
    <<: *ApplicationCapabilities

Orderer: &OrdererDefaults
  OrdererType: solo
  Addresses:
    - orderer.example.com:7050
  BatchTimeout: 2s
  BatchSize:
    MaxMessageCount: 10
    AbsoluteMaxBytes: 99 MB
    PreferredMaxBytes: 512 KB
  Organizations:
  Policies:
    Readers:
      Type: ImplicitMeta
      Rule: "ANY Readers"
    Writers:
      Type: ImplicitMeta
      Rule: "ANY Writers"
    Admins:
      Type: ImplicitMeta
      Rule: "MAJORITY Admins"
    BlockValidation:
      Type: ImplicitMeta
      Rule: "ANY Writers"

Channel: &ChannelDefaults
  Policies:
    Readers:
      Type: ImplicitMeta
      Rule: "ANY Readers"
    Writers:
      Type: ImplicitMeta
      Rule: "ANY Writers"
    Admins:
      Type: ImplicitMeta
      Rule: "MAJORITY Admins"
  Capabilities:
    <<: *ChannelCapabilities

Profiles:
  AuthenLedgerGenesis:
    <<: *ChannelDefaults
    Orderer:
      <<: *OrdererDefaults
      Organizations:
        - *OrdererOrg
      Capabilities:
        <<: *OrdererCapabilities
    Consortiums:
      SampleConsortium:
        Organizations:
          - *Org1

  eKYCChannel:
    Consortium: SampleConsortium
    <<: *ChannelDefaults
    Application:
      <<: *ApplicationDefaults
      Organizations:
        - *Org1
      Capabilities:
        <<: *ApplicationCapabilities
EOF

# Generate genesis block and channel configuration
echo "🎯 Generating genesis block and channel configuration..."
export FABRIC_CFG_PATH=\$PWD
./bin/configtxgen -profile AuthenLedgerGenesis -channelID system-channel -outputBlock ./system-genesis-block/genesis.block
mkdir -p ./system-genesis-block
./bin/configtxgen -profile AuthenLedgerGenesis -channelID system-channel -outputBlock ./system-genesis-block/genesis.block
./bin/configtxgen -profile eKYCChannel -outputCreateChannelTx ./ekyc-channel.tx -channelID ekycChannel

echo "✅ Hyperledger Fabric network setup completed!"
echo ""
echo "🚀 To start the network:"
echo "   cd server/blockchain/network"
echo "   docker-compose -f docker-compose-authen-ledger.yaml up -d"
echo ""
echo "🔍 To check network status:"
echo "   docker ps"
echo ""
echo "🛑 To stop the network:"
echo "   docker-compose -f docker-compose-authen-ledger.yaml down"
echo ""
echo "📝 Next steps:"
echo "   1. Start the network"
echo "   2. Create and join the channel"
echo "   3. Deploy the eKYC chaincode"
echo "   4. Start the Node.js server"
