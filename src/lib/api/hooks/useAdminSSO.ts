'use client';

import { useState, useCallback } from 'react';
import { useApiClient } from '../client';

// ============================================================================
// Types
// ============================================================================

export type SSOProvider = 'SAML' | 'OIDC' | 'OAUTH2';
export type UserRole = 'USER' | 'ADMIN' | 'IT_ADMIN' | 'SUPER_ADMIN';

export interface ConfigureSsoRequest {
  provider: SSOProvider;
  providerName: string;
  enabled?: boolean;

  // SAML Configuration
  samlEntryPoint?: string;
  samlIssuer?: string;
  samlCertificate?: string;
  samlSignatureAlgorithm?: string;
  samlWantAssertionsSigned?: boolean;
  samlCallbackUrl?: string;
  samlLogoutUrl?: string;

  // OIDC Configuration
  oidcIssuer?: string;
  oidcAuthorizationUrl?: string;
  oidcTokenUrl?: string;
  oidcUserinfoUrl?: string;
  oidcClientId?: string;
  oidcClientSecret?: string;
  oidcScope?: string;
  oidcResponseType?: string;
  oidcCallbackUrl?: string;

  // Attribute Mapping
  attributeEmail?: string;
  attributeName?: string;
  attributeFirstName?: string;
  attributeLastName?: string;
  attributeRole?: string;

  // Role Mapping & JIT Provisioning
  roleMapping?: Record<string, UserRole>;
  defaultRole?: UserRole;
  jitProvisioningEnabled?: boolean;
  jitUpdateAttributes?: boolean;

  // Security Settings
  requireSSOOnly?: boolean;
  allowedDomains?: string;
  sessionMaxAge?: number;
  enforceEmailVerification?: boolean;
}

export interface SSOConfiguration {
  id: string;
  organizationId: string;
  provider: SSOProvider;
  providerName: string;
  enabled: boolean;

  // SAML fields
  samlEntryPoint?: string;
  samlIssuer?: string;
  samlCertificate?: string; // Masked as ***REDACTED***
  samlSignatureAlgorithm?: string;
  samlWantAssertionsSigned?: boolean;
  samlCallbackUrl?: string;
  samlLogoutUrl?: string;

  // OIDC fields
  oidcIssuer?: string;
  oidcAuthorizationUrl?: string;
  oidcTokenUrl?: string;
  oidcUserinfoUrl?: string;
  oidcClientId?: string;
  oidcClientSecret?: string; // Masked as ***REDACTED***
  oidcScope?: string;
  oidcResponseType?: string;
  oidcCallbackUrl?: string;

  // Attribute mapping
  attributeEmail?: string;
  attributeName?: string;
  attributeFirstName?: string;
  attributeLastName?: string;
  attributeRole?: string;

  // Role mapping & JIT provisioning
  roleMapping?: any;
  defaultRole: UserRole;
  jitProvisioningEnabled: boolean;
  jitUpdateAttributes: boolean;

  // Security settings
  requireSSOOnly: boolean;
  allowedDomains?: string;
  sessionMaxAge: number;
  enforceEmailVerification: boolean;

  // Metadata
  createdAt: string;
  updatedAt: string;
  configuredBy?: string;
  lastTestedAt?: string;
  lastLoginAt?: string;
  totalLogins: number;
}

export interface TestSsoRequest {
  testEmail?: string;
}

export interface TestSsoResponse {
  success: boolean;
  message: string;
  details: any;
  warnings?: string[];
}

export interface UpdateSsoStatusRequest {
  enabled: boolean;
}

export interface SSOAuditLog {
  id: string;
  organizationId: string;
  userId?: string;
  email: string;
  provider: SSOProvider;
  event: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: any;
  createdAt: string;
}

