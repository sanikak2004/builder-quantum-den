/**
 * Shared code between client and server
 * Useful to share types between client and server
 * and/or small pure JS functions that can be used on both client and server
 */

/**
 * Example response type for /api/demo
 */
export interface DemoResponse {
  message: string;
}

/**
 * eKYC System API Types
 */

// KYC Document Types
export interface KYCDocument {
  id: string;
  type:
    | "PAN"
    | "AADHAAR"
    | "PASSPORT"
    | "DRIVING_LICENSE"
    | "VOTER_ID"
    | "BANK_STATEMENT"
    | "OTHER";
  documentHash: string;
  ipfsHash?: string;
  ipfsUrl?: string;
  fileName?: string;
  fileSize?: number;
  uploadedAt: string;
}

// KYC Record Structure
export interface KYCRecord {
  id: string;
  userId: string;
  name: string;
  email: string;
  phone: string;
  pan: string;
  dateOfBirth: string;
  address: {
    street: string;
    city: string;
    state: string;
    pincode: string;
    country: string;
  };
  documents: KYCDocument[];
  status: "PENDING" | "VERIFIED" | "REJECTED" | "EXPIRED";
  verificationLevel: "L0" | "L1" | "L2" | "L3";

  // 📊 Enhanced Blockchain Information
  blockchainTxHash?: string;
  blockchainBlockNumber?: number;
  submissionHash?: string;
  adminBlockchainTxHash?: string;
  ipfsHashes?: string[];
  documentHashes?: string[];

  // 🔒 Security & Storage Information
  permanentStorage?: boolean;
  temporaryRecord?: boolean;
  approvalRequired?: boolean;

  // 🕐 Timestamp Information
  createdAt: string;
  updatedAt: string;
  submittedAt?: string;
  verifiedAt?: string;
  rejectedAt?: string;
  adminApprovalTimestamp?: string;

  // 👤 User Information
  verifiedBy?: string;
  remarks?: string;
}

// KYC Submission Request
export interface KYCSubmissionRequest {
  name: string;
  email: string;
  phone: string;
  pan: string;
  dateOfBirth: string;
  address: {
    street: string;
    city: string;
    state: string;
    pincode: string;
    country: string;
  };
  documents: File[];
}

// KYC Verification Request
export interface KYCVerificationRequest {
  kycId?: string;
  pan?: string;
  email?: string;
}

// KYC Verification Response
export interface KYCVerificationResponse {
  success: boolean;
  record?: KYCRecord;
  message: string;
  verificationLevel?: "L1" | "L2" | "L3";
  blockchainVerified: boolean;
}

// KYC History Entry
export interface KYCHistoryEntry {
  id: string;
  kycId: string;
  action: "CREATED" | "UPDATED" | "VERIFIED" | "REJECTED" | "RESUBMITTED";
  performedBy: string;
  performedAt: string;
  blockchainTxHash: string;
  details: Record<string, any>;
  remarks?: string;
}

// KYC Dashboard Stats
export interface KYCStats {
  totalSubmissions: number;
  pendingVerifications: number;
  verifiedRecords: number;
  rejectedRecords: number;
  averageProcessingTime: number; // in hours
}

// Authentication Types
export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: "USER" | "VERIFIER" | "ADMIN";
  isVerified: boolean;
  kycStatus?: "PENDING" | "VERIFIED" | "REJECTED";
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  role?: "USER" | "VERIFIER";
}

export interface AuthResponse {
  success: boolean;
  user?: AuthUser;
  token?: string;
  message: string;
}

// Blockchain Transaction Response
export interface BlockchainTxResponse {
  success: boolean;
  txHash: string;
  blockNumber?: number;
  gasUsed?: number;
  message: string;
}

// IPFS Upload Response
export interface IPFSUploadResponse {
  success: boolean;
  hash: string;
  url: string;
  size: number;
}

// API Response Wrapper
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message: string;
  error?: string;
  timestamp: string;
}
