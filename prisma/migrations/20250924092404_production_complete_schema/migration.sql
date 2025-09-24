-- CreateEnum
CREATE TYPE "public"."UserRole" AS ENUM ('USER', 'ADMIN', 'SUPER_ADMIN', 'AUDITOR');

-- CreateEnum
CREATE TYPE "public"."KYCStatus" AS ENUM ('PENDING', 'UNDER_REVIEW', 'VERIFIED', 'REJECTED', 'EXPIRED', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "public"."VerificationLevel" AS ENUM ('L1', 'L2', 'L3');

-- CreateEnum
CREATE TYPE "public"."DocumentType" AS ENUM ('PAN', 'AADHAAR', 'PASSPORT', 'BANK_STATEMENT', 'UTILITY_BILL', 'DRIVING_LICENSE', 'VOTER_ID', 'BIRTH_CERTIFICATE', 'INCOME_CERTIFICATE', 'OTHER');

-- CreateEnum
CREATE TYPE "public"."RiskLevel" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "public"."AuditAction" AS ENUM ('CREATED', 'UPDATED', 'VERIFIED', 'REJECTED', 'EXPIRED', 'SUSPENDED', 'DOCUMENT_UPLOADED', 'DOCUMENT_PROCESSED', 'STATUS_CHANGED', 'ADMIN_REVIEW', 'RISK_ASSESSMENT', 'BLOCKCHAIN_TRANSACTION', 'LOGIN', 'LOGOUT', 'CONFIG_CHANGED', 'FORGERY_DETECTED', 'DUPLICATE_DOCUMENT', 'HASH_MISMATCH');

-- CreateEnum
CREATE TYPE "public"."ForgeryType" AS ENUM ('DOCUMENT_HASH_MISMATCH', 'DUPLICATE_SUBMISSION', 'TAMPERED_CONTENT', 'FAKE_TRANSACTION_HASH', 'BLOCKCHAIN_INCONSISTENCY');

-- CreateEnum
CREATE TYPE "public"."VerificationStatus" AS ENUM ('PENDING', 'VERIFIED', 'FAILED', 'SUSPICIOUS', 'FLAGGED');

-- CreateTable
CREATE TABLE "public"."users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "role" "public"."UserRole" NOT NULL DEFAULT 'USER',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastLogin" TIMESTAMP(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."kyc_records" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "pan" TEXT NOT NULL,
    "dateOfBirth" TEXT NOT NULL,
    "address" JSONB NOT NULL,
    "status" "public"."KYCStatus" NOT NULL DEFAULT 'PENDING',
    "verificationLevel" "public"."VerificationLevel" NOT NULL DEFAULT 'L1',
    "remarks" TEXT,
    "verifiedBy" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "rejectedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "blockchainTxHash" TEXT,
    "lastBlockchainTxHash" TEXT,
    "blockchainVerificationTx" TEXT,
    "blockchainRejectionTx" TEXT,
    "blockchainBlockNumber" INTEGER,
    "processingStartedAt" TIMESTAMP(3),
    "processingCompletedAt" TIMESTAMP(3),
    "processingTimeHours" DOUBLE PRECISION,
    "riskScore" DOUBLE PRECISION DEFAULT 0.0,
    "complianceFlags" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "kyc_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."documents" (
    "id" TEXT NOT NULL,
    "kycRecordId" TEXT NOT NULL,
    "type" "public"."DocumentType" NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "mimeType" TEXT NOT NULL,
    "documentHash" TEXT NOT NULL,
    "ipfsHash" TEXT NOT NULL,
    "ipfsUrl" TEXT NOT NULL,
    "isProcessed" BOOLEAN NOT NULL DEFAULT false,
    "processingError" TEXT,
    "ocrResults" JSONB,
    "analysisResults" JSONB,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(3),

    CONSTRAINT "documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."risk_assessments" (
    "id" TEXT NOT NULL,
    "kycRecordId" TEXT NOT NULL,
    "riskLevel" "public"."RiskLevel" NOT NULL,
    "riskScore" DOUBLE PRECISION NOT NULL,
    "riskFactors" JSONB NOT NULL,
    "assessedBy" TEXT NOT NULL,
    "assessedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sanctionCheck" BOOLEAN NOT NULL DEFAULT false,
    "pepCheck" BOOLEAN NOT NULL DEFAULT false,
    "adverseMediaCheck" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "risk_assessments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."audit_logs" (
    "id" TEXT NOT NULL,
    "kycRecordId" TEXT NOT NULL,
    "userId" TEXT,
    "action" "public"."AuditAction" NOT NULL,
    "performedBy" TEXT NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "sessionId" TEXT,
    "txId" TEXT,
    "details" JSONB,
    "remarks" TEXT,
    "performedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."system_stats" (
    "id" TEXT NOT NULL DEFAULT 'system_stats',
    "totalSubmissions" INTEGER NOT NULL DEFAULT 0,
    "pendingVerifications" INTEGER NOT NULL DEFAULT 0,
    "verifiedRecords" INTEGER NOT NULL DEFAULT 0,
    "rejectedRecords" INTEGER NOT NULL DEFAULT 0,
    "expiredRecords" INTEGER NOT NULL DEFAULT 0,
    "averageProcessingTimeHours" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "averageRiskScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalBlockchainTxs" INTEGER NOT NULL DEFAULT 0,
    "lastBlockchainSync" TIMESTAMP(3),
    "blockchainHeight" INTEGER NOT NULL DEFAULT 0,
    "totalDocuments" INTEGER NOT NULL DEFAULT 0,
    "totalDocumentSize" BIGINT NOT NULL DEFAULT 0,
    "lastUpdated" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "system_stats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."system_config" (
    "id" TEXT NOT NULL DEFAULT 'system_config',
    "autoApprovalEnabled" BOOLEAN NOT NULL DEFAULT false,
    "maxFileSize" INTEGER NOT NULL DEFAULT 5242880,
    "maxFilesPerUpload" INTEGER NOT NULL DEFAULT 10,
    "riskThresholds" JSONB NOT NULL,
    "miningDifficulty" INTEGER NOT NULL DEFAULT 4,
    "miningReward" DOUBLE PRECISION NOT NULL DEFAULT 100,
    "gasPrice" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "emailNotifications" BOOLEAN NOT NULL DEFAULT true,
    "smsNotifications" BOOLEAN NOT NULL DEFAULT false,
    "maintenanceMode" BOOLEAN NOT NULL DEFAULT false,
    "maintenanceMessage" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedBy" TEXT,

    CONSTRAINT "system_config_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."document_hash_registry" (
    "id" TEXT NOT NULL,
    "documentHash" TEXT NOT NULL,
    "ipfsHash" TEXT NOT NULL,
    "originalFileName" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "mimeType" TEXT NOT NULL,
    "firstSubmittedBy" TEXT NOT NULL,
    "firstSubmissionTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "firstKycRecordId" TEXT NOT NULL,
    "submissionCount" INTEGER NOT NULL DEFAULT 1,
    "lastSubmittedBy" TEXT NOT NULL,
    "lastSubmissionTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastKycRecordId" TEXT NOT NULL,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "verificationStatus" "public"."VerificationStatus" NOT NULL DEFAULT 'PENDING',
    "blockchainTxHash" TEXT,
    "blockNumber" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "document_hash_registry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."transaction_hash_registry" (
    "id" TEXT NOT NULL,
    "transactionHash" TEXT NOT NULL,
    "kycRecordId" TEXT NOT NULL,
    "blockNumber" INTEGER,
    "blockHash" TEXT,
    "documentHashes" JSONB NOT NULL,
    "contentHash" TEXT NOT NULL,
    "submittedBy" TEXT NOT NULL,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "verifiedAt" TIMESTAMP(3),
    "verificationError" TEXT,
    "confirmations" INTEGER NOT NULL DEFAULT 0,
    "isConfirmed" BOOLEAN NOT NULL DEFAULT false,
    "confirmedAt" TIMESTAMP(3),

    CONSTRAINT "transaction_hash_registry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."forgery_reports" (
    "id" TEXT NOT NULL,
    "forgeryType" "public"."ForgeryType" NOT NULL,
    "severity" "public"."RiskLevel" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "suspiciousKycRecordId" TEXT NOT NULL,
    "originalKycRecordId" TEXT,
    "documentHashId" TEXT,
    "transactionHash" TEXT,
    "detectedBy" TEXT NOT NULL,
    "detectionMethod" TEXT NOT NULL,
    "evidence" JSONB NOT NULL,
    "status" "public"."VerificationStatus" NOT NULL DEFAULT 'PENDING',
    "investigatedBy" TEXT,
    "investigatedAt" TIMESTAMP(3),
    "resolution" TEXT,
    "actionsTaken" JSONB,
    "isResolved" BOOLEAN NOT NULL DEFAULT false,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "forgery_reports_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "public"."users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "kyc_records_pan_key" ON "public"."kyc_records"("pan");

-- CreateIndex
CREATE INDEX "kyc_records_status_idx" ON "public"."kyc_records"("status");

-- CreateIndex
CREATE INDEX "kyc_records_createdAt_idx" ON "public"."kyc_records"("createdAt");

-- CreateIndex
CREATE INDEX "kyc_records_verificationLevel_idx" ON "public"."kyc_records"("verificationLevel");

-- CreateIndex
CREATE INDEX "documents_type_idx" ON "public"."documents"("type");

-- CreateIndex
CREATE INDEX "documents_uploadedAt_idx" ON "public"."documents"("uploadedAt");

-- CreateIndex
CREATE INDEX "audit_logs_performedAt_idx" ON "public"."audit_logs"("performedAt");

-- CreateIndex
CREATE INDEX "audit_logs_action_idx" ON "public"."audit_logs"("action");

-- CreateIndex
CREATE UNIQUE INDEX "document_hash_registry_documentHash_key" ON "public"."document_hash_registry"("documentHash");

-- CreateIndex
CREATE INDEX "document_hash_registry_documentHash_idx" ON "public"."document_hash_registry"("documentHash");

-- CreateIndex
CREATE INDEX "document_hash_registry_firstSubmittedBy_idx" ON "public"."document_hash_registry"("firstSubmittedBy");

-- CreateIndex
CREATE INDEX "document_hash_registry_submissionCount_idx" ON "public"."document_hash_registry"("submissionCount");

-- CreateIndex
CREATE UNIQUE INDEX "transaction_hash_registry_transactionHash_key" ON "public"."transaction_hash_registry"("transactionHash");

-- CreateIndex
CREATE INDEX "transaction_hash_registry_transactionHash_idx" ON "public"."transaction_hash_registry"("transactionHash");

-- CreateIndex
CREATE INDEX "transaction_hash_registry_kycRecordId_idx" ON "public"."transaction_hash_registry"("kycRecordId");

-- CreateIndex
CREATE INDEX "transaction_hash_registry_submittedBy_idx" ON "public"."transaction_hash_registry"("submittedBy");

-- CreateIndex
CREATE INDEX "forgery_reports_forgeryType_idx" ON "public"."forgery_reports"("forgeryType");

-- CreateIndex
CREATE INDEX "forgery_reports_severity_idx" ON "public"."forgery_reports"("severity");

-- CreateIndex
CREATE INDEX "forgery_reports_status_idx" ON "public"."forgery_reports"("status");

-- CreateIndex
CREATE INDEX "forgery_reports_createdAt_idx" ON "public"."forgery_reports"("createdAt");

-- AddForeignKey
ALTER TABLE "public"."kyc_records" ADD CONSTRAINT "kyc_records_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."documents" ADD CONSTRAINT "documents_kycRecordId_fkey" FOREIGN KEY ("kycRecordId") REFERENCES "public"."kyc_records"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."risk_assessments" ADD CONSTRAINT "risk_assessments_kycRecordId_fkey" FOREIGN KEY ("kycRecordId") REFERENCES "public"."kyc_records"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."audit_logs" ADD CONSTRAINT "audit_logs_kycRecordId_fkey" FOREIGN KEY ("kycRecordId") REFERENCES "public"."kyc_records"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."audit_logs" ADD CONSTRAINT "audit_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."forgery_reports" ADD CONSTRAINT "forgery_reports_documentHashId_fkey" FOREIGN KEY ("documentHashId") REFERENCES "public"."document_hash_registry"("id") ON DELETE SET NULL ON UPDATE CASCADE;
