'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { toast } from 'sonner';

/**
 * Retry Context
 * =============
 * Tracks API retry attempts app-wide and provides retry state management.
 * Shows toast notifications for retry attempts with progress.
 */

export interface RetryAttempt {
  id: string;
  endpoint: string;
  attempt: number;
  maxAttempts: number;
  error: string;
  timestamp: number;
  toastId?: string | number;
}

interface RetryContextValue {
  activeRetries: Map<string, RetryAttempt>;
  onRetryStart: (id: string, endpoint: string, attempt: number, maxAttempts: number, error: string) => void;
  onRetrySuccess: (id: string) => void;
  onRetryFailure: (id: string, error: string) => void;
  getRetryAttempt: (id: string) => RetryAttempt | undefined;
  clearRetry: (id: string) => void;
}

const RetryContext = createContext<RetryContextValue | undefined>(undefined);

export function RetryProvider({ children }: { children: ReactNode }) {
  const [activeRetries, setActiveRetries] = useState<Map<string, RetryAttempt>>(new Map());

  const onRetryStart = useCallback((
    id: string,
    endpoint: string,
    attempt: number,
    maxAttempts: number,
    error: string
  ) => {
    setActiveRetries(prev => {
      const newRetries = new Map(prev);
      const existingRetry = newRetries.get(id);

      // Show toast notification for retry attempt
      const toastId = toast.loading(
        `Retrying request (${attempt}/${maxAttempts})`,
        {
          description: `Endpoint: ${endpoint}`,
          duration: 5000,
        }
      );

      newRetries.set(id, {
        id,
        endpoint,
        attempt,
        maxAttempts,
        error,
        timestamp: Date.now(),
        toastId: existingRetry?.toastId || toastId,
      });

      return newRetries;
    });
  }, []);

  const onRetrySuccess = useCallback((id: string) => {
    setActiveRetries(prev => {
      const newRetries = new Map(prev);
      const retry = newRetries.get(id);

      if (retry?.toastId) {
        // Dismiss loading toast
        toast.dismiss(retry.toastId);

        // Show success toast
        toast.success('Request succeeded after retry', {
          description: `Endpoint: ${retry.endpoint}`,
          duration: 3000,
        });
      }

      newRetries.delete(id);
      return newRetries;
    });
  }, []);

  const onRetryFailure = useCallback((id: string, error: string) => {
    setActiveRetries(prev => {
      const newRetries = new Map(prev);
      const retry = newRetries.get(id);

      if (retry?.toastId) {
        // Dismiss loading toast
        toast.dismiss(retry.toastId);

        // Show error toast
        toast.error('Request failed after all retries', {
          description: error,
          duration: 5000,
        });
      }

      newRetries.delete(id);
      return newRetries;
    });
  }, []);

  const getRetryAttempt = useCallback((id: string) => {
    return activeRetries.get(id);
  }, [activeRetries]);

  const clearRetry = useCallback((id: string) => {
    setActiveRetries(prev => {
      const newRetries = new Map(prev);
      const retry = newRetries.get(id);

      if (retry?.toastId) {
        toast.dismiss(retry.toastId);
      }

      newRetries.delete(id);
      return newRetries;
    });
  }, []);

  return (
    <RetryContext.Provider
      value={{
        activeRetries,
        onRetryStart,
        onRetrySuccess,
        onRetryFailure,
        getRetryAttempt,
        clearRetry,
      }}
    >
      {children}
    </RetryContext.Provider>
  );
}

export function useRetry() {
  const context = useContext(RetryContext);
  if (!context) {
    throw new Error('useRetry must be used within a RetryProvider');
  }
  return context;
}

// Utility hook for checking if a specific request is retrying
export function useIsRetrying(requestId?: string) {
  const { activeRetries } = useRetry();

  if (!requestId) {
    return {
      isRetrying: activeRetries.size > 0,
      retryCount: activeRetries.size,
      attempts: Array.from(activeRetries.values()),
    };
  }

  const attempt = activeRetries.get(requestId);
  return {
    isRetrying: !!attempt,
    attempt,
  };
}
