import { useState, useCallback } from 'react';
import { useApiClient } from '../client';

// ============================================================================
// TypeScript Interfaces
// ============================================================================

export interface SCIMToken {
  id: string;
  organizationId: string;
  name: string;
  tokenPrefix: string;
  expiresAt: string | null;
  lastUsedAt: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface GenerateSCIMTokenRequest {
  name: string;
  expiresInDays?: number;
}

export interface GenerateSCIMTokenResponse {
  success: boolean;
  message: string;
  data: {
    token: SCIMToken;
    plainTextToken: string; // Only returned once at creation
  };
}

export interface ListSCIMTokensResponse {
  success: boolean;
  message: string;
  data: {
    tokens: SCIMToken[];
    total: number;
  };
}

export interface RevokeSCIMTokenResponse {
  success: boolean;
  message: string;
}

export interface SCIMProvisionedUser {
  id: string;
  organizationId: string;
  scimId: string;
  externalId: string;
  userName: string;
  displayName: string | null;
  active: boolean;
  emails: Array<{
    value: string;
    type: string;
    primary: boolean;
  }>;
  userId: string | null;
  user?: {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
    role: string;
  };
  groups: Array<{
    value: string;
    display: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

export interface ListProvisionedUsersResponse {
  success: boolean;
  message: string;
  data: {
    users: SCIMProvisionedUser[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
}

export interface SCIMAuditLog {
  id: string;
  organizationId: string;
  operation: string;
  resourceType: string;
  resourceId: string | null;
  httpMethod: string;
  httpStatus: number;
  requestBody: any;
  responseBody: any;
  tokenPrefix: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
}

export interface ListSCIMAuditLogsResponse {
  success: boolean;
  message: string;
  data: {
    auditLogs: SCIMAuditLog[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
}

// ============================================================================
// Hook: Generate SCIM Token
// ============================================================================

export function useGenerateSCIMToken(orgId: string) {
  const apiClient = useApiClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [token, setToken] = useState<GenerateSCIMTokenResponse['data'] | null>(null);

  const generateToken = useCallback(
    async (request: GenerateSCIMTokenRequest) => {
      setLoading(true);
      setError(null);
      setToken(null);

      try {
        const response = await apiClient.post<GenerateSCIMTokenResponse>(
          `/admin/organizations/${orgId}/scim/tokens`,
          request
        );

        if (response.success) {
          setToken(response.data);
          return response.data;
        } else {
          throw new Error(response.message || 'Failed to generate SCIM token');
        }
      } catch (err: any) {
        const errorMessage = err.message || 'Failed to generate SCIM token';
        setError(errorMessage);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [apiClient, orgId]
  );

  const resetToken = useCallback(() => {
    setToken(null);
    setError(null);
  }, []);

  return {
    generateToken,
    resetToken,
    token,
    loading,
    error,
  };
}

// ============================================================================
// Hook: List SCIM Tokens
// ============================================================================

export function useListSCIMTokens(orgId: string, includeInactive: boolean = false) {
  const apiClient = useApiClient();
  const [tokens, setTokens] = useState<SCIMToken[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTokens = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const queryParams = includeInactive ? '?includeInactive=true' : '';
      const response = await apiClient.get<ListSCIMTokensResponse>(
        `/admin/organizations/${orgId}/scim/tokens${queryParams}`
      );

      if (response.success) {
        setTokens(response.data.tokens);
        setTotal(response.data.total);
      } else {
        throw new Error(response.message || 'Failed to fetch SCIM tokens');
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to fetch SCIM tokens';
      setError(errorMessage);
      setTokens([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [apiClient, orgId, includeInactive]);

  return {
    tokens,
    total,
    loading,
    error,
    refreshTokens: fetchTokens,
  };
}

// ============================================================================
// Hook: Revoke SCIM Token
// ============================================================================

export function useRevokeSCIMToken(orgId: string) {
  const apiClient = useApiClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const revokeToken = useCallback(
    async (tokenId: string) => {
      setLoading(true);
      setError(null);

      try {
        const response = await apiClient.delete<RevokeSCIMTokenResponse>(
          `/admin/organizations/${orgId}/scim/tokens/${tokenId}`
        );

        if (response.success) {
          return true;
        } else {
          throw new Error(response.message || 'Failed to revoke SCIM token');
        }
      } catch (err: any) {
        const errorMessage = err.message || 'Failed to revoke SCIM token';
        setError(errorMessage);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [apiClient, orgId]
  );

  return {
    revokeToken,
    loading,
    error,
  };
}

// ============================================================================
// Hook: List Provisioned Users
// ============================================================================

export interface ListProvisionedUsersParams {
  page?: number;
  limit?: number;
}

export function useListProvisionedUsers(orgId: string, params: ListProvisionedUsersParams = {}) {
  const apiClient = useApiClient();
  const [users, setUsers] = useState<SCIMProvisionedUser[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = useCallback(
    async (fetchParams?: ListProvisionedUsersParams) => {
      setLoading(true);
      setError(null);

      try {
        const queryParams = new URLSearchParams();
        const page = fetchParams?.page ?? params.page ?? 1;
        const limit = fetchParams?.limit ?? params.limit ?? 10;

        queryParams.append('page', page.toString());
        queryParams.append('limit', limit.toString());

        const response = await apiClient.get<ListProvisionedUsersResponse>(
          `/admin/organizations/${orgId}/scim/users?${queryParams.toString()}`
        );

        if (response.success) {
          setUsers(response.data.users);
          setPagination(response.data.pagination);
        } else {
          throw new Error(response.message || 'Failed to fetch provisioned users');
        }
      } catch (err: any) {
        const errorMessage = err.message || 'Failed to fetch provisioned users';
        setError(errorMessage);
        setUsers([]);
        setPagination({ page: 1, limit: 10, total: 0, totalPages: 0 });
      } finally {
        setLoading(false);
      }
    },
    [apiClient, orgId, params.page, params.limit]
  );

  return {
    users,
    pagination,
    loading,
    error,
    refreshUsers: fetchUsers,
  };
}

// ============================================================================
// Hook: Get SCIM Audit Logs
// ============================================================================

export interface GetSCIMAuditLogsParams {
  page?: number;
  limit?: number;
}

export function useSCIMAuditLogs(orgId: string, params: GetSCIMAuditLogsParams = {}) {
  const apiClient = useApiClient();
  const [auditLogs, setAuditLogs] = useState<SCIMAuditLog[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAuditLogs = useCallback(
    async (fetchParams?: GetSCIMAuditLogsParams) => {
      setLoading(true);
      setError(null);

      try {
        const queryParams = new URLSearchParams();
        const page = fetchParams?.page ?? params.page ?? 1;
        const limit = fetchParams?.limit ?? params.limit ?? 10;

        queryParams.append('page', page.toString());
        queryParams.append('limit', limit.toString());

        const response = await apiClient.get<ListSCIMAuditLogsResponse>(
          `/admin/organizations/${orgId}/scim/audit-logs?${queryParams.toString()}`
        );

        if (response.success) {
          setAuditLogs(response.data.auditLogs);
          setPagination(response.data.pagination);
        } else {
          throw new Error(response.message || 'Failed to fetch SCIM audit logs');
        }
      } catch (err: any) {
        const errorMessage = err.message || 'Failed to fetch SCIM audit logs';
        setError(errorMessage);
        setAuditLogs([]);
        setPagination({ page: 1, limit: 10, total: 0, totalPages: 0 });
      } finally {
        setLoading(false);
      }
    },
    [apiClient, orgId, params.page, params.limit]
  );

  return {
    auditLogs,
    pagination,
    loading,
    error,
    refreshAuditLogs: fetchAuditLogs,
  };
}
