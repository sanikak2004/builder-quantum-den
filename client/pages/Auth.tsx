import { useState, useEffect } from "react";
import { Link, useParams, Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "@/hooks/useAuth";
import { useWeb3, formatAddress } from "@/hooks/useWeb3";
import {
  Shield,
  Mail,
  Lock,
  User,
  ArrowLeft,
  Loader2,
  Eye,
  EyeOff,
  Wallet,
  CheckCircle,
  Phone,
  AlertTriangle,
  Smartphone,
  Monitor,
  ExternalLink,
} from "lucide-react";

export default function Auth() {
  const { mode } = useParams<{ mode: "login" | "register" }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { 
    login, 
    register, 
    isAuthenticated, 
    isLoading: authLoading, 
    error: authError, 
    clearError, 
    connectWallet 
  } = useAuth();
  const { wallet, isMetaMaskInstalled } = useWeb3();
  
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });

  if (!mode || !["login", "register"].includes(mode)) {
    return <Navigate to="/auth/login" replace />;
  }

  const isLogin = mode === "login";
  const redirectTo = searchParams.get("redirect") || "/dashboard";

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate(redirectTo, { replace: true });
    }
  }, [isAuthenticated, navigate, redirectTo]);

  // Clear errors when switching modes
  useEffect(() => {
    setError("");
    setSuccess("");
    clearError();
  }, [mode, clearError]);

  // Show auth errors
  useEffect(() => {
    if (authError) {
      setError(authError);
    }
  }, [authError]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setSuccess("");
    clearError();

    try {
      if (isLogin) {
        // Login
        if (!formData.email || !formData.password) {
          setError("Email and password are required");
          setIsLoading(false);
          return;
        }

        const success = await login(formData.email, formData.password);
        if (success) {
          setSuccess("Login successful! Redirecting...");
          setTimeout(() => {
            navigate(redirectTo);
          }, 1000);
        }
      } else {
        // Register
        if (!formData.name || !formData.email || !formData.password) {
          setError("Name, email, and password are required");
          setIsLoading(false);
          return;
        }

        if (formData.password !== formData.confirmPassword) {
          setError("Passwords do not match");
          setIsLoading(false);
          return;
        }

        if (formData.password.length < 8) {
          setError("Password must be at least 8 characters long");
          setIsLoading(false);
          return;
        }

        // Basic email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.email)) {
          setError("Please enter a valid email address");
          setIsLoading(false);
          return;
        }

        const success = await register(
          formData.name,
          formData.email,
          formData.password,
          formData.phone || undefined
        );

        if (success) {
          setSuccess("Registration successful! Welcome to Authen Ledger.");
          setTimeout(() => {
            navigate(redirectTo);
          }, 1000);
        }
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleConnectWallet = async () => {
    try {
      setError("");
      const success = await connectWallet();
      if (success) {
        setSuccess("Wallet connected successfully!");
      }
    } catch (err) {
      setError("Failed to connect wallet. Please try again.");
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
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
                <p className="text-xs text-slate-500">
                  {isLogin ? "Sign In" : "Create Account"}
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

      {/* Main Content */}
      <div className="container mx-auto px-4 sm:px-6 py-8 sm:py-16">
        <div className="max-w-md mx-auto">
          {/* Main Auth Card */}
          <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl">
            <CardHeader className="text-center pb-6">
              <CardTitle className="flex items-center justify-center gap-2 text-2xl sm:text-3xl">
                <User className="h-6 w-6 sm:h-7 sm:w-7 text-blue-600" />
                {isLogin ? "Welcome Back" : "Create Account"}
              </CardTitle>
              <p className="text-slate-600 text-sm sm:text-base">
                {isLogin
                  ? "Sign in to access your KYC dashboard"
                  : "Join our secure blockchain identity platform"}
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Full Name - Register only */}
                {!isLogin && (
                  <div>
                    <Label htmlFor="name" className="text-sm font-medium">
                      Full Name *
                    </Label>
                    <div className="relative mt-1">
                      <User className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
                      <Input
                        id="name"
                        type="text"
                        value={formData.name}
                        onChange={(e) => handleInputChange("name", e.target.value)}
                        placeholder="Enter your full name"
                        className="pl-10 h-12 text-base" // Better for mobile
                        required={!isLogin}
                        autoComplete="name"
                      />
                    </div>
                  </div>
                )}

                {/* Phone Number - Register only */}
                {!isLogin && (
                  <div>
                    <Label htmlFor="phone" className="text-sm font-medium">
                      Phone Number
                    </Label>
                    <div className="relative mt-1">
                      <Phone className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
                      <Input
                        id="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => handleInputChange("phone", e.target.value)}
                        placeholder="Enter your phone number"
                        className="pl-10 h-12 text-base"
                        autoComplete="tel"
                      />
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      Optional - for enhanced security notifications
                    </p>
                  </div>
                )}

                {/* Email */}
                <div>
                  <Label htmlFor="email" className="text-sm font-medium">
                    Email Address *
                  </Label>
                  <div className="relative mt-1">
                    <Mail className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange("email", e.target.value)}
                      placeholder="Enter your email"
                      className="pl-10 h-12 text-base"
                      required
                      autoComplete="email"
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <Label htmlFor="password" className="text-sm font-medium">
                    Password *
                  </Label>
                  <div className="relative mt-1">
                    <Lock className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={formData.password}
                      onChange={(e) => handleInputChange("password", e.target.value)}
                      placeholder="Enter your password"
                      className="pl-10 pr-12 h-12 text-base"
                      required
                      autoComplete={isLogin ? "current-password" : "new-password"}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3.5 text-slate-400 hover:text-slate-600 p-1"
                      tabIndex={-1}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  {!isLogin && (
                    <p className="text-xs text-slate-500 mt-1">
                      Must be at least 8 characters long
                    </p>
                  )}
                </div>

                {/* Confirm Password - Register only */}
                {!isLogin && (
                  <div>
                    <Label htmlFor="confirmPassword" className="text-sm font-medium">
                      Confirm Password *
                    </Label>
                    <div className="relative mt-1">
                      <Lock className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
                      <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        value={formData.confirmPassword}
                        onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                        placeholder="Confirm your password"
                        className="pl-10 pr-12 h-12 text-base"
                        required={!isLogin}
                        autoComplete="new-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-3.5 text-slate-400 hover:text-slate-600 p-1"
                        tabIndex={-1}
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {/* Error Alert */}
                {error && (
                  <Alert className="border-red-200 bg-red-50">
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                    <AlertDescription className="text-red-800 text-sm">
                      {error}
                    </AlertDescription>
                  </Alert>
                )}

                {/* Success Alert */}
                {success && (
                  <Alert className="border-green-200 bg-green-50">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-800 text-sm">
                      {success}
                    </AlertDescription>
                  </Alert>
                )}

                {/* Submit Button */}
                <Button
                  type="submit"
                  disabled={isLoading || authLoading}
                  className="w-full h-12 text-base font-medium bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg"
                >
                  {(isLoading || authLoading) ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      {isLogin ? "Signing In..." : "Creating Account..."}
                    </>
                  ) : isLogin ? (
                    "Sign In"
                  ) : (
                    "Create Account"
                  )}
                </Button>

                {/* Web3 Wallet Connection - Login only */}
                {isLogin && isMetaMaskInstalled && (
                  <>
                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t border-slate-200" />
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-white px-3 text-slate-500 font-medium">
                          Or connect with
                        </span>
                      </div>
                    </div>

                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleConnectWallet}
                      disabled={isLoading || authLoading}
                      className="w-full h-12 text-base font-medium border-2"
                    >
                      <Wallet className="h-4 w-4 mr-2" />
                      {wallet.isConnected ? (
                        <span className="truncate">
                          Connected: {formatAddress(wallet.address!)}
                        </span>
                      ) : (
                        "Connect MetaMask Wallet"
                      )}
                    </Button>
                  </>
                )}

                {/* Toggle Auth Mode */}
                <div className="text-center pt-4">
                  <p className="text-sm text-slate-600">
                    {isLogin
                      ? "Don't have an account? "
                      : "Already have an account? "}
                    <Link
                      to={isLogin ? "/auth/register" : "/auth/login"}
                      className="text-blue-600 hover:text-blue-700 font-medium underline"
                    >
                      {isLogin ? "Sign up" : "Sign in"}
                    </Link>
                  </p>
                </div>

                {/* Forgot Password - Login only */}
                {isLogin && (
                  <div className="text-center">
                    <button
                      type="button"
                      className="text-sm text-slate-500 hover:text-slate-700"
                      onClick={() => setError("Password reset feature coming soon!")}
                    >
                      Forgot your password?
                    </button>
                  </div>
                )}
              </form>
            </CardContent>
          </Card>

          {/* Security Notice */}
          <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg mt-6">
            <CardContent className="pt-6 text-center">
              <div className="flex items-center justify-center mb-3">
                <Shield className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600 mr-2" />
                <div className="hidden sm:flex items-center space-x-2 text-slate-400">
                  <Smartphone className="h-4 w-4" />
                  <Monitor className="h-4 w-4" />
                </div>
              </div>
              <h3 className="font-medium text-slate-700 mb-2 text-sm sm:text-base">
                Blockchain Security
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Your identity data is protected by enterprise-grade blockchain
                encryption and stored across distributed networks for maximum
                security.
              </p>
              
              {/* MetaMask Installation Notice */}
              {!isMetaMaskInstalled && (
                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-center justify-center mb-2">
                    <Wallet className="h-4 w-4 text-yellow-600 mr-2" />
                    <span className="text-xs font-medium text-yellow-700">
                      Web3 Wallet Recommended
                    </span>
                  </div>
                  <p className="text-xs text-yellow-700 mb-2">
                    Install MetaMask to connect your Web3 wallet for enhanced security
                  </p>
                  <a
                    href="https://metamask.io/download/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-xs text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Download MetaMask
                    <ExternalLink className="h-3 w-3 ml-1" />
                  </a>
                </div>
              )}

              {/* Connected Wallet Display */}
              {wallet.isConnected && (
                <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center justify-center">
                    <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                    <span className="text-xs font-medium text-green-700">
                      Wallet Connected
                    </span>
                  </div>
                  <p className="text-xs text-green-700 mt-1 font-mono">
                    {formatAddress(wallet.address!)}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Additional Help */}
          <div className="mt-6 text-center">
            <p className="text-xs text-slate-500">
              Need help? Contact our{" "}
              <button
                type="button"
                className="text-blue-600 hover:text-blue-700 underline"
                onClick={() => setSuccess("Support chat coming soon!")}
              >
                support team
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
