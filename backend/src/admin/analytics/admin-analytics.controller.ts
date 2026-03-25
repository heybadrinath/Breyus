import {
  Controller,
  Get,
  Post,
  Query,
  Body,
  Res,
  UseGuards,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { AdminAnalyticsService } from './admin-analytics.service';
import { ExportService, ExportOptions } from './export/export.service';
import { AdminAuthGuard } from '../auth/admin-auth.guard';
import { AdminAction } from '../common/decorators/admin-action.decorator';
import { AnalyticsQueryDto, ExportAnalyticsDto } from './dto';

@Controller('admin/analytics')
@UseGuards(AdminAuthGuard)
export class AdminAnalyticsController {
  constructor(
    private readonly analyticsService: AdminAnalyticsService,
    private readonly exportService: ExportService,
  ) {}

  /**
   * Get platform overview metrics
   * GET /admin/analytics/overview?startDate=&endDate=
   */
  @Get('overview')
  @AdminAction({ action: 'analytics.overview', category: 'analytics' })
  async getOverviewMetrics(@Query() query: AnalyticsQueryDto) {
    const data = await this.analyticsService.getOverviewMetrics(
      query.startDate,
      query.endDate,
    );
    return {
      statusCode: HttpStatus.OK,
      message: 'Overview metrics retrieved successfully',
      data,
    };
  }

  /**
   * Get trade analytics
   * GET /admin/analytics/trades?startDate=&endDate=&groupBy=day
   */
  @Get('trades')
  @AdminAction({ action: 'analytics.trades', category: 'analytics' })
  async getTradeAnalytics(@Query() query: AnalyticsQueryDto) {
    const data = await this.analyticsService.getTradeAnalytics(
      query.startDate,
      query.endDate,
      query.groupBy,
    );
    return {
      statusCode: HttpStatus.OK,
      message: 'Trade analytics retrieved successfully',
      data,
    };
  }

  /**
   * Get user analytics
   * GET /admin/analytics/users?startDate=&endDate=
   */
  @Get('users')
  @AdminAction({ action: 'analytics.users', category: 'analytics' })
  async getUserAnalytics(@Query() query: AnalyticsQueryDto) {
    const data = await this.analyticsService.getUserAnalytics(
      query.startDate,
      query.endDate,
    );
    return {
      statusCode: HttpStatus.OK,
      message: 'User analytics retrieved successfully',
      data,
    };
  }

  /**
   * Get financial analytics
   * GET /admin/analytics/financial?startDate=&endDate=
   */
  @Get('financial')
  @AdminAction({ action: 'analytics.financial', category: 'analytics' })
  async getFinancialAnalytics(@Query() query: AnalyticsQueryDto) {
    const data = await this.analyticsService.getFinancialAnalytics(
      query.startDate,
      query.endDate,
    );
    return {
      statusCode: HttpStatus.OK,
      message: 'Financial analytics retrieved successfully',
      data,
    };
  }

  /**
   * Get operational metrics
   * GET /admin/analytics/operational
   */
  @Get('operational')
  @AdminAction({ action: 'analytics.operational', category: 'analytics' })
  async getOperationalMetrics() {
    const data = await this.analyticsService.getOperationalMetrics();
    return {
      statusCode: HttpStatus.OK,
      message: 'Operational metrics retrieved successfully',
      data,
    };
  }

  /**
   * Export analytics as CSV or PDF
   * POST /admin/analytics/export
   * Body: { type: 'csv'|'pdf', section: 'all'|'overview'|'trades'|'users'|'financial', startDate?, endDate? }
   */
  @Post('export')
  @AdminAction({ action: 'analytics.export', category: 'analytics' })
  async exportAnalytics(@Body() dto: ExportAnalyticsDto, @Res() res: Response) {
    const options: ExportOptions = {
      type: dto.type,
      section: dto.section,
      startDate: dto.startDate,
      endDate: dto.endDate,
    };

    const { buffer, filename, mimeType } =
      await this.exportService.generateExport(options);

    res.setHeader('Content-Type', mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', buffer.length);

    return res.send(buffer);
  }
}
