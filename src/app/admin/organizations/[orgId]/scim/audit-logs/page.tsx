'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import { AuditLogsTable } from '@/components/admin/scim/AuditLogsTable';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { FileText, Info, Shield } from 'lucide-react';

export default function SCIMAuditLogsPage() {
  const params = useParams();
  const orgId = params.orgId as string;

  return (
    <div className="container mx-auto py-8 space-y-8">
      {/* Page Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <FileText className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">SCIM Audit Logs</h1>
        </div>
        <p className="text-muted-foreground">
          Monitor all SCIM provisioning operations for security, compliance, and troubleshooting purposes.
        </p>
      </div>

      {/* Info Alert */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          All SCIM operations are automatically logged including user provisioning, updates, deprovisioning, and
          group membership changes. Use these logs for security audits, compliance reporting (SOC 2, ISO 27001),
          and debugging IdP integration issues.
        </AlertDescription>
      </Alert>

      {/* Audit Log Features Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-green-600" />
            <CardTitle>Compliance & Security Features</CardTitle>
          </div>
          <CardDescription>Built-in audit trail for enterprise compliance requirements</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm font-medium mb-1">Retention Period</p>
              <p className="text-xs text-muted-foreground">90 days (configurable)</p>
            </div>
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm font-medium mb-1">Operations Logged</p>
              <p className="text-xs text-muted-foreground">All SCIM requests</p>
            </div>
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm font-medium mb-1">Data Captured</p>
              <p className="text-xs text-muted-foreground">Request, Response, IP, Token</p>
            </div>
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm font-medium mb-1">Compliance</p>
              <p className="text-xs text-muted-foreground">SOC 2, ISO 27001, GDPR</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Common Use Cases */}
      <Card>
        <CardHeader>
          <CardTitle>Common Use Cases</CardTitle>
          <CardDescription>How to leverage audit logs effectively</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm">
            <li className="flex items-start gap-2">
              <span className="text-green-600 mt-1">✓</span>
              <div>
                <strong>Security Audits:</strong> Track who was provisioned/deprovisioned and when
              </div>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-600 mt-1">✓</span>
              <div>
                <strong>Troubleshooting:</strong> Debug failed provisioning requests by viewing request/response bodies
              </div>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-600 mt-1">✓</span>
              <div>
                <strong>Compliance Reporting:</strong> Export logs for SOC 2 auditors showing access controls
              </div>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-600 mt-1">✓</span>
              <div>
                <strong>Forensic Analysis:</strong> Investigate security incidents with IP addresses and timestamps
              </div>
            </li>
          </ul>
        </CardContent>
      </Card>

      {/* Audit Logs Table */}
      <AuditLogsTable orgId={orgId} />
    </div>
  );
}
