-- CreateEnum
CREATE TYPE "KYCStatus" AS ENUM ('PENDING', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "VerificationLevel" AS ENUM ('L0', 'L1', 'L2', 'L3');

-- CreateEnum
CREATE TYPE "ForgeryType" AS ENUM ('DUPLICATE_SUBMISSION', 'DOCUMENT_HASH_MISMATCH', 'FAKE_TRANSACTION_HASH', 'TAMPERED_DOCUMENT', 'IDENTITY_THEFT');

-- CreateEnum
CREATE TYPE "VerificationStatus" AS ENUM ('PENDING', 'VERIFIED', 'FAILED', 'FLAGGED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "password" TEXT NOT NULL,
    "isAdmin" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KYCRecord" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "panNumber" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "dateOfBirth" TIMESTAMP(3) NOT NULL,
    "address" TEXT NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "status" "KYCStatus" NOT NULL DEFAULT 'PENDING',
    "verificationLevel" "VerificationLevel" NOT NULL DEFAULT 'L0',
    "blockchainHash" TEXT,
    "ipfsHash" TEXT,
    "fabricTransactionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "submittedAt" TIMESTAMP(3),
    "reviewedAt" TIMESTAMP(3),
    "approvedAt" TIMESTAMP(3),

    CONSTRAINT "KYCRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KYCDocument" (
    "id" TEXT NOT NULL,
    "kycRecordId" TEXT NOT NULL,
    "documentType" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "mimeType" TEXT NOT NULL,
    "ipfsHash" TEXT NOT NULL,
    "documentHash" TEXT NOT NULL,
    "blockchainHash" TEXT,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KYCDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BlockchainTransaction" (
    "id" TEXT NOT NULL,
    "transactionHash" TEXT NOT NULL,
    "blockNumber" INTEGER,
    "fromAddress" TEXT,
    "toAddress" TEXT,
    "gasUsed" INTEGER,
    "gasPrice" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "kycRecordId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BlockchainTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MiningSession" (
    "id" TEXT NOT NULL,
    "blockHash" TEXT NOT NULL,
    "previousHash" TEXT NOT NULL,
    "nonce" INTEGER NOT NULL,
    "difficulty" INTEGER NOT NULL DEFAULT 4,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "miningDuration" INTEGER,
    "kycRecordId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MiningSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DocumentHashRegistry" (
    "id" TEXT NOT NULL,
    "documentHash" TEXT NOT NULL,
    "ipfsHash" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "mimeType" TEXT NOT NULL,
    "submissionCount" INTEGER NOT NULL DEFAULT 1,
    "firstSubmittedBy" TEXT NOT NULL,
    "lastSubmittedBy" TEXT NOT NULL,
    "firstSubmissionDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSubmissionDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isBlacklisted" BOOLEAN NOT NULL DEFAULT false,
    "blacklistReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DocumentHashRegistry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TransactionHashRegistry" (
    "id" TEXT NOT NULL,
    "transactionHash" TEXT NOT NULL,
    "blockchainNetwork" TEXT NOT NULL DEFAULT 'local',
    "blockNumber" INTEGER,
    "associatedKYCId" TEXT NOT NULL,
    "associatedUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "verificationDate" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TransactionHashRegistry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ForgeryReport" (
    "id" TEXT NOT NULL,
    "reportType" "ForgeryType" NOT NULL,
    "description" TEXT NOT NULL,
    "severity" TEXT NOT NULL DEFAULT 'MEDIUM',
    "affectedKYCId" TEXT NOT NULL,
    "affectedUserId" TEXT NOT NULL,
    "documentHash" TEXT,
    "transactionHash" TEXT,
    "ipfsHash" TEXT,
    "evidenceData" JSONB,
    "detectionMethod" TEXT NOT NULL DEFAULT 'AUTOMATIC',
    "investigationStatus" TEXT NOT NULL DEFAULT 'OPEN',
    "investigatedBy" TEXT,
    "investigationNotes" TEXT,
    "resolution" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ForgeryReport_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "KYCRecord_panNumber_key" ON "KYCRecord"("panNumber");

-- CreateIndex
CREATE INDEX "KYCRecord_userId_idx" ON "KYCRecord"("userId");

-- CreateIndex
CREATE INDEX "KYCRecord_status_idx" ON "KYCRecord"("status");

-- CreateIndex
CREATE INDEX "KYCDocument_kycRecordId_idx" ON "KYCDocument"("kycRecordId");

-- CreateIndex
CREATE INDEX "KYCDocument_documentHash_idx" ON "KYCDocument"("documentHash");

-- CreateIndex
CREATE UNIQUE INDEX "BlockchainTransaction_transactionHash_key" ON "BlockchainTransaction"("transactionHash");

-- CreateIndex
CREATE INDEX "BlockchainTransaction_kycRecordId_idx" ON "BlockchainTransaction"("kycRecordId");

-- CreateIndex
CREATE UNIQUE INDEX "MiningSession_blockHash_key" ON "MiningSession"("blockHash");

-- CreateIndex
CREATE INDEX "MiningSession_kycRecordId_idx" ON "MiningSession"("kycRecordId");

-- CreateIndex
CREATE UNIQUE INDEX "DocumentHashRegistry_documentHash_key" ON "DocumentHashRegistry"("documentHash");

-- CreateIndex
CREATE INDEX "DocumentHashRegistry_firstSubmittedBy_idx" ON "DocumentHashRegistry"("firstSubmittedBy");

-- CreateIndex
CREATE UNIQUE INDEX "TransactionHashRegistry_transactionHash_key" ON "TransactionHashRegistry"("transactionHash");

-- CreateIndex
CREATE INDEX "TransactionHashRegistry_associatedKYCId_idx" ON "TransactionHashRegistry"("associatedKYCId");

-- CreateIndex
CREATE INDEX "ForgeryReport_affectedKYCId_idx" ON "ForgeryReport"("affectedKYCId");

-- CreateIndex
CREATE INDEX "ForgeryReport_reportType_idx" ON "ForgeryReport"("reportType");

-- CreateIndex
CREATE INDEX "ForgeryReport_investigationStatus_idx" ON "ForgeryReport"("investigationStatus");

-- AddForeignKey
ALTER TABLE "KYCRecord" ADD CONSTRAINT "KYCRecord_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KYCDocument" ADD CONSTRAINT "KYCDocument_kycRecordId_fkey" FOREIGN KEY ("kycRecordId") REFERENCES "KYCRecord"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BlockchainTransaction" ADD CONSTRAINT "BlockchainTransaction_kycRecordId_fkey" FOREIGN KEY ("kycRecordId") REFERENCES "KYCRecord"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MiningSession" ADD CONSTRAINT "MiningSession_kycRecordId_fkey" FOREIGN KEY ("kycRecordId") REFERENCES "KYCRecord"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentHashRegistry" ADD CONSTRAINT "DocumentHashRegistry_firstSubmittedBy_fkey" FOREIGN KEY ("firstSubmittedBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentHashRegistry" ADD CONSTRAINT "DocumentHashRegistry_lastSubmittedBy_fkey" FOREIGN KEY ("lastSubmittedBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransactionHashRegistry" ADD CONSTRAINT "TransactionHashRegistry_associatedUserId_fkey" FOREIGN KEY ("associatedUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransactionHashRegistry" ADD CONSTRAINT "TransactionHashRegistry_associatedKYCId_fkey" FOREIGN KEY ("associatedKYCId") REFERENCES "KYCRecord"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ForgeryReport" ADD CONSTRAINT "ForgeryReport_affectedUserId_fkey" FOREIGN KEY ("affectedUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ForgeryReport" ADD CONSTRAINT "ForgeryReport_affectedKYCId_fkey" FOREIGN KEY ("affectedKYCId") REFERENCES "KYCRecord"("id") ON DELETE RESTRICT ON UPDATE CASCADE;