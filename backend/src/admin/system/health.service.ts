import { Injectable, Logger, Inject, forwardRef } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { ConfigService } from '@nestjs/config';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as os from 'os';
import { Redis } from 'ioredis';
import { AdminGateway } from '../gateway/admin.gateway';

const execAsync = promisify(exec);

// Helper function to wrap a promise with a hard timeout
function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  fallback: T,
  operationName: string,
): Promise<T> {
  let timeoutId: NodeJS.Timeout;
  const timeoutPromise = new Promise<T>((resolve) => {
    timeoutId = setTimeout(() => {
      resolve(fallback);
    }, timeoutMs);
  });

  return Promise.race([promise, timeoutPromise]).finally(() => {
    clearTimeout(timeoutId);
  });
}

export type HealthStatus = 'healthy' | 'degraded' | 'unhealthy';

export interface ServiceHealth {
  status: HealthStatus;
  latency?: number;
  message?: string;
  details?: Record<string, any>;
}

export interface ContainerInfo {
  name: string;
  status: 'running' | 'stopped' | 'restarting' | 'paused';
  uptime: string;
  restarts: number;
  cpu: string;
  memory: string;
  image: string;
}

export interface DiskUsage {
  filesystem: string;
  size: string;
  used: string;
  available: string;
  usePercent: number;
  mountPoint: string;
}

export interface SSLCertificateInfo {
  domain: string;
  issuer: string;
  expiryDate: Date;
  daysRemaining: number;
  status: 'valid' | 'expiring_soon' | 'expired';
}

export interface EnhancedDatabaseStats {
  mongodb: {
    collections: number;
    documents: number;
    dataSize: string;
    indexSize: string;
    opsPerSec: number;
  };
  postgres: {
    activeConnections: number;
    maxConnections: number;
    status: string;
  };
  redis: {
    usedMemory: string;
    connectedClients: number;
    totalKeys: number;
  };
}

export interface SystemHealth {
  overall: HealthStatus;
  lastChecked: string;
  services: {
    api: ServiceHealth;
    mongodb: ServiceHealth;
    redis: ServiceHealth;
    postgres: ServiceHealth;
    aiService: ServiceHealth;
    frontend: ServiceHealth;
    websocket: ServiceHealth;
  };
  system: {
    uptime: number;
    loadAverage: number[];
    memoryUsage: {
      total: number;
      used: number;
      free: number;
      percent: number;
    };
    cpuUsage: number;
  };
}

@Injectable()
export class HealthService {
  private readonly logger = new Logger(HealthService.name);
  private redis: Redis | null = null;

  constructor(
    @InjectConnection() private readonly mongoConnection: Connection,
    private configService: ConfigService,
    @Inject(forwardRef(() => AdminGateway)) private adminGateway: AdminGateway,
  ) {
    this.initRedis();
  }

  private async initRedis() {
    const redisUrl = this.configService.get<string>('REDIS_URL');
    if (redisUrl) {
      try {
        this.redis = new Redis(redisUrl);
        this.redis.on('error', (err) => {
          this.logger.warn(`Redis connection error: ${err.message}`);
        });
      } catch (error) {
        this.logger.warn('Failed to initialize Redis connection for health checks');
      }
    }
  }

  async getOverallHealth(): Promise<SystemHealth> {
    // Define fallback responses for when services timeout
    const unhealthyFallback = (serviceName: string): ServiceHealth => ({
      status: 'unhealthy',
      message: `${serviceName} health check timed out`,
      latency: -1,
    });

    // Wrap each health check with a hard timeout to prevent hanging
    // This is critical because stopped containers can cause DNS resolution hangs
    const INDIVIDUAL_TIMEOUT = 5000; // 5 seconds per service

    const [mongodb, redis, api, postgres, aiService, frontend] = await Promise.all([
      withTimeout(this.checkMongoDB(), INDIVIDUAL_TIMEOUT, unhealthyFallback('MongoDB'), 'MongoDB'),
      withTimeout(this.checkRedis(), INDIVIDUAL_TIMEOUT, unhealthyFallback('Redis'), 'Redis'),
      withTimeout(this.checkApi(), INDIVIDUAL_TIMEOUT, unhealthyFallback('API'), 'API'),
      withTimeout(this.checkPostgres(), INDIVIDUAL_TIMEOUT, unhealthyFallback('PostgreSQL'), 'PostgreSQL'),
      withTimeout(this.checkAiService(), INDIVIDUAL_TIMEOUT, unhealthyFallback('AI Service'), 'AI Service'),
      withTimeout(this.checkFrontend(), INDIVIDUAL_TIMEOUT, unhealthyFallback('Frontend'), 'Frontend'),
    ]);

    // WebSocket status is synchronous
    const websocket = this.getWebSocketStatus();

    const services = { api, mongodb, redis, postgres, aiService, frontend, websocket };
    const overall = this.calculateOverallStatus(services);

    return {
      overall,
      lastChecked: new Date().toISOString(),
      services,
      system: {
        uptime: os.uptime(),
        loadAverage: os.loadavg(),
        memoryUsage: this.getMemoryUsage(),
        cpuUsage: await this.getCpuUsage(),
      },
    };
  }

