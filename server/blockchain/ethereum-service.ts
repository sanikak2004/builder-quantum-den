import Web3 from 'web3';
import crypto from 'crypto';

// Contract ABI - In production, this would be imported from compiled contracts
const KYC_CONTRACT_ABI = [
  {
    "inputs": [],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "bytes32",
        "name": "kycId",
        "type": "bytes32"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "organization",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "expiryTime",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "timestamp",
        "type": "uint256"
      }
    ],
    "name": "AccessGranted",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "bytes32",
        "name": "kycId",
        "type": "bytes32"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "newDocumentHash",
        "type": "string"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "version",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "timestamp",
        "type": "uint256"
      }
    ],
    "name": "DocumentUpdated",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "bytes32",
        "name": "kycId",
        "type": "bytes32"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "user",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "documentHash",
        "type": "string"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "timestamp",
        "type": "uint256"
      }
    ],
    "name": "KYCSubmitted",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "bytes32",
        "name": "kycId",
        "type": "bytes32"
      },
      {
        "indexed": false,
        "internalType": "enum KYCRegistry.KYCStatus",
        "name": "newStatus",
        "type": "uint8"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "verifier",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "timestamp",
        "type": "uint256"
      }
    ],
    "name": "KYCStatusUpdated",
    "type": "event"
  },
  {
    "inputs": [
      {
        "internalType": "bytes32",
        "name": "kycId",
        "type": "bytes32"
      }
    ],
    "name": "checkCitizenshipStatus",
    "outputs": [
      {
        "internalType": "bool",
        "name": "isIndianCitizen",
        "type": "bool"
      },
      {
        "internalType": "uint256",
        "name": "lastUpdated",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "bytes32",
        "name": "kycId",
        "type": "bytes32"
      }
    ],
    "name": "getKYCRecord",
    "outputs": [
      {
        "internalType": "address",
        "name": "userAddress",
        "type": "address"
      },
      {
        "internalType": "enum KYCRegistry.KYCStatus",
        "name": "status",
        "type": "uint8"
      },
      {
        "internalType": "enum KYCRegistry.VerificationLevel",
        "name": "level",
        "type": "uint8"
      },
      {
        "internalType": "uint256",
        "name": "submittedAt",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "verifiedAt",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "version",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "bytes32",
        "name": "kycId",
        "type": "bytes32"
      },
      {
        "internalType": "address",
        "name": "organization",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "expiryTime",
        "type": "uint256"
      }
    ],
    "name": "grantAccess",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "bytes32",
        "name": "kycId",
        "type": "bytes32"
      },
      {
        "internalType": "string",
        "name": "documentHash",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "ipfsHash",
        "type": "string"
      }
    ],
    "name": "submitKYC",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "bytes32",
        "name": "kycId",
        "type": "bytes32"
      },
      {
        "internalType": "string",
        "name": "newDocumentHash",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "newIpfsHash",
        "type": "string"
      }
    ],
    "name": "updateDocuments",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "bytes32",
        "name": "kycId",
        "type": "bytes32"
      },
      {
        "internalType": "enum KYCRegistry.KYCStatus",
        "name": "status",
        "type": "uint8"
      },
      {
        "internalType": "enum KYCRegistry.VerificationLevel",
        "name": "level",
        "type": "uint8"
      }
    ],
    "name": "updateKYCStatus",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "bytes32",
        "name": "kycId",
        "type": "bytes32"
      }
    ],
    "name": "verifyKYC",
    "outputs": [
      {
        "internalType": "address",
        "name": "userAddress",
        "type": "address"
      },
      {
        "internalType": "enum KYCRegistry.KYCStatus",
        "name": "status",
        "type": "uint8"
      },
      {
        "internalType": "enum KYCRegistry.VerificationLevel",
        "name": "level",
        "type": "uint8"
      },
      {
        "internalType": "uint256",
        "name": "verifiedAt",
        "type": "uint256"
      },
      {
        "internalType": "string",
        "name": "documentHash",
        "type": "string"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
];

interface EthereumKYCData {
  kycId: string;
  personalInfo: any;
  documents: any[];
  userWalletAddress?: string;
}

interface EthereumUpdateData {
  kycId: string;
  status: 'VERIFIED' | 'REJECTED';
  verifiedBy: string;
  remarks?: string;
}

export class EthereumService {
  private static instance: EthereumService;
  private web3: Web3 | null = null;
  private contract: any = null;
  private connected: boolean = false;
  private networkId: number = 0;

  // Configuration from environment variables
  private readonly RPC_URL = process.env.ETHEREUM_RPC_URL || 'https://sepolia.infura.io/v3/YOUR_INFURA_PROJECT_ID';
  private readonly CONTRACT_ADDRESS = process.env.KYC_CONTRACT_ADDRESS || '';
  private readonly PRIVATE_KEY = process.env.ETHEREUM_PRIVATE_KEY || '';
  private readonly CHAIN_ID = parseInt(process.env.ETHEREUM_CHAIN_ID || '11155111'); // Sepolia testnet

  constructor() {
    console.log('🔗 Ethereum service initialized - ready for real blockchain integration');
  }

  static getInstance(): EthereumService {
    if (!EthereumService.instance) {
      EthereumService.instance = new EthereumService();
    }
    return EthereumService.instance;
  }

  async initializeConnection(): Promise<void> {
    try {
      console.log('🔄 Initializing Ethereum blockchain connection...');

      // Initialize Web3 with provider
      this.web3 = new Web3(this.RPC_URL);

      // Verify connection
      const isConnected = await this.web3.eth.net.isListening();
      if (!isConnected) {
        throw new Error('Failed to connect to Ethereum network');
      }

      // Get network ID
      this.networkId = await this.web3.eth.net.getId();
      console.log(`📡 Connected to Ethereum network (Chain ID: ${this.networkId})`);

      // Initialize contract if address is provided
      if (this.CONTRACT_ADDRESS) {
        this.contract = new this.web3.eth.Contract(KYC_CONTRACT_ABI, this.CONTRACT_ADDRESS);
        console.log(`📄 KYC contract initialized at: ${this.CONTRACT_ADDRESS}`);
      } else {
        console.warn('⚠️  KYC contract address not provided. Deploy contract first.');
      }

      this.connected = true;
      console.log('�� Ethereum service ready for real blockchain integration');
    } catch (error) {
      console.error('❌ Failed to initialize Ethereum service:', error);
      throw error;
    }
  }

  async submitKYC(kycData: EthereumKYCData): Promise<any> {
    try {
      if (!this.isConnected() || !this.contract) {
        return {
          success: false,
          error: 'Ethereum service not connected or contract not initialized'
        };
      }

      console.log('📝 Submitting KYC to Ethereum blockchain...');

      // Generate KYC ID hash
      const kycIdHash = this.web3!.utils.keccak256(kycData.kycId);

      // Generate document hash
      const documentData = JSON.stringify({
        personalInfo: kycData.personalInfo,
        documents: kycData.documents.map(doc => ({
          type: doc.type,
          documentHash: doc.documentHash,
          ipfsHash: doc.ipfsHash
        }))
      });
      const documentHash = crypto.createHash('sha256').update(documentData).digest('hex');

      // Generate IPFS hash (simplified - in real implementation, this would be the actual IPFS hash)
      const ipfsHash = `Qm${crypto.createHash('sha256').update(documentData).digest('hex').substring(0, 44)}`;

      // Prepare transaction
      const account = this.web3!.eth.accounts.privateKeyToAccount(this.PRIVATE_KEY);
      this.web3!.eth.accounts.wallet.add(account);

      const gasEstimate = await this.contract.methods
        .submitKYC(kycIdHash, documentHash, ipfsHash)
        .estimateGas({ from: account.address });

      const gasPrice = await this.web3!.eth.getGasPrice();

      // Send transaction
      const result = await this.contract.methods
        .submitKYC(kycIdHash, documentHash, ipfsHash)
        .send({
          from: account.address,
          gas: Math.floor(gasEstimate * 1.2), // Add 20% buffer
          gasPrice: gasPrice
        });

      console.log(`✅ KYC submitted to blockchain: ${result.transactionHash}`);

      return {
        success: true,
        txId: result.transactionHash,
        blockNumber: result.blockNumber,
        gasUsed: result.gasUsed,
        message: 'KYC record submitted to Ethereum blockchain',
        kycId: kycData.kycId,
        contractAddress: this.CONTRACT_ADDRESS
      };

    } catch (error) {
      console.error('❌ Failed to submit KYC to blockchain:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown blockchain error'
      };
    }
  }

  async updateKYCStatus(updateData: EthereumUpdateData): Promise<any> {
    try {
      if (!this.isConnected() || !this.contract) {
        return {
          success: false,
          error: 'Ethereum service not connected or contract not initialized'
        };
      }

      console.log(`🔄 Updating KYC status on blockchain: ${updateData.kycId} -> ${updateData.status}`);

      const kycIdHash = this.web3!.utils.keccak256(updateData.kycId);
      
      // Map status to enum values
      const statusEnum = updateData.status === 'VERIFIED' ? 1 : 2; // PENDING=0, VERIFIED=1, REJECTED=2, EXPIRED=3
      const levelEnum = updateData.status === 'VERIFIED' ? 2 : 1; // L1=0, L2=1, L3=2

      // Prepare transaction
      const account = this.web3!.eth.accounts.privateKeyToAccount(this.PRIVATE_KEY);
      this.web3!.eth.accounts.wallet.add(account);

      const gasEstimate = await this.contract.methods
        .updateKYCStatus(kycIdHash, statusEnum, levelEnum)
        .estimateGas({ from: account.address });

      const gasPrice = await this.web3!.eth.getGasPrice();

      // Send transaction
      const result = await this.contract.methods
        .updateKYCStatus(kycIdHash, statusEnum, levelEnum)
        .send({
          from: account.address,
          gas: Math.floor(gasEstimate * 1.2),
          gasPrice: gasPrice
        });

      console.log(`✅ KYC status updated on blockchain: ${result.transactionHash}`);

      return {
        success: true,
        txId: result.transactionHash,
        blockNumber: result.blockNumber,
        gasUsed: result.gasUsed,
        message: `KYC status updated to ${updateData.status} on blockchain`
      };

    } catch (error) {
      console.error('❌ Failed to update KYC status on blockchain:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown blockchain error'
      };
    }
  }

  async queryKYC(kycId: string): Promise<any> {
    try {
      if (!this.isConnected() || !this.contract) {
        return {
          success: false,
          error: 'Ethereum service not connected or contract not initialized'
        };
      }

      console.log(`🔍 Querying KYC from blockchain: ${kycId}`);

      const kycIdHash = this.web3!.utils.keccak256(kycId);
      
      const result = await this.contract.methods.getKYCRecord(kycIdHash).call();

      return {
        success: true,
        data: {
          userAddress: result.userAddress,
          status: this.mapStatusFromEnum(result.status),
          level: this.mapLevelFromEnum(result.level),
          submittedAt: new Date(parseInt(result.submittedAt) * 1000).toISOString(),
          verifiedAt: result.verifiedAt > 0 ? new Date(parseInt(result.verifiedAt) * 1000).toISOString() : null,
          version: parseInt(result.version)
        },
        message: 'KYC record retrieved from blockchain'
      };

    } catch (error) {
      console.error('❌ Failed to query KYC from blockchain:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown blockchain error'
      };
    }
  }

  async checkCitizenshipStatus(kycId: string): Promise<any> {
    try {
      if (!this.isConnected() || !this.contract) {
        return {
          success: false,
          error: 'Ethereum service not connected or contract not initialized'
        };
      }

      const kycIdHash = this.web3!.utils.keccak256(kycId);
      
      const result = await this.contract.methods.checkCitizenshipStatus(kycIdHash).call();

      return {
        success: true,
        isIndianCitizen: result.isIndianCitizen,
        lastUpdated: new Date(parseInt(result.lastUpdated) * 1000).toISOString(),
        message: 'Citizenship status retrieved from blockchain'
      };

    } catch (error) {
      console.error('❌ Failed to check citizenship status:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown blockchain error'
      };
    }
  }

  async grantAccess(kycId: string, organizationAddress: string, expiryHours: number = 24): Promise<any> {
    try {
      if (!this.isConnected() || !this.contract) {
        return {
          success: false,
          error: 'Ethereum service not connected or contract not initialized'
        };
      }

      const kycIdHash = this.web3!.utils.keccak256(kycId);
      const expiryTime = Math.floor(Date.now() / 1000) + (expiryHours * 3600);

      // Prepare transaction
      const account = this.web3!.eth.accounts.privateKeyToAccount(this.PRIVATE_KEY);
      this.web3!.eth.accounts.wallet.add(account);

      const gasEstimate = await this.contract.methods
        .grantAccess(kycIdHash, organizationAddress, expiryTime)
        .estimateGas({ from: account.address });

      const gasPrice = await this.web3!.eth.getGasPrice();

      // Send transaction
      const result = await this.contract.methods
        .grantAccess(kycIdHash, organizationAddress, expiryTime)
        .send({
          from: account.address,
          gas: Math.floor(gasEstimate * 1.2),
          gasPrice: gasPrice
        });

      return {
        success: true,
        txId: result.transactionHash,
        expiryTime: new Date(expiryTime * 1000).toISOString(),
        message: 'Access granted on blockchain'
      };

    } catch (error) {
      console.error('❌ Failed to grant access on blockchain:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown blockchain error'
      };
    }
  }

  async getContractStats(): Promise<any> {
    try {
      if (!this.isConnected() || !this.contract) {
        return {
          success: false,
          error: 'Service not connected'
        };
      }

      const stats = await this.contract.methods.getStats().call();

      return {
        success: true,
        data: {
          totalRecords: parseInt(stats.total),
          verifiedRecords: parseInt(stats.verified),
          pendingRecords: parseInt(stats.pending),
          rejectedRecords: parseInt(stats.rejected)
        }
      };

    } catch (error) {
      console.error('❌ Failed to get contract stats:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async getNetworkInfo(): Promise<any> {
    try {
      if (!this.web3) {
        return null;
      }

      const networkId = await this.web3.eth.net.getId();
      const blockNumber = await this.web3.eth.getBlockNumber();
      const gasPrice = await this.web3.eth.getGasPrice();

      return {
        networkId,
        chainId: this.CHAIN_ID,
        blockNumber: parseInt(blockNumber.toString()),
        gasPrice: this.web3.utils.fromWei(gasPrice, 'gwei') + ' gwei',
        contractAddress: this.CONTRACT_ADDRESS
      };

    } catch (error) {
      console.error('Failed to get network info:', error);
      return null;
    }
  }

  private mapStatusFromEnum(status: number): string {
    const statusMap = ['PENDING', 'VERIFIED', 'REJECTED', 'EXPIRED'];
    return statusMap[status] || 'UNKNOWN';
  }

  private mapLevelFromEnum(level: number): string {
    const levelMap = ['L1', 'L2', 'L3'];
    return levelMap[level] || 'L1';
  }

  isConnected(): boolean {
    return this.connected && this.web3 !== null;
  }

  async disconnect(): Promise<void> {
    this.connected = false;
    this.web3 = null;
    this.contract = null;
    console.log('🔌 Ethereum service disconnected');
  }
}

// Export singleton instance
export const ethereumService = EthereumService.getInstance();
