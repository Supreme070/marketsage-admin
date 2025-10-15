"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  LayoutDashboard,
  Users,
  Building2,
  Megaphone,
  BarChart3,
  Heart,
  Brain,
  Shield,
  FileText,
  CreditCard,
  HeadphonesIcon,
  AlertTriangle,
  Bell,
  MessageSquare,
  Server,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronRight,
} from "lucide-react";
import { useAdmin } from "./AdminProvider";

interface AdminLayoutProps {
  children: React.ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const pathname = usePathname();
  const { session, permissions } = useAdmin();

  const navigation = [
    { name: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard, show: true },
    { name: "Users", href: "/admin/users", icon: Users, show: permissions.canViewUsers },
    { name: "Organizations", href: "/admin/organizations", icon: Building2, show: permissions.canManageSubscriptions },
    { name: "Campaigns", href: "/admin/campaigns", icon: Megaphone, show: permissions.canManageCampaigns },
    { name: "Analytics", href: "/admin/analytics", icon: BarChart3, show: permissions.canViewAnalytics },
    { name: "Customer Health", href: "/admin/customer-health", icon: Heart, show: permissions.canViewAnalytics },
    { name: "AI Management", href: "/admin/ai", icon: Brain, show: permissions.canAccessAI },
    { name: "Security", href: "/admin/security", icon: Shield, show: permissions.canAccessSecurity },
    { name: "Audit Logs", href: "/admin/audit", icon: FileText, show: permissions.canViewAudit },
    { name: "Billing", href: "/admin/billing", icon: CreditCard, show: permissions.canManageSubscriptions },
    { name: "Support", href: "/admin/support", icon: HeadphonesIcon, show: permissions.canAccessSupport },
    { name: "Incidents", href: "/admin/incidents", icon: AlertTriangle, show: permissions.canManageIncidents },
    { name: "Business Alerts", href: "/admin/alerts", icon: Bell, show: permissions.canViewAdmin },
    { name: "Messages", href: "/admin/messages", icon: MessageSquare, show: permissions.canAccessSupport },
    { name: "System", href: "/admin/system", icon: Server, show: permissions.canAccessSystem },
    { name: "Settings", href: "/admin/settings", icon: Settings, show: true },
  ];

  const filteredNavigation = navigation.filter(item => item.show);

  const isActive = (path: string) => pathname === path;

  const handleLogout = async () => {
    await signOut({ callbackUrl: "/admin-login" });
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        >
          <div className="absolute inset-0 bg-gray-900 opacity-75"></div>
        </div>
      )}

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-gray-900 transform transition-transform duration-300 ease-in-out ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0`}
      >
        {/* Sidebar Header */}
        <div className="flex items-center justify-between h-16 px-6 border-b border-gray-800">
          <h1 className="text-xl font-bold text-white">MarketSage Admin</h1>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-gray-400 hover:text-white"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* User Info */}
        <div className="p-4 border-b border-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold">
              {session.user?.name?.charAt(0) || "A"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">
                {session.user?.name}
              </p>
              <p className="text-xs text-gray-400 truncate">
                {session.user?.email}
              </p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {filteredNavigation.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);

            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                  active
                    ? "bg-gray-800 text-white"
                    : "text-gray-400 hover:text-white hover:bg-gray-800"
                }`}
              >
                <Icon className="h-5 w-5" />
                <span>{item.name}</span>
                {active && <ChevronRight className="h-4 w-4 ml-auto" />}
              </Link>
            );
          })}
        </nav>

        {/* Logout Button */}
        <div className="p-4 border-t border-gray-800">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-3 py-2.5 text-sm font-medium text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
          >
            <LogOut className="h-5 w-5" />
            <span>Logout</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="lg:pl-64">
        {/* Mobile Header */}
        <div className="sticky top-0 z-10 lg:hidden bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between h-16 px-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="text-gray-500 hover:text-gray-900 dark:hover:text-white"
            >
              <Menu className="h-6 w-6" />
            </button>
            <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
              MarketSage Admin
            </h1>
            <div className="w-6" /> {/* Spacer for centering */}
          </div>
        </div>

        {/* Page Content */}
        <main className="min-h-screen">{children}</main>
      </div>
    </div>
  );
}
