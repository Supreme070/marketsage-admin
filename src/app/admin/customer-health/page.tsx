"use client";

import { useAdmin } from "@/components/admin/AdminProvider";
import {
  Users,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Activity,
  Heart,
  AlertCircle,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
} from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useCustomerHealthDashboard } from "@/lib/api/hooks/useCustomerHealth";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { CustomerHealthMetrics } from "@/lib/api/hooks/useCustomerHealth";

export default function CustomerHealthPage() {
  const { permissions } = useAdmin();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerHealthMetrics | null>(null);

  const { allCustomers, atRiskCustomers, fetchAll, isLoading, hasError } =
    useCustomerHealthDashboard();

  useEffect(() => {
    handleRefresh();
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await fetchAll();
      toast.success("Customer health data refreshed");
    } catch (error) {
      console.error("Failed to refresh customer health:", error);
      toast.error("Failed to refresh customer health data");
    } finally {
      setIsRefreshing(false);
    }
  };

  const getHealthScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    if (score >= 40) return "text-orange-600";
    return "text-red-600";
  };

  const getHealthScoreBgColor = (score: number) => {
    if (score >= 80) return "bg-green-100";
    if (score >= 60) return "bg-yellow-100";
    if (score >= 40) return "bg-orange-100";
    return "bg-red-100";
  };

  const getLifecycleStageColor = (stage: string) => {
    switch (stage) {
      case "onboarding":
        return "bg-blue-100 text-blue-800";
      case "active":
        return "bg-green-100 text-green-800";
      case "at-risk":
        return "bg-orange-100 text-orange-800";
      case "churned":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case "increasing":
        return <ArrowUpRight className="h-4 w-4 text-green-600" />;
      case "decreasing":
        return <ArrowDownRight className="h-4 w-4 text-red-600" />;
      default:
        return <Minus className="h-4 w-4 text-gray-600" />;
    }
  };

  if (isLoading && allCustomers.length === 0) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4 animate-spin" />
            <span>Loading customer health data...</span>
          </div>
        </div>
      </div>
    );
  }

  if (hasError && allCustomers.length === 0) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <AlertTriangle className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
            <p>Failed to load customer health data</p>
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

  // Calculate summary statistics
  const avgHealthScore =
    allCustomers.length > 0
      ? Math.round(
          allCustomers.reduce((sum, c) => sum + c.healthScore, 0) / allCustomers.length
        )
      : 0;
  const activeCustomers = allCustomers.filter((c) => c.lifecycleStage === "active").length;
  const onboardingCustomers = allCustomers.filter(
    (c) => c.lifecycleStage === "onboarding"
  ).length;
  const churnedCustomers = allCustomers.filter((c) => c.lifecycleStage === "churned").length;

  return (
    <div className="p-6 space-y-8">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Customer Health Scoring</h1>
          <p className="text-muted-foreground">
            Monitor customer health scores, predict churn, and identify at-risk customers
          </p>
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

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{allCustomers.length}</div>
            <p className="text-xs text-muted-foreground">
              {activeCustomers} active, {onboardingCustomers} onboarding
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Health Score</CardTitle>
            <Heart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getHealthScoreColor(avgHealthScore)}`}>
              {avgHealthScore}
            </div>
            <p className="text-xs text-muted-foreground">Out of 100</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">At-Risk Customers</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{atRiskCustomers.length}</div>
            <p className="text-xs text-muted-foreground">Health score {"<"} 60</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Churned</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{churnedCustomers}</div>
            <p className="text-xs text-muted-foreground">Require attention</p>
          </CardContent>
        </Card>
      </div>

      {/* At-Risk Customers Section */}
      {atRiskCustomers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>At-Risk Customers</CardTitle>
            <CardDescription>Customers with health scores below 60 requiring immediate attention</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {atRiskCustomers.map((customer) => (
                <div
                  key={customer.organizationId}
                  className="flex items-start justify-between p-4 border rounded-lg hover:bg-accent cursor-pointer"
                  onClick={() => setSelectedCustomer(customer)}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold">{customer.organizationName}</h3>
                      <span
                        className={`text-xs px-2 py-1 rounded ${getLifecycleStageColor(
                          customer.lifecycleStage
                        )}`}
                      >
                        {customer.lifecycleStage}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Health Score: </span>
                        <span className={`font-semibold ${getHealthScoreColor(customer.healthScore)}`}>
                          {customer.healthScore}/100
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Churn Risk: </span>
                        <span className="font-semibold">
                          {Math.round(customer.churnProbability * 100)}%
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-muted-foreground">Engagement: </span>
                        {getTrendIcon(customer.trends.engagementTrend)}
                        <span className="text-xs">{customer.trends.engagementTrend}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-muted-foreground">Usage: </span>
                        {getTrendIcon(customer.trends.usageTrend)}
                        <span className="text-xs">{customer.trends.usageTrend}</span>
                      </div>
                    </div>
                    {customer.interventions.length > 0 && (
                      <div className="mt-2">
                        <span className="text-xs font-medium text-muted-foreground">
                          Recommended Action:
                        </span>
                        <p className="text-sm mt-1">
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-xs mr-2 ${
                              customer.interventions[0].priority === "high"
                                ? "bg-red-100 text-red-800"
                                : customer.interventions[0].priority === "medium"
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-blue-100 text-blue-800"
                            }`}
                          >
                            {customer.interventions[0].priority}
                          </span>
                          {customer.interventions[0].action}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* All Customers Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Customers</CardTitle>
          <CardDescription>Complete customer health overview sorted by health score</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-4">Customer</th>
                  <th className="text-center py-2 px-4">Health Score</th>
                  <th className="text-center py-2 px-4">Lifecycle Stage</th>
                  <th className="text-center py-2 px-4">Churn Risk</th>
                  <th className="text-center py-2 px-4">Engagement</th>
                  <th className="text-center py-2 px-4">Usage</th>
                  <th className="text-center py-2 px-4">Flags</th>
                </tr>
              </thead>
              <tbody>
                {allCustomers.map((customer) => (
                  <tr
                    key={customer.organizationId}
                    className="border-b hover:bg-accent cursor-pointer"
                    onClick={() => setSelectedCustomer(customer)}
                  >
                    <td className="py-2 px-4 font-medium">{customer.organizationName}</td>
                    <td className="text-center py-2 px-4">
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${getHealthScoreBgColor(
                          customer.healthScore
                        )} ${getHealthScoreColor(customer.healthScore)}`}
                      >
                        {customer.healthScore}
                      </span>
                    </td>
                    <td className="text-center py-2 px-4">
                      <span className={`px-2 py-1 rounded text-xs ${getLifecycleStageColor(customer.lifecycleStage)}`}>
                        {customer.lifecycleStage}
                      </span>
                    </td>
                    <td className="text-center py-2 px-4">
                      {Math.round(customer.churnProbability * 100)}%
                    </td>
                    <td className="text-center py-2 px-4">
                      <div className="flex items-center justify-center gap-1">
                        {getTrendIcon(customer.trends.engagementTrend)}
                        <span className="text-xs">{customer.trends.engagementTrend}</span>
                      </div>
                    </td>
                    <td className="text-center py-2 px-4">
                      <div className="flex items-center justify-center gap-1">
                        {getTrendIcon(customer.trends.usageTrend)}
                        <span className="text-xs">{customer.trends.usageTrend}</span>
                      </div>
                    </td>
                    <td className="text-center py-2 px-4">
                      <div className="flex items-center justify-center gap-1">
                        {customer.flags.lowEngagement && (
                          <AlertTriangle className="h-3 w-3 text-orange-500" title="Low engagement" />
                        )}
                        {customer.flags.failedPayments && (
                          <AlertCircle className="h-3 w-3 text-red-500" title="Failed payments" />
                        )}
                        {customer.flags.highSupportTickets && (
                          <Activity className="h-3 w-3 text-yellow-500" title="High support tickets" />
                        )}
                        {customer.flags.inactiveUsers && (
                          <Users className="h-3 w-3 text-gray-500" title="Inactive users" />
                        )}
                        {!customer.flags.lowEngagement &&
                          !customer.flags.failedPayments &&
                          !customer.flags.highSupportTickets &&
                          !customer.flags.inactiveUsers && (
                            <CheckCircle className="h-3 w-3 text-green-500" title="No flags" />
                          )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Customer Detail Modal */}
      {selectedCustomer && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedCustomer(null)}
        >
          <div
            className="bg-background rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold">{selectedCustomer.organizationName}</h2>
                  <p className="text-sm text-muted-foreground">Customer Health Details</p>
                </div>
                <button
                  onClick={() => setSelectedCustomer(null)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-6">
                {/* Health Score Breakdown */}
                <div>
                  <h3 className="font-semibold mb-3">Health Score Breakdown</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 border rounded">
                      <div className="text-xs text-muted-foreground">Engagement Score</div>
                      <div className="text-lg font-semibold">
                        {selectedCustomer.components.engagementScore}/30
                      </div>
                    </div>
                    <div className="p-3 border rounded">
                      <div className="text-xs text-muted-foreground">Usage Score</div>
                      <div className="text-lg font-semibold">
                        {selectedCustomer.components.usageScore}/25
                      </div>
                    </div>
                    <div className="p-3 border rounded">
                      <div className="text-xs text-muted-foreground">Payment Score</div>
                      <div className="text-lg font-semibold">
                        {selectedCustomer.components.paymentScore}/25
                      </div>
                    </div>
                    <div className="p-3 border rounded">
                      <div className="text-xs text-muted-foreground">Support Score</div>
                      <div className="text-lg font-semibold">
                        {selectedCustomer.components.supportScore}/20
                      </div>
                    </div>
                  </div>
                </div>

                {/* Flags */}
                <div>
                  <h3 className="font-semibold mb-3">Health Flags</h3>
                  <div className="space-y-2">
                    {Object.entries(selectedCustomer.flags).map(([key, value]) => (
                      <div key={key} className="flex items-center gap-2">
                        {value ? (
                          <AlertTriangle className="h-4 w-4 text-red-500" />
                        ) : (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        )}
                        <span className="text-sm">
                          {key.replace(/([A-Z])/g, " $1").trim()}: {value ? "Yes" : "No"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Interventions */}
                {selectedCustomer.interventions.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-3">Recommended Interventions</h3>
                    <div className="space-y-3">
                      {selectedCustomer.interventions.map((intervention, idx) => (
                        <div key={idx} className="p-3 border rounded">
                          <div className="flex items-center gap-2 mb-1">
                            <span
                              className={`text-xs px-2 py-1 rounded ${
                                intervention.priority === "high"
                                  ? "bg-red-100 text-red-800"
                                  : intervention.priority === "medium"
                                  ? "bg-yellow-100 text-yellow-800"
                                  : "bg-blue-100 text-blue-800"
                              }`}
                            >
                              {intervention.priority}
                            </span>
                          </div>
                          <div className="text-sm font-medium">{intervention.action}</div>
                          <div className="text-xs text-muted-foreground mt-1">
                            {intervention.reason}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
