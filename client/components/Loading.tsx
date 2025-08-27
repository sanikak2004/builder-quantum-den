import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import {
  Loader2,
  Shield,
  Upload,
  Download,
  Database,
  Hash,
  Globe,
  FileText,
  Users,
  CheckCircle,
  Smartphone,
  Monitor,
} from 'lucide-react';

interface LoadingProps {
  variant?: 'default' | 'card' | 'overlay' | 'inline' | 'page' | 'minimal';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  text?: string;
  progress?: number;
  icon?: React.ReactNode;
  className?: string;
  showIcon?: boolean;
  animated?: boolean;
}

export function Loading({
  variant = 'default',
  size = 'md',
  text = 'Loading...',
  progress,
  icon,
  className = '',
  showIcon = true,
  animated = true,
}: LoadingProps) {
  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'h-4 w-4';
      case 'md':
        return 'h-6 w-6';
      case 'lg':
        return 'h-8 w-8';
      case 'xl':
        return 'h-12 w-12';
      default:
        return 'h-6 w-6';
    }
  };

  const getTextSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'text-sm';
      case 'md':
        return 'text-base';
      case 'lg':
        return 'text-lg';
      case 'xl':
        return 'text-xl';
      default:
        return 'text-base';
    }
  };

  const LoadingIcon = () => {
    if (icon) return icon;
    return (
      <Loader2
        className={`${getSizeClasses()} ${animated ? 'animate-spin' : ''} text-blue-600`}
      />
    );
  };

  // Minimal loading (just spinner)
  if (variant === 'minimal') {
    return (
      <div className={`flex items-center justify-center ${className}`}>
        <LoadingIcon />
      </div>
    );
  }

  // Inline loading (small, for buttons etc.)
  if (variant === 'inline') {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        {showIcon && <LoadingIcon />}
        <span className={`text-slate-600 ${getTextSizeClasses()}`}>{text}</span>
      </div>
    );
  }

  // Overlay loading (covers content)
  if (variant === 'overlay') {
    return (
      <div className={`fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 ${className}`}>
        <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl">
          <CardContent className="p-8 text-center">
            <div className="flex flex-col items-center space-y-4">
              {showIcon && <LoadingIcon />}
              <div>
                <p className={`font-medium text-slate-800 ${getTextSizeClasses()}`}>
                  {text}
                </p>
                {progress !== undefined && (
                  <div className="mt-4 w-64">
                    <Progress value={progress} className="h-2" />
                    <p className="text-xs text-slate-500 mt-1">{progress}% complete</p>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Page loading (full page)
  if (variant === 'page') {
    return (
      <div className={`min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center ${className}`}>
        <div className="text-center">
          <div className="flex items-center justify-center mb-6">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-4 rounded-xl">
              <Shield className="h-8 w-8 text-white" />
            </div>
          </div>
          <div className="flex flex-col items-center space-y-4">
            {showIcon && <LoadingIcon />}
            <div>
              <h2 className="text-xl font-semibold text-slate-800 mb-2">
                Authen Ledger
              </h2>
              <p className="text-slate-600">{text}</p>
              {progress !== undefined && (
                <div className="mt-4 w-64">
                  <Progress value={progress} className="h-2" />
                  <p className="text-xs text-slate-500 mt-1">{progress}% complete</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Card loading
  if (variant === 'card') {
    return (
      <Card className={`bg-white/80 backdrop-blur-sm border-0 shadow-lg ${className}`}>
        <CardContent className="p-6 text-center">
          <div className="flex flex-col items-center space-y-4">
            {showIcon && <LoadingIcon />}
            <div>
              <p className={`font-medium text-slate-800 ${getTextSizeClasses()}`}>
                {text}
              </p>
              {progress !== undefined && (
                <div className="mt-4">
                  <Progress value={progress} className="h-2" />
                  <p className="text-xs text-slate-500 mt-1">{progress}% complete</p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Default loading
  return (
    <div className={`flex flex-col items-center justify-center p-8 ${className}`}>
      {showIcon && <LoadingIcon />}
      <p className={`mt-4 text-slate-600 ${getTextSizeClasses()}`}>{text}</p>
      {progress !== undefined && (
        <div className="mt-4 w-64">
          <Progress value={progress} className="h-2" />
          <p className="text-xs text-slate-500 mt-1">{progress}% complete</p>
        </div>
      )}
    </div>
  );
}

// Specialized loading components for specific scenarios
export function UploadLoading({ progress, fileName }: { progress?: number; fileName?: string }) {
  return (
    <Loading
      variant="card"
      icon={<Upload className="h-6 w-6 animate-bounce text-blue-600" />}
      text={fileName ? `Uploading ${fileName}...` : 'Uploading files...'}
      progress={progress}
    />
  );
}

export function BlockchainLoading({ operation }: { operation?: string }) {
  return (
    <Loading
      variant="card"
      icon={<Hash className="h-6 w-6 animate-pulse text-purple-600" />}
      text={operation ? `${operation}...` : 'Processing blockchain transaction...'}
    />
  );
}

export function DatabaseLoading({ operation }: { operation?: string }) {
  return (
    <Loading
      variant="card"
      icon={<Database className="h-6 w-6 animate-pulse text-green-600" />}
      text={operation ? `${operation}...` : 'Updating database...'}
    />
  );
}

export function NetworkLoading() {
  return (
    <Loading
      variant="card"
      icon={<Globe className="h-6 w-6 animate-spin text-blue-600" />}
      text="Connecting to network..."
    />
  );
}

export function VerificationLoading() {
  return (
    <Loading
      variant="card"
      icon={<CheckCircle className="h-6 w-6 animate-pulse text-green-600" />}
      text="Verifying your documents..."
    />
  );
}

export function UserManagementLoading() {
  return (
    <Loading
      variant="card"
      icon={<Users className="h-6 w-6 animate-pulse text-blue-600" />}
      text="Loading user data..."
    />
  );
}

// Skeleton loading components
export function SkeletonCard({ className = '' }: { className?: string }) {
  return (
    <Card className={`bg-white/80 backdrop-blur-sm border-0 shadow-lg ${className}`}>
      <CardContent className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-slate-200 rounded w-3/4"></div>
          <div className="h-4 bg-slate-200 rounded w-1/2"></div>
          <div className="h-4 bg-slate-200 rounded w-5/6"></div>
        </div>
      </CardContent>
    </Card>
  );
}

export function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="animate-pulse flex items-center space-x-4 p-4 bg-slate-50 rounded-lg">
          <div className="h-4 w-4 bg-slate-200 rounded"></div>
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-slate-200 rounded w-3/4"></div>
            <div className="h-3 bg-slate-200 rounded w-1/2"></div>
          </div>
          <div className="h-8 w-20 bg-slate-200 rounded"></div>
        </div>
      ))}
    </div>
  );
}

export function SkeletonStats() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-6">
      {Array.from({ length: 5 }).map((_, index) => (
        <Card key={index} className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
          <CardContent className="p-3 sm:p-6">
            <div className="animate-pulse space-y-3">
              <div className="flex items-center justify-between">
                <div className="space-y-2 flex-1">
                  <div className="h-3 bg-slate-200 rounded w-3/4"></div>
                  <div className="h-6 bg-slate-200 rounded w-1/2"></div>
                </div>
                <div className="h-10 w-10 bg-slate-200 rounded-lg"></div>
              </div>
              <div className="h-3 bg-slate-200 rounded w-2/3"></div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// Mobile-specific loading
export function MobileLoading({ text = 'Loading...' }: { text?: string }) {
  return (
    <div className="flex flex-col items-center justify-center p-6 text-center">
      <div className="flex items-center space-x-2 mb-4">
        <Smartphone className="h-5 w-5 text-blue-600" />
        <Monitor className="h-5 w-5 text-slate-400" />
      </div>
      <Loader2 className="h-8 w-8 animate-spin text-blue-600 mb-4" />
      <p className="text-sm text-slate-600">{text}</p>
    </div>
  );
}

export default Loading;
