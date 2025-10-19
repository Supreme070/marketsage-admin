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
import { AlertTriangle, RefreshCw, ChevronLeft, ChevronRight, User, Mail, Shield } from 'lucide-react';
import { useListProvisionedUsers, type SCIMProvisionedUser } from '@/lib/api/hooks/useAdminSCIM';

// ============================================================================
// Component Props
// ============================================================================

interface ProvisionedUsersTableProps {
  orgId: string;
  initialPage?: number;
  initialLimit?: number;
}

// ============================================================================
// Component
// ============================================================================

export function ProvisionedUsersTable({
  orgId,
  initialPage = 1,
  initialLimit = 10,
}: ProvisionedUsersTableProps) {
  const [page, setPage] = useState(initialPage);
  const [limit] = useState(initialLimit);

  const { users, pagination, loading, error, refreshUsers } = useListProvisionedUsers(orgId, {
    page,
    limit,
  });

  // Fetch users on mount and when page changes
  useEffect(() => {
    refreshUsers({ page, limit });
  }, [refreshUsers, page, limit]);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    try {
      return format(new Date(dateString), 'MMM dd, yyyy HH:mm');
    } catch {
      return 'Invalid date';
    }
  };

  const getPrimaryEmail = (user: SCIMProvisionedUser) => {
    const primaryEmail = user.emails.find((e) => e.primary);
    return primaryEmail?.value || user.emails[0]?.value || 'No email';
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
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>SCIM Provisioned Users</CardTitle>
            <CardDescription>
              {pagination.total} user{pagination.total !== 1 ? 's' : ''} provisioned via SCIM
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={() => refreshUsers({ page, limit })} disabled={loading}>
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
        {loading && users.length === 0 && (
          <div className="flex justify-center items-center py-12">
            <LoadingSpinner className="h-8 w-8" />
            <span className="ml-3 text-muted-foreground">Loading provisioned users...</span>
          </div>
        )}

        {/* Empty State */}
        {!loading && users.length === 0 && (
          <div className="text-center py-12">
            <User className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground">No SCIM-provisioned users found</p>
            <p className="text-sm text-muted-foreground mt-2">
              Users will appear here once your IdP provisions them via SCIM
            </p>
          </div>
        )}

        {/* Table */}
        {users.length > 0 && (
          <>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Display Name</TableHead>
                    <TableHead>Username</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Groups</TableHead>
                    <TableHead>Linked User</TableHead>
                    <TableHead>Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          {user.displayName || <span className="text-muted-foreground">No display name</span>}
                        </div>
                      </TableCell>
                      <TableCell>
                        <code className="text-xs bg-muted px-2 py-1 rounded">{user.userName}</code>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          {getPrimaryEmail(user)}
                        </div>
                      </TableCell>
                      <TableCell>
                        {user.active ? (
                          <Badge variant="default">Active</Badge>
                        ) : (
                          <Badge variant="secondary">Inactive</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {user.groups.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {user.groups.slice(0, 2).map((group, idx) => (
                              <Badge key={idx} variant="outline" className="text-xs">
                                {group.display}
                              </Badge>
                            ))}
                            {user.groups.length > 2 && (
                              <Badge variant="outline" className="text-xs">
                                +{user.groups.length - 2}
                              </Badge>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">No groups</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {user.user ? (
                          <div className="flex items-center gap-2">
                            <Shield className="h-4 w-4 text-green-600" />
                            <div>
                              <p className="text-sm font-medium">
                                {user.user.firstName} {user.user.lastName}
                              </p>
                              <p className="text-xs text-muted-foreground">{user.user.email}</p>
                              <Badge variant="outline" className="text-xs mt-1">
                                {user.user.role}
                              </Badge>
                            </div>
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">Not linked</span>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground">{formatDate(user.createdAt)}</TableCell>
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
                  {pagination.total} users
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
  );
}
