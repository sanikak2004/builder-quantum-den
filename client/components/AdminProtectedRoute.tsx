import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Shield, Lock, AlertTriangle, Eye, EyeOff } from "lucide-react";

interface AdminProtectedRouteProps {
  children: React.ReactNode;
}

export default function AdminProtectedRoute({
  children,
}: AdminProtectedRouteProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [adminCode, setAdminCode] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Demo admin codes - In production, this should be proper authentication
  const ADMIN_CODES = [
    "ADMIN2024",
    "EKYC_ADMIN",
    "BLOCKCHAIN_ADMIN",
    "SUPER_USER",
  ];

  useEffect(() => {
    // Check if admin is already authenticated in session storage
    const storedAuth = sessionStorage.getItem("admin_authenticated");
    if (storedAuth === "true") {
      setIsAuthenticated(true);
    }
    setIsLoading(false);
  }, []);

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!adminCode.trim()) {
      setError("Please enter admin access code");
      return;
    }

    // In production, this should be a proper API call
    if (ADMIN_CODES.includes(adminCode.toUpperCase())) {
      setIsAuthenticated(true);
      sessionStorage.setItem("admin_authenticated", "true");
      setError("");
    } else {
      setError(
        "Invalid admin access code. Please contact system administrator.",
      );
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem("admin_authenticated");
    setAdminCode("");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Checking authentication...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center p-6">
        <Card className="w-full max-w-md bg-white/90 backdrop-blur-sm shadow-xl border-0">
          <CardHeader className="text-center pb-6">
            <div className="bg-gradient-to-r from-red-600 to-orange-600 p-3 rounded-full w-fit mx-auto mb-4">
              <Lock className="h-8 w-8 text-white" />
            </div>
            <CardTitle className="text-2xl font-bold text-slate-800">
              Admin Access Required
            </CardTitle>
            <p className="text-slate-600 text-sm">
              This area is restricted to authorized administrators only
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAdminLogin} className="space-y-4">
              <div>
                <Label htmlFor="adminCode" className="text-slate-700">
                  Admin Access Code
                </Label>
                <div className="relative">
                  <Input
                    id="adminCode"
                    type={showPassword ? "text" : "password"}
                    value={adminCode}
                    onChange={(e) => setAdminCode(e.target.value)}
                    placeholder="Enter admin access code..."
                    className="mt-1 pr-10"
                    autoComplete="off"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-1 h-8 w-8 p-0"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              {error && (
                <Alert className="border-red-200 bg-red-50">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  <AlertDescription className="text-red-800">
                    {error}
                  </AlertDescription>
                </Alert>
              )}

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700"
              >
                <Shield className="h-4 w-4 mr-2" />
                Access Admin Panel
              </Button>
            </form>

            <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <h4 className="text-sm font-medium text-yellow-800 mb-2">
                🔐 Demo Access Codes
              </h4>
              <p className="text-xs text-yellow-700 mb-2">
                For demonstration purposes, use any of these codes:
              </p>
              <div className="space-y-1">
                {ADMIN_CODES.map((code, index) => (
                  <button
                    key={index}
                    onClick={() => setAdminCode(code)}
                    className="block w-full text-left font-mono text-xs bg-yellow-100 hover:bg-yellow-200 p-2 rounded border transition-colors"
                  >
                    {code}
                  </button>
                ))}
              </div>
              <p className="text-xs text-yellow-600 mt-2">
                ⚠️ In production, this would be replaced with proper
                authentication
              </p>
            </div>

            <div className="mt-6 text-center">
              <a
                href="/"
                className="text-sm text-slate-500 hover:text-slate-700 transition-colors"
              >
                ← Back to Homepage
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div>
      {/* Admin Toolbar */}
      <div className="bg-red-600 text-white px-6 py-2">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            <span className="text-sm font-medium">Admin Mode Active</span>
          </div>
          <Button
            onClick={handleLogout}
            variant="ghost"
            size="sm"
            className="text-white hover:bg-red-700"
          >
            Logout
          </Button>
        </div>
      </div>
      {children}
    </div>
  );
}