  private async checkApi(): Promise<ServiceHealth> {
    const start = Date.now();
    return {
      status: 'healthy',
      latency: Date.now() - start,
      message: 'API is responding',
      details: {
        nodeVersion: process.version,
        platform: process.platform,
        pid: process.pid,
      },
    };
  }

  private async checkMongoDB(): Promise<ServiceHealth> {
    const start = Date.now();
    try {
      const state = this.mongoConnection.readyState;
      const stateMap = {
        0: 'disconnected',
        1: 'connected',
        2: 'connecting',
        3: 'disconnecting',
      };

      if (state !== 1) {
        return {
          status: 'unhealthy',
          latency: Date.now() - start,
          message: `MongoDB is ${stateMap[state] || 'unknown'}`,
        };
      }

      // Ping the database to check latency
      const db = this.mongoConnection.db;
      if (!db) {
        return {
          status: 'unhealthy',
          latency: Date.now() - start,
          message: 'MongoDB database not available',
        };
      }
      await db.admin().ping();
      const latency = Date.now() - start;

      return {
        status: latency < 500 ? 'healthy' : 'degraded',
        latency,
        message: 'MongoDB is connected',
        details: {
          host: this.mongoConnection.host,
          name: this.mongoConnection.name,
        },
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        latency: Date.now() - start,
        message: `MongoDB error: ${error.message}`,
      };
    }
  }

  private async checkRedis(): Promise<ServiceHealth> {
    const start = Date.now();

    if (!this.redis) {
      return {
        status: 'unhealthy',
        message: 'Redis not configured',
      };
    }

    try {
      await this.redis.ping();
      const latency = Date.now() - start;

      return {
        status: latency < 100 ? 'healthy' : 'degraded',
        latency,
        message: 'Redis is connected',
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        latency: Date.now() - start,
        message: `Redis error: ${error.message}`,
      };
    }
  }

  private async checkPostgres(): Promise<ServiceHealth> {
    const start = Date.now();
    const postgresHost = this.configService.get<string>('POSTGRES_HOST') || 'postgres';
    const postgresPort = this.configService.get<string>('POSTGRES_PORT') || '5432';

    try {
      // Use a simple TCP connection check via curl (faster than docker exec)
      const { stdout } = await execAsync(
        `curl -sf --connect-timeout 2 "http://${postgresHost}:${postgresPort}" 2>&1 || echo "connection_check"`,
        { timeout: 3000 }
      );

      const latency = Date.now() - start;

      // If curl fails with "connection refused" or similar, postgres is not up
      // If it returns something (even an error page), the port is open
      const isOpen = stdout.includes('connection_check') ||
                     stdout.includes('empty reply') ||
                     stdout.includes('Received HTTP');

      // For a more accurate check, use pg_isready via network if available
      try {
        const pgCheck = await execAsync(
          `pg_isready -h ${postgresHost} -p ${postgresPort} 2>/dev/null`,
          { timeout: 2000 }
        );
        const pgLatency = Date.now() - start;
        return {
          status: pgLatency < 100 ? 'healthy' : 'degraded',
          latency: pgLatency,
          message: 'PostgreSQL is accepting connections',
          details: {
            host: postgresHost,
            port: postgresPort,
          },
        };
      } catch {
        // pg_isready not available in container, fall back to TCP check result
        return {
          status: isOpen || latency < 500 ? 'healthy' : 'degraded',
          latency,
          message: 'PostgreSQL is accepting connections',
          details: {
            host: postgresHost,
            port: postgresPort,
          },
        };
      }
    } catch (error) {
      return {
        status: 'unhealthy',
        latency: Date.now() - start,
        message: `PostgreSQL check failed: ${error.message}`,
      };
    }
  }

  private async checkAiService(): Promise<ServiceHealth> {
    const start = Date.now();
    const aiServiceUrl = this.configService.get<string>('AI_SERVICE_URL') || 'http://ai-service:8000';

    try {
      // Use --connect-timeout to limit DNS + connection time (critical for stopped containers)
      // Use --max-time to limit total transfer time
      const { stdout } = await execAsync(
        `curl -sf "${aiServiceUrl}/health" --connect-timeout 3 --max-time 4 2>/dev/null || echo "unreachable"`,
        { timeout: 5000 }
      );

      const latency = Date.now() - start;
      const isHealthy = !stdout.includes('unreachable');

      if (isHealthy) {
        return {
          status: latency < 1000 ? 'healthy' : 'degraded',
          latency,
          message: 'AI Service is healthy',
          details: {
            url: aiServiceUrl,
          },
        };
      } else {
        return {
          status: 'unhealthy',
          latency,
          message: 'AI Service is not responding',
        };
      }
    } catch (error) {
      return {
        status: 'unhealthy',
        latency: Date.now() - start,
        message: `AI Service check failed: ${error.message}`,
      };
    }
  }

