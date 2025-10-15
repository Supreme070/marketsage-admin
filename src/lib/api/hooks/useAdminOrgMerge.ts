/**
 * Admin Organization Merge & Transfer Hooks
 * React hooks for managing organization merges and user transfers
 */

import { useState, useCallback } from 'react';
import { useApiClient } from '../client';

// Types
export interface MergeOrganizationsRequest {
  sourceOrgId: string;
  targetOrgId: string;
  reason: string;
}

export interface TransferUsersRequest {
  userIds: string[];
  targetOrgId: string;
  reason: string;
}

export interface MergeResult {
  sourceOrganization: {
    id: string;
    name: string;
  };
  targetOrganization: {
    id: string;
    name: string;
  };
  totalRecordsTransferred: number;
  transferDetails: Array<{
    table: string;
    recordsTransferred: number;
  }>;
  reason: string;
  performedBy: string;
  timestamp: string;
}

export interface TransferUsersResult {
  targetOrganization: {
    id: string;
    name: string;
  };
  usersTransferred: number;
  userDetails: Array<{
    id: string;
    email: string;
    name: string | null;
    fromOrganization: string;
    fromOrganizationId: string | null;
  }>;
  reason: string;
  performedBy: string;
  timestamp: string;
}

/**
 * Hook for merging two organizations
 *
 * This is a DANGEROUS operation that:
 * - Transfers ALL data from source to target organization
 * - Deletes the source organization
 * - Updates 25+ database tables
 * - Cannot be undone
 *
 * Use with extreme caution - requires admin confirmation
 */
export function useMergeOrganizations() {
  const apiClient = useApiClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<MergeResult | null>(null);

  const mergeOrganizations = useCallback(async (
    request: MergeOrganizationsRequest
  ): Promise<MergeResult> => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await apiClient.post<MergeResult>(
        '/admin/organizations/merge',
        request
      );

      setResult(response);
      return response;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to merge organizations';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [apiClient]);

  const reset = useCallback(() => {
    setError(null);
    setResult(null);
    setLoading(false);
  }, []);

  return {
    mergeOrganizations,
    loading,
    error,
    result,
    reset,
  };
}

/**
 * Hook for transferring users between organizations
 *
 * This operation:
 * - Moves specified users to target organization
 * - Updates user's organizationId
 * - User's related data automatically follows
 * - Creates audit trail
 */
export function useTransferUsers() {
  const apiClient = useApiClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<TransferUsersResult | null>(null);

  const transferUsers = useCallback(async (
    request: TransferUsersRequest
  ): Promise<TransferUsersResult> => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await apiClient.post<TransferUsersResult>(
        '/admin/organizations/transfer-users',
        request
      );

      setResult(response);
      return response;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to transfer users';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [apiClient]);

  const reset = useCallback(() => {
    setError(null);
    setResult(null);
    setLoading(false);
  }, []);

  return {
    transferUsers,
    loading,
    error,
    result,
    reset,
  };
}

/**
 * Combined hook for organization merge and transfer operations
 */
export function useOrganizationManagement() {
  const merge = useMergeOrganizations();
  const transfer = useTransferUsers();

  return {
    // Merge operations
    mergeOrganizations: merge.mergeOrganizations,
    mergeLoading: merge.loading,
    mergeError: merge.error,
    mergeResult: merge.result,
    resetMerge: merge.reset,

    // Transfer operations
    transferUsers: transfer.transferUsers,
    transferLoading: transfer.loading,
    transferError: transfer.error,
    transferResult: transfer.result,
    resetTransfer: transfer.reset,

    // Combined state
    isLoading: merge.loading || transfer.loading,
    hasError: Boolean(merge.error || transfer.error),
  };
}
