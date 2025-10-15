import { useEffect, useState, useRef } from 'react';

interface AuditEvent {
  type: string;
  data: any;
  timestamp: Date;
}

interface UseAuditStreamReturn {
  isConnected: boolean;
  lastEvent: AuditEvent | null;
  error: Error | null;
}

/**
 * Real-time audit log streaming hook
 *
 * Connects to WebSocket for live audit events.
 * Returns connection status and last received event.
 *
 * @param enabled - Whether to enable the stream
 * @returns Connection status, last event, and error state
 */
export function useAuditStream(enabled: boolean = true): UseAuditStreamReturn {
  const [isConnected, setIsConnected] = useState(false);
  const [lastEvent, setLastEvent] = useState<AuditEvent | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);

  useEffect(() => {
    if (!enabled) {
      // Clean up if disabled
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      setIsConnected(false);
      return;
    }

    const connect = () => {
      try {
        // Get WebSocket URL from environment or construct from window location
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const host = process.env.NEXT_PUBLIC_WS_URL || window.location.host;
        const wsUrl = `${protocol}//${host}/admin/audit/stream`;

        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
          console.log('[useAuditStream] Connected to audit stream');
          setIsConnected(true);
          setError(null);
          reconnectAttemptsRef.current = 0;
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            setLastEvent({
              type: data.type || 'audit_log',
              data: data,
              timestamp: new Date(data.timestamp || Date.now()),
            });
          } catch (err) {
            console.error('[useAuditStream] Failed to parse message:', err);
          }
        };

        ws.onerror = (event) => {
          console.error('[useAuditStream] WebSocket error:', event);
          setError(new Error('WebSocket connection error'));
        };

        ws.onclose = (event) => {
          console.log('[useAuditStream] Disconnected:', event.code, event.reason);
          setIsConnected(false);
          wsRef.current = null;

          // Attempt reconnection with exponential backoff
          if (enabled && reconnectAttemptsRef.current < 5) {
            const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 30000);
            console.log(`[useAuditStream] Reconnecting in ${delay}ms...`);

            reconnectTimeoutRef.current = setTimeout(() => {
              reconnectAttemptsRef.current += 1;
              connect();
            }, delay);
          }
        };
      } catch (err) {
        console.error('[useAuditStream] Failed to create WebSocket:', err);
        setError(err as Error);
      }
    };

    connect();

    // Cleanup on unmount or when enabled changes
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [enabled]);

  return { isConnected, lastEvent, error };
}
