import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Shield,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Search,
  FileText,
  Hash,
  Eye,
  Clock,
  TrendingUp,
  Users,
  Database,
  Filter,
  RefreshCw
} from "lucide-react";

interface ForgeryDashboard {
  summary: {
    totalForgeryReports: number;
    pendingReports: number;
    resolvedReports: number;
    criticalReports: number;
    duplicateDocuments: number;
    suspiciousTransactions: number;
    resolutionRate: number;
  };
  forgeryTypeBreakdown: Array<{
    forgeryType: string;
    _count: number;
  }>;
  dailyTrend: Array<{
    createdAt: string;
    severity: string;
  }>;
  recentReports: Array<{
    id: string;
    forgeryType: string;
    severity: string;
    title: string;
    description: string;
    status: string;
    createdAt: string;
    suspiciousKycRecordId: string;
    documentHash?: {
      documentHash: string;
      originalFileName: string;
      firstSubmittedBy: string;
      submissionCount: number;
    };
  }>;
}

interface ForgeryReport {
  id: string;
  forgeryType: string;
  severity: string;
  title: string;
  description: string;
  status: string;
  createdAt: string;
  suspiciousKycRecordId: string;
  originalKycRecordId?: string;
  documentHash?: {
    documentHash: string;
    originalFileName: string;
    firstSubmittedBy: string;
    submissionCount: number;
  };
}

