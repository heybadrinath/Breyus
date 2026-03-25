import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { MaintenanceConfig } from './schemas/maintenance-config.schema';
import { UpdateMaintenanceDto } from './dto/maintenance.dto';
import { ActivityLogService } from '../activity/activity-log.service';

@Injectable()
export class SystemService {
  private readonly logger = new Logger(SystemService.name);
  private readonly CONFIG_ID = 'maintenance_config';

  constructor(
    @InjectModel(MaintenanceConfig.name)
    private maintenanceModel: Model<MaintenanceConfig>,
    private activityLogService: ActivityLogService,
  ) {}

  async getMaintenanceConfig(): Promise<MaintenanceConfig> {
    let config = await this.maintenanceModel.findOne().exec();

    if (!config) {
      // Create default config if none exists
      config = await this.maintenanceModel.create({
        isEnabled: false,
        message: 'System maintenance in progress. Please try again later.',
        allowedIPs: [],
      });
    }

    return config;
  }

  async updateMaintenanceConfig(
    dto: UpdateMaintenanceDto,
    adminId: Types.ObjectId,
    adminEmail: string,
  ): Promise<MaintenanceConfig> {
    const config = await this.getMaintenanceConfig();
    const previousValue = {
      isEnabled: config.isEnabled,
      message: config.message,
      estimatedEndTime: config.estimatedEndTime,
      allowedIPs: config.allowedIPs,
    };

    // Update config
    config.isEnabled = dto.isEnabled;
    if (dto.message !== undefined) config.message = dto.message;
    if (dto.estimatedEndTime !== undefined) {
      config.estimatedEndTime = new Date(dto.estimatedEndTime);
    }
    if (dto.allowedIPs !== undefined) config.allowedIPs = dto.allowedIPs;

    // Track who enabled/disabled
    if (dto.isEnabled && !previousValue.isEnabled) {
      config.lastEnabledAt = new Date();
      config.lastEnabledBy = adminId;
    } else if (!dto.isEnabled && previousValue.isEnabled) {
      config.lastDisabledAt = new Date();
      config.lastDisabledBy = adminId;
    }

    await config.save();

    // Log activity
    await this.activityLogService.log({
      adminId,
      adminEmail,
      action: dto.isEnabled ? 'MAINTENANCE_ENABLED' : 'MAINTENANCE_DISABLED',
      actionCategory: 'SYSTEM',
      description: dto.isEnabled
        ? `Enabled maintenance mode: ${dto.message || config.message}`
        : 'Disabled maintenance mode',
      previousValue,
      newValue: {
        isEnabled: config.isEnabled,
        message: config.message,
        estimatedEndTime: config.estimatedEndTime,
        allowedIPs: config.allowedIPs,
      },
    });

    this.logger.log(
      `Maintenance mode ${dto.isEnabled ? 'enabled' : 'disabled'} by ${adminEmail}`,
    );

    return config;
  }

  /**
   * Check if maintenance mode is currently active
   */
  async isMaintenanceActive(): Promise<{
    isActive: boolean;
    message: string;
    estimatedEndTime?: Date;
  }> {
    const config = await this.getMaintenanceConfig();

    if (config.isEnabled) {
      return {
        isActive: true,
        message: config.message,
        estimatedEndTime: config.estimatedEndTime,
      };
    }

    return { isActive: false, message: '' };
  }

  /**
   * Check if an IP is allowed during maintenance
   */
  async isIpAllowed(ip: string): Promise<boolean> {
    const config = await this.getMaintenanceConfig();

    if (!config.isEnabled) return true;
    if (config.allowedIPs.length === 0) return false;

    return config.allowedIPs.includes(ip);
  }
}
