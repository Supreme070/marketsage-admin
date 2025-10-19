'use client';

import React, { useEffect, useState } from 'react';
import { format } from 'date-fns';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AlertTriangle, RefreshCw, ChevronLeft, ChevronRight, Eye, FileText } from 'lucide-react';
import { useSCIMAuditLogs, type SCIMAuditLog } from '@/lib/api/hooks/useAdminSCIM';

// ============================================================================
// Component Props
// ============================================================================

interface AuditLogsTableProps {
  orgId: string;
  initialPage?: number;
  initialLimit?: number;
}

// ============================================================================
// Component
// ============================================================================

export function AuditLogsTable({ orgId, initialPage = 1, initialLimit = 20 }: AuditLogsTableProps) {
  const [page, setPage] = useState(initialPage);
  const [limit] = useState(initialLimit);

  const { auditLogs, pagination, loading, error, refreshAuditLogs } = useSCIMAuditLogs(orgId, {
    page,
    limit,
  });

  const [selectedLog, setSelectedLog] = useState<SCIMAuditLog | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);

  // Fetch logs on mount and when page changes
  useEffect(() => {
    refreshAuditLogs({ page, limit });
  }, [refreshAuditLogs, page, limit]);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    try {
      return format(new Date(dateString), 'MMM dd, yyyy HH:mm:ss');
    } catch {
      return 'Invalid date';
    }
  };

  const getStatusBadgeVariant = (status: number): 'default' | 'destructive' | 'secondary' => {
    if (status >= 200 && status < 300) return 'default';
    if (status >= 400) return 'destructive';
    return 'secondary';
  };

  const getMethodBadgeColor = (method: string): string => {
    switch (method.toUpperCase()) {
      case 'GET':
        return 'bg-blue-100 text-blue-800';
      case 'POST':
        return 'bg-green-100 text-green-800';
      case 'PUT':
      case 'PATCH':
        return 'bg-yellow-100 text-yellow-800';
      case 'DELETE':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleViewDetails = (log: SCIMAuditLog) => {
    setSelectedLog(log);
    setShowDetailsDialog(true);
  };

  const handlePreviousPage = () => {
    if (page > 1) {
      setPage(page - 1);
    }
  };

  const handleNextPage = () => {
    if (page < pagination.totalPages) {
      setPage(page + 1);
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>SCIM Audit Logs</CardTitle>
              <CardDescription>
                {pagination.total} log entr{pagination.total !== 1 ? 'ies' : 'y'}
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refreshAuditLogs({ page, limit })}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Error State */}
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Loading State */}
          {loading && auditLogs.length === 0 && (
            <div className="flex justify-center items-center py-12">
              <LoadingSpinner className="h-8 w-8" />
              <span className="ml-3 text-muted-foreground">Loading audit logs...</span>
            </div>
          )}

          {/* Empty State */}
          {!loading && auditLogs.length === 0 && (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground">No audit logs found</p>
              <p className="text-sm text-muted-foreground mt-2">
                Audit logs will appear here once SCIM operations are performed
              </p>
            </div>
          )}

          {/* Table */}
          {auditLogs.length > 0 && (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Timestamp</TableHead>
                      <TableHead>Operation</TableHead>
                      <TableHead>Resource Type</TableHead>
                      <TableHead>Method</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Token</TableHead>
                      <TableHead>IP Address</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {auditLogs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="font-mono text-xs">
                          {formatDate(log.createdAt)}
                        </TableCell>
                        <TableCell>
                          <code className="text-xs bg-muted px-2 py-1 rounded">{log.operation}</code>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{log.resourceType}</Badge>
                        </TableCell>
                        <TableCell>
                          <span
                            className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded ${getMethodBadgeColor(log.httpMethod)}`}
                          >
                            {log.httpMethod}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge variant={getStatusBadgeVariant(log.httpStatus)}>
                            {log.httpStatus}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {log.tokenPrefix ? (
                            <code className="text-xs bg-muted px-2 py-1 rounded">
                              {log.tokenPrefix}...
                            </code>
                          ) : (
                            <span className="text-muted-foreground text-xs">N/A</span>
                          )}
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          {log.ipAddress || <span className="text-muted-foreground">N/A</span>}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewDetails(log)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-muted-foreground">
                    Showing {(page - 1) * limit + 1} to {Math.min(page * limit, pagination.total)} of{' '}
                    {pagination.total} logs
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handlePreviousPage}
                      disabled={page === 1 || loading}
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      Previous
                    </Button>
                    <div className="text-sm">
                      Page {page} of {pagination.totalPages}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleNextPage}
                      disabled={page === pagination.totalPages || loading}
                    >
                      Next
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Audit Log Details</DialogTitle>
            <DialogDescription>
              Detailed information about this SCIM operation
            </DialogDescription>
          </DialogHeader>

          {selectedLog && (
            <ScrollArea className="h-[60vh] pr-4">
              <div className="space-y-6">
                {/* Operation Details */}
                <div>
                  <h3 className="font-semibold mb-2">Operation Details</h3>
                  <dl className="grid grid-cols-2 gap-2 text-sm">
                    <dt className="text-muted-foreground">Timestamp:</dt>
                    <dd className="font-mono">{formatDate(selectedLog.createdAt)}</dd>

                    <dt className="text-muted-foreground">Operation:</dt>
                    <dd>
                      <code className="bg-muted px-2 py-1 rounded">{selectedLog.operation}</code>
                    </dd>

                    <dt className="text-muted-foreground">Resource Type:</dt>
                    <dd>
                      <Badge variant="outline">{selectedLog.resourceType}</Badge>
                    </dd>

                    <dt className="text-muted-foreground">Resource ID:</dt>
                    <dd className="font-mono">{selectedLog.resourceId || 'N/A'}</dd>

                    <dt className="text-muted-foreground">HTTP Method:</dt>
                    <dd>
                      <span
                        className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded ${getMethodBadgeColor(selectedLog.httpMethod)}`}
                      >
                        {selectedLog.httpMethod}
                      </span>
                    </dd>

                    <dt className="text-muted-foreground">HTTP Status:</dt>
                    <dd>
                      <Badge variant={getStatusBadgeVariant(selectedLog.httpStatus)}>
                        {selectedLog.httpStatus}
                      </Badge>
                    </dd>

                    <dt className="text-muted-foreground">Token Prefix:</dt>
                    <dd className="font-mono">{selectedLog.tokenPrefix || 'N/A'}</dd>

                    <dt className="text-muted-foreground">IP Address:</dt>
                    <dd className="font-mono">{selectedLog.ipAddress || 'N/A'}</dd>

                    <dt className="text-muted-foreground">User Agent:</dt>
                    <dd className="font-mono text-xs break-all">
                      {selectedLog.userAgent || 'N/A'}
                    </dd>
                  </dl>
                </div>

                {/* Request Body */}
                <div>
                  <h3 className="font-semibold mb-2">Request Body</h3>
                  <pre className="bg-muted p-3 rounded text-xs overflow-x-auto">
                    {selectedLog.requestBody
                      ? JSON.stringify(selectedLog.requestBody, null, 2)
                      : 'No request body'}
                  </pre>
                </div>

                {/* Response Body */}
                <div>
                  <h3 className="font-semibold mb-2">Response Body</h3>
                  <pre className="bg-muted p-3 rounded text-xs overflow-x-auto">
                    {selectedLog.responseBody
                      ? JSON.stringify(selectedLog.responseBody, null, 2)
                      : 'No response body'}
                  </pre>
                </div>
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
