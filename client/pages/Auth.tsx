import { useState, useEffect } from "react";
import { Link, useParams, Navigate, useNavigate } from "react-router-dom";
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
} from "lucide-react";

export default function Auth() {
  const { mode } = useParams<{ mode: "login" | "register" }>();
  const navigate = useNavigate();
  const { login, register, isAuthenticated, isLoading: authLoading, error: authError, clearError, connectWallet } = useAuth();
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

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, navigate]);

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
            navigate('/');
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

        const success = await register(
          formData.name,
          formData.email,
          formData.password,
          formData.phone || undefined
        );

        if (success) {
          setSuccess("Registration successful! You can now access your dashboard.");
          setTimeout(() => {
            navigate('/');
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
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200/50">
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
                  {isLogin ? "Sign In" : "Create Account"}
                </p>
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
      <div className="container mx-auto px-6 py-20">
        <div className="max-w-md mx-auto">
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
            <CardHeader className="text-center">
              <CardTitle className="flex items-center justify-center gap-2 text-2xl">
                <User className="h-6 w-6 text-blue-600" />
                {isLogin ? "Welcome Back" : "Create Account"}
              </CardTitle>
              <p className="text-slate-600">
                {isLogin
                  ? "Sign in to access your KYC dashboard"
                  : "Join our secure blockchain identity platform"}
              </p>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                {!isLogin && (
                  <div>
                    <Label htmlFor="name">Full Name</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                      <Input
                        id="name"
                        type="text"
                        value={formData.name}
                        onChange={(e) =>
                          handleInputChange("name", e.target.value)
                        }
                        placeholder="Enter your full name"
                        className="pl-10"
                        required={!isLogin}
                      />
                    </div>
                  </div>
                )}

                {!isLogin && (
                  <div>
                    <Label htmlFor="phone">Phone Number (Optional)</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                      <Input
                        id="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={(e) =>
                          handleInputChange("phone", e.target.value)
                        }
                        placeholder="Enter your phone number"
                        className="pl-10"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <Label htmlFor="email">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) =>
                        handleInputChange("email", e.target.value)
                      }
                      placeholder="Enter your email"
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={formData.password}
                      onChange={(e) =>
                        handleInputChange("password", e.target.value)
                      }
                      placeholder="Enter your password"
                      className="pl-10 pr-10"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                {!isLogin && (
                  <div>
                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                      <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        value={formData.confirmPassword}
                        onChange={(e) =>
                          handleInputChange("confirmPassword", e.target.value)
                        }
                        placeholder="Confirm your password"
                        className="pl-10 pr-10"
                        required={!isLogin}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
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

                {error && (
                  <Alert className="border-red-200 bg-red-50">
                    <AlertDescription className="text-red-800">
                      {error}
                    </AlertDescription>
                  </Alert>
                )}

                {success && (
                  <Alert className="border-green-200 bg-green-50">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-800">
                      {success}
                    </AlertDescription>
                  </Alert>
                )}

                <Button
                  type="submit"
                  disabled={isLoading || authLoading}
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
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

                {/* Web3 Wallet Connection */}
                {isLogin && isMetaMaskInstalled && (
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-white px-2 text-muted-foreground">
                        Or connect with
                      </span>
                    </div>
                  </div>
                )}

                {isLogin && isMetaMaskInstalled && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleConnectWallet}
                    disabled={isLoading || authLoading}
                    className="w-full"
                  >
                    <Wallet className="h-4 w-4 mr-2" />
                    {wallet.isConnected ? (
                      `Connected: ${formatAddress(wallet.address!)}`
                    ) : (
                      "Connect MetaMask Wallet"
                    )}
                  </Button>
                )}

                <div className="text-center pt-4">
                  <p className="text-sm text-slate-600">
                    {isLogin
                      ? "Don't have an account? "
                      : "Already have an account? "}
                    <Link
                      to={isLogin ? "/auth/register" : "/auth/login"}
                      className="text-blue-600 hover:text-blue-700 font-medium"
                    >
                      {isLogin ? "Sign up" : "Sign in"}
                    </Link>
                  </p>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Security Notice */}
          <Card className="bg-white/60 backdrop-blur-sm border-0 shadow-lg mt-6">
            <CardContent className="pt-6 text-center">
              <Shield className="h-8 w-8 text-blue-600 mx-auto mb-3" />
              <h3 className="font-medium text-slate-700 mb-2">
                Blockchain Security
              </h3>
              <p className="text-sm text-slate-600">
                Your identity data is protected by enterprise-grade blockchain
                encryption and stored across distributed networks for maximum
                security. Connect your Web3 wallet for additional verification.
              </p>
              {!isMetaMaskInstalled && (
                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-xs text-yellow-700">
                    📦 Install MetaMask to connect your Web3 wallet for enhanced security
                  </p>
                  <a
                    href="https://metamask.io/download/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-600 hover:text-blue-700 underline"
                  >
                    Download MetaMask
                  </a>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
