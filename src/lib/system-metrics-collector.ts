/**
 * System Metrics Collector
 *
 * Collects system metrics (CPU, memory, disk, network) for monitoring.
 * Runs as a singleton with optional automatic collection.
 */

interface SystemMetrics {
  cpu: {
    usage: number;
    cores: number;
  };
  memory: {
    total: number;
    used: number;
    free: number;
    percentage: number;
  };
  disk: {
    total: number;
    used: number;
    free: number;
    percentage: number;
  };
  network: {
    bytesIn: number;
    bytesOut: number;
  };
  timestamp: Date;
}

interface CollectorStatus {
  isCollecting: boolean;
  intervalMs: number | null;
  lastCollectionTime: Date | null;
  totalCollections: number;
  errors: number;
}

class SystemMetricsCollector {
  private isCollecting: boolean = false;
  private intervalId: NodeJS.Timeout | null = null;
  private intervalMs: number | null = null;
  private lastCollectionTime: Date | null = null;
  private totalCollections: number = 0;
  private errors: number = 0;
  private latestMetrics: SystemMetrics | null = null;

  /**
   * Start automatic metrics collection
   * @param intervalMs - Collection interval in milliseconds (default: 60000ms = 1 minute)
   */
  startCollection(intervalMs: number = 60000): void {
    if (this.isCollecting) {
      console.warn('[SystemMetricsCollector] Collection already running');
      return;
    }

    this.intervalMs = intervalMs;
    this.isCollecting = true;

    // Collect immediately
    this.collectMetrics().catch(console.error);

    // Set up interval
    this.intervalId = setInterval(() => {
      this.collectMetrics().catch(console.error);
    }, intervalMs);

    console.log(`[SystemMetricsCollector] Started collection with ${intervalMs}ms interval`);
  }

  /**
   * Stop automatic metrics collection
   */
  stopCollection(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    this.isCollecting = false;
    this.intervalMs = null;

    console.log('[SystemMetricsCollector] Stopped collection');
  }

  /**
   * Collect metrics once
   */
  async collectMetrics(): Promise<SystemMetrics> {
    try {
      const metrics = await this.gatherMetrics();
      this.latestMetrics = metrics;
      this.lastCollectionTime = new Date();
      this.totalCollections++;

      return metrics;
    } catch (error) {
      this.errors++;
      console.error('[SystemMetricsCollector] Collection error:', error);
      throw error;
    }
  }

  /**
   * Get current collector status
   */
  getStatus(): CollectorStatus {
    return {
      isCollecting: this.isCollecting,
      intervalMs: this.intervalMs,
      lastCollectionTime: this.lastCollectionTime,
      totalCollections: this.totalCollections,
      errors: this.errors,
    };
  }

  /**
   * Get latest collected metrics
   */
  getLatestMetrics(): SystemMetrics | null {
    return this.latestMetrics;
  }

  /**
   * Gather system metrics
   * Note: In browser/Next.js environment, this is a stub that returns mock data.
   * In production, this would call backend APIs or use Node.js system libraries.
   */
  private async gatherMetrics(): Promise<SystemMetrics> {
    // In browser/Next.js API routes, we can't access system metrics directly
    // This should call the backend API to get real metrics
    // For now, return mock data structure

    if (typeof window !== 'undefined') {
      // Browser environment - shouldn't be called
      throw new Error('System metrics collection not supported in browser');
    }

    // Server-side - in production, this would use Node.js libraries like 'os', 'process', etc.
    // For now, return mock data
    const mockMetrics: SystemMetrics = {
      cpu: {
        usage: Math.random() * 100,
        cores: 4,
      },
      memory: {
        total: 16 * 1024 * 1024 * 1024, // 16GB
        used: Math.random() * 10 * 1024 * 1024 * 1024,
        free: 0, // Will be calculated
        percentage: 0, // Will be calculated
      },
      disk: {
        total: 512 * 1024 * 1024 * 1024, // 512GB
        used: Math.random() * 400 * 1024 * 1024 * 1024,
        free: 0, // Will be calculated
        percentage: 0, // Will be calculated
      },
      network: {
        bytesIn: Math.floor(Math.random() * 1000000),
        bytesOut: Math.floor(Math.random() * 1000000),
      },
      timestamp: new Date(),
    };

    // Calculate derived values
    mockMetrics.memory.free = mockMetrics.memory.total - mockMetrics.memory.used;
    mockMetrics.memory.percentage = (mockMetrics.memory.used / mockMetrics.memory.total) * 100;

    mockMetrics.disk.free = mockMetrics.disk.total - mockMetrics.disk.used;
    mockMetrics.disk.percentage = (mockMetrics.disk.used / mockMetrics.disk.total) * 100;

    return mockMetrics;
  }
}

// Export singleton instance
export const systemMetricsCollector = new SystemMetricsCollector();

// Auto-start collection in production (with 60 second interval)
if (process.env.NODE_ENV === 'production' && typeof window === 'undefined') {
  systemMetricsCollector.startCollection(60000);
}
