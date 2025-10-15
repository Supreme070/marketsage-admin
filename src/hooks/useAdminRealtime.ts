import { useEffect, useState, useRef } from 'react';

interface SystemHealthData {
  cpu: number;
  memory: number;
  disk: number;
  network: {
    in: number;
    out: number;
  };
  services: Array<{
    name: string;
    status: 'operational' | 'degraded' | 'down';
    responseTime: number;
  }>;
  timestamp: Date;
}

interface UseSystemHealthRealtimeReturn {
  isConnected: boolean;
  systemData: SystemHealthData | null;
  error: Error | null;
}

/**
 * Real-time system health monitoring hook
 *
 * Connects to WebSocket for live system metrics and service health.
 * Returns connection status and latest system data.
 *
 * @returns Connection status, system data, and error state
 */
export function useSystemHealthRealtime(): UseSystemHealthRealtimeReturn {
  const [isConnected, setIsConnected] = useState(false);
  const [systemData, setSystemData] = useState<SystemHealthData | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);

  useEffect(() => {
    const connect = () => {
      try {
        // Get WebSocket URL from environment or construct from window location
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const host = process.env.NEXT_PUBLIC_WS_URL || window.location.host;
        const wsUrl = `${protocol}//${host}/admin/system/health/stream`;

        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
          console.log('[useSystemHealthRealtime] Connected to system health stream');
          setIsConnected(true);
          setError(null);
          reconnectAttemptsRef.current = 0;
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            setSystemData({
              cpu: data.cpu || 0,
              memory: data.memory || 0,
              disk: data.disk || 0,
              network: data.network || { in: 0, out: 0 },
              services: data.services || [],
              timestamp: new Date(data.timestamp || Date.now()),
            });
          } catch (err) {
            console.error('[useSystemHealthRealtime] Failed to parse message:', err);
          }
        };

        ws.onerror = (event) => {
          console.error('[useSystemHealthRealtime] WebSocket error:', event);
          setError(new Error('WebSocket connection error'));
        };

        ws.onclose = (event) => {
          console.log('[useSystemHealthRealtime] Disconnected:', event.code, event.reason);
          setIsConnected(false);
          wsRef.current = null;

          // Attempt reconnection with exponential backoff
          if (reconnectAttemptsRef.current < 5) {
            const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 30000);
            console.log(`[useSystemHealthRealtime] Reconnecting in ${delay}ms...`);

            reconnectTimeoutRef.current = setTimeout(() => {
              reconnectAttemptsRef.current += 1;
              connect();
            }, delay);
          }
        };
      } catch (err) {
        console.error('[useSystemHealthRealtime] Failed to create WebSocket:', err);
        setError(err as Error);
      }
    };

    connect();

    // Cleanup on unmount
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, []);

  return { isConnected, systemData, error };
}