export default function AdminForgeryDashboard() {
  const [dashboard, setDashboard] = useState<ForgeryDashboard | null>(null);
  const [reports, setReports] = useState<ForgeryReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("all");
  const [severityFilter, setSeverityFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    loadDashboard();
    loadReports();
  }, [currentPage, statusFilter, severityFilter]);

  const loadDashboard = async () => {
    try {
      const response = await fetch("/api/admin/forgery/dashboard");
      const result = await response.json();
      
      if (result.success) {
        setDashboard(result.data);
      } else {
        setError(result.message);
      }
    } catch (error) {
      setError("Failed to load dashboard data");
    }
  };

  const loadReports = async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: "10",
        status: statusFilter,
        severity: severityFilter
      });
      
      const response = await fetch(`/api/admin/forgery/reports?${params}`);
      const result = await response.json();
      
      if (result.success) {
        setReports(result.data.reports);
      } else {
        setError(result.message);
      }
    } catch (error) {
      setError("Failed to load reports");
    } finally {
      setIsLoading(false);
    }
  };

  const resolveReport = async (reportId: string, resolution: string) => {
    try {
      const response = await fetch(`/api/admin/forgery/reports/${reportId}/resolve`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          resolution,
          investigatedBy: "admin",
          actionsTaken: ["Manual review completed", "Issue resolved"]
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        // Refresh data
        loadDashboard();
        loadReports();
      } else {
        setError(result.message);
      }
    } catch (error) {
      setError("Failed to resolve report");
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity.toUpperCase()) {
      case "CRITICAL":
        return "bg-red-100 text-red-800 border-red-200";
      case "HIGH":
        return "bg-orange-100 text-orange-800 border-orange-200";
      case "MEDIUM":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "LOW":
        return "bg-green-100 text-green-800 border-green-200";
      default:
        return "bg-slate-100 text-slate-800 border-slate-200";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case "VERIFIED":
        return "bg-green-100 text-green-800";
      case "PENDING":
        return "bg-yellow-100 text-yellow-800";
      case "FAILED":
        return "bg-red-100 text-red-800";
      default:
        return "bg-slate-100 text-slate-800";
    }
  };

  const getForgeryTypeIcon = (type: string) => {
    switch (type) {
      case "DUPLICATE_SUBMISSION":
        return <FileText className="h-4 w-4" />;
      case "DOCUMENT_HASH_MISMATCH":
        return <Hash className="h-4 w-4" />;
      case "FAKE_TRANSACTION_HASH":
        return <Database className="h-4 w-4" />;
      default:
        return <AlertTriangle className="h-4 w-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200/50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-r from-red-600 to-orange-600 p-2 rounded-lg">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-800">
                  Forgery Detection Dashboard
                </h1>
                <p className="text-xs text-slate-500">
                  Monitor and manage document & transaction forgery reports
                </p>
              </div>
            </div>
            
            <Button onClick={() => { loadDashboard(); loadReports(); }} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        {error && (
          <Alert className="mb-6 bg-red-50 border-red-200">
            <XCircle className="h-4 w-4 text-red-600" />
            <AlertTitle className="text-red-800">Error</AlertTitle>
            <AlertDescription className="text-red-700">{error}</AlertDescription>
          </Alert>
        )}

        {dashboard && (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-500">Total Reports</p>
                      <p className="text-2xl font-bold text-slate-800">
                        {dashboard.summary.totalForgeryReports}
                      </p>
                    </div>
                    <div className="bg-blue-100 p-3 rounded-lg">
                      <FileText className="h-6 w-6 text-blue-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-500">Pending</p>
                      <p className="text-2xl font-bold text-orange-600">
                        {dashboard.summary.pendingReports}
                      </p>
                    </div>
                    <div className="bg-orange-100 p-3 rounded-lg">
                      <Clock className="h-6 w-6 text-orange-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-500">Critical</p>
                      <p className="text-2xl font-bold text-red-600">
                        {dashboard.summary.criticalReports}
                      </p>
                    </div>
                    <div className="bg-red-100 p-3 rounded-lg">
                      <AlertTriangle className="h-6 w-6 text-red-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-500">Resolution Rate</p>
                      <p className="text-2xl font-bold text-green-600">
                        {dashboard.summary.resolutionRate.toFixed(1)}%
                      </p>
                    </div>
                    <div className="bg-green-100 p-3 rounded-lg">
                      <TrendingUp className="h-6 w-6 text-green-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Forgery Type Breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
                <CardHeader>
                  <CardTitle>Forgery Types</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {dashboard.forgeryTypeBreakdown.map((item) => (
                      <div key={item.forgeryType} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                        <div className="flex items-center gap-2">
                          {getForgeryTypeIcon(item.forgeryType)}
                          <span className="font-medium">
                            {item.forgeryType.replace(/_/g, " ")}
                          </span>
                        </div>
                        <Badge variant="outline">{item._count}</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
                <CardHeader>
                  <CardTitle>Additional Metrics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-blue-600" />
                        <span>Duplicate Documents</span>
                      </div>
                      <Badge className="bg-blue-100 text-blue-800">
                        {dashboard.summary.duplicateDocuments}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Database className="h-4 w-4 text-purple-600" />
                        <span>Suspicious Transactions</span>
                      </div>
                      <Badge className="bg-purple-100 text-purple-800">
                        {dashboard.summary.suspiciousTransactions}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span>Resolved Reports</span>
                      </div>
                      <Badge className="bg-green-100 text-green-800">
                        {dashboard.summary.resolvedReports}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </>
        )}

        {/* Filters */}
        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filter Reports
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1 block">Status</label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="PENDING">Pending</SelectItem>
                    <SelectItem value="VERIFIED">Verified</SelectItem>
                    <SelectItem value="FAILED">Failed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1 block">Severity</label>
                <Select value={severityFilter} onValueChange={setSeverityFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Severity</SelectItem>
                    <SelectItem value="CRITICAL">Critical</SelectItem>
                    <SelectItem value="HIGH">High</SelectItem>
                    <SelectItem value="MEDIUM">Medium</SelectItem>
                    <SelectItem value="LOW">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1 block">Search</label>
                <Input
                  placeholder="Search reports..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Reports Table */}
        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
          <CardHeader>
            <CardTitle>Forgery Reports</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">
                <RefreshCw className="h-8 w-8 animate-spin mx-auto text-slate-400" />
                <p className="text-slate-500 mt-2">Loading reports...</p>
              </div>
            ) : reports.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle className="h-8 w-8 mx-auto text-green-500" />
                <p className="text-slate-500 mt-2">No forgery reports found</p>
              </div>
            ) : (
              <div className="space-y-4">
                {reports.map((report) => (
                  <div key={report.id} className="border border-slate-200 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          {getForgeryTypeIcon(report.forgeryType)}
                          <h3 className="font-semibold text-slate-800">{report.title}</h3>
                          <Badge className={getSeverityColor(report.severity)}>
                            {report.severity}
                          </Badge>
                          <Badge className={getStatusColor(report.status)}>
                            {report.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-slate-600 mb-2">{report.description}</p>
                        <div className="flex items-center gap-4 text-xs text-slate-500">
                          <span>ID: {report.id.substring(0, 8)}...</span>
                          <span>KYC: {report.suspiciousKycRecordId.substring(0, 8)}...</span>
                          <span>{new Date(report.createdAt).toLocaleString()}</span>
                        </div>
                        
                        {report.documentHash && (
                          <div className="mt-2 p-2 bg-slate-50 rounded text-xs">
                            <p><strong>File:</strong> {report.documentHash.originalFileName}</p>
                            <p><strong>Hash:</strong> {report.documentHash.documentHash.substring(0, 32)}...</p>
                            <p><strong>Submissions:</strong> {report.documentHash.submissionCount}</p>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex gap-2 ml-4">
                        <Button size="sm" variant="outline">
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                        {report.status === "PENDING" && (
                          <Button 
                            size="sm"
                            onClick={() => resolveReport(report.id, "Reviewed and resolved by admin")}
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Resolve
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}