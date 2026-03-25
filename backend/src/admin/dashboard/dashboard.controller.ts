import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { AdminAuthGuard } from '../auth/admin-auth.guard';
import { AdminAction } from '../common/decorators/admin-action.decorator';
import { ActivityLogService } from '../activity/activity-log.service';

@Controller('admin/dashboard')
@UseGuards(AdminAuthGuard)
export class DashboardController {
  constructor(
    private dashboardService: DashboardService,
    private activityLogService: ActivityLogService,
  ) {}

  @Get('stats')
  @AdminAction({ action: 'VIEW_DASHBOARD_STATS', category: 'DASHBOARD' })
  async getDashboardStats(): Promise<{
    statusCode: number;
    message: string;
    data: any;
  }> {
    const stats = await this.dashboardService.getDashboardStats();
    return {
      statusCode: 200,
      message: 'Dashboard stats retrieved successfully',
      data: stats,
    };
  }

  @Get('pending-actions')
  @AdminAction({ action: 'VIEW_PENDING_ACTIONS', category: 'DASHBOARD' })
  async getPendingActions(): Promise<{
    statusCode: number;
    message: string;
    data: any;
  }> {
    const actions = await this.dashboardService.getPendingActions();
    return {
      statusCode: 200,
      message: 'Pending actions retrieved successfully',
      data: actions,
    };
  }

  @Get('activity')
  @AdminAction({ action: 'VIEW_RECENT_ACTIVITY', category: 'DASHBOARD' })
  async getRecentActivity(@Query('limit') limit?: string): Promise<{
    statusCode: number;
    message: string;
    data: {
      data: any[];
      total: number;
      page: number;
      totalPages: number;
    };
  }> {
    const limitNum = limit ? parseInt(limit, 10) : 10;
    const result = await this.activityLogService.getActivityLogs({
      page: 1,
      limit: limitNum,
    });
    return {
      statusCode: 200,
      message: 'Recent activity retrieved successfully',
      data: result,
    };
  }

  @Get('trades-by-status')
  @AdminAction({ action: 'VIEW_TRADES_BY_STATUS', category: 'DASHBOARD' })
  async getTradesByStatus(): Promise<{
    statusCode: number;
    message: string;
    data: any[];
  }> {
    const data = await this.dashboardService.getTradesByStatus();
    return {
      statusCode: 200,
      message: 'Trades by status retrieved successfully',
      data,
    };
  }

  @Get('users-by-role')
  @AdminAction({ action: 'VIEW_USERS_BY_ROLE', category: 'DASHBOARD' })
  async getUsersByRole(): Promise<{
    statusCode: number;
    message: string;
    data: any[];
  }> {
    const data = await this.dashboardService.getUsersByRole();
    return {
      statusCode: 200,
      message: 'Users by role retrieved successfully',
      data,
    };
  }

  @Get('trade-volume')
  @AdminAction({ action: 'VIEW_TRADE_VOLUME', category: 'DASHBOARD' })
  async getTradeVolumeOverTime(@Query('days') days?: string): Promise<{
    statusCode: number;
    message: string;
    data: any[];
  }> {
    const data = await this.dashboardService.getTradeVolumeOverTime(
      days ? parseInt(days, 10) : 30,
    );
    return {
      statusCode: 200,
      message: 'Trade volume data retrieved successfully',
      data,
    };
  }
}
