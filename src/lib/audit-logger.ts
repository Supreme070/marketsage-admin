import * as Sentry from '@sentry/nextjs';

export interface AuditEvent {
  action: string; // CREATE, UPDATE, DELETE, VIEW
  resource: string; // users, organizations, campaigns, etc
  resourceId?: string;
  userId: string;
  userEmail: string;
  changes?: {
    before?: any;
    after?: any;
  };
  metadata?: Record<string, any>;
}

class AuditLogger {
  /**
   * Log an admin audit event
   * Sends to both Sentry (for monitoring) and Backend (for storage)
   */
  async log(event: AuditEvent): Promise<void> {
    const logEntry = {
      ...event,
      timestamp: new Date().toISOString(),
      service: 'admin-portal',
      ip: typeof window !== 'undefined' ? await this.getClientIP() : 'server',
    };

    // Send to Sentry as breadcrumb for error context
    Sentry.addBreadcrumb({
      category: 'admin.audit',
      message: `${event.action} ${event.resource}`,
      level: 'info',
      data: logEntry,
    });

    // Also capture as Sentry event for tracking
    Sentry.captureMessage(`Admin Action: ${event.action} ${event.resource}`, {
      level: 'info',
      tags: {
        action: event.action,
        resource: event.resource,
        userId: event.userId,
      },
      extra: logEntry,
    });

    // Send to backend for permanent storage
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/admin/audit/log`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Include auth token from cookie/session
          ...(typeof window !== 'undefined' && this.getAuthHeader()),
        },
        body: JSON.stringify(logEntry),
      });

      if (!response.ok) {
        throw new Error(`Failed to log audit: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Failed to send audit log to backend:', error);
      // Still captured in Sentry above, so we won't lose the event
      Sentry.captureException(error, {
        extra: { auditEvent: logEntry },
      });
    }
  }

  /**
   * Get client IP address (best effort)
   */
  private async getClientIP(): Promise<string> {
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      return data.ip || 'unknown';
    } catch {
      return 'unknown';
    }
  }

  /**
   * Get authorization header if available
   */
  private getAuthHeader(): Record<string, string> {
    // Implement based on your auth mechanism
    // For example, if using NextAuth:
    // const session = await getSession();
    // return { 'Authorization': `Bearer ${session?.accessToken}` };
    return {};
  }
}

// Export singleton instance
export const auditLogger = new AuditLogger();