  private async checkFrontend(): Promise<ServiceHealth> {
    const start = Date.now();
    // In Docker, frontend runs on internal network. Check both internal and external URLs.
    const internalUrl = this.configService.get<string>('FRONTEND_INTERNAL_URL') || 'http://frontend:80';
    const externalUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:80';

    try {
      // Use --connect-timeout to limit DNS + connection time (critical for stopped containers)
      // Try internal Docker network first, then external URL
      const { stdout } = await execAsync(
        `curl -sf "${internalUrl}/health" --connect-timeout 2 --max-time 3 2>/dev/null || curl -sf "${internalUrl}" --connect-timeout 2 --max-time 3 2>/dev/null || echo "unreachable"`,
        { timeout: 5000 }
      );

      const latency = Date.now() - start;
      const isHealthy = !stdout.includes('unreachable');

      if (isHealthy) {
        return {
          status: latency < 1000 ? 'healthy' : 'degraded',
          latency,
          message: 'Frontend is responding',
          details: {
            url: internalUrl,
          },
        };
      } else {
        return {
          status: 'unhealthy',
          latency,
          message: 'Frontend is not responding',
        };
      }
    } catch (error) {
      return {
        status: 'unhealthy',
        latency: Date.now() - start,
        message: `Frontend check failed: ${error.message}`,
      };
    }
  }

  private getWebSocketStatus(): ServiceHealth {
    try {
      const connectionCount = this.adminGateway?.getConnectedAdminCount() || 0;
      const connectedAdmins = this.adminGateway?.getConnectedAdmins() || [];

      return {
        status: 'healthy',
        message: 'WebSocket gateway active',
        details: {
          activeConnections: connectionCount,
          connectedAdmins: connectedAdmins,
        },
      };
    } catch (error) {
      return {
        status: 'degraded',
        message: `WebSocket status check failed: ${error.message}`,
      };
    }
  }

  private calculateOverallStatus(services: Record<string, ServiceHealth>): HealthStatus {
    const statuses = Object.values(services).map(s => s.status);

    if (statuses.every(s => s === 'healthy')) return 'healthy';
    if (statuses.some(s => s === 'unhealthy')) return 'unhealthy';
    return 'degraded';
  }

  private getMemoryUsage() {
    const total = os.totalmem();
    const free = os.freemem();
    const used = total - free;

    return {
      total,
      used,
      free,
      percent: Math.round((used / total) * 100),
    };
  }

  private async getCpuUsage(): Promise<number> {
    const cpus = os.cpus();
    const avgIdle = cpus.reduce((acc, cpu) => {
      const total = Object.values(cpu.times).reduce((a, b) => a + b, 0);
      return acc + (cpu.times.idle / total);
    }, 0) / cpus.length;

    return Math.round((1 - avgIdle) * 100);
  }

  async getContainerStatus(): Promise<ContainerInfo[]> {
    try {
      // Use docker ps -a to show ALL containers (running, stopped, exited, etc.)
      // This allows admins to see and manage all containers from the portal
      const { stdout } = await execAsync(
        'docker ps -a --format "{{.Names}}|{{.Status}}|{{.Image}}" 2>/dev/null || echo "docker_not_available"',
        { timeout: 10000 }
      );

      if (stdout.trim() === 'docker_not_available') {
        return [];
      }

      const containers: ContainerInfo[] = [];
      const lines = stdout.trim().split('\n').filter(l => l);

      for (const line of lines) {
        const [name, status, image] = line.split('|');
        if (!name) continue;

        // Parse status to determine container state
        // Status formats: "Up 2 hours", "Exited (0) 3 hours ago", "Restarting (1) 5 seconds ago", "Paused", "Created"
        const statusLower = status?.toLowerCase() || '';
        let containerStatus: ContainerInfo['status'] = 'stopped';
        if (statusLower.includes('up')) containerStatus = 'running';
        else if (statusLower.includes('restarting')) containerStatus = 'restarting';
        else if (statusLower.includes('paused')) containerStatus = 'paused';
        else if (statusLower.includes('exited') || statusLower.includes('created')) containerStatus = 'stopped';

        // Only get stats for running containers (docker stats doesn't work on stopped containers)
        let stats: { cpu: string; memory: string } | null = null;
        if (containerStatus === 'running') {
          stats = await this.getContainerStats(name);
        }

        // Get restart count (works on all containers)
        const restarts = await this.getContainerRestarts(name);

        // Parse uptime/downtime from status string
        let uptime = 'N/A';
        if (containerStatus === 'running') {
          // Extract uptime from "Up X hours" or "Up X minutes"
          uptime = status?.replace(/.*Up\s+/, '').split(' (')[0] || 'N/A';
        } else if (statusLower.includes('exited')) {
          // Show how long ago it exited: "Exited (0) 3 hours ago" -> "Stopped 3 hours ago"
          const exitMatch = status?.match(/Exited\s*\(\d+\)\s*(.+)/i);
          uptime = exitMatch ? `Stopped ${exitMatch[1]}` : 'Stopped';
        } else if (statusLower.includes('created')) {
          uptime = 'Never started';
        }

        containers.push({
          name,
          status: containerStatus,
          uptime,
          restarts,
          cpu: stats?.cpu || '-',
          memory: stats?.memory || '-',
          image: image || 'unknown',
        });
      }

      return containers;
    } catch (error) {
      this.logger.warn(`Failed to get container status: ${error.message}`);
      return [];
    }
  }

