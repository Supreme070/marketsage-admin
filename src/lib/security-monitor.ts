'use client';

import * as Sentry from '@sentry/nextjs';

/**
 * Admin Portal Security Monitor
 * Tracks and reports security-related events in real-time
 * Integrates with Sentry for alerting
 */

interface SecurityEvent {
  type: 'failed_login' | 'rapid_actions' | 'suspicious_activity' | 'unauthorized_access' | 'data_export' | 'bulk_delete';
  severity: 'low' | 'medium' | 'high' | 'critical';
  userId?: string;
  userEmail?: string;
  resource?: string;
  details: Record<string, any>;
  timestamp: number;
}

class SecurityMonitor {
  private events: SecurityEvent[] = [];
  private actionTimestamps: number[] = [];
  private readonly MAX_EVENTS = 100;
  private readonly RAPID_ACTION_THRESHOLD = 10; // 10 actions in 10 seconds
  private readonly RAPID_ACTION_WINDOW = 10000; // 10 seconds

  /**
   * Track a security event
   */
  trackEvent(event: Omit<SecurityEvent, 'timestamp'>): void {
    const fullEvent: SecurityEvent = {
      ...event,
      timestamp: Date.now(),
    };

    // Store event
    this.events.push(fullEvent);
    if (this.events.length > this.MAX_EVENTS) {
      this.events.shift();
    }

    // Send to Sentry based on severity
    if (event.severity === 'critical' || event.severity === 'high') {
      Sentry.captureMessage(`Security Event: ${event.type}`, {
        level: event.severity === 'critical' ? 'fatal' : 'error',
        tags: {
          security_event: event.type,
          severity: event.severity,
          userId: event.userId || 'unknown',
        },
        extra: {
          ...event.details,
          userEmail: event.userEmail,
          resource: event.resource,
        },
      });
    }

    // Add breadcrumb for context
    Sentry.addBreadcrumb({
      category: 'security',
      message: `${event.type}: ${event.resource || 'N/A'}`,
      level: event.severity === 'critical' ? 'fatal' : event.severity === 'high' ? 'error' : 'warning',
      data: event.details,
    });

    // Send to backend
    this.sendToBackend(fullEvent);
  }

  /**
   * Track failed login attempt
   */
  trackFailedLogin(email: string, ipAddress?: string): void {
    this.trackEvent({
      type: 'failed_login',
      severity: 'medium',
      userEmail: email,
      details: {
        ipAddress,
        timestamp: new Date().toISOString(),
      },
    });
  }

  /**
   * Track rapid successive actions (potential bot/automation)
   */
  trackAction(): boolean {
    const now = Date.now();
    this.actionTimestamps.push(now);

    // Clean old timestamps
    this.actionTimestamps = this.actionTimestamps.filter(
      (timestamp) => now - timestamp < this.RAPID_ACTION_WINDOW
    );

    // Check if threshold exceeded
    if (this.actionTimestamps.length >= this.RAPID_ACTION_THRESHOLD) {
      this.trackEvent({
        type: 'rapid_actions',
        severity: 'high',
        details: {
          actionCount: this.actionTimestamps.length,
          timeWindow: this.RAPID_ACTION_WINDOW / 1000,
          message: 'Detected rapid successive actions - possible automation',
        },
      });

      // Clear to avoid spam
      this.actionTimestamps = [];
      return true; // Suspicious
    }

    return false;
  }

  /**
   * Track unauthorized access attempt
   */
  trackUnauthorizedAccess(userId: string, resource: string, action: string): void {
    this.trackEvent({
      type: 'unauthorized_access',
      severity: 'critical',
      userId,
      resource,
      details: {
        action,
        attemptedResource: resource,
        timestamp: new Date().toISOString(),
      },
    });
  }

  /**
   * Track suspicious activity
   */
  trackSuspiciousActivity(userId: string, activity: string, details: Record<string, any>): void {
    this.trackEvent({
      type: 'suspicious_activity',
      severity: 'high',
      userId,
      details: {
        activity,
        ...details,
        timestamp: new Date().toISOString(),
      },
    });
  }

  /**
   * Track sensitive data operations
   */
  trackDataExport(userId: string, userEmail: string, resourceType: string, recordCount: number): void {
    this.trackEvent({
      type: 'data_export',
      severity: 'medium',
      userId,
      userEmail,
      resource: resourceType,
      details: {
        recordCount,
        exportTime: new Date().toISOString(),
      },
    });
  }

  /**
   * Track bulk delete operations
   */
  trackBulkDelete(userId: string, userEmail: string, resourceType: string, deletedCount: number): void {
    this.trackEvent({
      type: 'bulk_delete',
      severity: deletedCount > 100 ? 'critical' : 'high',
      userId,
      userEmail,
      resource: resourceType,
      details: {
        deletedCount,
        deleteTime: new Date().toISOString(),
      },
    });
  }

  /**
   * Get recent events
   */
  getRecentEvents(limit: number = 20): SecurityEvent[] {
    return this.events.slice(-limit);
  }

  /**
   * Send event to backend for permanent storage
   */
  private async sendToBackend(event: SecurityEvent): Promise<void> {
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3006';

    try {
      await fetch(`${backendUrl}/admin/security/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(event),
        keepalive: true,
      });
    } catch (error) {
      // Silently fail - event is still tracked in Sentry
      if (process.env.NODE_ENV === 'development') {
        console.error('Failed to send security event to backend:', error);
      }
    }
  }
}

// Export singleton instance
export const securityMonitor = new SecurityMonitor();

/**
 * React hook for security monitoring
 */
export function useSecurityMonitor() {
  return {
    trackFailedLogin: securityMonitor.trackFailedLogin.bind(securityMonitor),
    trackUnauthorizedAccess: securityMonitor.trackUnauthorizedAccess.bind(securityMonitor),
    trackSuspiciousActivity: securityMonitor.trackSuspiciousActivity.bind(securityMonitor),
    trackDataExport: securityMonitor.trackDataExport.bind(securityMonitor),
    trackBulkDelete: securityMonitor.trackBulkDelete.bind(securityMonitor),
    trackAction: securityMonitor.trackAction.bind(securityMonitor),
    getRecentEvents: securityMonitor.getRecentEvents.bind(securityMonitor),
  };
}
