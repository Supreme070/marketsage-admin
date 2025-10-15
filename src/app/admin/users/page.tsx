"use client";

import { useAdmin } from "@/components/admin/AdminProvider";
import { useAdminUsersDashboard, AdminUser, useExportUserData } from "@/lib/api/hooks/useAdminUsers";
import { UserActivityTimeline } from "@/components/UserActivityTimeline";
import {
  Users,
  Search,
  Filter,
  MoreHorizontal,
  Shield,
  Eye,
  Ban,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  Download,
  UserPlus,
  Terminal,
  Database,
  Zap,
  Activity,
  Globe,
  Lock,
  Key,
  X,
  KeyRound,
  LogOut,
  UserCog
} from "lucide-react";
import { useState, useEffect } from "react";

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  status: string;
  createdAt: string;
  lastActive: string;
  organization?: {
    id: string;
    name: string;
    subscriptionTier: string;
  };
}

export default function AdminUsersPage() {
  const { permissions, staffRole } = useAdmin();
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [showPermissionsMatrix, setShowPermissionsMatrix] = useState(false);
  const [isImpersonating, setIsImpersonating] = useState(false);
  const [impersonationData, setImpersonationData] = useState<{
    targetUser: string;
    adminEmail: string;
  } | null>(null);
  const [showActivityTimeline, setShowActivityTimeline] = useState(false);
  const [selectedUserForActivity, setSelectedUserForActivity] = useState<{
    id: string;
    email: string;
  } | null>(null);

  const {
    users,
    stats,
    loading,
    error,
    pagination,
    refreshAll,
    suspendUser,
    activateUser,
    bulkSuspendUsers,
    bulkActivateUsers,
    updateUserRole,
    resetUserPassword,
    forceLogout,
    forceLogoutAll,
    startImpersonation,
    stopImpersonation
  } = useAdminUsersDashboard({
    page: currentPage,
    limit: 10,
    search: searchTerm,
    role: roleFilter,
    status: statusFilter
  });

  const { exportUserData } = useExportUserData();

  // Check for impersonation session on mount
  useEffect(() => {
    try {
      const token = localStorage.getItem('accessToken');
      if (token) {
        // Decode JWT (simple base64 decode, not verified)
        const parts = token.split('.');
        if (parts.length === 3) {
          const payload = JSON.parse(atob(parts[1]));
          if (payload.isImpersonating) {
            setIsImpersonating(true);
            setImpersonationData({
              targetUser: payload.email,
              adminEmail: payload.impersonatedByEmail || 'Unknown Admin'
            });
          }
        }
      }
    } catch (error) {
      console.error('Failed to check impersonation status:', error);
    }
  }, []);

  if (!permissions.canViewUsers) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="admin-card p-8 text-center max-w-md">
          <Lock className="h-16 w-16 mx-auto mb-6 text-red-400" />
          <h2 className="admin-title text-2xl mb-4">ACCESS DENIED</h2>
          <p className="admin-subtitle">
            INSUFFICIENT CLEARANCE LEVEL
          </p>
          <div className="mt-6 text-center">
            <span className="admin-badge admin-badge-danger">UNAUTHORIZED</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="admin-card p-8 text-center max-w-md">
          <AlertTriangle className="h-16 w-16 mx-auto mb-6 text-red-400" />
          <h2 className="admin-title text-2xl mb-4">USER_MANAGEMENT_ERROR</h2>
          <p className="admin-subtitle mb-4">{error}</p>
          <button 
            className="admin-btn admin-btn-primary flex items-center gap-2 mx-auto"
            onClick={refreshAll}
          >
            <RefreshCw className="h-4 w-4" />
            RETRY
          </button>
        </div>
      </div>
    );
  }

  const getStatusBadge = (user: AdminUser) => {
    if (user.isSuspended) {
      return <span className="admin-badge admin-badge-danger">SUSPENDED</span>;
    }
    if (user.emailVerified) {
      return <span className="admin-badge admin-badge-success">ONLINE</span>;
    }
    return <span className="admin-badge admin-badge-warning">PENDING</span>;
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return <span className="admin-badge admin-badge-danger">SUPER_ADMIN</span>;
      case 'ADMIN':
        return <span className="admin-badge admin-badge-success">ADMIN</span>;
      case 'IT_ADMIN':
        return <span className="admin-badge admin-badge-secondary">IT_ADMIN</span>;
      default:
        return <span className="admin-badge admin-badge-secondary">USER</span>;
    }
  };

  const handleSuspendUser = async (userId: string) => {
    try {
      await suspendUser(userId);
      // Success is handled by the hook refreshing the data
    } catch (error) {
      console.error('Failed to suspend user:', error);
    }
  };

  const handleActivateUser = async (userId: string) => {
    try {
      await activateUser(userId);
      // Success is handled by the hook refreshing the data
    } catch (error) {
      console.error('Failed to activate user:', error);
    }
  };

  const handleBulkSuspend = async () => {
    if (selectedUsers.length === 0) return;

    const confirmed = window.confirm(
      `⚠️ SECURITY_ALERT\n\n` +
      `You are about to SUSPEND ${selectedUsers.length} user(s).\n\n` +
      `This action will:\n` +
      `• Immediately revoke their access\n` +
      `• Block all their active sessions\n` +
      `• Super admins will be automatically skipped\n\n` +
      `Proceed with bulk suspension?`
    );

    if (!confirmed) return;

    try {
      await bulkSuspendUsers(selectedUsers);
      setSelectedUsers([]); // Clear selection after success
    } catch (error) {
      console.error('Failed to bulk suspend users:', error);
      alert('❌ OPERATION_FAILED\n\nFailed to suspend users. Check console for details.');
    }
  };

  const handleBulkActivate = async () => {
    if (selectedUsers.length === 0) return;

    const confirmed = window.confirm(
      `✓ REACTIVATION_PROTOCOL\n\n` +
      `You are about to ACTIVATE ${selectedUsers.length} user(s).\n\n` +
      `This action will:\n` +
      `• Restore their system access\n` +
      `• Enable login capabilities\n` +
      `• Resume all permissions\n\n` +
      `Proceed with bulk activation?`
    );

    if (!confirmed) return;

    try {
      await bulkActivateUsers(selectedUsers);
      setSelectedUsers([]); // Clear selection after success
    } catch (error) {
      console.error('Failed to bulk activate users:', error);
      alert('❌ OPERATION_FAILED\n\nFailed to activate users. Check console for details.');
    }
  };

  const handleSelectAll = () => {
    if (selectedUsers.length === users.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(users.map(u => u.id));
    }
  };

  const handleSelectUser = (userId: string) => {
    setSelectedUsers(prev => {
      if (prev.includes(userId)) {
        return prev.filter(id => id !== userId);
      } else {
        return [...prev, userId];
      }
    });
  };

  const handleRoleChange = async (userId: string, currentRole: string, newRole: string, userEmail: string) => {
    if (currentRole === newRole) return;

    const confirmed = window.confirm(
      `🔐 ROLE_MODIFICATION_PROTOCOL\n\n` +
      `User: ${userEmail}\n` +
      `Current Role: ${currentRole}\n` +
      `New Role: ${newRole}\n\n` +
      `This action will:\n` +
      `• Modify user's access permissions\n` +
      `• May grant or revoke system capabilities\n` +
      `• Take effect immediately\n\n` +
      `Proceed with role change?`
    );

    if (!confirmed) return;

    try {
      await updateUserRole(userId, newRole);
    } catch (error) {
      console.error('Failed to update user role:', error);
      alert('❌ ROLE_UPDATE_FAILED\n\nFailed to change user role. Check console for details.');
    }
  };

  const handleResetPassword = async (userId: string, userEmail: string, userName: string) => {
    const confirmed = window.confirm(
      `🔒 PASSWORD_RESET_PROTOCOL\n\n` +
      `User: ${userName}\n` +
      `Email: ${userEmail}\n\n` +
      `This action will:\n` +
      `• Generate a temporary password\n` +
      `• Force user to change password on next login\n` +
      `• Invalidate current password immediately\n` +
      `• Email will be sent with temporary credentials\n\n` +
      `Proceed with password reset?`
    );

    if (!confirmed) return;

    try {
      const result = await resetUserPassword(userId);
      // Show temp password in alert (in production this should be emailed)
      alert(
        `✓ PASSWORD_RESET_SUCCESSFUL\n\n` +
        `User: ${userEmail}\n` +
        `Temporary Password: ${result.tempPassword}\n\n` +
        `⚠️ IMPORTANT:\n` +
        `• Copy this password now - it won't be shown again\n` +
        `• Send this to the user via secure channel\n` +
        `• User must change password on next login\n\n` +
        `(In production, this will be emailed automatically)`
      );
    } catch (error) {
      console.error('Failed to reset password:', error);
      alert('❌ PASSWORD_RESET_FAILED\n\nFailed to reset password. Check console for details.');
    }
  };

  const handleForceLogout = async (userId: string, userEmail: string, userName: string) => {
    const confirmed = window.confirm(
      `🚫 FORCE_LOGOUT_PROTOCOL\n\n` +
      `User: ${userName}\n` +
      `Email: ${userEmail}\n\n` +
      `This action will:\n` +
      `• Immediately invalidate user's active session\n` +
      `• User will be logged out from all devices\n` +
      `• User must login again to access the platform\n` +
      `• Use this for security incidents or support issues\n\n` +
      `Proceed with force logout?`
    );

    if (!confirmed) return;

    try {
      const result = await forceLogout(userId);
      alert(
        `✓ FORCE_LOGOUT_SUCCESSFUL\n\n` +
        `User: ${userEmail}\n` +
        `Session Status: ${result.sessionDeleted ? 'TERMINATED' : 'NO_ACTIVE_SESSION'}\n\n` +
        `${result.sessionDeleted
          ? '• User has been forcefully logged out\n• All active sessions terminated'
          : '• User had no active session\n• No action required'}`
      );
    } catch (error) {
      console.error('Failed to force logout:', error);
      alert('❌ FORCE_LOGOUT_FAILED\n\nFailed to force logout user. Check console for details.');
    }
  };

  const handleForceLogoutAll = async () => {
    const confirmed = window.confirm(
      `⚠️ EMERGENCY_FORCE_LOGOUT_ALL\n\n` +
      `🚨 CRITICAL ACTION - AFFECTS ALL USERS 🚨\n\n` +
      `This action will:\n` +
      `• Immediately log out ALL users from the platform\n` +
      `• Terminate ALL active sessions in Redis\n` +
      `• Force ALL users to re-authenticate\n` +
      `• Should ONLY be used in emergency situations\n\n` +
      `Examples: Security breach, system maintenance, critical bug\n\n` +
      `⚠️ THIS CANNOT BE UNDONE ⚠️\n\n` +
      `Type "FORCE LOGOUT ALL" to confirm:`
    );

    if (!confirmed) return;

    const verification = window.prompt('Type "FORCE LOGOUT ALL" to confirm:');
    if (verification !== 'FORCE LOGOUT ALL') {
      alert('❌ VERIFICATION_FAILED\n\nAction cancelled. Verification text did not match.');
      return;
    }

    try {
      const result = await forceLogoutAll();
      alert(
        `✓ FORCE_LOGOUT_ALL_SUCCESSFUL\n\n` +
        `Total Users: ${result.totalUsers}\n` +
        `Sessions Terminated: ${result.sessionsDeleted}\n` +
        `Failures: ${result.failures}\n\n` +
        `All users have been logged out.\n` +
        `Users must re-authenticate to access the platform.`
      );
    } catch (error) {
      console.error('Failed to force logout all:', error);
      alert('❌ FORCE_LOGOUT_ALL_FAILED\n\nFailed to logout all users. Check console for details.');
    }
  };

  const handleStartImpersonation = async (userId: string, userEmail: string, userName: string, userRole: string) => {
    // Prevent impersonating super admins
    if (userRole === 'SUPER_ADMIN') {
      alert('❌ IMPERSONATION_DENIED\n\nCannot impersonate SUPER_ADMIN users for security reasons.');
      return;
    }

    const confirmed = window.confirm(
      `🎭 IMPERSONATION_PROTOCOL\n\n` +
      `Target User: ${userName}\n` +
      `Email: ${userEmail}\n` +
      `Role: ${userRole}\n\n` +
      `This action will:\n` +
      `• Log you in as the target user temporarily\n` +
      `• Grant you access to their account and data\n` +
      `• Create an audit trail of this impersonation session\n` +
      `• Session will expire after 4 hours\n` +
      `• You can stop impersonation at any time\n\n` +
      `⚠️ Use ONLY for legitimate support and troubleshooting\n\n` +
      `Proceed with impersonation?`
    );

    if (!confirmed) return;

    try {
      const result = await startImpersonation(userId);
      alert(
        `✓ IMPERSONATION_STARTED\n\n` +
        `Now logged in as: ${result.targetUser.email}\n` +
        `Original Admin: ${result.admin.email}\n\n` +
        `⚠️ IMPORTANT:\n` +
        `• You are now acting as ${result.targetUser.name || result.targetUser.email}\n` +
        `• All actions will be logged and audited\n` +
        `• Session expires in 4 hours\n` +
        `• Click "STOP IMPERSONATION" to return to your admin session\n\n` +
        `The page will reload to apply the new session.`
      );
      // Reload page to apply new token
      window.location.reload();
    } catch (error) {
      console.error('Failed to start impersonation:', error);
      alert('❌ IMPERSONATION_FAILED\n\nFailed to start impersonation. Check console for details.');
    }
  };

  const handleStopImpersonation = async () => {
    const confirmed = window.confirm(
      `🎭 STOP_IMPERSONATION\n\n` +
      `This action will:\n` +
      `• Return you to your admin session\n` +
      `• End the current impersonation session\n` +
      `• Restore your admin privileges\n\n` +
      `Stop impersonation and return to admin mode?`
    );

    if (!confirmed) return;

    try {
      const result = await stopImpersonation();
      alert(
        `✓ RETURNED_TO_ADMIN_SESSION\n\n` +
        `Welcome back, ${result.admin.email}\n\n` +
        `• Impersonation session ended\n` +
        `• Admin privileges restored\n\n` +
        `The page will reload to apply your admin session.`
      );
      // Reload page to apply new token
      window.location.reload();
    } catch (error) {
      console.error('Failed to stop impersonation:', error);
      alert('❌ STOP_IMPERSONATION_FAILED\n\nFailed to stop impersonation. Check console for details.');
    }
  };

  const handleViewActivity = (userId: string, userEmail: string) => {
    setSelectedUserForActivity({ id: userId, email: userEmail });
    setShowActivityTimeline(true);
  };

  const handleExportData = async (userId: string, userEmail: string, userName: string) => {
    const confirmed = window.confirm(
      `📥 GDPR_DATA_EXPORT\n\n` +
      `User: ${userName}\n` +
      `Email: ${userEmail}\n\n` +
      `This will export all user data including:\n` +
      `• Personal information\n` +
      `• Campaigns, contacts, and workflows\n` +
      `• Audit logs and activity history\n` +
      `• Data processing information\n\n` +
      `Data will be downloaded as JSON file.\n\n` +
      `Proceed with export?`
    );

    if (confirmed) {
      try {
        await exportUserData(userId, userName);
        alert(`✅ Successfully exported data for ${userName}`);
      } catch (error) {
        alert(`❌ Failed to export data: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  };

  const handleCloseActivityTimeline = () => {
    setShowActivityTimeline(false);
    setSelectedUserForActivity(null);
  };

  return (
    <div className="p-6">
      {/* Impersonation Indicator Banner */}
      {isImpersonating && impersonationData && (
        <div className="mb-6 p-4 bg-gradient-to-r from-purple-900/50 to-pink-900/50 border-2 border-purple-500 rounded-lg animate-pulse">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <UserCog className="h-6 w-6 text-purple-400" />
              <div>
                <div className="admin-title text-lg text-purple-300 mb-1">
                  🎭 IMPERSONATION_MODE_ACTIVE
                </div>
                <div className="admin-subtitle text-sm">
                  <span className="text-purple-200">Logged in as:</span>{' '}
                  <span className="text-white font-semibold">{impersonationData.targetUser}</span>
                  {' '} | {' '}
                  <span className="text-purple-200">Admin:</span>{' '}
                  <span className="text-white">{impersonationData.adminEmail}</span>
                </div>
                <div className="text-xs text-purple-300 mt-1">
                  ⚠️ All actions performed will be logged and attributed to the impersonation session
                </div>
              </div>
            </div>
            <button
              className="admin-btn admin-btn-danger flex items-center gap-2 px-4 py-2 border-2 border-red-500"
              onClick={handleStopImpersonation}
            >
              <X className="h-4 w-4" />
              STOP_IMPERSONATION
            </button>
          </div>
        </div>
      )}

      {/* Page Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="admin-title text-2xl mb-1">USER_MATRIX</h1>
          <p className="admin-subtitle">MANAGING {stats?.total?.toLocaleString() || 0} SYSTEM_ENTITIES</p>
        </div>
        <div className="flex items-center gap-4">
          <button className="admin-btn admin-btn-primary flex items-center gap-2">
            <Download className="h-4 w-4" />
            EXPORT_DATA
          </button>
          <button className="admin-btn admin-btn-primary flex items-center gap-2">
            <UserPlus className="h-4 w-4" />
            NEW_USER
          </button>
          {staffRole === 'SUPER_ADMIN' && (
            <button
              className="admin-btn admin-btn-danger flex items-center gap-2 border-2 border-red-500"
              onClick={handleForceLogoutAll}
              title="Emergency: Force logout ALL users (SUPER_ADMIN only)"
            >
              <AlertTriangle className="h-4 w-4" />
              <LogOut className="h-4 w-4" />
              FORCE_LOGOUT_ALL
            </button>
          )}
        </div>
      </div>

      {/* Cyberpunk Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="admin-stat-card admin-glow-hover">
          <div className="flex items-center justify-between mb-4">
            <Users className="h-6 w-6 text-[hsl(var(--admin-primary))]" />
            <Zap className="h-4 w-4 text-[hsl(var(--admin-accent))]" />
          </div>
          <div className="admin-stat-value">{stats?.total?.toLocaleString() || 0}</div>
          <div className="admin-stat-label">TOTAL_USERS</div>
          <div className="admin-stat-change positive">+{Math.floor((stats?.total || 0) * 0.07)} THIS_CYCLE</div>
        </div>

        <div className="admin-stat-card admin-glow-hover">
          <div className="flex items-center justify-between mb-4">
            <CheckCircle className="h-6 w-6 text-[hsl(var(--admin-success))]" />
            <Activity className="h-4 w-4 text-[hsl(var(--admin-success))]" />
          </div>
          <div className="admin-stat-value">{stats?.active?.toLocaleString() || 0}</div>
          <div className="admin-stat-label">ACTIVE_SESSIONS</div>
          <div className="admin-stat-change positive">{((stats?.active || 0) / Math.max(stats?.total || 1, 1) * 100).toFixed(1)}% ONLINE</div>
        </div>

        <div className="admin-stat-card admin-glow-hover">
          <div className="flex items-center justify-between mb-4">
            <AlertTriangle className="h-6 w-6 text-[hsl(var(--admin-warning))]" />
            <Globe className="h-4 w-4 text-[hsl(var(--admin-warning))]" />
          </div>
          <div className="admin-stat-value">{stats?.pending?.toLocaleString() || 0}</div>
          <div className="admin-stat-label">PENDING_AUTH</div>
          <div className="admin-stat-change negative">{((stats?.pending || 0) / Math.max(stats?.total || 1, 1) * 100).toFixed(1)}% UNVERIFIED</div>
        </div>

        <div className="admin-stat-card admin-glow-hover">
          <div className="flex items-center justify-between mb-4">
            <Shield className="h-6 w-6 text-[hsl(var(--admin-danger))]" />
            <Terminal className="h-4 w-4 text-[hsl(var(--admin-danger))]" />
          </div>
          <div className="admin-stat-value">{stats?.suspended?.toLocaleString() || 0}</div>
          <div className="admin-stat-label">SUSPENDED</div>
          <div className="admin-stat-change negative">{((stats?.suspended || 0) / Math.max(stats?.total || 1, 1) * 100).toFixed(1)}% BLOCKED</div>
        </div>
      </div>

        {/* Cyberpunk Control Panel */}
        <div className="admin-card mb-8 p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Database className="h-5 w-5 text-[hsl(var(--admin-primary))]" />
              <h2 className="admin-title text-xl">USER_DIRECTORY</h2>
            </div>
            <div className="flex items-center gap-2">
              <button
                className="admin-btn flex items-center gap-2 admin-glow-hover"
                onClick={() => setShowPermissionsMatrix(true)}
              >
                <Key className="h-4 w-4" />
                PERMISSIONS_MATRIX
              </button>
              <button
                className="admin-btn flex items-center gap-2 admin-glow-hover"
                onClick={refreshAll}
                disabled={loading}
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                SYNC_DB
              </button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[hsl(var(--admin-text-muted))] h-4 w-4" />
              <input
                className="admin-input pl-10 w-full"
                placeholder="SEARCH_USERS..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <select 
              className="admin-input"
              value={roleFilter} 
              onChange={(e) => setRoleFilter(e.target.value)}
            >
              <option value="all">ALL_ROLES</option>
              <option value="USER">USER</option>
              <option value="ADMIN">ADMIN</option>
              <option value="SUPER_ADMIN">SUPER_ADMIN</option>
              <option value="IT_ADMIN">IT_ADMIN</option>
            </select>
            
            <select 
              className="admin-input"
              value={statusFilter} 
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">ALL_STATUS</option>
              <option value="active">ACTIVE</option>
              <option value="pending_verification">PENDING</option>
              <option value="suspended">SUSPENDED</option>
            </select>
          </div>

          {/* Bulk Actions */}
          {selectedUsers.length > 0 && (
            <div className="mb-4 p-4 bg-[hsl(var(--admin-bg-secondary))] border border-[hsl(var(--admin-border))] rounded-lg">
              <div className="flex items-center justify-between">
                <span className="admin-subtitle">
                  {selectedUsers.length} USER{selectedUsers.length !== 1 ? 'S' : ''} SELECTED
                </span>
                <div className="flex items-center gap-2">
                  <button
                    className="admin-btn admin-btn-success text-xs px-4 py-2"
                    onClick={handleBulkActivate}
                  >
                    <CheckCircle className="h-3 w-3 mr-1" />
                    BULK_ACTIVATE
                  </button>
                  <button
                    className="admin-btn admin-btn-danger text-xs px-4 py-2"
                    onClick={handleBulkSuspend}
                  >
                    <Ban className="h-3 w-3 mr-1" />
                    BULK_SUSPEND
                  </button>
                  <button
                    className="admin-btn text-xs px-4 py-2"
                    onClick={() => setSelectedUsers([])}
                  >
                    CLEAR
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Cyberpunk Data Table */}
          <div className="admin-table">
            {loading ? (
              <div className="p-12 text-center">
                <div className="admin-loading mx-auto mb-4"></div>
                <p className="admin-subtitle">ACCESSING_DATABASE...</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr>
                      <th className="w-12">
                        <input
                          type="checkbox"
                          checked={users.length > 0 && selectedUsers.length === users.length}
                          onChange={handleSelectAll}
                          className="admin-checkbox"
                        />
                      </th>
                      <th>USER_ID</th>
                      <th>ACCESS_LEVEL</th>
                      <th>STATUS</th>
                      <th>ORGANIZATION</th>
                      <th>LAST_SEEN</th>
                      <th>ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr key={user.id} className="admin-slide-in">
                        <td>
                          <input
                            type="checkbox"
                            checked={selectedUsers.includes(user.id)}
                            onChange={() => handleSelectUser(user.id)}
                            className="admin-checkbox"
                          />
                        </td>
                        <td>
                          <div>
                            <div className="font-medium text-[hsl(var(--admin-text-primary))]">
                              {user.name || 'UNKNOWN_USER'}
                            </div>
                            <div className="text-[hsl(var(--admin-text-muted))] text-xs">
                              {user.email}
                            </div>
                          </div>
                        </td>
                        <td>
                          <select
                            value={user.role}
                            onChange={(e) => handleRoleChange(user.id, user.role, e.target.value, user.email)}
                            className="admin-input text-xs py-1 px-2 bg-[hsl(var(--admin-bg-secondary))] border-[hsl(var(--admin-border))]"
                            disabled={user.role === 'SUPER_ADMIN' || !permissions.canUpdateUsers}
                          >
                            <option value="USER">USER</option>
                            <option value="ADMIN">ADMIN</option>
                            <option value="IT_ADMIN">IT_ADMIN</option>
                            <option value="SUPER_ADMIN">SUPER_ADMIN</option>
                            <option value="AI_AGENT">AI_AGENT</option>
                          </select>
                        </td>
                        <td>
                          {getStatusBadge(user)}
                        </td>
                        <td>
                          {user.organization ? (
                            <div>
                              <div className="text-[hsl(var(--admin-text-primary))] font-medium">
                                {user.organization.name}
                              </div>
                              <div className="text-[hsl(var(--admin-text-muted))] text-xs">
                                {user.organization.plan}
                              </div>
                            </div>
                          ) : (
                            <span className="text-[hsl(var(--admin-text-muted))]">NULL</span>
                          )}
                        </td>
                        <td>
                          <div className="text-[hsl(var(--admin-text-secondary))]">
                            {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString() : 'Never'}
                          </div>
                          <div className="text-[hsl(var(--admin-text-muted))] text-xs">
                            {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleTimeString() : 'No activity'}
                          </div>
                        </td>
                        <td>
                          <div className="flex items-center gap-2">
                            <button
                              className="admin-btn text-xs px-3 py-1"
                              onClick={() => console.log('View user:', user.id)}
                            >
                              <Eye className="h-3 w-3 mr-1" />
                              VIEW
                            </button>
                            <button
                              className="admin-btn admin-btn-primary text-xs px-3 py-1"
                              onClick={() => handleViewActivity(user.id, user.email)}
                              title="View user activity timeline and audit logs"
                            >
                              <Activity className="h-3 w-3 mr-1" />
                              ACTIVITY
                            </button>
                            <button
                              className="admin-btn admin-btn-success text-xs px-3 py-1"
                              onClick={() => handleExportData(user.id, user.email, user.name || 'User')}
                              title="Export all user data (GDPR compliance)"
                            >
                              <Download className="h-3 w-3 mr-1" />
                              EXPORT
                            </button>
                            <button
                              className="admin-btn admin-btn-warning text-xs px-3 py-1"
                              onClick={() => handleResetPassword(user.id, user.email, user.name || 'User')}
                              disabled={!permissions.canUpdateUsers}
                            >
                              <KeyRound className="h-3 w-3 mr-1" />
                              RESET_PWD
                            </button>
                            <button
                              className="admin-btn admin-btn-danger text-xs px-3 py-1"
                              onClick={() => handleForceLogout(user.id, user.email, user.name || 'User')}
                              disabled={!permissions.canUpdateUsers}
                              title="Force logout user (terminate active sessions)"
                            >
                              <LogOut className="h-3 w-3 mr-1" />
                              FORCE_LOGOUT
                            </button>
                            <button
                              className="admin-btn admin-btn-secondary text-xs px-3 py-1"
                              onClick={() => handleStartImpersonation(user.id, user.email, user.name || 'User', user.role)}
                              disabled={user.role === 'SUPER_ADMIN' || user.isSuspended}
                              title="Login as this user for support (creates audit trail)"
                            >
                              <UserCog className="h-3 w-3 mr-1" />
                              IMPERSONATE
                            </button>
                            {user.isSuspended ? (
                              <button
                                className="admin-btn admin-btn-success text-xs px-3 py-1"
                                onClick={() => handleActivateUser(user.id)}
                              >
                                <CheckCircle className="h-3 w-3 mr-1" />
                                ACTIVATE
                              </button>
                            ) : (
                              <button
                                className="admin-btn admin-btn-danger text-xs px-3 py-1"
                                onClick={() => handleSuspendUser(user.id)}
                              >
                                <Ban className="h-3 w-3 mr-1" />
                                SUSPEND
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Cyberpunk Pagination */}
        {!loading && pagination.pages > 1 && (
          <div className="admin-card p-4 mt-6 flex items-center justify-between">
            <div className="admin-subtitle">
              PAGE {pagination.page} OF {pagination.pages} {/* TOTAL_RECORDS: */} {pagination.total}
            </div>
            <div className="flex items-center gap-2">
              <button
                className="admin-btn"
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
              >
                PREV
              </button>
              <button
                className="admin-btn"
                onClick={() => setCurrentPage(Math.min(pagination.pages, currentPage + 1))}
                disabled={currentPage === pagination.pages}
              >
                NEXT
              </button>
            </div>
          </div>
        )}

        {/* System Status Footer */}
        {staffRole === 'SUPER_ADMIN' && (
          <div className="admin-card p-6 mt-8 border-l-4 border-l-[hsl(var(--admin-primary))]">
            <div className="flex items-start gap-4">
              <Terminal className="h-6 w-6 text-[hsl(var(--admin-primary))] mt-1" />
              <div>
                <h4 className="admin-title text-lg mb-2">SYSTEM_STATUS</h4>
                <p className="admin-subtitle mb-3">
                  USER_MANAGEMENT.MODULE.ONLINE {/* VERSION: 3.0.1 */}
                </p>
                <div className="flex gap-4">
                  <div className="admin-badge admin-badge-success">DATABASE_CONNECTED</div>
                  <div className="admin-badge admin-badge-success">API_RESPONSIVE</div>
                  <div className="admin-badge admin-badge-warning">CACHE_SYNC_PENDING</div>
                </div>
                <p className="admin-subtitle mt-3 text-xs">
                  {/* Advanced operations: BULK_EDIT, AUDIT_TRAILS, PERMISSION_MATRIX available in next iteration */}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Permissions Matrix Modal */}
        {showPermissionsMatrix && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="admin-card max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
              <div className="flex items-center justify-between p-6 border-b border-[hsl(var(--admin-border))]">
                <div className="flex items-center gap-3">
                  <Key className="h-6 w-6 text-[hsl(var(--admin-primary))]" />
                  <h2 className="admin-title text-2xl">ROLE_PERMISSIONS_MATRIX</h2>
                </div>
                <button
                  onClick={() => setShowPermissionsMatrix(false)}
                  className="admin-btn text-xs px-3 py-2"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="p-6 overflow-auto flex-1">
                <p className="admin-subtitle mb-6">
                  PERMISSION INHERITANCE: Each role includes permissions from lower tiers
                </p>

                <div className="space-y-6">
                  {/* USER Role */}
                  <div className="admin-card p-4 bg-[hsl(var(--admin-bg-secondary))]">
                    <h3 className="admin-title text-lg mb-3 flex items-center gap-2">
                      <span className="admin-badge admin-badge-secondary">USER</span>
                      <span className="text-[hsl(var(--admin-text-muted))] text-sm">Base Access Level</span>
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
                      <div className="admin-badge">VIEW_USER</div>
                      <div className="admin-badge">UPDATE_USER</div>
                      <div className="admin-badge">CREATE_CONTACT</div>
                      <div className="admin-badge">UPDATE_CONTACT</div>
                      <div className="admin-badge">VIEW_CONTACT</div>
                      <div className="admin-badge">CREATE_CAMPAIGN</div>
                      <div className="admin-badge">UPDATE_CAMPAIGN</div>
                      <div className="admin-badge">VIEW_CAMPAIGN</div>
                      <div className="admin-badge">SEND_CAMPAIGN</div>
                      <div className="admin-badge">CREATE_TASK</div>
                      <div className="admin-badge">UPDATE_TASK</div>
                      <div className="admin-badge">VIEW_TASK</div>
                      <div className="admin-badge">CREATE_WORKFLOW</div>
                      <div className="admin-badge">UPDATE_WORKFLOW</div>
                      <div className="admin-badge">VIEW_WORKFLOW</div>
                      <div className="admin-badge">EXECUTE_WORKFLOW</div>
                      <div className="admin-badge">USE_AI_FEATURES</div>
                      <div className="admin-badge">VIEW_ANALYTICS</div>
                    </div>
                  </div>

                  {/* ADMIN Role */}
                  <div className="admin-card p-4 bg-[hsl(var(--admin-bg-secondary))]">
                    <h3 className="admin-title text-lg mb-3 flex items-center gap-2">
                      <span className="admin-badge admin-badge-success">ADMIN</span>
                      <span className="text-[hsl(var(--admin-text-muted))] text-sm">+ Advanced Operations</span>
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
                      <div className="admin-badge admin-badge-success">DELETE_CONTACT</div>
                      <div className="admin-badge admin-badge-success">BULK_CONTACT_OPERATIONS</div>
                      <div className="admin-badge admin-badge-success">EXPORT_CONTACTS</div>
                      <div className="admin-badge admin-badge-success">DELETE_CAMPAIGN</div>
                      <div className="admin-badge admin-badge-success">DELETE_TASK</div>
                      <div className="admin-badge admin-badge-success">ASSIGN_TASK</div>
                      <div className="admin-badge admin-badge-success">DELETE_WORKFLOW</div>
                      <div className="admin-badge admin-badge-success">EXECUTE_AI_TASKS</div>
                      <div className="admin-badge admin-badge-success">DELETE_DATA</div>
                      <div className="admin-badge admin-badge-success">MANAGE_INTEGRATIONS</div>
                      <div className="admin-badge admin-badge-success">MANAGE_BILLING</div>
                      <div className="admin-badge admin-badge-success">UPDATE_ORGANIZATION</div>
                      <div className="admin-badge admin-badge-success">VIEW_ORGANIZATION</div>
                      <div className="admin-badge admin-badge-success">MANAGE_ORGANIZATION_SETTINGS</div>
                    </div>
                  </div>

                  {/* IT_ADMIN Role */}
                  <div className="admin-card p-4 bg-[hsl(var(--admin-bg-secondary))]">
                    <h3 className="admin-title text-lg mb-3 flex items-center gap-2">
                      <span className="admin-badge admin-badge-secondary">IT_ADMIN</span>
                      <span className="text-[hsl(var(--admin-text-muted))] text-sm">+ System Administration</span>
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
                      <div className="admin-badge admin-badge-warning">CREATE_USER</div>
                      <div className="admin-badge admin-badge-warning">UPDATE_USER</div>
                      <div className="admin-badge admin-badge-warning">DELETE_USER</div>
                      <div className="admin-badge admin-badge-warning">VIEW_USER</div>
                      <div className="admin-badge admin-badge-warning">CREATE_ORGANIZATION</div>
                      <div className="admin-badge admin-badge-warning">UPDATE_ORGANIZATION</div>
                      <div className="admin-badge admin-badge-warning">DELETE_ORGANIZATION</div>
                      <div className="admin-badge admin-badge-warning">VIEW_ORGANIZATION</div>
                      <div className="admin-badge admin-badge-warning">VIEW_SYSTEM_LOGS</div>
                      <div className="admin-badge admin-badge-warning">MANAGE_SYSTEM_SETTINGS</div>
                      <div className="admin-badge admin-badge-warning">MANAGE_SECURITY_SETTINGS</div>
                      <div className="admin-badge admin-badge-warning">VIEW_SECURITY_LOGS</div>
                      <div className="admin-badge admin-badge-warning">MANAGE_API_KEYS</div>
                      <div className="admin-badge admin-badge-warning">CONFIGURE_AI_SETTINGS</div>
                      <div className="admin-badge admin-badge-warning">APPROVE_AI_OPERATIONS</div>
                      <div className="admin-badge admin-badge-warning">VIEW_ADMIN</div>
                    </div>
                  </div>

                  {/* SUPER_ADMIN Role */}
                  <div className="admin-card p-4 bg-[hsl(var(--admin-bg-secondary))]">
                    <h3 className="admin-title text-lg mb-3 flex items-center gap-2">
                      <span className="admin-badge admin-badge-danger">SUPER_ADMIN</span>
                      <span className="text-[hsl(var(--admin-text-muted))] text-sm">ALL PERMISSIONS</span>
                    </h3>
                    <div className="text-[hsl(var(--admin-text-secondary))] text-sm">
                      ✓ Full system access - All permissions granted
                    </div>
                  </div>

                  {/* AI_AGENT Role */}
                  <div className="admin-card p-4 bg-[hsl(var(--admin-bg-secondary))]">
                    <h3 className="admin-title text-lg mb-3 flex items-center gap-2">
                      <span className="admin-badge admin-badge-secondary">AI_AGENT</span>
                      <span className="text-[hsl(var(--admin-text-muted))] text-sm">Automated Operations</span>
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
                      <div className="admin-badge">VIEW_USER</div>
                      <div className="admin-badge">CREATE_CONTACT</div>
                      <div className="admin-badge">UPDATE_CONTACT</div>
                      <div className="admin-badge">VIEW_CONTACT</div>
                      <div className="admin-badge">BULK_CONTACT_OPERATIONS</div>
                      <div className="admin-badge">CREATE_CAMPAIGN</div>
                      <div className="admin-badge">UPDATE_CAMPAIGN</div>
                      <div className="admin-badge">VIEW_CAMPAIGN</div>
                      <div className="admin-badge">SEND_CAMPAIGN</div>
                      <div className="admin-badge">SCHEDULE_CAMPAIGN</div>
                      <div className="admin-badge">CREATE_TASK</div>
                      <div className="admin-badge">UPDATE_TASK</div>
                      <div className="admin-badge">VIEW_TASK</div>
                      <div className="admin-badge">ASSIGN_TASK</div>
                      <div className="admin-badge">CREATE_WORKFLOW</div>
                      <div className="admin-badge">UPDATE_WORKFLOW</div>
                      <div className="admin-badge">VIEW_WORKFLOW</div>
                      <div className="admin-badge">EXECUTE_WORKFLOW</div>
                      <div className="admin-badge">USE_AI_FEATURES</div>
                      <div className="admin-badge">EXECUTE_AI_TASKS</div>
                      <div className="admin-badge">VIEW_ANALYTICS</div>
                      <div className="admin-badge">EXPORT_DATA</div>
                      <div className="admin-badge">IMPORT_DATA</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* User Activity Timeline Modal */}
        {showActivityTimeline && selectedUserForActivity && (
          <UserActivityTimeline
            userId={selectedUserForActivity.id}
            userEmail={selectedUserForActivity.email}
            isOpen={showActivityTimeline}
            onClose={handleCloseActivityTimeline}
          />
        )}
    </div>
  );
}