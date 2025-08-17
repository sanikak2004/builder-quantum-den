import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
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
  Filter
} from "lucide-react";
import { KYCRecord, ApiResponse } from "@shared/api";

export default function AdminKYC() {
  const [records, setRecords] = useState<KYCRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedRecord, setSelectedRecord] = useState<KYCRecord | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [remarks, setRemarks] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  useEffect(() => {
    fetchKYCRecords();
  }, [filterStatus]);

  const fetchKYCRecords = async () => {
    setIsLoading(true);
    setError("");

    try {
      const params = new URLSearchParams({
        status: filterStatus,
        limit: "50",
        offset: "0"
      });

      const response = await fetch(`/api/admin/kyc/all?${params}`);
      const result: ApiResponse = await response.json();

      if (result.success && result.data) {
        setRecords(result.data.records || []);
      } else {
        setError(result.message || 'Failed to fetch records');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const updateKYCStatus = async (recordId: string, status: string, customRemarks?: string) => {
    // Confirmation dialog
    const confirmMessage = status === 'VERIFIED'
      ? '✅ APPROVE this KYC application? This will mark the user as VERIFIED.'
      : '❌ REJECT this KYC application? This will require the user to resubmit.';

    if (!window.confirm(confirmMessage)) {
      return;
    }

    setIsUpdating(true);
    console.log(`🔄 LIVE UPDATE: ${status} KYC ID: ${recordId}`);

    try {
      const finalRemarks = customRemarks || remarks || (
        status === 'VERIFIED'
          ? 'KYC approved by admin - all documents verified ✅'
          : 'KYC rejected - please resubmit with correct documents ❌'
      );

      const response = await fetch(`/api/admin/kyc/${recordId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status,
          remarks: finalRemarks,
          verifiedBy: 'admin@ekyc.com'
        }),
      });

      const result: ApiResponse<KYCRecord> = await response.json();

      if (result.success && result.data) {
        console.log(`✅ LIVE UPDATE SUCCESS: Status changed to ${status}`);

        // Update the record in the list with live data
        setRecords(prev => prev.map(record =>
          record.id === recordId ? result.data! : record
        ));
        setSelectedRecord(null);
        setRemarks("");

        // Show success message with live update confirmation
        const successMessage = status === 'VERIFIED'
          ? `✅ APPROVED! KYC for ${result.data.name} is now VERIFIED`
          : `❌ REJECTED! KYC for ${result.data.name} has been rejected`;

        alert(successMessage);

        // Auto-refresh to show live updates
        setTimeout(() => {
          fetchKYCRecords();
        }, 1000);

      } else {
        console.error('❌ UPDATE FAILED:', result.message);
        alert(`❌ Update failed: ${result.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('❌ NETWORK ERROR:', error);
      alert('❌ Network error. Please check connection and try again.');
    } finally {
      setIsUpdating(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'VERIFIED':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'REJECTED':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'VERIFIED':
        return <CheckCircle className="h-4 w-4" />;
      case 'PENDING':
        return <Clock className="h-4 w-4" />;
      case 'REJECTED':
        return <XCircle className="h-4 w-4" />;
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
              <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-2 rounded-lg">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-800">Admin Panel</h1>
                <p className="text-xs text-slate-500">KYC Verification Dashboard</p>
              </div>
            </div>
            <Link to="/">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Home
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-12">
        <div className="max-w-7xl mx-auto">
          {/* Controls */}
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg mb-8">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-purple-600" />
                  KYC Records Management
                </span>
                <Button onClick={fetchKYCRecords} disabled={isLoading} size="sm">
                  <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-slate-500" />
                  <Label htmlFor="status-filter">Filter by Status:</Label>
                </div>
                <select
                  id="status-filter"
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white"
                >
                  <option value="all">All Status</option>
                  <option value="PENDING">Pending</option>
                  <option value="VERIFIED">Verified</option>
                  <option value="REJECTED">Rejected</option>
                </select>
              </div>
            </CardContent>
          </Card>

          {error && (
            <Alert className="mb-6 border-red-200 bg-red-50">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">{error}</AlertDescription>
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
          ) : records.length === 0 ? (
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
              <CardContent className="py-12 text-center">
                <FileText className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-slate-700 mb-2">No Records Found</h3>
                <p className="text-slate-500">No KYC records match the selected criteria.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {records.map((record) => (
                <Card key={record.id} className="bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4">
                        {/* Basic Info */}
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <User className="h-4 w-4 text-slate-500" />
                            <span className="font-medium text-slate-700">{record.name}</span>
                          </div>
                          <div className="flex items-center gap-2 mb-1">
                            <Mail className="h-3 w-3 text-slate-400" />
                            <span className="text-xs text-slate-500">{record.email}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Phone className="h-3 w-3 text-slate-400" />
                            <span className="text-xs text-slate-500">{record.phone}</span>
                          </div>
                        </div>

                        {/* KYC Details */}
                        <div>
                          <p className="text-xs text-slate-500 mb-1">KYC ID</p>
                          <p className="font-mono text-xs font-medium text-slate-700 break-all">{record.id}</p>
                          <p className="text-xs text-slate-500 mt-2 mb-1">PAN</p>
                          <p className="font-mono text-xs font-medium text-slate-700">{record.pan}</p>
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
                          <p className="text-xs text-slate-600">{new Date(record.createdAt).toLocaleDateString()}</p>
                          {record.verifiedAt && (
                            <>
                              <p className="text-xs text-slate-500 mt-1">Verified</p>
                              <p className="text-xs text-slate-600">{new Date(record.verifiedAt).toLocaleDateString()}</p>
                            </>
                          )}
                        </div>

                        {/* Documents */}
                        <div>
                          <p className="text-xs text-slate-500 mb-1">Documents ({record.documents?.length || 0})</p>
                          <div className="space-y-1">
                            {record.documents?.slice(0, 2).map((doc, index) => (
                              <div key={index} className="flex items-center gap-1">
                                <FileText className="h-3 w-3 text-blue-600" />
                                <span className="text-xs text-slate-600">{doc.type}</span>
                              </div>
                            )) || []}
                            {(record.documents?.length || 0) > 2 && (
                              <span className="text-xs text-slate-500">+{(record.documents?.length || 0) - 2} more</span>
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
                        {record.status === 'PENDING' && (
                          <>
                            <Button
                              size="sm"
                              onClick={() => updateKYCStatus(record.id, 'VERIFIED')}
                              disabled={isUpdating}
                              className="bg-green-600 hover:bg-green-700 whitespace-nowrap"
                            >
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Approve
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => updateKYCStatus(record.id, 'REJECTED')}
                              disabled={isUpdating}
                              className="whitespace-nowrap"
                            >
                              <XCircle className="h-3 w-3 mr-1" />
                              Reject
                            </Button>
                          </>
                        )}
                      </div>
                    </div>

                    {record.remarks && (
                      <div className="mt-4 pt-4 border-t border-slate-200">
                        <p className="text-xs text-slate-500 mb-1">Admin Remarks</p>
                        <p className="text-sm text-slate-700">{record.remarks}</p>
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
                    <Button variant="ghost" size="sm" onClick={() => setSelectedRecord(null)}>
                      ✕
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Complete record details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-medium text-slate-700 mb-3">Personal Information</h4>
                      <div className="space-y-2 text-sm">
                        <p><span className="text-slate-500">Name:</span> {selectedRecord.name}</p>
                        <p><span className="text-slate-500">Email:</span> {selectedRecord.email}</p>
                        <p><span className="text-slate-500">Phone:</span> {selectedRecord.phone}</p>
                        <p><span className="text-slate-500">PAN:</span> {selectedRecord.pan}</p>
                        <p><span className="text-slate-500">DOB:</span> {selectedRecord.dateOfBirth}</p>
                      </div>
                    </div>
                    <div>
                      <h4 className="font-medium text-slate-700 mb-3">Address</h4>
                      <div className="space-y-2 text-sm">
                        <p><span className="text-slate-500">Street:</span> {selectedRecord.address.street}</p>
                        <p><span className="text-slate-500">City:</span> {selectedRecord.address.city}</p>
                        <p><span className="text-slate-500">State:</span> {selectedRecord.address.state}</p>
                        <p><span className="text-slate-500">PIN:</span> {selectedRecord.address.pincode}</p>
                        <p><span className="text-slate-500">Country:</span> {selectedRecord.address.country}</p>
                      </div>
                    </div>
                  </div>

                  {/* Documents */}
                  <div>
                    <h4 className="font-medium text-slate-700 mb-3">Documents ({selectedRecord.documents?.length || 0})</h4>
                    <div className="space-y-2">
                      {selectedRecord.documents?.map((doc, index) => (
                        <div key={index} className="flex items-center justify-between bg-slate-50 p-3 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <FileText className="h-4 w-4 text-blue-600" />
                            <div>
                              <p className="text-sm font-medium text-slate-700">{doc.type}</p>
                              <p className="text-xs text-slate-500">Hash: {doc.documentHash?.substring(0, 16) || 'N/A'}...</p>
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
                      )) || []}
                    </div>
                  </div>

                  {/* Admin Actions */}
                  {selectedRecord.status === 'PENDING' && (
                    <div>
                      <h4 className="font-medium text-slate-700 mb-3">Admin Actions</h4>
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
                            onClick={() => updateKYCStatus(selectedRecord.id, 'VERIFIED')}
                            disabled={isUpdating}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Approve KYC
                          </Button>
                          <Button
                            variant="destructive"
                            onClick={() => updateKYCStatus(selectedRecord.id, 'REJECTED')}
                            disabled={isUpdating}
                          >
                            <XCircle className="h-4 w-4 mr-2" />
                            Reject KYC
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
