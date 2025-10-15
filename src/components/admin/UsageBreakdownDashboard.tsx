"use client";

import { useState } from "react";
import { useUsageBreakdown, OrganizationUsageBreakdown } from "@/lib/api/hooks/useAdminBilling";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Database,
  Server,
  Mail,
  MessageSquare,
  Zap,
  TrendingUp,
  Calendar,
  RefreshCw,
  Search,
  DollarSign,
  HardDrive,
} from "lucide-react";

export function UsageBreakdownDashboard() {
  const [searchTerm, setSearchTerm] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const { data, loading, error, refresh } = useUsageBreakdown({
    startDate,
    endDate,
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

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="flex items-center gap-2 text-muted-foreground">
          <RefreshCw className="h-5 w-5 animate-spin" />
          <span>Loading usage data...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950">
        <CardHeader>
          <CardTitle className="text-red-600 dark:text-red-400">Error Loading Usage Data</CardTitle>
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
          <CardTitle>No Usage Data</CardTitle>
          <CardDescription>
            No organization usage data available for the selected period.
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
            <CardTitle className="text-sm font-medium">Organizations</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(data.summary.totalOrganizations)}</div>
            <p className="text-xs text-muted-foreground">Total tracked</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">API Calls</CardTitle>
            <Server className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(data.summary.totalAPICallsAllOrgs)}</div>
            <p className="text-xs text-muted-foreground">Across all organizations</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Storage Used</CardTitle>
            <HardDrive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.summary.totalStorageMB} MB</div>
            <p className="text-xs text-muted-foreground">Total data storage</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Messaging Costs</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(data.summary.totalMessagingCost)}</div>
            <p className="text-xs text-muted-foreground">Total spending</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filter Usage Data</CardTitle>
          <CardDescription>
            Filter organizations by name or date range
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
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
              }}
              variant="ghost"
              size="sm"
            >
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Usage Table */}
      <Card>
        <CardHeader>
          <CardTitle>Organization Usage Breakdown</CardTitle>
          <CardDescription>
            Detailed usage metrics per organization
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
                  <TableHead className="text-right">API Calls</TableHead>
                  <TableHead className="text-right">Storage</TableHead>
                  <TableHead className="text-right">Messages</TableHead>
                  <TableHead className="text-right">Cost</TableHead>
                  <TableHead>Features</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrganizations && filteredOrganizations.length > 0 ? (
                  filteredOrganizations.map((org) => (
                    <TableRow key={org.organizationId}>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-medium">{org.organizationName}</div>
                          <div className="text-xs text-muted-foreground">
                            Member since {new Date(org.memberSince).toLocaleDateString()}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={org.plan === "FREE" ? "secondary" : "default"}>
                          {org.plan}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {formatNumber(org.apiCalls.total)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="space-y-1">
                          <div className="font-medium">{org.storage.totalMB} MB</div>
                          <div className="text-xs text-muted-foreground">
                            {formatNumber(org.storage.breakdown.contacts.count)} contacts, {" "}
                            {formatNumber(org.storage.breakdown.campaigns.count)} campaigns
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="space-y-1">
                          <div className="flex items-center justify-end gap-1">
                            <Mail className="h-3 w-3 text-blue-500" />
                            <span className="text-xs">{formatNumber(org.features.breakdown.email.messagesSent)}</span>
                          </div>
                          <div className="flex items-center justify-end gap-1">
                            <MessageSquare className="h-3 w-3 text-green-500" />
                            <span className="text-xs">
                              {formatNumber(org.features.breakdown.sms.messagesSent + org.features.breakdown.whatsapp.messagesSent)}
                            </span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(org.messagingCosts.total, org.messagingCosts.currency)}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {org.features.active.map((feature) => (
                            <Badge key={feature} variant="outline" className="text-xs">
                              {feature}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground">
                      No organizations found matching your filters
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
