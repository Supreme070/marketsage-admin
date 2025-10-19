'use client';

import React, { useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { SetupWizardStepper, WizardStep } from '@/components/admin/sso/SetupWizardStepper';
import { useConfigureSSO, useTestSSOConnection, type ConfigureSsoRequest } from '@/lib/api/hooks/useAdminSSO';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertCircle,
  CheckCircle2,
  Copy,
  ExternalLink,
  Info,
  Loader2,
  Shield,
  ArrowLeft,
  ArrowRight,
  Cloud
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ============================================================================
// Validation Schema
// ============================================================================

const azureOIDCSchema = z.object({
  providerName: z.string().min(1, 'Provider name is required'),
  oidcIssuer: z.string().url('Must be a valid URL'),
  oidcClientId: z.string().min(1, 'Client ID is required'),
  oidcClientSecret: z.string().min(1, 'Client Secret is required'),
  tenantId: z.string().min(1, 'Tenant ID is required'),
  attributeEmail: z.string().default('email'),
  attributeName: z.string().default('name'),
  attributeFirstName: z.string().default('given_name'),
  attributeLastName: z.string().default('family_name'),
  defaultRole: z.enum(['USER', 'ADMIN', 'IT_ADMIN', 'SUPER_ADMIN']).default('USER'),
  jitProvisioningEnabled: z.boolean().default(true),
  jitUpdateAttributes: z.boolean().default(true),
  requireSSOOnly: z.boolean().default(false),
  allowedDomains: z.string().optional(),
});

type AzureOIDCFormData = z.infer<typeof azureOIDCSchema>;

// ============================================================================
// Wizard Steps Configuration
// ============================================================================

const WIZARD_STEPS: WizardStep[] = [
  {
    id: 'intro',
    title: 'Azure AD Overview',
    description: 'Getting started',
  },
  {
    id: 'azure-config',
    title: 'Configure Azure AD',
    description: 'Setup in Azure Portal',
  },
  {
    id: 'marketsage-config',
    title: 'MarketSage Settings',
    description: 'Enter OIDC details',
  },
  {
    id: 'test',
    title: 'Test Connection',
    description: 'Verify integration',
  },
  {
    id: 'complete',
    title: 'Complete',
    description: 'Enable SSO',
  },
];

// ============================================================================
// Main Component
// ============================================================================

export default function AzureADSSOSetupPage() {
  const params = useParams();
  const router = useRouter();
  const orgId = params.orgId as string;

  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const { configure, loading: configLoading, error: configError } = useConfigureSSO(orgId);
  const { test: testConnection, loading: testLoading, error: testError } = useTestSSOConnection(orgId);

  const form = useForm<AzureOIDCFormData>({
    resolver: zodResolver(azureOIDCSchema),
    defaultValues: {
      providerName: 'Azure AD',
      attributeEmail: 'email',
      attributeName: 'name',
      attributeFirstName: 'given_name',
      attributeLastName: 'family_name',
      defaultRole: 'USER',
      jitProvisioningEnabled: true,
      jitUpdateAttributes: true,
      requireSSOOnly: false,
      allowedDomains: '',
      tenantId: '',
    },
  });

  // ============================================================================
  // Helper Functions
  // ============================================================================

  const handleCopyToClipboard = useCallback((text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  }, []);

  const markStepComplete = useCallback((step: number) => {
    setCompletedSteps((prev) => {
      if (!prev.includes(step)) {
        return [...prev, step];
      }
      return prev;
    });
  }, []);

  const handleNextStep = useCallback(() => {
    markStepComplete(currentStep);
    setCurrentStep((prev) => Math.min(prev + 1, WIZARD_STEPS.length - 1));
  }, [currentStep, markStepComplete]);

  const handlePrevStep = useCallback(() => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  }, []);

  const handleTestConnection = useCallback(async () => {
    setTestResult(null);
    try {
      const result = await testConnection({});
      setTestResult({
        success: result.success,
        message: result.message,
      });
      if (result.success) {
        markStepComplete(currentStep);
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err.message || 'Connection test failed',
      });
    }
  }, [testConnection, currentStep, markStepComplete]);

  const handleConfigureSSO = useCallback(async (data: AzureOIDCFormData) => {
    try {
      const request: ConfigureSsoRequest = {
        provider: 'OIDC',
        providerName: data.providerName,
        enabled: false, // Will be enabled after testing
        oidcIssuer: data.oidcIssuer,
        oidcAuthorizationUrl: `https://login.microsoftonline.com/${data.tenantId}/oauth2/v2.0/authorize`,
        oidcTokenUrl: `https://login.microsoftonline.com/${data.tenantId}/oauth2/v2.0/token`,
        oidcUserinfoUrl: 'https://graph.microsoft.com/oidc/userinfo',
        oidcClientId: data.oidcClientId,
        oidcClientSecret: data.oidcClientSecret,
        oidcScope: 'openid profile email',
        oidcResponseType: 'code',
        oidcCallbackUrl: `${window.location.origin}/api/auth/sso/callback`,
        attributeEmail: data.attributeEmail,
        attributeName: data.attributeName,
        attributeFirstName: data.attributeFirstName,
        attributeLastName: data.attributeLastName,
        defaultRole: data.defaultRole,
        jitProvisioningEnabled: data.jitProvisioningEnabled,
        jitUpdateAttributes: data.jitUpdateAttributes,
        requireSSOOnly: data.requireSSOOnly,
        allowedDomains: data.allowedDomains || undefined,
        sessionMaxAge: 86400, // 24 hours
        enforceEmailVerification: false,
      };

      await configure(request);
      markStepComplete(currentStep);
      handleNextStep();
    } catch (err) {
      // Error is already handled in the hook
      console.error('Failed to configure SSO:', err);
    }
  }, [configure, currentStep, markStepComplete, handleNextStep]);

  const handleEnableSSO = useCallback(async () => {
    // This would call updateStatus(true) but we'll navigate for now
    router.push(`/admin/organizations/${orgId}`);
  }, [orgId, router]);

  // ============================================================================
  // Step Renderers
  // ============================================================================

  const renderIntroStep = () => (
    <div className="space-y-6">
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          This wizard will guide you through configuring Azure Active Directory (Microsoft Entra ID) OIDC SSO for your organization. The process takes about 10-15 minutes.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Cloud className="h-5 w-5 text-blue-600" />
            What You'll Need
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
              <div>
                <strong>Azure AD Admin Access:</strong> You must have permissions to register applications in Azure AD
              </div>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
              <div>
                <strong>Tenant ID:</strong> Your Azure AD tenant identifier
              </div>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
              <div>
                <strong>Time:</strong> Approximately 10-15 minutes to complete setup
              </div>
            </li>
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Benefits of Azure AD SSO</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start gap-2">
              <Badge variant="outline" className="bg-green-50 text-green-700">Security</Badge>
              <span className="text-sm">Conditional Access & MFA policies</span>
            </div>
            <div className="flex items-start gap-2">
              <Badge variant="outline" className="bg-blue-50 text-blue-700">Integration</Badge>
              <span className="text-sm">Seamless Microsoft 365 integration</span>
            </div>
            <div className="flex items-start gap-2">
              <Badge variant="outline" className="bg-purple-50 text-purple-700">Automation</Badge>
              <span className="text-sm">Automatic user provisioning</span>
            </div>
            <div className="flex items-start gap-2">
              <Badge variant="outline" className="bg-orange-50 text-orange-700">Compliance</Badge>
              <span className="text-sm">Enterprise-grade security compliance</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleNextStep} size="lg">
          Get Started
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );

  const renderAzureConfigStep = () => {
    const redirectUri = `${window.location.origin}/api/auth/sso/callback`;

    return (
      <div className="space-y-6">
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            Follow these steps in the Azure Portal to register MarketSage as an application.
          </AlertDescription>
        </Alert>

        <Card>
          <CardHeader>
            <CardTitle>Step 1: Register Application in Azure AD</CardTitle>
            <CardDescription>Create a new app registration in Azure Portal</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <ol className="space-y-4 list-decimal list-inside">
              <li className="text-sm">
                <strong>Log into Azure Portal</strong>
                <Button
                  variant="link"
                  size="sm"
                  className="ml-2"
                  onClick={() => window.open('https://portal.azure.com/#view/Microsoft_AAD_IAM/ActiveDirectoryMenuBlade/~/Overview', '_blank')}
                >
                  <ExternalLink className="h-3 w-3 mr-1" />
                  Open Azure Portal
                </Button>
              </li>
              <li className="text-sm">
                Navigate to <strong>Azure Active Directory → App registrations → New registration</strong>
              </li>
              <li className="text-sm">
                Enter <strong>Name:</strong> "MarketSage"
              </li>
              <li className="text-sm">
                For <strong>Supported account types:</strong> Select "Accounts in this organizational directory only"
              </li>
              <li className="text-sm">
                Click <strong>Register</strong>
              </li>
            </ol>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Step 2: Configure Redirect URI</CardTitle>
            <CardDescription>Set the callback URL for authentication</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-sm font-medium">Redirect URI</Label>
              <div className="flex gap-2 mt-1">
                <Input value={redirectUri} readOnly className="font-mono text-xs" />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleCopyToClipboard(redirectUri, 'redirectUri')}
                >
                  {copiedField === 'redirectUri' ? (
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            <ol className="space-y-2 list-decimal list-inside text-sm">
              <li>In your app registration, go to <strong>Authentication</strong></li>
              <li>Click <strong>Add a platform → Web</strong></li>
              <li>Paste the Redirect URI above</li>
              <li>Under <strong>Implicit grant</strong>, check <strong>ID tokens</strong></li>
              <li>Click <strong>Configure</strong></li>
            </ol>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Step 3: Create Client Secret</CardTitle>
            <CardDescription>Generate credentials for secure authentication</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <ol className="space-y-2 list-decimal list-inside text-sm">
              <li>Go to <strong>Certificates & secrets → Client secrets</strong></li>
              <li>Click <strong>New client secret</strong></li>
              <li>Add description: "MarketSage Production"</li>
              <li>Set expiration (24 months recommended)</li>
              <li>Click <strong>Add</strong></li>
              <li>
                <strong className="text-red-600">Important:</strong> Copy the secret value immediately (you won't be able to see it again!)
              </li>
            </ol>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Step 4: Configure API Permissions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <ol className="space-y-2 list-decimal list-inside text-sm">
              <li>Go to <strong>API permissions → Add a permission</strong></li>
              <li>Select <strong>Microsoft Graph → Delegated permissions</strong></li>
              <li>Add the following permissions:
                <ul className="ml-6 mt-1 space-y-1">
                  <li>• openid</li>
                  <li>• profile</li>
                  <li>• email</li>
                  <li>• User.Read</li>
                </ul>
              </li>
              <li>Click <strong>Add permissions</strong></li>
              <li>Click <strong>Grant admin consent for [Your Org]</strong></li>
            </ol>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Step 5: Collect Required Information</CardTitle>
            <CardDescription>You'll need these values in the next step</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
              <p className="text-sm font-medium mb-2">From your app's <strong>Overview</strong> page, copy:</p>
              <ul className="space-y-1 text-sm">
                <li>• <strong>Application (client) ID</strong></li>
                <li>• <strong>Directory (tenant) ID</strong></li>
                <li>• <strong>Client secret value</strong> (from Step 3)</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-between">
          <Button variant="outline" onClick={handlePrevStep}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <Button onClick={handleNextStep}>
            Continue to MarketSage Settings
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  };

  const renderMarketSageConfigStep = () => {
    const watchedTenantId = form.watch('tenantId');
    const issuerUrl = watchedTenantId
      ? `https://login.microsoftonline.com/${watchedTenantId}/v2.0`
      : 'https://login.microsoftonline.com/{tenant-id}/v2.0';

    return (
      <div className="space-y-6">
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            Enter the application details you collected from Azure AD.
          </AlertDescription>
        </Alert>

        <form onSubmit={form.handleSubmit(handleConfigureSSO)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Azure AD Application Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="providerName">Provider Display Name</Label>
                <Input
                  id="providerName"
                  {...form.register('providerName')}
                  placeholder="e.g., Azure AD Production"
                />
                {form.formState.errors.providerName && (
                  <p className="text-xs text-red-600 mt-1">{form.formState.errors.providerName.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="tenantId">Directory (Tenant) ID</Label>
                <Input
                  id="tenantId"
                  {...form.register('tenantId')}
                  placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                  className="font-mono text-xs"
                />
                {form.formState.errors.tenantId && (
                  <p className="text-xs text-red-600 mt-1">{form.formState.errors.tenantId.message}</p>
                )}
                <p className="text-xs text-muted-foreground mt-1">
                  Found in Azure AD app Overview as "Directory (tenant) ID"
                </p>
              </div>

              <div>
                <Label htmlFor="oidcClientId">Application (Client) ID</Label>
                <Input
                  id="oidcClientId"
                  {...form.register('oidcClientId')}
                  placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                  className="font-mono text-xs"
                />
                {form.formState.errors.oidcClientId && (
                  <p className="text-xs text-red-600 mt-1">{form.formState.errors.oidcClientId.message}</p>
                )}
                <p className="text-xs text-muted-foreground mt-1">
                  Found in Azure AD app Overview as "Application (client) ID"
                </p>
              </div>

              <div>
                <Label htmlFor="oidcClientSecret">Client Secret Value</Label>
                <Input
                  id="oidcClientSecret"
                  type="password"
                  {...form.register('oidcClientSecret')}
                  placeholder="The secret value you copied when creating the client secret"
                  className="font-mono text-xs"
                />
                {form.formState.errors.oidcClientSecret && (
                  <p className="text-xs text-red-600 mt-1">{form.formState.errors.oidcClientSecret.message}</p>
                )}
                <p className="text-xs text-red-600 mt-1">
                  ⚠️ This is the secret VALUE, not the secret ID
                </p>
              </div>

              <div className="bg-muted p-3 rounded-md">
                <Label className="text-sm font-medium">Auto-Generated OIDC Issuer URL</Label>
                <p className="text-xs font-mono mt-1 break-all">{issuerUrl}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  This URL is automatically constructed from your Tenant ID
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Attribute Mapping</CardTitle>
              <CardDescription>Map Azure AD claims to MarketSage user fields</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="attributeEmail">Email Claim</Label>
                  <Input
                    id="attributeEmail"
                    {...form.register('attributeEmail')}
                    className="font-mono text-xs"
                  />
                </div>
                <div>
                  <Label htmlFor="attributeName">Full Name Claim</Label>
                  <Input
                    id="attributeName"
                    {...form.register('attributeName')}
                    className="font-mono text-xs"
                  />
                </div>
                <div>
                  <Label htmlFor="attributeFirstName">First Name Claim</Label>
                  <Input
                    id="attributeFirstName"
                    {...form.register('attributeFirstName')}
                    className="font-mono text-xs"
                  />
                </div>
                <div>
                  <Label htmlFor="attributeLastName">Last Name Claim</Label>
                  <Input
                    id="attributeLastName"
                    {...form.register('attributeLastName')}
                    className="font-mono text-xs"
                  />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Default Azure AD claim names are pre-filled and work for most configurations
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>User Provisioning Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <Checkbox
                  id="jitProvisioningEnabled"
                  checked={form.watch('jitProvisioningEnabled')}
                  onCheckedChange={(checked) => form.setValue('jitProvisioningEnabled', checked as boolean)}
                />
                <div className="flex-1">
                  <Label htmlFor="jitProvisioningEnabled" className="font-medium cursor-pointer">
                    Enable Just-In-Time Provisioning
                  </Label>
                  <p className="text-xs text-muted-foreground mt-1">
                    Automatically create user accounts when they first log in via Azure AD
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Checkbox
                  id="jitUpdateAttributes"
                  checked={form.watch('jitUpdateAttributes')}
                  onCheckedChange={(checked) => form.setValue('jitUpdateAttributes', checked as boolean)}
                />
                <div className="flex-1">
                  <Label htmlFor="jitUpdateAttributes" className="font-medium cursor-pointer">
                    Update User Attributes on Login
                  </Label>
                  <p className="text-xs text-muted-foreground mt-1">
                    Sync user name and email from Azure AD on every login
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Checkbox
                  id="requireSSOOnly"
                  checked={form.watch('requireSSOOnly')}
                  onCheckedChange={(checked) => form.setValue('requireSSOOnly', checked as boolean)}
                />
                <div className="flex-1">
                  <Label htmlFor="requireSSOOnly" className="font-medium cursor-pointer">
                    Require SSO Only
                  </Label>
                  <p className="text-xs text-muted-foreground mt-1">
                    Disable password-based login for this organization (recommended after testing)
                  </p>
                </div>
              </div>

              <div>
                <Label htmlFor="allowedDomains">Allowed Email Domains (Optional)</Label>
                <Input
                  id="allowedDomains"
                  {...form.register('allowedDomains')}
                  placeholder="example.com, example.org"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Comma-separated list. Leave empty to allow all domains.
                </p>
              </div>

              <div>
                <Label htmlFor="defaultRole">Default Role for New Users</Label>
                <Select
                  value={form.watch('defaultRole')}
                  onValueChange={(value) => form.setValue('defaultRole', value as any)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USER">User</SelectItem>
                    <SelectItem value="ADMIN">Admin</SelectItem>
                    <SelectItem value="IT_ADMIN">IT Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {configError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{configError}</AlertDescription>
            </Alert>
          )}

          <div className="flex justify-between">
            <Button type="button" variant="outline" onClick={handlePrevStep}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <Button type="submit" disabled={configLoading}>
              {configLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Configuration
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </form>
      </div>
    );
  };

  const renderTestStep = () => (
    <div className="space-y-6">
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          Test your Azure AD SSO connection before enabling it for your organization.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle>Connection Test</CardTitle>
          <CardDescription>Verify that MarketSage can communicate with your Azure AD tenant</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-muted p-4 rounded-md">
            <p className="text-sm mb-4">
              Click the button below to initiate a test authentication flow. This will:
            </p>
            <ul className="space-y-2 text-sm">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                Validate OIDC configuration and endpoints
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                Verify client ID and secret
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                Check token endpoint accessibility
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                Verify claim mappings
              </li>
            </ul>
          </div>

          <Button
            onClick={handleTestConnection}
            disabled={testLoading}
            size="lg"
            className="w-full"
          >
            {testLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Test Connection
          </Button>

          {testResult && (
            <Alert variant={testResult.success ? 'default' : 'destructive'}>
              {testResult.success ? (
                <CheckCircle2 className="h-4 w-4 text-green-600" />
              ) : (
                <AlertCircle className="h-4 w-4" />
              )}
              <AlertDescription>{testResult.message}</AlertDescription>
            </Alert>
          )}

          {testError && !testResult && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{testError}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Manual Testing (Recommended)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm">
            After the automated test passes, we recommend testing the full login flow:
          </p>
          <ol className="space-y-2 list-decimal list-inside text-sm">
            <li>Open an incognito/private browser window</li>
            <li>Navigate to your MarketSage SSO login page</li>
            <li>Select "Sign in with Microsoft"</li>
            <li>Log in with your Azure AD credentials</li>
            <li>Complete any MFA challenges if configured</li>
            <li>Verify you're redirected back to MarketSage dashboard</li>
          </ol>
        </CardContent>
      </Card>

      <div className="flex justify-between">
        <Button variant="outline" onClick={handlePrevStep}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <Button
          onClick={handleNextStep}
          disabled={!testResult?.success}
        >
          Continue to Completion
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );

  const renderCompleteStep = () => (
    <div className="space-y-6">
      <Alert>
        <CheckCircle2 className="h-4 w-4 text-green-600" />
        <AlertDescription>
          Congratulations! Your Azure AD SSO integration is configured and tested.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle>Next Steps</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="bg-blue-100 text-blue-700 rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 text-sm font-medium">
                1
              </div>
              <div>
                <p className="font-medium">Enable SSO for Your Organization</p>
                <p className="text-sm text-muted-foreground">
                  Navigate to organization settings and enable Azure AD SSO
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="bg-blue-100 text-blue-700 rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 text-sm font-medium">
                2
              </div>
              <div>
                <p className="font-medium">Configure Conditional Access (Optional)</p>
                <p className="text-sm text-muted-foreground">
                  Set up Conditional Access policies in Azure AD for additional security
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="bg-blue-100 text-blue-700 rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 text-sm font-medium">
                3
              </div>
              <div>
                <p className="font-medium">Communicate to Your Team</p>
                <p className="text-sm text-muted-foreground">
                  Notify users that they should now log in using Microsoft credentials
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="bg-blue-100 text-blue-700 rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 text-sm font-medium">
                4
              </div>
              <div>
                <p className="font-medium">Monitor Audit Logs</p>
                <p className="text-sm text-muted-foreground">
                  Review SSO login events in the audit logs section
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="bg-blue-100 text-blue-700 rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 text-sm font-medium">
                5
              </div>
              <div>
                <p className="font-medium">Optional: Enable SCIM Provisioning</p>
                <p className="text-sm text-muted-foreground">
                  Automate user lifecycle management with Azure AD SCIM
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Additional Resources</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Button
            variant="link"
            size="sm"
            className="p-0 h-auto"
            onClick={() => window.open('https://learn.microsoft.com/en-us/azure/active-directory/develop/v2-protocols-oidc', '_blank')}
          >
            <ExternalLink className="h-3 w-3 mr-1" />
            Azure AD OIDC Protocol Documentation
          </Button>
          <br />
          <Button
            variant="link"
            size="sm"
            className="p-0 h-auto"
            onClick={() => window.open('https://learn.microsoft.com/en-us/azure/active-directory/conditional-access/overview', '_blank')}
          >
            <ExternalLink className="h-3 w-3 mr-1" />
            Conditional Access Best Practices
          </Button>
          <br />
          <Button
            variant="link"
            size="sm"
            className="p-0 h-auto"
            onClick={() => router.push(`/admin/organizations/${orgId}/sso/audit-logs`)}
          >
            View SSO Audit Logs
          </Button>
        </CardContent>
      </Card>

      <div className="flex justify-between">
        <Button variant="outline" onClick={() => router.push(`/admin/organizations/${orgId}`)}>
          Return to Organization
        </Button>
        <Button onClick={handleEnableSSO} size="lg">
          <CheckCircle2 className="mr-2 h-4 w-4" />
          Finish Setup
        </Button>
      </div>
    </div>
  );

  // ============================================================================
  // Main Render
  // ============================================================================

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 0:
        return renderIntroStep();
      case 1:
        return renderAzureConfigStep();
      case 2:
        return renderMarketSageConfigStep();
      case 3:
        return renderTestStep();
      case 4:
        return renderCompleteStep();
      default:
        return null;
    }
  };

  return (
    <div className="container mx-auto py-8 space-y-8 max-w-5xl">
      {/* Page Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <Cloud className="h-8 w-8 text-blue-600" />
          <h1 className="text-3xl font-bold">Azure AD SSO Setup Wizard</h1>
        </div>
        <p className="text-muted-foreground">
          Configure OIDC single sign-on with Azure Active Directory (Microsoft Entra ID) for your organization
        </p>
      </div>

      {/* Wizard Stepper */}
      <SetupWizardStepper
        steps={WIZARD_STEPS}
        currentStep={currentStep}
        completedSteps={completedSteps}
      />

      {/* Step Content */}
      <div className={cn('transition-opacity duration-300', (configLoading || testLoading) && 'opacity-50')}>
        {renderCurrentStep()}
      </div>
    </div>
  );
}
