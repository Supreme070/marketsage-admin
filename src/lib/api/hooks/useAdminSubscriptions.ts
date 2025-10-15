/**
 * Admin Subscription Management Hooks
 * React hooks for managing organization subscriptions from admin portal
 */

import { useState, useEffect, useCallback } from 'react';
import { useApiClient } from '../client';

// Types
export interface SubscriptionPlan {
  id: string;
  name: string;
  description: string | null;
  price: number;
  currency: string;
  interval: string;
  features: string;
  isActive: boolean;
  paystackPlanId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface OrganizationSubscription {
  id: string;
  organizationId: string;
  planId: string;
  status: string;
  startDate: string;
  endDate: string | null;
  canceledAt: string | null;
  paystackSubscriptionId: string | null;
  paystackCustomerId: string | null;
  createdAt: string;
  updatedAt: string;
  plan: SubscriptionPlan;
  organization: {
    id: string;
    name: string;
  };
  transactions: Array<{
    id: string;
    amount: number;
    currency: string;
    status: string;
    createdAt: string;
  }>;
}

export interface ChangePlanRequest {
  planId: string;
  immediate?: boolean;
  reason?: string;
}

export interface ChangePlanResponse {
  subscription: OrganizationSubscription;
  changeType: 'upgrade' | 'downgrade';
  proratedAmount: number;
  daysRemaining: number;
  transaction: any;
  effectiveDate: string;
  message: string;
}

// Get Subscription Plans Hook
export function useSubscriptionPlans() {
  const apiClient = useApiClient();
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPlans = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiClient.get<SubscriptionPlan[]>('/admin/subscriptions/plans');
      setPlans(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch subscription plans');
    } finally {
      setLoading(false);
    }
  }, [apiClient]);

  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

  return {
    plans,
    loading,
    error,
    refetch: fetchPlans,
  };
}

// Get Organization Subscription Hook
export function useOrganizationSubscription(organizationId: string) {
  const apiClient = useApiClient();
  const [subscription, setSubscription] = useState<OrganizationSubscription | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSubscription = useCallback(async () => {
    if (!organizationId) return;

    setLoading(true);
    setError(null);

    try {
      const response = await apiClient.get<OrganizationSubscription>(
        `/admin/subscriptions/organization/${organizationId}`
      );
      setSubscription(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch organization subscription');
    } finally {
      setLoading(false);
    }
  }, [apiClient, organizationId]);

  useEffect(() => {
    fetchSubscription();
  }, [fetchSubscription]);

  return {
    subscription,
    loading,
    error,
    refetch: fetchSubscription,
  };
}

// Change Plan Hook
export function useChangePlan() {
  const apiClient = useApiClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const changePlan = useCallback(async (
    organizationId: string,
    request: ChangePlanRequest
  ) => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiClient.post<ChangePlanResponse>(
        `/admin/subscriptions/organization/${organizationId}/change-plan`,
        request
      );
      return response;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to change subscription plan';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [apiClient]);

  return {
    changePlan,
    loading,
    error,
  };
}

// Override Subscription Status Hook (dangerous operation)
export function useOverrideSubscriptionStatus() {
  const apiClient = useApiClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const overrideStatus = useCallback(async (
    subscriptionId: string,
    status: string,
    reason: string
  ) => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiClient.put<OrganizationSubscription>(
        `/admin/subscriptions/${subscriptionId}/status`,
        { status, reason }
      );
      return response;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to override subscription status';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [apiClient]);

  return {
    overrideStatus,
    loading,
    error,
  };
}

// Get All Subscriptions Hook
export function useAllSubscriptions() {
  const apiClient = useApiClient();
  const [subscriptions, setSubscriptions] = useState<OrganizationSubscription[]>([]);
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({});
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSubscriptions = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiClient.get<{
        subscriptions: OrganizationSubscription[];
        total: number;
        statusCounts: Record<string, number>;
      }>('/admin/subscriptions');

      setSubscriptions(response.subscriptions);
      setTotal(response.total);
      setStatusCounts(response.statusCounts);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch subscriptions');
    } finally {
      setLoading(false);
    }
  }, [apiClient]);

  useEffect(() => {
    fetchSubscriptions();
  }, [fetchSubscriptions]);

  return {
    subscriptions,
    statusCounts,
    total,
    loading,
    error,
    refetch: fetchSubscriptions,
  };
}

// Combined Admin Subscription Management Hook
export function useAdminSubscriptionManagement(organizationId?: string) {
  const plans = useSubscriptionPlans();
  const subscription = useOrganizationSubscription(organizationId || '');
  const { changePlan, loading: changingPlan } = useChangePlan();
  const { overrideStatus, loading: overridingStatus } = useOverrideSubscriptionStatus();
  const allSubscriptions = useAllSubscriptions();

  const refreshAll = useCallback(() => {
    plans.refetch();
    if (organizationId) {
      subscription.refetch();
    }
    allSubscriptions.refetch();
  }, [plans, subscription, allSubscriptions, organizationId]);

  return {
    // Plans
    plans: plans.plans,
    plansLoading: plans.loading,
    plansError: plans.error,

    // Organization Subscription
    subscription: subscription.subscription,
    subscriptionLoading: subscription.loading,
    subscriptionError: subscription.error,

    // All Subscriptions
    allSubscriptions: allSubscriptions.subscriptions,
    statusCounts: allSubscriptions.statusCounts,
    totalSubscriptions: allSubscriptions.total,
    allSubscriptionsLoading: allSubscriptions.loading,
    allSubscriptionsError: allSubscriptions.error,

    // Actions
    changePlan,
    changingPlan,
    overrideStatus,
    overridingStatus,
    refreshAll,
  };
}
