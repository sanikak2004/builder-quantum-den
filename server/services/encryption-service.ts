import crypto from 'crypto';
import { promisify } from 'util';

const randomBytes = promisify(crypto.randomBytes);

export interface EncryptionResult {
  encryptedData: Buffer;
  key: string;
  iv: string;
  algorithm: string;
  authTag?: string;
}

export interface DecryptionParams {
  encryptedData: Buffer;
  key: string;
  iv: string;
  algorithm: string;
  authTag?: string;
}

export class EncryptionService {
  private static readonly ALGORITHM = 'aes-256-gcm';
  private static readonly KEY_LENGTH = 32; // 256 bits
  private static readonly IV_LENGTH = 16;  // 128 bits

  /**
   * Encrypt file data using AES-256-GCM
   * @param data File buffer to encrypt
   * @param userKey Optional user-specific key (derived from user ID/wallet)
   * @returns Encryption result with encrypted data and metadata
   */
  static async encryptFile(data: Buffer, userKey?: string): Promise<EncryptionResult> {
    try {
      // Generate encryption key
      const key = userKey 
        ? this.deriveKeyFromUser(userKey)
        : await randomBytes(this.KEY_LENGTH);

      // Generate random IV
      const iv = await randomBytes(this.IV_LENGTH);

      // Create cipher
      const cipher = crypto.createCipher(this.ALGORITHM, key);
      cipher.setAAD(Buffer.from('KYC_DOCUMENT', 'utf8')); // Additional authenticated data

      // Encrypt the data
      const encrypted1 = cipher.update(data);
      const encrypted2 = cipher.final();
      const authTag = cipher.getAuthTag();

      const encryptedData = Buffer.concat([encrypted1, encrypted2]);

      console.log(`🔐 File encrypted: ${data.length} bytes -> ${encryptedData.length} bytes`);

      return {
        encryptedData,
        key: key.toString('hex'),
        iv: iv.toString('hex'),
        algorithm: this.ALGORITHM,
        authTag: authTag.toString('hex')
      };

    } catch (error) {
      console.error('❌ Encryption failed:', error);
      throw new Error(`File encryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Decrypt file data
   * @param params Decryption parameters
   * @returns Decrypted file buffer
   */
  static async decryptFile(params: DecryptionParams): Promise<Buffer> {
    try {
      const { encryptedData, key, iv, algorithm, authTag } = params;

      // Convert hex strings back to buffers
      const keyBuffer = Buffer.from(key, 'hex');
      const ivBuffer = Buffer.from(iv, 'hex');
      const authTagBuffer = authTag ? Buffer.from(authTag, 'hex') : undefined;

      // Create decipher
      const decipher = crypto.createDecipher(algorithm, keyBuffer);
      decipher.setAAD(Buffer.from('KYC_DOCUMENT', 'utf8'));
      
      if (authTagBuffer) {
        decipher.setAuthTag(authTagBuffer);
      }

      // Decrypt the data
      const decrypted1 = decipher.update(encryptedData);
      const decrypted2 = decipher.final();

      const decryptedData = Buffer.concat([decrypted1, decrypted2]);

      console.log(`🔓 File decrypted: ${encryptedData.length} bytes -> ${decryptedData.length} bytes`);

      return decryptedData;

    } catch (error) {
      console.error('❌ Decryption failed:', error);
      throw new Error(`File decryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Derive encryption key from user-specific data
   * @param userKey User ID, wallet address, or other unique identifier
   * @returns Derived key buffer
   */
  private static deriveKeyFromUser(userKey: string): Buffer {
    const salt = process.env.ENCRYPTION_SALT || 'authen-ledger-salt-2024';
    return crypto.pbkdf2Sync(userKey, salt, 100000, this.KEY_LENGTH, 'sha256');
  }

  /**
   * Generate secure random key for one-time use
   * @returns Random key as hex string
   */
  static async generateRandomKey(): Promise<string> {
    const key = await randomBytes(this.KEY_LENGTH);
    return key.toString('hex');
  }

  /**
   * Hash file content for integrity verification
   * @param data File buffer
   * @returns SHA-256 hash as hex string
   */
  static hashFile(data: Buffer): string {
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  /**
   * Generate HMAC for file authentication
   * @param data File buffer
   * @param key HMAC key
   * @returns HMAC as hex string
   */
  static generateHMAC(data: Buffer, key: string): string {
    return crypto.createHmac('sha256', key).update(data).digest('hex');
  }

  /**
   * Verify file HMAC
   * @param data File buffer
   * @param hmac Expected HMAC
   * @param key HMAC key
   * @returns True if HMAC is valid
   */
  static verifyHMAC(data: Buffer, hmac: string, key: string): boolean {
    const expectedHmac = this.generateHMAC(data, key);
    return crypto.timingSafeEqual(Buffer.from(hmac), Buffer.from(expectedHmac));
  }

  /**
   * Encrypt and compress file (for large documents)
   * @param data File buffer
   * @param userKey Optional user key
   * @returns Encrypted and compressed result
   */
  static async encryptAndCompress(data: Buffer, userKey?: string): Promise<EncryptionResult & { compressed: boolean; originalSize: number }> {
    try {
      const zlib = require('zlib');
      const compressed = zlib.gzipSync(data);
      
      console.log(`📦 File compressed: ${data.length} bytes -> ${compressed.length} bytes (${Math.round((1 - compressed.length / data.length) * 100)}% reduction)`);

      const encryptionResult = await this.encryptFile(compressed, userKey);

      return {
        ...encryptionResult,
        compressed: true,
        originalSize: data.length
      };

    } catch (error) {
      console.error('❌ Compression and encryption failed:', error);
      throw error;
    }
  }

  /**
   * Decrypt and decompress file
   * @param params Decryption parameters
   * @param compressed Whether the file was compressed
   * @returns Decrypted and decompressed file buffer
   */
  static async decryptAndDecompress(params: DecryptionParams, compressed: boolean = false): Promise<Buffer> {
    try {
      const decryptedData = await this.decryptFile(params);

      if (compressed) {
        const zlib = require('zlib');
        const decompressed = zlib.gunzipSync(decryptedData);
        console.log(`📦 File decompressed: ${decryptedData.length} bytes -> ${decompressed.length} bytes`);
        return decompressed;
      }

      return decryptedData;

    } catch (error) {
      console.error('❌ Decryption and decompression failed:', error);
      throw error;
    }
  }

  /**
   * Create secure document package with metadata
   * @param data File buffer
   * @param metadata Document metadata
   * @param userKey User key for encryption
   * @returns Encrypted package with all metadata
   */
  static async createSecurePackage(
    data: Buffer, 
    metadata: {
      filename: string;
      contentType: string;
      userId: string;
      kycId: string;
      documentType: string;
    },
    userKey?: string
  ): Promise<{
    encryptedPackage: EncryptionResult;
    packageHash: string;
    metadata: any;
  }> {
    try {
      // Create package with file data and metadata
      const packageData = {
        file: data.toString('base64'),
        metadata: {
          ...metadata,
          timestamp: new Date().toISOString(),
          fileSize: data.length,
          fileHash: this.hashFile(data)
        }
      };

      const packageBuffer = Buffer.from(JSON.stringify(packageData), 'utf8');
      
      // Encrypt the entire package
      const encryptedPackage = await this.encryptFile(packageBuffer, userKey);
      
      // Generate package hash for verification
      const packageHash = this.hashFile(packageBuffer);

      console.log(`📦 Secure document package created for: ${metadata.filename}`);

      return {
        encryptedPackage,
        packageHash,
        metadata: packageData.metadata
      };

    } catch (error) {
      console.error('❌ Failed to create secure package:', error);
      throw error;
    }
  }

  /**
   * Extract secure document package
   * @param encryptionParams Decryption parameters
   * @returns Decrypted file data and metadata
   */
  static async extractSecurePackage(encryptionParams: DecryptionParams): Promise<{
    fileData: Buffer;
    metadata: any;
  }> {
    try {
      // Decrypt the package
      const packageBuffer = await this.decryptFile(encryptionParams);
      const packageData = JSON.parse(packageBuffer.toString('utf8'));

      // Extract file data and metadata
      const fileData = Buffer.from(packageData.file, 'base64');
      const metadata = packageData.metadata;

      // Verify file integrity
      const expectedHash = metadata.fileHash;
      const actualHash = this.hashFile(fileData);

      if (expectedHash !== actualHash) {
        throw new Error('File integrity verification failed');
      }

      console.log(`📦 Secure document package extracted: ${metadata.filename}`);

      return {
        fileData,
        metadata
      };

    } catch (error) {
      console.error('❌ Failed to extract secure package:', error);
      throw error;
    }
  }
}