  private async getContainerStats(containerName: string): Promise<{ cpu: string; memory: string } | null> {
    try {
      // Add timeout to prevent hanging on stopped containers
      // docker stats on stopped containers can hang indefinitely
      const { stdout } = await execAsync(
        `docker stats ${containerName} --no-stream --format "{{.CPUPerc}}|{{.MemUsage}}" 2>/dev/null`,
        { timeout: 5000 }
      );
      const [cpu, memory] = stdout.trim().split('|');
      return { cpu: cpu || '0%', memory: memory?.split('/')[0]?.trim() || '0MB' };
    } catch {
      return null;
    }
  }

  async getDiskUsage(): Promise<DiskUsage[]> {
    try {
      // Works on both Linux and macOS
      const { stdout } = await execAsync('df -h 2>/dev/null || echo "df_not_available"');

      if (stdout.trim() === 'df_not_available') {
        // Try Windows alternative
        return this.getWindowsDiskUsage();
      }

      const lines = stdout.trim().split('\n').slice(1); // Skip header
      const disks: DiskUsage[] = [];

      for (const line of lines) {
        const parts = line.split(/\s+/);
        if (parts.length >= 6) {
          const usePercent = parseInt(parts[4].replace('%', ''), 10);

          // Filter out small/virtual filesystems
          if (parts[0].startsWith('/dev') || parts[0].includes(':')) {
            disks.push({
              filesystem: parts[0],
              size: parts[1],
              used: parts[2],
              available: parts[3],
              usePercent: isNaN(usePercent) ? 0 : usePercent,
              mountPoint: parts[5],
            });
          }
        }
      }

      return disks;
    } catch (error) {
      this.logger.warn(`Failed to get disk usage: ${error.message}`);
      return [];
    }
  }

  private async getWindowsDiskUsage(): Promise<DiskUsage[]> {
    try {
      const { stdout } = await execAsync('wmic logicaldisk get size,freespace,caption');
      const lines = stdout.trim().split('\n').slice(1).filter(l => l.trim());
      const disks: DiskUsage[] = [];

      for (const line of lines) {
        const parts = line.trim().split(/\s+/);
        if (parts.length >= 3) {
          const caption = parts[0];
          const freeSpace = parseInt(parts[1], 10);
          const size = parseInt(parts[2], 10);

          if (!isNaN(size) && size > 0) {
            const used = size - freeSpace;
            const usePercent = Math.round((used / size) * 100);

            disks.push({
              filesystem: caption,
              size: this.formatBytes(size),
              used: this.formatBytes(used),
              available: this.formatBytes(freeSpace),
              usePercent,
              mountPoint: caption,
            });
          }
        }
      }

      return disks;
    } catch {
      return [];
    }
  }

  private formatBytes(bytes: number): string {
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    let i = 0;
    let value = bytes;
    while (value >= 1024 && i < units.length - 1) {
      value /= 1024;
      i++;
    }
    return `${value.toFixed(1)}${units[i]}`;
  }

  async getDatabaseStats(): Promise<{
    mongodb: {
      collections: number;
      documents: number;
      dataSize: string;
      indexSize: string;
    };
  }> {
    try {
      const db = this.mongoConnection.db;
      if (!db) {
        return {
          mongodb: {
            collections: 0,
            documents: 0,
            dataSize: 'N/A',
            indexSize: 'N/A',
          },
        };
      }
      const stats = await db.stats();

      return {
        mongodb: {
          collections: stats.collections,
          documents: stats.objects,
          dataSize: this.formatBytes(stats.dataSize),
          indexSize: this.formatBytes(stats.indexSize),
        },
      };
    } catch (error) {
      this.logger.error(`Failed to get database stats: ${error.message}`);
      return {
        mongodb: {
          collections: 0,
          documents: 0,
          dataSize: 'N/A',
          indexSize: 'N/A',
        },
      };
    }
  }

