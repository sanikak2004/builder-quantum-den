import { useState, useRef, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Shield,
  Upload,
  FileText,
  CheckCircle,
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  CreditCard,
  Loader2,
  Copy,
  Clock,
  ExternalLink,
  FileCheck,
  Hash,
  Database,
  Server,
  X,
  Camera,
  Smartphone,
  Monitor,
} from "lucide-react";
import { KYCSubmissionRequest, ApiResponse, KYCRecord } from "@shared/api";
import { useAuth } from "@/hooks/useAuth";

// Define the backend response type based on server implementation
interface BackendKYCSuccessResponse {
  success: true;
  data: {
    kycId: string;
    status: string;
    message: string;
    blockchainTxHash?: string;
    blockchainNetwork?: string;
    documentsUploaded: number;
    permanentStorage: boolean;
    temporaryRecord: boolean;
    submissionHash?: string;
    submissionTime: string;
    ipfsService: string;
  };
  message: string;
  redirectTo?: string;
  timestamp: string;
}

export default function KYCSubmission() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [submittedRecord, setSubmittedRecord] = useState<KYCRecord | null>(null);
  const [submissionDetails, setSubmissionDetails] = useState<{
    txHash: string;
    blockNumber?: number;
    submissionHash?: string;
    ipfsHashes: string[];
    documentHashes?: string[];
    documentCount?: number;
    kycId: string;
    temporaryStorage?: boolean;
    approvalRequired?: boolean;
  } | null>(null);

  const [formData, setFormData] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phone: "",
    pan: "",
    dateOfBirth: "",
    address: {
      street: "",
      city: "",
      state: "",
      pincode: "",
      country: "India",
    },
  });

  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);

  // Redirect to auth if not authenticated
  if (!authLoading && !isAuthenticated) {
    navigate("/auth/login?redirect=/submit");
    return null;
  }

  const handleInputChange = (field: string, value: string) => {
    if (field.startsWith("address.")) {
      const addressField = field.split(".")[1];
      setFormData((prev) => ({
        ...prev,
        address: {
          ...prev.address,
          [addressField]: value,
        },
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [field]: value,
      }));
    }
  };

  // Enhanced file handling with drag & drop
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files).filter(file => {
      const isValidType = file.type.includes('pdf') || file.type.includes('image');
      const isValidSize = file.size <= 5 * 1024 * 1024; // 5MB
      return isValidType && isValidSize;
    });
    
    setSelectedFiles((prev) => [...prev, ...files]);
  }, []);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []).filter(file => {
      const isValidType = file.type.includes('pdf') || file.type.includes('image');
      const isValidSize = file.size <= 5 * 1024 * 1024; // 5MB
      return isValidType && isValidSize;
    });
    setSelectedFiles((prev) => [...prev, ...files]);
  };

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const validateStep = (step: number) => {
    switch (step) {
      case 1:
        return (
          formData.name &&
          formData.email &&
          formData.phone &&
          formData.pan &&
          /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(formData.pan) &&
          formData.dateOfBirth
        );
      case 2:
        return (
          formData.address.street &&
          formData.address.city &&
          formData.address.state &&
          formData.address.pincode
        );
      case 3:
        return selectedFiles.length > 0;
      default:
        return true;
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setSubmitError("");
    setUploadProgress(0);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append("data", JSON.stringify(formData));
      
      selectedFiles.forEach((file) => {
        formDataToSend.append(`documents`, file);
      });

      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      const response = await fetch("/api/kyc/submit", {
        method: "POST",
        body: formDataToSend,
        headers: {
          // Include auth token if available
          ...(user && { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` })
        }
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      const result: BackendKYCSuccessResponse | ApiResponse = await response.json();

      if (result.success) {
        const successResult = result as BackendKYCSuccessResponse;

        // Create record with the actual data from backend
        const completeRecord: KYCRecord = {
          id: successResult.data.kycId,
          userId: user?.id || "anonymous",
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          pan: formData.pan,
          dateOfBirth: formData.dateOfBirth,
          address: formData.address,
          status: "PENDING",
          verificationLevel: "L0",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          documents: selectedFiles.map((file, index) => ({
            id: `doc_${index}`,
            type: file.name.toLowerCase().includes('pan') ? 'PAN' : 
                  file.name.toLowerCase().includes('aadhaar') ? 'AADHAAR' : 'OTHER',
            documentHash: `hash_${index}`,
            fileName: file.name,
            fileSize: file.size,
            uploadedAt: new Date().toISOString(),
          })),
          blockchainTxHash: successResult.data.blockchainTxHash,
          permanentStorage: successResult.data.permanentStorage,
          temporaryRecord: successResult.data.temporaryRecord,
        };

        setSubmitSuccess(true);
        setSubmittedRecord(completeRecord);

        // Store enhanced blockchain details from backend response
        setSubmissionDetails({
          txHash: successResult.data.blockchainTxHash || "pending",
          submissionHash: successResult.data.submissionHash,
          ipfsHashes: [],
          kycId: successResult.data.kycId,
          temporaryStorage: successResult.data.temporaryRecord,
          approvalRequired: true,
          documentCount: successResult.data.documentsUploaded,
        });

        // Auto-redirect to verification page after 5 seconds
        if (successResult.redirectTo) {
          setTimeout(() => {
            navigate(successResult.redirectTo!);
          }, 5000);
        }
      } else {
        const errorResult = result as ApiResponse;
        let errorMessage = errorResult.message || "Submission failed";

        if (errorMessage.includes("DUPLICATE_PAN")) {
          errorMessage = "This PAN number is already registered. Please check your verification status.";
        } else if (errorMessage.includes("PAN format")) {
          errorMessage = "PAN Number format is invalid. Please use format: ABCDE1234F";
        } else if (errorMessage.includes("document")) {
          errorMessage = "Please upload at least one valid document (PDF, JPG, PNG)";
        }

        setSubmitError(errorMessage);
      }
    } catch (error) {
      setSubmitError("Network error. Please check your connection and try again.");
    } finally {
      setIsSubmitting(false);
      setUploadProgress(0);
    }
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, 4));
    }
  };

  const prevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  // Success page
  if (submitSuccess && submittedRecord && submissionDetails) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        {/* Mobile-optimized Header */}
        <header className="bg-white/80 backdrop-blur-md border-b border-slate-200/50 sticky top-0 z-50">
          <div className="container mx-auto px-4 sm:px-6 py-4">
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-2 rounded-lg">
                <Shield className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-bold text-slate-800">
                  Authen Ledger
                </h1>
                <p className="text-xs text-slate-500">
                  KYC Submission Successful
                </p>
              </div>
            </div>
          </div>
        </header>

        {/* Mobile-optimized Success Content */}
        <div className="container mx-auto px-4 sm:px-6 py-8 sm:py-12">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <div className="bg-green-100 p-4 sm:p-6 rounded-full w-fit mx-auto mb-6">
                <CheckCircle className="h-12 w-12 sm:h-16 sm:w-16 text-green-600" />
              </div>
              <h1 className="text-2xl sm:text-4xl font-bold text-slate-800 mb-4">
                KYC Submitted Successfully!
              </h1>
              <p className="text-lg sm:text-xl text-slate-600 mb-8">
                Your KYC application has been processed and recorded on the blockchain.
              </p>
            </div>

            {/* Mobile-responsive cards */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-8">
              <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                    <User className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                    Personal Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-sm text-slate-500">Name</p>
                    <p className="font-medium break-words">{submittedRecord.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Email</p>
                    <p className="font-medium break-all">{submittedRecord.email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">PAN Number</p>
                    <p className="font-mono font-medium">
                      {submittedRecord.pan}
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                    <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                    Submission Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-sm text-slate-500">KYC ID</p>
                    <p className="font-mono text-sm font-semibold break-all">
                      {submittedRecord.id}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Status</p>
                    <Badge className="bg-yellow-100 text-yellow-800">
                      {submittedRecord.status}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Submitted At</p>
                    <p className="text-sm">
                      {new Date(submittedRecord.createdAt).toLocaleString()}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Mobile-optimized Blockchain Details */}
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg mb-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <Shield className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600" />
                  Blockchain Verification
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert className="bg-blue-50 border-blue-200">
                  <Server className="h-4 w-4 text-blue-600" />
                  <AlertTitle className="text-blue-800">
                    🔒 Blockchain Security Confirmed
                  </AlertTitle>
                  <AlertDescription className="text-blue-700">
                    Your KYC data has been securely stored on blockchain and IPFS.
                    {submissionDetails.temporaryStorage && (
                      <span className="block mt-1 text-orange-700 font-medium">
                        ⏳ Currently in temporary storage - awaiting admin verification.
                      </span>
                    )}
                  </AlertDescription>
                </Alert>

                {submissionDetails.approvalRequired && (
                  <Alert className="bg-orange-50 border-orange-200">
                    <Clock className="h-4 w-4 text-orange-600" />
                    <AlertTitle className="text-orange-800">
                      ⏳ Approval Required
                    </AlertTitle>
                    <AlertDescription className="text-orange-700">
                      Your KYC is pending admin verification. Redirecting to status page in 5 seconds.
                    </AlertDescription>
                  </Alert>
                )}

                {/* Mobile-responsive blockchain details */}
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-slate-500 mb-1 flex items-center gap-1">
                      <Hash className="h-4 w-4" /> Transaction Hash
                    </p>
                    <div className="flex items-center gap-2">
                      <p className="font-mono text-xs break-all bg-slate-100 p-2 rounded flex-1">
                        {submissionDetails.txHash}
                      </p>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="shrink-0"
                        onClick={() => copyToClipboard(submissionDetails.txHash)}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  
                  <div>
                    <p className="text-sm text-slate-500 mb-1 flex items-center gap-1">
                      <FileCheck className="h-4 w-4" /> Documents Processed
                    </p>
                    <p className="font-mono text-sm bg-slate-100 p-2 rounded">
                      {submissionDetails.documentCount} documents
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Mobile-optimized action buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to={`/verify?id=${submittedRecord.id}`} className="w-full sm:w-auto">
                <Button
                  size="lg"
                  className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-indigo-600"
                >
                  Check Verification Status
                </Button>
              </Link>
              <Link to="/" className="w-full sm:w-auto">
                <Button variant="outline" size="lg" className="w-full sm:w-auto">
                  Back to Home
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Loading state
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Main form UI with mobile responsiveness
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
                <p className="text-xs text-slate-500">
                  Submit Your KYC Documents
                </p>
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

      {/* Mobile-optimized Progress Bar */}
      <div className="bg-white/60 backdrop-blur-sm border-b border-slate-200/50 py-4">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-base sm:text-lg font-semibold text-slate-800">
              KYC Submission
            </h2>
            <span className="text-sm text-slate-600">
              Step {currentStep} of 4
            </span>
          </div>
          <Progress value={(currentStep / 4) * 100} className="h-2" />
          <div className="flex justify-between mt-2 text-xs text-slate-500">
            <span className={currentStep >= 1 ? "text-blue-600 font-medium" : ""}>
              Personal
            </span>
            <span className={currentStep >= 2 ? "text-blue-600 font-medium" : ""}>
              Address
            </span>
            <span className={currentStep >= 3 ? "text-blue-600 font-medium" : ""}>
              Documents
            </span>
            <span className={currentStep >= 4 ? "text-blue-600 font-medium" : ""}>
              Review
            </span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <div className="max-w-2xl mx-auto">
          {submitError && (
            <Alert className="mb-6 border-red-200 bg-red-50">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                {submitError}
              </AlertDescription>
            </Alert>
          )}

          {/* Upload Progress */}
          {isSubmitting && uploadProgress > 0 && (
            <Card className="mb-6 bg-white/80 backdrop-blur-sm border-0 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-2">
                  <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                  <span className="font-medium">Uploading and processing...</span>
                </div>
                <Progress value={uploadProgress} className="h-2" />
                <p className="text-xs text-slate-500 mt-1">
                  Encrypting documents and storing on blockchain
                </p>
              </CardContent>
            </Card>
          )}

          {/* Step 1: Personal Information */}
          {currentStep === 1 && (
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5 text-blue-600" />
                  Personal Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <Label htmlFor="name">Full Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => handleInputChange("name", e.target.value)}
                      placeholder="Enter your full name"
                      className="text-base" // Better for mobile
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <Label htmlFor="email">Email Address *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange("email", e.target.value)}
                      placeholder="Enter your email"
                      className="text-base"
                      disabled={!!user?.email} // Disable if user is logged in
                    />
                    {user?.email && (
                      <p className="text-xs text-slate-500 mt-1">
                        Using your account email
                      </p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone Number *</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => handleInputChange("phone", e.target.value)}
                      placeholder="Enter your phone number"
                      className="text-base"
                    />
                  </div>
                  <div>
                    <Label htmlFor="pan">PAN Number *</Label>
                    <Input
                      id="pan"
                      value={formData.pan}
                      onChange={(e) => handleInputChange("pan", e.target.value.toUpperCase())}
                      placeholder="ABCDE1234F"
                      maxLength={10}
                      className={`text-base ${
                        formData.pan && !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(formData.pan)
                          ? "border-red-300 focus:border-red-500"
                          : ""
                      }`}
                    />
                    {formData.pan && !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(formData.pan) && (
                      <p className="text-xs text-red-600 mt-1">
                        PAN must be 10 characters: 5 letters + 4 digits + 1 letter
                      </p>
                    )}
                  </div>
                  <div className="sm:col-span-2">
                    <Label htmlFor="dob">Date of Birth *</Label>
                    <Input
                      id="dob"
                      type="date"
                      value={formData.dateOfBirth}
                      onChange={(e) => handleInputChange("dateOfBirth", e.target.value)}
                      className="text-base"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 2: Address Information */}
          {currentStep === 2 && (
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-blue-600" />
                  Address Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label htmlFor="street">Street Address *</Label>
                  <Textarea
                    id="street"
                    value={formData.address.street}
                    onChange={(e) => handleInputChange("address.street", e.target.value)}
                    placeholder="Enter your complete street address"
                    rows={3}
                    className="text-base resize-none"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="city">City *</Label>
                    <Input
                      id="city"
                      value={formData.address.city}
                      onChange={(e) => handleInputChange("address.city", e.target.value)}
                      placeholder="Enter your city"
                      className="text-base"
                    />
                  </div>
                  <div>
                    <Label htmlFor="state">State *</Label>
                    <Input
                      id="state"
                      value={formData.address.state}
                      onChange={(e) => handleInputChange("address.state", e.target.value)}
                      placeholder="Enter your state"
                      className="text-base"
                    />
                  </div>
                  <div>
                    <Label htmlFor="pincode">PIN Code *</Label>
                    <Input
                      id="pincode"
                      value={formData.address.pincode}
                      onChange={(e) => handleInputChange("address.pincode", e.target.value)}
                      placeholder="Enter PIN code"
                      maxLength={6}
                      className="text-base"
                    />
                  </div>
                  <div>
                    <Label htmlFor="country">Country *</Label>
                    <Select
                      value={formData.address.country}
                      onValueChange={(value) => handleInputChange("address.country", value)}
                    >
                      <SelectTrigger className="text-base">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="India">India</SelectItem>
                        <SelectItem value="USA">United States</SelectItem>
                        <SelectItem value="UK">United Kingdom</SelectItem>
                        <SelectItem value="Canada">Canada</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 3: Enhanced Document Upload with Drag & Drop */}
          {currentStep === 3 && (
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="h-5 w-5 text-blue-600" />
                  Upload Documents
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Enhanced drag & drop area */}
                <div
                  className={`border-2 border-dashed rounded-lg p-6 sm:p-8 text-center transition-colors ${
                    isDragOver
                      ? "border-blue-500 bg-blue-50"
                      : "border-slate-300 hover:border-slate-400"
                  }`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  <div className="flex flex-col items-center space-y-4">
                    <div className="flex items-center justify-center space-x-2 text-slate-400">
                      <Upload className="h-8 w-8 sm:h-12 sm:w-12" />
                      <div className="hidden sm:flex space-x-2">
                        <Smartphone className="h-6 w-6" />
                        <Monitor className="h-6 w-6" />
                      </div>
                    </div>
                    <div>
                      <h3 className="text-lg font-medium text-slate-700 mb-2">
                        Upload Identity Documents
                      </h3>
                      <p className="text-slate-500 mb-4 text-sm sm:text-base">
                        Drag & drop files here or click to select
                      </p>
                      <p className="text-slate-500 mb-4 text-sm">
                        PAN Card, Aadhaar, Passport, Bank Statement, etc.
                      </p>
                    </div>
                    <div className="space-y-2">
                      <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={handleFileSelect}
                        className="hidden"
                        id="file-upload"
                      />
                      <Label htmlFor="file-upload">
                        <Button asChild className="w-full sm:w-auto">
                          <span className="flex items-center gap-2">
                            <Camera className="h-4 w-4" />
                            Select Files
                          </span>
                        </Button>
                      </Label>
                      <p className="text-xs text-slate-400">
                        Supported: PDF, JPG, PNG (Max 5MB each)
                      </p>
                    </div>
                  </div>
                </div>

                {/* Selected files list with mobile optimization */}
                {selectedFiles.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="font-medium text-slate-700 flex items-center gap-2">
                      <FileCheck className="h-4 w-4" />
                      Selected Files ({selectedFiles.length})
                    </h4>
                    <div className="space-y-2">
                      {selectedFiles.map((file, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between bg-slate-50 p-3 rounded-lg"
                        >
                          <div className="flex items-center space-x-3 flex-1 min-w-0">
                            <FileText className="h-5 w-5 text-blue-600 flex-shrink-0" />
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium text-slate-700 truncate">
                                {file.name}
                              </p>
                              <p className="text-xs text-slate-500">
                                {(file.size / 1024 / 1024).toFixed(2)} MB
                              </p>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeFile(index)}
                            className="text-red-600 hover:text-red-700 flex-shrink-0 ml-2"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Step 4: Review */}
          {currentStep === 4 && (
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-blue-600" />
                  Review & Submit
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-6">
                  {/* Personal Info */}
                  <div>
                    <h4 className="font-medium text-slate-700 mb-3 flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Personal Information
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="text-slate-500">Name:</span>
                        <p className="font-medium">{formData.name}</p>
                      </div>
                      <div>
                        <span className="text-slate-500">Email:</span>
                        <p className="font-medium break-all">{formData.email}</p>
                      </div>
                      <div>
                        <span className="text-slate-500">Phone:</span>
                        <p className="font-medium">{formData.phone}</p>
                      </div>
                      <div>
                        <span className="text-slate-500">PAN:</span>
                        <p className="font-mono font-medium">{formData.pan}</p>
                      </div>
                      <div className="sm:col-span-2">
                        <span className="text-slate-500">Date of Birth:</span>
                        <p className="font-medium">{formData.dateOfBirth}</p>
                      </div>
                    </div>
                  </div>

                  {/* Address */}
                  <div>
                    <h4 className="font-medium text-slate-700 mb-3 flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      Address
                    </h4>
                    <div className="text-sm space-y-1">
                      <p><span className="text-slate-500">Street:</span> {formData.address.street}</p>
                      <p><span className="text-slate-500">City:</span> {formData.address.city}</p>
                      <p><span className="text-slate-500">State:</span> {formData.address.state}</p>
                      <p><span className="text-slate-500">PIN:</span> {formData.address.pincode}</p>
                      <p><span className="text-slate-500">Country:</span> {formData.address.country}</p>
                    </div>
                  </div>

                  {/* Documents */}
                  <div>
                    <h4 className="font-medium text-slate-700 mb-3 flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Documents ({selectedFiles.length})
                    </h4>
                    <div className="space-y-2">
                      {selectedFiles.map((file, index) => (
                        <div key={index} className="flex items-center space-x-2 text-sm">
                          <FileText className="h-4 w-4 text-blue-600 flex-shrink-0" />
                          <span className="truncate">{file.name}</span>
                          <span className="text-slate-500 text-xs">
                            ({(file.size / 1024 / 1024).toFixed(2)} MB)
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <Alert className="border-blue-200 bg-blue-50">
                  <Shield className="h-4 w-4 text-blue-600" />
                  <AlertDescription className="text-blue-800">
                    Your documents will be encrypted and stored securely. Document hashes will be 
                    recorded on the blockchain for immutable verification.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          )}

          {/* Mobile-optimized Navigation Buttons */}
          <div className="flex flex-col sm:flex-row justify-between gap-4 mt-8">
            <Button
              variant="outline"
              onClick={prevStep}
              disabled={currentStep === 1}
              className="w-full sm:w-auto order-2 sm:order-1"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Previous
            </Button>

            {currentStep < 4 ? (
              <Button
                onClick={nextStep}
                disabled={!validateStep(currentStep)}
                className="w-full sm:w-auto order-1 sm:order-2"
              >
                Next
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-indigo-600 order-1 sm:order-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    Submit KYC
                    <CheckCircle className="h-4 w-4 ml-2" />
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
