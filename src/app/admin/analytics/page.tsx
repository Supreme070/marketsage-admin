"use client";

import { useAdmin } from "@/components/admin/AdminProvider";
import {
  BarChart3,
  Users,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Activity,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Target,
  Brain,
  Clock,
  Gauge,
  UserCheck,
  UserX,
  Zap,
  Mail,
  MessageSquare,
  Phone,
  GitBranch
} from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useAdminAnalytics } from "@/lib/api/hooks/useAnalytics";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdminAnalyticsPage() {
  const { permissions } = useAdmin();
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Use the comprehensive analytics hook
  const {
    userAnalytics,
    engagementAnalytics,
    featureAdoption,
    cohortAnalysis,
    engagementTrends,
    performanceAnalytics,
    fetchAll,
    isLoading,
    hasError,
  } = useAdminAnalytics();

  // Load data on component mount
  useEffect(() => {
    handleRefresh();
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await fetchAll();
      toast.success("Analytics data refreshed");
    } catch (error) {
      console.error("Failed to refresh analytics:", error);
      toast.error("Failed to refresh analytics data");
    } finally {
      setIsRefreshing(false);
    }
  };

  // Helper functions for formatting
  const formatNumber = (number: number) => {
    return new Intl.NumberFormat().format(number);
  };

  const formatPercentage = (value: number) => {
    return `${(value * 100).toFixed(1)}%`;
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  if (isLoading && !userAnalytics) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4 animate-spin" />
            <span>Loading analytics data...</span>
          </div>
        </div>
      </div>
    );
  }

  if (hasError && !userAnalytics) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <AlertTriangle className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
            <p>Failed to load analytics data</p>
            <button
              onClick={handleRefresh}
              className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">User Activity Monitoring</h1>
          <p className="text-muted-foreground">Track active users, engagement trends, and feature adoption</p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* User Activity Overview */}
      {userAnalytics && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatNumber(userAnalytics.users.total)}</div>
              <p className="text-xs text-muted-foreground">
                {formatNumber(userAnalytics.users.newThisMonth)} new this month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Users</CardTitle>
              <UserCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatNumber(userAnalytics.users.active)}</div>
              <p className="text-xs text-muted-foreground">
                Daily: {formatNumber(userAnalytics.activity.dailyActiveUsers)} | Weekly: {formatNumber(userAnalytics.activity.weeklyActiveUsers)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Session Duration</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatDuration(userAnalytics.engagement.averageSessionDuration)}</div>
              <p className="text-xs text-muted-foreground">
                Avg {userAnalytics.engagement.averageSessionsPerUser.toFixed(1)} sessions per user
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Retention Rate</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatPercentage(userAnalytics.engagement.retentionRate)}</div>
              <p className="text-xs text-muted-foreground">
                {userAnalytics.users.inactive} inactive users
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Engagement Analytics */}
      {engagementAnalytics && (
        <Card>
          <CardHeader>
            <CardTitle>Engagement Analytics</CardTitle>
            <CardDescription>User interaction metrics across channels</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Email</span>
                  </div>
                  <span className="text-sm font-medium">{formatPercentage(engagementAnalytics.engagement.email)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">SMS</span>
                  </div>
                  <span className="text-sm font-medium">{formatPercentage(engagementAnalytics.engagement.sms)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">WhatsApp</span>
                  </div>
                  <span className="text-sm font-medium">{formatPercentage(engagementAnalytics.engagement.whatsapp)}</span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-center">
                  <div className="text-3xl font-bold">{formatNumber(engagementAnalytics.interactions.total)}</div>
                  <div className="text-xs text-muted-foreground">Total Interactions</div>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div>
                    <div className="font-medium">{formatNumber(engagementAnalytics.interactions.opens)}</div>
                    <div className="text-muted-foreground">Opens</div>
                  </div>
                  <div>
                    <div className="font-medium">{formatNumber(engagementAnalytics.interactions.clicks)}</div>
                    <div className="text-muted-foreground">Clicks</div>
                  </div>
                  <div>
                    <div className="font-medium">{formatNumber(engagementAnalytics.interactions.conversions)}</div>
                    <div className="text-muted-foreground">Conversions</div>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-sm font-medium mb-2">Engagement Segments</div>
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-green-600">High</span>
                    <span>{formatPercentage(engagementAnalytics.segments.highEngagement)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-yellow-600">Medium</span>
                    <span>{formatPercentage(engagementAnalytics.segments.mediumEngagement)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-red-600">Low</span>
                    <span>{formatPercentage(engagementAnalytics.segments.lowEngagement)}</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Feature Adoption */}
      {featureAdoption && (
        <Card>
          <CardHeader>
            <CardTitle>Feature Adoption</CardTitle>
            <CardDescription>Platform feature usage and adoption rates</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Email Campaigns</span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium">{formatNumber(featureAdoption.features.emailCampaigns)}</div>
                    <div className="text-xs text-muted-foreground">{formatPercentage(featureAdoption.adoptionRates.emailCampaigns)} users</div>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">SMS Campaigns</span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium">{formatNumber(featureAdoption.features.smsCampaigns)}</div>
                    <div className="text-xs text-muted-foreground">{formatPercentage(featureAdoption.adoptionRates.smsCampaigns)} users</div>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">WhatsApp Campaigns</span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium">{formatNumber(featureAdoption.features.whatsappCampaigns)}</div>
                    <div className="text-xs text-muted-foreground">{formatPercentage(featureAdoption.adoptionRates.whatsappCampaigns)} users</div>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <GitBranch className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Workflows</span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium">{formatNumber(featureAdoption.features.workflows)}</div>
                    <div className="text-xs text-muted-foreground">{formatPercentage(featureAdoption.adoptionRates.workflows)} users</div>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Brain className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">AI Features</span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium">{formatNumber(featureAdoption.features.aiFeatures)}</div>
                    <div className="text-xs text-muted-foreground">{formatPercentage(featureAdoption.adoptionRates.aiFeatures)} users</div>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">API Calls</span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium">{formatNumber(featureAdoption.features.apiCalls)}</div>
                    <div className="text-xs text-muted-foreground">Total usage</div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Cohort Analysis */}
      {cohortAnalysis && cohortAnalysis.cohorts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Cohort Analysis</CardTitle>
            <CardDescription>User retention by signup month</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-4">Cohort Month</th>
                    <th className="text-right py-2 px-4">Users</th>
                    <th className="text-right py-2 px-4">Retained</th>
                    <th className="text-right py-2 px-4">Retention Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {cohortAnalysis.cohorts.map((cohort) => (
                    <tr key={cohort.month} className="border-b">
                      <td className="py-2 px-4">{cohort.month}</td>
                      <td className="text-right py-2 px-4">{formatNumber(cohort.users)}</td>
                      <td className="text-right py-2 px-4">{formatNumber(cohort.retained)}</td>
                      <td className="text-right py-2 px-4">
                        <span className={cohort.retentionRate >= 0.7 ? "text-green-600" : cohort.retentionRate >= 0.5 ? "text-yellow-600" : "text-red-600"}>
                          {formatPercentage(cohort.retentionRate)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Performance Analytics */}
      {performanceAnalytics && (
        <Card>
          <CardHeader>
            <CardTitle>System Performance</CardTitle>
            <CardDescription>Platform health and performance metrics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Gauge className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Response Time</span>
                </div>
                <div className="text-2xl font-bold">{performanceAnalytics.system.responseTime}ms</div>
                <div className="text-xs text-muted-foreground">Average API response</div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Uptime</span>
                </div>
                <div className="text-2xl font-bold">{performanceAnalytics.system.uptime.toFixed(2)}%</div>
                <div className="text-xs text-muted-foreground">System availability</div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Error Rate</span>
                </div>
                <div className="text-2xl font-bold">{performanceAnalytics.system.errorRate.toFixed(2)}%</div>
                <div className="text-xs text-muted-foreground">API error rate</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}