"use client";

import { useAdmin } from "@/components/admin/AdminProvider";
import {
  Terminal,
  Database,
  Users,
  Shield,
  Activity,
  Zap,
  Globe,
  Server,
  Cpu,
  HardDrive,
  Network,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  Eye,
  RefreshCw,
  Wifi,
  WifiOff
} from "lucide-react";
import { useAdminMetricsWebSocket } from "@/lib/api/hooks/useAdminMetricsWebSocket";
import { RetryIndicator } from "@/components/RetryIndicator";

export default function AdminDashboardPage() {
  const { permissions, staffRole } = useAdmin();
  const {
    stats,
    services,
    infrastructure,
    status: wsStatus,
    requestUpdate
  } = useAdminMetricsWebSocket();

  // Compute derived values
  const systemMetrics = stats?.systemResources || { cpu: 0, memory: 0, disk: 0, network: 0 };
  const uptime = stats?.uptime?.formatted || "Loading...";
  const activeThreats = stats?.alerts?.filter(a => !a.resolved).length || 0;
  const servicesOnline = services?.filter(s => s.status === 'operational').length || 0;
  const totalServices = services?.length || 0;

  return (
    <div className="p-6">
      {/* Dashboard Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="admin-title text-2xl mb-1">CONTROL_CENTER</h1>
          <p className="admin-subtitle">SYSTEM_STATUS.REALTIME_MONITORING</p>
        </div>
        <div className="flex items-center gap-4">
          {/* WebSocket Connection Status */}
          <div className={`admin-badge ${
            wsStatus.connected ? 'admin-badge-success' :
            wsStatus.connecting ? 'admin-badge-info' :
            wsStatus.reconnecting ? 'admin-badge-warning' :
            'admin-badge-danger'
          }`}>
            {wsStatus.connected ? (
              <>
                <Wifi className="h-3 w-3 mr-1" />
                LIVE
              </>
            ) : wsStatus.connecting ? (
              <>
                <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                CONNECTING
              </>
            ) : wsStatus.reconnecting ? (
              <>
                <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                RECONNECTING
              </>
            ) : (
              <>
                <WifiOff className="h-3 w-3 mr-1" />
                OFFLINE
              </>
            )}
          </div>

          <button
            onClick={() => requestUpdate()}
            disabled={!wsStatus.connected}
            className="admin-btn admin-btn-outline flex items-center gap-2"
            title="Request metrics update"
          >
            <RefreshCw className="h-4 w-4" />
            REFRESH
          </button>

          <div className="admin-badge admin-badge-success">
            <Activity className="h-3 w-3 mr-1" />
            OPERATIONAL
          </div>
          <div className="admin-badge admin-badge-warning">
            UPTIME: {uptime}
          </div>
        </div>
      </div>

      {/* Error Display */}
      {wsStatus.error && (
        <div className="admin-card p-4 mb-6 border-l-4 border-l-[hsl(var(--admin-danger))]">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-[hsl(var(--admin-danger))]" />
            <div>
              <p className="admin-title text-sm">WEBSOCKET CONNECTION ERROR</p>
              <p className="admin-subtitle text-xs">{wsStatus.error}</p>
              {wsStatus.reconnectAttempt > 0 && (
                <p className="admin-subtitle text-xs mt-1">
                  Reconnection attempt {wsStatus.reconnectAttempt}/5
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* System Health Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="admin-stat-card admin-glow-hover">
          <div className="flex items-center justify-between mb-4">
            <Cpu className="h-6 w-6 text-[hsl(var(--admin-primary))]" />
            <div className="admin-pulse"></div>
          </div>
          <div className="admin-stat-value">{systemMetrics.cpu.toFixed(1)}%</div>
          <div className="admin-stat-label">CPU_UTILIZATION</div>
          <div className={`admin-stat-change ${systemMetrics.cpu > 80 ? 'negative' : 'positive'}`}>
            {systemMetrics.cpu > 80 ? 'HIGH_LOAD' : 'OPTIMAL'}
          </div>
        </div>

        <div className="admin-stat-card admin-glow-hover">
          <div className="flex items-center justify-between mb-4">
            <HardDrive className="h-6 w-6 text-[hsl(var(--admin-accent))]" />
            <Activity className="h-4 w-4 text-[hsl(var(--admin-accent))]" />
          </div>
          <div className="admin-stat-value">{systemMetrics.memory.toFixed(1)}%</div>
          <div className="admin-stat-label">MEMORY_USAGE</div>
          <div className={`admin-stat-change ${systemMetrics.memory > 85 ? 'negative' : 'positive'}`}>
            {systemMetrics.memory > 85 ? 'CRITICAL' : 'STABLE'}
          </div>
        </div>

        <div className="admin-stat-card admin-glow-hover">
          <div className="flex items-center justify-between mb-4">
            <Database className="h-6 w-6 text-[hsl(var(--admin-success))]" />
            <TrendingUp className="h-4 w-4 text-[hsl(var(--admin-success))]" />
          </div>
          <div className="admin-stat-value">{systemMetrics.disk.toFixed(1)}%</div>
          <div className="admin-stat-label">DISK_USAGE</div>
          <div className="admin-stat-change positive">GROWING</div>
        </div>

        <div className="admin-stat-card admin-glow-hover">
          <div className="flex items-center justify-between mb-4">
            <Network className="h-6 w-6 text-[hsl(var(--admin-warning))]" />
            <Zap className="h-4 w-4 text-[hsl(var(--admin-warning))]" />
          </div>
          <div className="admin-stat-value">{systemMetrics.network.toFixed(1)} GB/s</div>
          <div className="admin-stat-label">NETWORK_I/O</div>
          <div className="admin-stat-change positive">ACTIVE</div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="admin-card p-6">
          <div className="flex items-center justify-between mb-4">
            <Users className="h-8 w-8 text-[hsl(var(--admin-primary))]" />
            <Eye className="h-5 w-5 text-[hsl(var(--admin-text-muted))]" />
          </div>
          <h3 className="admin-title text-lg mb-2">THROUGHPUT</h3>
          <div className="text-3xl font-bold text-[hsl(var(--admin-text-primary))] mb-2">
            {stats?.performance?.throughput?.toLocaleString() || 0}
          </div>
          <p className="admin-subtitle">REQUESTS_PER_MINUTE</p>
        </div>

        <div className="admin-card p-6">
          <div className="flex items-center justify-between mb-4">
            <Shield className="h-8 w-8 text-[hsl(var(--admin-danger))]" />
            <AlertTriangle className="h-5 w-5 text-[hsl(var(--admin-danger))]" />
          </div>
          <h3 className="admin-title text-lg mb-2">SECURITY_ALERTS</h3>
          <div className={`text-3xl font-bold mb-2 ${activeThreats > 0 ? 'text-[hsl(var(--admin-danger))]' : 'text-[hsl(var(--admin-success))]'}`}>
            {activeThreats}
          </div>
          <p className="admin-subtitle">ACTIVE_THREATS</p>
        </div>

        <div className="admin-card p-6">
          <div className="flex items-center justify-between mb-4">
            <Server className="h-8 w-8 text-[hsl(var(--admin-success))]" />
            <CheckCircle className="h-5 w-5 text-[hsl(var(--admin-success))]" />
          </div>
          <h3 className="admin-title text-lg mb-2">SERVICES_ONLINE</h3>
          <div className="text-3xl font-bold text-[hsl(var(--admin-success))] mb-2">
            {servicesOnline}/{totalServices}
          </div>
          <p className="admin-subtitle">{servicesOnline === totalServices ? 'ALL_SYSTEMS_GO' : 'DEGRADED_SERVICE'}</p>
        </div>
      </div>

      {/* System Status Matrix */}
      <div className="admin-card p-6">
        <div className="flex items-center gap-3 mb-6">
          <Terminal className="h-5 w-5 text-[hsl(var(--admin-primary))]" />
          <h2 className="admin-title text-xl">SYSTEM_STATUS_MATRIX</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {services && services.length > 0 ? (
            services.slice(0, 4).map((service) => (
              <div key={service.name} className="p-4 border border-[hsl(var(--admin-border))] rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="admin-subtitle">{service.name.toUpperCase().replace(/ /g, '_')}</span>
                  <div className={`admin-badge ${
                    service.status === 'operational' ? 'admin-badge-success' :
                    service.status === 'degraded' ? 'admin-badge-warning' :
                    service.status === 'maintenance' ? 'admin-badge-info' :
                    'admin-badge-danger'
                  }`}>
                    {service.status.toUpperCase()}
                  </div>
                </div>
                <div className="text-sm text-[hsl(var(--admin-text-muted))] mt-2">
                  {service.responseTime && `Response: ${service.responseTime}`}
                  {service.uptime && ` • Uptime: ${service.uptime}`}
                </div>
                {service.issues && service.issues.length > 0 && (
                  <div className="text-xs text-[hsl(var(--admin-warning))] mt-1">
                    {service.issues[0]}
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="col-span-4 text-center py-8 text-[hsl(var(--admin-text-muted))]">
              {wsStatus.connecting ? 'Connecting to real-time metrics...' :
               !wsStatus.connected ? 'Disconnected - No service data available' :
               'No service data available'}
            </div>
          )}
        </div>
      </div>

      {/* System Info Footer */}
      {staffRole === 'SUPER_ADMIN' && (
        <div className="admin-card p-6 mt-8 border-l-4 border-l-[hsl(var(--admin-primary))]">
          <div className="flex items-start gap-4">
            <Terminal className="h-6 w-6 text-[hsl(var(--admin-primary))] mt-1" />
            <div>
              <h4 className="admin-title text-lg mb-2">SYSTEM_INFO</h4>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
                <div>
                  <span className="admin-subtitle">BUILD:</span>
                  <div className="text-[hsl(var(--admin-text-primary))]">v3.0.1-cyberpunk</div>
                </div>
                <div>
                  <span className="admin-subtitle">NODE:</span>
                  <div className="text-[hsl(var(--admin-text-primary))]">NODE-ALPHA-01</div>
                </div>
                <div>
                  <span className="admin-subtitle">CLUSTER:</span>
                  <div className="text-[hsl(var(--admin-text-primary))]">MARKETSAGE-PROD</div>
                </div>
                <div>
                  <span className="admin-subtitle">REGION:</span>
                  <div className="text-[hsl(var(--admin-text-primary))]">AF-WEST-1</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Retry Indicator - Shows toast notifications for API retries */}
      <RetryIndicator />
    </div>
  );
}