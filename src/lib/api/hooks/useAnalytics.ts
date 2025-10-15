"use client";

import { useState, useCallback } from "react";
import { useSession } from "next-auth/react";

/**
 * User Analytics Data Structure
 */
export interface UserAnalytics {
  organizationId: string;
  users: {
    total: number;
    active: number;
    inactive: number;
    newThisMonth: number;
  };
  activity: {
    dailyActiveUsers: number;
    weeklyActiveUsers: number;
    monthlyActiveUsers: number;
  };
  engagement: {
    averageSessionDuration: number;
    averageSessionsPerUser: number;
    retentionRate: number;
  };
  lastUpdated: string;
}

/**
 * Engagement Analytics Data Structure
 */
export interface EngagementAnalytics {
  organizationId: string;
  engagement: {
    overall: number;
    email: number;
    sms: number;
    whatsapp: number;
  };
  interactions: {
    total: number;
    opens: number;
    clicks: number;
    conversions: number;
  };
  trends: {
    daily: number;
    weekly: number;
    monthly: number;
  };
  segments: {
    highEngagement: number;
    mediumEngagement: number;
    lowEngagement: number;
  };
  lastUpdated: string;
}

/**
 * Feature Adoption Metrics Data Structure
 */
export interface FeatureAdoptionMetrics {
  organizationId: string;
  features: {
    emailCampaigns: number;
    smsCampaigns: number;
    whatsappCampaigns: number;
    workflows: number;
    apiCalls: number;
    leadpulseTracking: number;
    aiFeatures: number;
  };
  adoptionRates: {
    emailCampaigns: number;
    smsCampaigns: number;
    whatsappCampaigns: number;
    workflows: number;
    leadpulseTracking: number;
    aiFeatures: number;
  };
  totalUsers: number;
  lastUpdated: string;
}

/**
 * Cohort Analysis Data Structure
 */
export interface CohortData {
  month: string;
  users: number;
  retained: number;
  retentionRate: number;
}

export interface CohortAnalysis {
  organizationId: string;
  cohorts: CohortData[];
  lastUpdated: string;
}

/**
 * Engagement Trends Data Structure
 */
export interface EngagementTrends {
  organizationId: string;
  period: {
    start: string;
    end: string;
    days: number;
  };
  dailyActivity: Array<{
    date: Date;
    count: number;
  }>;
  dailyActiveUsers: Array<{
    date: Date;
    users: number;
  }>;
  lastUpdated: string;
}

/**
 * Performance Analytics Data Structure
 */
export interface PerformanceAnalytics {
  organizationId: string;
  system: {
    uptime: number;
    responseTime: number;
    errorRate: number;
    throughput: number;
  };
  api: {
    totalCalls: number;
    successRate: number;
    averageResponseTime: number;
    peakLoad: number;
  };
  database: {
    queryTime: number;
    connectionPool: number;
    cacheHitRate: number;
  };
  lastUpdated: string;
}

/**
 * Hook: useUserAnalytics
 * Fetches user analytics data
 */
export function useUserAnalytics() {
  const { data: session } = useSession();
  const [data, setData] = useState<UserAnalytics | null>(null);
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
      const response = await window.fetch("/api/analytics/users", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch user analytics: ${response.statusText}`);
      }

      const result = await response.json();

      if (result.success && result.data) {
        setData(result.data);
      } else {
        throw new Error(result.error?.message || "Failed to fetch user analytics");
      }
    } catch (err: any) {
      setError(err.message || "An error occurred");
      console.error("[useUserAnalytics] Error:", err);
    } finally {
      setLoading(false);
    }
  }, [session]);

  return { data, loading, error, fetch };
}

/**
 * Hook: useEngagementAnalytics
 * Fetches engagement analytics data
 */
export function useEngagementAnalytics() {
  const { data: session } = useSession();
  const [data, setData] = useState<EngagementAnalytics | null>(null);
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
      const response = await window.fetch("/api/analytics/engagement", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch engagement analytics: ${response.statusText}`);
      }

      const result = await response.json();

      if (result.success && result.data) {
        setData(result.data);
      } else {
        throw new Error(result.error?.message || "Failed to fetch engagement analytics");
      }
    } catch (err: any) {
      setError(err.message || "An error occurred");
      console.error("[useEngagementAnalytics] Error:", err);
    } finally {
      setLoading(false);
    }
  }, [session]);

  return { data, loading, error, fetch };
}

/**
 * Hook: useFeatureAdoption
 * Fetches feature adoption metrics
 */
