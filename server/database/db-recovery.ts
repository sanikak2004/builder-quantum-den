import { PrismaClient } from "@prisma/client";

// Database recovery and connection pooling utility
export class DatabaseRecovery {
  private static instance: DatabaseRecovery;
  private prisma: PrismaClient;
  private connectionPool: PrismaClient[] = [];
  private maxConnections = 3; // Limit connections to prevent pool exhaustion
  private currentConnectionIndex = 0;

  private constructor() {
    // Create main Prisma client with optimized settings
    this.prisma = new PrismaClient({
      log: ["error", "warn"],
      datasources: {
        db: {
          url: process.env.DATABASE_URL,
        },
      },
    });

    // Initialize connection pool
    this.initializeConnectionPool();
  }

  static getInstance(): DatabaseRecovery {
    if (!DatabaseRecovery.instance) {
      DatabaseRecovery.instance = new DatabaseRecovery();
    }
    return DatabaseRecovery.instance;
  }

  private initializeConnectionPool(): void {
    console.log("🔄 Initializing database connection pool...");
    
    for (let i = 0; i < this.maxConnections; i++) {
      const poolClient = new PrismaClient({
        log: ["error"],
        datasources: {
          db: {
            url: process.env.DATABASE_URL,
          },
        },
      });
      this.connectionPool.push(poolClient);
    }
    
    console.log(`✅ Database connection pool initialized with ${this.maxConnections} connections`);
  }

  // Get a connection from the pool (round-robin)
  getConnection(): PrismaClient {
    const connection = this.connectionPool[this.currentConnectionIndex];
    this.currentConnectionIndex = (this.currentConnectionIndex + 1) % this.maxConnections;
    return connection;
  }

  // Get main connection
  getMainConnection(): PrismaClient {
    return this.prisma;
  }

  // Test database connectivity
  async testConnection(): Promise<{ success: boolean; error?: string }> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : "Unknown error" 
      };
    }
  }

  // Recover from connection issues
  async recover(): Promise<{ success: boolean; message: string }> {
    try {
      console.log("🔄 Attempting database connection recovery...");
      
      // Disconnect all existing connections
      await this.disconnectAll();
      
      // Wait a moment
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Recreate connections
      this.prisma = new PrismaClient({
        log: ["error", "warn"],
        datasources: {
          db: {
            url: process.env.DATABASE_URL,
          },
        },
      });
      
      // Reinitialize pool
      this.connectionPool = [];
      this.initializeConnectionPool();
      
      // Test the new connection
      const testResult = await this.testConnection();
      
      if (testResult.success) {
        console.log("✅ Database connection recovery successful");
        return { success: true, message: "Database connection recovered successfully" };
      } else {
        console.log("❌ Database connection recovery failed");
        return { success: false, message: `Recovery failed: ${testResult.error}` };
      }
    } catch (error) {
      console.error("❌ Database recovery error:", error);
      return { 
        success: false, 
        message: `Recovery error: ${error instanceof Error ? error.message : "Unknown error"}` 
      };
    }
  }

  // Execute query with automatic retry and connection recovery
  async executeWithRetry<T>(
    operation: (prisma: PrismaClient) => Promise<T>,
    maxRetries: number = 3
  ): Promise<T> {
    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const connection = attempt === 1 ? this.getMainConnection() : this.getConnection();
        return await operation(connection);
      } catch (error) {
        lastError = error instanceof Error ? error : new Error("Unknown error");
        console.warn(`Database operation attempt ${attempt} failed:`, lastError.message);
        
        // If it's a connection error and not the last attempt, try to recover
        if (attempt < maxRetries && this.isConnectionError(lastError)) {
          console.log("🔄 Attempting recovery before retry...");
          await this.recover();
          
          // Wait a bit before retrying
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
        }
      }
    }
    
    throw new Error(`Database operation failed after ${maxRetries} attempts: ${lastError?.message}`);
  }

  // Check if error is a connection-related error
  private isConnectionError(error: Error): boolean {
    const connectionErrorMessages = [
      "connection",
      "timeout",
      "pool",
      "ECONNREFUSED",
      "ENOTFOUND",
      "ETIMEDOUT",
      "P2037", // Prisma connection pool error
    ];
    
    return connectionErrorMessages.some(msg => 
      error.message.toLowerCase().includes(msg.toLowerCase())
    );
  }

  // Graceful shutdown
  async disconnectAll(): Promise<void> {
    try {
      console.log("🔌 Disconnecting all database connections...");
      
      // Disconnect main connection
      await this.prisma.$disconnect();
      
      // Disconnect pool connections
      await Promise.all(
        this.connectionPool.map(async (client) => {
          try {
            await client.$disconnect();
          } catch (error) {
            console.warn("Warning: Failed to disconnect pool client:", error);
          }
        })
      );
      
      console.log("✅ All database connections disconnected");
    } catch (error) {
      console.error("❌ Error during database disconnection:", error);
    }
  }

  // Get connection pool stats
  getStats(): any {
    return {
      maxConnections: this.maxConnections,
      poolSize: this.connectionPool.length,
      currentConnectionIndex: this.currentConnectionIndex,
      mainConnectionActive: !!this.prisma,
    };
  }
}

// Export singleton instance
export const dbRecovery = DatabaseRecovery.getInstance();

// Export main connection for backward compatibility
export const prisma = dbRecovery.getMainConnection();

export default prisma;