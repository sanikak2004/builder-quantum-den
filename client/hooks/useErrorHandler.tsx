import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

export interface AppError {
  id: string;
  message: string;
  code?: string;
  details?: any;
  timestamp: Date;
  type: 'network' | 'validation' | 'auth' | 'server' | 'client' | 'unknown';
  severity: 'low' | 'medium' | 'high' | 'critical';
  userMessage?: string;
  technicalMessage?: string;
  retryable?: boolean;
  retryCount?: number;
  maxRetries?: number;
}

interface UseErrorHandlerReturn {
  errors: AppError[];
  addError: (error: AppError | Error | string) => void;
  removeError: (id: string) => void;
  clearErrors: () => void;
  handleApiError: (error: any, context?: string) => void;
  handleNetworkError: (error: any, context?: string) => void;
  handleValidationError: (error: any, context?: string) => void;
  handleAuthError: (error: any, context?: string) => void;
  retry: (errorId: string, retryFn: () => Promise<void>) => Promise<void>;
  isLoading: boolean;
  setLoading: (loading: boolean) => void;
}

export function useErrorHandler(): UseErrorHandlerReturn {
  const [errors, setErrors] = useState<AppError[]>([]);
  const [isLoading, setLoading] = useState(false);
  const { toast } = useToast();

  const generateErrorId = () => Math.random().toString(36).substr(2, 9);

  const createAppError = useCallback((
    error: Error | string,
    type: AppError['type'],
    severity: AppError['severity'],
    options: Partial<AppError> = {}
  ): AppError => {
    const message = typeof error === 'string' ? error : error.message;
    const stack = error instanceof Error ? error.stack : undefined;

    return {
      id: generateErrorId(),
      message,
      type,
      severity,
      timestamp: new Date(),
      retryable: false,
      retryCount: 0,
      maxRetries: 3,
      details: stack,
      ...options,
    };
  }, []);

  const addError = useCallback((error: AppError | Error | string) => {
    let appError: AppError;

    if (typeof error === 'string') {
      appError = createAppError(error, 'unknown', 'medium');
    } else if (error instanceof Error) {
      appError = createAppError(error, 'client', 'medium');
    } else {
      appError = error;
    }

    setErrors(prev => [...prev, appError]);

    // Show toast notification based on severity
    const userMessage = appError.userMessage || appError.message;
    
    switch (appError.severity) {
      case 'critical':
        toast({
          title: 'Critical Error',
          description: userMessage,
          variant: 'destructive',
        });
        break;
      case 'high':
        toast({
          title: 'Error',
          description: userMessage,
          variant: 'destructive',
        });
        break;
      case 'medium':
        toast({
          title: 'Warning',
          description: userMessage,
        });
        break;
      case 'low':
        // Don't show toast for low severity errors
        break;
    }

    // Auto-remove low severity errors after 5 seconds
    if (appError.severity === 'low') {
      setTimeout(() => {
        removeError(appError.id);
      }, 5000);
    }
  }, [createAppError, toast]);

  const removeError = useCallback((id: string) => {
    setErrors(prev => prev.filter(error => error.id !== id));
  }, []);

  const clearErrors = useCallback(() => {
    setErrors([]);
  }, []);

  const handleApiError = useCallback((error: any, context = 'API call') => {
    let appError: AppError;

    if (error.response) {
      // Server responded with error status
      const status = error.response.status;
      const data = error.response.data;
      
      let type: AppError['type'] = 'server';
      let severity: AppError['severity'] = 'medium';
      let userMessage = 'An error occurred while processing your request.';
      let retryable = false;

      switch (status) {
        case 400:
          type = 'validation';
          userMessage = data.message || 'Invalid request. Please check your input.';
          break;
        case 401:
          type = 'auth';
          severity = 'high';
          userMessage = 'You are not authorized. Please sign in again.';
          break;
        case 403:
          type = 'auth';
          severity = 'high';
          userMessage = 'You do not have permission to perform this action.';
          break;
        case 404:
          userMessage = 'The requested resource was not found.';
          break;
        case 429:
          userMessage = 'Too many requests. Please wait a moment and try again.';
          retryable = true;
          break;
        case 500:
        case 502:
        case 503:
        case 504:
          severity = 'high';
          userMessage = 'Server error. Please try again later.';
          retryable = true;
          break;
        default:
          userMessage = data.message || `Server error (${status})`;
      }

      appError = createAppError(
        error.message || `${context} failed`,
        type,
        severity,
        {
          code: status.toString(),
          userMessage,
          technicalMessage: data.message || error.message,
          retryable,
          details: { status, data, context }
        }
      );
    } else if (error.request) {
      // Network error
      appError = createAppError(
        'Network error',
        'network',
        'high',
        {
          userMessage: 'Unable to connect to the server. Please check your internet connection.',
          technicalMessage: `${context}: ${error.message}`,
          retryable: true,
          details: { context, originalError: error.message }
        }
      );
    } else {
      // Other error
      appError = createAppError(
        error.message || 'Unknown error',
        'unknown',
        'medium',
        {
          userMessage: 'An unexpected error occurred.',
          technicalMessage: `${context}: ${error.message}`,
          details: { context, originalError: error.message }
        }
      );
    }

    addError(appError);
  }, [createAppError, addError]);

  const handleNetworkError = useCallback((error: any, context = 'Network operation') => {
    const appError = createAppError(
      error.message || 'Network error',
      'network',
      'high',
      {
        userMessage: 'Unable to connect to the server. Please check your internet connection and try again.',
        technicalMessage: `${context}: ${error.message}`,
        retryable: true,
        details: { context, originalError: error.message }
      }
    );

    addError(appError);
  }, [createAppError, addError]);

  const handleValidationError = useCallback((error: any, context = 'Form validation') => {
    let message = 'Please check your input and try again.';
    
    if (typeof error === 'string') {
      message = error;
    } else if (error.message) {
      message = error.message;
    } else if (error.errors && Array.isArray(error.errors)) {
      message = error.errors.join(', ');
    }

    const appError = createAppError(
      message,
      'validation',
      'medium',
      {
        userMessage: message,
        technicalMessage: `${context}: ${JSON.stringify(error)}`,
        retryable: false,
        details: { context, originalError: error }
      }
    );

    addError(appError);
  }, [createAppError, addError]);

  const handleAuthError = useCallback((error: any, context = 'Authentication') => {
    const appError = createAppError(
      error.message || 'Authentication failed',
      'auth',
      'high',
      {
        userMessage: 'Please sign in again to continue.',
        technicalMessage: `${context}: ${error.message}`,
        retryable: false,
        details: { context, originalError: error.message }
      }
    );

    addError(appError);
  }, [createAppError, addError]);

  const retry = useCallback(async (errorId: string, retryFn: () => Promise<void>) => {
    const error = errors.find(e => e.id === errorId);
    if (!error || !error.retryable) {
      return;
    }

    if (error.retryCount && error.maxRetries && error.retryCount >= error.maxRetries) {
      const updatedError = {
        ...error,
        userMessage: 'Maximum retry attempts reached. Please try again later.',
        retryable: false,
      };
      setErrors(prev => prev.map(e => e.id === errorId ? updatedError : e));
      return;
    }

    setLoading(true);
    
    try {
      await retryFn();
      removeError(errorId);
      
      toast({
        title: 'Success',
        description: 'Operation completed successfully.',
      });
    } catch (retryError) {
      const updatedError = {
        ...error,
        retryCount: (error.retryCount || 0) + 1,
        timestamp: new Date(),
      };
      setErrors(prev => prev.map(e => e.id === errorId ? updatedError : e));
      
      toast({
        title: 'Retry Failed',
        description: 'The operation failed again. Please try again later.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [errors, removeError, toast]);

  return {
    errors,
    addError,
    removeError,
    clearErrors,
    handleApiError,
    handleNetworkError,
    handleValidationError,
    handleAuthError,
    retry,
    isLoading,
    setLoading,
  };
}

// Utility function to check if an error is retryable
export function isRetryableError(error: AppError): boolean {
  return error.retryable === true && 
         (error.retryCount || 0) < (error.maxRetries || 3);
}

// Utility function to get user-friendly error message
export function getUserFriendlyMessage(error: AppError): string {
  return error.userMessage || error.message || 'An unexpected error occurred.';
}

// Utility function to categorize errors
export function categorizeError(error: any): AppError['type'] {
  if (error.code === 'NETWORK_ERROR' || error.name === 'NetworkError') {
    return 'network';
  }
  
  if (error.status === 401 || error.status === 403) {
    return 'auth';
  }
  
  if (error.status >= 400 && error.status < 500) {
    return 'validation';
  }
  
  if (error.status >= 500) {
    return 'server';
  }
  
  return 'unknown';
}

export default useErrorHandler;
