'use client';

import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TokenGenerationForm } from '@/components/admin/scim/TokenGenerationForm';
import { TokenListTable } from '@/components/admin/scim/TokenListTable';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, Info } from 'lucide-react';

export default function SCIMTokensPage() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const params = useParams();
  const orgId = params.orgId as string;

  const handleTokenGenerated = () => {
    // Trigger refresh of the token list
    setRefreshTrigger((prev) => prev + 1);
  };

  return (
    <div className="container mx-auto py-8 space-y-8">
      {/* Page Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <Shield className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">SCIM Bearer Tokens</h1>
        </div>
        <p className="text-muted-foreground">
          Manage bearer tokens for SCIM 2.0 provisioning. Generate tokens for your Identity Provider
          (Okta, Azure AD, Google Workspace) to automatically provision users.
        </p>
      </div>

      {/* Info Alert */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          <strong>Important:</strong> Bearer tokens are displayed only once at generation. Copy and store them
          securely in your Identity Provider's SCIM configuration. For security, we recommend setting
          tokens to expire every 90 days and rotating them regularly.
        </AlertDescription>
      </Alert>

      {/* SCIM Base URL Card */}
      <Card>
        <CardHeader>
          <CardTitle>SCIM Configuration</CardTitle>
          <CardDescription>Use these details to configure SCIM provisioning in your IdP</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium text-muted-foreground">SCIM Base URL</label>
              <div className="mt-1 p-3 bg-muted rounded-md font-mono text-sm break-all">
                https://api.marketsage.ai/scim/v2
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Authentication</label>
              <div className="mt-1 p-3 bg-muted rounded-md text-sm">
                Bearer Token (generate below)
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Token Generation Form */}
      <TokenGenerationForm orgId={orgId} onTokenGenerated={handleTokenGenerated} />

      {/* Token List Table */}
      <TokenListTable orgId={orgId} refreshTrigger={refreshTrigger} />
    </div>
  );
}