export interface SSOAuditLogsParams {
  userId?: string;
  email?: string;
  event?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export interface SSOAuditLogsResponse {
  logs: SSOAuditLog[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  warningMessage?: string;
}

// ============================================================================
// Hook: useConfigureSSO
// ============================================================================

export function useConfigureSSO(orgId: string) {
  const apiClient = useApiClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [configuration, setConfiguration] = useState<SSOConfiguration | null>(null);

  const configure = useCallback(
    async (request: ConfigureSsoRequest) => {
      setLoading(true);
      setError(null);
      try {
        const response = await apiClient.post<ApiResponse<SSOConfiguration>>(
          `/admin/organizations/${orgId}/sso/configure`,
          request
        );
        if (response.success && response.data) {
          setConfiguration(response.data);
          return response.data;
        } else {
          throw new Error(response.message || 'Failed to configure SSO');
        }
      } catch (err: any) {
        const errorMsg = err.response?.data?.message || err.message || 'Failed to configure SSO';
        setError(errorMsg);
        throw new Error(errorMsg);
      } finally {
        setLoading(false);
      }
    },
    [apiClient, orgId]
  );

  return { configure, configuration, loading, error };
}

// ============================================================================
// Hook: useGetSSOConfiguration
// ============================================================================

export function useGetSSOConfiguration(orgId: string) {
  const apiClient = useApiClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [configuration, setConfiguration] = useState<SSOConfiguration | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.get<ApiResponse<SSOConfiguration>>(
        `/admin/organizations/${orgId}/sso/configuration`
      );
      if (response.success && response.data) {
        setConfiguration(response.data);
        return response.data;
      } else {
        setConfiguration(null);
        return null;
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || err.message || 'Failed to fetch SSO configuration';
      setError(errorMsg);
      setConfiguration(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, [apiClient, orgId]);

  return { fetch, configuration, loading, error };
}

// ============================================================================
// Hook: useTestSSOConnection
// ============================================================================

export function useTestSSOConnection(orgId: string) {
  const apiClient = useApiClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<TestSsoResponse | null>(null);

  const test = useCallback(
    async (request?: TestSsoRequest) => {
      setLoading(true);
      setError(null);
      try {
        const response = await apiClient.post<TestSsoResponse>(
          `/admin/organizations/${orgId}/sso/test`,
          request || {}
        );
        setTestResult(response);
        return response;
      } catch (err: any) {
        const errorMsg = err.response?.data?.message || err.message || 'SSO connection test failed';
        setError(errorMsg);
        const failedResult: TestSsoResponse = {
          success: false,
          message: errorMsg,
          details: {},
        };
        setTestResult(failedResult);
        return failedResult;
      } finally {
        setLoading(false);
      }
    },
    [apiClient, orgId]
  );

  return { test, testResult, loading, error };
}

// ============================================================================
// Hook: useUpdateSSOStatus
// ============================================================================

export function useUpdateSSOStatus(orgId: string) {
  const apiClient = useApiClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateStatus = useCallback(
    async (enabled: boolean) => {
      setLoading(true);
      setError(null);
      try {
        const response = await apiClient.put<ApiResponse<void>>(
          `/admin/organizations/${orgId}/sso/status`,
          { enabled }
        );
        if (response.success) {
          return true;
        } else {
          throw new Error(response.message || 'Failed to update SSO status');
        }
      } catch (err: any) {
        const errorMsg = err.response?.data?.message || err.message || 'Failed to update SSO status';
        setError(errorMsg);
        throw new Error(errorMsg);
      } finally {
        setLoading(false);
      }
    },
    [apiClient, orgId]
  );

  return { updateStatus, loading, error };
}

// ============================================================================
// Hook: useDeleteSSOConfiguration
// ============================================================================

export function useDeleteSSOConfiguration(orgId: string) {
  const apiClient = useApiClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const deleteConfig = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.delete<ApiResponse<void>>(
        `/admin/organizations/${orgId}/sso/configuration`
      );
      if (response.success) {
        return { success: true, warningMessage: response.warningMessage };
      } else {
        throw new Error(response.message || 'Failed to delete SSO configuration');
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || err.message || 'Failed to delete SSO configuration';
      setError(errorMsg);
      throw new Error(errorMsg);
    } finally {
      setLoading(false);
    }
  }, [apiClient, orgId]);

  return { deleteConfig, loading, error };
}

// ============================================================================
// Hook: useGetSSOAuditLogs
// ============================================================================

export function useGetSSOAuditLogs(orgId: string) {
  const apiClient = useApiClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [logs, setLogs] = useState<SSOAuditLog[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });

  const fetch = useCallback(
    async (params?: SSOAuditLogsParams) => {
      setLoading(true);
      setError(null);
      try {
        const queryParams = new URLSearchParams();
        if (params?.userId) queryParams.append('userId', params.userId);
        if (params?.email) queryParams.append('email', params.email);
        if (params?.event) queryParams.append('event', params.event);
        if (params?.startDate) queryParams.append('startDate', params.startDate);
        if (params?.endDate) queryParams.append('endDate', params.endDate);
        if (params?.page) queryParams.append('page', params.page.toString());
        if (params?.limit) queryParams.append('limit', params.limit.toString());

        const url = `/admin/organizations/${orgId}/sso/audit-logs${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
        const response = await apiClient.get<ApiResponse<SSOAuditLogsResponse>>(url);

        if (response.success && response.data) {
          setLogs(response.data.logs);
          setPagination(response.data.pagination);
          return response.data;
        } else {
          throw new Error(response.message || 'Failed to fetch SSO audit logs');
        }
      } catch (err: any) {
        const errorMsg = err.response?.data?.message || err.message || 'Failed to fetch SSO audit logs';
        setError(errorMsg);
        setLogs([]);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [apiClient, orgId]
  );

  return { fetch, logs, pagination, loading, error };
}
