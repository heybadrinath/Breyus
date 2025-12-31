import { Controller, Get, Res, HttpStatus } from '@nestjs/common';
import { Response } from 'express';
import { AnalyticsService } from './analytics.service';
import { AuthService } from '../auth/auth.service';

@Controller('analytics')
export class AnalyticsController {
    constructor(
        private readonly analyticsService: AnalyticsService,
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

    @Get('metrics')
    async getMetrics(@Res() response: Response): Promise<void> {
        try {
            const companyId = this.getCompanyIdFromToken(response);
            if (!companyId) {
                response.status(HttpStatus.UNAUTHORIZED).send({
                    statusCode: HttpStatus.UNAUTHORIZED,
                    message: 'No valid cookie found',
                });
                return;
            }

            const data = await this.analyticsService.getMetricsData(companyId);
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
    async getBarGraphData(@Res() response: Response): Promise<void> {
        try {
            const companyId = this.getCompanyIdFromToken(response);
            if (!companyId) {
                response.status(HttpStatus.UNAUTHORIZED).send({
                    statusCode: HttpStatus.UNAUTHORIZED,
                    message: 'No valid cookie found',
                });
                return;
            }

            const data = await this.analyticsService.getBarGraphData(companyId);
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
    async getScatterGraphData(@Res() response: Response): Promise<void> {
        try {
            const companyId = this.getCompanyIdFromToken(response);
            if (!companyId) {
                response.status(HttpStatus.UNAUTHORIZED).send({
                    statusCode: HttpStatus.UNAUTHORIZED,
                    message: 'No valid cookie found',
                });
                return;
            }

            const data = await this.analyticsService.getScatterGraphData(companyId);
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
    async getPieChartData(@Res() response: Response): Promise<void> {
        try {
            const companyId = this.getCompanyIdFromToken(response);
            if (!companyId) {
                response.status(HttpStatus.UNAUTHORIZED).send({
                    statusCode: HttpStatus.UNAUTHORIZED,
                    message: 'No valid cookie found',
                });
                return;
            }

            const data = await this.analyticsService.getPieChartData(companyId);
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
    async getCountrySalesData(@Res() response: Response): Promise<void> {
        try {
            const companyId = this.getCompanyIdFromToken(response);
            if (!companyId) {
                response.status(HttpStatus.UNAUTHORIZED).send({
                    statusCode: HttpStatus.UNAUTHORIZED,
                    message: 'No valid cookie found',
                });
                return;
            }

            const data = await this.analyticsService.getCountrySalesData(companyId);
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
}
