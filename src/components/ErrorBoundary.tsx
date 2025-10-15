'use client';

import React, { Component, ReactNode } from 'react';
import * as Sentry from '@sentry/nextjs';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: (error: Error, reset: () => void) => ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  showDialog?: boolean; // Show Sentry user feedback dialog
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  eventId?: string; // Sentry event ID for user feedback
}

/**
 * ErrorBoundary Component
 * ======================
 * Catches JavaScript errors anywhere in the child component tree,
 * logs those errors, and displays a fallback UI.
 *
 * Features:
 * - Graceful error handling with styled fallback UI
 * - Error reset functionality
 * - Optional custom fallback rendering
 * - Error logging/reporting hook
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error details in development
    if (process.env.NODE_ENV === 'development') {
      console.error('ErrorBoundary caught an error:', error, errorInfo);
    }

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Send to Sentry with error context
    Sentry.withScope((scope) => {
      scope.setContext('errorBoundary', {
        componentStack: errorInfo.componentStack,
      });
      scope.setLevel('error');
      scope.setTag('error_boundary', 'admin_portal');

      const eventId = Sentry.captureException(error);
      this.setState({ eventId });
    });
  }

  reset = () => {
    this.setState({
      hasError: false,
      error: null,
    });
  };

  render() {
    if (this.state.hasError && this.state.error) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.reset);
      }

      // Default fallback UI
      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-purple-900 to-black p-4">
          <div className="max-w-2xl w-full bg-gray-800/50 backdrop-blur-sm border border-purple-500/30 rounded-lg shadow-2xl p-8">
            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-red-500/20 rounded-full">
                <AlertTriangle className="h-8 w-8 text-red-400" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Something went wrong</h1>
                <p className="text-gray-400 mt-1">
                  We encountered an unexpected error. Please try again.
                </p>
              </div>
            </div>

            {/* Error Details (Development Only) */}
            {process.env.NODE_ENV === 'development' && (
              <div className="mb-6 p-4 bg-gray-900/50 rounded border border-red-500/30">
                <p className="text-red-400 font-mono text-sm mb-2 font-semibold">
                  Error Details:
                </p>
                <p className="text-red-300 font-mono text-xs break-all">
                  {this.state.error.message}
                </p>
                {this.state.error.stack && (
                  <pre className="mt-2 text-gray-400 text-xs overflow-auto max-h-40">
                    {this.state.error.stack}
                  </pre>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-4 flex-wrap">
              <button
                onClick={this.reset}
                className="flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors duration-200 shadow-lg shadow-purple-500/30"
              >
                <RefreshCw className="h-5 w-5" />
                Try Again
              </button>
              <button
                onClick={() => window.location.href = '/admin'}
                className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white font-medium rounded-lg transition-colors duration-200"
              >
                Go to Dashboard
              </button>
              {this.props.showDialog && this.state.eventId && (
                <button
                  onClick={() => Sentry.showReportDialog({ eventId: this.state.eventId })}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors duration-200"
                >
                  Report Feedback
                </button>
              )}
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

    return this.props.children;
  }
}
