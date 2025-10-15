'use client';

/**
 * User Activity Timeline Component
 *
 * Displays a comprehensive timeline of user activities with:
 * - Real-time data from AdminAuditLog
 * - Advanced filtering (action, resource, date range, search)
 * - Pagination
 * - Export functionality (CSV/JSON)
 * - Activity stats visualization
 * - Beautiful cyberpunk-themed UI
 */

import { useState, useMemo } from 'react';
import {
  useUserActivity,
  UserActivity,
  UserActivityFilters,
  UserActivityStats
} from '@/lib/api/hooks/useAdminUsers';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Download,
  Filter,
  Clock,
  User,
  Activity as ActivityIcon,
  Search,
  Calendar,
  ChevronLeft,
  ChevronRight,
  FileJson,
  FileSpreadsheet,
  X,
  TrendingUp
} from 'lucide-react';
import { format } from 'date-fns';

interface UserActivityTimelineProps {
  userId: string;
  userEmail: string;
  isOpen: boolean;
  onClose: () => void;
}

export function UserActivityTimeline({
  userId,
  userEmail,
  isOpen,
  onClose
}: UserActivityTimelineProps) {
  // State
  const [filters, setFilters] = useState<UserActivityFilters>({});
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);
  const limit = 20;

  // Fetch activity data
  const {
    activities,
    stats,
    loading,
    error,
    pagination
  } = useUserActivity(userId, filters, page, limit);

  // Action type options for filtering
  const actionTypes = [
    'CREATE', 'UPDATE', 'DELETE', 'VIEW',
    'LOGIN', 'LOGOUT', 'SUSPEND', 'ACTIVATE',
    'IMPERSONATE', 'RESET_PASSWORD', 'FORCE_LOGOUT',
    'PERMISSION_CHANGE', 'CONFIG_CHANGE', 'SYSTEM_UPDATE'
  ];

  // Resource type options for filtering
  const resourceTypes = [
    'users', 'organizations', 'campaigns', 'settings',
    'auth', 'system', 'contacts', 'workflows', 'analytics'
  ];

  // Get action badge color
  const getActionColor = (action: string) => {
    const colors: Record<string, string> = {
      CREATE: 'bg-green-500/10 text-green-500 border-green-500/30',
      UPDATE: 'bg-blue-500/10 text-blue-500 border-blue-500/30',
      DELETE: 'bg-red-500/10 text-red-500 border-red-500/30',
      VIEW: 'bg-gray-500/10 text-gray-400 border-gray-500/30',
      LOGIN: 'bg-purple-500/10 text-purple-500 border-purple-500/30',
      LOGOUT: 'bg-orange-500/10 text-orange-500 border-orange-500/30',
      SUSPEND: 'bg-red-600/10 text-red-600 border-red-600/30',
      ACTIVATE: 'bg-green-600/10 text-green-600 border-green-600/30',
      IMPERSONATE: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/30',
    };
    return colors[action] || 'bg-cyan-500/10 text-cyan-500 border-cyan-500/30';
  };

  // Export to JSON
  const exportToJSON = () => {
    const dataStr = JSON.stringify({
      user: { id: userId, email: userEmail },
      stats,
      activities,
      exportedAt: new Date().toISOString()
    }, null, 2);

    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = `user-activity-${userEmail}-${format(new Date(), 'yyyy-MM-dd')}.json`;

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  // Export to CSV
  const exportToCSV = () => {
    const csvHeaders = ['Timestamp', 'Action', 'Resource', 'Resource ID', 'IP Address', 'User Agent', 'Details'];
    const csvRows = activities.map(activity => [
      activity.timestamp,
      activity.action,
      activity.resource,
      activity.resourceId || '',
      activity.ipAddress || '',
      activity.userAgent?.substring(0, 50) || '',
      JSON.stringify(activity.details || {})
    ]);

    const csvContent = [
      csvHeaders.join(','),
      ...csvRows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const dataUri = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csvContent);
    const exportFileDefaultName = `user-activity-${userEmail}-${format(new Date(), 'yyyy-MM-dd')}.csv`;

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  // Clear all filters
  const clearFilters = () => {
    setFilters({});
    setPage(1);
  };

  // Stats cards
  const statsCards = stats ? [
    { label: 'Total Activities', value: stats.totalActivities, icon: ActivityIcon },
    { label: 'Last 7 Days', value: stats.recentActivityCount, icon: TrendingUp },
    { label: 'Last Activity', value: stats.lastActivity ? format(new Date(stats.lastActivity), 'MMM d, yyyy') : 'N/A', icon: Clock },
  ] : [];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 border border-cyan-500/30">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">
            Activity Timeline
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            Complete activity history for <span className="text-cyan-400 font-semibold">{userEmail}</span>
          </DialogDescription>
        </DialogHeader>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-3 gap-4 mb-6">
            {statsCards.map((stat, index) => (
              <Card key={index} className="bg-gray-800/50 border-gray-700/50 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-400">{stat.label}</p>
                    <p className="text-2xl font-bold text-white mt-1">{stat.value}</p>
                  </div>
                  <stat.icon className="w-8 h-8 text-cyan-500 opacity-50" />
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Filter Controls */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Button
              onClick={() => setShowFilters(!showFilters)}
              variant="outline"
              size="sm"
              className="border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10"
            >
              <Filter className="w-4 h-4 mr-2" />
              {showFilters ? 'Hide Filters' : 'Show Filters'}
            </Button>

            <div className="flex gap-2">
              <Button
                onClick={exportToCSV}
                variant="outline"
                size="sm"
                className="border-green-500/30 text-green-400 hover:bg-green-500/10"
              >
                <FileSpreadsheet className="w-4 h-4 mr-2" />
                Export CSV
              </Button>
              <Button
                onClick={exportToJSON}
                variant="outline"
                size="sm"
                className="border-purple-500/30 text-purple-400 hover:bg-purple-500/10"
              >
                <FileJson className="w-4 h-4 mr-2" />
                Export JSON
              </Button>
            </div>
          </div>

          {showFilters && (
            <Card className="bg-gray-800/30 border-gray-700/50 p-4">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {/* Search */}
                <div className="col-span-2 md:col-span-1">
                  <label className="text-xs text-gray-400 mb-1 block">Search</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <Input
                      placeholder="Search activities..."
                      value={filters.search || ''}
                      onChange={(e) => {
                        setFilters({ ...filters, search: e.target.value });
                        setPage(1);
                      }}
                      className="pl-10 bg-gray-900/50 border-gray-700 text-white"
                    />
                  </div>
                </div>

                {/* Action Filter */}
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Action</label>
                  <Select
                    value={filters.action || 'all'}
                    onValueChange={(value) => {
                      setFilters({ ...filters, action: value === 'all' ? undefined : value });
                      setPage(1);
                    }}
                  >
                    <SelectTrigger className="bg-gray-900/50 border-gray-700 text-white">
                      <SelectValue placeholder="All Actions" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Actions</SelectItem>
                      {actionTypes.map((action) => (
                        <SelectItem key={action} value={action}>{action}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Resource Filter */}
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Resource</label>
                  <Select
                    value={filters.resource || 'all'}
                    onValueChange={(value) => {
                      setFilters({ ...filters, resource: value === 'all' ? undefined : value });
                      setPage(1);
                    }}
                  >
                    <SelectTrigger className="bg-gray-900/50 border-gray-700 text-white">
                      <SelectValue placeholder="All Resources" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Resources</SelectItem>
                      {resourceTypes.map((resource) => (
                        <SelectItem key={resource} value={resource}>{resource}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Date From */}
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">From Date</label>
                  <Input
                    type="date"
                    value={filters.dateFrom || ''}
                    onChange={(e) => {
                      setFilters({ ...filters, dateFrom: e.target.value });
                      setPage(1);
                    }}
                    className="bg-gray-900/50 border-gray-700 text-white"
                  />
                </div>

                {/* Date To */}
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">To Date</label>
                  <Input
                    type="date"
                    value={filters.dateTo || ''}
                    onChange={(e) => {
                      setFilters({ ...filters, dateTo: e.target.value });
                      setPage(1);
                    }}
                    className="bg-gray-900/50 border-gray-700 text-white"
                  />
                </div>

                {/* Clear Filters */}
                <div className="flex items-end">
                  <Button
                    onClick={clearFilters}
                    variant="outline"
                    size="sm"
                    className="w-full border-red-500/30 text-red-400 hover:bg-red-500/10"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Clear Filters
                  </Button>
                </div>
              </div>
            </Card>
          )}
        </div>

        {/* Timeline */}
        <div className="space-y-3">
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500"></div>
              <p className="text-gray-400 mt-4">Loading activity timeline...</p>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-red-400">Error: {error}</p>
            </div>
          ) : activities.length === 0 ? (
            <div className="text-center py-12">
              <ActivityIcon className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">No activities found</p>
              {Object.keys(filters).length > 0 && (
                <Button
                  onClick={clearFilters}
                  variant="outline"
                  size="sm"
                  className="mt-4"
                >
                  Clear Filters
                </Button>
              )}
            </div>
          ) : (
            <>
              {activities.map((activity, index) => (
                <Card key={activity.id} className="bg-gray-800/30 border-gray-700/50 p-4 hover:border-cyan-500/30 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <Badge className={`${getActionColor(activity.action)} border`}>
                          {activity.action}
                        </Badge>
                        <Badge variant="outline" className="border-gray-600 text-gray-400">
                          {activity.resource}
                        </Badge>
                        {activity.resourceId && (
                          <span className="text-xs text-gray-500">ID: {activity.resourceId}</span>
                        )}
                      </div>

                      <div className="text-sm text-gray-400 space-y-1">
                        <div className="flex items-center gap-2">
                          <Clock className="w-3 h-3" />
                          <span>{format(new Date(activity.timestamp), 'MMM d, yyyy HH:mm:ss')}</span>
                        </div>
                        {activity.ipAddress && (
                          <div className="flex items-center gap-2">
                            <User className="w-3 h-3" />
                            <span>IP: {activity.ipAddress}</span>
                          </div>
                        )}
                        {activity.details && (
                          <details className="mt-2">
                            <summary className="text-xs text-cyan-400 cursor-pointer hover:text-cyan-300">
                              View Details
                            </summary>
                            <pre className="mt-2 p-2 bg-gray-900/50 rounded text-xs overflow-x-auto">
                              {JSON.stringify(activity.details, null, 2)}
                            </pre>
                          </details>
                        )}
                      </div>
                    </div>

                    <div className="text-xs text-gray-500">
                      #{index + 1 + (page - 1) * limit}
                    </div>
                  </div>
                </Card>
              ))}

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="flex items-center justify-between pt-4 border-t border-gray-700/50">
                  <p className="text-sm text-gray-400">
                    Showing {((page - 1) * limit) + 1} to {Math.min(page * limit, pagination.total)} of {pagination.total} activities
                  </p>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                      variant="outline"
                      size="sm"
                      className="border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10 disabled:opacity-50"
                    >
                      <ChevronLeft className="w-4 h-4 mr-1" />
                      Previous
                    </Button>
                    <Button
                      onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
                      disabled={page === pagination.totalPages}
                      variant="outline"
                      size="sm"
                      className="border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10 disabled:opacity-50"
                    >
                      Next
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Action Breakdown */}
        {stats && stats.actionBreakdown.length > 0 && (
          <Card className="bg-gray-800/30 border-gray-700/50 p-4 mt-4">
            <h4 className="text-sm font-semibold text-white mb-3">Action Breakdown</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {stats.actionBreakdown.map((item) => (
                <div key={item.action} className="bg-gray-900/50 rounded p-2">
                  <div className="text-xs text-gray-400">{item.action}</div>
                  <div className="text-lg font-bold text-cyan-400">{item.count}</div>
                </div>
              ))}
            </div>
          </Card>
        )}
      </DialogContent>
    </Dialog>
  );
}
