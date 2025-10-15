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
 * Log admin action (stub - integrates with audit logging)
 *
 * @param user - Admin user performing the action
 * @param action - Action name
 * @param resource - Resource being acted upon
 * @param metadata - Additional metadata
 */
export async function logAdminAction(
  user: AdminUser,
  action: string,
  resource: string,
  metadata?: any
): Promise<void> {
  try {
    // In a real implementation, this would call the audit logging API
    // For now, just console log in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`[AUDIT] ${user.email} - ${action} on ${resource}`, metadata);
    }

    // TODO: Call backend audit logging API
    // await fetch(`${process.env.BACKEND_URL}/admin/audit/log`, {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({
    //     userId: user.id,
    //     action,
    //     resource,
    //     metadata,
    //     timestamp: new Date().toISOString(),
    //   }),
    // });
  } catch (error) {
    console.error('[admin-api-middleware] Failed to log admin action:', error);
    // Don't throw - logging failures shouldn't break the API
  }
}
