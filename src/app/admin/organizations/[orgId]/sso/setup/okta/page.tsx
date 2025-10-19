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
  AlertCircle,
  CheckCircle2,
  Copy,
  ExternalLink,
  Info,
  Loader2,
  Shield,
  ArrowLeft,
  ArrowRight
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ============================================================================
// Validation Schema
// ============================================================================

const oktaSAMLSchema = z.object({
  providerName: z.string().min(1, 'Provider name is required'),
  samlEntryPoint: z.string().url('Must be a valid URL'),
  samlIssuer: z.string().min(1, 'SAML Issuer is required'),
  samlCertificate: z.string().min(1, 'X.509 Certificate is required'),
  attributeEmail: z.string().default('email'),
  attributeFirstName: z.string().default('firstName'),
  attributeLastName: z.string().default('lastName'),
  defaultRole: z.enum(['USER', 'ADMIN', 'IT_ADMIN', 'SUPER_ADMIN']).default('USER'),
  jitProvisioningEnabled: z.boolean().default(true),
  jitUpdateAttributes: z.boolean().default(true),
  requireSSOOnly: z.boolean().default(false),
  allowedDomains: z.string().optional(),
});

type OktaSAMLFormData = z.infer<typeof oktaSAMLSchema>;

// ============================================================================
// Wizard Steps Configuration
// ============================================================================

