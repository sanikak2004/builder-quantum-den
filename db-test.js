const { PrismaClient } = require('@prisma/client');

// Initialize Prisma Client
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'postgres://avnadmin:AVNS_ltoOZ6TzwV4Xg61XsSI@blockchain-maskeriya338-1f80.f.aivencloud.com:27251/defaultdb?sslmode=require',
    },
  },
  log: ['query', 'info', 'warn', 'error'],
});

async function testConnection() {
  try {
    console.log('🔄 Connecting to database...');
    
    // Test basic connection
    await prisma.$queryRaw`SELECT 1`;
    console.log('✅ Database connection successful');
    
    // Test KYC records count
    const count = await prisma.kYCRecord.count();
    console.log(`📊 Found ${count} KYC records in database`);
    
    // Test fetching records
    const records = await prisma.kYCRecord.findMany({
      take: 5,
      orderBy: {
        createdAt: 'desc'
      }
    });
    console.log(`📋 Retrieved ${records.length} recent KYC records`);
    
    // Test system stats
    const stats = await prisma.systemStats.findUnique({
      where: { id: "system_stats" },
    });
    console.log('📈 System stats:', stats);
    
    console.log('✅ All database tests passed');
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    console.error('Stack trace:', error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();