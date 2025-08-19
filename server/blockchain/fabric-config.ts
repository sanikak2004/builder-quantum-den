import { Gateway, Wallets, Contract, Network } from 'fabric-network';
import * as path from 'path';
import * as fs from 'fs';

export interface FabricConfig {
  channelName: string;
  chaincodeName: string;
  mspId: string;
  walletPath: string;
  connectionProfilePath: string;
  certificatePath: string;
  privateKeyPath: string;
}

export class HyperledgerFabricService {
  private gateway: Gateway | null = null;
  private contract: Contract | null = null;
  private network: Network | null = null;
  private config: FabricConfig;

  constructor() {
    this.config = {
      channelName: process.env.FABRIC_CHANNEL_NAME || 'ekycChannel',
      chaincodeName: process.env.FABRIC_CHAINCODE_NAME || 'ekyc-chaincode',
      mspId: process.env.FABRIC_MSP_ID || 'Org1MSP',
      walletPath: path.join(process.cwd(), 'server/blockchain/wallet'),
      connectionProfilePath: path.join(process.cwd(), 'server/blockchain/connection-profile.json'),
      certificatePath: path.join(process.cwd(), 'server/blockchain/crypto-config/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp/signcerts/cert.pem'),
      privateKeyPath: path.join(process.cwd(), 'server/blockchain/crypto-config/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp/keystore/priv_sk')
    };
  }

  async initializeConnection(): Promise<void> {
    try {
      console.log('🔗 Initializing Hyperledger Fabric connection...');

      // Create wallet and add admin identity
      const wallet = await Wallets.newFileSystemWallet(this.config.walletPath);
      
      // Check if admin identity exists
      const adminExists = await wallet.get('admin');
      if (!adminExists) {
        console.log('📋 Creating admin identity in wallet...');
        await this.createAdminIdentity(wallet);
      }

      // Load connection profile
      const connectionProfile = this.loadConnectionProfile();

      // Create gateway
      this.gateway = new Gateway();
      await this.gateway.connect(connectionProfile, {
        wallet,
        identity: 'admin',
        discovery: { enabled: true, asLocalhost: true }
      });

      // Get network and contract
      this.network = await this.gateway.getNetwork(this.config.channelName);
      this.contract = this.network.getContract(this.config.chaincodeName);

      console.log('✅ Hyperledger Fabric connection established successfully');
    } catch (error) {
      console.error('❌ Failed to initialize Hyperledger Fabric connection:', error);
      throw new Error(`Fabric initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async createAdminIdentity(wallet: any): Promise<void> {
    try {
      // Read certificate and private key
      const cert = fs.readFileSync(this.config.certificatePath).toString();
      const key = fs.readFileSync(this.config.privateKeyPath).toString();

      const identity = {
        credentials: {
          certificate: cert,
          privateKey: key,
        },
        mspId: this.config.mspId,
        type: 'X.509',
      };

      await wallet.put('admin', identity);
      console.log('✅ Admin identity created in wallet');
    } catch (error) {
      console.error('❌ Failed to create admin identity:', error);
      throw error;
    }
  }

  private loadConnectionProfile(): any {
    try {
      const connectionProfilePath = this.config.connectionProfilePath;
      const connectionProfile = JSON.parse(fs.readFileSync(connectionProfilePath, 'utf8'));
      return connectionProfile;
    } catch (error) {
      console.error('❌ Failed to load connection profile:', error);
      // Return default connection profile if file doesn't exist
      return this.getDefaultConnectionProfile();
    }
  }

  private getDefaultConnectionProfile(): any {
    return {
      "name": "authen-ledger-network",
      "version": "1.0.0",
      "client": {
        "organization": "Org1",
        "connection": {
          "timeout": {
            "peer": {
              "endorser": "300"
            }
          }
        }
      },
      "organizations": {
        "Org1": {
          "mspid": "Org1MSP",
          "peers": [
            "peer0.org1.example.com"
          ],
          "certificateAuthorities": [
            "ca.org1.example.com"
          ]
        }
      },
      "peers": {
        "peer0.org1.example.com": {
          "url": "grpc://localhost:7051"
        }
      },
      "certificateAuthorities": {
        "ca.org1.example.com": {
          "url": "http://localhost:7054",
          "caName": "ca.org1.example.com"
        }
      }
    };
  }

  async submitKYC(kycData: any, documentHashes: string[]): Promise<any> {
    try {
      if (!this.contract) {
        throw new Error('Fabric contract not initialized');
      }

      console.log('📝 Submitting KYC to Hyperledger Fabric...');

      const kycRecord = {
        id: kycData.id || `kyc_${Date.now()}`,
        userId: kycData.userId,
        name: kycData.name,
        email: kycData.email,
        phone: kycData.phone,
        pan: kycData.pan,
        dateOfBirth: kycData.dateOfBirth,
        address: JSON.stringify(kycData.address),
        documentHashes: JSON.stringify(documentHashes),
        status: 'PENDING',
        verificationLevel: 'L1',
        submittedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Submit transaction to chaincode
      const result = await this.contract.submitTransaction(
        'CreateKYC',
        kycRecord.id,
        JSON.stringify(kycRecord)
      );

      const txId = result.toString();
      console.log('✅ KYC submitted to blockchain with transaction ID:', txId);

      return {
        success: true,
        txHash: txId,
        blockNumber: null, // Will be available after block commit
        message: 'KYC record successfully recorded on Hyperledger Fabric blockchain',
        kycId: kycRecord.id
      };

    } catch (error) {
      console.error('❌ Failed to submit KYC to blockchain:', error);
      throw new Error(`Blockchain submission failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async updateKYCStatus(kycId: string, status: string, remarks: string, verifiedBy: string): Promise<any> {
    try {
      if (!this.contract) {
        throw new Error('Fabric contract not initialized');
      }

      console.log(`🔄 Updating KYC status on blockchain: ${kycId} -> ${status}`);

      const updateData = {
        status,
        remarks,
        verifiedBy,
        updatedAt: new Date().toISOString(),
        verifiedAt: status === 'VERIFIED' ? new Date().toISOString() : null
      };

      const result = await this.contract.submitTransaction(
        'UpdateKYCStatus',
        kycId,
        JSON.stringify(updateData)
      );

      const txId = result.toString();
      console.log('✅ KYC status updated on blockchain with transaction ID:', txId);

      return {
        success: true,
        txHash: txId,
        message: `KYC status updated to ${status} on blockchain`
      };

    } catch (error) {
      console.error('❌ Failed to update KYC status on blockchain:', error);
      throw new Error(`Blockchain update failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async queryKYC(kycId: string): Promise<any> {
    try {
      if (!this.contract) {
        throw new Error('Fabric contract not initialized');
      }

      console.log(`🔍 Querying KYC from blockchain: ${kycId}`);

      const result = await this.contract.evaluateTransaction('ReadKYC', kycId);
      const kycData = JSON.parse(result.toString());

      console.log('✅ KYC data retrieved from blockchain');
      return {
        success: true,
        data: kycData
      };

    } catch (error) {
      console.error('❌ Failed to query KYC from blockchain:', error);
      throw new Error(`Blockchain query failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async disconnect(): Promise<void> {
    if (this.gateway) {
      this.gateway.disconnect();
      console.log('🔌 Disconnected from Hyperledger Fabric');
    }
  }

  isConnected(): boolean {
    return this.gateway !== null && this.contract !== null;
  }
}

// Singleton instance
export const fabricService = new HyperledgerFabricService();
