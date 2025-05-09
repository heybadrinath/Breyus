import { Controller, Get, Put, Body, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { Analytics } from './entities/analytics.entity';

@Controller('analytics')
export class AnalyticsController {
    private readonly logger = new Logger(AnalyticsController.name);

    constructor(private readonly analyticsService: AnalyticsService) {}

    @Get()
    async getAnalytics(): Promise<Analytics> {
        try {
            this.logger.log('GET /analytics request received');
            return await this.analyticsService.getLatestAnalytics();
        } catch (error) {
            this.logger.error('Error in getAnalytics', error);
            throw new HttpException(
                'Failed to fetch analytics data',
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    @Put()
    async updateAnalytics(@Body() analyticsData: Partial<Analytics>) {
        try {
            this.logger.log('PUT /analytics request received');
            return await this.analyticsService.updateAnalytics(analyticsData);
        } catch (error) {
            this.logger.error('Error in updateAnalytics', error);
            throw new HttpException(
                'Failed to update analytics data',
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }
} 