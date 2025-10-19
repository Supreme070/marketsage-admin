'use client';

import { useEffect } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import * as Sentry from '@sentry/nextjs';

/**
 * Global Error Boundary
 * =====================
 * Root-level error boundary that catches errors in the root layout.
 * This must include <html> and <body> tags as it replaces the root layout.
 *
 * @see https://nextjs.org/docs/app/api-reference/file-conventions/error#global-errorjs
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log critical error
    console.error('Global error boundary caught:', error);

    // Send to Sentry error reporting service with FATAL level
    Sentry.captureException(error, {
      level: 'fatal',
      tags: {
        errorBoundary: 'global-error',
        component: 'global-error.tsx',
        critical: 'true',
      },
      extra: {
        digest: error.digest,
        message: error.message,
        stack: error.stack,
        context: 'Root layout error - critical application failure',
      },
    });
  }, [error]);

  return (
    <html lang="en">
      <body>
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-purple-900 to-black p-4">
          <div className="max-w-2xl w-full bg-gray-800/50 backdrop-blur-sm border border-red-500/30 rounded-lg shadow-2xl p-8">
            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-red-500/20 rounded-full">
                <AlertTriangle className="h-10 w-10 text-red-400" />
              </div>
              <div>
                <h2 className="text-3xl font-bold text-white">Critical Error</h2>
                <p className="text-gray-400 mt-2">
                  The application encountered a critical error and needs to reload.
                </p>
              </div>
            </div>

            {/* Error Details (Development Only) */}
            {process.env.NODE_ENV === 'development' && (
              <div className="mb-6 p-4 bg-gray-900/50 rounded border border-red-500/30">
                <p className="text-red-400 font-mono text-sm mb-2 font-semibold">
                  Critical Error Details:
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
                className="flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors duration-200 shadow-lg shadow-red-500/30"
              >
                <RefreshCw className="h-5 w-5" />
                Reload Application
              </button>
              <button
                onClick={() => (window.location.href = '/')}
                className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white font-medium rounded-lg transition-colors duration-200"
              >
                Go to Home
              </button>
            </div>

            {/* Critical Support Info */}
            <div className="mt-6 pt-6 border-t border-red-700">
              <div className="bg-red-500/10 border border-red-500/30 rounded p-4">
                <p className="text-sm text-red-300 font-semibold mb-2">
                  ⚠️ This is a critical application error
                </p>
                <p className="text-sm text-gray-300">
                  Please contact technical support immediately at{' '}
                  <a
                    href="mailto:support@marketsage.africa"
                    className="text-red-400 hover:text-red-300 underline font-semibold"
                  >
                    support@marketsage.africa
                  </a>
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Inline styles for global error (no Tailwind available in critical failure) */}
        <style jsx>{`
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          }
        `}</style>
      </body>
    </html>
  );
}
