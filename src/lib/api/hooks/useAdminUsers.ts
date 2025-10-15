/**
 * Admin Users API Hooks
 * React hooks for admin user management
 */

import { useState, useEffect, useCallback } from 'react';
import { useApiClient } from '../client';

// Types
export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: string;
  organizationId?: string;
  emailVerified?: string | null;
  image?: string;
  isSuspended?: boolean;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
  organization?: {
    id: string;
    name: string;
    plan: string;
  };
}

export interface AdminUserStats {
  total: number;
  active: number;
  suspended: number;
  pending: number;
}

export interface UserQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  role?: string;
  status?: string;
}

export interface UsersResponse {
  users: AdminUser[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// Admin Users Hook
export function useAdminUsers(query?: UserQueryParams) {
  const apiClient = useApiClient();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  });

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams();
      if (query?.page) params.append('page', query.page.toString());
      if (query?.limit) params.append('limit', query.limit.toString());
      if (query?.search) params.append('search', query.search);
      if (query?.role && query.role !== 'all') params.append('role', query.role);
      if (query?.status && query.status !== 'all') params.append('status', query.status);

      const response = await apiClient.get<UsersResponse>(`/users?${params.toString()}`);
      
      if (response.users && response.pagination) {
        setUsers(response.users);
        setPagination({
          page: response.pagination.page,
          limit: response.pagination.limit,
          total: response.pagination.total,
          pages: response.pagination.pages
        });
      } else {
        setError('Invalid response format');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [apiClient, query]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const refreshUsers = useCallback(() => {
    fetchUsers();
  }, [fetchUsers]);

  const suspendUser = useCallback(async (userId: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiClient.post(`/users/admin/suspend/${userId}`);
      
      if (response.success) {
        await fetchUsers(); // Refresh the list
        return response.data;
      } else {
        setError(response.error?.message || 'Failed to suspend user');
        throw new Error(response.error?.message || 'Failed to suspend user');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [apiClient, fetchUsers]);

  const activateUser = useCallback(async (userId: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiClient.post(`/users/admin/activate/${userId}`);

      if (response.success) {
        await fetchUsers(); // Refresh the list
        return response.data;
      } else {
        setError(response.error?.message || 'Failed to activate user');
        throw new Error(response.error?.message || 'Failed to activate user');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [apiClient, fetchUsers]);

  const bulkSuspendUsers = useCallback(async (userIds: string[]) => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiClient.post(`/users/admin/bulk-suspend`, { userIds });

      if (response.success) {
        await fetchUsers(); // Refresh the list
        return response.data;
      } else {
        setError(response.error?.message || 'Failed to bulk suspend users');
        throw new Error(response.error?.message || 'Failed to bulk suspend users');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [apiClient, fetchUsers]);

  const bulkActivateUsers = useCallback(async (userIds: string[]) => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiClient.post(`/users/admin/bulk-activate`, { userIds });

      if (response.success) {
        await fetchUsers(); // Refresh the list
        return response.data;
      } else {
        setError(response.error?.message || 'Failed to bulk activate users');
        throw new Error(response.error?.message || 'Failed to bulk activate users');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [apiClient, fetchUsers]);

  const updateUserRole = useCallback(async (userId: string, role: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiClient.patch(`/users/${userId}`, { role });

      if (response.success) {
        await fetchUsers(); // Refresh the list
        return response.data;
      } else {
        setError(response.error?.message || 'Failed to update user role');
        throw new Error(response.error?.message || 'Failed to update user role');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [apiClient, fetchUsers]);

  const resetUserPassword = useCallback(async (userId: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiClient.post(`/users/admin/reset-password/${userId}`);

      if (response.success) {
        await fetchUsers(); // Refresh the list
        return response.data;
      } else {
        setError(response.error?.message || 'Failed to reset password');
        throw new Error(response.error?.message || 'Failed to reset password');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [apiClient, fetchUsers]);

  const forceLogout = useCallback(async (userId: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiClient.post(`/users/admin/force-logout/${userId}`);

      if (response.success) {
        await fetchUsers(); // Refresh the list
        return response.data;
      } else {
        setError(response.error?.message || 'Failed to force logout user');
        throw new Error(response.error?.message || 'Failed to force logout user');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [apiClient, fetchUsers]);

  const forceLogoutAll = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiClient.post('/users/admin/force-logout-all');

      if (response.success) {
        await fetchUsers(); // Refresh the list
        return response.data;
      } else {
        setError(response.error?.message || 'Failed to force logout all users');
        throw new Error(response.error?.message || 'Failed to force logout all users');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [apiClient, fetchUsers]);

  const startImpersonation = useCallback(async (userId: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiClient.post(`/users/admin/impersonate/${userId}`);

      if (response.success) {
        // Store the new access token with impersonation metadata
        if (response.data?.accessToken) {
          localStorage.setItem('accessToken', response.data.accessToken);
        }
        return response.data;
      } else {
        setError(response.error?.message || 'Failed to start impersonation');
        throw new Error(response.error?.message || 'Failed to start impersonation');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [apiClient]);

  const stopImpersonation = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiClient.post('/users/admin/stop-impersonation');

      if (response.success) {
        // Store the new admin access token (without impersonation)
        if (response.data?.accessToken) {
          localStorage.setItem('accessToken', response.data.accessToken);
        }
        await fetchUsers(); // Refresh the list
        return response.data;
      } else {
        setError(response.error?.message || 'Failed to stop impersonation');
        throw new Error(response.error?.message || 'Failed to stop impersonation');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [apiClient, fetchUsers]);

  return {
    users,
    loading,
    error,
    pagination,
    refreshUsers,
    suspendUser,
    activateUser,
    bulkSuspendUsers,
    bulkActivateUsers,
    updateUserRole,
    resetUserPassword,
    forceLogout,
    forceLogoutAll,
    startImpersonation,
    stopImpersonation
  };
}

// Admin User Stats Hook
export function useAdminUserStats() {
  const apiClient = useApiClient();
  const [stats, setStats] = useState<AdminUserStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiClient.get<AdminUserStats>('/users/admin/stats');
      
      if (response) {
        setStats(response);
      } else {
        setError('Failed to fetch user stats');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [apiClient]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return {
    stats,
    loading,
    error,
    fetchStats
  };
}

// User Activity Types
export interface UserActivity {
  id: string;
  adminUserId: string;
  adminEmail: string;
  action: string;
  resource: string;
  resourceId?: string | null;
  details?: any;
  ipAddress?: string | null;
  userAgent?: string | null;
  sessionId?: string | null;
  timestamp: string;
}

export interface UserActivityStats {
  totalActivities: number;
  recentActivityCount: number;
  lastActivity: string | null;
  actionBreakdown: Array<{
    action: string;
    count: number;
  }>;
}

export interface UserActivityFilters {
  action?: string;
  resource?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
}

export interface UserActivityResponse {
  activities: UserActivity[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  stats: UserActivityStats;
}

// User Activity Hook
export function useUserActivity(userId: string, filters?: UserActivityFilters, page: number = 1, limit: number = 50) {
  const apiClient = useApiClient();
  const [activities, setActivities] = useState<UserActivity[]>([]);
  const [stats, setStats] = useState<UserActivityStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0
  });

  const fetchActivity = useCallback(async () => {
    if (!userId) return;

    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('limit', limit.toString());
      if (filters?.action) params.append('action', filters.action);
      if (filters?.resource) params.append('resource', filters.resource);
      if (filters?.dateFrom) params.append('dateFrom', filters.dateFrom);
      if (filters?.dateTo) params.append('dateTo', filters.dateTo);
      if (filters?.search) params.append('search', filters.search);

      const response = await apiClient.get<UserActivityResponse>(
        `/users/admin/activity/${userId}?${params.toString()}`
      );

      if (response.activities && response.pagination && response.stats) {
        setActivities(response.activities);
        setPagination(response.pagination);
        setStats(response.stats);
      } else {
        setError('Invalid response format');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [apiClient, userId, page, limit, filters]);

  useEffect(() => {
    fetchActivity();
  }, [fetchActivity]);

  return {
    activities,
    stats,
    loading,
    error,
    pagination,
    refreshActivity: fetchActivity
  };
}

// Combined Admin Users Dashboard Hook
export function useAdminUsersDashboard(query?: UserQueryParams) {
  const users = useAdminUsers(query);
  const stats = useAdminUserStats();

  const refreshAll = useCallback(() => {
    users.refreshUsers();
    stats.fetchStats();
  }, [users, stats]);

  return {
    users: users.users,
    stats: stats.stats,
    loading: users.loading || stats.loading,
    error: users.error || stats.error,
    pagination: users.pagination,
    refreshAll,
    suspendUser: users.suspendUser,
    activateUser: users.activateUser,
    bulkSuspendUsers: users.bulkSuspendUsers,
    bulkActivateUsers: users.bulkActivateUsers,
    updateUserRole: users.updateUserRole,
    resetUserPassword: users.resetUserPassword,
    forceLogout: users.forceLogout,
    forceLogoutAll: users.forceLogoutAll,
    startImpersonation: users.startImpersonation,
    stopImpersonation: users.stopImpersonation
  };
}

/**
 * Hook for exporting user data (GDPR compliance)
 */
export function useExportUserData() {
  const apiClient = useApiClient();

  const exportUserData = useCallback(async (userId: string, userName: string) => {
    try {
      const response = await apiClient.get(`/users/admin/export/${userId}`);

      if (response.success && response.data) {
        // Create downloadable JSON file
        const blob = new Blob([JSON.stringify(response.data, null, 2)], {
          type: 'application/json'
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `user-data-export-${userName}-${new Date().toISOString()}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        return { success: true };
      } else {
        throw new Error(response.error?.message || 'Failed to export user data');
      }
    } catch (error) {
      console.error('Export user data error:', error);
      throw error;
    }
  }, [apiClient]);

  return { exportUserData };
}
