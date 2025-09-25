import { prisma } from "./server/database/prisma";

async function debugTransactionHashes() {
  console.log("🔍 Debugging transaction hashes in database...");
  
  // Check audit logs with BLOCKCHAIN_TRANSACTION action
  const auditLogs = await prisma.auditLog.findMany({
    where: {
      action: "BLOCKCHAIN_TRANSACTION"
    },
    select: {
      id: true,
      txId: true,
      performedAt: true,
      details: true,
      remarks: true,
      kycRecordId: true
    },
    orderBy: {
      performedAt: "desc"
    }
  });
  
  console.log(`Found ${auditLogs.length} blockchain transaction audit logs:`);
  
  for (const log of auditLogs) {
    console.log(`\n📝 Audit Log ID: ${log.id}`);
    console.log(`  📅 Performed At: ${log.performedAt}`);
    console.log(`  🔗 Transaction ID: ${log.txId}`);
    console.log(`  📝 Remarks: ${log.remarks}`);
    console.log(`  📦 Details: ${JSON.stringify(log.details, null, 2)}`);
  }
  
  // Also check TransactionHashRegistry
  const txRegistry = await prisma.transactionHashRegistry.findMany({
    select: {
      id: true,
      transactionHash: true,
      kycRecordId: true,
      submittedAt: true,
      isVerified: true
    },
    orderBy: {
      submittedAt: "desc"
    }
  });
  
  console.log(`\n\nFound ${txRegistry.length} transaction hash registry entries:`);
  
  for (const entry of txRegistry) {
    console.log(`\n📝 Registry ID: ${entry.id}`);
    console.log(`  🔗 Transaction Hash: ${entry.transactionHash}`);
    console.log(`  📅 Submitted At: ${entry.submittedAt}`);
    console.log(`  ✅ Verified: ${entry.isVerified}`);
  }
  
  await prisma.$disconnect();
}

debugTransactionHashes().catch(console.error);