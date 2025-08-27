import React, { Component, ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  AlertTriangle,
  RefreshCw,
  Home,
  Bug,
  FileText,
  Mail,
} from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
  errorId: string;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: '',
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
      errorId: Math.random().toString(36).substr(2, 9),
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({
      error,
      errorInfo,
    });

    // Call optional error handler
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Log error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('ErrorBoundary caught an error:', error);
      console.error('Error info:', errorInfo);
    }

    // In production, you might want to send this to an error reporting service
    if (process.env.NODE_ENV === 'production') {
      // Example: Send to error reporting service
      // errorReportingService.reportError(error, errorInfo);
    }
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: '',
    });
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center p-4">
          <div className="max-w-md w-full">
            <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl">
              <CardHeader className="text-center">
                <div className="bg-red-100 p-4 rounded-full w-fit mx-auto mb-4">
                  <AlertTriangle className="h-8 w-8 text-red-600" />
                </div>
                <CardTitle className="text-2xl text-slate-800">
                  Something went wrong
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <Alert className="border-red-200 bg-red-50">
                  <Bug className="h-4 w-4 text-red-600" />
                  <AlertTitle className="text-red-800">Application Error</AlertTitle>
                  <AlertDescription className="text-red-700">
                    The application encountered an unexpected error. This has been
                    automatically reported to our team.
                  </AlertDescription>
                </Alert>

                {/* Error details in development */}
                {process.env.NODE_ENV === 'development' && this.state.error && (
                  <Alert className="border-yellow-200 bg-yellow-50">
                    <FileText className="h-4 w-4 text-yellow-600" />
                    <AlertTitle className="text-yellow-800">
                      Error Details (Dev Mode)
                    </AlertTitle>
                    <AlertDescription className="text-yellow-700">
                      <details className="mt-2">
                        <summary className="cursor-pointer font-medium">
                          Error: {this.state.error.message}
                        </summary>
                        <pre className="mt-2 text-xs bg-yellow-100 p-2 rounded overflow-auto max-h-40">
                          {this.state.error.stack}
                        </pre>
                      </details>
                    </AlertDescription>
                  </Alert>
                )}

                <div className="space-y-3">
                  <p className="text-sm text-slate-600 text-center">
                    Error ID: <code className="bg-slate-100 px-2 py-1 rounded text-xs">
                      {this.state.errorId}
                    </code>
                  </p>

                  <div className="flex flex-col sm:flex-row gap-3">
                    <Button
                      onClick={this.handleRetry}
                      className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600"
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Try Again
                    </Button>
                    <Button
                      onClick={this.handleReload}
                      variant="outline"
                      className="flex-1"
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Reload Page
                    </Button>
                  </div>

                  <Button
                    onClick={() => window.location.href = '/'}
                    variant="outline"
                    className="w-full"
                  >
                    <Home className="h-4 w-4 mr-2" />
                    Go to Homepage
                  </Button>
                </div>

                <div className="text-center pt-4 border-t">
                  <p className="text-xs text-slate-500">
                    If this problem persists, please{' '}
                    <button
                      onClick={() => {
                        const subject = `Error Report - ${this.state.errorId}`;
                        const body = `Error ID: ${this.state.errorId}\nError: ${this.state.error?.message}\n\nPlease describe what you were doing when this error occurred:`;
                        window.location.href = `mailto:support@authenledger.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
                      }}
                      className="text-blue-600 hover:text-blue-700 underline"
                    >
                      contact support
                    </button>
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

// Higher-order component for easier usage
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorFallback?: ReactNode,
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
) {
  return function WrappedComponent(props: P) {
    return (
      <ErrorBoundary fallback={errorFallback} onError={onError}>
        <Component {...props} />
      </ErrorBoundary>
    );
  };
}
