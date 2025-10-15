"use client";

import { useState, useCallback } from "react";
import { useSession } from "next-auth/react";

/**
 * Customer Health Metrics Data Structure
 */
export interface CustomerHealthMetrics {
  organizationId: string;
  organizationName: string;
  healthScore: number; // 0-100
  lifecycleStage: "onboarding" | "active" | "at-risk" | "churned";
  churnProbability: number; // 0-1
  components: {
    engagementScore: number; // 0-30
    usageScore: number; // 0-25
    paymentScore: number; // 0-25
    supportScore: number; // 0-20
  };
  trends: {
    engagementTrend: "increasing" | "stable" | "decreasing";
    usageTrend: "increasing" | "stable" | "decreasing";
  };
  flags: {
    lowEngagement: boolean;
    failedPayments: boolean;
    highSupportTickets: boolean;
    inactiveUsers: boolean;
  };
  interventions: Array<{
    priority: "high" | "medium" | "low";
    action: string;
    reason: string;
  }>;
  lastUpdated: string;
}

/**
 * Hook: useOrganizationHealth
 * Fetches health metrics for a specific organization
 */
export function useOrganizationHealth(organizationId: string) {
  const { data: session } = useSession();
  const [data, setData] = useState<CustomerHealthMetrics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    if (!session?.user || !organizationId) {
      setError("Not authenticated or missing organization ID");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await window.fetch(
        `/api/customer-health/organization/${organizationId}`,
        {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        }
      );

      if (!response.ok) {
        throw new Error(
          `Failed to fetch organization health: ${response.statusText}`
        );
      }

      const result = await response.json();

      if (result.success && result.data) {
        setData(result.data);
      } else {
        throw new Error(
          result.error?.message || "Failed to fetch organization health"
        );
      }
    } catch (err: any) {
      setError(err.message || "An error occurred");
      console.error("[useOrganizationHealth] Error:", err);
    } finally {
      setLoading(false);
    }
  }, [session, organizationId]);

  return { data, loading, error, fetch };
}

/**
 * Hook: useAllOrganizationHealth
 * Fetches health metrics for all organizations
 */
export function useAllOrganizationHealth() {
  const { data: session } = useSession();
  const [data, setData] = useState<CustomerHealthMetrics[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    if (!session?.user) {
      setError("Not authenticated");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await window.fetch("/api/customer-health/all", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        throw new Error(
          `Failed to fetch all organization health: ${response.statusText}`
        );
      }

      const result = await response.json();

      if (result.success && result.data) {
        setData(result.data);
      } else {
        throw new Error(
          result.error?.message || "Failed to fetch all organization health"
        );
      }
    } catch (err: any) {
      setError(err.message || "An error occurred");
      console.error("[useAllOrganizationHealth] Error:", err);
    } finally {
      setLoading(false);
    }
  }, [session]);

  return { data, loading, error, fetch };
}

/**
 * Hook: useAtRiskCustomers
 * Fetches at-risk customers (health score < 60)
 */
export function useAtRiskCustomers() {
  const { data: session } = useSession();
  const [data, setData] = useState<CustomerHealthMetrics[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    if (!session?.user) {
      setError("Not authenticated");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await window.fetch("/api/customer-health/at-risk", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        throw new Error(
          `Failed to fetch at-risk customers: ${response.statusText}`
        );
      }

      const result = await response.json();

      if (result.success && result.data) {
        setData(result.data);
      } else {
        throw new Error(
          result.error?.message || "Failed to fetch at-risk customers"
        );
      }
    } catch (err: any) {
      setError(err.message || "An error occurred");
      console.error("[useAtRiskCustomers] Error:", err);
    } finally {
      setLoading(false);
    }
  }, [session]);

  return { data, loading, error, fetch };
}

/**
 * Combined Hook: useCustomerHealthDashboard
 * Provides access to all customer health data
 */
export function useCustomerHealthDashboard() {
  const allHealth = useAllOrganizationHealth();
  const atRisk = useAtRiskCustomers();

  const fetchAll = useCallback(async () => {
    await Promise.all([allHealth.fetch(), atRisk.fetch()]);
  }, [allHealth, atRisk]);

  const isLoading = allHealth.loading || atRisk.loading;
  const hasError = allHealth.error || atRisk.error;

  return {
    allCustomers: allHealth.data,
    atRiskCustomers: atRisk.data,
    fetchAll,
    isLoading,
    hasError: hasError || null,
  };
}
