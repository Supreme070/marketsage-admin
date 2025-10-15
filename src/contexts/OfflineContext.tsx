'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { toast } from 'sonner';

/**
 * Offline Context
 * ===============
 * Detects and manages offline/online state.
 * Queues failed requests when offline and syncs when back online.
 *
 * Features:
 * - Automatic online/offline detection
 * - Request queueing for offline periods
 * - Auto-sync when connection restored
 * - Toast notifications for state changes
 */

export interface QueuedRequest {
  id: string;
  endpoint: string;
  method: string;
  data?: any;
  timestamp: number;
  retryCount: number;
}

interface OfflineContextValue {
  isOnline: boolean;
  isOffline: boolean;
  queue: QueuedRequest[];
  addToQueue: (request: Omit<QueuedRequest, 'id' | 'timestamp' | 'retryCount'>) => void;
  removeFromQueue: (id: string) => void;
  clearQueue: () => void;
  syncQueue: () => Promise<void>;
  isSyncing: boolean;
}

const OfflineContext = createContext<OfflineContextValue | undefined>(undefined);

export function OfflineProvider({ children }: { children: ReactNode }) {
  const [isOnline, setIsOnline] = useState(typeof window !== 'undefined' ? navigator.onLine : true);
  const [queue, setQueue] = useState<QueuedRequest[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [hasShownOfflineToast, setHasShownOfflineToast] = useState(false);

  // Handle online/offline events
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleOnline = () => {
      console.log('🌐 Network: Back online');
      setIsOnline(true);
      setHasShownOfflineToast(false);

      toast.success('Back online', {
        description: queue.length > 0
          ? `Syncing ${queue.length} queued ${queue.length === 1 ? 'request' : 'requests'}...`
          : 'Connection restored',
        duration: 3000,
      });

      // Auto-sync queued requests
      if (queue.length > 0) {
        syncQueue();
      }
    };

    const handleOffline = () => {
      console.log('📡 Network: Offline');
      setIsOnline(false);

      if (!hasShownOfflineToast) {
        toast.error('You are offline', {
          description: 'Requests will be queued and synced when connection is restored',
          duration: 5000,
        });
        setHasShownOfflineToast(true);
      }
    };

    // Set initial state
    setIsOnline(navigator.onLine);

    // Add event listeners
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Cleanup
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [queue.length, hasShownOfflineToast]);

  // Add request to queue
  const addToQueue = useCallback((request: Omit<QueuedRequest, 'id' | 'timestamp' | 'retryCount'>) => {
    const queuedRequest: QueuedRequest = {
      ...request,
      id: `${request.endpoint}-${Date.now()}-${Math.random()}`,
      timestamp: Date.now(),
      retryCount: 0,
    };

    setQueue(prev => [...prev, queuedRequest]);

    console.log('📋 Request queued:', queuedRequest);
    toast.info('Request queued', {
      description: `${request.method} ${request.endpoint}`,
      duration: 3000,
    });
  }, []);

  // Remove request from queue
  const removeFromQueue = useCallback((id: string) => {
    setQueue(prev => prev.filter(req => req.id !== id));
  }, []);

  // Clear all queued requests
  const clearQueue = useCallback(() => {
    setQueue([]);
    toast.success('Queue cleared', {
      duration: 2000,
    });
  }, []);

  // Sync queued requests
  const syncQueue = useCallback(async () => {
    if (queue.length === 0 || isSyncing || !isOnline) {
      return;
    }

    setIsSyncing(true);
    console.log(`🔄 Syncing ${queue.length} queued requests...`);

    const results = {
      success: 0,
      failed: 0,
    };

    // Process queue sequentially
    for (const request of queue) {
      try {
        // Import API client dynamically to avoid circular dependencies
        const { apiClient } = await import('@/lib/api/client');

        // Execute the queued request
        let response;
        switch (request.method.toUpperCase()) {
          case 'GET':
            response = await apiClient.get(request.endpoint);
            break;
          case 'POST':
            response = await apiClient.post(request.endpoint, request.data);
            break;
          case 'PUT':
            response = await apiClient.put(request.endpoint, request.data);
            break;
          case 'PATCH':
            response = await apiClient.patch(request.endpoint, request.data);
            break;
          case 'DELETE':
            response = await apiClient.delete(request.endpoint);
            break;
          default:
            throw new Error(`Unsupported method: ${request.method}`);
        }

        // Success - remove from queue
        removeFromQueue(request.id);
        results.success++;
        console.log(`✅ Synced: ${request.method} ${request.endpoint}`);
      } catch (error) {
        results.failed++;
        console.error(`❌ Failed to sync: ${request.method} ${request.endpoint}`, error);

        // Increment retry count
        setQueue(prev => prev.map(req =>
          req.id === request.id
            ? { ...req, retryCount: req.retryCount + 1 }
            : req
        ));

        // Remove from queue if exceeded max retries
        if (request.retryCount >= 3) {
          removeFromQueue(request.id);
          console.warn(`Max retries exceeded for: ${request.endpoint}`);
        }
      }
    }

    setIsSyncing(false);

    // Show results
    if (results.success > 0) {
      toast.success('Sync complete', {
        description: `${results.success} ${results.success === 1 ? 'request' : 'requests'} synced successfully`,
        duration: 3000,
      });
    }

    if (results.failed > 0) {
      toast.error('Some requests failed', {
        description: `${results.failed} ${results.failed === 1 ? 'request' : 'requests'} could not be synced`,
        duration: 5000,
      });
    }
  }, [queue, isSyncing, isOnline, removeFromQueue]);

  return (
    <OfflineContext.Provider
      value={{
        isOnline,
        isOffline: !isOnline,
        queue,
        addToQueue,
        removeFromQueue,
        clearQueue,
        syncQueue,
        isSyncing,
      }}
    >
      {children}
    </OfflineContext.Provider>
  );
}

export function useOffline() {
  const context = useContext(OfflineContext);
  if (!context) {
    throw new Error('useOffline must be used within an OfflineProvider');
  }
  return context;
}
