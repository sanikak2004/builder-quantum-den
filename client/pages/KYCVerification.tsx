import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Shield,
  Search,
  CheckCircle,
  Clock,
  AlertTriangle,
  XCircle,
  ArrowLeft,
  FileText,
  Eye,
  Download,
  Loader2,
  Hash,
  Calendar,
  User,
  ExternalLink,
  Copy,
  MapPin,
  CreditCard,
  Smartphone,
  Monitor,
  RefreshCw,
} from "lucide-react";
import { KYCRecord, KYCVerificationResponse, ApiResponse } from "@shared/api";

export default function KYCVerification() {
  const [searchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get("id") || "");
  const [searchType, setSearchType] = useState<"id" | "pan" | "email">("id");
  const [isSearching, setIsSearching] = useState(false);
  const [verificationResult, setVerificationResult] =
    useState<KYCVerificationResponse | null>(null);
  const [searchError, setSearchError] = useState("");

  useEffect(() => {
    if (searchParams.get("id")) {
      handleSearch();
    }
  }, []);

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchError("Please enter a search query");
      return;
    }

    setIsSearching(true);
    setSearchError("");
    setVerificationResult(null);

    try {
      const params = new URLSearchParams({
        [searchType]: searchQuery.trim(),
      });

      const response = await fetch(`/api/kyc/verify?${params}`);
      const result: ApiResponse<KYCVerificationResponse> =
        await response.json();

      if (result.success && result.data) {
        setVerificationResult(result.data);
      } else {
        setSearchError(result.message || "Verification failed");
      }
    } catch (error) {
      setSearchError("Network error. Please try again.");
    } finally {
      setIsSearching(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "VERIFIED":
        return "bg-green-100 text-green-800 border-green-200";
      case "PENDING":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "REJECTED":
        return "bg-red-100 text-red-800 border-red-200";
      case "EXPIRED":
        return "bg-gray-100 text-gray-800 border-gray-200";
      default:
        return "bg-slate-100 text-slate-800 border-slate-200";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "VERIFIED":
        return <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5" />;
      case "PENDING":
        return <Clock className="h-4 w-4 sm:h-5 sm:w-5" />;
      case "REJECTED":
        return <XCircle className="h-4 w-4 sm:h-5 sm:w-5" />;
      case "EXPIRED":
        return <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5" />;
      default:
        return <Clock className="h-4 w-4 sm:h-5 sm:w-5" />;
    }
  };

  const getVerificationLevelColor = (level: string) => {
    switch (level) {
      case "L3":
        return "bg-purple-100 text-purple-800";
      case "L2":
        return "bg-blue-100 text-blue-800";
      case "L1":
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-slate-100 text-slate-800";
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Mobile-optimized Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200/50 sticky top-0 z-50">
        <div className="container mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-2 rounded-lg">
                <Shield className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-bold text-slate-800">
                  Authen Ledger
                </h1>
                <p className="text-xs text-slate-500">Verify KYC Status</p>
              </div>
            </div>
            <Link to="/">
              <Button variant="ghost" size="sm" className="hidden sm:flex">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Home
              </Button>
              <Button variant="ghost" size="sm" className="sm:hidden p-2">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <div className="max-w-4xl mx-auto">
          {/* Mobile-optimized Search Section */}
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                <Search className="h-5 w-5 text-blue-600" />
                Verify KYC Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Mobile-first search interface */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="searchType" className="text-sm font-medium">
                    Search by
                  </Label>
                  <Select value={searchType} onValueChange={(value: "id" | "pan" | "email") => setSearchType(value)}>
                    <SelectTrigger className="w-full mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="id">KYC ID</SelectItem>
                      <SelectItem value="pan">PAN Number</SelectItem>
                      <SelectItem value="email">Email Address</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="search" className="text-sm font-medium">
                    {searchType === "id" ? "KYC ID" : searchType === "pan" ? "PAN Number" : "Email Address"}
                  </Label>
                  <div className="flex flex-col sm:flex-row gap-2 mt-1">
                    <Input
                      id="search"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder={`Enter ${searchType === "id" ? "KYC ID" : searchType === "pan" ? "PAN number" : "email address"}`}
                      className="flex-1 text-base" // Prevents zoom on iOS
                      onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                    />
                    <Button
                      onClick={handleSearch}
                      disabled={isSearching || !searchQuery.trim()}
                      className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-indigo-600"
                    >
                      {isSearching ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Searching...
                        </>
                      ) : (
                        <>
                          <Search className="h-4 w-4 mr-2" />
                          Verify
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>

              {searchError && (
                <Alert className="border-red-200 bg-red-50">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  <AlertDescription className="text-red-800">
                    {searchError}
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Verification Results */}
          {verificationResult && (
            <div className="space-y-6">
              {/* Mobile-optimized Status Overview */}
              <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <span className="flex items-center gap-2">
                      {getStatusIcon(verificationResult.record?.status || "PENDING")}
                      Verification Status
                    </span>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge
                        className={`${getStatusColor(
                          verificationResult.record?.status || "PENDING",
                        )} text-xs sm:text-sm`}
                      >
                        {verificationResult.record?.status}
                      </Badge>
                      {verificationResult.blockchainVerified && (
                        <Badge className="bg-green-100 text-green-800 text-xs sm:text-sm">
                          <Hash className="h-3 w-3 mr-1" />
                          Blockchain Verified
                        </Badge>
                      )}
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {/* Security Status Alerts */}
                  {verificationResult.record?.temporaryRecord && (
                    <Alert className="mb-4 bg-orange-50 border-orange-200">
                      <Clock className="h-4 w-4 text-orange-600" />
                      <AlertDescription className="text-orange-800 text-sm">
                        <strong>⏳ Temporary Storage:</strong> Your KYC is
                        awaiting admin verification for permanent blockchain storage.
                      </AlertDescription>
                    </Alert>
                  )}

                  {verificationResult.record?.permanentStorage && (
                    <Alert className="mb-4 bg-green-50 border-green-200">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <AlertDescription className="text-green-800 text-sm">
                        <strong>✅ Permanent Storage:</strong> Your KYC is
                        permanently stored on the blockchain.
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* Mobile-responsive status grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="text-center sm:text-left">
                      <p className="text-sm text-slate-500 mb-2">
                        Verification Level
                      </p>
                      <Badge
                        className={`${getVerificationLevelColor(
                          verificationResult.verificationLevel || "L1",
                        )} text-sm px-3 py-1`}
                      >
                        {verificationResult.verificationLevel}
                      </Badge>
                    </div>
                    <div className="text-center sm:text-left">
                      <p className="text-sm text-slate-500 mb-2">
                        Blockchain Status
                      </p>
                      <div className="flex justify-center sm:justify-start">
                        {verificationResult.blockchainVerified ? (
                          <Badge className="bg-green-100 text-green-800 text-sm">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Verified
                          </Badge>
                        ) : (
                          <Badge className="bg-yellow-100 text-yellow-800 text-sm">
                            <Clock className="h-3 w-3 mr-1" />
                            Pending
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="text-center sm:text-left">
                      <p className="text-sm text-slate-500 mb-2">Message</p>
                      <p className="text-sm font-medium text-slate-700">
                        {verificationResult.message}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Mobile-optimized Blockchain Information */}
              {verificationResult.record && (
                <Card className="bg-blue-50 border-blue-200">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Hash className="h-5 w-5 text-blue-600" />
                      Blockchain Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {/* Transaction Hash */}
                      <div>
                        <p className="text-sm text-slate-500 mb-2 flex items-center gap-2">
                          <Hash className="h-4 w-4" />
                          Blockchain Transaction Hash
                        </p>
                        <div className="bg-white p-3 rounded-lg">
                          <div className="flex items-center justify-between gap-2">
                            <p className="font-mono text-xs break-all flex-1">
                              {verificationResult.record.blockchainTxHash || "N/A"}
                            </p>
                            {verificationResult.record.blockchainTxHash && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  copyToClipboard(verificationResult.record!.blockchainTxHash!)
                                }
                                className="shrink-0"
                              >
                                <Copy className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Additional blockchain info in mobile-friendly layout */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {verificationResult.record.submissionHash && (
                          <div>
                            <p className="text-sm text-slate-500 mb-2">
                              Submission Hash
                            </p>
                            <div className="bg-white p-3 rounded-lg">
                              <p className="font-mono text-xs break-all">
                                {verificationResult.record.submissionHash}
                              </p>
                            </div>
                          </div>
                        )}

                        {verificationResult.record.blockchainBlockNumber && (
                          <div>
                            <p className="text-sm text-slate-500 mb-2">
                              Block Number
                            </p>
                            <div className="bg-white p-3 rounded-lg">
                              <p className="font-mono text-sm">
                                {verificationResult.record.blockchainBlockNumber}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* IPFS Hashes */}
                      {verificationResult.record.ipfsHashes &&
                        verificationResult.record.ipfsHashes.length > 0 && (
                          <div>
                            <p className="text-sm text-slate-500 mb-2 flex items-center gap-2">
                              <FileText className="h-4 w-4" />
                              IPFS Document Hashes ({verificationResult.record.ipfsHashes.length})
                            </p>
                            <div className="space-y-2 max-h-32 overflow-y-auto">
                              {verificationResult.record.ipfsHashes.map(
                                (hash, index) => (
                                  <div
                                    key={index}
                                    className="bg-white p-3 rounded-lg flex items-center justify-between gap-2"
                                  >
                                    <p className="font-mono text-xs break-all flex-1">
                                      {hash}
                                    </p>
                                    <div className="flex items-center gap-1 shrink-0">
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => copyToClipboard(hash)}
                                        className="p-1"
                                      >
                                        <Copy className="h-3 w-3" />
                                      </Button>
                                      <a
                                        href={`https://ipfs.io/ipfs/${hash}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                      >
                                        <Button variant="ghost" size="sm" className="p-1">
                                          <ExternalLink className="h-3 w-3" />
                                        </Button>
                                      </a>
                                    </div>
                                  </div>
                                ),
                              )}
                            </div>
                          </div>
                        )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Mobile-optimized Information Cards */}
              {verificationResult.record && (
                <div className="space-y-6">
                  {/* Personal Information */}
                  <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <User className="h-5 w-5 text-blue-600" />
                        Personal Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-slate-500">Name</p>
                          <p className="font-medium text-slate-800 break-words">
                            {verificationResult.record.name}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-slate-500">Email</p>
                          <p className="font-medium text-slate-800 break-all">
                            {verificationResult.record.email}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-slate-500">Phone</p>
                          <p className="font-medium text-slate-800">
                            {verificationResult.record.phone}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-slate-500">PAN</p>
                          <p className="font-mono font-medium text-slate-800">
                            {verificationResult.record.pan}
                          </p>
                        </div>
                        <div className="sm:col-span-2">
                          <p className="text-sm text-slate-500">Date of Birth</p>
                          <p className="font-medium text-slate-800">
                            {verificationResult.record.dateOfBirth}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Address Information */}
                  <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <MapPin className="h-5 w-5 text-blue-600" />
                        Address Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <p className="text-sm text-slate-800">
                          {verificationResult.record.address.street}
                        </p>
                        <p className="text-sm text-slate-800">
                          {verificationResult.record.address.city},{" "}
                          {verificationResult.record.address.state}
                        </p>
                        <p className="text-sm text-slate-800">
                          {verificationResult.record.address.pincode},{" "}
                          {verificationResult.record.address.country}
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Technical Details */}
                  <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <CreditCard className="h-5 w-5 text-blue-600" />
                        Technical Details
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div>
                          <p className="text-sm text-slate-500">KYC ID</p>
                          <div className="flex items-center justify-between gap-2 mt-1">
                            <p className="font-mono text-sm font-medium text-slate-800 break-all flex-1">
                              {verificationResult.record.id}
                            </p>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyToClipboard(verificationResult.record!.id)}
                              className="shrink-0"
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm text-slate-500">Created At</p>
                            <p className="text-sm font-medium text-slate-800">
                              {new Date(verificationResult.record.createdAt).toLocaleString()}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-slate-500">Last Updated</p>
                            <p className="text-sm font-medium text-slate-800">
                              {new Date(verificationResult.record.updatedAt).toLocaleString()}
                            </p>
                          </div>
                        </div>

                        {verificationResult.record.verifiedAt && (
                          <div>
                            <p className="text-sm text-slate-500">Verified At</p>
                            <p className="text-sm font-medium text-slate-800">
                              {new Date(verificationResult.record.verifiedAt).toLocaleString()}
                            </p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Documents */}
                  <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <FileText className="h-5 w-5 text-blue-600" />
                        Documents ({verificationResult.record.documents.length})
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {verificationResult.record.documents.map((doc, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
                          >
                            <div className="flex items-center space-x-3 min-w-0 flex-1">
                              <FileText className="h-5 w-5 text-blue-600 shrink-0" />
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-medium text-slate-700">
                                  {doc.type}
                                </p>
                                <p className="text-xs text-slate-500">
                                  Uploaded: {new Date(doc.uploadedAt).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2 shrink-0">
                              <Button variant="ghost" size="sm" className="p-2">
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="sm" className="p-2">
                                <Download className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Mobile-optimized Action Buttons */}
              <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
                <CardContent className="pt-6">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <Link 
                      to={`/history?id=${verificationResult.record?.id}`}
                      className="w-full"
                    >
                      <Button variant="outline" className="w-full">
                        <Calendar className="h-4 w-4 mr-2" />
                        View History
                      </Button>
                    </Link>
                    <Button className="w-full bg-gradient-to-r from-blue-600 to-indigo-600">
                      <Download className="h-4 w-4 mr-2" />
                      Download Certificate
                    </Button>
                    <Button variant="outline" className="w-full">
                      <FileText className="h-4 w-4 mr-2" />
                      Generate Report
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Mobile-optimized Quick Actions */}
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Link to="/submit" className="block">
                  <Button variant="outline" className="w-full h-16 sm:h-20 flex-col">
                    <FileText className="h-5 w-5 sm:h-6 sm:w-6 mb-2" />
                    <span className="text-sm">Submit New KYC</span>
                  </Button>
                </Link>
                <Link to="/history" className="block">
                  <Button variant="outline" className="w-full h-16 sm:h-20 flex-col">
                    <Calendar className="h-5 w-5 sm:h-6 sm:w-6 mb-2" />
                    <span className="text-sm">View All History</span>
                  </Button>
                </Link>
                <Link to="/" className="block">
                  <Button variant="outline" className="w-full h-16 sm:h-20 flex-col">
                    <Shield className="h-5 w-5 sm:h-6 sm:w-6 mb-2" />
                    <span className="text-sm">Back to Home</span>
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
