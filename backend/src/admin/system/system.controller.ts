import {
  Controller,
  Get,
  Put,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { SystemService } from './system.service';
import {
  HealthService,
  SystemHealth,
  ContainerInfo,
  DiskUsage,
  SSLCertificateInfo,
  EnhancedDatabaseStats,
} from './health.service';
import {
  ScriptRunnerService,
  ScriptResult,
  BackupTarget,
} from './script-runner.service';
import { UpdateMaintenanceDto } from './dto/maintenance.dto';
import { AdminAuthGuard } from '../auth/admin-auth.guard';
import { AdminAction } from '../common/decorators/admin-action.decorator';
import { Types } from 'mongoose';

interface AdminRequest {
  admin: {
    _id: string;
    email: string;
  };
}

@Controller('admin/system')
@UseGuards(AdminAuthGuard)
export class SystemController {
  constructor(
    private systemService: SystemService,
    private healthService: HealthService,
    private scriptRunnerService: ScriptRunnerService,
  ) {}

  // ==================== HEALTH ENDPOINTS ====================

  @Get('health')
  @AdminAction({ action: 'VIEW_SYSTEM_HEALTH', category: 'SYSTEM' })
  async getSystemHealth(): Promise<{
    statusCode: number;
    message: string;
    data: SystemHealth;
  }> {
    const health = await this.healthService.getOverallHealth();
    return {
      statusCode: 200,
      message: 'System health retrieved successfully',
      data: health,
    };
  }

  @Get('health/containers')
  @AdminAction({ action: 'VIEW_CONTAINER_STATUS', category: 'SYSTEM' })
  async getContainerStatus(): Promise<{
    statusCode: number;
    message: string;
    data: ContainerInfo[];
  }> {
    const containers = await this.healthService.getContainerStatus();
    return {
      statusCode: 200,
      message: 'Container status retrieved successfully',
      data: containers,
    };
  }

  @Get('health/containers/:name/logs')
  @AdminAction({ action: 'VIEW_CONTAINER_LOGS', category: 'SYSTEM' })
  async getContainerLogs(
    @Param('name') containerName: string,
    @Query('lines') lines?: string,
  ): Promise<{
    statusCode: number;
    message: string;
    data: {
      success: boolean;
      logs: string;
      containerName: string;
      timestamp: string;
    };
  }> {
    const lineCount = lines ? parseInt(lines, 10) : 100;
    const result = await this.healthService.getContainerLogs(
      containerName,
      lineCount,
    );
    return {
      statusCode: result.success ? 200 : 500,
      message: result.success
        ? 'Container logs retrieved successfully'
        : 'Failed to retrieve logs',
      data: result,
    };
  }

  @Get('health/containers/:name/details')
  @AdminAction({ action: 'VIEW_CONTAINER_DETAILS', category: 'SYSTEM' })
  async getContainerDetails(@Param('name') containerName: string): Promise<{
    statusCode: number;
    message: string;
    data: any;
  }> {
    const result = await this.healthService.getContainerDetails(containerName);
    return {
      statusCode: result.success ? 200 : 500,
      message: result.success
        ? 'Container details retrieved successfully'
        : result.message || 'Failed to retrieve details',
      data: result.details,
    };
  }

  @Post('health/containers/:name/restart')
  @AdminAction({ action: 'RESTART_CONTAINER', category: 'SYSTEM' })
  async restartContainer(
    @Param('name') containerName: string,
    @Req() req: AdminRequest,
  ): Promise<{
    statusCode: number;
    message: string;
    data: { success: boolean; message: string };
  }> {
    const result = await this.healthService.restartContainer(containerName);
    return {
      statusCode: result.success ? 200 : 500,
      message: result.message,
      data: result,
    };
  }

  @Post('health/containers/:name/stop')
  @AdminAction({ action: 'STOP_CONTAINER', category: 'SYSTEM' })
  async stopContainer(
    @Param('name') containerName: string,
    @Req() req: AdminRequest,
  ): Promise<{
    statusCode: number;
    message: string;
    data: { success: boolean; message: string };
  }> {
    const result = await this.healthService.stopContainer(containerName);
    return {
      statusCode: result.success ? 200 : 500,
      message: result.message,
      data: result,
    };
  }

  @Post('health/containers/:name/start')
  @AdminAction({ action: 'START_CONTAINER', category: 'SYSTEM' })
  async startContainer(
    @Param('name') containerName: string,
    @Req() req: AdminRequest,
  ): Promise<{
    statusCode: number;
    message: string;
    data: { success: boolean; message: string };
  }> {
    const result = await this.healthService.startContainer(containerName);
    return {
      statusCode: result.success ? 200 : 500,
      message: result.message,
      data: result,
    };
  }

  @Get('health/disk')
  @AdminAction({ action: 'VIEW_DISK_USAGE', category: 'SYSTEM' })
  async getDiskUsage(): Promise<{
    statusCode: number;
    message: string;
    data: DiskUsage[];
  }> {
    const diskUsage = await this.healthService.getDiskUsage();
    return {
      statusCode: 200,
      message: 'Disk usage retrieved successfully',
      data: diskUsage,
    };
  }

  @Get('health/databases')
  @AdminAction({ action: 'VIEW_DATABASE_STATS', category: 'SYSTEM' })
  async getDatabaseStats(): Promise<{
    statusCode: number;
    message: string;
    data: any;
  }> {
    const stats = await this.healthService.getDatabaseStats();
    return {
      statusCode: 200,
      message: 'Database stats retrieved successfully',
      data: stats,
    };
  }

  // ==================== MAINTENANCE ENDPOINTS ====================

  @Get('maintenance')
  @AdminAction({ action: 'VIEW_MAINTENANCE', category: 'SYSTEM' })
  async getMaintenanceConfig(): Promise<{
    statusCode: number;
    message: string;
    data: any;
  }> {
    const config = await this.systemService.getMaintenanceConfig();
    return {
      statusCode: 200,
      message: 'Maintenance config retrieved successfully',
      data: config,
    };
  }

  @Put('maintenance')
  @AdminAction({ action: 'UPDATE_MAINTENANCE', category: 'SYSTEM' })
  async updateMaintenanceConfig(
    @Body() dto: UpdateMaintenanceDto,
    @Req() req: AdminRequest,
  ): Promise<{
    statusCode: number;
    message: string;
    data: any;
  }> {
    const config = await this.systemService.updateMaintenanceConfig(
      dto,
      req.admin._id as any,
      req.admin.email,
    );
    return {
      statusCode: 200,
      message: dto.isEnabled
        ? 'Maintenance mode enabled'
        : 'Maintenance mode disabled',
      data: config,
    };
  }

  @Get('maintenance/status')
  async getMaintenanceStatus(): Promise<{
    statusCode: number;
    message: string;
    data: {
      isActive: boolean;
      message: string;
      estimatedEndTime?: Date;
    };
  }> {
    const status = await this.systemService.isMaintenanceActive();
    return {
      statusCode: 200,
      message: 'Maintenance status retrieved',
      data: status,
    };
  }

  // ==================== ENHANCED DATABASE STATS ====================

  @Get('health/databases/stats')
  @AdminAction({ action: 'VIEW_DATABASE_STATS', category: 'SYSTEM' })
  async getEnhancedDatabaseStats(): Promise<{
    statusCode: number;
    message: string;
    data: EnhancedDatabaseStats;
  }> {
    const stats = await this.healthService.getEnhancedDatabaseStats();
    return {
      statusCode: 200,
      message: 'Enhanced database stats retrieved successfully',
      data: stats,
    };
  }

  // ==================== SSL CERTIFICATES ====================

  @Get('health/ssl')
  @AdminAction({ action: 'VIEW_SSL_CERTIFICATES', category: 'SYSTEM' })
  async getSSLCertificates(): Promise<{
    statusCode: number;
    message: string;
    data: SSLCertificateInfo[];
  }> {
    const certificates = await this.healthService.getSSLCertificates();
    return {
      statusCode: 200,
      message: 'SSL certificates retrieved successfully',
      data: certificates,
    };
  }

  @Post('ssl/renew')
  @AdminAction({ action: 'RENEW_SSL_CERTIFICATES', category: 'SYSTEM' })
  async renewSSLCertificates(
    @Body() dto: { domains?: string[] },
    @Req() req: AdminRequest,
  ): Promise<{
    statusCode: number;
    message: string;
    data: { success: boolean; message: string; output?: string };
  }> {
    const result = await this.healthService.triggerCertRenewal(dto.domains);
    return {
      statusCode: result.success ? 200 : 500,
      message: result.message,
      data: result,
    };
  }

  // ==================== QUICK ACTIONS ====================

  @Post('actions/backup')
  @AdminAction({ action: 'CREATE_BACKUP', category: 'SYSTEM' })
  async createBackup(
    @Req() req: AdminRequest,
    @Body() body?: { target?: BackupTarget },
  ): Promise<{
    statusCode: number;
    message: string;
    data: ScriptResult;
  }> {
    const target = body?.target || 'all';
    const result = await this.scriptRunnerService.createBackup(
      new Types.ObjectId(req.admin._id),
      req.admin.email,
      target,
    );
    return {
      statusCode: result.success ? 200 : 500,
      message: result.success ? 'Backup created successfully' : 'Backup failed',
      data: result,
    };
  }

  @Post('actions/rotate-logs')
  @AdminAction({ action: 'ROTATE_LOGS', category: 'SYSTEM' })
  async rotateLogs(@Req() req: AdminRequest): Promise<{
    statusCode: number;
    message: string;
    data: ScriptResult;
  }> {
    const result = await this.scriptRunnerService.rotateLogs(
      new Types.ObjectId(req.admin._id),
      req.admin.email,
    );
    return {
      statusCode: result.success ? 200 : 500,
      message: result.success
        ? 'Logs rotated successfully'
        : 'Log rotation failed',
      data: result,
    };
  }

  @Post('actions/health-check')
  @AdminAction({ action: 'MANUAL_HEALTH_CHECK', category: 'SYSTEM' })
  async runHealthCheck(@Req() req: AdminRequest): Promise<{
    statusCode: number;
    message: string;
    data: { health: SystemHealth; scriptResult: ScriptResult };
  }> {
    const [health, scriptResult] = await Promise.all([
      this.healthService.getOverallHealth(),
      this.scriptRunnerService.triggerHealthCheck(
        new Types.ObjectId(req.admin._id),
        req.admin.email,
      ),
    ]);
    return {
      statusCode: 200,
      message: 'Health check completed',
      data: { health, scriptResult },
    };
  }

  // ==================== BACKUP MANAGEMENT ====================

  @Get('backups')
  @AdminAction({ action: 'VIEW_BACKUPS', category: 'SYSTEM' })
  async listBackups(): Promise<{
    statusCode: number;
    message: string;
    data: {
      mongodb: Array<{
        filename: string;
        size: string;
        created: Date;
      }>;
      postgresql: {
        filename: string;
        size: string;
        created: Date;
      } | null;
      lastBackup: Date | null;
    };
  }> {
    const backups = await this.healthService.listBackups();
    return {
      statusCode: 200,
      message: 'Backups retrieved successfully',
      data: {
        mongodb: backups.mongodb.map((b) => ({
          filename: b.filename,
          size: b.size,
          created: b.created,
        })),
        postgresql: backups.postgresql
          ? {
              filename: backups.postgresql.filename,
              size: backups.postgresql.size,
              created: backups.postgresql.created,
            }
          : null,
        lastBackup: backups.lastBackup,
      },
    };
  }

  @Get('backups/storage')
  @AdminAction({ action: 'VIEW_BACKUP_STORAGE', category: 'SYSTEM' })
  async getBackupStorageInfo(): Promise<{
    statusCode: number;
    message: string;
    data: {
      path: string;
      totalSize: string;
      mongoBackupCount: number;
      hasPostgresBackup: boolean;
      isRemoteStorage: boolean;
    };
  }> {
    const info = await this.healthService.getBackupStorageInfo();
    return {
      statusCode: 200,
      message: 'Backup storage info retrieved successfully',
      data: info,
    };
  }

  @Delete('backups/:type/:filename')
  @AdminAction({ action: 'DELETE_BACKUP', category: 'SYSTEM' })
  async deleteBackup(
    @Param('type') type: 'mongodb' | 'postgresql',
    @Param('filename') filename: string,
    @Req() req: AdminRequest,
  ): Promise<{
    statusCode: number;
    message: string;
    data: { success: boolean; message: string };
  }> {
    const result = await this.healthService.deleteBackup(type, filename);
    return {
      statusCode: result.success ? 200 : 400,
      message: result.message,
      data: result,
    };
  }
}
