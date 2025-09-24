import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Shield,
  Lock,
  FileCheck,
  History,
  Users,
  Zap,
  CheckCircle,
  Clock,
  AlertTriangle,
  ArrowRight,
  Link2,
  Database,
  Cloud,
  Hash,
} from "lucide-react";
import { KYCStats } from "@shared/api";

export default function Index() {
  const [stats, setStats] = useState<KYCStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setIsLoading(true);
      setHasError(false);
      
      const response = await fetch("/api/kyc/stats");
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          setStats(data.data);
        } else {
          console.warn("Stats API returned no data");
          // Let stats remain null to show loading/error state
          setStats(null);
        }
      } else {
        console.warn("Stats API not available, using database data");
        setHasError(true);
        setStats(null);
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
      setHasError(true);
      // Let stats remain null to show error state
      setStats(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Loading screen to prevent white screen
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="flex items-center space-x-3 mb-6">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-3 rounded-lg animate-pulse">
              <Shield className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-800">Authen Ledger</h1>
              <p className="text-sm text-slate-500">Loading dashboard...</p>
            </div>
          </div>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200/50 sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-2 rounded-lg">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-800">
                  Authen Ledger
                </h1>
                <p className="text-xs text-slate-500">
                  Blockchain-Powered Identity Verification
                </p>
              </div>
            </div>
            <nav className="hidden md:flex items-center space-x-6">
              <Link
                to="/submit"
                className="text-slate-600 hover:text-blue-600 transition-colors"
              >
                Submit KYC
              </Link>
              <Link
                to="/verify"
                className="text-slate-600 hover:text-blue-600 transition-colors"
              >
                Verify Status
              </Link>
              <Link
                to="/history"
                className="text-slate-600 hover:text-blue-600 transition-colors"
              >
                History
              </Link>
              <Link
                to="/blockchain"
                className="text-slate-600 hover:text-indigo-600 transition-colors font-medium"
              >
                Blockchain
              </Link>
              <Link
                to="/admin/dashboard"
                className="text-slate-600 hover:text-purple-600 transition-colors font-medium"
              >
                Admin Dashboard
              </Link>
              <Link
                to="/workflow-testing"
                className="text-slate-600 hover:text-green-600 transition-colors font-medium"
              >
                Workflow Testing
              </Link>
              <Link to="/auth/login">
                <Button variant="outline" size="sm">
                  Sign In
                </Button>
              </Link>
              <Link to="/auth/register">
                <Button size="sm">Get Started</Button>
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-6">
        <div className="container mx-auto text-center">
          <div className="inline-flex items-center bg-blue-100 text-blue-800 px-4 py-2 rounded-full text-sm font-medium mb-6">
            <Link2 className="h-4 w-4 mr-2" />
            Powered by Hyperledger Fabric
          </div>
          <h1 className="text-5xl md:text-6xl font-bold text-slate-800 mb-6 leading-tight">
            Authen Ledger
            <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent block">
              Blockchain Authentication
            </span>
          </h1>
          <p className="text-xl text-slate-600 mb-8 max-w-3xl mx-auto leading-relaxed">
            Experience the future of digital identity with Authen Ledger's
            blockchain-based eKYC system. Immutable records, instant
            verification, and complete audit trails powered by Hyperledger
            Fabric technology.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/submit">
              <Button
                size="lg"
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-8 py-3 rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all"
              >
                Submit KYC Now
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link to="/verify">
              <Button
                variant="outline"
                size="lg"
                className="px-8 py-3 rounded-lg font-semibold border-2 hover:bg-slate-50"
              >
                Verify Status
                <FileCheck className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link to="/transaction-verifier">
              <Button
                variant="outline"
                size="lg"
                className="px-8 py-3 rounded-lg font-semibold border-2 border-purple-300 text-purple-700 hover:bg-purple-50"
              >
                Check Transaction
                <Hash className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link to="/workflow-testing">
              <Button
                variant="outline"
                size="lg"
                className="px-8 py-3 rounded-lg font-semibold border-2 border-green-300 text-green-700 hover:bg-green-50"
              >
                Test Workflow
                <Zap className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      {stats && (
        <section className="py-16 px-6 bg-white/50 backdrop-blur-sm">
          <div className="container mx-auto">
            {hasError && (
              <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-center gap-2 text-yellow-800">
                  <AlertTriangle className="h-4 w-4" />
                  <span className="text-sm">Unable to fetch live statistics. Showing default values.</span>
                </div>
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
                <CardContent className="p-6 text-center">
                  <div className="bg-blue-100 p-3 rounded-full w-fit mx-auto mb-4">
                    <Users className="h-6 w-6 text-blue-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-800">
                    {(stats.totalSubmissions || 0).toLocaleString()}
                  </h3>
                  <p className="text-slate-600">Total Submissions</p>
                </CardContent>
              </Card>
              <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
                <CardContent className="p-6 text-center">
                  <div className="bg-yellow-100 p-3 rounded-full w-fit mx-auto mb-4">
                    <Clock className="h-6 w-6 text-yellow-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-800">
                    {(stats.pendingVerifications || 0).toLocaleString()}
                  </h3>
                  <p className="text-slate-600">Pending Verifications</p>
                </CardContent>
              </Card>
              <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
                <CardContent className="p-6 text-center">
                  <div className="bg-green-100 p-3 rounded-full w-fit mx-auto mb-4">
                    <CheckCircle className="h-6 w-6 text-green-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-800">
                    {(stats.verifiedRecords || 0).toLocaleString()}
                  </h3>
                  <p className="text-slate-600">Verified Records</p>
                </CardContent>
              </Card>
              <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
                <CardContent className="p-6 text-center">
                  <div className="bg-purple-100 p-3 rounded-full w-fit mx-auto mb-4">
                    <Zap className="h-6 w-6 text-purple-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-800">
                    {(stats.averageProcessingTime || 0).toFixed(1)}h
                  </h3>
                  <p className="text-slate-600">Avg Processing Time</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      )}

      {/* Features Section */}
      <section className="py-20 px-6">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-slate-800 mb-4">
              Why Choose Authen Ledger?
            </h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              Built on enterprise-grade blockchain technology for maximum
              security and transparency
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all">
              <CardHeader>
                <div className="bg-gradient-to-r from-blue-500 to-indigo-500 p-3 rounded-lg w-fit">
                  <Lock className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="text-xl text-slate-800">
                  Immutable Security
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600">
                  Document hashes stored on Hyperledger Fabric blockchain ensure
                  tamper-proof records that cannot be altered or deleted.
                </p>
                <div className="mt-4">
                  <Badge
                    variant="secondary"
                    className="bg-blue-100 text-blue-800"
                  >
                    Blockchain Secured
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all">
              <CardHeader>
                <div className="bg-gradient-to-r from-green-500 to-emerald-500 p-3 rounded-lg w-fit">
                  <FileCheck className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="text-xl text-slate-800">
                  Instant Verification
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600">
                  Real-time KYC status verification with cryptographic proof of
                  authenticity. Get verification results in seconds, not days.
                </p>
                <div className="mt-4">
                  <Badge
                    variant="secondary"
                    className="bg-green-100 text-green-800"
                  >
                    Real-time Processing
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all">
              <CardHeader>
                <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-3 rounded-lg w-fit">
                  <History className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="text-xl text-slate-800">
                  Complete Audit Trail
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600">
                  Every action is recorded on the blockchain with timestamps and
                  digital signatures, providing complete transparency and
                  accountability.
                </p>
                <div className="mt-4">
                  <Badge
                    variant="secondary"
                    className="bg-purple-100 text-purple-800"
                  >
                    Full Transparency
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all">
              <CardHeader>
                <div className="bg-gradient-to-r from-orange-500 to-red-500 p-3 rounded-lg w-fit">
                  <Database className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="text-xl text-slate-800">
                  IPFS Storage
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600">
                  Sensitive documents stored securely off-chain using IPFS,
                  while maintaining cryptographic links on the blockchain.
                </p>
                <div className="mt-4">
                  <Badge
                    variant="secondary"
                    className="bg-orange-100 text-orange-800"
                  >
                    Distributed Storage
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all">
              <CardHeader>
                <div className="bg-gradient-to-r from-cyan-500 to-blue-500 p-3 rounded-lg w-fit">
                  <Shield className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="text-xl text-slate-800">
                  Enterprise Grade
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600">
                  Built on Hyperledger Fabric with multi-peer consensus,
                  ensuring enterprise-level security and reliability for
                  critical applications.
                </p>
                <div className="mt-4">
                  <Badge
                    variant="secondary"
                    className="bg-cyan-100 text-cyan-800"
                  >
                    Enterprise Ready
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all">
              <CardHeader>
                <div className="bg-gradient-to-r from-indigo-500 to-purple-500 p-3 rounded-lg w-fit">
                  <Cloud className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="text-xl text-slate-800">
                  Scalable Infrastructure
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600">
                  Cloud-native architecture with horizontal scaling capabilities
                  to handle millions of KYC verifications efficiently.
                </p>
                <div className="mt-4">
                  <Badge
                    variant="secondary"
                    className="bg-indigo-100 text-indigo-800"
                  >
                    Cloud Native
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Testing & Workflow Section */}
      <section className="py-16 px-6 bg-gradient-to-r from-green-50 to-emerald-50">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center bg-green-100 text-green-800 px-4 py-2 rounded-full text-sm font-medium mb-4">
              <Zap className="h-4 w-4 mr-2" />
              Testing & Workflow Management
            </div>
            <h2 className="text-3xl font-bold text-slate-800 mb-4">
              Complete Workflow Testing Dashboard
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Test and monitor the complete eKYC process from document upload to blockchain validation. 
              Watch your workflow in real-time with comprehensive testing tools.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="bg-white border-0 shadow-lg hover:shadow-xl transition-all">
              <CardHeader>
                <div className="bg-gradient-to-r from-green-500 to-emerald-500 p-3 rounded-lg w-fit">
                  <Zap className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="text-xl text-slate-800">
                  Workflow Testing
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600 mb-4">
                  Comprehensive testing dashboard with automated test suites for KYC submission, 
                  blockchain operations, validation processes, and end-to-end integration.
                </p>
                <Link to="/workflow-testing">
                  <Button className="w-full bg-green-600 hover:bg-green-700">
                    Launch Testing Dashboard
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="bg-white border-0 shadow-lg hover:shadow-xl transition-all">
              <CardHeader>
                <div className="bg-gradient-to-r from-blue-500 to-indigo-500 p-3 rounded-lg w-fit">
                  <Database className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="text-xl text-slate-800">
                  Blockchain Explorer
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600 mb-4">
                  Monitor blockchain operations, view transaction history, 
                  track mining progress, and analyze network performance in real-time.
                </p>
                <Link to="/blockchain">
                  <Button className="w-full bg-blue-600 hover:bg-blue-700" variant="outline">
                    View Blockchain
                    <Link2 className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="bg-white border-0 shadow-lg hover:shadow-xl transition-all">
              <CardHeader>
                <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-3 rounded-lg w-fit">
                  <Users className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="text-xl text-slate-800">
                  Admin Dashboard
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600 mb-4">
                  Access administrative functions for KYC management, 
                  user verification, system monitoring, and audit trail review.
                </p>
                <Link to="/admin/dashboard">
                  <Button className="w-full bg-purple-600 hover:bg-purple-700" variant="outline">
                    Admin Access
                    <Shield className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6 bg-gradient-to-r from-blue-600 to-indigo-600">
        <div className="container mx-auto text-center">
          <h2 className="text-4xl font-bold text-white mb-6">
            Ready to Get Verified?
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Join thousands of verified users on our secure blockchain platform.
            Complete your KYC in minutes, not days.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/submit">
              <Button
                size="lg"
                className="bg-white text-blue-600 hover:bg-slate-50 px-8 py-3 rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all"
              >
                Start KYC Process
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link to="/verify">
              <Button
                variant="outline"
                size="lg"
                className="border-2 border-white text-white hover:bg-white/10 px-8 py-3 rounded-lg font-semibold"
              >
                Check Status
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-800 text-white py-12 px-6">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-2 rounded-lg">
                  <Shield className="h-5 w-5 text-white" />
                </div>
                <h3 className="text-lg font-bold">Authen Ledger</h3>
              </div>
              <p className="text-slate-400 text-sm">
                Authen Ledger - Blockchain-powered identity verification
                platform built on Hyperledger Fabric.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Platform</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li>
                  <Link
                    to="/submit"
                    className="hover:text-white transition-colors"
                  >
                    Submit KYC
                  </Link>
                </li>
                <li>
                  <Link
                    to="/verify"
                    className="hover:text-white transition-colors"
                  >
                    Verify Status
                  </Link>
                </li>
                <li>
                  <Link
                    to="/history"
                    className="hover:text-white transition-colors"
                  >
                    History
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Resources</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Documentation
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    API Reference
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Support
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Privacy Policy
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Terms of Service
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Contact
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-700 mt-8 pt-8 text-center text-slate-400 text-sm">
            <p>
              &copy; 2024 Authen Ledger. All rights reserved. Powered by
              Hyperledger Fabric.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
