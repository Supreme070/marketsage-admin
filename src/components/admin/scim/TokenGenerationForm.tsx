'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Copy, Check, AlertTriangle } from 'lucide-react';
import { useGenerateSCIMToken } from '@/lib/api/hooks/useAdminSCIM';
import { useToast } from '@/components/ui/use-toast';

// ============================================================================
// Validation Schema
// ============================================================================

const tokenFormSchema = z.object({
  name: z
    .string()
    .min(3, 'Token name must be at least 3 characters')
    .max(100, 'Token name must be less than 100 characters'),
  expiresInDays: z
    .string()
    .optional()
    .refine(
      (val) => {
        if (!val || val === 'never') return true;
        const num = parseInt(val, 10);
        return !isNaN(num) && num >= 1 && num <= 365;
      },
      {
        message: 'Expiration must be between 1 and 365 days, or never',
      }
    ),
});

type TokenFormValues = z.infer<typeof tokenFormSchema>;

// ============================================================================
// Component Props
// ============================================================================

interface TokenGenerationFormProps {
  orgId: string;
  onTokenGenerated?: () => void;
}

// ============================================================================
// Component
// ============================================================================

export function TokenGenerationForm({ orgId, onTokenGenerated }: TokenGenerationFormProps) {
  const [generatedToken, setGeneratedToken] = useState<string | null>(null);
  const [tokenCopied, setTokenCopied] = useState(false);
  const { generateToken, loading, error } = useGenerateSCIMToken(orgId);
  const { toast } = useToast();

  const form = useForm<TokenFormValues>({
    resolver: zodResolver(tokenFormSchema),
    defaultValues: {
      name: '',
      expiresInDays: 'never',
    },
  });

  const onSubmit = async (values: TokenFormValues) => {
    try {
      const request: any = {
        name: values.name,
      };

      // Only add expiresInDays if it's not "never"
      if (values.expiresInDays && values.expiresInDays !== 'never') {
        request.expiresInDays = parseInt(values.expiresInDays, 10);
      }

      const result = await generateToken(request);

      if (result?.plainTextToken) {
        setGeneratedToken(result.plainTextToken);
        setTokenCopied(false);

        toast({
          title: 'Token Generated',
          description: 'SCIM bearer token has been generated successfully. Copy it now!',
        });

        // Reset form
        form.reset();

        // Notify parent
        if (onTokenGenerated) {
          onTokenGenerated();
        }
      }
    } catch (err: any) {
      toast({
        title: 'Generation Failed',
        description: err.message || 'Failed to generate SCIM token',
        variant: 'destructive',
      });
    }
  };

  const copyTokenToClipboard = async () => {
    if (!generatedToken) return;

    try {
      await navigator.clipboard.writeText(generatedToken);
      setTokenCopied(true);

      toast({
        title: 'Copied!',
        description: 'Token copied to clipboard',
      });

      setTimeout(() => {
        setTokenCopied(false);
      }, 3000);
    } catch (err) {
      toast({
        title: 'Copy Failed',
        description: 'Failed to copy token to clipboard',
        variant: 'destructive',
      });
    }
  };

  const dismissToken = () => {
    setGeneratedToken(null);
    setTokenCopied(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Generate SCIM Bearer Token</CardTitle>
        <CardDescription>
          Create a new bearer token for SCIM 2.0 provisioning from your IdP (Okta, Azure AD, Google Workspace, etc.)
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Display generated token (only shown once) */}
        {generatedToken && (
          <Alert className="mb-6 border-orange-500 bg-orange-50">
            <AlertTriangle className="h-4 w-4 text-orange-600" />
            <AlertDescription>
              <div className="space-y-3">
                <p className="font-semibold text-orange-900">
                  Token Generated Successfully - Copy it now!
                </p>
                <p className="text-sm text-orange-800">
                  This token will only be shown once. Make sure to copy it before closing this message.
                </p>
                <div className="flex items-center gap-2">
                  <Input
                    readOnly
                    value={generatedToken}
                    className="font-mono text-sm bg-white"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={copyTokenToClipboard}
                    className="shrink-0"
                  >
                    {tokenCopied ? (
                      <>
                        <Check className="h-4 w-4 mr-2" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4 mr-2" />
                        Copy
                      </>
                    )}
                  </Button>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={dismissToken}
                  className="mt-2"
                >
                  I've copied the token, dismiss this message
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Display error */}
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Token generation form */}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Token Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., Production Okta SCIM Token"
                      {...field}
                      disabled={loading}
                    />
                  </FormControl>
                  <FormDescription>
                    A descriptive name to identify this token (visible in your token list)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="expiresInDays"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Token Expiration</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value} disabled={loading}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select expiration period" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="never">Never Expires</SelectItem>
                      <SelectItem value="30">30 Days</SelectItem>
                      <SelectItem value="60">60 Days</SelectItem>
                      <SelectItem value="90">90 Days (Recommended)</SelectItem>
                      <SelectItem value="180">180 Days</SelectItem>
                      <SelectItem value="365">365 Days (1 Year)</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Choose when this token should expire. For security, we recommend 90 days.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end">
              <Button type="submit" disabled={loading}>
                {loading ? 'Generating...' : 'Generate Token'}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
