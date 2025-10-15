/**
 * Admin Metrics WebSocket Hook
 * Real-time metrics updates via WebSocket connection
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { ServiceHealth, InfrastructureMetric } from './useAdminSystem';
import { useSession } from 'next-auth/react';

// Types
export interface SystemStats {
  systemResources: {
    cpu: number;
    memory: number;
    disk: number;
    network: number;
  };
  uptime: {
    seconds: number;
    formatted: string;
  };
  performance: {
    throughput: number;
    errorRate: number;
    p95ResponseTime: number;
  };
  alerts: Array<{
    id: string;
    type: 'warning' | 'error' | 'info';
    message: string;
    timestamp: string;
    resolved: boolean;
  }>;
}

export interface MetricsUpdate {
  timestamp: string;
  stats: SystemStats;
  services: ServiceHealth[];
  infrastructure: InfrastructureMetric[];
}

export interface WebSocketStatus {
  connected: boolean;
  connecting: boolean;
  error: string | null;
  reconnecting: boolean;
  reconnectAttempt: number;
}

/**
 * Hook for real-time admin metrics via WebSocket
 * Updates every 2 seconds from backend
 */
export function useAdminMetricsWebSocket() {
  const { data: session } = useSession();
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [services, setServices] = useState<ServiceHealth[]>([]);
  const [infrastructure, setInfrastructure] = useState<InfrastructureMetric[]>([]);
  const [status, setStatus] = useState<WebSocketStatus>({
    connected: false,
    connecting: false,
    error: null,
    reconnecting: false,
    reconnectAttempt: 0,
  });

  const socketRef = useRef<Socket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * Initialize WebSocket connection
   */
  const connect = useCallback(() => {
    if (!session?.user) {
      return;
    }

    // Don't reconnect if already connected or connecting
    if (socketRef.current?.connected || status.connecting) {
      return;
    }

    setStatus(prev => ({ ...prev, connecting: true, error: null }));

    try {
      const backendUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api/v2', '') || 'http://localhost:3006';
      const token = (session as any).token || localStorage.getItem('admin-token');

      const socket = io(`${backendUrl}/admin-metrics`, {
        auth: { token },
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: 5,
      });

      // Connection established
      socket.on('connect', () => {
        console.log('✅ WebSocket connected for admin metrics');
        setStatus({
          connected: true,
          connecting: false,
          error: null,
          reconnecting: false,
          reconnectAttempt: 0,
        });
      });

      // Metrics update received
      socket.on('metrics-update', (data: MetricsUpdate) => {
        setStats(data.stats);
        setServices(data.services);
        setInfrastructure(data.infrastructure);
      });

      // Connection error
      socket.on('connect_error', (error) => {
        console.error('❌ WebSocket connection error:', error.message);
        setStatus(prev => ({
          ...prev,
          connected: false,
          connecting: false,
          error: error.message,
        }));
      });

      // Disconnection
      socket.on('disconnect', (reason) => {
        console.log('🔌 WebSocket disconnected:', reason);
        setStatus(prev => ({
          ...prev,
          connected: false,
          reconnecting: reason === 'io server disconnect' ? false : true,
        }));
      });

      // Reconnection attempt
      socket.io.on('reconnect_attempt', (attempt) => {
        console.log(`🔄 Reconnection attempt ${attempt}`);
        setStatus(prev => ({
          ...prev,
          reconnecting: true,
          reconnectAttempt: attempt,
        }));
      });

      // Reconnection successful
      socket.io.on('reconnect', (attemptNumber) => {
        console.log(`✅ Reconnected after ${attemptNumber} attempts`);
        setStatus({
          connected: true,
          connecting: false,
          error: null,
          reconnecting: false,
          reconnectAttempt: 0,
        });
      });

      // Reconnection failed
      socket.io.on('reconnect_failed', () => {
        console.error('❌ Reconnection failed after all attempts');
        setStatus(prev => ({
          ...prev,
          connected: false,
          connecting: false,
          reconnecting: false,
          error: 'Failed to reconnect after multiple attempts',
        }));
      });

      socketRef.current = socket;
    } catch (error: any) {
      console.error('❌ Failed to initialize WebSocket:', error);
      setStatus({
        connected: false,
        connecting: false,
        error: error.message || 'Failed to initialize WebSocket',
        reconnecting: false,
        reconnectAttempt: 0,
      });
    }
  }, [session, status.connecting]);

  /**
   * Disconnect WebSocket
   */
  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    setStatus({
      connected: false,
      connecting: false,
      error: null,
      reconnecting: false,
      reconnectAttempt: 0,
    });
  }, []);

  /**
   * Manually request metrics update
   */
  const requestUpdate = useCallback(() => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('request-metrics');
    }
  }, []);

  /**
   * Auto-connect on mount and when session changes
   */
  useEffect(() => {
    if (session?.user) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [session?.user]);

  return {
    stats,
    services,
    infrastructure,
    status,
    connect,
    disconnect,
    requestUpdate,
  };
}
