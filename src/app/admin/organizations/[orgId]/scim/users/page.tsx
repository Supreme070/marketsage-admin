'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import { ProvisionedUsersTable } from '@/components/admin/scim/ProvisionedUsersTable';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Users, Info } from 'lucide-react';

export default function SCIMUsersPage() {
  const params = useParams();
  const orgId = params.orgId as string;

  return (
    <div className="container mx-auto py-8 space-y-8">
      {/* Page Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <Users className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">SCIM Provisioned Users</h1>
        </div>
        <p className="text-muted-foreground">
          View and manage users automatically provisioned from your Identity Provider via SCIM 2.0 protocol.
        </p>
      </div>

      {/* Info Alert */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          These users were automatically created by your Identity Provider (Okta, Azure AD, Google Workspace, etc.)
          through SCIM provisioning. Changes to user status and group memberships should be made in your IdP,
          and they will sync automatically to MarketSage.
        </AlertDescription>
      </Alert>

      {/* User Statistics Card */}
      <Card>
        <CardHeader>
          <CardTitle>Provisioning Overview</CardTitle>
          <CardDescription>Real-time synchronization status with your Identity Provider</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">SCIM Protocol</p>
              <p className="text-2xl font-bold">v2.0</p>
            </div>
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">Sync Status</p>
              <p className="text-2xl font-bold text-green-600">Active</p>
            </div>
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">Last Sync</p>
              <p className="text-2xl font-bold">Real-time</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Provisioned Users Table */}
      <ProvisionedUsersTable orgId={orgId} />
    </div>
  );
}
