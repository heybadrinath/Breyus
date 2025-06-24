import { Controller, Get, Logger, HttpException, HttpStatus, Query, ParseIntPipe, DefaultValuePipe, UseGuards, Request } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { DailySaleDto, DailyStoreVisitDto, DashboardAnalyticsDto, TaskStatusDistributionDto } from './dto/analytics.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('analytics')
export class AnalyticsController {
    private readonly logger = new Logger(AnalyticsController.name);

    constructor(private readonly analyticsService: AnalyticsService) {}

    @UseGuards(JwtAuthGuard)
    @Get('debug/user')
    async getDebugUserInfo(@Request() req): Promise<any> {
        this.logger.log(`Debug: User info from JWT token: ${JSON.stringify(req.user)}`);
        return {
            user: req.user,
            sellerId: req.user.id,
            message: 'Current authenticated user information'
        };
    }

    @UseGuards(JwtAuthGuard)
    @Get('dashboard')
    async getDashboardAnalytics(
        @Request() req,
        @Query('days', new DefaultValuePipe(30), ParseIntPipe) days: number
    ): Promise<DashboardAnalyticsDto> {
        try {
            const seller_id = req.user.id;
            
            if (!seller_id) {
                throw new HttpException('Seller ID not found in token', HttpStatus.UNAUTHORIZED);
            }
            this.logger.log(`GET /analytics/dashboard?days=${days} request received for seller ${seller_id}`);
            return await this.analyticsService.getDashboardAnalytics(seller_id, days);
        } catch (error) {
            this.logger.error(`Error in getDashboardAnalytics for ${days} days`, error.stack);
            throw new HttpException(
                'Failed to fetch dashboard analytics data',
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    @UseGuards(JwtAuthGuard)
    @Get('daily-visits')
    async getDailyStoreVisits(
        @Request() req,
        @Query('days', new DefaultValuePipe(30), ParseIntPipe) days: number
    ): Promise<DailyStoreVisitDto[]> {
        try {
            const seller_id = req.user.id;
            
            if (!seller_id) {
                throw new HttpException('Seller ID not found in token', HttpStatus.UNAUTHORIZED);
            }
            this.logger.log(`GET /analytics/daily-visits?days=${days} request received for seller ${seller_id}`);
            return await this.analyticsService.getDailyStoreVisits(seller_id, days);
        } catch (error) {
            this.logger.error(`Error in getDailyStoreVisits for ${days} days`, error.stack);
            throw new HttpException(
                'Failed to fetch daily store visits data',
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    @UseGuards(JwtAuthGuard)
    @Get('daily-sales')
    async getDailySales(
        @Request() req,
        @Query('days', new DefaultValuePipe(30), ParseIntPipe) days: number
    ): Promise<DailySaleDto[]> {
        try {
            const seller_id = req.user.id;
            
            if (!seller_id) {
                throw new HttpException('Seller ID not found in token', HttpStatus.UNAUTHORIZED);
            }
            this.logger.log(`GET /analytics/daily-sales?days=${days} request received for seller ${seller_id}`);
            return await this.analyticsService.getDailySales(seller_id, days);
        } catch (error) {
            this.logger.error(`Error in getDailySales for ${days} days`, error.stack);
            throw new HttpException(
                'Failed to fetch daily sales data',
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    @UseGuards(JwtAuthGuard)
    @Get('tasks-distribution')
    async getTasksStatusDistribution(@Request() req): Promise<TaskStatusDistributionDto[]> {
        try {
            const seller_id = req.user.id;
            
            if (!seller_id) {
                throw new HttpException('Seller ID not found in token', HttpStatus.UNAUTHORIZED);
            }
            this.logger.log(`GET /analytics/tasks-distribution request received for seller ${seller_id}`);
            return await this.analyticsService.getTasksStatusDistribution(seller_id);
        } catch (error) {
            this.logger.error('Error in getTasksStatusDistribution', error.stack);
            throw new HttpException(
                'Failed to fetch tasks status distribution data',
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }
} 