import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Shield,
  Users,
  Clock,
  CheckCircle,
  XCircle,
  TrendingUp,
  Activity,
  BarChart3,
  PieChart,
  Database,
  Globe,
  Hash,
  FileText,
  Settings,
  Calendar,
  AlertTriangle,
  RefreshCw,
  Download,
  Eye,
  Zap,
  Lock,
  Star,
  Target,
  ArrowRight,
  Plus,
} from "lucide-react";
import { KYCStats, ApiResponse } from "@shared/api";

interface SystemMetrics {
  uptime: string;
  blockchainConnected: boolean;
  ipfsConnected: boolean;
  databaseConnected: boolean;
  lastBlockchainSync: string;
  totalTransactions: number;
  systemLoad: number;
}

interface RecentActivity {
  id: string;
  action: string;
  user: string;
  timestamp: string;
  status: "SUCCESS" | "FAILED" | "PENDING";
  details: string;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<KYCStats | null>(null);
  const [systemMetrics, setSystemMetrics] = useState<SystemMetrics | null>(
    null,
  );
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshInterval, setRefreshInterval] = useState<NodeJS.Timeout | null>(
    null,
  );

  useEffect(() => {
    fetchDashboardData();

    // Set up auto-refresh every 30 seconds
    const interval = setInterval(fetchDashboardData, 30000);
    setRefreshInterval(interval);

    return () => {
      if (refreshInterval) clearInterval(refreshInterval);
    };
  }, []);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    setError("");

    try {
      // Fetch comprehensive dashboard data from new endpoint
      const response = await fetch("/api/admin/dashboard");
      
      if (response.ok) {
        const result: ApiResponse<any> = await response.json();
        if (result.success && result.data) {
          setStats(result.data.stats);
          setSystemMetrics(result.data.systemMetrics);
          setRecentActivity(result.data.recentActivity);
        }
      } else {
        // Fallback to individual endpoints if comprehensive endpoint fails
        const [statsResponse, metricsResponse, activityResponse] =
          await Promise.all([
            fetch("/api/admin/stats"),
            fetch("/api/admin/system-metrics"),
            fetch("/api/admin/recent-activity"),
          ]);

        // Process stats
        if (statsResponse.ok) {
          const statsResult: ApiResponse<KYCStats> = await statsResponse.json();
          if (statsResult.success && statsResult.data) {
            setStats(statsResult.data);
          }
        }

        // Process system metrics
        if (metricsResponse.ok) {
          const metricsResult: ApiResponse<SystemMetrics> =
            await metricsResponse.json();
          if (metricsResult.success && metricsResult.data) {
            setSystemMetrics(metricsResult.data);
          }
        }

        // Process recent activity
        if (activityResponse.ok) {
          const activityResult: ApiResponse<RecentActivity[]> =
            await activityResponse.json();
          if (activityResult.success && activityResult.data) {
            setRecentActivity(activityResult.data);
          }
        }
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      setError("Failed to load dashboard data. Please check your connection.");
      
      // Keep loading state to show error instead of empty values
      setStats(null);
      setSystemMetrics(null);
      setRecentActivity([]);
    } finally {
      setIsLoading(false);
    }
  };

  const getActivityIcon = (action: string) => {
    switch (action) {
      case "KYC_APPROVED":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "KYC_REJECTED":
        return <XCircle className="h-4 w-4 text-red-600" />;
      case "BULK_APPROVAL":
        return <Users className="h-4 w-4 text-blue-600" />;
      case "SYSTEM_BACKUP":
        return <Database className="h-4 w-4 text-purple-600" />;
      case "BLOCKCHAIN_SYNC":
        return <Hash className="h-4 w-4 text-orange-600" />;
      default:
        return <Activity className="h-4 w-4 text-slate-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "SUCCESS":
        return "bg-green-100 text-green-800 border-green-200";
      case "FAILED":
        return "bg-red-100 text-red-800 border-red-200";
      case "PENDING":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      default:
        return "bg-slate-100 text-slate-800 border-slate-200";
    }
  };

  const calculateVerificationRate = () => {
    if (!stats) return 0;
    const total = stats.verifiedRecords + stats.rejectedRecords;
    return total > 0 ? Math.round((stats.verifiedRecords / total) * 100) : 0;
  };

  const calculateCompletionRate = () => {
    if (!stats) return 0;
    const completed = stats.verifiedRecords + stats.rejectedRecords;
    return stats.totalSubmissions > 0
      ? Math.round((completed / stats.totalSubmissions) * 100)
      : 0;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200/50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-2 rounded-lg">
                <BarChart3 className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-800">
                  Admin Dashboard
                </h1>
                <p className="text-xs text-slate-500">
                  System Overview & Analytics
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Button
                onClick={fetchDashboardData}
                disabled={isLoading}
                variant="outline"
                size="sm"
              >
                <RefreshCw
                  className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`}
                />
                Refresh
              </Button>
              <Link to="/admin">
                <Button size="sm">
                  <Settings className="h-4 w-4 mr-2" />
                  Manage KYC
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-8">
        <div className="max-w-7xl mx-auto space-y-8">
          {error && (
            <Alert className="border-yellow-200 bg-yellow-50">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              <AlertDescription className="text-yellow-800">
                {error}
              </AlertDescription>
            </Alert>
          )}

          {/* Quick Stats Cards */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
              <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-blue-100 text-sm font-medium">
                        Total Submissions
                      </p>
                      <p className="text-3xl font-bold">
                        {stats.totalSubmissions.toLocaleString()}
                      </p>
                    </div>
                    <div className="bg-white/20 p-3 rounded-lg">
                      <Users className="h-6 w-6" />
                    </div>
                  </div>
                  <div className="mt-4 flex items-center">
                    <TrendingUp className="h-4 w-4 mr-1" />
                    <span className="text-sm">+12% from last month</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-yellow-100 text-sm font-medium">
                        Pending Review
                      </p>
                      <p className="text-3xl font-bold">
                        {stats.pendingVerifications.toLocaleString()}
                      </p>
                    </div>
                    <div className="bg-white/20 p-3 rounded-lg">
                      <Clock className="h-6 w-6" />
                    </div>
                  </div>
                  <div className="mt-4 flex items-center">
                    <Target className="h-4 w-4 mr-1" />
                    <span className="text-sm">Requires attention</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-green-100 text-sm font-medium">
                        Verified
                      </p>
                      <p className="text-3xl font-bold">
                        {stats.verifiedRecords.toLocaleString()}
                      </p>
                    </div>
                    <div className="bg-white/20 p-3 rounded-lg">
                      <CheckCircle className="h-6 w-6" />
                    </div>
                  </div>
                  <div className="mt-4 flex items-center">
                    <Star className="h-4 w-4 mr-1" />
                    <span className="text-sm">
                      {calculateVerificationRate()}% success rate
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-r from-red-500 to-red-600 text-white">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-red-100 text-sm font-medium">
                        Rejected
                      </p>
                      <p className="text-3xl font-bold">
                        {stats.rejectedRecords.toLocaleString()}
                      </p>
                    </div>
                    <div className="bg-white/20 p-3 rounded-lg">
                      <XCircle className="h-6 w-6" />
                    </div>
                  </div>
                  <div className="mt-4 flex items-center">
                    <AlertTriangle className="h-4 w-4 mr-1" />
                    <span className="text-sm">Needs resubmission</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-purple-100 text-sm font-medium">
                        Avg Processing
                      </p>
                      <p className="text-3xl font-bold">
                        {stats.averageProcessingTime.toFixed(1)}h
                      </p>
                    </div>
                    <div className="bg-white/20 p-3 rounded-lg">
                      <Zap className="h-6 w-6" />
                    </div>
                  </div>
                  <div className="mt-4 flex items-center">
                    <Activity className="h-4 w-4 mr-1" />
                    <span className="text-sm">-15% faster</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* System Status & Performance Metrics */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* System Status */}
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-blue-600" />
                  System Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {systemMetrics && (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-600">System Uptime</span>
                      <Badge className="bg-green-100 text-green-800">
                        {systemMetrics.uptime}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-600 flex items-center gap-2">
                        <Hash className="h-4 w-4" />
                        Blockchain Network
                      </span>
                      <Badge
                        className={
                          systemMetrics.blockchainConnected
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }
                      >
                        {systemMetrics.blockchainConnected
                          ? "Connected"
                          : "Disconnected"}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-600 flex items-center gap-2">
                        <Globe className="h-4 w-4" />
                        IPFS Storage
                      </span>
                      <Badge
                        className={
                          systemMetrics.ipfsConnected
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }
                      >
                        {systemMetrics.ipfsConnected
                          ? "Connected"
                          : "Disconnected"}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-600 flex items-center gap-2">
                        <Database className="h-4 w-4" />
                        Database
                      </span>
                      <Badge
                        className={
                          systemMetrics.databaseConnected
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }
                      >
                        {systemMetrics.databaseConnected ? "Healthy" : "Error"}
                      </Badge>
                    </div>
                    <div className="pt-4 border-t">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-slate-600">System Load</span>
                        <span className="text-slate-800 font-medium">
                          {systemMetrics.systemLoad}%
                        </span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${systemMetrics.systemLoad}%` }}
                        ></div>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Performance Metrics */}
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-purple-600" />
                  Performance Metrics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {stats && (
                  <>
                    <div className="space-y-3">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-slate-600">
                            Completion Rate
                          </span>
                          <span className="text-slate-800 font-medium">
                            {calculateCompletionRate()}%
                          </span>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-2">
                          <div
                            className="bg-green-600 h-2 rounded-full"
                            style={{ width: `${calculateCompletionRate()}%` }}
                          ></div>
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-slate-600">
                            Verification Success
                          </span>
                          <span className="text-slate-800 font-medium">
                            {calculateVerificationRate()}%
                          </span>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ width: `${calculateVerificationRate()}%` }}
                          ></div>
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-slate-600">Pending Review</span>
                          <span className="text-slate-800 font-medium">
                            {Math.round(
                              (stats.pendingVerifications /
                                stats.totalSubmissions) *
                                100,
                            )}
                            %
                          </span>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-2">
                          <div
                            className="bg-yellow-600 h-2 rounded-full"
                            style={{
                              width: `${Math.round((stats.pendingVerifications / stats.totalSubmissions) * 100)}%`,
                            }}
                          ></div>
                        </div>
                      </div>
                    </div>

                    {systemMetrics && (
                      <div className="pt-4 border-t">
                        <div className="grid grid-cols-2 gap-4 text-center">
                          <div>
                            <p className="text-2xl font-bold text-blue-600">
                              {systemMetrics.totalTransactions.toLocaleString()}
                            </p>
                            <p className="text-xs text-slate-500">
                              Blockchain TXs
                            </p>
                          </div>
                          <div>
                            <p className="text-2xl font-bold text-purple-600">
                              {Math.round(stats.averageProcessingTime * 10) /
                                10}
                              h
                            </p>
                            <p className="text-xs text-slate-500">
                              Avg Process Time
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-green-600" />
                  Recent Activity
                </span>
                <Link to="/admin">
                  <Button variant="outline" size="sm">
                    <Eye className="h-4 w-4 mr-2" />
                    View All
                  </Button>
                </Link>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivity.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-center gap-4 p-4 bg-slate-50 rounded-lg"
                  >
                    <div className="flex-shrink-0">
                      {getActivityIcon(activity.action)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm font-medium text-slate-900">
                          {activity.details}
                        </p>
                        <Badge className={getStatusColor(activity.status)}>
                          {activity.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-500">
                        {activity.user} •{" "}
                        {new Date(activity.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5 text-slate-600" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Link to="/admin">
                  <Button
                    className="w-full h-20 flex flex-col gap-2"
                    variant="outline"
                  >
                    <Users className="h-6 w-6" />
                    <span>Manage KYC</span>
                  </Button>
                </Link>
                <Button
                  className="w-full h-20 flex flex-col gap-2"
                  variant="outline"
                >
                  <Download className="h-6 w-6" />
                  <span>Export Data</span>
                </Button>
                <Button
                  className="w-full h-20 flex flex-col gap-2"
                  variant="outline"
                >
                  <Database className="h-6 w-6" />
                  <span>System Backup</span>
                </Button>
                <Button
                  className="w-full h-20 flex flex-col gap-2"
                  variant="outline"
                >
                  <Settings className="h-6 w-6" />
                  <span>Settings</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
