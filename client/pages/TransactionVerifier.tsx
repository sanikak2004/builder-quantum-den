import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Shield,
  Search,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
  Hash,
  FileText,
  User,
  Calendar,
  Database,
  Link as LinkIcon,
  Copy,
  Eye
} from "lucide-react";

interface TransactionVerification {
  found: boolean;
  isValid: boolean;
  isConfirmed?: boolean;
  confirmations?: number;
  blockNumber?: number;
  submittedAt?: string;
  kycRecord?: {
    name: string;
    status: string;
    createdAt: string;
    documentCount: number;
  };
  hashVerification?: {
    hashesMatch: boolean;
    storedHashCount: number;
    actualHashCount: number;
  };
  message: string;
  evidence?: any;
}

export default function TransactionVerifier() {
  const [transactionHash, setTransactionHash] = useState("");
  const [userPan, setUserPan] = useState("");
  const [isChecking, setIsChecking] = useState(false);
  const [verificationResult, setVerificationResult] = useState<TransactionVerification | null>(null);
  const [error, setError] = useState("");

  const handleHashCheck = async () => {
    if (!transactionHash.trim()) {
      setError("Please enter a transaction hash");
      return;
    }

    setIsChecking(true);
    setError("");
    setVerificationResult(null);

    try {
      const queryParams = new URLSearchParams();
      if (userPan.trim()) {
        queryParams.append("pan", userPan.trim());
      }
      
      const response = await fetch(
        `/api/verify/transaction/${transactionHash.trim()}?${queryParams.toString()}`
      );
      const result = await response.json();

      if (result.success) {
        setVerificationResult(result.data);
      } else {
        setError(result.message || "Failed to verify transaction hash");
      }
    } catch (error) {
      setError("Network error. Please try again.");
    } finally {
      setIsChecking(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const getStatusColor = (status: string) => {
    switch (status?.toUpperCase()) {
      case "VERIFIED":
        return "bg-green-100 text-green-800 border-green-200";
      case "PENDING":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "REJECTED":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-slate-100 text-slate-800 border-slate-200";
    }
  };

  const getVerificationIcon = (isValid: boolean, found: boolean) => {
    if (!found) return <XCircle className="h-5 w-5 text-red-500" />;
    if (isValid) return <CheckCircle className="h-5 w-5 text-green-500" />;
    return <AlertTriangle className="h-5 w-5 text-red-500" />;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200/50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center space-x-3">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-2 rounded-lg">
              <Shield className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-800">
                Transaction Hash Verification
              </h1>
              <p className="text-xs text-slate-500">
                Verify blockchain transaction authenticity
              </p>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Hash Input Form */}
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Hash className="h-5 w-5 text-blue-600" />
                Transaction Hash Checker
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="txHash">Transaction Hash *</Label>
                  <Input
                    id="txHash"
                    placeholder="Enter blockchain transaction hash..."
                    value={transactionHash}
                    onChange={(e) => setTransactionHash(e.target.value)}
                    className="font-mono text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pan">PAN Number (Optional)</Label>
                  <Input
                    id="pan"
                    placeholder="Enter your PAN for verification"
                    value={userPan}
                    onChange={(e) => setUserPan(e.target.value.toUpperCase())}
                    maxLength={10}
                  />
                </div>
              </div>
              
              <Button 
                onClick={handleHashCheck}
                disabled={isChecking || !transactionHash.trim()}
                className="w-full md:w-auto"
              >
                {isChecking ? (
                  <>
                    <Clock className="h-4 w-4 mr-2 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  <>
                    <Search className="h-4 w-4 mr-2" />
                    Verify Transaction
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Error Alert */}
          {error && (
            <Alert className="bg-red-50 border-red-200">
              <XCircle className="h-4 w-4 text-red-600" />
              <AlertTitle className="text-red-800">Verification Failed</AlertTitle>
              <AlertDescription className="text-red-700">
                {error}
              </AlertDescription>
            </Alert>
          )}

          {/* Verification Results */}
          {verificationResult && (
            <div className="space-y-4">
              {/* Main Status Card */}
              <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {getVerificationIcon(verificationResult.isValid, verificationResult.found)}
                    Verification Result
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm text-slate-500">Status</p>
                        <div className="flex items-center gap-2">
                          {verificationResult.isValid ? (
                            <Badge className="bg-green-100 text-green-800">
                              ✅ Valid Transaction
                            </Badge>
                          ) : verificationResult.found ? (
                            <Badge className="bg-red-100 text-red-800">
                              ❌ Invalid/Tampered
                            </Badge>
                          ) : (
                            <Badge className="bg-gray-100 text-gray-800">
                              ❓ Not Found
                            </Badge>
                          )}
                        </div>
                      </div>
                      
                      <div>
                        <p className="text-sm text-slate-500">Message</p>
                        <p className="font-medium">{verificationResult.message}</p>
                      </div>
                      
                      {verificationResult.found && (
                        <>
                          <div>
                            <p className="text-sm text-slate-500">Confirmations</p>
                            <p className="font-mono font-medium">
                              {verificationResult.confirmations || 0}
                            </p>
                          </div>
                          
                          {verificationResult.blockNumber && (
                            <div>
                              <p className="text-sm text-slate-500">Block Number</p>
                              <p className="font-mono font-medium">
                                #{verificationResult.blockNumber}
                              </p>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                    
                    <div className="space-y-3">
                      {verificationResult.submittedAt && (
                        <div>
                          <p className="text-sm text-slate-500">Submitted At</p>
                          <p className="font-medium">
                            {new Date(verificationResult.submittedAt).toLocaleString()}
                          </p>
                        </div>
                      )}
                      
                      {verificationResult.hashVerification && (
                        <div>
                          <p className="text-sm text-slate-500">Hash Verification</p>
                          <div className="flex items-center gap-2">
                            {verificationResult.hashVerification.hashesMatch ? (
                              <Badge className="bg-green-100 text-green-800">
                                ✅ Hashes Match
                              </Badge>
                            ) : (
                              <Badge className="bg-red-100 text-red-800">
                                ❌ Hash Mismatch
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-slate-500 mt-1">
                            Stored: {verificationResult.hashVerification.storedHashCount} hashes, 
                            Actual: {verificationResult.hashVerification.actualHashCount} hashes
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* KYC Record Details */}
              {verificationResult.kycRecord && (
                <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <User className="h-5 w-5 text-blue-600" />
                      Associated KYC Record
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <p className="text-sm text-slate-500">Name</p>
                        <p className="font-medium">{verificationResult.kycRecord.name}</p>
                      </div>
                      
                      <div>
                        <p className="text-sm text-slate-500">Status</p>
                        <Badge className={getStatusColor(verificationResult.kycRecord.status)}>
                          {verificationResult.kycRecord.status}
                        </Badge>
                      </div>
                      
                      <div>
                        <p className="text-sm text-slate-500">Documents</p>
                        <p className="font-medium">
                          {verificationResult.kycRecord.documentCount} files
                        </p>
                      </div>
                      
                      <div>
                        <p className="text-sm text-slate-500">Created</p>
                        <p className="text-sm">
                          {new Date(verificationResult.kycRecord.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Hash Details */}
              <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Database className="h-5 w-5 text-purple-600" />
                    Transaction Details
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                      <div className="flex-1">
                        <p className="text-sm text-slate-500">Transaction Hash</p>
                        <p className="font-mono text-sm break-all">{transactionHash}</p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyToClipboard(transactionHash)}
                        className="ml-2"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    {verificationResult.evidence && (
                      <div>
                        <p className="text-sm text-slate-500 mb-2">Evidence</p>
                        <pre className="text-xs bg-slate-50 p-3 rounded-lg overflow-auto">
                          {JSON.stringify(verificationResult.evidence, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