const WIZARD_STEPS: WizardStep[] = [
  {
    id: 'intro',
    title: 'Okta Overview',
    description: 'Getting started',
  },
  {
    id: 'okta-config',
    title: 'Configure Okta',
    description: 'Setup in Okta Admin',
  },
  {
    id: 'markstsage-config',
    title: 'MarketSage Settings',
    description: 'Enter SAML details',
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

export default function OktaSSOSetupPage() {
  const params = useParams();
  const router = useRouter();
  const orgId = params.orgId as string;

  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const { configure, loading: configLoading, error: configError } = useConfigureSSO(orgId);
  const { test: testConnection, loading: testLoading, error: testError } = useTestSSOConnection(orgId);

  const form = useForm<OktaSAMLFormData>({
    resolver: zodResolver(oktaSAMLSchema),
    defaultValues: {
      providerName: 'Okta',
      attributeEmail: 'email',
      attributeFirstName: 'firstName',
      attributeLastName: 'lastName',
      defaultRole: 'USER',
      jitProvisioningEnabled: true,
      jitUpdateAttributes: true,
      requireSSOOnly: false,
      allowedDomains: '',
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

  const handleConfigureSSO = useCallback(async (data: OktaSAMLFormData) => {
    try {
      const request: ConfigureSsoRequest = {
        provider: 'SAML',
        providerName: data.providerName,
        enabled: false, // Will be enabled after testing
        samlEntryPoint: data.samlEntryPoint,
        samlIssuer: data.samlIssuer,
        samlCertificate: data.samlCertificate,
        samlSignatureAlgorithm: 'sha256',
        samlWantAssertionsSigned: true,
        samlCallbackUrl: `${window.location.origin}/api/auth/sso/callback`,
        attributeEmail: data.attributeEmail,
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
          This wizard will guide you through configuring Okta SAML 2.0 SSO for your organization. The process takes about 10-15 minutes.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-blue-600" />
            What You'll Need
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
              <div>
                <strong>Okta Admin Access:</strong> You must be an Okta administrator with permission to create SAML apps
              </div>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
              <div>
                <strong>Organization Domain:</strong> Your organization's verified email domain
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
          <CardTitle>Benefits of Okta SSO</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start gap-2">
              <Badge variant="outline" className="bg-green-50 text-green-700">Security</Badge>
              <span className="text-sm">Centralized authentication & MFA enforcement</span>
            </div>
            <div className="flex items-start gap-2">
              <Badge variant="outline" className="bg-blue-50 text-blue-700">Productivity</Badge>
              <span className="text-sm">Single sign-on across all apps</span>
            </div>
            <div className="flex items-start gap-2">
              <Badge variant="outline" className="bg-purple-50 text-purple-700">Automation</Badge>
              <span className="text-sm">Just-in-time user provisioning</span>
            </div>
            <div className="flex items-start gap-2">
              <Badge variant="outline" className="bg-orange-50 text-orange-700">Compliance</Badge>
              <span className="text-sm">Audit logs & access controls</span>
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

  const renderOktaConfigStep = () => {
    const acsUrl = `${window.location.origin}/api/auth/sso/callback`;
    const entityId = `marketsage-${orgId}`;

    return (
      <div className="space-y-6">
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            Follow these steps in your Okta Admin Console to create a SAML 2.0 application.
          </AlertDescription>
        </Alert>

        <Card>
          <CardHeader>
            <CardTitle>Step 1: Create SAML App in Okta</CardTitle>
            <CardDescription>Configure the application in Okta Admin Console</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <ol className="space-y-4 list-decimal list-inside">
              <li className="text-sm">
                <strong>Log into Okta Admin Console</strong>
                <Button
                  variant="link"
                  size="sm"
                  className="ml-2"
                  onClick={() => window.open('https://login.okta.com', '_blank')}
                >
                  <ExternalLink className="h-3 w-3 mr-1" />
                  Open Okta
                </Button>
              </li>
              <li className="text-sm">
                Navigate to <strong>Applications → Applications → Create App Integration</strong>
              </li>
              <li className="text-sm">
                Select <Badge variant="outline">SAML 2.0</Badge> and click <strong>Next</strong>
              </li>
              <li className="text-sm">
                Enter <strong>App Name:</strong> "MarketSage" and click <strong>Next</strong>
              </li>
            </ol>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Step 2: Configure SAML Settings</CardTitle>
            <CardDescription>Copy these URLs into your Okta SAML configuration</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-sm font-medium">Single Sign-On URL (ACS URL)</Label>
              <div className="flex gap-2 mt-1">
                <Input value={acsUrl} readOnly className="font-mono text-xs" />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleCopyToClipboard(acsUrl, 'acsUrl')}
                >
                  {copiedField === 'acsUrl' ? (
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Also use this URL for "Recipient URL" and "Destination URL"
              </p>
            </div>

            <div>
              <Label className="text-sm font-medium">Audience URI (SP Entity ID)</Label>
              <div className="flex gap-2 mt-1">
                <Input value={entityId} readOnly className="font-mono text-xs" />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleCopyToClipboard(entityId, 'entityId')}
                >
                  {copiedField === 'entityId' ? (
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            <div>
              <Label className="text-sm font-medium">Attribute Statements (Optional but Recommended)</Label>
              <div className="bg-muted p-3 rounded-md mt-1 space-y-2">
                <div className="grid grid-cols-3 gap-2 text-xs font-medium">
                  <span>Name</span>
                  <span>Name Format</span>
                  <span>Value</span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <code>email</code>
                  <span>Unspecified</span>
                  <code>user.email</code>
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <code>firstName</code>
                  <span>Unspecified</span>
                  <code>user.firstName</code>
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <code>lastName</code>
                  <span>Unspecified</span>
                  <code>user.lastName</code>
                </div>
              </div>
            </div>

            <ol start={5} className="space-y-2 list-decimal list-inside text-sm">
              <li>Set <strong>Name ID Format:</strong> EmailAddress</li>
              <li>Set <strong>Application Username:</strong> Email</li>
              <li>Click <strong>Next</strong> and then <strong>Finish</strong></li>
            </ol>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Step 3: Assign Users</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <ol className="space-y-2 list-decimal list-inside text-sm">
              <li>In the app's <strong>Assignments</strong> tab, click <strong>Assign</strong></li>
              <li>Assign to people or groups who should have access</li>
              <li>Verify assignments are active</li>
            </ol>
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

  const renderMarketSageConfigStep = () => (
    <div className="space-y-6">
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          Now retrieve the SAML configuration details from Okta and enter them below.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle>Get Okta SAML Metadata</CardTitle>
          <CardDescription>From your Okta app's "Sign On" tab</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <ol className="space-y-2 list-decimal list-inside text-sm">
            <li>In Okta, go to your MarketSage app → <strong>Sign On</strong> tab</li>
            <li>Scroll to <strong>SAML 2.0</strong> section</li>
            <li>Click <strong>View SAML setup instructions</strong> (opens in new tab)</li>
            <li>Copy the required values from that page into the form below</li>
          </ol>
        </CardContent>
      </Card>

      <form onSubmit={form.handleSubmit(handleConfigureSSO)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>SAML Configuration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="providerName">Provider Display Name</Label>
              <Input
                id="providerName"
                {...form.register('providerName')}
                placeholder="e.g., Okta Production"
              />
              {form.formState.errors.providerName && (
                <p className="text-xs text-red-600 mt-1">{form.formState.errors.providerName.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="samlEntryPoint">Identity Provider Single Sign-On URL</Label>
              <Input
                id="samlEntryPoint"
                {...form.register('samlEntryPoint')}
                placeholder="https://your-domain.okta.com/app/..."
                className="font-mono text-xs"
              />
              {form.formState.errors.samlEntryPoint && (
                <p className="text-xs text-red-600 mt-1">{form.formState.errors.samlEntryPoint.message}</p>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                Found in Okta SAML setup instructions as "Identity Provider Single Sign-On URL"
              </p>
            </div>

            <div>
              <Label htmlFor="samlIssuer">Identity Provider Issuer</Label>
              <Input
                id="samlIssuer"
                {...form.register('samlIssuer')}
                placeholder="http://www.okta.com/..."
                className="font-mono text-xs"
              />
              {form.formState.errors.samlIssuer && (
                <p className="text-xs text-red-600 mt-1">{form.formState.errors.samlIssuer.message}</p>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                Found in Okta SAML setup instructions as "Identity Provider Issuer"
              </p>
            </div>

            <div>
              <Label htmlFor="samlCertificate">X.509 Certificate</Label>
              <textarea
                id="samlCertificate"
                {...form.register('samlCertificate')}
                placeholder="-----BEGIN CERTIFICATE-----&#10;MIIDpDCCAoygAwIBAgIGAXo...&#10;-----END CERTIFICATE-----"
                className="w-full min-h-[120px] p-2 border rounded-md font-mono text-xs"
              />
              {form.formState.errors.samlCertificate && (
                <p className="text-xs text-red-600 mt-1">{form.formState.errors.samlCertificate.message}</p>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                Copy the entire certificate including BEGIN/END lines. Found in Okta as "X.509 Certificate"
              </p>
            </div>
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
                  Automatically create user accounts when they first log in via Okta
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
                  Sync user name and email from Okta on every login
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

  const renderTestStep = () => (
    <div className="space-y-6">
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          Test your Okta SSO connection before enabling it for your organization.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle>Connection Test</CardTitle>
          <CardDescription>Verify that MarketSage can communicate with your Okta SAML endpoint</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-muted p-4 rounded-md">
            <p className="text-sm mb-4">
              Click the button below to initiate a test authentication flow. This will:
            </p>
            <ul className="space-y-2 text-sm">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                Validate SAML metadata and certificate
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                Verify SSO URL is reachable
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                Check attribute mappings
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
            <li>Select "Sign in with Okta"</li>
            <li>Log in with your Okta credentials</li>
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
          Congratulations! Your Okta SSO integration is configured and tested.
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
                  Navigate to organization settings and enable Okta SSO
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="bg-blue-100 text-blue-700 rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 text-sm font-medium">
                2
              </div>
              <div>
                <p className="font-medium">Communicate to Your Team</p>
                <p className="text-sm text-muted-foreground">
                  Notify users that they should now log in using Okta SSO
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="bg-blue-100 text-blue-700 rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 text-sm font-medium">
                3
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
                4
              </div>
              <div>
                <p className="font-medium">Optional: Enable SCIM Provisioning</p>
                <p className="text-sm text-muted-foreground">
                  Automate user provisioning with SCIM integration
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
            onClick={() => window.open('https://help.okta.com/en/prod/Content/Topics/Apps/Apps_App_Integration_Wizard_SAML.htm', '_blank')}
          >
            <ExternalLink className="h-3 w-3 mr-1" />
            Okta SAML App Integration Guide
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
        return renderOktaConfigStep();
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
          <Shield className="h-8 w-8 text-blue-600" />
          <h1 className="text-3xl font-bold">Okta SSO Setup Wizard</h1>
        </div>
        <p className="text-muted-foreground">
          Configure SAML 2.0 single sign-on with Okta for your organization
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
