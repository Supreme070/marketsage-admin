import { useState, useCallback } from 'react';
import { apiClient } from '../client';

// ============================================================================
// TYPE DEFINITIONS - Match backend Prisma enums exactly
// ============================================================================

export type SystemAlertType =
  // Technical Alerts (for engineering)
  | 'PERFORMANCE'
  | 'ERROR'
  | 'SECURITY'
  | 'CAPACITY'
  | 'MAINTENANCE'
  | 'DEPLOYMENT'
  | 'BILLING'
  | 'INTEGRATION'
  | 'TEST'
  // Business Alerts (for admin portal)
  | 'PAYMENT_FAILURE_SPIKE'
  | 'CHURN_SPIKE'
  | 'LOW_ENGAGEMENT'
  | 'HIGH_SUPPORT_TICKETS'
  | 'API_USAGE_ANOMALY'
  | 'CAMPAIGN_FAILURE'
  | 'BILLING_ANOMALY'
  | 'CUSTOMER_AT_RISK'
  | 'REVENUE_DROP'
  | 'FEATURE_ADOPTION_LOW'
  | 'MODERATION_BACKLOG'
  | 'USER_REGISTRATION_SPIKE'
  | 'USAGE_LIMIT_APPROACHING';

export type AlertSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface SystemAlert {
  id: string;
  alertType: SystemAlertType;
  severity: AlertSeverity;
  title: string;
  description: string;
  source: string;
  metadata: Record<string, any>;
  triggered: boolean;
  resolved: boolean;
  resolvedBy: string | null;
  resolvedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  resolver?: {
    id: string;
    name: string;
    email: string;
  } | null;
}

export interface AlertFilters {
  alertType?: SystemAlertType;
  severity?: AlertSeverity;
  resolved?: boolean;
  startDate?: string;
  endDate?: string;
  limit?: number;
}

export interface AlertStats {
  totalAlerts: number;
  unresolvedAlerts: number;
  criticalAlerts: number;
  resolvedAlerts: number;
  averageResolutionTimeMinutes: number;
  alertsByType: Array<{
    type: SystemAlertType;
    count: number;
  }>;
  alertsBySeverity: Array<{
    severity: AlertSeverity;
    count: number;
  }>;
}

export interface BusinessAlertCheckResult {
  checksRun: number;
  alertsCreated: number;
  results: Array<{
    check: string;
    status: 'fulfilled' | 'rejected';
    alert: SystemAlert | null;
    error: any;
  }>;
}

// ============================================================================
// INDIVIDUAL HOOKS
// ============================================================================

/**
 * Fetch all alerts with optional filtering
 */
