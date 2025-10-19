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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Trash2, AlertTriangle, RefreshCw } from 'lucide-react';
import { useListSCIMTokens, useRevokeSCIMToken, type SCIMToken } from '@/lib/api/hooks/useAdminSCIM';
import { useToast } from '@/components/ui/use-toast';

// ============================================================================
// Component Props
// ============================================================================

interface TokenListTableProps {
  orgId: string;
  includeInactive?: boolean;
  refreshTrigger?: number; // Used to trigger refresh from parent
}

// ============================================================================
// Component
// ============================================================================

export function TokenListTable({ orgId, includeInactive = false, refreshTrigger = 0 }: TokenListTableProps) {
  const { tokens, total, loading, error, refreshTokens } = useListSCIMTokens(orgId, includeInactive);
  const { revokeToken, loading: revoking } = useRevokeSCIMToken(orgId);
  const { toast } = useToast();

  const [tokenToRevoke, setTokenToRevoke] = useState<SCIMToken | null>(null);
  const [showRevokeDialog, setShowRevokeDialog] = useState(false);

  // Fetch tokens on mount and when refreshTrigger changes
  useEffect(() => {
    refreshTokens();
  }, [refreshTokens, refreshTrigger]);

  const handleRevokeClick = (token: SCIMToken) => {
    setTokenToRevoke(token);
    setShowRevokeDialog(true);
  };

  const confirmRevoke = async () => {
    if (!tokenToRevoke) return;

    try {
      await revokeToken(tokenToRevoke.id);

      toast({
        title: 'Token Revoked',
        description: `Token "${tokenToRevoke.name}" has been revoked successfully`,
      });

      // Refresh the list
      refreshTokens();

      // Close dialog
      setShowRevokeDialog(false);
      setTokenToRevoke(null);
    } catch (err: any) {
      toast({
        title: 'Revocation Failed',
        description: err.message || 'Failed to revoke token',
        variant: 'destructive',
      });
    }
  };

  const cancelRevoke = () => {
    setShowRevokeDialog(false);
    setTokenToRevoke(null);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    try {
      return format(new Date(dateString), 'MMM dd, yyyy HH:mm');
    } catch {
      return 'Invalid date';
    }
  };

  const isExpired = (expiresAt: string | null) => {
    if (!expiresAt) return false;
    return new Date(expiresAt) < new Date();
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>SCIM Bearer Tokens</CardTitle>
              <CardDescription>
                {total} token{total !== 1 ? 's' : ''} configured
                {includeInactive && ' (including inactive)'}
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={refreshTokens}
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
          {loading && tokens.length === 0 && (
            <div className="flex justify-center items-center py-12">
              <LoadingSpinner className="h-8 w-8" />
              <span className="ml-3 text-muted-foreground">Loading tokens...</span>
            </div>
          )}

          {/* Empty State */}
          {!loading && tokens.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No SCIM tokens found</p>
              <p className="text-sm text-muted-foreground mt-2">
                Generate a token above to get started with SCIM provisioning
              </p>
            </div>
          )}

          {/* Table */}
          {tokens.length > 0 && (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Token Prefix</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Expires At</TableHead>
                    <TableHead>Last Used</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tokens.map((token) => (
                    <TableRow key={token.id}>
                      <TableCell className="font-medium">{token.name}</TableCell>
                      <TableCell>
                        <code className="text-xs bg-muted px-2 py-1 rounded">
                          {token.tokenPrefix}...
                        </code>
                      </TableCell>
                      <TableCell>
                        {token.active ? (
                          isExpired(token.expiresAt) ? (
                            <Badge variant="destructive">Expired</Badge>
                          ) : (
                            <Badge variant="default">Active</Badge>
                          )
                        ) : (
                          <Badge variant="secondary">Revoked</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {token.expiresAt ? (
                          <span className={isExpired(token.expiresAt) ? 'text-red-600' : ''}>
                            {formatDate(token.expiresAt)}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">Never</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {token.lastUsedAt ? (
                          formatDate(token.lastUsedAt)
                        ) : (
                          <span className="text-muted-foreground">Never used</span>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDate(token.createdAt)}
                      </TableCell>
                      <TableCell className="text-right">
                        {token.active && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRevokeClick(token)}
                            disabled={revoking}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Revoke Confirmation Dialog */}
      <AlertDialog open={showRevokeDialog} onOpenChange={setShowRevokeDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revoke SCIM Token?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to revoke the token <strong>"{tokenToRevoke?.name}"</strong>?
              <br />
              <br />
              This action cannot be undone. Your IdP will no longer be able to provision users using this token.
              You'll need to generate a new token and update your IdP configuration.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={cancelRevoke} disabled={revoking}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmRevoke}
              disabled={revoking}
              className="bg-red-600 hover:bg-red-700"
            >
              {revoking ? 'Revoking...' : 'Revoke Token'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
