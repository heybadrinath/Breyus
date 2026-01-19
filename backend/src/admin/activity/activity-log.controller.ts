import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
  HttpStatus,
  Res,
  NotFoundException,
} from '@nestjs/common';
import { Response } from 'express';
import { Types } from 'mongoose';
import { ActivityLogService } from './activity-log.service';
import { AdminAuthGuard } from '../auth/admin-auth.guard';
import { GetActivityLogsQueryDto, ExportActivityLogsQueryDto } from './dto';

@Controller('admin/activity')
@UseGuards(AdminAuthGuard)
export class ActivityLogController {
  constructor(private readonly activityLogService: ActivityLogService) {}

  /**
   * Get paginated list of activity logs with filters
   * GET /admin/activity?page=1&limit=20&adminId=&actionCategory=&action=&targetType=&startDate=&endDate=&search=
   */
  @Get()
  async getActivityLogs(@Query() query: GetActivityLogsQueryDto) {
    const {
      page,
      limit,
      adminId,
      actionCategory,
      action,
      targetType,
      startDate,
      endDate,
      search,
    } = query;

    // Build params for service
    const params: any = {
      page,
      limit,
      actionCategory,
      action,
      targetType,
    };

    if (adminId) {
      params.adminId = new Types.ObjectId(adminId);
    }

    if (startDate) {
      params.startDate = new Date(startDate);
    }

    if (endDate) {
      params.endDate = new Date(endDate);
    }

    const result = await this.activityLogService.getActivityLogs(params);

    // If search is provided, filter results (simple text search on description and action)
    let filteredData = result.data;
    if (search) {
      const searchLower = search.toLowerCase();
      filteredData = result.data.filter(
        (log) =>
          log.description?.toLowerCase().includes(searchLower) ||
          log.action?.toLowerCase().includes(searchLower) ||
          log.adminEmail?.toLowerCase().includes(searchLower) ||
          log.targetIdentifier?.toLowerCase().includes(searchLower),
      );
    }

    const safeLimit = limit ?? 20;

    return {
      statusCode: HttpStatus.OK,
      message: 'Activity logs retrieved successfully',
      data: {
        data: filteredData,
        total: search ? filteredData.length : result.total,
        page: result.page,
        totalPages: search
          ? Math.ceil(filteredData.length / safeLimit)
          : result.totalPages,
      },
    };
  }

  /**
   * Export activity logs as CSV
   * GET /admin/activity/export?adminId=&actionCategory=&action=&targetType=&startDate=&endDate=
   */
  @Get('export')
  async exportActivityLogs(
    @Query() query: ExportActivityLogsQueryDto,
    @Res() res: Response,
  ) {
    const { adminId, actionCategory, action, targetType, startDate, endDate } =
      query;

    // Build params for service - get all records (high limit for export)
    const params: any = {
      page: 1,
      limit: 10000, // Max export limit
      actionCategory,
      action,
      targetType,
    };

    if (adminId) {
      params.adminId = new Types.ObjectId(adminId);
    }

    if (startDate) {
      params.startDate = new Date(startDate);
    }

    if (endDate) {
      params.endDate = new Date(endDate);
    }

    const result = await this.activityLogService.getActivityLogs(params);

    // Build CSV content
    const headers = [
      'Timestamp',
      'Admin Email',
      'Action',
      'Category',
      'Target Type',
      'Target',
      'Description',
      'IP Address',
    ];

    const rows = result.data.map((log) => [
      log.timestamp?.toISOString() || '',
      log.adminEmail || '',
      log.action || '',
      log.actionCategory || '',
      log.targetType || '',
      log.targetIdentifier || '',
      `"${(log.description || '').replace(/"/g, '""')}"`,
      log.metadata?.ipAddress || '',
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.join(',')),
    ].join('\n');

    // Set headers for CSV download
    const filename = `activity-logs-${new Date().toISOString().split('T')[0]}.csv`;
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    return res.status(HttpStatus.OK).send(csvContent);
  }

  /**
   * Get activity log by ID
   * GET /admin/activity/:id
   */
  @Get(':id')
  async getActivityLogById(@Param('id') id: string) {
    const log = await this.activityLogService.getById(id);

    if (!log) {
      throw new NotFoundException('Activity log not found');
    }

    return {
      statusCode: HttpStatus.OK,
      message: 'Activity log retrieved successfully',
      data: log,
    };
  }

  /**
   * Get activity summary by category for a date range
   * GET /admin/activity/summary?startDate=&endDate=
   */
  @Get('summary/by-category')
  async getActivitySummary(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();

    const summary = await this.activityLogService.getActivitySummary(start, end);

    return {
      statusCode: HttpStatus.OK,
      message: 'Activity summary retrieved successfully',
      data: summary,
    };
  }

  /**
   * Get recent activity for dashboard widget
   * GET /admin/activity/recent?limit=10
   */
  @Get('recent/list')
  async getRecentActivity(@Query('limit') limit?: string) {
    const numLimit = limit ? parseInt(limit, 10) : 10;
    const activities = await this.activityLogService.getRecentActivity(
      Math.min(numLimit, 50),
    );

    return {
      statusCode: HttpStatus.OK,
      message: 'Recent activity retrieved successfully',
      data: activities,
    };
  }
}
