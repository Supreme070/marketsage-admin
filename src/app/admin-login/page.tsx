"use client";

import { useSession, signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Shield, AlertCircle } from "lucide-react";

// Staff email domains and whitelist
const ADMIN_DOMAINS = ['marketsage.africa'];
const ADMIN_EMAILS = [
  'admin@marketsage.africa',
  'support@marketsage.africa',
  'supreme@marketsage.africa',
  'supreme', // Allow supreme user for testing
  // Add more staff emails here
];

export default function AdminLoginPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (status === "loading") return;
    
    // If already authenticated as staff, redirect to admin dashboard
    if (session) {
      const userEmail = session.user?.email;
      const userRole = (session.user as any)?.role;
      
      const isStaff = userEmail && (
        ADMIN_EMAILS.includes(userEmail) ||
        ADMIN_DOMAINS.some(domain => userEmail.endsWith(`@${domain}`)) ||
        ['ADMIN', 'SUPER_ADMIN', 'IT_ADMIN'].includes(userRole)
      );

      if (isStaff) {
        // Use replace instead of push to avoid back button issues
        router.replace("/admin/dashboard");
      } else {
        // If authenticated but not staff, redirect to regular dashboard
        router.replace("/dashboard");
      }
    }
  }, [session, status, router]);

  const handleStaffLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    // Check if email is from staff domain
    const isStaffEmail = ADMIN_EMAILS.includes(email) || 
                        ADMIN_DOMAINS.some(domain => email.endsWith(`@${domain}`));

    if (!isStaffEmail) {
      setError("Access denied. This portal is for MarketSage staff only.");
      setIsLoading(false);
      return;
    }

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("Invalid credentials. Please check your email and password.");
      } else if (result?.ok) {
        // Successful login, redirect will happen in useEffect
        router.push("/admin/dashboard");
      }
    } catch (error) {
      setError("An error occurred during login. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Check authentication status
  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // If already authenticated as staff, show redirect message (useEffect handles redirect)
  if (session) {
    const userEmail = session.user?.email;
    const userRole = (session.user as any)?.role;
    
    const isStaff = userEmail && (
      ADMIN_EMAILS.includes(userEmail) ||
      ADMIN_DOMAINS.some(domain => userEmail.endsWith(`@${domain}`)) ||
      ['ADMIN', 'SUPER_ADMIN', 'IT_ADMIN'].includes(userRole)
    );

    if (isStaff) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Redirecting to admin dashboard...</p>
          </div>
        </div>
      );
    } else {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Redirecting to dashboard...</p>
          </div>
        </div>
      );
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center mb-4">
            <Shield className="h-12 w-12 text-blue-600 dark:text-blue-400" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">MarketSage Admin</h1>
          <p className="text-gray-600 dark:text-gray-300">Staff Portal Access</p>
        </div>

        {/* Login Card */}
        <Card className="shadow-lg">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center">Staff Login</CardTitle>
            <CardDescription className="text-center">
              Access restricted to MarketSage staff members
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-md">
                <AlertCircle className="h-4 w-4 text-red-500" />
                <span className="text-sm text-red-700">{error}</span>
              </div>
            )}

            <form onSubmit={handleStaffLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Staff Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your.name@marketsage.africa"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? "Signing in..." : "Sign In"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}