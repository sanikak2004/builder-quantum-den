import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Shield,
  Database,
  User,
  Mail,
  Phone,
  CreditCard,
  MapPin,
  Calendar,
  FileText,
  CheckCircle,
  Clock,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Search,
  Eye,
  Download,
  Hash,
  Filter,
} from "lucide-react";
import { KYCRecord, ApiResponse } from "@shared/api";

export default function DatabaseRecords() {
  const [records, setRecords] = useState<KYCRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    verified: 0,
    rejected: 0
  });

  useEffect(() => {
    fetchAllRecords();
    const interval = setInterval(fetchAllRecords, 10000); // Refresh every 10 seconds
    return () => clearInterval(interval);
  }, [statusFilter]);

  const fetchAllRecords = async () => {
    setIsLoading(true);
    setError("");

    try {
      console.log("📊 FRONTEND: Fetching all PostgreSQL records...");
      
      const params = new URLSearchParams({
        status: statusFilter,
        limit: "100",
        offset: "0"
      });

      const response = await fetch(`/api/admin/kyc/all?${params}`);
      const result: ApiResponse = await response.json();

      if (result.success && result.data) {
        const fetchedRecords = result.data.records || [];
        setRecords(fetchedRecords);
        
        // Calculate stats
        const total = fetchedRecords.length;
        const pending = fetchedRecords.filter(r => r.status === 'PENDING').length;
        const verified = fetchedRecords.filter(r => r.status === 'VERIFIED').length;
        const rejected = fetchedRecords.filter(r => r.status === 'REJECTED').length;
        
        setStats({ total, pending, verified, rejected });
        
        console.log(`✅ FRONTEND: Loaded ${total} real PostgreSQL records`);
        console.log(`📊 Stats - Pending: ${pending}, Verified: ${verified}, Rejected: ${rejected}`);
      } else {
        setError(result.message || "Failed to fetch records from database");
      }
    } catch (error) {
      console.error("❌ FRONTEND: Database fetch error:", error);
      setError("Network error. Please check server connection.");
    } finally {
      setIsLoading(false);
    }
  };

  const filteredRecords = records.filter(record => {
    const matchesSearch = searchTerm === "" || 
      record.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.pan.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.id.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch;
  });

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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="space-y-6">
      {/* Header with Real-time Stats */}
      <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5 text-blue-600" />
              PostgreSQL Database Records
              <span className="inline-flex items-center bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium ml-2">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-1 animate-pulse"></span>
                LIVE DATA
              </span>
            </CardTitle>
            <Button
              onClick={fetchAllRecords}
              disabled={isLoading}
              size="sm"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Stats Dashboard */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-200">
              <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
              <div className="text-sm text-blue-800">Total Records</div>
              <div className="text-xs text-blue-600">In PostgreSQL DB</div>
            </div>
            <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg p-4 border border-yellow-200">
              <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
              <div className="text-sm text-yellow-800">Pending Review</div>
              <div className="text-xs text-yellow-600">Awaiting Admin</div>
            </div>
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-4 border border-green-200">
              <div className="text-2xl font-bold text-green-600">{stats.verified}</div>
              <div className="text-sm text-green-800">Verified</div>
              <div className="text-xs text-green-600">Blockchain Confirmed</div>
            </div>
            <div className="bg-gradient-to-r from-red-50 to-pink-50 rounded-lg p-4 border border-red-200">
              <div className="text-2xl font-bold text-red-600">{stats.rejected}</div>
              <div className="text-sm text-red-800">Rejected</div>
              <div className="text-xs text-red-600">Need Resubmission</div>
            </div>
          </div>

          {/* Search and Filter Controls */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div>
              <Label htmlFor="search">Search Records</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <Input
                  id="search"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by name, email, PAN, or KYC ID..."
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="status-filter">Filter by Status</Label>
              <select
                id="status-filter"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white"
              >
                <option value="all">All Status</option>
                <option value="PENDING">Pending</option>
                <option value="VERIFIED">Verified</option>
                <option value="REJECTED">Rejected</option>
              </select>
            </div>
            <div className="flex items-end">
              <div className="text-sm text-slate-600">
                <div>Showing: {filteredRecords.length} records</div>
                <div>Last updated: {new Date().toLocaleTimeString()}</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Error Display */}
      {error && (
        <Card className="bg-red-50 border-red-200">
          <CardContent className="py-4">
            <div className="flex items-center gap-2 text-red-800">
              <AlertTriangle className="h-4 w-4" />
              <span>{error}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Records Display */}
      {isLoading ? (
        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
          <CardContent className="py-12 text-center">
            <RefreshCw className="h-8 w-8 text-slate-400 mx-auto mb-4 animate-spin" />
            <p className="text-slate-600">Loading real database records...</p>
          </CardContent>
        </Card>
      ) : filteredRecords.length === 0 ? (
        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
          <CardContent className="py-12 text-center">
            <Database className="h-12 w-12 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-700 mb-2">
              {searchTerm || statusFilter !== "all" ? "No Matching Records" : "No Records Found"}
            </h3>
            <p className="text-slate-500 mb-6">
              {searchTerm || statusFilter !== "all" 
                ? "No records match your search criteria."
                : "No KYC records found in the PostgreSQL database."
              }
            </p>
            <Button onClick={fetchAllRecords} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh Database
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <div className="text-sm text-slate-600 mb-4">
            📊 Displaying {filteredRecords.length} real PostgreSQL records
          </div>
          
          {filteredRecords.map((record) => (
            <Card key={record.id} className="bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all">
              <CardContent className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Personal Information */}
                  <div>
                    <h4 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
                      <User className="h-4 w-4 text-blue-600" />
                      Personal Information
                    </h4>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <User className="h-3 w-3 text-slate-400" />
                        <span className="text-sm font-medium">{record.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Mail className="h-3 w-3 text-slate-400" />
                        <span className="text-xs text-slate-600">{record.email}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="h-3 w-3 text-slate-400" />
                        <span className="text-xs text-slate-600">{record.phone}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CreditCard className="h-3 w-3 text-slate-400" />
                        <span className="text-xs font-mono text-slate-700">{record.pan}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-3 w-3 text-slate-400" />
                        <span className="text-xs text-slate-600">{record.dateOfBirth}</span>
                      </div>
                    </div>
                  </div>

                  {/* System Information */}
                  <div>
                    <h4 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
                      <Shield className="h-4 w-4 text-purple-600" />
                      System Information
                    </h4>
                    <div className="space-y-2">
                      <div>
                        <span className="text-xs text-slate-500">KYC ID</span>
                        <div className="font-mono text-xs text-slate-700 break-all">{record.id}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(record.status)}
                        <Badge className={getStatusColor(record.status)}>
                          {record.status}
                        </Badge>
                      </div>
                      <div>
                        <span className="text-xs text-slate-500">Verification Level</span>
                        <div className="text-xs font-medium text-slate-700">{record.verificationLevel}</div>
                      </div>
                      <div>
                        <span className="text-xs text-slate-500">Submitted</span>
                        <div className="text-xs text-slate-600">{formatDate(record.createdAt)}</div>
                      </div>
                      {record.verifiedAt && (
                        <div>
                          <span className="text-xs text-slate-500">Verified</span>
                          <div className="text-xs text-slate-600">{formatDate(record.verifiedAt)}</div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Blockchain & Documents */}
                  <div>
                    <h4 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
                      <Hash className="h-4 w-4 text-green-600" />
                      Blockchain & Files
                    </h4>
                    <div className="space-y-2">
                      {record.blockchainTxHash && (
                        <div>
                          <span className="text-xs text-slate-500">Blockchain TX</span>
                          <div className="font-mono text-xs text-slate-700 break-all">
                            {record.blockchainTxHash.substring(0, 20)}...
                          </div>
                        </div>
                      )}
                      <div>
                        <span className="text-xs text-slate-500">Documents</span>
                        <div className="text-xs text-slate-700">
                          {record.documents?.length || 0} files uploaded
                        </div>
                      </div>
                      {record.documents?.slice(0, 3).map((doc, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <FileText className="h-3 w-3 text-blue-600" />
                          <span className="text-xs text-slate-600">{doc.type}</span>
                        </div>
                      ))}
                      {(record.documents?.length || 0) > 3 && (
                        <div className="text-xs text-slate-500">
                          +{(record.documents?.length || 0) - 3} more files
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Address Information */}
                <div className="mt-4 pt-4 border-t border-slate-200">
                  <h4 className="font-semibold text-slate-800 mb-2 flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-orange-600" />
                    Address Information
                  </h4>
                  <div className="text-xs text-slate-600">
                    {record.address.street}, {record.address.city}, {record.address.state} - {record.address.pincode}, {record.address.country}
                  </div>
                </div>

                {/* Admin Remarks */}
                {record.remarks && (
                  <div className="mt-4 pt-4 border-t border-slate-200">
                    <h4 className="font-semibold text-slate-800 mb-2">Admin Remarks</h4>
                    <div className="text-sm text-slate-700 bg-slate-50 rounded p-3">
                      {record.remarks}
                    </div>
                    {record.verifiedBy && (
                      <div className="text-xs text-slate-500 mt-1">
                        Verified by: {record.verifiedBy}
                      </div>
                    )}
                  </div>
                )}

                {/* Action Buttons */}
                <div className="mt-4 pt-4 border-t border-slate-200 flex gap-2">
                  <Button variant="outline" size="sm">
                    <Eye className="h-3 w-3 mr-1" />
                    View Details
                  </Button>
                  <Button variant="outline" size="sm">
                    <Download className="h-3 w-3 mr-1" />
                    Export
                  </Button>
                  {record.blockchainTxHash && (
                    <Button variant="outline" size="sm">
                      <Hash className="h-3 w-3 mr-1" />
                      Blockchain
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
