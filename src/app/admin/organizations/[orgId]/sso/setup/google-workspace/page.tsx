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
  Mail
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ============================================================================
// Validation Schema
// ============================================================================

const googleSAMLSchema = z.object({
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

type GoogleSAMLFormData = z.infer<typeof googleSAMLSchema>;

// ============================================================================
// Wizard Steps Configuration
// ============================================================================

const WIZARD_STEPS: WizardStep[] = [
  {
    id: 'intro',
    title: 'Google Workspace Overview',
    description: 'Getting started',
  },
  {
    id: 'google-config',
    title: 'Configure Google',
    description: 'Setup in Admin Console',
  },
  {
    id: 'marketsage-config',
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

export default function GoogleWorkspaceSSOSetupPage() {
  const params = useParams();
  const router = useRouter();
  const orgId = params.orgId as string;

  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const { configure, loading: configLoading, error: configError } = useConfigureSSO(orgId);
  const { test: testConnection, loading: testLoading, error: testError } = useTestSSOConnection(orgId);

  const form = useForm<GoogleSAMLFormData>({
    resolver: zodResolver(googleSAMLSchema),
    defaultValues: {
      providerName: 'Google Workspace',
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

  const handleConfigureSSO = useCallback(async (data: GoogleSAMLFormData) => {
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
          This wizard will guide you through configuring Google Workspace SAML 2.0 SSO for your organization. The process takes about 10-15 minutes.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-red-600" />
            What You'll Need
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
              <div>
                <strong>Google Workspace Super Admin:</strong> You must have Super Admin privileges in Google Workspace
              </div>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
              <div>
                <strong>Organization Domain:</strong> Your organization's Google Workspace domain
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
          <CardTitle>Benefits of Google Workspace SSO</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start gap-2">
              <Badge variant="outline" className="bg-green-50 text-green-700">Security</Badge>
              <span className="text-sm">2-Step Verification & Advanced Protection</span>
            </div>
            <div className="flex items-start gap-2">
              <Badge variant="outline" className="bg-blue-50 text-blue-700">Integration</Badge>
              <span className="text-sm">Seamless Google Workspace integration</span>
            </div>
            <div className="flex items-start gap-2">
              <Badge variant="outline" className="bg-purple-50 text-purple-700">Automation</Badge>
              <span className="text-sm">Just-in-time user provisioning</span>
            </div>
            <div className="flex items-start gap-2">
              <Badge variant="outline" className="bg-orange-50 text-orange-700">Simplicity</Badge>
              <span className="text-sm">Easy setup and management</span>
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

  const renderGoogleConfigStep = () => {
    const acsUrl = `${window.location.origin}/api/auth/sso/callback`;
    const entityId = `marketsage-${orgId}`;

    return (
      <div className="space-y-6">
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            Follow these steps in the Google Workspace Admin Console to set up custom SAML application.
          </AlertDescription>
        </Alert>

        <Card>
          <CardHeader>
            <CardTitle>Step 1: Create Custom SAML App</CardTitle>
            <CardDescription>Add MarketSage as a SAML application</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <ol className="space-y-4 list-decimal list-inside">
              <li className="text-sm">
                <strong>Log into Google Admin Console</strong>
                <Button
                  variant="link"
                  size="sm"
                  className="ml-2"
                  onClick={() => window.open('https://admin.google.com', '_blank')}
                >
                  <ExternalLink className="h-3 w-3 mr-1" />
                  Open Admin Console
                </Button>
              </li>
              <li className="text-sm">
                Navigate to <strong>Apps → Web and mobile apps → Add app → Add custom SAML app</strong>
              </li>
              <li className="text-sm">
                Enter <strong>App name:</strong> "MarketSage"
              </li>
              <li className="text-sm">
                Optional: Upload the MarketSage logo
              </li>
              <li className="text-sm">
                Click <strong>Continue</strong>
              </li>
            </ol>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Step 2: Download IdP Metadata</CardTitle>
            <CardDescription>You'll need these values in the next step</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert className="bg-yellow-50 border-yellow-200">
              <AlertCircle className="h-4 w-4 text-yellow-600" />
              <AlertDescription className="text-yellow-800">
                <strong>Important:</strong> Keep this page open or copy these values now. You'll need them in Step 3.
              </AlertDescription>
            </Alert>

            <div className="bg-muted p-4 rounded-md space-y-2">
              <p className="text-sm font-medium">Copy the following from Google:</p>
              <ul className="space-y-1 text-sm">
                <li>• <strong>SSO URL</strong> (also called "IdP Sign-In URL")</li>
                <li>• <strong>Entity ID</strong> (also called "IdP Entity ID")</li>
                <li>• <strong>Certificate</strong> (download or copy the X.509 certificate)</li>
              </ul>
            </div>

            <p className="text-xs text-muted-foreground">
              You can download the certificate or copy it to your clipboard. Click <strong>Continue</strong> when done.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Step 3: Configure Service Provider Details</CardTitle>
            <CardDescription>Enter these URLs in Google Admin Console</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-sm font-medium">ACS URL</Label>
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
            </div>

            <div>
              <Label className="text-sm font-medium">Entity ID</Label>
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
              <Label className="text-sm font-medium">Start URL (Optional)</Label>
              <Input value={window.location.origin} readOnly className="font-mono text-xs" />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Name ID</Label>
              <div className="bg-muted p-3 rounded-md">
                <p className="text-xs"><strong>Name ID format:</strong> EMAIL</p>
                <p className="text-xs mt-1"><strong>Name ID:</strong> Basic Information → Primary email</p>
              </div>
            </div>

            <p className="text-xs text-muted-foreground">
              After entering these values, click <strong>Continue</strong>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Step 4: Configure Attribute Mapping</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm">
              Map Google Directory attributes to the following SAML attributes:
            </p>

            <div className="bg-muted p-3 rounded-md space-y-2">
              <div className="grid grid-cols-2 gap-2 text-xs font-medium">
                <span>App attribute</span>
                <span>Google Directory attribute</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <code>email</code>
                <span>Basic Information → Primary email</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <code>firstName</code>
                <span>Basic Information → First name</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <code>lastName</code>
                <span>Basic Information → Last name</span>
              </div>
            </div>

            <p className="text-xs text-muted-foreground">
              Click <strong>Finish</strong> to complete the SAML app setup
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Step 5: Turn ON the App</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <ol className="space-y-2 list-decimal list-inside text-sm">
              <li>In the app details page, click <strong>User access</strong></li>
              <li>Select <strong>ON for everyone</strong> (or select specific organizational units)</li>
              <li>Click <strong>Save</strong></li>
            </ol>

            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                It may take up to 24 hours for changes to propagate, but typically it's much faster (5-10 minutes).
              </AlertDescription>
            </Alert>
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
          Now enter the IdP information you copied from Google Workspace.
        </AlertDescription>
      </Alert>

      <form onSubmit={form.handleSubmit(handleConfigureSSO)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Google Workspace SAML Configuration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="providerName">Provider Display Name</Label>
              <Input
                id="providerName"
                {...form.register('providerName')}
                placeholder="e.g., Google Workspace Production"
              />
              {form.formState.errors.providerName && (
                <p className="text-xs text-red-600 mt-1">{form.formState.errors.providerName.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="samlEntryPoint">SSO URL (IdP Sign-In URL)</Label>
              <Input
                id="samlEntryPoint"
                {...form.register('samlEntryPoint')}
                placeholder="https://accounts.google.com/o/saml2/idp?idpid=..."
                className="font-mono text-xs"
              />
              {form.formState.errors.samlEntryPoint && (
                <p className="text-xs text-red-600 mt-1">{form.formState.errors.samlEntryPoint.message}</p>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                Found in Google Admin Console SAML app setup as "SSO URL"
              </p>
            </div>

            <div>
              <Label htmlFor="samlIssuer">Entity ID (IdP Entity ID)</Label>
              <Input
                id="samlIssuer"
                {...form.register('samlIssuer')}
                placeholder="https://accounts.google.com/o/saml2?idpid=..."
                className="font-mono text-xs"
              />
              {form.formState.errors.samlIssuer && (
                <p className="text-xs text-red-600 mt-1">{form.formState.errors.samlIssuer.message}</p>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                Found in Google Admin Console SAML app setup as "Entity ID"
              </p>
            </div>

            <div>
              <Label htmlFor="samlCertificate">X.509 Certificate</Label>
              <textarea
                id="samlCertificate"
                {...form.register('samlCertificate')}
                placeholder="-----BEGIN CERTIFICATE-----&#10;MIIDdDCCAlygAwIBAgIGAXo...&#10;-----END CERTIFICATE-----"
                className="w-full min-h-[120px] p-2 border rounded-md font-mono text-xs"
              />
              {form.formState.errors.samlCertificate && (
                <p className="text-xs text-red-600 mt-1">{form.formState.errors.samlCertificate.message}</p>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                Copy the entire certificate including BEGIN/END lines. Download from Google Admin Console or copy from the setup page.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Attribute Mapping</CardTitle>
            <CardDescription>Verify these match your Google Workspace configuration</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="attributeEmail">Email Attribute</Label>
                <Input
                  id="attributeEmail"
                  {...form.register('attributeEmail')}
                  className="font-mono text-xs"
                />
              </div>
              <div>
                <Label htmlFor="attributeFirstName">First Name Attribute</Label>
                <Input
                  id="attributeFirstName"
                  {...form.register('attributeFirstName')}
                  className="font-mono text-xs"
                />
              </div>
              <div>
                <Label htmlFor="attributeLastName">Last Name Attribute</Label>
                <Input
                  id="attributeLastName"
                  {...form.register('attributeLastName')}
                  className="font-mono text-xs"
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              These should match the attribute names you configured in Google Workspace (Step 4)
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
                  Automatically create user accounts when they first log in via Google Workspace
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
                  Sync user name and email from Google Workspace on every login
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

  const renderTestStep = () => (
    <div className="space-y-6">
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          Test your Google Workspace SSO connection before enabling it for your organization.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle>Connection Test</CardTitle>
          <CardDescription>Verify that MarketSage can communicate with Google Workspace</CardDescription>
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
                Check certificate validity
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                Verify attribute mappings
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
            <li>Select "Sign in with Google"</li>
            <li>Log in with your Google Workspace account</li>
            <li>Complete any 2-Step Verification if enabled</li>
            <li>Verify you're redirected back to MarketSage dashboard</li>
          </ol>

          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              Remember: It may take 5-10 minutes for Google Workspace changes to propagate. If the test fails, wait a few minutes and try again.
            </AlertDescription>
          </Alert>
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
          Congratulations! Your Google Workspace SSO integration is configured and tested.
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
                  Navigate to organization settings and enable Google Workspace SSO
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="bg-blue-100 text-blue-700 rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 text-sm font-medium">
                2
              </div>
              <div>
                <p className="font-medium">Configure User Access</p>
                <p className="text-sm text-muted-foreground">
                  In Google Admin Console, ensure the MarketSage app is enabled for the correct organizational units
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
                  Notify users that they should now log in using their Google Workspace account
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
                  Automate user provisioning with Google Workspace SCIM
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
            onClick={() => window.open('https://support.google.com/a/answer/6087519', '_blank')}
          >
            <ExternalLink className="h-3 w-3 mr-1" />
            Google Workspace SAML App Setup Guide
          </Button>
          <br />
          <Button
            variant="link"
            size="sm"
            className="p-0 h-auto"
            onClick={() => window.open('https://support.google.com/a/answer/60224', '_blank')}
          >
            <ExternalLink className="h-3 w-3 mr-1" />
            Set Up Your Own SAML App
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
        return renderGoogleConfigStep();
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
          <Mail className="h-8 w-8 text-red-600" />
          <h1 className="text-3xl font-bold">Google Workspace SSO Setup Wizard</h1>
        </div>
        <p className="text-muted-foreground">
          Configure SAML 2.0 single sign-on with Google Workspace for your organization
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
