"use client";

import { useState } from "react";
import { useCostAllocationReports, OrganizationCostAllocation } from "@/lib/api/hooks/useAdminBilling";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Search,
  PieChart,
  BarChart,
  ArrowUpRight,
  ArrowDownRight,
  Target,
  Wallet,
} from "lucide-react";

export function CostAllocationDashboard() {
  const [searchTerm, setSearchTerm] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [groupBy, setGroupBy] = useState<"month" | "quarter" | "year">("month");

  const { data, loading, error, refresh } = useCostAllocationReports({
    startDate,
    endDate,
    groupBy,
  });

  const filteredOrganizations = data?.organizations.filter((org) =>
    org.organizationName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat("en-US").format(num);
  };

  const formatCurrency = (amount: number, currency: string = "NGN") => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(2)}%`;
  };

  const getProfitColor = (profit: number) => {
    if (profit > 0) return "text-green-600 dark:text-green-400";
    if (profit < 0) return "text-red-600 dark:text-red-400";
    return "text-gray-600 dark:text-gray-400";
  };

  const getProfitIcon = (profit: number) => {
    if (profit > 0) return <ArrowUpRight className="h-4 w-4" />;
    if (profit < 0) return <ArrowDownRight className="h-4 w-4" />;
    return null;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="flex items-center gap-2 text-muted-foreground">
          <RefreshCw className="h-5 w-5 animate-spin" />
          <span>Loading cost allocation data...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950">
        <CardHeader>
          <CardTitle className="text-red-600 dark:text-red-400">Error Loading Cost Data</CardTitle>
          <CardDescription className="text-red-600 dark:text-red-400">
            {error}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={refresh} variant="outline" className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!data || !data.organizations.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No Cost Allocation Data</CardTitle>
          <CardDescription>
            No cost allocation data available for the selected period.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(data.summary.totalRevenue)}</div>
            <p className="text-xs text-muted-foreground">
              Across {data.summary.totalOrganizations} organizations
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Costs</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(data.summary.totalCosts)}</div>
            <p className="text-xs text-muted-foreground">
              Messaging + Infrastructure
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Profit</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getProfitColor(data.summary.totalProfit)}`}>
              {formatCurrency(data.summary.totalProfit)}
            </div>
            <p className="text-xs text-muted-foreground">
              Revenue - Costs
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Profit Margin</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getProfitColor(data.summary.totalProfit)}`}>
              {formatPercentage(data.summary.overallProfitMargin)}
            </div>
            <p className="text-xs text-muted-foreground">
              Overall profitability
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filter Cost Allocation Data</CardTitle>
          <CardDescription>
            Filter by organization, date range, and grouping period
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Search Organization</label>
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Start Date</label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">End Date</label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Group By</label>
              <Select value={groupBy} onValueChange={(value: "month" | "quarter" | "year") => setGroupBy(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select period" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="month">Monthly</SelectItem>
                  <SelectItem value="quarter">Quarterly</SelectItem>
                  <SelectItem value="year">Yearly</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex gap-2">
            <Button onClick={refresh} variant="outline" size="sm" className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
            <Button
              onClick={() => {
                setSearchTerm("");
                setStartDate("");
                setEndDate("");
                setGroupBy("month");
              }}
              variant="ghost"
              size="sm"
            >
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Top/Bottom Performers */}
      {data.summary.mostProfitable.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-600" />
                Most Profitable Organizations
              </CardTitle>
              <CardDescription>Top 5 organizations by profit</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {data.summary.mostProfitable.map((org, index) => (
                  <div key={org.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="w-6 h-6 flex items-center justify-center">
                        {index + 1}
                      </Badge>
                      <span className="font-medium">{org.name}</span>
                    </div>
                    <span className="text-green-600 dark:text-green-400 font-semibold">
                      {formatCurrency(org.profit)}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingDown className="h-5 w-5 text-red-600" />
                Least Profitable Organizations
              </CardTitle>
              <CardDescription>Bottom 5 organizations by profit</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {data.summary.leastProfitable.map((org, index) => (
                  <div key={org.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="w-6 h-6 flex items-center justify-center">
                        {index + 1}
                      </Badge>
                      <span className="font-medium">{org.name}</span>
                    </div>
                    <span className="text-red-600 dark:text-red-400 font-semibold">
                      {formatCurrency(org.profit)}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Cost Allocation Table */}
      <Card>
        <CardHeader>
          <CardTitle>Organization Cost Allocation</CardTitle>
          <CardDescription>
            Detailed cost, revenue, and profit breakdown per organization
            {filteredOrganizations && filteredOrganizations.length < data.organizations.length && (
              <span className="ml-2 text-blue-600 dark:text-blue-400">
                (Showing {filteredOrganizations.length} of {data.organizations.length})
              </span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Organization</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead className="text-right">Revenue</TableHead>
                  <TableHead className="text-right">Costs</TableHead>
                  <TableHead className="text-right">Profit</TableHead>
                  <TableHead className="text-right">Margin</TableHead>
                  <TableHead className="text-right">ROI</TableHead>
                  <TableHead className="text-right">CLV</TableHead>
                  <TableHead className="text-right">Avg Transaction</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrganizations && filteredOrganizations.length > 0 ? (
                  filteredOrganizations.map((org) => (
                    <TableRow key={org.organizationId}>
                      <TableCell>
                        <div className="font-medium">{org.organizationName}</div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={org.plan === "FREE" ? "secondary" : "default"}>
                          {org.plan}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(org.financial.totalRevenue, org.financial.currency)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="space-y-1">
                          <div>{formatCurrency(org.financial.totalCosts, org.financial.currency)}</div>
                          <div className="text-xs text-muted-foreground">
                            Msg: {formatCurrency(org.costBreakdown.messagingCosts, org.financial.currency)}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className={`flex items-center justify-end gap-1 font-semibold ${getProfitColor(org.financial.profit)}`}>
                          {getProfitIcon(org.financial.profit)}
                          {formatCurrency(org.financial.profit, org.financial.currency)}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className={getProfitColor(org.financial.profit)}>
                          {formatPercentage(org.financial.profitMargin)}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className={getProfitColor(org.financial.roi)}>
                          {formatPercentage(org.financial.roi)}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="space-y-1">
                          <div className="font-medium">
                            {formatCurrency(org.financial.customerLifetimeValue, org.financial.currency)}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {org.revenueDetails.transactionCount} txns
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(org.revenueDetails.averageTransactionValue, org.financial.currency)}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center text-muted-foreground">
                      No organizations found matching your filters
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Monthly Averages (if available) */}
      {filteredOrganizations && filteredOrganizations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart className="h-5 w-5" />
              Monthly Averages
            </CardTitle>
            <CardDescription>
              Average monthly performance across all organizations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              {filteredOrganizations.slice(0, 3).map((org) => (
                <div key={org.organizationId} className="space-y-2 p-4 border rounded-lg">
                  <div className="font-medium text-sm">{org.organizationName}</div>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Avg Revenue:</span>
                      <span className="font-medium">
                        {formatCurrency(org.monthlyAverages.revenue, org.financial.currency)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Avg Costs:</span>
                      <span className="font-medium">
                        {formatCurrency(org.monthlyAverages.costs, org.financial.currency)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Avg Profit:</span>
                      <span className={`font-medium ${getProfitColor(org.monthlyAverages.profit)}`}>
                        {formatCurrency(org.monthlyAverages.profit, org.financial.currency)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