export function useFeatureAdoption() {
  const { data: session } = useSession();
  const [data, setData] = useState<FeatureAdoptionMetrics | null>(null);
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
      const response = await window.fetch("/api/analytics/feature-adoption", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch feature adoption: ${response.statusText}`);
      }

      const result = await response.json();

      if (result.success && result.data) {
        setData(result.data);
      } else {
        throw new Error(result.error?.message || "Failed to fetch feature adoption");
      }
    } catch (err: any) {
      setError(err.message || "An error occurred");
      console.error("[useFeatureAdoption] Error:", err);
    } finally {
      setLoading(false);
    }
  }, [session]);

  return { data, loading, error, fetch };
}

/**
 * Hook: useCohortAnalysis
 * Fetches cohort analysis data
 */
export function useCohortAnalysis() {
  const { data: session } = useSession();
  const [data, setData] = useState<CohortAnalysis | null>(null);
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
      const response = await window.fetch("/api/analytics/cohorts", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch cohort analysis: ${response.statusText}`);
      }

      const result = await response.json();

      if (result.success && result.data) {
        setData(result.data);
      } else {
        throw new Error(result.error?.message || "Failed to fetch cohort analysis");
      }
    } catch (err: any) {
      setError(err.message || "An error occurred");
      console.error("[useCohortAnalysis] Error:", err);
    } finally {
      setLoading(false);
    }
  }, [session]);

  return { data, loading, error, fetch };
}

/**
 * Hook: useEngagementTrends
 * Fetches engagement trends data
 */
export function useEngagementTrends(days: number = 30) {
  const { data: session } = useSession();
  const [data, setData] = useState<EngagementTrends | null>(null);
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
      const response = await window.fetch(`/api/analytics/engagement/trends?days=${days}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch engagement trends: ${response.statusText}`);
      }

      const result = await response.json();

      if (result.success && result.data) {
        setData(result.data);
      } else {
        throw new Error(result.error?.message || "Failed to fetch engagement trends");
      }
    } catch (err: any) {
      setError(err.message || "An error occurred");
      console.error("[useEngagementTrends] Error:", err);
    } finally {
      setLoading(false);
    }
  }, [session, days]);

  return { data, loading, error, fetch };
}

/**
 * Hook: usePerformanceAnalytics
 * Fetches performance analytics data
 */
export function usePerformanceAnalytics() {
  const { data: session } = useSession();
  const [data, setData] = useState<PerformanceAnalytics | null>(null);
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
      const response = await window.fetch("/api/analytics/performance", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch performance analytics: ${response.statusText}`);
      }

      const result = await response.json();

      if (result.success && result.data) {
        setData(result.data);
      } else {
        throw new Error(result.error?.message || "Failed to fetch performance analytics");
      }
    } catch (err: any) {
      setError(err.message || "An error occurred");
      console.error("[usePerformanceAnalytics] Error:", err);
    } finally {
      setLoading(false);
    }
  }, [session]);

  return { data, loading, error, fetch };
}

/**
 * Combined Hook: useAdminAnalytics
 * Provides access to all analytics data with a single hook
 */
export function useAdminAnalytics() {
  const userAnalytics = useUserAnalytics();
  const engagementAnalytics = useEngagementAnalytics();
  const featureAdoption = useFeatureAdoption();
  const cohortAnalysis = useCohortAnalysis();
  const engagementTrends = useEngagementTrends();
  const performanceAnalytics = usePerformanceAnalytics();

  const fetchAll = useCallback(async () => {
    await Promise.all([
      userAnalytics.fetch(),
      engagementAnalytics.fetch(),
      featureAdoption.fetch(),
      cohortAnalysis.fetch(),
      engagementTrends.fetch(),
      performanceAnalytics.fetch(),
    ]);
  }, [
    userAnalytics,
    engagementAnalytics,
    featureAdoption,
    cohortAnalysis,
    engagementTrends,
    performanceAnalytics,
  ]);

  const isLoading =
    userAnalytics.loading ||
    engagementAnalytics.loading ||
    featureAdoption.loading ||
    cohortAnalysis.loading ||
    engagementTrends.loading ||
    performanceAnalytics.loading;

  const hasError =
    userAnalytics.error ||
    engagementAnalytics.error ||
    featureAdoption.error ||
    cohortAnalysis.error ||
    engagementTrends.error ||
    performanceAnalytics.error;

  return {
    userAnalytics: userAnalytics.data,
    engagementAnalytics: engagementAnalytics.data,
    featureAdoption: featureAdoption.data,
    cohortAnalysis: cohortAnalysis.data,
    engagementTrends: engagementTrends.data,
    performanceAnalytics: performanceAnalytics.data,
    fetchAll,
    isLoading,
    hasError,
  };
}
