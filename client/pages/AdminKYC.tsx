import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Shield,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  ArrowLeft,
  User,
  Mail,
  Phone,
  FileText,
  Eye,
  Download,
  RefreshCw,
  Filter,
  Hash,
  Search,
  Settings,
  BarChart3,
  Users,
  CheckSquare,
  Trash2,
  Calendar,
  Globe,
  Database,
  Lock,
  Zap,
  Activity,
  TrendingUp,
  PieChart,
  FileCheck,
  AlertCircle,
} from "lucide-react";
import { KYCRecord, ApiResponse, KYCStats } from "@shared/api";

export default function AdminKYC() {
  const [records, setRecords] = useState<KYCRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedRecord, setSelectedRecord] = useState<KYCRecord | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [remarks, setRemarks] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRecords, setSelectedRecords] = useState<string[]>([]);
  const [stats, setStats] = useState<KYCStats | null>(null);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [recordsPerPage] = useState(10);
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");

  useEffect(() => {
    fetchKYCRecords();
    fetchDashboardStats();
  }, [filterStatus, currentPage, sortBy, sortOrder]);

  const fetchDashboardStats = async () => {
    try {
      const response = await fetch("/api/admin/stats");
      const result: ApiResponse<KYCStats> = await response.json();
      if (result.success && result.data) {
        setStats(result.data);
      } else {
        console.warn("Stats API returned no data");
        // Let stats remain null to show loading state
        setStats(null);
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
      // Let stats remain null to show error state
      setStats(null);
    }
  };

  const fetchKYCRecords = async () => {
    setIsLoading(true);
    setError("");

    try {
      const params = new URLSearchParams({
        status: filterStatus,
        page: currentPage.toString(),
        limit: recordsPerPage.toString(),
        sortBy,
        sortOrder,
        search: searchQuery,
      });

      console.log(`🔄 Fetching KYC records with params:`, Object.fromEntries(params));
      
      // Add explicit error handling for the response
      const response = await fetch(`/api/admin/kyc/all?${params}`);
      
      // Check if the response is OK
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ HTTP Error ${response.status}: ${response.statusText}`, errorText);
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      // Check content type
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const errorText = await response.text();
        console.error(`❌ Expected JSON but got ${contentType}`, errorText);
        throw new Error(`Expected JSON response but got ${contentType}`);
      }
      
      const result: ApiResponse = await response.json();
      console.log(`📊 API Response:`, result);

      if (result.success && result.data) {
        const recordsData = result.data.records || result.data;
        console.log(`✅ Retrieved ${recordsData.length} KYC records`);
        setRecords(Array.isArray(recordsData) ? recordsData : []);
      } else {
        console.warn(`⚠️ API returned unsuccessful response:`, result.message);
        setError(result.message || "Failed to fetch records");
        setRecords([]); // Set empty array on error
      }
    } catch (error) {
      console.error(`❌ Error fetching KYC records:`, error);
      setError(`Network error: ${error instanceof Error ? error.message : "Unknown error"}. Please check your connection and try again.`);
      setRecords([]); // Set empty array on error
    } finally {
      setIsLoading(false);
    }
  };

  const updateKYCStatus = async (
    recordId: string,
    status: string,
    customRemarks?: string,
  ) => {
    // Confirmation dialog
    const confirmMessage =
      status === "VERIFIED"
        ? "✅ APPROVE this KYC application? This will mark the user as VERIFIED."
        : "❌ REJECT this KYC application? This will require the user to resubmit.";

    if (!window.confirm(confirmMessage)) {
      return;
    }

    setIsUpdating(true);
    console.log(`🔄 LIVE UPDATE: ${status} KYC ID: ${recordId}`);

    try {
      const finalRemarks =
        customRemarks ||
        remarks ||
        (status === "VERIFIED"
          ? "KYC approved by admin - all documents verified ✅"
          : "KYC rejected - please resubmit with correct documents ❌");

      const response = await fetch(`/api/admin/kyc/${recordId}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status,
          remarks: finalRemarks,
          verifiedBy: "admin@ekyc.com",
        }),
      });

      // Check if the response is OK
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ HTTP Error ${response.status}: ${response.statusText}`, errorText);
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      // Check content type
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const errorText = await response.text();
        console.error(`❌ Expected JSON but got ${contentType}`, errorText);
        throw new Error(`Expected JSON response but got ${contentType}`);
      }

      const result: ApiResponse<KYCRecord> = await response.json();

      if (result.success && result.data) {
        console.log(`✅ LIVE UPDATE SUCCESS: Status changed to ${status}`);

        // Update the record in the list with live data
        setRecords((prev) =>
          prev.map((record) =>
            record.id === recordId ? result.data! : record,
          ),
        );
        setSelectedRecord(null);
        setRemarks("");

        // Show success message with live update confirmation
        const successMessage =
          status === "VERIFIED"
            ? `✅ APPROVED! KYC for ${result.data.name} is now VERIFIED`
            : `❌ REJECTED! KYC for ${result.data.name} has been rejected`;

        alert(successMessage);
      } else {
        throw new Error(result.message || "Failed to update KYC status");
      }
    } catch (error) {
      console.error(`❌ Error updating KYC status:`, error);
      alert(`Error updating KYC status: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleBulkAction = async (action: string) => {
    if (selectedRecords.length === 0) {
      alert("Please select records to perform bulk action");
      return;
    }

    const confirmMessage = `${action.toUpperCase()} ${selectedRecords.length} selected records?`;
    if (!window.confirm(confirmMessage)) {
      return;
    }

    setIsUpdating(true);
    try {
      const response = await fetch("/api/admin/kyc/bulk", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          recordIds: selectedRecords,
          action,
          remarks: `Bulk ${action} by admin`,
        }),
      });

      const result = await response.json();
      if (result.success) {
        alert(`✅ Bulk ${action} completed successfully`);
        setSelectedRecords([]);
        fetchKYCRecords();
        fetchDashboardStats();
      } else {
        alert(`❌ Bulk action failed: ${result.message}`);
      }
    } catch (error) {
      alert("❌ Network error during bulk action");
    } finally {
      setIsUpdating(false);
    }
  };

  const toggleRecordSelection = (recordId: string) => {
    setSelectedRecords((prev) =>
      prev.includes(recordId)
        ? prev.filter((id) => id !== recordId)
        : [...prev, recordId],
    );
  };

  const toggleSelectAll = () => {
    if (selectedRecords.length === records.length) {
      setSelectedRecords([]);
    } else {
      setSelectedRecords(records.map((r) => r.id));
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
      default:
        return "bg-slate-100 text-slate-800 border-slate-200";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "VERIFIED":
        return <CheckCircle className="h-4 w-4" />;
      case "PENDING":
        return <Clock className="h-4 w-4" />;
      case "REJECTED":
        return <XCircle className="h-4 w-4" />;
      default:
        return <AlertTriangle className="h-4 w-4" />;
    }
  };

  const exportRecords = () => {
    const csvData = records
      .map((record) => [
        record.id,
        record.name,
        record.email,
        record.status,
        record.createdAt,
        record.verifiedAt || "",
      ])
      .join("\\n");

    const blob = new Blob(
      [`ID,Name,Email,Status,Created,Verified\\n${csvData}`],
      {
        type: "text/csv",
      },
    );
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "kyc-records.csv";
    a.click();
  };

  const filteredRecords = records.filter(
    (record) =>
      searchQuery === "" ||
      record.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      record.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      record.pan.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200/50 sticky top-0 z-40">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-2 rounded-lg">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-800">
                  Authen Ledger - Admin Panel
                </h1>
                <p className="text-xs text-slate-500">
                  KYC Verification Dashboard & Management
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Button
                onClick={exportRecords}
                variant="outline"
                size="sm"
                className="hidden md:flex"
              >
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
              <Link to="/">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Home
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Dashboard Stats */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
              <Card className="bg-gradient-to-r from-blue-50 to-cyan-50 border-blue-200">
                <CardContent className="p-4 text-center">
                  <div className="flex items-center justify-center mb-2">
                    <Users className="h-5 w-5 text-blue-600 mr-2" />
                    <span className="text-sm font-medium text-blue-700">
                      Total
                    </span>
                  </div>
                  <div className="text-2xl font-bold text-blue-800">
                    {stats.totalSubmissions.toLocaleString()}
                  </div>
                  <p className="text-xs text-blue-600">Submissions</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200">
                <CardContent className="p-4 text-center">
                  <div className="flex items-center justify-center mb-2">
                    <Clock className="h-5 w-5 text-yellow-600 mr-2" />
                    <span className="text-sm font-medium text-yellow-700">
                      Pending
                    </span>
                  </div>
                  <div className="text-2xl font-bold text-yellow-800">
                    {stats.pendingVerifications.toLocaleString()}
                  </div>
                  <p className="text-xs text-yellow-600">Reviews</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
                <CardContent className="p-4 text-center">
                  <div className="flex items-center justify-center mb-2">
                    <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                    <span className="text-sm font-medium text-green-700">
                      Verified
                    </span>
                  </div>
                  <div className="text-2xl font-bold text-green-800">
                    {stats.verifiedRecords.toLocaleString()}
                  </div>
                  <p className="text-xs text-green-600">Records</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-r from-red-50 to-pink-50 border-red-200">
                <CardContent className="p-4 text-center">
                  <div className="flex items-center justify-center mb-2">
                    <XCircle className="h-5 w-5 text-red-600 mr-2" />
                    <span className="text-sm font-medium text-red-700">
                      Rejected
                    </span>
                  </div>
                  <div className="text-2xl font-bold text-red-800">
                    {stats.rejectedRecords.toLocaleString()}
                  </div>
                  <p className="text-xs text-red-600">Records</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-r from-purple-50 to-indigo-50 border-purple-200">
                <CardContent className="p-4 text-center">
                  <div className="flex items-center justify-center mb-2">
                    <Zap className="h-5 w-5 text-purple-600 mr-2" />
                    <span className="text-sm font-medium text-purple-700">
                      Avg Time
                    </span>
                  </div>
                  <div className="text-2xl font-bold text-purple-800">
                    {stats.averageProcessingTime.toFixed(1)}h
                  </div>
                  <p className="text-xs text-purple-600">Processing</p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Blockchain Summary Statistics */}
          <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Hash className="h-5 w-5 text-blue-600" />
                Blockchain & Storage Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {records.filter((r) => r.blockchainTxHash).length}
                  </div>
                  <p className="text-sm text-slate-600 flex items-center justify-center gap-1">
                    <Database className="h-3 w-3" />
                    Blockchain Recorded
                  </p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {records.filter((r) => r.permanentStorage).length}
                  </div>
                  <p className="text-sm text-slate-600 flex items-center justify-center gap-1">
                    <Lock className="h-3 w-3" />
                    Permanent Storage
                  </p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">
                    {records.filter((r) => r.temporaryRecord).length}
                  </div>
                  <p className="text-sm text-slate-600 flex items-center justify-center gap-1">
                    <Clock className="h-3 w-3" />
                    Temporary Storage
                  </p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {records.filter((r) => r.ipfsHashes?.length > 0).length}
                  </div>
                  <p className="text-sm text-slate-600 flex items-center justify-center gap-1">
                    <Globe className="h-3 w-3" />
                    IPFS Documents
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Controls & Filters */}
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg mb-6">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-purple-600" />
                  KYC Records Management
                  <span className="inline-flex items-center bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium ml-2">
                    <span className="w-2 h-2 bg-green-500 rounded-full mr-1 animate-pulse"></span>
                    LIVE UPDATES
                  </span>
                </span>
                <div className="flex items-center gap-2">
                  {selectedRecords.length > 0 && (
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <CheckSquare className="h-4 w-4 mr-2" />
                          Bulk Actions ({selectedRecords.length})
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Bulk Actions</DialogTitle>
                          <DialogDescription>
                            Perform actions on {selectedRecords.length} selected
                            records
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <Button
                            onClick={() => handleBulkAction("VERIFIED")}
                            className="w-full bg-green-600 hover:bg-green-700"
                            disabled={isUpdating}
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Approve All Selected
                          </Button>
                          <Button
                            onClick={() => handleBulkAction("REJECTED")}
                            variant="destructive"
                            className="w-full"
                            disabled={isUpdating}
                          >
                            <XCircle className="h-4 w-4 mr-2" />
                            Reject All Selected
                          </Button>
                          <Button
                            onClick={() => setSelectedRecords([])}
                            variant="outline"
                            className="w-full"
                          >
                            Clear Selection
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  )}
                  <Button
                    onClick={fetchKYCRecords}
                    disabled={isLoading}
                    size="sm"
                  >
                    <RefreshCw
                      className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`}
                    />
                    Refresh
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="Search by name, email, or PAN..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>

                {/* Status Filter */}
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="PENDING">Pending</SelectItem>
                    <SelectItem value="VERIFIED">Verified</SelectItem>
                    <SelectItem value="REJECTED">Rejected</SelectItem>
                  </SelectContent>
                </Select>

                {/* Sort By */}
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sort By" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="createdAt">Created Date</SelectItem>
                    <SelectItem value="name">Name</SelectItem>
                    <SelectItem value="status">Status</SelectItem>
                    <SelectItem value="verifiedAt">Verified Date</SelectItem>
                  </SelectContent>
                </Select>

                {/* Sort Order */}
                <Select value={sortOrder} onValueChange={setSortOrder}>
                  <SelectTrigger>
                    <SelectValue placeholder="Order" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="desc">Newest First</SelectItem>
                    <SelectItem value="asc">Oldest First</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {error && (
            <Alert className="mb-6 border-red-200 bg-red-50">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                {error}
              </AlertDescription>
            </Alert>
          )}

          {/* Records List */}
          {isLoading ? (
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
              <CardContent className="py-12 text-center">
                <RefreshCw className="h-8 w-8 text-slate-400 mx-auto mb-4 animate-spin" />
                <p className="text-slate-600">Loading KYC records...</p>
              </CardContent>
            </Card>
          ) : filteredRecords.length === 0 ? (
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
              <CardContent className="py-12 text-center">
                <FileText className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-slate-700 mb-2">
                  No Records Found
                </h3>
                <p className="text-slate-500">
                  No KYC records match the selected criteria.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {/* Select All Header */}
              <Card className="bg-slate-100/50 border-slate-200">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Checkbox
                        checked={
                          selectedRecords.length === filteredRecords.length &&
                          filteredRecords.length > 0
                        }
                        onCheckedChange={toggleSelectAll}
                      />
                      <span className="text-sm font-medium text-slate-700">
                        {selectedRecords.length > 0
                          ? `${selectedRecords.length} of ${filteredRecords.length} selected`
                          : `Select all ${filteredRecords.length} records`}
                      </span>
                    </div>
                    <div className="text-sm text-slate-500">
                      Showing {filteredRecords.length} records
                    </div>
                  </div>
                </CardContent>
              </Card>

              {filteredRecords.map((record) => (
                <Card
                  key={record.id}
                  className={`bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all ${
                    selectedRecords.includes(record.id)
                      ? "ring-2 ring-blue-500"
                      : ""
                  }`}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4 flex-1">
                        {/* Selection Checkbox */}
                        <Checkbox
                          checked={selectedRecords.includes(record.id)}
                          onCheckedChange={() =>
                            toggleRecordSelection(record.id)
                          }
                          className="mt-1"
                        />

                        <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4">
                          {/* Basic Info */}
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <User className="h-4 w-4 text-slate-500" />
                              <span className="font-medium text-slate-700">
                                {record.name}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 mb-1">
                              <Mail className="h-3 w-3 text-slate-400" />
                              <span className="text-xs text-slate-500">
                                {record.email}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Phone className="h-3 w-3 text-slate-400" />
                              <span className="text-xs text-slate-500">
                                {record.phone}
                              </span>
                            </div>
                          </div>

                          {/* KYC Details */}
                          <div>
                            <p className="text-xs text-slate-500 mb-1">
                              KYC ID
                            </p>
                            <p className="font-mono text-xs font-medium text-slate-700 break-all">
                              {record.id}
                            </p>
                            <p className="text-xs text-slate-500 mt-2 mb-1">
                              PAN
                            </p>
                            <p className="font-mono text-xs font-medium text-slate-700">
                              {record.pan}
                            </p>
                          </div>

                          {/* Status & Timing */}
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              {getStatusIcon(record.status)}
                              <Badge className={getStatusColor(record.status)}>
                                {record.status}
                              </Badge>
                            </div>
                            <p className="text-xs text-slate-500">Submitted</p>
                            <p className="text-xs text-slate-600">
                              {new Date(record.createdAt).toLocaleDateString()}
                            </p>
                            {record.verifiedAt && (
                              <>
                                <p className="text-xs text-slate-500 mt-1">
                                  Verified
                                </p>
                                <p className="text-xs text-slate-600">
                                  {new Date(
                                    record.verifiedAt,
                                  ).toLocaleDateString()}
                                </p>
                              </>
                            )}
                          </div>

                          {/* Blockchain & Documents */}
                          <div>
                            <p className="text-xs text-slate-500 mb-1">
                              Documents ({record.documents?.length || 0})
                            </p>
                            <div className="space-y-1">
                              {record.documents
                                ?.slice(0, 2)
                                .map((doc, index) => (
                                  <div
                                    key={index}
                                    className="flex items-center gap-1"
                                  >
                                    <FileText className="h-3 w-3 text-blue-600" />
                                    <span className="text-xs text-slate-600">
                                      {doc.type}
                                    </span>
                                  </div>
                                )) || []}
                              {(record.documents?.length || 0) > 2 && (
                                <span className="text-xs text-slate-500">
                                  +{(record.documents?.length || 0) - 2} more
                                </span>
                              )}
                            </div>

                            {record.blockchainTxHash && (
                              <div className="mt-2">
                                <p className="text-xs text-slate-500">
                                  Blockchain
                                </p>
                                <div className="flex items-center gap-1">
                                  <Hash className="h-3 w-3 text-blue-600" />
                                  <span className="text-xs text-blue-600">
                                    ✓ Recorded
                                  </span>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-col gap-2 ml-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedRecord(record)}
                          className="whitespace-nowrap"
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          Review
                        </Button>
                        {record.status === "PENDING" && (
                          <>
                            <Button
                              size="sm"
                              onClick={() =>
                                updateKYCStatus(
                                  record.id,
                                  "VERIFIED",
                                  `✅ APPROVED: All documents verified for ${record.name}`,
                                )
                              }
                              disabled={isUpdating}
                              className="bg-green-600 hover:bg-green-700 whitespace-nowrap"
                            >
                              <CheckCircle className="h-3 w-3 mr-1" />
                              {isUpdating ? "Approving..." : "✅ Approve"}
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() =>
                                updateKYCStatus(
                                  record.id,
                                  "REJECTED",
                                  `❌ REJECTED: Please resubmit documents for ${record.name}`,
                                )
                              }
                              disabled={isUpdating}
                              className="whitespace-nowrap"
                            >
                              <XCircle className="h-3 w-3 mr-1" />
                              {isUpdating ? "Rejecting..." : "❌ Reject"}
                            </Button>
                          </>
                        )}
                      </div>
                    </div>

                    {record.remarks && (
                      <div className="mt-4 pt-4 border-t border-slate-200">
                        <p className="text-xs text-slate-500 mb-1">
                          Admin Remarks
                        </p>
                        <p className="text-sm text-slate-700">
                          {record.remarks}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Record Detail Modal */}
          {selectedRecord && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
              <Card className="bg-white max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>KYC Record Details</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedRecord(null)}
                    >
                      ✕
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* 🔒 Security & Storage Status */}
                  <div className="bg-slate-50 p-4 rounded-lg">
                    <h4 className="font-medium text-slate-700 mb-3 flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      Security & Storage Status
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-slate-500">Storage Type:</span>
                        <p className="font-medium">
                          {selectedRecord.permanentStorage ? (
                            <span className="text-green-600">✅ Permanent</span>
                          ) : (
                            <span className="text-orange-600">
                              ⏳ Temporary
                            </span>
                          )}
                        </p>
                      </div>
                      <div>
                        <span className="text-slate-500">
                          Approval Required:
                        </span>
                        <p className="font-medium">
                          {selectedRecord.approvalRequired ? (
                            <span className="text-orange-600">⏳ Yes</span>
                          ) : (
                            <span className="text-green-600">✅ No</span>
                          )}
                        </p>
                      </div>
                      <div>
                        <span className="text-slate-500">
                          Verification Level:
                        </span>
                        <p className="font-medium">
                          {selectedRecord.verificationLevel}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Complete record details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-medium text-slate-700 mb-3">
                        Personal Information
                      </h4>
                      <div className="space-y-2 text-sm">
                        <p>
                          <span className="text-slate-500">Name:</span>{" "}
                          {selectedRecord.name}
                        </p>
                        <p>
                          <span className="text-slate-500">Email:</span>{" "}
                          {selectedRecord.email}
                        </p>
                        <p>
                          <span className="text-slate-500">Phone:</span>{" "}
                          {selectedRecord.phone}
                        </p>
                        <p>
                          <span className="text-slate-500">PAN:</span>{" "}
                          {selectedRecord.pan}
                        </p>
                        <p>
                          <span className="text-slate-500">DOB:</span>{" "}
                          {selectedRecord.dateOfBirth}
                        </p>
                      </div>
                    </div>
                    <div>
                      <h4 className="font-medium text-slate-700 mb-3">
                        Address
                      </h4>
                      <div className="space-y-2 text-sm">
                        <p>
                          <span className="text-slate-500">Street:</span>{" "}
                          {selectedRecord.address.street}
                        </p>
                        <p>
                          <span className="text-slate-500">City:</span>{" "}
                          {selectedRecord.address.city}
                        </p>
                        <p>
                          <span className="text-slate-500">State:</span>{" "}
                          {selectedRecord.address.state}
                        </p>
                        <p>
                          <span className="text-slate-500">PIN:</span>{" "}
                          {selectedRecord.address.pincode}
                        </p>
                        <p>
                          <span className="text-slate-500">Country:</span>{" "}
                          {selectedRecord.address.country}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* 📊 Blockchain Information */}
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-medium text-slate-700 mb-3 flex items-center gap-2">
                      <Hash className="h-4 w-4 text-blue-600" />
                      Blockchain Information
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-slate-500">
                          Transaction Hash:
                        </span>
                        <p className="font-mono text-xs bg-white p-2 rounded mt-1 break-all">
                          {selectedRecord.blockchainTxHash?.substring(0, 32) ||
                            "N/A"}
                          ...
                        </p>
                      </div>
                      <div>
                        <span className="text-slate-500">Block Number:</span>
                        <p className="font-mono text-sm bg-white p-2 rounded mt-1">
                          {selectedRecord.blockchainBlockNumber || "Pending"}
                        </p>
                      </div>
                      {selectedRecord.submissionHash && (
                        <div>
                          <span className="text-slate-500">
                            Submission Hash:
                          </span>
                          <p className="font-mono text-xs bg-white p-2 rounded mt-1 break-all">
                            {selectedRecord.submissionHash.substring(0, 32)}...
                          </p>
                        </div>
                      )}
                      {selectedRecord.adminBlockchainTxHash && (
                        <div>
                          <span className="text-slate-500">Admin TX Hash:</span>
                          <p className="font-mono text-xs bg-white p-2 rounded mt-1 break-all">
                            {selectedRecord.adminBlockchainTxHash.substring(
                              0,
                              32,
                            )}
                            ...
                          </p>
                        </div>
                      )}
                    </div>

                    {selectedRecord.ipfsHashes &&
                      selectedRecord.ipfsHashes.length > 0 && (
                        <div className="mt-4">
                          <span className="text-slate-500">
                            IPFS Document Hashes:
                          </span>
                          <div className="space-y-2 mt-2">
                            {selectedRecord.ipfsHashes.map((hash, index) => (
                              <div
                                key={index}
                                className="flex items-center gap-2"
                              >
                                <p className="font-mono text-xs bg-white p-2 rounded flex-1 break-all">
                                  {hash}
                                </p>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() =>
                                    navigator.clipboard.writeText(hash)
                                  }
                                >
                                  <Eye className="h-3 w-3" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                  </div>

                  {/* Documents */}
                  <div>
                    <h4 className="font-medium text-slate-700 mb-3">
                      Documents ({selectedRecord.documents?.length || 0})
                    </h4>
                    <div className="space-y-2">
                      {selectedRecord.documents?.map((doc, index) => (
                        <div
                          key={index}
                          className="bg-slate-50 p-4 rounded-lg border"
                        >
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center space-x-3">
                              <FileText className="h-4 w-4 text-blue-600" />
                              <div>
                                <p className="text-sm font-medium text-slate-700">
                                  {doc.type}
                                </p>
                                <p className="text-xs text-slate-500">
                                  {doc.fileName} (
                                  {doc.fileSize
                                    ? `${Math.round(doc.fileSize / 1024)}KB`
                                    : "Size unknown"}
                                  )
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Button variant="ghost" size="sm">
                                <Eye className="h-3 w-3" />
                              </Button>
                              <Button variant="ghost" size="sm">
                                <Download className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>

                          <div className="space-y-2 text-xs">
                            <div>
                              <span className="text-slate-500">
                                Document Hash:
                              </span>
                              <p className="font-mono bg-white p-2 rounded mt-1 break-all">
                                {doc.documentHash || "N/A"}
                              </p>
                            </div>
                            {doc.ipfsHash && (
                              <div>
                                <span className="text-slate-500">
                                  IPFS Hash:
                                </span>
                                <p className="font-mono bg-white p-2 rounded mt-1 break-all">
                                  {doc.ipfsHash}
                                </p>
                              </div>
                            )}
                            <div>
                              <span className="text-slate-500">Uploaded:</span>
                              <p className="text-slate-600 mt-1">
                                {new Date(doc.uploadedAt).toLocaleString()}
                              </p>
                            </div>
                          </div>
                        </div>
                      )) || []}
                    </div>
                  </div>

                  {/* Admin Actions */}
                  {selectedRecord.status === "PENDING" && (
                    <div>
                      <h4 className="font-medium text-slate-700 mb-3">
                        Admin Actions
                      </h4>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="remarks">Remarks</Label>
                          <Textarea
                            id="remarks"
                            value={remarks}
                            onChange={(e) => setRemarks(e.target.value)}
                            placeholder="Add remarks for verification decision..."
                            rows={3}
                          />
                        </div>
                        <div className="flex gap-4">
                          <Button
                            onClick={() =>
                              updateKYCStatus(selectedRecord.id, "VERIFIED")
                            }
                            disabled={isUpdating}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            {isUpdating ? "Approving..." : "✅ Approve KYC"}
                          </Button>
                          <Button
                            variant="destructive"
                            onClick={() =>
                              updateKYCStatus(selectedRecord.id, "REJECTED")
                            }
                            disabled={isUpdating}
                          >
                            <XCircle className="h-4 w-4 mr-2" />
                            {isUpdating ? "Rejecting..." : "❌ Reject KYC"}
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
