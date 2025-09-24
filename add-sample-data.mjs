import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function addSampleData() {
  try {
    console.log('🔌 Connecting to PostgreSQL database...');
    await prisma.$connect();
    console.log('✅ Connected to database!');

    // Add a sample user
    console.log('👤 Creating sample user...');
    const user = await prisma.user.create({
      data: {
        email: 'john.doe@example.com',
        name: 'John Doe',
        createdAt: new Date()
      }
    });
    console.log('✅ Sample user created:', user.email);

    // Add a sample KYC record
    console.log('📋 Creating sample KYC record...');
    const kycRecord = await prisma.kYCRecord.create({
      data: {
        userId: user.id,
        name: 'John Doe',
        email: 'john.doe@example.com',
        phone: '+91-9876543210',
        pan: 'ABCDE1234F',
        dateOfBirth: '1990-01-15',
        address: {
          street: '123 Main Street',
          city: 'Mumbai', 
          state: 'Maharashtra',
          pincode: '400001',
          country: 'India'
        },
        status: 'PENDING',
        verificationLevel: 'L1',
        blockchainTxHash: 'demo_tx_' + Date.now(),
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });
    console.log('✅ Sample KYC record created:', kycRecord.id);

    // Add sample documents
    console.log('📄 Creating sample documents...');
    const document1 = await prisma.document.create({
      data: {
        kycRecordId: kycRecord.id,
        type: 'AADHAAR',
        fileName: 'aadhaar_card.pdf',
        fileSize: 245760,
        mimeType: 'application/pdf',
        documentHash: 'hash_aadhaar_' + Date.now(),
        ipfsHash: 'ipfs_aadhaar_' + Date.now(),
        ipfsUrl: 'https://ipfs.io/ipfs/sample_aadhaar',
        uploadedAt: new Date()
      }
    });

    const document2 = await prisma.document.create({
      data: {
        kycRecordId: kycRecord.id,
        type: 'PAN',
        fileName: 'pan_card.jpg',
        fileSize: 128000,
        mimeType: 'image/jpeg',
        documentHash: 'hash_pan_' + Date.now(),
        ipfsHash: 'ipfs_pan_' + Date.now(),
        ipfsUrl: 'https://ipfs.io/ipfs/sample_pan',
        uploadedAt: new Date()
      }
    });
    console.log('✅ Sample documents created:', document1.type, document2.type);

    // Add audit log
    console.log('📝 Creating audit log...');
    const auditLog = await prisma.auditLog.create({
      data: {
        kycRecordId: kycRecord.id,
        userId: user.id,
        action: 'CREATED',
        performedBy: 'john.doe@example.com',
        txId: kycRecord.blockchainTxHash,
        details: {
          documentCount: 2,
          submissionSource: 'demo'
        },
        remarks: 'Demo KYC record created for testing',
        performedAt: new Date()
      }
    });
    console.log('✅ Audit log created:', auditLog.action);

    // Initialize system stats
    console.log('📊 Updating system statistics...');
    await prisma.systemStats.upsert({
      where: { id: 'system_stats' },
      update: {
        totalSubmissions: 1,
        pendingVerifications: 1,
        verifiedRecords: 0,
        rejectedRecords: 0,
        averageProcessingTimeHours: 0,
        totalDocuments: 2,
        lastUpdated: new Date()
      },
      create: {
        id: 'system_stats',
        totalSubmissions: 1,
        pendingVerifications: 1,
        verifiedRecords: 0,
        rejectedRecords: 0,
        averageProcessingTimeHours: 0,
        totalDocuments: 2,
        lastUpdated: new Date()
      }
    });
    console.log('✅ System statistics updated');

    // Show final stats
    console.log('\n📊 Final Database Statistics:');
    const [userCount, kycCount, documentCount, auditCount] = await Promise.all([
      prisma.user.count(),
      prisma.kYCRecord.count(),
      prisma.document.count(),
      prisma.auditLog.count()
    ]);
    
    console.log(`👥 Users: ${userCount}`);
    console.log(`📋 KYC Records: ${kycCount}`);
    console.log(`📄 Documents: ${documentCount}`);
    console.log(`📝 Audit Logs: ${auditCount}`);
    
    console.log('\n🎉 Sample data successfully added to your PostgreSQL database!');
    console.log('💡 You can now test the application with real data from your database.');
    
  } catch (error) {
    console.error('❌ Error adding sample data:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

addSampleData();