  async getEnhancedDatabaseStats(): Promise<EnhancedDatabaseStats> {
    const result: EnhancedDatabaseStats = {
      mongodb: {
        collections: 0,
        documents: 0,
        dataSize: 'N/A',
        indexSize: 'N/A',
        opsPerSec: 0,
      },
      postgres: {
        activeConnections: 0,
        maxConnections: 100,
        status: 'unknown',
      },
      redis: {
        usedMemory: 'N/A',
        connectedClients: 0,
        totalKeys: 0,
      },
    };

    // MongoDB stats with ops/sec
    try {
      const db = this.mongoConnection.db;
      if (db) {
        const stats = await db.stats();
        result.mongodb.collections = stats.collections;
        result.mongodb.documents = stats.objects;
        result.mongodb.dataSize = this.formatBytes(stats.dataSize);
        result.mongodb.indexSize = this.formatBytes(stats.indexSize);

        // Get ops/sec from serverStatus
        try {
          const serverStatus = await db.admin().serverStatus();
          const opcounters = serverStatus?.opcounters || {};
          result.mongodb.opsPerSec = (
            (opcounters.insert || 0) +
            (opcounters.query || 0) +
            (opcounters.update || 0) +
            (opcounters.delete || 0)
          );
        } catch (e) {
          this.logger.warn('Could not get MongoDB server status');
        }
      }
    } catch (error) {
      this.logger.warn(`Failed to get MongoDB stats: ${error.message}`);
    }

    // PostgreSQL stats
    try {
      const postgresHost = this.configService.get<string>('POSTGRES_HOST') || 'postgres';
      const postgresPort = this.configService.get<string>('POSTGRES_PORT') || '5432';

      // Check if postgres is reachable
      try {
        await execAsync(`pg_isready -h ${postgresHost} -p ${postgresPort} 2>/dev/null`, { timeout: 2000 });
        result.postgres.status = 'connected';
        result.postgres.activeConnections = 1; // Basic connectivity confirmed
      } catch {
        result.postgres.status = 'unknown';
      }
    } catch (error) {
      this.logger.warn(`Failed to get PostgreSQL stats: ${error.message}`);
    }

    // Redis stats
    if (this.redis) {
      try {
        const info = await this.redis.info('memory');
        const clientsInfo = await this.redis.info('clients');
        const keyspaceInfo = await this.redis.info('keyspace');

        // Parse used memory
        const memoryMatch = info.match(/used_memory_human:([^\r\n]+)/);
        if (memoryMatch) {
          result.redis.usedMemory = memoryMatch[1].trim();
        }

        // Parse connected clients
        const clientsMatch = clientsInfo.match(/connected_clients:(\d+)/);
        if (clientsMatch) {
          result.redis.connectedClients = parseInt(clientsMatch[1], 10);
        }

        // Parse total keys
        const db0Match = keyspaceInfo.match(/db0:keys=(\d+)/);
        if (db0Match) {
          result.redis.totalKeys = parseInt(db0Match[1], 10);
        }
      } catch (error) {
        this.logger.warn(`Failed to get Redis stats: ${error.message}`);
      }
    }

    return result;
  }

  private async getContainerRestarts(containerName: string): Promise<number> {
    try {
      const { stdout } = await execAsync(
        `docker inspect ${containerName} --format "{{.RestartCount}}" 2>/dev/null`,
        { timeout: 5000 }
      );
      return parseInt(stdout.trim(), 10) || 0;
    } catch {
      return 0;
    }
  }

  async getSSLCertificates(): Promise<SSLCertificateInfo[]> {
    const domainsEnv = this.configService.get<string>('SSL_DOMAINS');

    // If no SSL_DOMAINS configured, return empty array (local development)
    if (!domainsEnv || domainsEnv.trim() === '') {
      this.logger.debug('No SSL_DOMAINS configured, skipping SSL certificate check');
      return [];
    }

    const domains = domainsEnv.split(',').map(d => d.trim()).filter(d => d);
    const certificates: SSLCertificateInfo[] = [];

    for (const domain of domains) {
      try {
        const { stdout } = await execAsync(
          `echo | openssl s_client -servername ${domain} -connect ${domain}:443 2>/dev/null | openssl x509 -noout -dates -issuer 2>/dev/null`,
          { timeout: 10000 }
        );

        const expiryMatch = stdout.match(/notAfter=(.+)/);
        const issuerMatch = stdout.match(/issuer=(.+)/);

        if (expiryMatch) {
          const expiryDate = new Date(expiryMatch[1]);
          const now = new Date();
          const daysRemaining = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

          let status: SSLCertificateInfo['status'] = 'valid';
          if (daysRemaining < 0) {
            status = 'expired';
          } else if (daysRemaining < 30) {
            status = 'expiring_soon';
          }

          certificates.push({
            domain,
            issuer: issuerMatch?.[1]?.trim() || 'Unknown',
            expiryDate,
            daysRemaining,
            status,
          });
        }
      } catch (error) {
        this.logger.warn(`Failed to check SSL certificate for ${domain}: ${error.message}`);
      }
    }

    return certificates;
  }

