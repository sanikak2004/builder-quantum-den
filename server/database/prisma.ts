import { PrismaClient } from '@prisma/client';

// Global Prisma client instance with real PostgreSQL connection
export const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
  datasources: {
    db: {
      url: process.env.DATABASE_URL // Real Aiven PostgreSQL connection
    }
  }
});

// Initialize database connection and create tables
export async function initializeDatabase(): Promise<void> {
  try {
    console.log("🔄 === REAL DATABASE CONNECTION ===");
    console.log("📋 Connecting to Aiven PostgreSQL...");
    console.log(`📋 Host: ${process.env.DATABASE_URL?.split('@')[1]?.split('/')[0] || 'Not specified'}`);
    
    // Test database connection with real query
    await prisma.$connect();
    const result = await prisma.$queryRaw`SELECT version();`;
    console.log("✅ REAL DATABASE CONNECTED:", result);
    
    // Check if tables exist and initialize
    console.log("🔄 Checking database schema...");
    
    // Initialize system stats if they don't exist
    await initializeSystemStats();
    
    console.log("📊 REAL DATABASE READY FOR OPERATIONS");
    console.log("🚀 === DATABASE INITIALIZATION COMPLETED ===\n");
  } catch (error) {
    console.error("❌ REAL DATABASE CONNECTION FAILED:", error);
    console.log("⚠️  Database features will not work properly");
    
    // If real database fails, don't throw error but log warning
    console.log("🔄 Continuing with limited functionality...");
  }
}

async function initializeSystemStats(): Promise<void> {
  try {
    // Check if system stats table exists and has data
    const existingStats = await prisma.systemStats.findUnique({
      where: { id: "system_stats" }
    });

    if (!existingStats) {
      await prisma.systemStats.create({
        data: {
          id: "system_stats",
          totalSubmissions: 0,
          pendingVerifications: 0,
          verifiedRecords: 0,
          rejectedRecords: 0,
          averageProcessingTimeHours: 0
        }
      });
      console.log("📊 REAL DATABASE: System statistics table created");
    } else {
      console.log("📊 REAL DATABASE: System statistics found");
      console.log(`   - Total Submissions: ${existingStats.totalSubmissions}`);
      console.log(`   - Pending: ${existingStats.pendingVerifications}`);
      console.log(`   - Verified: ${existingStats.verifiedRecords}`);
      console.log(`   - Rejected: ${existingStats.rejectedRecords}`);
    }
  } catch (error) {
    console.warn("⚠️  Could not initialize system stats in real database:", error);
  }
}

// Get real database statistics
export async function getDatabaseStats(): Promise<any> {
  try {
    const kycRecordCount = await prisma.kYCRecord.count();
    const pendingCount = await prisma.kYCRecord.count({
      where: { status: 'PENDING' }
    });
    const verifiedCount = await prisma.kYCRecord.count({
      where: { status: 'VERIFIED' }
    });
    const rejectedCount = await prisma.kYCRecord.count({
      where: { status: 'REJECTED' }
    });

    console.log("📊 REAL DATABASE STATS:");
    console.log(`   - Total KYC Records: ${kycRecordCount}`);
    console.log(`   - Pending: ${pendingCount}`);
    console.log(`   - Verified: ${verifiedCount}`);
    console.log(`   - Rejected: ${rejectedCount}`);

    return {
      totalSubmissions: kycRecordCount,
      pendingVerifications: pendingCount,
      verifiedRecords: verifiedCount,
      rejectedRecords: rejectedCount,
      averageProcessingTimeHours: 0
    };
  } catch (error) {
    console.error("❌ Failed to get real database stats:", error);
    // Return zero stats if database unavailable
    return {
      totalSubmissions: 0,
      pendingVerifications: 0,
      verifiedRecords: 0,
      rejectedRecords: 0,
      averageProcessingTimeHours: 0
    };
  }
}

// Test database connection
export async function testDatabaseConnection(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch (error) {
    console.error("❌ Database connection test failed:", error);
    return false;
  }
}

// Graceful shutdown
process.on('beforeExit', async () => {
  await prisma.$disconnect();
  console.log('✅ Real database connection closed');
});

export default prisma;
