"use client";

import { useAdmin } from "@/components/admin/AdminProvider";
import { useAdminAlertsDashboard, SystemAlert, AlertSeverity, SystemAlertType } from "@/lib/api/hooks/useAdminAlerts";
import {
  AlertTriangle,
  Bell,
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp,
  TrendingDown,
  Activity,
  Filter,
  RefreshCw,
  AlertCircle,
  Eye,
  Check,
  Calendar,
  Search,
  BarChart3,
  Zap,
  DollarSign,
  Users,
  Mail,
  Server,
  ShieldAlert,
  Info,
  Loader2,
} from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface AlertFilter {
  severity?: AlertSeverity;
  alertType?: SystemAlertType;
  resolved?: boolean;
  searchQuery?: string;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

const getSeverityColor = (severity: AlertSeverity): string => {
  switch (severity) {
    case 'CRITICAL':
      return 'bg-red-500 hover:bg-red-600';
    case 'HIGH':
      return 'bg-orange-500 hover:bg-orange-600';
    case 'MEDIUM':
      return 'bg-yellow-500 hover:bg-yellow-600';
    case 'LOW':
      return 'bg-blue-500 hover:bg-blue-600';
    default:
      return 'bg-gray-500 hover:bg-gray-600';
  }
};

const getSeverityIcon = (severity: AlertSeverity) => {
  switch (severity) {
    case 'CRITICAL':
      return <AlertTriangle className="h-4 w-4" />;
    case 'HIGH':
      return <AlertCircle className="h-4 w-4" />;
    case 'MEDIUM':
      return <Info className="h-4 w-4" />;
    case 'LOW':
      return <Bell className="h-4 w-4" />;
    default:
      return <Bell className="h-4 w-4" />;
  }
};

const getAlertTypeIcon = (alertType: SystemAlertType) => {
  switch (alertType) {
    case 'PAYMENT_FAILURE_SPIKE':
      return <DollarSign className="h-5 w-5" />;
    case 'CHURN_SPIKE':
      return <TrendingDown className="h-5 w-5" />;
    case 'LOW_ENGAGEMENT':
      return <Users className="h-5 w-5" />;
    case 'HIGH_SUPPORT_TICKETS':
      return <Mail className="h-5 w-5" />;
    case 'API_USAGE_ANOMALY':
      return <Activity className="h-5 w-5" />;
    case 'CAMPAIGN_FAILURE':
      return <Mail className="h-5 w-5" />;
    case 'BILLING_ANOMALY':
      return <DollarSign className="h-5 w-5" />;
    case 'SECURITY':
      return <ShieldAlert className="h-5 w-5" />;
    default:
      return <Server className="h-5 w-5" />;
  }
};

const formatAlertType = (alertType: SystemAlertType): string => {
  return alertType
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

const formatRelativeTime = (date: Date): string => {
  const now = new Date();
  const diffInMs = now.getTime() - new Date(date).getTime();
  const diffInMins = Math.floor(diffInMs / 60000);
  const diffInHours = Math.floor(diffInMins / 60);
  const diffInDays = Math.floor(diffInHours / 24);

  if (diffInMins < 1) return 'Just now';
  if (diffInMins < 60) return `${diffInMins}m ago`;
  if (diffInHours < 24) return `${diffInHours}h ago`;
  if (diffInDays < 7) return `${diffInDays}d ago`;

  return new Date(date).toLocaleDateString();
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function AlertsPage() {
  const { user } = useAdmin();
  const {
    alerts,
    stats,
    loading,
    alertsLoading,
    fetchAlerts,
    fetchStats,
    resolveAlert,
    acknowledgeAlert,
    runChecks,
    refreshAll,
  } = useAdminAlertsDashboard();

  // State
  const [filters, setFilters] = useState<AlertFilter>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAlert, setSelectedAlert] = useState<SystemAlert | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [isResolveDialogOpen, setIsResolveDialogOpen] = useState(false);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [isResolving, setIsResolving] = useState(false);

  // Initial fetch
  useEffect(() => {
    refreshAll();
  }, []);

  // Apply filters and search
  const filteredAlerts = useMemo(() => {
    let filtered = alerts;

    // Apply status filter
    if (filters.resolved !== undefined) {
      filtered = filtered.filter((alert) => alert.resolved === filters.resolved);
    }

    // Apply severity filter
    if (filters.severity) {
      filtered = filtered.filter((alert) => alert.severity === filters.severity);
    }

    // Apply type filter
    if (filters.alertType) {
      filtered = filtered.filter((alert) => alert.alertType === filters.alertType);
    }

    // Apply search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (alert) =>
          alert.title.toLowerCase().includes(query) ||
          alert.description.toLowerCase().includes(query) ||
          alert.source.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [alerts, filters, searchQuery]);

  // Handle refresh
  const handleRefresh = async () => {
    toast.info('Refreshing alerts...');
    await refreshAll(filters);
    toast.success('Alerts refreshed');
  };

  // Handle manual alert check
  const handleRunChecks = async () => {
    toast.info('Running business alert checks...');
    try {
      const result = await runChecks();
      toast.success(
        `Alert checks complete: ${result.alertsCreated} new alerts created from ${result.checksRun} checks`
      );
      await refreshAll(filters);
    } catch (error) {
      toast.error('Failed to run alert checks');
    }
  };

  // Handle acknowledge alert
  const handleAcknowledge = async (alertId: string) => {
    try {
      await acknowledgeAlert(alertId);
      toast.success('Alert acknowledged');
      await refreshAll(filters);
    } catch (error) {
      toast.error('Failed to acknowledge alert');
    }
  };

  // Handle resolve alert
  const handleResolve = async () => {
    if (!selectedAlert) return;

    setIsResolving(true);
    try {
      await resolveAlert(selectedAlert.id, resolutionNotes);
      toast.success('Alert resolved successfully');
      setIsResolveDialogOpen(false);
      setResolutionNotes('');
      await refreshAll(filters);
    } catch (error) {
      toast.error('Failed to resolve alert');
    } finally {
      setIsResolving(false);
    }
  };

  // Handle view alert details
  const handleViewDetails = (alert: SystemAlert) => {
    setSelectedAlert(alert);
    setIsDetailDialogOpen(true);
  };

  // Handle open resolve dialog
  const handleOpenResolveDialog = (alert: SystemAlert) => {
    setSelectedAlert(alert);
    setIsResolveDialogOpen(true);
  };

  return (
    <div className="flex-1 space-y-6 p-8 pt-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Business Alerts</h2>
          <p className="text-muted-foreground">
            Monitor and manage business-critical alerts for proactive platform management
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRunChecks}
            disabled={loading}
          >
            <Zap className="mr-2 h-4 w-4" />
            Run Checks
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={loading}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Alerts</CardTitle>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalAlerts || 0}</div>
            <p className="text-xs text-muted-foreground">
              All time alerts created
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unresolved</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-500">
              {stats?.unresolvedAlerts || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Require attention
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Critical</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">
              {stats?.criticalAlerts || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Immediate action needed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Resolution</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.averageResolutionTimeMinutes
                ? `${Math.round(stats.averageResolutionTimeMinutes)}m`
                : 'N/A'}
            </div>
            <p className="text-xs text-muted-foreground">
              Time to resolve
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-2 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search alerts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
            </div>

            {/* Status Filter */}
            <Select
              value={filters.resolved === undefined ? 'all' : filters.resolved ? 'resolved' : 'unresolved'}
              onValueChange={(value) => {
                if (value === 'all') {
                  setFilters({ ...filters, resolved: undefined });
                } else {
                  setFilters({ ...filters, resolved: value === 'resolved' });
                }
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="unresolved">Unresolved</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
              </SelectContent>
            </Select>

            {/* Severity Filter */}
            <Select
              value={filters.severity || 'all'}
              onValueChange={(value) => {
                if (value === 'all') {
                  setFilters({ ...filters, severity: undefined });
                } else {
                  setFilters({ ...filters, severity: value as AlertSeverity });
                }
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Severity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Severities</SelectItem>
                <SelectItem value="CRITICAL">Critical</SelectItem>
                <SelectItem value="HIGH">High</SelectItem>
                <SelectItem value="MEDIUM">Medium</SelectItem>
                <SelectItem value="LOW">Low</SelectItem>
              </SelectContent>
            </Select>

            {/* Clear Filters */}
            <Button
              variant="outline"
              onClick={() => {
                setFilters({});
                setSearchQuery('');
              }}
            >
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Alerts List */}
      <Card>
        <CardHeader>
          <CardTitle>
            Alerts ({filteredAlerts.length})
          </CardTitle>
          <CardDescription>
            Real-time business alerts for proactive platform management
          </CardDescription>
        </CardHeader>
        <CardContent>
          {alertsLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredAlerts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <CheckCircle className="h-12 w-12 text-green-500 mb-4" />
              <h3 className="text-lg font-medium">No alerts found</h3>
              <p className="text-sm text-muted-foreground mt-1">
                {alerts.length === 0
                  ? 'All systems are operating normally'
                  : 'Try adjusting your filters'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className="flex items-start gap-4 rounded-lg border p-4 hover:bg-accent/50 transition-colors"
                >
                  {/* Icon */}
                  <div className={`p-2 rounded-lg ${getSeverityColor(alert.severity)}/10`}>
                    {getAlertTypeIcon(alert.alertType)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-sm truncate">
                          {alert.title}
                        </h4>
                        <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                          {alert.description}
                        </p>
                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                          <Badge
                            variant="secondary"
                            className={`${getSeverityColor(alert.severity)} text-white`}
                          >
                            {getSeverityIcon(alert.severity)}
                            <span className="ml-1">{alert.severity}</span>
                          </Badge>
                          <Badge variant="outline">
                            {formatAlertType(alert.alertType)}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {alert.source}
                          </span>
                          <span className="text-xs text-muted-foreground">•</span>
                          <span className="text-xs text-muted-foreground">
                            {formatRelativeTime(alert.createdAt)}
                          </span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {alert.resolved ? (
                          <Badge variant="secondary" className="bg-green-500/10 text-green-700 border-green-200">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Resolved
                          </Badge>
                        ) : (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewDetails(alert)}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              View
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleOpenResolveDialog(alert)}
                            >
                              <Check className="h-4 w-4 mr-1" />
                              Resolve
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Alert Detail Dialog */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedAlert && getAlertTypeIcon(selectedAlert.alertType)}
              {selectedAlert?.title}
            </DialogTitle>
            <DialogDescription>
              Alert details and metadata
            </DialogDescription>
          </DialogHeader>

          {selectedAlert && (
            <div className="space-y-4">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Severity</label>
                  <div className="mt-1">
                    <Badge
                      className={`${getSeverityColor(selectedAlert.severity)} text-white`}
                    >
                      {selectedAlert.severity}
                    </Badge>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium">Type</label>
                  <div className="mt-1">
                    <Badge variant="outline">
                      {formatAlertType(selectedAlert.alertType)}
                    </Badge>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium">Source</label>
                  <p className="text-sm text-muted-foreground mt-1">
                    {selectedAlert.source}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium">Created</label>
                  <p className="text-sm text-muted-foreground mt-1">
                    {new Date(selectedAlert.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="text-sm font-medium">Description</label>
                <p className="text-sm text-muted-foreground mt-1">
                  {selectedAlert.description}
                </p>
              </div>

              {/* Metadata */}
              {Object.keys(selectedAlert.metadata || {}).length > 0 && (
                <div>
                  <label className="text-sm font-medium">Metadata</label>
                  <pre className="mt-1 p-3 bg-muted rounded-lg text-xs overflow-x-auto">
                    {JSON.stringify(selectedAlert.metadata, null, 2)}
                  </pre>
                </div>
              )}

              {/* Resolution Info */}
              {selectedAlert.resolved && (
                <div className="border-t pt-4">
                  <h4 className="text-sm font-medium mb-2">Resolution Details</h4>
                  <div className="space-y-2">
                    <div>
                      <label className="text-xs text-muted-foreground">Resolved By</label>
                      <p className="text-sm">
                        {selectedAlert.resolver?.name || 'Unknown'} ({selectedAlert.resolver?.email})
                      </p>
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground">Resolved At</label>
                      <p className="text-sm">
                        {selectedAlert.resolvedAt
                          ? new Date(selectedAlert.resolvedAt).toLocaleString()
                          : 'N/A'}
                      </p>
                    </div>
                    {selectedAlert.metadata?.resolutionNotes && (
                      <div>
                        <label className="text-xs text-muted-foreground">Resolution Notes</label>
                        <p className="text-sm">{selectedAlert.metadata.resolutionNotes}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDetailDialogOpen(false)}>
              Close
            </Button>
            {selectedAlert && !selectedAlert.resolved && (
              <Button onClick={() => {
                setIsDetailDialogOpen(false);
                handleOpenResolveDialog(selectedAlert);
              }}>
                <Check className="h-4 w-4 mr-2" />
                Resolve Alert
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Resolve Alert Dialog */}
      <Dialog open={isResolveDialogOpen} onOpenChange={setIsResolveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Resolve Alert</DialogTitle>
            <DialogDescription>
              Add resolution notes and mark this alert as resolved
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Alert</label>
              <p className="text-sm text-muted-foreground mt-1">
                {selectedAlert?.title}
              </p>
            </div>

            <div>
              <label className="text-sm font-medium">Resolution Notes</label>
              <Textarea
                placeholder="Describe how this alert was resolved..."
                value={resolutionNotes}
                onChange={(e) => setResolutionNotes(e.target.value)}
                className="mt-1"
                rows={4}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsResolveDialogOpen(false);
                setResolutionNotes('');
              }}
              disabled={isResolving}
            >
              Cancel
            </Button>
            <Button onClick={handleResolve} disabled={isResolving}>
              {isResolving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Resolving...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Resolve Alert
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
