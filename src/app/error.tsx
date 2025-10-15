'use client';

import { useEffect } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

/**
 * App-level Error Boundary
 * ========================
 * Next.js App Router error boundary for handling errors in app routes.
 * This is a client component that catches errors during rendering.
 *
 * @see https://nextjs.org/docs/app/api-reference/file-conventions/error
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error to console in development
    console.error('App error boundary caught:', error);

    // In production, send to error reporting service
    if (process.env.NODE_ENV === 'production') {
      // TODO: Send to error reporting service
      // Example: Sentry.captureException(error);
    }
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-purple-900 to-black p-4">
      <div className="max-w-2xl w-full bg-gray-800/50 backdrop-blur-sm border border-purple-500/30 rounded-lg shadow-2xl p-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <div className="p-3 bg-red-500/20 rounded-full">
            <AlertTriangle className="h-8 w-8 text-red-400" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">Application Error</h2>
            <p className="text-gray-400 mt-1">
              We encountered an unexpected error. Please try reloading.
            </p>
          </div>
        </div>

        {/* Error Details (Development Only) */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mb-6 p-4 bg-gray-900/50 rounded border border-red-500/30">
            <p className="text-red-400 font-mono text-sm mb-2 font-semibold">
              Error Details:
            </p>
            <p className="text-red-300 font-mono text-xs break-all mb-2">
              {error.message}
            </p>
            {error.digest && (
              <p className="text-gray-400 font-mono text-xs">
                Error Digest: {error.digest}
              </p>
            )}
            {error.stack && (
              <pre className="mt-2 text-gray-400 text-xs overflow-auto max-h-40">
                {error.stack}
              </pre>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-4">
          <button
            onClick={reset}
            className="flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors duration-200 shadow-lg shadow-purple-500/30"
          >
            <RefreshCw className="h-5 w-5" />
            Try Again
          </button>
          <button
            onClick={() => (window.location.href = '/admin')}
            className="flex items-center gap-2 px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white font-medium rounded-lg transition-colors duration-200"
          >
            <Home className="h-5 w-5" />
            Go to Dashboard
          </button>
        </div>

        {/* Support Info */}
        <div className="mt-6 pt-6 border-t border-gray-700">
          <p className="text-sm text-gray-400">
            If this problem persists, please contact support at{' '}
            <a
              href="mailto:support@marketsage.africa"
              className="text-purple-400 hover:text-purple-300 underline"
            >
              support@marketsage.africa
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
