import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useWeb3 } from './useWeb3';
import { AuthUser } from '@shared/api';

interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (name: string, email: string, password: string, phone?: string) => Promise<boolean>;
  logout: () => Promise<void>;
  connectWallet: () => Promise<boolean>;
  refreshProfile: () => Promise<void>;
  generateAccessToken: (purpose: string, permissions: any, expiresInHours?: number) => Promise<string | null>;
  error: string | null;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { wallet, connectWallet: connectWeb3Wallet, signMessage } = useWeb3();

  const isAuthenticated = !!user;

  // API call helper
  const apiCall = async (endpoint: string, options: RequestInit = {}) => {
    const token = localStorage.getItem('authToken');
    const defaultHeaders = {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` })
    };

    const response = await fetch(`/api/auth${endpoint}`, {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers
      }
    });

    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.message || 'Request failed');
    }

    return data;
  };

  // Clear error
  const clearError = () => setError(null);

  // Load user profile
  const loadProfile = async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        setIsLoading(false);
        return;
      }

      const response = await apiCall('/profile');
      setUser({
        id: response.data.id,
        email: response.data.email,
        name: response.data.name || '',
        role: response.data.role,
        isVerified: response.data.isVerified,
        kycStatus: response.data.kycRecords?.[0]?.status
      });
    } catch (error) {
      console.error('Failed to load profile:', error);
      localStorage.removeItem('authToken');
    } finally {
      setIsLoading(false);
    }
  };

  // Login
  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await apiCall('/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });

      if (response.token) {
        localStorage.setItem('authToken', response.token);
        setUser({
          id: response.user.id,
          email: response.user.email,
          name: response.user.name,
          role: response.user.role,
          isVerified: response.user.isVerified,
          kycStatus: undefined // Will be loaded in profile
        });
        await loadProfile(); // Load full profile including KYC status
        return true;
      }

      return false;
    } catch (error: any) {
      setError(error.message);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Register
  const register = async (
    name: string, 
    email: string, 
    password: string, 
    phone?: string
  ): Promise<boolean> => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await apiCall('/register', {
        method: 'POST',
        body: JSON.stringify({ name, email, password, phone, role: 'USER' })
      });

      if (response.token) {
        localStorage.setItem('authToken', response.token);
        setUser({
          id: response.user.id,
          email: response.user.email,
          name: response.user.name,
          role: response.user.role,
          isVerified: response.user.isVerified,
          kycStatus: undefined
        });
        return true;
      }

      return false;
    } catch (error: any) {
      setError(error.message);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Logout
  const logout = async () => {
    try {
      await apiCall('/logout', { method: 'POST' });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('authToken');
      setUser(null);
      setError(null);
    }
  };

  // Connect wallet
  const connectWallet = async (): Promise<boolean> => {
    try {
      if (!user) {
        setError('Please login first before connecting a wallet');
        return false;
      }

      setIsLoading(true);
      setError(null);

      // Connect Web3 wallet
      const connected = await connectWeb3Wallet();
      if (!connected || !wallet.address) {
        setError('Failed to connect wallet');
        return false;
      }

      // Generate challenge message
      const challengeResponse = await apiCall('/wallet-challenge', {
        method: 'POST'
      });

      // Sign the challenge
      const signature = await signMessage(challengeResponse.challenge);
      if (!signature) {
        setError('Failed to sign wallet challenge');
        return false;
      }

      // Connect wallet to account
      await apiCall('/connect-wallet', {
        method: 'POST',
        body: JSON.stringify({
          walletAddress: wallet.address,
          signature,
          message: challengeResponse.challenge,
          provider: 'METAMASK'
        })
      });

      // Refresh profile to get updated wallet info
      await refreshProfile();
      return true;
    } catch (error: any) {
      setError(error.message);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Refresh profile
  const refreshProfile = async () => {
    try {
      if (!user) return;
      
      const response = await apiCall('/profile');
      setUser(current => current ? {
        ...current,
        isVerified: response.data.isVerified,
        kycStatus: response.data.kycRecords?.[0]?.status
      } : null);
    } catch (error) {
      console.error('Failed to refresh profile:', error);
    }
  };

  // Generate access token for organization sharing
  const generateAccessToken = async (
    purpose: string, 
    permissions: any, 
    expiresInHours: number = 24
  ): Promise<string | null> => {
    try {
      setError(null);
      
      const response = await apiCall('/generate-access-token', {
        method: 'POST',
        body: JSON.stringify({
          purpose,
          permissions,
          expiresInHours
        })
      });

      return response.token || null;
    } catch (error: any) {
      setError(error.message);
      return null;
    }
  };

  // Load user on mount
  useEffect(() => {
    loadProfile();
  }, []);

  const value: AuthContextType = {
    user,
    isAuthenticated,
    isLoading,
    login,
    register,
    logout,
    connectWallet,
    refreshProfile,
    generateAccessToken,
    error,
    clearError
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Higher-order component for protecting routes
export const withAuth = <P extends object>(
  WrappedComponent: React.ComponentType<P>
) => {
  return function AuthenticatedComponent(props: P) {
    const { isAuthenticated, isLoading } = useAuth();

    if (isLoading) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-slate-600">Loading...</p>
          </div>
        </div>
      );
    }

    if (!isAuthenticated) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-slate-800 mb-4">Authentication Required</h2>
            <p className="text-slate-600 mb-6">Please login to access this page.</p>
            <a 
              href="/auth/login" 
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Login
            </a>
          </div>
        </div>
      );
    }

    return <WrappedComponent {...props} />;
  };
};
