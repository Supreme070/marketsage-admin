'use client';

import { AlertCircle, Loader2, RotateCw } from 'lucide-react';
import { useIsRetrying } from '@/contexts/RetryContext';

/**
 * Retry Indicator Component
 * =========================
 * Visual indicator showing active retry attempts.
 * Displays a loading spinner with retry count when requests are being retried.
 *
 * Usage:
 * - Add to any page/component to show retry status
 * - Optionally pass requestId to track specific request
 */

interface RetryIndicatorProps {
  requestId?: string;
  className?: string;
  showDetails?: boolean;
}

export function RetryIndicator({
  requestId,
  className = '',
  showDetails = true,
}: RetryIndicatorProps) {
  const { isRetrying, retryCount, attempts } = useIsRetrying(requestId);

  if (!isRetrying) {
    return null;
  }

  return (
    <div
      className={`fixed bottom-4 right-4 z-50 bg-gray-800/95 backdrop-blur-sm border border-yellow-500/30 rounded-lg shadow-2xl shadow-yellow-500/20 p-4 min-w-[300px] ${className}`}
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-3">
        <Loader2 className="h-5 w-5 text-yellow-400 animate-spin" />
        <div className="flex-1">
          <p className="text-sm font-semibold text-white">
            Retrying Requests...
          </p>
          <p className="text-xs text-gray-400">
            {retryCount} {retryCount === 1 ? 'request' : 'requests'} retrying
          </p>
        </div>
        <RotateCw className="h-4 w-4 text-yellow-400" />
      </div>

      {/* Details */}
      {showDetails && attempts && attempts.length > 0 && (
        <div className="space-y-2 mt-3 pt-3 border-t border-gray-700">
          {attempts.slice(0, 3).map((attempt) => (
            <div key={attempt.id} className="flex items-start gap-2">
              <AlertCircle className="h-3 w-3 text-yellow-400 mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-300 truncate">
                  {attempt.endpoint}
                </p>
                <p className="text-xs text-gray-500">
                  Attempt {attempt.attempt} of {attempt.maxAttempts}
                </p>
              </div>
            </div>
          ))}
          {attempts.length > 3 && (
            <p className="text-xs text-gray-500 text-center pt-1">
              +{attempts.length - 3} more
            </p>
          )}
        </div>
      )}

      {/* Progress bar */}
      <div className="mt-3 h-1 bg-gray-700 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full animate-pulse"
          style={{ width: '100%' }}
        />
      </div>
    </div>
  );
}

/**
 * Inline Retry Indicator
 * Small inline indicator for use within components
 */
interface InlineRetryIndicatorProps {
  requestId?: string;
  className?: string;
}

export function InlineRetryIndicator({
  requestId,
  className = '',
}: InlineRetryIndicatorProps) {
  const { isRetrying, attempt } = useIsRetrying(requestId);

  if (!isRetrying) {
    return null;
  }

  return (
    <div className={`inline-flex items-center gap-2 text-sm ${className}`}>
      <Loader2 className="h-4 w-4 text-yellow-400 animate-spin" />
      <span className="text-yellow-400">
        {attempt
          ? `Retrying (${attempt.attempt}/${attempt.maxAttempts})...`
          : 'Retrying...'}
      </span>
    </div>
  );
}
