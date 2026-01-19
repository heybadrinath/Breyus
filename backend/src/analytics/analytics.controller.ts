/**
 * Analytics Controller
 *
 * Provides analytics endpoints for seller dashboards.
 *
 * Existing endpoints (Dashboard):
 * - GET /analytics/metrics - Summary metrics
 * - GET /analytics/bar-data - Store visits chart
 * - GET /analytics/scatter-data - Revenue trend
 * - GET /analytics/pie-data - Customer distribution
 * - GET /analytics/country-sales - Sales by country
 *
 * New endpoints (Sales page):
 * - GET /analytics/sales-metrics - Comprehensive sales data
 * - GET /analytics/top-products - Top products for radar chart
 * - GET /analytics/time-series - Time series for line/area charts
 * - GET /analytics/export/csv - CSV export
 * - GET /analytics/export/pdf - PDF export (returns HTML)
 */

import { Controller, Get, Res, HttpStatus, Query, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { AnalyticsService } from './analytics.service';
import { ExportService } from './export.service';
import { AuthService } from '../auth/auth.service';
import { AnalyticsQueryDto, getDateRangeFromQuery } from './dto/analytics-query.dto';
import { AuthGuard } from '../auth/auth.guard';

/**
 * Analytics Controller
 * All routes are protected by AuthGuard which validates:
 * - Cookie-based JWT authentication
 * - User existence in database
 * - User is not suspended
 */
@Controller('analytics')
@UseGuards(AuthGuard)
export class AnalyticsController {
    constructor(
        private readonly analyticsService: AnalyticsService,
        private readonly exportService: ExportService,
        private readonly authService: AuthService,
    ) {}

    private getCompanyIdFromToken(response: Response): string | null {
        const accountToken = response.req.signedCookies['account'];
        if (!accountToken) {
            return null;
        }
        const decoded = this.authService.validateAccountToken(accountToken);
        return (decoded as any)?.companyId || null;
    }

    // ========================================================================
    // EXISTING ENDPOINTS (Dashboard)
    // ========================================================================

    @Get('metrics')
    async getMetrics(
        @Query() query: AnalyticsQueryDto,
        @Res() response: Response,
    ): Promise<void> {
        try {
            const companyId = this.getCompanyIdFromToken(response);
            if (!companyId) {
                response.status(HttpStatus.UNAUTHORIZED).send({
                    statusCode: HttpStatus.UNAUTHORIZED,
                    message: 'No valid cookie found',
                });
                return;
            }

            const dateRange = getDateRangeFromQuery(query);
            const data = await this.analyticsService.getMetricsData(companyId, dateRange);
            response.status(HttpStatus.OK).send({
                statusCode: HttpStatus.OK,
                message: 'Metrics retrieved successfully',
                data,
            });
        } catch (error) {
            response.status(HttpStatus.INTERNAL_SERVER_ERROR).send({
                statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
                message: 'Failed to get metrics',
                error: error.message || 'Internal Server Error',
            });
        }
    }

    @Get('bar-data')
    async getBarGraphData(
        @Query() query: AnalyticsQueryDto,
        @Res() response: Response,
    ): Promise<void> {
        try {
            const companyId = this.getCompanyIdFromToken(response);
            if (!companyId) {
                response.status(HttpStatus.UNAUTHORIZED).send({
                    statusCode: HttpStatus.UNAUTHORIZED,
                    message: 'No valid cookie found',
                });
                return;
            }

            const dateRange = getDateRangeFromQuery(query);
            const data = await this.analyticsService.getBarGraphData(companyId, dateRange);
            response.status(HttpStatus.OK).send({
                statusCode: HttpStatus.OK,
                message: 'Bar graph data retrieved successfully',
                data,
            });
        } catch (error) {
            response.status(HttpStatus.INTERNAL_SERVER_ERROR).send({
                statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
                message: 'Failed to get bar graph data',
                error: error.message || 'Internal Server Error',
            });
        }
    }

    @Get('scatter-data')
    async getScatterGraphData(
        @Query() query: AnalyticsQueryDto,
        @Res() response: Response,
    ): Promise<void> {
        try {
            const companyId = this.getCompanyIdFromToken(response);
            if (!companyId) {
                response.status(HttpStatus.UNAUTHORIZED).send({
                    statusCode: HttpStatus.UNAUTHORIZED,
                    message: 'No valid cookie found',
                });
                return;
            }

            const dateRange = getDateRangeFromQuery(query);
            const data = await this.analyticsService.getScatterGraphData(companyId, dateRange);
            response.status(HttpStatus.OK).send({
                statusCode: HttpStatus.OK,
                message: 'Scatter graph data retrieved successfully',
                data,
            });
        } catch (error) {
            response.status(HttpStatus.INTERNAL_SERVER_ERROR).send({
                statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
                message: 'Failed to get scatter graph data',
                error: error.message || 'Internal Server Error',
            });
        }
    }

    @Get('pie-data')
    async getPieChartData(
        @Query() query: AnalyticsQueryDto,
        @Res() response: Response,
    ): Promise<void> {
        try {
            const companyId = this.getCompanyIdFromToken(response);
            if (!companyId) {
                response.status(HttpStatus.UNAUTHORIZED).send({
                    statusCode: HttpStatus.UNAUTHORIZED,
                    message: 'No valid cookie found',
                });
                return;
            }

            const dateRange = getDateRangeFromQuery(query);
            const data = await this.analyticsService.getPieChartData(companyId, dateRange);
            response.status(HttpStatus.OK).send({
                statusCode: HttpStatus.OK,
                message: 'Pie chart data retrieved successfully',
                data,
            });
        } catch (error) {
            response.status(HttpStatus.INTERNAL_SERVER_ERROR).send({
                statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
                message: 'Failed to get pie chart data',
                error: error.message || 'Internal Server Error',
            });
        }
    }

    @Get('country-sales')
    async getCountrySalesData(
        @Query() query: AnalyticsQueryDto,
        @Res() response: Response,
    ): Promise<void> {
        try {
            const companyId = this.getCompanyIdFromToken(response);
            if (!companyId) {
                response.status(HttpStatus.UNAUTHORIZED).send({
                    statusCode: HttpStatus.UNAUTHORIZED,
                    message: 'No valid cookie found',
                });
                return;
            }

            const dateRange = getDateRangeFromQuery(query);
            const data = await this.analyticsService.getCountrySalesData(companyId, dateRange);
            response.status(HttpStatus.OK).send({
                statusCode: HttpStatus.OK,
                message: 'Country sales data retrieved successfully',
                data,
            });
        } catch (error) {
            response.status(HttpStatus.INTERNAL_SERVER_ERROR).send({
                statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
                message: 'Failed to get country sales data',
                error: error.message || 'Internal Server Error',
            });
        }
    }

    // ========================================================================
    // NEW ENDPOINTS (Sales Page)
    // ========================================================================

    @Get('sales-metrics')
    async getSalesMetrics(
        @Query() query: AnalyticsQueryDto,
        @Res() response: Response,
    ): Promise<void> {
        try {
            const companyId = this.getCompanyIdFromToken(response);
            if (!companyId) {
                response.status(HttpStatus.UNAUTHORIZED).send({
                    statusCode: HttpStatus.UNAUTHORIZED,
                    message: 'No valid cookie found',
                });
                return;
            }

            const dateRange = getDateRangeFromQuery(query);
            const data = await this.analyticsService.getSalesMetricsData(companyId, dateRange);
            response.status(HttpStatus.OK).send({
                statusCode: HttpStatus.OK,
                message: 'Sales metrics retrieved successfully',
                data,
            });
        } catch (error) {
            response.status(HttpStatus.INTERNAL_SERVER_ERROR).send({
                statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
                message: 'Failed to get sales metrics',
                error: error.message || 'Internal Server Error',
            });
        }
    }

    @Get('top-products')
    async getTopProducts(
        @Query() query: AnalyticsQueryDto,
        @Res() response: Response,
    ): Promise<void> {
        try {
            const companyId = this.getCompanyIdFromToken(response);
            if (!companyId) {
                response.status(HttpStatus.UNAUTHORIZED).send({
                    statusCode: HttpStatus.UNAUTHORIZED,
                    message: 'No valid cookie found',
                });
                return;
            }

            const dateRange = getDateRangeFromQuery(query);
            const data = await this.analyticsService.getTopProductsData(companyId, dateRange);
            response.status(HttpStatus.OK).send({
                statusCode: HttpStatus.OK,
                message: 'Top products retrieved successfully',
                data,
            });
        } catch (error) {
            response.status(HttpStatus.INTERNAL_SERVER_ERROR).send({
                statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
                message: 'Failed to get top products',
                error: error.message || 'Internal Server Error',
            });
        }
    }

    @Get('time-series')
    async getTimeSeries(
        @Query() query: AnalyticsQueryDto,
        @Res() response: Response,
    ): Promise<void> {
        try {
            const companyId = this.getCompanyIdFromToken(response);
            if (!companyId) {
                response.status(HttpStatus.UNAUTHORIZED).send({
                    statusCode: HttpStatus.UNAUTHORIZED,
                    message: 'No valid cookie found',
                });
                return;
            }

            const dateRange = getDateRangeFromQuery(query);
            const data = await this.analyticsService.getTimeSeriesData(companyId, dateRange);
            response.status(HttpStatus.OK).send({
                statusCode: HttpStatus.OK,
                message: 'Time series data retrieved successfully',
                data,
            });
        } catch (error) {
            response.status(HttpStatus.INTERNAL_SERVER_ERROR).send({
                statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
                message: 'Failed to get time series data',
                error: error.message || 'Internal Server Error',
            });
        }
    }

    // ========================================================================
    // EXPORT ENDPOINTS
    // ========================================================================

    @Get('export/csv')
    async exportCsv(
        @Query() query: AnalyticsQueryDto,
        @Res() response: Response,
    ): Promise<void> {
        try {
            const companyId = this.getCompanyIdFromToken(response);
            if (!companyId) {
                response.status(HttpStatus.UNAUTHORIZED).send({
                    statusCode: HttpStatus.UNAUTHORIZED,
                    message: 'No valid cookie found',
                });
                return;
            }

            const dateRange = getDateRangeFromQuery(query);
            const csv = await this.exportService.generateCsv(companyId, dateRange);

            // Set headers for file download
            const filename = `breyus-analytics-${dateRange.startDate.toISOString().split('T')[0]}-to-${dateRange.endDate.toISOString().split('T')[0]}.csv`;
            response.setHeader('Content-Type', 'text/csv');
            response.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
            response.status(HttpStatus.OK).send(csv);
        } catch (error) {
            response.status(HttpStatus.INTERNAL_SERVER_ERROR).send({
                statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
                message: 'Failed to export CSV',
                error: error.message || 'Internal Server Error',
            });
        }
    }

    @Get('export/pdf')
    async exportPdf(
        @Query() query: AnalyticsQueryDto,
        @Res() response: Response,
    ): Promise<void> {
        try {
            const companyId = this.getCompanyIdFromToken(response);
            if (!companyId) {
                response.status(HttpStatus.UNAUTHORIZED).send({
                    statusCode: HttpStatus.UNAUTHORIZED,
                    message: 'No valid cookie found',
                });
                return;
            }

            const dateRange = getDateRangeFromQuery(query);
            const html = await this.exportService.generatePdfHtml(companyId, dateRange);

            // Return HTML that frontend can convert to PDF using browser's print API
            response.setHeader('Content-Type', 'text/html');
            response.status(HttpStatus.OK).send(html);
        } catch (error) {
            response.status(HttpStatus.INTERNAL_SERVER_ERROR).send({
                statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
                message: 'Failed to export PDF',
                error: error.message || 'Internal Server Error',
            });
        }
    }
}