export function useAlerts() {
  const [alerts, setAlerts] = useState<SystemAlert[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAlerts = useCallback(async (filters?: AlertFilters) => {
    setLoading(true);
    setError(null);

    try {
      const queryParams = new URLSearchParams();
      if (filters?.alertType) queryParams.append('alertType', filters.alertType);
      if (filters?.severity) queryParams.append('severity', filters.severity);
      if (filters?.resolved !== undefined) queryParams.append('resolved', String(filters.resolved));
      if (filters?.startDate) queryParams.append('startDate', filters.startDate);
      if (filters?.endDate) queryParams.append('endDate', filters.endDate);
      if (filters?.limit) queryParams.append('limit', String(filters.limit));

      const url = `/admin/alerts${queryParams.toString() ? `?${queryParams}` : ''}`;
      const response = await apiClient.get<{ data: { alerts: SystemAlert[] } }>(url);

      setAlerts(response.data.alerts || []);
    } catch (err) {
      const error = err as Error;
      setError(error.message || 'Failed to fetch alerts');
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  return { alerts, loading, error, fetchAlerts, refetch: fetchAlerts };
}

/**
 * Fetch alert statistics
 */
export function useAlertStats() {
  const [stats, setStats] = useState<AlertStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async (filters?: { startDate?: string; endDate?: string }) => {
    setLoading(true);
    setError(null);

    try {
      const queryParams = new URLSearchParams();
      if (filters?.startDate) queryParams.append('startDate', filters.startDate);
      if (filters?.endDate) queryParams.append('endDate', filters.endDate);

      const url = `/admin/alerts/stats${queryParams.toString() ? `?${queryParams}` : ''}`;
      const response = await apiClient.get<{ data: AlertStats }>(url);

      setStats(response.data);
    } catch (err) {
      const error = err as Error;
      setError(error.message || 'Failed to fetch alert statistics');
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  return { stats, loading, error, fetchStats, refetch: fetchStats };
}

/**
 * Fetch single alert by ID
 */
export function useAlert(alertId: string) {
  const [alert, setAlert] = useState<SystemAlert | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAlert = useCallback(async () => {
    if (!alertId) return;

    setLoading(true);
    setError(null);

    try {
      const response = await apiClient.get<{ data: SystemAlert }>(`/admin/alerts/${alertId}`);
      setAlert(response.data);
    } catch (err) {
      const error = err as Error;
      setError(error.message || 'Failed to fetch alert');
      throw error;
    } finally {
      setLoading(false);
    }
  }, [alertId]);

  return { alert, loading, error, fetchAlert, refetch: fetchAlert };
}

/**
 * Resolve an alert
 */
export function useResolveAlert() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resolveAlert = useCallback(async (alertId: string, resolutionNotes?: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiClient.post<{ data: SystemAlert }>(
        `/admin/alerts/${alertId}/resolve`,
        { resolutionNotes }
      );

      return response.data;
    } catch (err) {
      const error = err as Error;
      setError(error.message || 'Failed to resolve alert');
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  return { resolveAlert, loading, error };
}

/**
 * Acknowledge an alert
 */
export function useAcknowledgeAlert() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const acknowledgeAlert = useCallback(async (alertId: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiClient.post<{ data: SystemAlert }>(
        `/admin/alerts/${alertId}/acknowledge`
      );

      return response.data;
    } catch (err) {
      const error = err as Error;
      setError(error.message || 'Failed to acknowledge alert');
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  return { acknowledgeAlert, loading, error };
}

/**
 * Manually trigger business alert checks
 */
export function useRunBusinessAlertChecks() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<BusinessAlertCheckResult | null>(null);

  const runChecks = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiClient.post<{ data: BusinessAlertCheckResult }>(
        '/admin/alerts/run-checks'
      );

      setResult(response.data);
      return response.data;
    } catch (err) {
      const error = err as Error;
      setError(error.message || 'Failed to run business alert checks');
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  return { runChecks, loading, error, result };
}

/**
 * Clean up old resolved alerts
 */
export function useCleanupOldAlerts() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cleanup = useCallback(async (daysOld: number = 90) => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiClient.delete<{ data: { deletedCount: number } }>(
        `/admin/alerts/cleanup?daysOld=${daysOld}`
      );

      return response.data;
    } catch (err) {
      const error = err as Error;
      setError(error.message || 'Failed to cleanup old alerts');
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  return { cleanup, loading, error };
}

// ============================================================================
// COMBINED DASHBOARD HOOK - All-in-one for alerts dashboard
// ============================================================================

export function useAdminAlertsDashboard(initialFilters?: AlertFilters) {
  const { alerts, loading: alertsLoading, error: alertsError, fetchAlerts } = useAlerts();
  const { stats, loading: statsLoading, error: statsError, fetchStats } = useAlertStats();
  const { resolveAlert, loading: resolveLoading, error: resolveError } = useResolveAlert();
  const { acknowledgeAlert, loading: ackLoading, error: ackError } = useAcknowledgeAlert();
  const { runChecks, loading: checksLoading, error: checksError, result: checksResult } = useRunBusinessAlertChecks();
  const { cleanup, loading: cleanupLoading, error: cleanupError } = useCleanupOldAlerts();

  const loading = alertsLoading || statsLoading || resolveLoading || ackLoading || checksLoading || cleanupLoading;
  const error = alertsError || statsError || resolveError || ackError || checksError || cleanupError;

  const refreshAll = useCallback(async (filters?: AlertFilters) => {
    await Promise.all([
      fetchAlerts(filters || initialFilters),
      fetchStats(),
    ]);
  }, [fetchAlerts, fetchStats, initialFilters]);

  return {
    // Data
    alerts,
    stats,
    checksResult,

    // Loading states
    loading,
    alertsLoading,
    statsLoading,
    resolveLoading,
    ackLoading,
    checksLoading,
    cleanupLoading,

    // Errors
    error,
    alertsError,
    statsError,
    resolveError,
    ackError,
    checksError,
    cleanupError,

    // Actions
    fetchAlerts,
    fetchStats,
    resolveAlert,
    acknowledgeAlert,
    runChecks,
    cleanup,
    refreshAll,
  };
}
