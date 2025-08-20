// import { createHelia } from "helia";
// import { unixfs } from "@helia/unixfs";
import * as crypto from "crypto";

// Temporary types until packages are installed
interface IPFSHTTPClient {
  add: (data: any) => Promise<{ cid: { toString: () => string } }>;
  cat: (hash: string) => AsyncIterable<Buffer>;
  pin: {
    add: (cid: any) => Promise<void>;
    rm: (hash: string) => Promise<void>;
  };
  version: () => Promise<{ version: string }>;
  id: () => Promise<{ id: string; addresses: string[] }>;
  stats: {
    bw: () => Promise<{
      totalIn: number;
      totalOut: number;
      rateIn: number;
      rateOut: number;
    }>;
  };
}

function create(config: any): IPFSHTTPClient {
  // Mock implementation
  return {} as IPFSHTTPClient;
}

export interface IPFSUploadResult {
  success: boolean;
  hash: string;
  url: string;
  size: number;
  error?: string;
}

export class RealIPFSService {
  private client: IPFSHTTPClient | null = null;
  private baseUrl: string;

  constructor() {
    // Configure IPFS client - can be local node or remote service
    this.baseUrl = process.env.IPFS_API_URL || "http://127.0.0.1:5001";

    try {
      this.client = create({
        host: this.parseHost(this.baseUrl),
        port: this.parsePort(this.baseUrl),
        protocol: this.parseProtocol(this.baseUrl),
      });
      console.log("🌐 IPFS client initialized with URL:", this.baseUrl);
    } catch (error) {
      console.error("❌ Failed to initialize IPFS client:", error);
      console.log("⚠️  Will attempt to connect when first upload is requested");
    }
  }

  private parseHost(url: string): string {
    const parsed = new URL(url);
    return parsed.hostname;
  }

  private parsePort(url: string): number {
    const parsed = new URL(url);
    return parseInt(parsed.port) || (parsed.protocol === "https:" ? 443 : 80);
  }

  private parseProtocol(url: string): string {
    const parsed = new URL(url);
    return parsed.protocol === "https:" ? "https" : "http";
  }

  async initializeConnection(): Promise<void> {
    try {
      if (!this.client) {
        this.client = create({
          host: this.parseHost(this.baseUrl),
          port: this.parsePort(this.baseUrl),
          protocol: this.parseProtocol(this.baseUrl),
        });
      }

      // Test connection
      const version = await this.client.version();
      console.log("✅ IPFS connection established. Version:", version.version);
    } catch (error) {
      console.error("❌ Failed to connect to IPFS:", error);
      throw new Error(
        `IPFS connection failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  async uploadFile(
    file: Buffer,
    filename: string,
    metadata?: any,
  ): Promise<IPFSUploadResult> {
    try {
      if (!this.client) {
        await this.initializeConnection();
      }

      if (!this.client) {
        throw new Error("IPFS client not initialized");
      }

      console.log(
        `📤 Uploading file to IPFS: ${filename} (${file.length} bytes)`,
      );

      // Create file object with metadata
      const fileObj = {
        content: file,
        path: filename,
        ...(metadata && { metadata: JSON.stringify(metadata) }),
      };

      // Upload to IPFS
      const result = await this.client.add(fileObj);
      const hash = result.cid.toString();

      // Pin the file to ensure it stays on the network
      await this.client.pin.add(result.cid);

      const ipfsUrl = `https://ipfs.io/ipfs/${hash}`;

      console.log("✅ File uploaded to IPFS successfully");
      console.log("📋 IPFS Hash:", hash);
      console.log("🔗 IPFS URL:", ipfsUrl);

      return {
        success: true,
        hash,
        url: ipfsUrl,
        size: file.length,
      };
    } catch (error) {
      console.error("❌ Failed to upload file to IPFS:", error);
      return {
        success: false,
        hash: "",
        url: "",
        size: 0,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  async getFile(hash: string): Promise<Buffer | null> {
    try {
      if (!this.client) {
        await this.initializeConnection();
      }

      if (!this.client) {
        throw new Error("IPFS client not initialized");
      }

      console.log(`📥 Retrieving file from IPFS: ${hash}`);

      const chunks = [];
      for await (const chunk of this.client.cat(hash)) {
        chunks.push(chunk);
      }

      const fileBuffer = Buffer.concat(chunks);
      console.log("✅ File retrieved from IPFS successfully");

      return fileBuffer;
    } catch (error) {
      console.error("❌ Failed to retrieve file from IPFS:", error);
      return null;
    }
  }

  async pinFile(hash: string): Promise<boolean> {
    try {
      if (!this.client) {
        await this.initializeConnection();
      }

      if (!this.client) {
        throw new Error("IPFS client not initialized");
      }

      await this.client.pin.add(hash);
      console.log("📌 File pinned to IPFS:", hash);
      return true;
    } catch (error) {
      console.error("❌ Failed to pin file to IPFS:", error);
      return false;
    }
  }

  async unpinFile(hash: string): Promise<boolean> {
    try {
      if (!this.client) {
        await this.initializeConnection();
      }

      if (!this.client) {
        throw new Error("IPFS client not initialized");
      }

      await this.client.pin.rm(hash);
      console.log("📌 File unpinned from IPFS:", hash);
      return true;
    } catch (error) {
      console.error("❌ Failed to unpin file from IPFS:", error);
      return false;
    }
  }

  async getStatus(): Promise<any> {
    try {
      if (!this.client) {
        await this.initializeConnection();
      }

      if (!this.client) {
        throw new Error("IPFS client not initialized");
      }

      const [version, id, stats] = await Promise.all([
        this.client.version(),
        this.client.id(),
        this.client.stats.bw(),
      ]);

      return {
        connected: true,
        version: version.version,
        peerId: id.id,
        addresses: id.addresses,
        stats: {
          totalIn: stats.totalIn,
          totalOut: stats.totalOut,
          rateIn: stats.rateIn,
          rateOut: stats.rateOut,
        },
      };
    } catch (error) {
      console.error("❌ Failed to get IPFS status:", error);
      return {
        connected: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  generateDocumentHash(file: Buffer): string {
    return crypto.createHash("sha256").update(file).digest("hex");
  }

  isConnected(): boolean {
    return this.client !== null;
  }
}

// Singleton instance
export const ipfsService = new RealIPFSService();