  async triggerCertRenewal(domains?: string[]): Promise<{
    success: boolean;
    message: string;
    output?: string;
  }> {
    try {
      const scriptsPath = this.configService.get<string>('SCRIPTS_PATH') || '/opt/breyus/scripts';
      const { stdout, stderr } = await execAsync(
        `${scriptsPath}/renew-certs.sh ${domains?.join(' ') || ''} 2>&1`,
        { timeout: 120000 }
      );

      return {
        success: true,
        message: 'Certificate renewal initiated',
        output: stdout || stderr,
      };
    } catch (error) {
      return {
        success: false,
        message: `Certificate renewal failed: ${error.message}`,
      };
    }
  }

  async getContainerLogs(containerName: string, lines: number = 100): Promise<{
    success: boolean;
    logs: string;
    containerName: string;
    timestamp: string;
  }> {
    try {
      // Sanitize container name to prevent command injection
      const sanitizedName = containerName.replace(/[^a-zA-Z0-9_-]/g, '');

      const { stdout } = await execAsync(
        `docker logs --tail ${lines} --timestamps ${sanitizedName} 2>&1`,
        { timeout: 30000, maxBuffer: 10 * 1024 * 1024 } // 10MB buffer for logs
      );

      return {
        success: true,
        logs: stdout || 'No logs available',
        containerName: sanitizedName,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.warn(`Failed to get logs for container ${containerName}: ${error.message}`);
      return {
        success: false,
        logs: `Failed to retrieve logs: ${error.message}`,
        containerName,
        timestamp: new Date().toISOString(),
      };
    }
  }

  async restartContainer(containerName: string): Promise<{
    success: boolean;
    message: string;
  }> {
    try {
      const sanitizedName = containerName.replace(/[^a-zA-Z0-9_-]/g, '');
      await execAsync(`docker restart ${sanitizedName}`, { timeout: 60000 });
      this.logger.log(`Container ${sanitizedName} restarted successfully`);
      return {
        success: true,
        message: `Container ${sanitizedName} restarted successfully`,
      };
    } catch (error) {
      this.logger.error(`Failed to restart container ${containerName}: ${error.message}`);
      return {
        success: false,
        message: `Failed to restart container: ${error.message}`,
      };
    }
  }

  async stopContainer(containerName: string): Promise<{
    success: boolean;
    message: string;
  }> {
    try {
      const sanitizedName = containerName.replace(/[^a-zA-Z0-9_-]/g, '');
      await execAsync(`docker stop ${sanitizedName}`, { timeout: 30000 });
      this.logger.log(`Container ${sanitizedName} stopped successfully`);
      return {
        success: true,
        message: `Container ${sanitizedName} stopped successfully`,
      };
    } catch (error) {
      this.logger.error(`Failed to stop container ${containerName}: ${error.message}`);
      return {
        success: false,
        message: `Failed to stop container: ${error.message}`,
      };
    }
  }

  async startContainer(containerName: string): Promise<{
    success: boolean;
    message: string;
  }> {
    try {
      const sanitizedName = containerName.replace(/[^a-zA-Z0-9_-]/g, '');
      await execAsync(`docker start ${sanitizedName}`, { timeout: 30000 });
      this.logger.log(`Container ${sanitizedName} started successfully`);
      return {
        success: true,
        message: `Container ${sanitizedName} started successfully`,
      };
    } catch (error) {
      this.logger.error(`Failed to start container ${containerName}: ${error.message}`);
      return {
        success: false,
        message: `Failed to start container: ${error.message}`,
      };
    }
  }

  async getContainerDetails(containerName: string): Promise<{
    success: boolean;
    details: {
      id: string;
      name: string;
      image: string;
      status: string;
      created: string;
      ports: Array<{ hostPort: string; containerPort: string; protocol: string }>;
      volumes: Array<{ source: string; destination: string; mode: string }>;
      environment: string[];
      networks: string[];
      healthCheck: {
        status: string;
        failingStreak: number;
        lastCheck: string;
      } | null;
      resources: {
        cpuLimit: string;
        memoryLimit: string;
      };
    } | null;
    message?: string;
  }> {
    try {
      const sanitizedName = containerName.replace(/[^a-zA-Z0-9_-]/g, '');
      const { stdout } = await execAsync(
        `docker inspect ${sanitizedName} --format '{{json .}}'`,
        { timeout: 10000 }
      );

      const data = JSON.parse(stdout);

      // Parse ports
      const ports: Array<{ hostPort: string; containerPort: string; protocol: string }> = [];
      const portBindings = data.HostConfig?.PortBindings || {};
      for (const [containerPort, bindings] of Object.entries(portBindings)) {
        if (Array.isArray(bindings)) {
          for (const binding of bindings as any[]) {
            const [port, protocol] = containerPort.split('/');
            ports.push({
              hostPort: binding.HostPort || 'N/A',
              containerPort: port,
              protocol: protocol || 'tcp',
            });
          }
        }
      }

      // Parse volumes/mounts
      const volumes: Array<{ source: string; destination: string; mode: string }> = [];
      const mounts = data.Mounts || [];
      for (const mount of mounts) {
        volumes.push({
          source: mount.Source || mount.Name || 'N/A',
          destination: mount.Destination || 'N/A',
          mode: mount.Mode || (mount.RW ? 'rw' : 'ro'),
        });
      }

      // Parse environment variables (filter sensitive ones)
      const sensitiveKeys = ['PASSWORD', 'SECRET', 'KEY', 'TOKEN', 'CREDENTIAL'];
      const environment = (data.Config?.Env || []).map((env: string) => {
        const [key] = env.split('=');
        const isSensitive = sensitiveKeys.some(s => key.toUpperCase().includes(s));
        return isSensitive ? `${key}=********` : env;
      });

      // Parse networks
      const networks = Object.keys(data.NetworkSettings?.Networks || {});

      // Parse health check
      let healthCheck: {
        status: string;
        failingStreak: number;
        lastCheck: string;
      } | null = null;
      if (data.State?.Health) {
        healthCheck = {
          status: data.State.Health.Status || 'unknown',
          failingStreak: data.State.Health.FailingStreak || 0,
          lastCheck: data.State.Health.Log?.[0]?.End || 'N/A',
        };
      }

      // Parse resource limits
      const resources = {
        cpuLimit: data.HostConfig?.NanoCpus
          ? `${(data.HostConfig.NanoCpus / 1e9).toFixed(2)} CPUs`
          : 'No limit',
        memoryLimit: data.HostConfig?.Memory
          ? this.formatBytes(data.HostConfig.Memory)
          : 'No limit',
      };

      return {
        success: true,
        details: {
          id: data.Id?.substring(0, 12) || 'N/A',
          name: data.Name?.replace(/^\//, '') || sanitizedName,
          image: data.Config?.Image || 'N/A',
          status: data.State?.Status || 'unknown',
          created: data.Created || 'N/A',
          ports,
          volumes,
          environment,
          networks,
          healthCheck,
          resources,
        },
      };
    } catch (error) {
      this.logger.error(`Failed to inspect container ${containerName}: ${error.message}`);
      return {
        success: false,
        details: null,
        message: `Failed to get container details: ${error.message}`,
      };
    }
  }

  // ==================== BACKUP MANAGEMENT ====================

  private getBackupDir(): string {
    // In Docker: /data/backups, locally: ./backups
    const configuredPath = this.configService.get<string>('BACKUP_DIR');
    if (configuredPath) return configuredPath;

    // Check if running in Docker with mounted volume
    const fs = require('fs');
    if (fs.existsSync('/data/backups')) {
      return '/data/backups';
    }

    // Fall back to project backups folder
    return process.cwd().replace(/\/backend$/, '') + '/backups';
  }

  async listBackups(): Promise<{
    mongodb: Array<{
      filename: string;
      size: string;
      created: Date;
      path: string;
    }>;
    postgresql: {
      filename: string;
      size: string;
      created: Date;
      path: string;
    } | null;
    lastBackup: Date | null;
  }> {
    const fs = require('fs');
    const path = require('path');
    const backupDir = this.getBackupDir();

    const result = {
      mongodb: [] as Array<{
        filename: string;
        size: string;
        created: Date;
        path: string;
      }>,
      postgresql: null as {
        filename: string;
        size: string;
        created: Date;
        path: string;
      } | null,
      lastBackup: null as Date | null,
    };

    try {
      // List MongoDB backups (versioned)
      const mongoDir = path.join(backupDir, 'mongodb');
      if (fs.existsSync(mongoDir)) {
        const mongoFiles = fs.readdirSync(mongoDir)
          .filter((f: string) => f.startsWith('breyus_mongo_') && f.includes('.archive'))
          .map((filename: string) => {
            const filePath = path.join(mongoDir, filename);
            const stats = fs.statSync(filePath);
            return {
              filename,
              size: this.formatBytes(stats.size),
              created: stats.mtime,
              path: filePath,
            };
          })
          .sort((a: any, b: any) => b.created.getTime() - a.created.getTime()); // Newest first

        result.mongodb = mongoFiles;

        if (mongoFiles.length > 0) {
          result.lastBackup = mongoFiles[0].created;
        }
      }

      // Get PostgreSQL backup (single copy)
      const pgDir = path.join(backupDir, 'postgresql');
      if (fs.existsSync(pgDir)) {
        const pgFile = 'breyus_postgres_latest.sql.gz';
        const pgPath = path.join(pgDir, pgFile);

        if (fs.existsSync(pgPath)) {
          const stats = fs.statSync(pgPath);
          result.postgresql = {
            filename: pgFile,
            size: this.formatBytes(stats.size),
            created: stats.mtime,
            path: pgPath,
          };

          // Update lastBackup if PostgreSQL is more recent
          if (!result.lastBackup || stats.mtime > result.lastBackup) {
            result.lastBackup = stats.mtime;
          }
        }
      }

      return result;
    } catch (error) {
      this.logger.error(`Failed to list backups: ${error.message}`);
      return result;
    }
  }

  async deleteBackup(
    type: 'mongodb' | 'postgresql',
    filename: string,
  ): Promise<{ success: boolean; message: string }> {
    const fs = require('fs');
    const path = require('path');
    const backupDir = this.getBackupDir();

    try {
      // Sanitize filename to prevent path traversal
      const sanitizedFilename = path.basename(filename);

      // Validate the filename matches expected patterns
      if (type === 'mongodb' && !sanitizedFilename.startsWith('breyus_mongo_')) {
        return { success: false, message: 'Invalid MongoDB backup filename' };
      }
      if (type === 'postgresql' && sanitizedFilename !== 'breyus_postgres_latest.sql.gz') {
        return { success: false, message: 'Invalid PostgreSQL backup filename' };
      }

      const subDir = type === 'mongodb' ? 'mongodb' : 'postgresql';
      const filePath = path.join(backupDir, subDir, sanitizedFilename);

      if (!fs.existsSync(filePath)) {
        return { success: false, message: 'Backup file not found' };
      }

      fs.unlinkSync(filePath);
      this.logger.log(`Deleted backup: ${filePath}`);

      return { success: true, message: `Deleted backup: ${sanitizedFilename}` };
    } catch (error) {
      this.logger.error(`Failed to delete backup: ${error.message}`);
      return { success: false, message: `Failed to delete backup: ${error.message}` };
    }
  }

  async getBackupStorageInfo(): Promise<{
    path: string;
    totalSize: string;
    mongoBackupCount: number;
    hasPostgresBackup: boolean;
    isRemoteStorage: boolean;
  }> {
    const fs = require('fs');
    const path = require('path');
    const backupDir = this.getBackupDir();

    let totalBytes = 0;
    let mongoCount = 0;
    let hasPostgres = false;

    try {
      // Calculate total size
      const calculateDirSize = (dir: string): number => {
        if (!fs.existsSync(dir)) return 0;

        let size = 0;
        const files = fs.readdirSync(dir);
        for (const file of files) {
          const filePath = path.join(dir, file);
          const stats = fs.statSync(filePath);
          if (stats.isFile()) {
            size += stats.size;
          }
        }
        return size;
      };

      const mongoDir = path.join(backupDir, 'mongodb');
      const pgDir = path.join(backupDir, 'postgresql');

      totalBytes = calculateDirSize(mongoDir) + calculateDirSize(pgDir);

      if (fs.existsSync(mongoDir)) {
        mongoCount = fs.readdirSync(mongoDir)
          .filter((f: string) => f.startsWith('breyus_mongo_')).length;
      }

      if (fs.existsSync(path.join(pgDir, 'breyus_postgres_latest.sql.gz'))) {
        hasPostgres = true;
      }

      // Check if path looks like remote storage (Hetzner, NFS, etc.)
      const isRemote = backupDir.startsWith('/mnt/') ||
                       backupDir.includes('hetzner') ||
                       backupDir.includes('storage-box');

      return {
        path: backupDir,
        totalSize: this.formatBytes(totalBytes),
        mongoBackupCount: mongoCount,
        hasPostgresBackup: hasPostgres,
        isRemoteStorage: isRemote,
      };
    } catch (error) {
      this.logger.error(`Failed to get backup storage info: ${error.message}`);
      return {
        path: backupDir,
        totalSize: 'N/A',
        mongoBackupCount: 0,
        hasPostgresBackup: false,
        isRemoteStorage: false,
      };
    }
  }
}
