import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { AdminActivityLog, ActivityMetadata } from './schemas/admin-activity-log.schema';

export interface LogActivityParams {
  adminId: Types.ObjectId;
  adminEmail: string;
  action: string;
  actionCategory: string;
  targetType?: string;
  targetId?: Types.ObjectId;
  targetIdentifier?: string;
  description: string;
  previousValue?: Record<string, any>;
  newValue?: Record<string, any>;
  metadata?: ActivityMetadata;
}

@Injectable()
export class ActivityLogService {
  private readonly logger = new Logger(ActivityLogService.name);

  constructor(
    @InjectModel(AdminActivityLog.name) private activityLogModel: Model<AdminActivityLog>,
  ) {}

  /**
   * Log an admin activity
   */
  async log(params: LogActivityParams): Promise<AdminActivityLog> {
    try {
      const activityLog = new this.activityLogModel({
        adminId: params.adminId,
        adminEmail: params.adminEmail,
        action: params.action,
        actionCategory: params.actionCategory,
        targetType: params.targetType,
        targetId: params.targetId,
        targetIdentifier: params.targetIdentifier,
        description: params.description,
        previousValue: params.previousValue,
        newValue: params.newValue,
        metadata: params.metadata,
        timestamp: new Date(),
      });

      return activityLog.save();
    } catch (error) {
      // Log errors but don't fail the main operation
      this.logger.error(`Failed to log activity: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get activity logs with pagination and filters
   */
  async getActivityLogs(params: {
    page?: number;
    limit?: number;
    adminId?: Types.ObjectId;
    actionCategory?: string;
    action?: string;
    targetType?: string;
    startDate?: Date;
    endDate?: Date;
  }): Promise<{ data: AdminActivityLog[]; total: number; page: number; totalPages: number }> {
    const {
      page = 1,
      limit = 20,
      adminId,
      actionCategory,
      action,
      targetType,
      startDate,
      endDate
    } = params;

    const query: any = {};

    if (adminId) {
      query.adminId = adminId;
    }

    if (actionCategory) {
      query.actionCategory = actionCategory;
    }

    if (action) {
      query.action = action;
    }

    if (targetType) {
      query.targetType = targetType;
    }

    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = startDate;
      if (endDate) query.timestamp.$lte = endDate;
    }

    const total = await this.activityLogModel.countDocuments(query).exec();
    const totalPages = Math.ceil(total / limit);

    const data = await this.activityLogModel
      .find(query)
      .sort({ timestamp: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .exec();

    return { data, total, page, totalPages };
  }

  /**
   * Get recent activity for dashboard
   */
  async getRecentActivity(limit: number = 10): Promise<AdminActivityLog[]> {
    return this.activityLogModel
      .find()
      .sort({ timestamp: -1 })
      .limit(limit)
      .exec();
  }

  /**
   * Get activity for a specific target
   */
  async getActivityForTarget(
    targetType: string,
    targetId: Types.ObjectId,
    limit: number = 50,
  ): Promise<AdminActivityLog[]> {
    return this.activityLogModel
      .find({ targetType, targetId })
      .sort({ timestamp: -1 })
      .limit(limit)
      .exec();
  }

  /**
   * Get activity summary by category
   */
  async getActivitySummary(
    startDate: Date,
    endDate: Date,
  ): Promise<{ category: string; count: number }[]> {
    return this.activityLogModel.aggregate([
      {
        $match: {
          timestamp: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $group: {
          _id: '$actionCategory',
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          category: '$_id',
          count: 1,
          _id: 0,
        },
      },
      {
        $sort: { count: -1 },
      },
    ]).exec();
  }

  /**
   * Get activity log by ID
   */
  async getById(id: string): Promise<AdminActivityLog | null> {
    return this.activityLogModel.findById(id).exec();
  }
}
