import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
  Filter,
  Search,
  MoreVertical,
  User,
  Mail,
  Phone,
  MapPin,
  Trash2,
  Edit,
  Ban,
  CheckSquare,
  X,
  Loader2,
  Bell,
  Smartphone,
  Monitor,
  TrendingDown,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { KYCStats, ApiResponse } from "@shared/api";
import { useAuth } from "@/hooks/useAuth";

interface SystemMetrics {
  uptime: string;
  blockchainConnected: boolean;
  ipfsConnected: boolean;
  databaseConnected: boolean;
  lastBlockchainSync: string;
  totalTransactions: number;
  systemLoad: number;
  memoryUsage: number;
  diskUsage: number;
  networkLatency: number;
}

interface RecentActivity {
  id: string;
  action: string;
  user: string;
  timestamp: string;
  status: "SUCCESS" | "FAILED" | "PENDING";
  details: string;
  ipAddress?: string;
  userAgent?: string;
}

interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "VERIFIER" | "USER";
  isVerified: boolean;
  kycStatus: "PENDING" | "VERIFIED" | "REJECTED";
  lastLogin: string;
  submissionsCount: number;
}

interface BulkAction {
  action: "approve" | "reject" | "delete";
  userIds: string[];
  reason?: string;
}

export default function AdminDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<KYCStats | null>(null);
  const [systemMetrics, setSystemMetrics] = useState<SystemMetrics | null>(null);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshInterval, setRefreshInterval] = useState<NodeJS.Timeout | null>(null);
  
  // Filters and search
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [timeFilter, setTimeFilter] = useState("7d");
  
  // Bulk actions
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [showBulkDialog, setShowBulkDialog] = useState(false);
  const [bulkAction, setBulkAction] = useState<BulkAction | null>(null);
  const [bulkProcessing, setBulkProcessing] = useState(false);

  // Notifications
  const [notifications, setNotifications] = useState<string[]>([]);

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
      // Fetch all dashboard data in parallel
      const [statsResponse, metricsResponse, activityResponse, usersResponse] =
        await Promise.all([
          fetch("/api/admin/stats"),
          fetch("/api/admin/system-metrics"),
          fetch("/api/admin/recent-activity"),
          fetch("/api/admin/users"),
        ]);

      // Process stats
      if (statsResponse.ok) {
        const statsResult: ApiResponse<KYCStats> = await statsResponse.json();
        if (statsResult.success && statsResult.data) {
          setStats(statsResult.data);
        }
      } else {
        // Mock data for demo
        setStats({
          totalSubmissions: 1247,
          pendingVerifications: 89,
          verifiedRecords: 923,
          rejectedRecords: 235,
          averageProcessingTime: 2.4,
        });
      }

      // Process system metrics
      if (metricsResponse.ok) {
        const metricsResult: ApiResponse<SystemMetrics> = await metricsResponse.json();
        if (metricsResult.success && metricsResult.data) {
          setSystemMetrics(metricsResult.data);
        }
      } else {
        // Mock data for demo
        setSystemMetrics({
          uptime: "15 days, 4 hours",
          blockchainConnected: true,
          ipfsConnected: true,
          databaseConnected: true,
          lastBlockchainSync: new Date().toISOString(),
          totalTransactions: 15647,
          systemLoad: 23,
          memoryUsage: 67,
          diskUsage: 45,
          networkLatency: 12,
        });
      }

      // Process recent activity
      if (activityResponse.ok) {
        const activityResult: ApiResponse<RecentActivity[]> = await activityResponse.json();
        if (activityResult.success && activityResult.data) {
          setRecentActivity(activityResult.data);
        }
      } else {
        // Mock data for demo
        setRecentActivity([
          {
            id: "1",
            action: "KYC_APPROVED",
            user: "Admin User",
            timestamp: new Date().toISOString(),
            status: "SUCCESS",
            details: "Approved KYC for user john.doe@example.com",
            ipAddress: "192.168.1.100",
          },
          {
            id: "2",
            action: "BULK_APPROVAL",
            user: "Admin User",
            timestamp: new Date(Date.now() - 1800000).toISOString(),
            status: "SUCCESS",
            details: "Bulk approved 25 KYC applications",
            ipAddress: "192.168.1.100",
          },
          {
            id: "3",
            action: "SYSTEM_BACKUP",
            user: "System",
            timestamp: new Date(Date.now() - 3600000).toISOString(),
            status: "SUCCESS",
            details: "Daily system backup completed",
          },
        ]);
      }

      // Process users
      if (usersResponse.ok) {
        const usersResult: ApiResponse<AdminUser[]> = await usersResponse.json();
        if (usersResult.success && usersResult.data) {
          setUsers(usersResult.data);
        }
      } else {
        // Mock data for demo
        setUsers([
          {
            id: "1",
            name: "John Doe",
            email: "john.doe@example.com",
            role: "USER",
            isVerified: true,
            kycStatus: "VERIFIED",
            lastLogin: new Date().toISOString(),
            submissionsCount: 2,
          },
          {
            id: "2",
            name: "Jane Smith",
            email: "jane.smith@example.com",
            role: "USER",
            isVerified: false,
            kycStatus: "PENDING",
            lastLogin: new Date(Date.now() - 86400000).toISOString(),
            submissionsCount: 1,
          },
        ]);
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      setError("Failed to load dashboard data. Some features may not be available.");
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
      case "USER_LOGIN":
        return <User className="h-4 w-4 text-slate-600" />;
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

  const calculateMetrics = () => {
    if (!stats) return { verificationRate: 0, completionRate: 0, growthRate: 0 };
    
    const total = stats.verifiedRecords + stats.rejectedRecords;
    const verificationRate = total > 0 ? Math.round((stats.verifiedRecords / total) * 100) : 0;
    const completed = stats.verifiedRecords + stats.rejectedRecords;
    const completionRate = stats.totalSubmissions > 0 
      ? Math.round((completed / stats.totalSubmissions) * 100) : 0;
    const growthRate = 12; // Mock growth rate

    return { verificationRate, completionRate, growthRate };
  };

  const handleBulkAction = async () => {
    if (!bulkAction) return;
    
    setBulkProcessing(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setNotifications(prev => [
        ...prev,
        `Bulk ${bulkAction.action} completed for ${bulkAction.userIds.length} users`
      ]);
      
      setSelectedUsers([]);
      setBulkAction(null);
      setShowBulkDialog(false);
      fetchDashboardData(); // Refresh data
    } catch (error) {
      setError(`Failed to perform bulk ${bulkAction.action}`);
    } finally {
      setBulkProcessing(false);
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || user.kycStatus === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const metrics = calculateMetrics();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Mobile-optimized Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200/50 sticky top-0 z-50">
        <div className="container mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-2 rounded-lg">
                <BarChart3 className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-bold text-slate-800">
                  Admin Dashboard
                </h1>
                <p className="text-xs text-slate-500">
                  System Overview & Analytics
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2 sm:space-x-4">
              {/* Notifications */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="relative">
                    <Bell className="h-4 w-4" />
                    {notifications.length > 0 && (
                      <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full text-xs"></span>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-80" align="end">
                  {notifications.length > 0 ? (
                    notifications.map((notification, index) => (
                      <DropdownMenuItem key={index} className="text-sm">
                        {notification}
                      </DropdownMenuItem>
                    ))
                  ) : (
                    <DropdownMenuItem className="text-sm text-slate-500">
                      No new notifications
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Refresh Button */}
              <Button
                onClick={fetchDashboardData}
                disabled={isLoading}
                variant="outline"
                size="sm"
                className="hidden sm:flex"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
                Refresh
              </Button>
              
              {/* Mobile Refresh */}
              <Button
                onClick={fetchDashboardData}
                disabled={isLoading}
                variant="ghost"
                size="sm"
                className="sm:hidden p-2"
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
              </Button>

              {/* Manage KYC Link */}
              <Link to="/admin">
                <Button size="sm" className="hidden sm:flex">
                  <Settings className="h-4 w-4 mr-2" />
                  Manage KYC
                </Button>
                <Button size="sm" className="sm:hidden p-2">
                  <Settings className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8">
          {error && (
            <Alert className="border-yellow-200 bg-yellow-50">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              <AlertDescription className="text-yellow-800">
                {error}
              </AlertDescription>
            </Alert>
          )}

          {/* Mobile-responsive Stats Cards */}
          {stats && (
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-6">
              <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
                <CardContent className="p-3 sm:p-6">
                  <div className="flex items-center justify-between">
                    <div className="min-w-0 flex-1">
                      <p className="text-blue-100 text-xs sm:text-sm font-medium truncate">
                        Total Submissions
                      </p>
                      <p className="text-lg sm:text-3xl font-bold">
                        {stats.totalSubmissions.toLocaleString()}
                      </p>
                    </div>
                    <div className="bg-white/20 p-2 sm:p-3 rounded-lg shrink-0">
                      <Users className="h-4 w-4 sm:h-6 sm:w-6" />
                    </div>
                  </div>
                  <div className="mt-2 sm:mt-4 flex items-center">
                    <ArrowUp className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                    <span className="text-xs sm:text-sm">+{metrics.growthRate}% from last month</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white">
                <CardContent className="p-3 sm:p-6">
                  <div className="flex items-center justify-between">
                    <div className="min-w-0 flex-1">
                      <p className="text-yellow-100 text-xs sm:text-sm font-medium truncate">
                        Pending Review
                      </p>
                      <p className="text-lg sm:text-3xl font-bold">
                        {stats.pendingVerifications.toLocaleString()}
                      </p>
                    </div>
                    <div className="bg-white/20 p-2 sm:p-3 rounded-lg shrink-0">
                      <Clock className="h-4 w-4 sm:h-6 sm:w-6" />
                    </div>
                  </div>
                  <div className="mt-2 sm:mt-4 flex items-center">
                    <Target className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                    <span className="text-xs sm:text-sm">Requires attention</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
                <CardContent className="p-3 sm:p-6">
                  <div className="flex items-center justify-between">
                    <div className="min-w-0 flex-1">
                      <p className="text-green-100 text-xs sm:text-sm font-medium truncate">
                        Verified
                      </p>
                      <p className="text-lg sm:text-3xl font-bold">
                        {stats.verifiedRecords.toLocaleString()}
                      </p>
                    </div>
                    <div className="bg-white/20 p-2 sm:p-3 rounded-lg shrink-0">
                      <CheckCircle className="h-4 w-4 sm:h-6 sm:w-6" />
                    </div>
                  </div>
                  <div className="mt-2 sm:mt-4 flex items-center">
                    <Star className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                    <span className="text-xs sm:text-sm">{metrics.verificationRate}% success rate</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-r from-red-500 to-red-600 text-white">
                <CardContent className="p-3 sm:p-6">
                  <div className="flex items-center justify-between">
                    <div className="min-w-0 flex-1">
                      <p className="text-red-100 text-xs sm:text-sm font-medium truncate">
                        Rejected
                      </p>
                      <p className="text-lg sm:text-3xl font-bold">
                        {stats.rejectedRecords.toLocaleString()}
                      </p>
                    </div>
                    <div className="bg-white/20 p-2 sm:p-3 rounded-lg shrink-0">
                      <XCircle className="h-4 w-4 sm:h-6 sm:w-6" />
                    </div>
                  </div>
                  <div className="mt-2 sm:mt-4 flex items-center">
                    <AlertTriangle className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                    <span className="text-xs sm:text-sm">Needs resubmission</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white col-span-2 lg:col-span-1">
                <CardContent className="p-3 sm:p-6">
                  <div className="flex items-center justify-between">
                    <div className="min-w-0 flex-1">
                      <p className="text-purple-100 text-xs sm:text-sm font-medium truncate">
                        Avg Processing
                      </p>
                      <p className="text-lg sm:text-3xl font-bold">
                        {stats.averageProcessingTime.toFixed(1)}h
                      </p>
                    </div>
                    <div className="bg-white/20 p-2 sm:p-3 rounded-lg shrink-0">
                      <Zap className="h-4 w-4 sm:h-6 sm:w-6" />
                    </div>
                  </div>
                  <div className="mt-2 sm:mt-4 flex items-center">
                    <ArrowDown className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                    <span className="text-xs sm:text-sm">15% faster</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* System Status & Performance - Mobile Responsive */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* System Status */}
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <Shield className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                  System Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {systemMetrics && (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-slate-600">Uptime</span>
                        <Badge className="bg-green-100 text-green-800 text-xs">
                          {systemMetrics.uptime}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-slate-600 flex items-center gap-1">
                          <Hash className="h-3 w-3" />
                          Blockchain
                        </span>
                        <Badge
                          className={`text-xs ${
                            systemMetrics.blockchainConnected
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {systemMetrics.blockchainConnected ? "Connected" : "Disconnected"}
                        </Badge>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-slate-600 flex items-center gap-1">
                          <Globe className="h-3 w-3" />
                          IPFS
                        </span>
                        <Badge
                          className={`text-xs ${
                            systemMetrics.ipfsConnected
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {systemMetrics.ipfsConnected ? "Connected" : "Disconnected"}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-slate-600 flex items-center gap-1">
                          <Database className="h-3 w-3" />
                          Database
                        </span>
                        <Badge
                          className={`text-xs ${
                            systemMetrics.databaseConnected
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {systemMetrics.databaseConnected ? "Healthy" : "Error"}
                        </Badge>
                      </div>
                    </div>

                    {/* Resource Usage */}
                    <div className="pt-4 border-t space-y-3">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm text-slate-600">System Load</span>
                          <span className="text-sm font-medium">{systemMetrics.systemLoad}%</span>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${systemMetrics.systemLoad}%` }}
                          ></div>
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm text-slate-600">Memory Usage</span>
                          <span className="text-sm font-medium">{systemMetrics.memoryUsage}%</span>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-2">
                          <div
                            className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${systemMetrics.memoryUsage}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Performance Metrics */}
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600" />
                  Performance Metrics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {stats && (
                  <>
                    <div className="space-y-3">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm text-slate-600">Completion Rate</span>
                          <span className="text-sm font-medium">{metrics.completionRate}%</span>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-2">
                          <div
                            className="bg-green-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${metrics.completionRate}%` }}
                          ></div>
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm text-slate-600">Verification Success</span>
                          <span className="text-sm font-medium">{metrics.verificationRate}%</span>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${metrics.verificationRate}%` }}
                          ></div>
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm text-slate-600">Pending Review</span>
                          <span className="text-sm font-medium">
                            {Math.round((stats.pendingVerifications / stats.totalSubmissions) * 100)}%
                          </span>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-2">
                          <div
                            className="bg-yellow-600 h-2 rounded-full transition-all duration-300"
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
                            <p className="text-lg sm:text-2xl font-bold text-blue-600">
                              {systemMetrics.totalTransactions.toLocaleString()}
                            </p>
                            <p className="text-xs text-slate-500">Blockchain TXs</p>
                          </div>
                          <div>
                            <p className="text-lg sm:text-2xl font-bold text-purple-600">
                              {systemMetrics.networkLatency}ms
                            </p>
                            <p className="text-xs text-slate-500">Network Latency</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          {/* User Management Section */}
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <span className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-blue-600" />
                  User Management
                </span>
                <div className="flex flex-col sm:flex-row gap-2">
                  {selectedUsers.length > 0 && (
                    <Dialog open={showBulkDialog} onOpenChange={setShowBulkDialog}>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <CheckSquare className="h-4 w-4 mr-2" />
                          Bulk Actions ({selectedUsers.length})
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Bulk Actions</DialogTitle>
                          <DialogDescription>
                            Select an action to perform on {selectedUsers.length} selected users.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label>Action</Label>
                            <Select
                              onValueChange={(value: "approve" | "reject" | "delete") =>
                                setBulkAction({ action: value, userIds: selectedUsers })
                              }
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select an action" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="approve">Approve KYC</SelectItem>
                                <SelectItem value="reject">Reject KYC</SelectItem>
                                <SelectItem value="delete">Delete Users</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          {bulkAction?.action === "reject" && (
                            <div>
                              <Label>Reason (Optional)</Label>
                              <Input
                                placeholder="Enter rejection reason"
                                onChange={(e) =>
                                  setBulkAction(prev => prev ? { ...prev, reason: e.target.value } : null)
                                }
                              />
                            </div>
                          )}
                        </div>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setShowBulkDialog(false)}>
                            Cancel
                          </Button>
                          <Button
                            onClick={handleBulkAction}
                            disabled={!bulkAction || bulkProcessing}
                          >
                            {bulkProcessing ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Processing...
                              </>
                            ) : (
                              "Confirm"
                            )}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  )}
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* Search and Filters */}
              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <Input
                      placeholder="Search users by name or email..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="PENDING">Pending</SelectItem>
                      <SelectItem value="VERIFIED">Verified</SelectItem>
                      <SelectItem value="REJECTED">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Users List */}
              <div className="space-y-2">
                {filteredUsers.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center gap-4 p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={selectedUsers.includes(user.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedUsers(prev => [...prev, user.id]);
                        } else {
                          setSelectedUsers(prev => prev.filter(id => id !== user.id));
                        }
                      }}
                      className="w-4 h-4"
                    />
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <h4 className="font-medium text-slate-900 truncate">{user.name}</h4>
                          <p className="text-sm text-slate-500 truncate">{user.email}</p>
                          <div className="flex flex-wrap items-center gap-2 mt-1">
                            <Badge className={`text-xs ${
                              user.kycStatus === 'VERIFIED' ? 'bg-green-100 text-green-800' :
                              user.kycStatus === 'REJECTED' ? 'bg-red-100 text-red-800' :
                              'bg-yellow-100 text-yellow-800'
                            }`}>
                              {user.kycStatus}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {user.role}
                            </Badge>
                            <span className="text-xs text-slate-500">
                              {user.submissionsCount} submission{user.submissionsCount !== 1 ? 's' : ''}
                            </span>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2 shrink-0">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem>
                                <Eye className="h-4 w-4 mr-2" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Edit className="h-4 w-4 mr-2" />
                                Edit User
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Ban className="h-4 w-4 mr-2" />
                                Suspend
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-red-600">
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
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
              <div className="space-y-3 sm:space-y-4">
                {recentActivity.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-start gap-3 sm:gap-4 p-3 sm:p-4 bg-slate-50 rounded-lg"
                  >
                    <div className="flex-shrink-0 mt-0.5">
                      {getActivityIcon(activity.action)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-1">
                        <p className="text-sm font-medium text-slate-900 truncate">
                          {activity.details}
                        </p>
                        <Badge className={`${getStatusColor(activity.status)} text-xs shrink-0`}>
                          {activity.status}
                        </Badge>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                        <span>{activity.user}</span>
                        <span>•</span>
                        <span>{new Date(activity.timestamp).toLocaleString()}</span>
                        {activity.ipAddress && (
                          <>
                            <span>•</span>
                            <span>{activity.ipAddress}</span>
                          </>
                        )}
                      </div>
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
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <Link to="/admin">
                  <Button className="w-full h-16 sm:h-20 flex flex-col gap-2" variant="outline">
                    <Users className="h-5 w-5 sm:h-6 sm:w-6" />
                    <span className="text-sm">Manage KYC</span>
                  </Button>
                </Link>
                <Button className="w-full h-16 sm:h-20 flex flex-col gap-2" variant="outline">
                  <Download className="h-5 w-5 sm:h-6 sm:w-6" />
                  <span className="text-sm">Export Data</span>
                </Button>
                <Button className="w-full h-16 sm:h-20 flex flex-col gap-2" variant="outline">
                  <Database className="h-5 w-5 sm:h-6 sm:w-6" />
                  <span className="text-sm">System Backup</span>
                </Button>
                <Button className="w-full h-16 sm:h-20 flex flex-col gap-2" variant="outline">
                  <Settings className="h-5 w-5 sm:h-6 sm:w-6" />
                  <span className="text-sm">Settings</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
