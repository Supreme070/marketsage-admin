'use client';

import { WifiOff, Wifi, RefreshCw, X } from 'lucide-react';
import { useOffline } from '@/contexts/OfflineContext';

/**
 * Offline Indicator Component
 * ===========================
 * Displays offline status banner and queued requests.
 * Shows at top of screen when user is offline.
 *
 * Features:
 * - Prominent offline banner
 * - Queued requests count
 * - Manual sync button
 * - Auto-hides when online
 */

export function OfflineIndicator() {
  const { isOffline, queue, syncQueue, isSyncing, clearQueue } = useOffline();

  if (!isOffline && queue.length === 0) {
    return null;
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-50">
      {/* Offline Banner */}
      {isOffline && (
        <div className="bg-red-500/90 backdrop-blur-sm border-b-2 border-red-600 px-6 py-3">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <WifiOff className="h-5 w-5 text-white animate-pulse" />
              <div>
                <p className="text-white font-semibold text-sm">
                  You are offline
                </p>
                <p className="text-red-100 text-xs">
                  {queue.length > 0
                    ? `${queue.length} ${queue.length === 1 ? 'request' : 'requests'} queued for sync`
                    : 'Requests will be queued until connection is restored'}
                </p>
              </div>
            </div>
            {queue.length > 0 && (
              <button
                onClick={clearQueue}
                className="text-white hover:text-red-100 transition-colors p-1"
                title="Clear queue"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Syncing Banner */}
      {!isOffline && isSyncing && queue.length > 0 && (
        <div className="bg-blue-500/90 backdrop-blur-sm border-b-2 border-blue-600 px-6 py-3">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <RefreshCw className="h-5 w-5 text-white animate-spin" />
              <div>
                <p className="text-white font-semibold text-sm">
                  Syncing queued requests...
                </p>
                <p className="text-blue-100 text-xs">
                  {queue.length} {queue.length === 1 ? 'request' : 'requests'} remaining
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Queue Available (Online but not syncing) */}
      {!isOffline && !isSyncing && queue.length > 0 && (
        <div className="bg-yellow-500/90 backdrop-blur-sm border-b-2 border-yellow-600 px-6 py-3">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Wifi className="h-5 w-5 text-white" />
              <div>
                <p className="text-white font-semibold text-sm">
                  Back online - {queue.length} queued {queue.length === 1 ? 'request' : 'requests'}
                </p>
                <p className="text-yellow-100 text-xs">
                  Click sync to process queued requests
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={syncQueue}
                disabled={isSyncing}
                className="flex items-center gap-2 px-4 py-2 bg-white text-yellow-700 rounded-lg font-medium hover:bg-yellow-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                <RefreshCw className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
                Sync Now
              </button>
              <button
                onClick={clearQueue}
                className="text-white hover:text-yellow-100 transition-colors p-2"
                title="Clear queue"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Inline Offline Indicator
 * Small indicator for use within components
 */
export function InlineOfflineIndicator() {
  const { isOffline, queue } = useOffline();

  if (!isOffline && queue.length === 0) {
    return null;
  }

  return (
    <div className="inline-flex items-center gap-2 px-3 py-1 bg-red-500/10 border border-red-500/30 rounded-full text-sm">
      {isOffline ? (
        <>
          <WifiOff className="h-3 w-3 text-red-500" />
          <span className="text-red-600 dark:text-red-400">Offline</span>
        </>
      ) : (
        <>
          <RefreshCw className="h-3 w-3 text-yellow-500 animate-spin" />
          <span className="text-yellow-600 dark:text-yellow-400">
            Syncing ({queue.length})
          </span>
        </>
      )}
    </div>
  );
}
