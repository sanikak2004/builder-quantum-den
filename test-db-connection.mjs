import { PrismaClient } from '@prisma/client';

// Initialize Prisma Client with your database URL
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'postgres://avnadmin:AVNS_ltoOZ6TzwV4Xg61XsSI@blockchain-maskeriya338-1f80.f.aivencloud.com:27251/defaultdb?sslmode=require'
    }
  }
});

async function testConnection() {
  try {
    // Test the database connection
    console.log('Testing database connection...');
    
    // Simple query to test connection
    await prisma.$queryRaw`SELECT 1`;
    console.log('✅ Database connection successful!');
    
    // Test fetching some data
    const stats = await prisma.systemStats.findUnique({
      where: { id: 'system_stats' }
    });
    
    if (stats) {
      console.log('✅ Database queries working!');
      console.log('📊 System Stats:', {
        totalSubmissions: stats.totalSubmissions,
        verifiedRecords: stats.verifiedRecords,
        pendingVerifications: stats.pendingVerifications
      });
    } else {
      console.log('ℹ️ No system stats found (this is okay for a new database)');
    }
    
    // Test counting KYC records
    const kycCount = await prisma.kYCRecord.count();
    console.log(`📁 Total KYC records: ${kycCount}`);
    
    console.log('\n🎉 All database tests passed!');
    console.log('\n🚀 Ready for Render deployment with your Aiven PostgreSQL database');
    
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    console.error('🔧 Troubleshooting steps:');
    console.error('1. Verify your DATABASE_URL is correct');
    console.error('2. Check if your Aiven database allows external connections');
    console.error('3. Ensure your network allows outbound connections to Aiven');
    console.error('4. Verify SSL settings in your connection string');
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();