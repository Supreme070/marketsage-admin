import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';

/**
 * User session interface
 */
export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: string;
}

/**
 * Permissions interface matching AdminProvider
 */
export interface AdminPermissions {
  canViewAdmin: boolean;
  canViewUsers: boolean;
  canManageUsers: boolean;
  canManageSubscriptions: boolean;
  canManageCampaigns: boolean;
  canViewAnalytics: boolean;
  canAccessAI: boolean;
  canAccessSecurity: boolean;
  canViewAudit: boolean;
  canAccessSupport: boolean;
  canManageIncidents: boolean;
  canAccessSystem: boolean;
}

/**
 * Admin handler context
 */
export interface AdminHandlerContext {
  user: AdminUser;
  permissions: AdminPermissions;
  req: NextRequest;
}

/**
 * Admin handler function type
 */
export type AdminHandler = (
  req: NextRequest,
  context: AdminHandlerContext
) => Promise<Response>;

/**
 * Get permissions based on user role
 */
function getPermissionsFromRole(role: string): AdminPermissions {
  const isSuperAdmin = role === 'SUPER_ADMIN';
  const isAdmin = role === 'ADMIN' || isSuperAdmin;

  return {
    canViewAdmin: isAdmin,
    canViewUsers: isAdmin,
    canManageUsers: isSuperAdmin,
    canManageSubscriptions: isSuperAdmin,
    canManageCampaigns: isAdmin,
    canViewAnalytics: isAdmin,
    canAccessAI: isSuperAdmin,
    canAccessSecurity: isSuperAdmin,
    canViewAudit: isAdmin,
    canAccessSupport: isAdmin,
    canManageIncidents: isAdmin,
    canAccessSystem: isSuperAdmin,
  };
}

/**
 * Create an authenticated admin API handler
 *
 * @param handler - Handler function to execute
 * @param requiredPermission - Optional specific permission check
 * @returns Next.js API route handler
 */
export function createAdminHandler(
  handler: AdminHandler,
  requiredPermission?: keyof AdminPermissions
) {
  return async (req: NextRequest): Promise<Response> => {
    try {
      // Get session
      const session = await getServerSession(authOptions);

      if (!session?.user) {
        return Response.json(
          {
            success: false,
            error: {
              code: 'UNAUTHORIZED',
              message: 'Authentication required',
              timestamp: new Date().toISOString(),
            },
          },
          { status: 401 }
        );
      }

      // Build user and permissions
      const user: AdminUser = {
        id: session.user.id || (session.user as any).sub || '',
        email: session.user.email || '',
        name: session.user.name || '',
        role: (session.user as any).role || 'USER',
      };

      const permissions = getPermissionsFromRole(user.role);

      // Check if user has admin access
      if (!permissions.canViewAdmin) {
        return Response.json(
          {
            success: false,
            error: {
              code: 'FORBIDDEN',
              message: 'Admin access required',
              timestamp: new Date().toISOString(),
            },
          },
          { status: 403 }
        );
      }

      // Check specific permission if required
      if (requiredPermission && !permissions[requiredPermission]) {
        return Response.json(
          {
            success: false,
            error: {
              code: 'INSUFFICIENT_PERMISSIONS',
              message: `Permission required: ${requiredPermission}`,
              timestamp: new Date().toISOString(),
            },
          },
          { status: 403 }
        );
      }

      // Execute handler
      return await handler(req, { user, permissions, req });
    } catch (error) {
      console.error('[admin-api-middleware] Handler error:', error);

      return Response.json(
        {
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: error instanceof Error ? error.message : 'Internal server error',
            timestamp: new Date().toISOString(),
          },
        },
        { status: 500 }
      );
    }
  };
}

/**
 * Log admin action to backend audit logging API
 *
 * @param user - Admin user performing the action
 * @param action - Action name (e.g., 'CREATE', 'UPDATE', 'DELETE', 'LOGIN')
 * @param resource - Resource being acted upon (e.g., 'user', 'campaign', 'organization')
 * @param metadata - Additional metadata about the action
 */
export async function logAdminAction(
  user: AdminUser,
  action: string,
  resource: string,
  metadata?: any
): Promise<void> {
  try {
    // Console log in development for debugging
    if (process.env.NODE_ENV === 'development') {
      console.log(`[AUDIT] ${user.email} - ${action} on ${resource}`, metadata);
    }

    // Call backend audit logging API
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3006';
    const response = await fetch(`${backendUrl}/admin/audit/log`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action,
        resource,
        userId: user.id,
        userEmail: user.email,
        metadata: {
          ...metadata,
          adminRole: user.role,
          adminName: user.name,
        },
        timestamp: new Date().toISOString(),
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('[admin-api-middleware] Audit logging failed:', {
        status: response.status,
        statusText: response.statusText,
        error: errorData,
      });
    }
  } catch (error) {
    console.error('[admin-api-middleware] Failed to log admin action:', error);
    // Don't throw - logging failures shouldn't break the API
  }
}
