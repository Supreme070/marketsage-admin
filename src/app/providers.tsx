"use client";

import { SessionProvider } from "next-auth/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useState, useEffect } from "react";
import { Toaster } from "sonner";
import { RetryProvider, useRetry } from "@/contexts/RetryContext";
import { OfflineProvider } from "@/contexts/OfflineContext";
import { apiClient } from "@/lib/api/client";

/**
 * API Client Initializer
 * Connects API client retry callbacks to RetryContext
 */
function ApiClientInitializer({ children }: { children: React.ReactNode }) {
  const { onRetryStart, onRetrySuccess, onRetryFailure } = useRetry();

  useEffect(() => {
    // Connect API client callbacks to retry context
    apiClient.setRetryCallbacks(
      (attempt, maxAttempts, error, endpoint) => {
        const errorMessage = error instanceof Error ? error.message : 'Request failed';
        const requestId = `${endpoint}-${Date.now()}`;
        onRetryStart(requestId, endpoint, attempt, maxAttempts, errorMessage);
      },
      (endpoint) => {
        const requestId = `${endpoint}`;
        onRetrySuccess(requestId);
      },
      (endpoint, error) => {
        const errorMessage = error instanceof Error ? error.message : 'Request failed';
        const requestId = `${endpoint}`;
        onRetryFailure(requestId, errorMessage);
      }
    );
  }, [onRetryStart, onRetrySuccess, onRetryFailure]);

  return <>{children}</>;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 minute
            refetchOnWindowFocus: false,
            retry: 3, // React Query retry for queries
            retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
          },
          mutations: {
            retry: 2, // Mutations retry twice
            retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
          },
        },
      })
  );

  return (
    <SessionProvider>
      <QueryClientProvider client={queryClient}>
        <OfflineProvider>
          <RetryProvider>
            <ApiClientInitializer>
              {children}
              {/* Toast notifications for retry and offline indicators */}
              <Toaster
                position="bottom-right"
                expand={false}
                richColors
                closeButton
                duration={4000}
              />
              {/* React Query DevTools */}
              {process.env.NODE_ENV === 'development' && (
                <ReactQueryDevtools initialIsOpen={false} position="bottom-left" />
              )}
            </ApiClientInitializer>
          </RetryProvider>
        </OfflineProvider>
      </QueryClientProvider>
    </SessionProvider>
  );
}
