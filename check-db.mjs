import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkDatabase() {
  try {
    console.log('🔌 Connecting to PostgreSQL database...');
    
    // Test database connection
    await prisma.$connect();
    console.log('✅ Successfully connected to PostgreSQL database!');
    
    // Check database structure
    console.log('\n📋 Checking database tables...');
    
    const [userCount, kycCount, documentCount, auditCount] = await Promise.all([
      prisma.user.count(),
      prisma.kYCRecord.count(),
      prisma.document.count(),
      prisma.auditLog.count()
    ]);
    
    console.log('📊 Current Database Statistics:');
    console.log(`👥 Users: ${userCount}`);
    console.log(`📋 KYC Records: ${kycCount}`);
    console.log(`📄 Documents: ${documentCount}`);
    console.log(`📝 Audit Logs: ${auditCount}`);
    
    if (kycCount > 0) {
      console.log('\n📈 Recent KYC Records:');
      const recentRecords = await prisma.kYCRecord.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          status: true,
          createdAt: true
        }
      });
      
      recentRecords.forEach(record => {
        console.log(`📝 ${record.name} - ${record.status} (${record.createdAt.toLocaleDateString()})`);
      });
    } else {
      console.log('\n💡 Database is empty and ready for real data!');
    }
    
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabase();