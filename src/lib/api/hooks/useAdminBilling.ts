/**
 * Admin Billing API Hooks
 * React hooks for admin billing management
 */

import { useState, useEffect, useCallback } from 'react';
import { useApiClient } from '../client';

// Types
export interface BillingStats {
  monthlyRevenue: number;
  activeSubscriptions: number;
  paymentSuccessRate: number;
  churnRate: number;
  revenueGrowth: number;
  subscriptionGrowth: number;
  paymentFailureRate: number;
  churnImprovement: number;
}

export interface SubscriptionAudit {
  id: string;
  organizationName: string;
  userEmail: string;
  tier: string;
  status: string;
  startDate: string;
  expiresAt: string | null;
  monthlyRevenue: number;
  totalRevenue: number;
  lastPayment?: string;
  usageStats: {
    emails: number;
    sms: number;
    whatsapp: number;
    leadPulseVisits: number;
  };
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  flags: string[];
}

export interface RevenueAnalytics {
  mrr: number;
  arr: number;
  churnRate: number;
  newSubscriptions: number;
  canceledSubscriptions: number;
  totalActiveSubscriptions: number;
  averageRevenuePerUser: number;
  tierDistribution: Record<string, number>;
  paymentFailures: number;
  upcomingRenewals: number;
}

export interface SubscriptionIssue {
  type: string;
  description: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
  organizationId: string;
  organizationName: string;
}

export interface Invoice {
  id: string;
  organizationId: string;
  organizationName: string;
  amount: number;
  currency: string;
  status: string;
  dueDate: string;
  paidDate: string | null;
  invoiceNumber: string;
}

export interface Payment {
  id: string;
  organizationId: string;
  organizationName: string;
  amount: number;
  currency: string;
  status: string;
  method: string;
  transactionId: string;
  processedAt: string | null;
  failureReason?: string;
}

export interface PaymentMethod {
  id: string;
  organizationId: string;
  organizationName: string;
  type: string;
  last4?: string | null;
  expMonth?: number | null;
  expYear?: number | null;
  brand?: string | null;
  isDefault: boolean;
  paystackAuthorizationCode?: string | null;
  createdAt: string;
  updatedAt: string;
  isExpired: boolean;
}

export interface SubscriptionVerification {
  subscriptionId: string;
  action: string;
  reason: string;
}

// Billing Stats Hook
export function useAdminBillingStats() {
  const apiClient = useApiClient();
  const [stats, setStats] = useState<BillingStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiClient.get<BillingStats>('/admin/billing/stats');
      setStats(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [apiClient]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return {
    stats,
    loading,
    error,
    fetchStats
  };
}

// Subscription Audits Hook
export function useAdminSubscriptionAudits() {
  const apiClient = useApiClient();
  const [audits, setAudits] = useState<SubscriptionAudit[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAudits = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiClient.get<SubscriptionAudit[]>('/admin/billing/subscriptions/audit');
      setAudits(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [apiClient]);

  useEffect(() => {
    fetchAudits();
  }, [fetchAudits]);

  return {
    audits,
    loading,
    error,
    fetchAudits
  };
}

// Revenue Analytics Hook
export function useAdminRevenueAnalytics() {
  const apiClient = useApiClient();
  const [analytics, setAnalytics] = useState<RevenueAnalytics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiClient.get<RevenueAnalytics>('/admin/billing/subscriptions/analytics');
      setAnalytics(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [apiClient]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  return {
    analytics,
    loading,
    error,
    fetchAnalytics
  };
}

// Subscription Issues Hook
export function useAdminSubscriptionIssues() {
  const apiClient = useApiClient();
  const [issues, setIssues] = useState<SubscriptionIssue[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchIssues = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiClient.get<SubscriptionIssue[]>('/admin/billing/subscriptions/verify');
      setIssues(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [apiClient]);

  useEffect(() => {
    fetchIssues();
  }, [fetchIssues]);

  const verifySubscription = useCallback(async (verification: SubscriptionVerification) => {
    try {
      await apiClient.post('/admin/billing/subscriptions/verify', verification);
      await fetchIssues(); // Refresh issues
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to verify subscription');
      throw err;
    }
  }, [apiClient, fetchIssues]);

  return {
    issues,
    loading,
    error,
    fetchIssues,
    verifySubscription
  };
}

// Invoices Hook
export function useAdminInvoices() {
  const apiClient = useApiClient();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchInvoices = useCallback(async (filters: { status?: string; organizationId?: string } = {}) => {
    setLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams();
      if (filters.status) params.append('status', filters.status);
      if (filters.organizationId) params.append('organizationId', filters.organizationId);
      
      const response = await apiClient.get<Invoice[]>(`/admin/billing/invoices?${params}`);
      setInvoices(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [apiClient]);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  return {
    invoices,
    loading,
    error,
    fetchInvoices
  };
}

// Payments Hook
export function useAdminPayments() {
  const apiClient = useApiClient();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPayments = useCallback(async (filters: { status?: string; organizationId?: string } = {}) => {
    setLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams();
      if (filters.status) params.append('status', filters.status);
      if (filters.organizationId) params.append('organizationId', filters.organizationId);
      
      const response = await apiClient.get<Payment[]>(`/admin/billing/payments?${params}`);
      setPayments(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [apiClient]);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  return {
    payments,
    loading,
    error,
    fetchPayments
  };
}

// Payment Methods Hook
export function useAdminPaymentMethods() {
  const apiClient = useApiClient();
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPaymentMethods = useCallback(async (organizationId?: string) => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (organizationId) params.append('organizationId', organizationId);

      const response = await apiClient.get<PaymentMethod[]>(`/admin/billing/payment-methods?${params}`);
      setPaymentMethods(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [apiClient]);

  useEffect(() => {
    fetchPaymentMethods();
  }, [fetchPaymentMethods]);

  return {
    paymentMethods,
    loading,
    error,
    fetchPaymentMethods
  };
}

// Combined Admin Billing Dashboard Hook
export function useAdminBillingDashboard() {
  const stats = useAdminBillingStats();
  const audits = useAdminSubscriptionAudits();
  const analytics = useAdminRevenueAnalytics();
  const issues = useAdminSubscriptionIssues();
  const invoices = useAdminInvoices();
  const payments = useAdminPayments();
  const paymentMethods = useAdminPaymentMethods();

  const refreshAll = useCallback(() => {
    stats.fetchStats();
    audits.fetchAudits();
    analytics.fetchAnalytics();
    issues.fetchIssues();
    invoices.fetchInvoices();
    payments.fetchPayments();
    paymentMethods.fetchPaymentMethods();
  }, [stats, audits, analytics, issues, invoices, payments, paymentMethods]);

  return {
    // Stats
    stats: stats.stats,
    statsLoading: stats.loading,
    statsError: stats.error,

    // Audits
    audits: audits.audits,
    auditsLoading: audits.loading,
    auditsError: audits.error,

    // Analytics
    analytics: analytics.analytics,
    analyticsLoading: analytics.loading,
    analyticsError: analytics.error,

    // Issues
    issues: issues.issues,
    issuesLoading: issues.loading,
    issuesError: issues.error,

    // Invoices
    invoices: invoices.invoices,
    invoicesLoading: invoices.loading,
    invoicesError: invoices.error,

    // Payments
    payments: payments.payments,
    paymentsLoading: payments.loading,
    paymentsError: payments.error,

    // Payment Methods
    paymentMethods: paymentMethods.paymentMethods,
    paymentMethodsLoading: paymentMethods.loading,
    paymentMethodsError: paymentMethods.error,

    // Actions
    refreshAll,
    verifySubscription: issues.verifySubscription,
    fetchInvoices: invoices.fetchInvoices,
    fetchPayments: payments.fetchPayments,
    fetchPaymentMethods: paymentMethods.fetchPaymentMethods,
  };
}

// ============================================================================
// USAGE BREAKDOWN (Task 23)
// ============================================================================

/**
 * Usage Breakdown Interfaces
 * Matches backend response from BillingService.getUsageBreakdown()
 */
export interface OrganizationUsageBreakdown {
  organizationId: string;
  organizationName: string;
  plan: string;
  memberSince: string;

  apiCalls: {
    total: number;
    period: string;
  };

  storage: {
    totalKB: number;
    totalMB: string;
    breakdown: {
      contacts: {
        count: number;
        storageKB: number;
      };
      campaigns: {
        count: number;
        storageKB: number;
      };
      lists: {
        count: number;
        storageKB: number;
      };
      workflows: {
        count: number;
        storageKB: number;
      };
    };
  };

  features: {
    active: string[];
    breakdown: {
      email: {
        enabled: boolean;
        campaignCount: number;
        messagesSent: number;
      };
      sms: {
        enabled: boolean;
        campaignCount: number;
        messagesSent: number;
      };
      whatsapp: {
        enabled: boolean;
        campaignCount: number;
        messagesSent: number;
      };
      workflows: {
        enabled: boolean;
        count: number;
      };
      ai: {
        enabled: boolean;
        predictionsCount: number;
        actionPlansCount: number;
      };
      cro: {
        enabled: boolean;
        recommendationsCount: number;
      };
    };
  };

  messagingCosts: {
    total: number;
    currency: string;
    period: string;
  };
}

export interface UsageBreakdownSummary {
  totalOrganizations: number;
  totalAPICallsAllOrgs: number;
  totalStorageMB: string;
  totalMessagingCost: number;
}

export interface UsageBreakdownResponse {
  organizations: OrganizationUsageBreakdown[];
  summary: UsageBreakdownSummary;
}

/**
 * Hook for fetching usage breakdown for all organizations
 */
export function useUsageBreakdown(filters?: {
  organizationId?: string;
  startDate?: string;
  endDate?: string;
}) {
  const apiClient = useApiClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<UsageBreakdownResponse | null>(null);

  const fetchUsageBreakdown = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (filters?.organizationId) params.append('organizationId', filters.organizationId);
      if (filters?.startDate) params.append('startDate', filters.startDate);
      if (filters?.endDate) params.append('endDate', filters.endDate);

      const queryString = params.toString();
      const url = `/admin/billing/usage-breakdown${queryString ? `?${queryString}` : ''}`;

      const response = await apiClient.get<UsageBreakdownResponse>(url);
      setData(response);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch usage breakdown';
      setError(errorMessage);
      console.error('Error fetching usage breakdown:', err);
    } finally {
      setLoading(false);
    }
  }, [apiClient, filters?.organizationId, filters?.startDate, filters?.endDate]);

  useEffect(() => {
    fetchUsageBreakdown();
  }, [fetchUsageBreakdown]);

  return {
    data,
    loading,
    error,
    refresh: fetchUsageBreakdown,
  };
}

/**
 * Hook for fetching usage breakdown for a specific organization
 */
export function useOrganizationUsageBreakdown(
  organizationId: string,
  filters?: {
    startDate?: string;
    endDate?: string;
  }
) {
  const apiClient = useApiClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<OrganizationUsageBreakdown | null>(null);

  const fetchUsageBreakdown = useCallback(async () => {
    if (!organizationId) {
      setError('Organization ID is required');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (filters?.startDate) params.append('startDate', filters.startDate);
      if (filters?.endDate) params.append('endDate', filters.endDate);

      const queryString = params.toString();
      const url = `/admin/billing/usage-breakdown/${organizationId}${queryString ? `?${queryString}` : ''}`;

      const response = await apiClient.get<OrganizationUsageBreakdown>(url);
      setData(response);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch organization usage breakdown';
      setError(errorMessage);
      console.error('Error fetching organization usage breakdown:', err);
    } finally {
      setLoading(false);
    }
  }, [apiClient, organizationId, filters?.startDate, filters?.endDate]);

  useEffect(() => {
    fetchUsageBreakdown();
  }, [fetchUsageBreakdown]);

  return {
    data,
    loading,
    error,
    refresh: fetchUsageBreakdown,
  };
}

// ============================================================================
// COST ALLOCATION (Task 24)
// ============================================================================

/**
 * Cost Allocation Interfaces
 * Matches backend response from BillingService.getCostAllocationReports()
 */
export interface OrganizationCostAllocation {
  organizationId: string;
  organizationName: string;
  plan: string;

  financial: {
    totalRevenue: number;
    totalCosts: number;
    profit: number;
    profitMargin: number;
    roi: number;
    customerLifetimeValue: number;
    currency: string;
  };

  costBreakdown: {
    messagingCosts: number;
    infrastructureCosts: number;
    totalCosts: number;
    costPerTransaction: number;
  };

  revenueDetails: {
    totalRevenue: number;
    transactionCount: number;
    averageTransactionValue: number;
  };

  monthlyAverages: {
    revenue: number;
    costs: number;
    profit: number;
  };

  periodBreakdown: Array<{
    period: string;
    revenue: number;
    costs: number;
    profit: number;
    profitMargin: number;
    transactions: number;
  }>;
}

export interface CostAllocationSummary {
  totalOrganizations: number;
  totalRevenue: number;
  totalCosts: number;
  totalProfit: number;
  overallProfitMargin: number;
  mostProfitable: Array<{
    id: string;
    name: string;
    profit: number;
  }>;
  leastProfitable: Array<{
    id: string;
    name: string;
    profit: number;
  }>;
}

export interface CostAllocationResponse {
  organizations: OrganizationCostAllocation[];
  summary: CostAllocationSummary;
}

/**
 * Hook for fetching cost allocation reports for all organizations
 */
export function useCostAllocationReports(filters?: {
  organizationId?: string;
  startDate?: string;
  endDate?: string;
  groupBy?: 'month' | 'quarter' | 'year';
}) {
  const apiClient = useApiClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<CostAllocationResponse | null>(null);

  const fetchCostAllocationReports = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (filters?.organizationId) params.append('organizationId', filters.organizationId);
      if (filters?.startDate) params.append('startDate', filters.startDate);
      if (filters?.endDate) params.append('endDate', filters.endDate);
      if (filters?.groupBy) params.append('groupBy', filters.groupBy);

      const queryString = params.toString();
      const url = `/admin/billing/cost-allocation${queryString ? `?${queryString}` : ''}`;

      const response = await apiClient.get<CostAllocationResponse>(url);
      setData(response);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch cost allocation reports';
      setError(errorMessage);
      console.error('Error fetching cost allocation reports:', err);
    } finally {
      setLoading(false);
    }
  }, [apiClient, filters?.organizationId, filters?.startDate, filters?.endDate, filters?.groupBy]);

  useEffect(() => {
    fetchCostAllocationReports();
  }, [fetchCostAllocationReports]);

  return {
    data,
    loading,
    error,
    refresh: fetchCostAllocationReports,
  };
}

/**
 * Hook for fetching cost allocation report for a specific organization
 */
export function useOrganizationCostAllocation(
  organizationId: string,
  filters?: {
    startDate?: string;
    endDate?: string;
  }
) {
  const apiClient = useApiClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<OrganizationCostAllocation | null>(null);

  const fetchCostAllocation = useCallback(async () => {
    if (!organizationId) {
      setError('Organization ID is required');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (filters?.startDate) params.append('startDate', filters.startDate);
      if (filters?.endDate) params.append('endDate', filters.endDate);

      const queryString = params.toString();
      const url = `/admin/billing/cost-allocation/${organizationId}${queryString ? `?${queryString}` : ''}`;

      const response = await apiClient.get<OrganizationCostAllocation>(url);
      setData(response);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch organization cost allocation';
      setError(errorMessage);
      console.error('Error fetching organization cost allocation:', err);
    } finally {
      setLoading(false);
    }
  }, [apiClient, organizationId, filters?.startDate, filters?.endDate]);

  useEffect(() => {
    fetchCostAllocation();
  }, [fetchCostAllocation]);

  return {
    data,
    loading,
    error,
    refresh: fetchCostAllocation,
  };
}
