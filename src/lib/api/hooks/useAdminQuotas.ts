/**
 * Admin Quota Management Hooks
 * React hooks for managing organization usage quotas
 */

import { useState, useEffect, useCallback } from 'react';
import { useApiClient } from '../client';

// Types
export interface QuotaStatus {
  current: number;
  limit: number;
  percentage: number;
  remaining: number;
  isExceeded: boolean;
  isNearLimit: boolean;
}

export interface OrganizationQuotaStatus {
  organizationId: string;
  isBlocked: boolean;
  blockedAt?: string;
  blockedReason?: string;
  period: {
    start: string;
    end: string;
  };
  quotas: Record<string, QuotaStatus>;
  hasCustomQuotas: boolean;
  customQuotas: Record<string, number>;
}

export interface BlockStatus {
  isBlocked: boolean;
  reason?: string;
  blockedAt?: string;
}

export interface UsageData {
  organizationId: string;
  period: {
    start: string;
    end: string;
  };
  usage: Record<string, number>;
}

export interface UsageStatistics {
  organizationId: string;
  statistics: Array<{
    month: string;
    periodStart: string;
    periodEnd: string;
    usage: Record<string, number>;
  }>;
}

export interface OverageCharges {
  organizationId: string;
  period: {
    start: string;
    end: string;
  };
  overages: Record<string, {
    usage: number;
    limit: number;
    overage: number;
    rate: number;
    charge: number;
  }>;
  totalOverageCharge: number;
  currency: string;
}

// Get Quota Status Hook
export function useQuotaStatus(organizationId: string) {
  const apiClient = useApiClient();
  const [quotaStatus, setQuotaStatus] = useState<OrganizationQuotaStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchQuotaStatus = useCallback(async () => {
    if (!organizationId) return;

    setLoading(true);
    setError(null);

    try {
      const response = await apiClient.get<OrganizationQuotaStatus>(
        `/admin/quotas/${organizationId}/status`
      );
      setQuotaStatus(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch quota status');
    } finally {
      setLoading(false);
    }
  }, [apiClient, organizationId]);

  useEffect(() => {
    fetchQuotaStatus();
  }, [fetchQuotaStatus]);

  return {
    quotaStatus,
    loading,
    error,
    refetch: fetchQuotaStatus,
  };
}

// Check if Blocked Hook
export function useBlockStatus(organizationId: string) {
  const apiClient = useApiClient();
  const [blockStatus, setBlockStatus] = useState<BlockStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkBlockStatus = useCallback(async () => {
    if (!organizationId) return;

    setLoading(true);
    setError(null);

    try {
      const response = await apiClient.get<BlockStatus>(
        `/admin/quotas/${organizationId}/blocked`
      );
      setBlockStatus(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to check block status');
    } finally {
      setLoading(false);
    }
  }, [apiClient, organizationId]);

  useEffect(() => {
    checkBlockStatus();
  }, [checkBlockStatus]);

  return {
    blockStatus,
    loading,
    error,
    refetch: checkBlockStatus,
  };
}

// Unblock Organization Hook
export function useUnblockOrganization() {
  const apiClient = useApiClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const unblockOrganization = useCallback(async (
    organizationId: string,
    adminNote?: string
  ) => {
    setLoading(true);
    setError(null);

    try {
      await apiClient.post(`/admin/quotas/${organizationId}/unblock`, {
        adminNote,
      });
      return { success: true };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to unblock organization';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [apiClient]);

  return {
    unblockOrganization,
    loading,
    error,
  };
}

// Set Custom Quotas Hook
export function useSetCustomQuotas() {
  const apiClient = useApiClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const setCustomQuotas = useCallback(async (
    organizationId: string,
    quotas: Record<string, number>
  ) => {
    setLoading(true);
    setError(null);

    try {
      await apiClient.put(`/admin/quotas/${organizationId}/custom-quotas`, {
        quotas,
      });
      return { success: true };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to set custom quotas';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [apiClient]);

  return {
    setCustomQuotas,
    loading,
    error,
  };
}

// Get Usage Hook
export function useUsage(organizationId: string) {
  const apiClient = useApiClient();
  const [usage, setUsage] = useState<UsageData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUsage = useCallback(async () => {
    if (!organizationId) return;

    setLoading(true);
    setError(null);

    try {
      const response = await apiClient.get<UsageData>(
        `/admin/quotas/${organizationId}/usage`
      );
      setUsage(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch usage');
    } finally {
      setLoading(false);
    }
  }, [apiClient, organizationId]);

  useEffect(() => {
    fetchUsage();
  }, [fetchUsage]);

  return {
    usage,
    loading,
    error,
    refetch: fetchUsage,
  };
}

// Get Usage Statistics Hook
export function useUsageStatistics(organizationId: string) {
  const apiClient = useApiClient();
  const [statistics, setStatistics] = useState<UsageStatistics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStatistics = useCallback(async () => {
    if (!organizationId) return;

    setLoading(true);
    setError(null);

    try {
      const response = await apiClient.get<UsageStatistics>(
        `/admin/quotas/${organizationId}/statistics`
      );
      setStatistics(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch usage statistics');
    } finally {
      setLoading(false);
    }
  }, [apiClient, organizationId]);

  useEffect(() => {
    fetchStatistics();
  }, [fetchStatistics]);

  return {
    statistics,
    loading,
    error,
    refetch: fetchStatistics,
  };
}

// Get Overage Charges Hook
export function useOverageCharges(organizationId: string) {
  const apiClient = useApiClient();
  const [overages, setOverages] = useState<OverageCharges | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchOverages = useCallback(async () => {
    if (!organizationId) return;

    setLoading(true);
    setError(null);

    try {
      const response = await apiClient.get<OverageCharges>(
        `/admin/quotas/${organizationId}/overages`
      );
      setOverages(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch overage charges');
    } finally {
      setLoading(false);
    }
  }, [apiClient, organizationId]);

  useEffect(() => {
    fetchOverages();
  }, [fetchOverages]);

  return {
    overages,
    loading,
    error,
    refetch: fetchOverages,
  };
}

// Combined Quota Management Hook
export function useQuotaManagement(organizationId: string) {
  const quotaStatus = useQuotaStatus(organizationId);
  const blockStatus = useBlockStatus(organizationId);
  const usage = useUsage(organizationId);
  const statistics = useUsageStatistics(organizationId);
  const overages = useOverageCharges(organizationId);
  const { unblockOrganization, loading: unblocking } = useUnblockOrganization();
  const { setCustomQuotas, loading: settingQuotas } = useSetCustomQuotas();

  const refreshAll = useCallback(() => {
    quotaStatus.refetch();
    blockStatus.refetch();
    usage.refetch();
    statistics.refetch();
    overages.refetch();
  }, [quotaStatus, blockStatus, usage, statistics, overages]);

  return {
    // Quota Status
    quotaStatus: quotaStatus.quotaStatus,
    quotaStatusLoading: quotaStatus.loading,
    quotaStatusError: quotaStatus.error,

    // Block Status
    blockStatus: blockStatus.blockStatus,
    blockStatusLoading: blockStatus.loading,
    blockStatusError: blockStatus.error,

    // Usage
    usage: usage.usage,
    usageLoading: usage.loading,
    usageError: usage.error,

    // Statistics
    statistics: statistics.statistics,
    statisticsLoading: statistics.loading,
    statisticsError: statistics.error,

    // Overages
    overages: overages.overages,
    overagesLoading: overages.loading,
    overagesError: overages.error,

    // Actions
    unblockOrganization,
    unblocking,
    setCustomQuotas,
    settingQuotas,
    refreshAll,
  };
}
