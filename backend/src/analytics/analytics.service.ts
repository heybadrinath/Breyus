import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Analytics } from './entities/analytics.entity';

@Injectable()
export class AnalyticsService {
    private readonly logger = new Logger(AnalyticsService.name);

    constructor(
        @InjectRepository(Analytics)
        private analyticsRepository: Repository<Analytics>
    ) {
        // Initialize default data when service starts
        this.initializeDefaultData().catch(err => 
            this.logger.error('Failed to initialize default analytics data:', err)
        );
    }

    async getLatestAnalytics(): Promise<Analytics> {
        try {
            this.logger.log('Fetching latest analytics data');
            const latestAnalytics = await this.analyticsRepository.find({
                order: { created_at: 'DESC' },
                take: 1,
            });

            if (latestAnalytics.length === 0) {
                this.logger.log('No analytics found, initializing default data');
                await this.initializeDefaultData();
                return this.getLatestAnalytics();
            }

            const result = latestAnalytics[0];
            
            // Parse JSON strings for client use
            if (result.store_visits) {
                result.store_visits = JSON.parse(result.store_visits as string);
            }
            if (result.daily_sales) {
                result.daily_sales = JSON.parse(result.daily_sales as string);
            }
            if (result.country_sales) {
                result.country_sales = JSON.parse(result.country_sales as string);
            }
            
            return result;
        } catch (error) {
            this.logger.error('Error fetching analytics data', error);
            throw new Error('Failed to fetch analytics data');
        }
    }

    private async initializeDefaultData(): Promise<void> {
        try {
            const count = await this.analyticsRepository.count();
            if (count === 0) {
                this.logger.log('Initializing default analytics data');
                
                const storeVisits = [
                    { week: 'Mon', storeVisits: 40 },
                    { week: 'Tue', storeVisits: 30 },
                    { week: 'Wed', storeVisits: 20 },
                    { week: 'Thu', storeVisits: 27 },
                    { week: 'Fri', storeVisits: 18 },
                    { week: 'Sat', storeVisits: 23 },
                    { week: 'Sun', storeVisits: 34 },
                ];

                const dailySales = [
                    { x: 1, y: 7 },
                    { x: 2, y: 10 },
                    { x: 3, y: 8 },
                    { x: 4, y: 13 },
                    { x: 5, y: 11 },
                    { x: 6, y: 6 },
                    { x: 7, y: 12 },
                    { x: 8, y: 8 },
                ];

                const countrySales = [
                    {
                        country: 'United States',
                        sales: 2500,
                        value: 894,
                        bounce: 4.5,
                        flagUrl: '/flags/us.png',
                    },
                    {
                        country: 'United Kingdom',
                        sales: 1500,
                        value: 645,
                        bounce: 4.7,
                        flagUrl: '/flags/gb.png',
                    },
                    {
                        country: 'Japan',
                        sales: 1300,
                        value: 483,
                        bounce: 5.6,
                        flagUrl: '/flags/jp.png',
                    },
                    {
                        country: 'Germany',
                        sales: 1200,
                        value: 562,
                        bounce: 4.8,
                        flagUrl: '/flags/de.png',
                    },
                    {
                        country: 'Brazil',
                        sales: 1000,
                        value: 432,
                        bounce: 5.7,
                        flagUrl: '/flags/br.png',
                    },
                ];

                const defaultData = this.analyticsRepository.create({
                    store_visits: JSON.stringify(storeVisits),
                    daily_sales: JSON.stringify(dailySales),
                    website_views: 4679,
                    website_views_increase: 15,
                    today_users: 16,
                    today_users_increase: 14,
                    revenue: 31754,
                    revenue_increase: 15,
                    followers: 65,
                    followers_increase: 9,
                    country_sales: JSON.stringify(countrySales),
                });

                await this.analyticsRepository.save(defaultData);
                this.logger.log('Default analytics data initialized successfully');
            }
        } catch (error) {
            this.logger.error('Error initializing default data', error);
            throw new Error('Failed to initialize default analytics data');
        }
    }

    async updateAnalytics(analyticsData: Partial<Analytics>): Promise<Analytics> {
        try {
            this.logger.log('Updating analytics data');
            const latestAnalytics = await this.getLatestAnalytics();
            
            // Convert objects to JSON strings for SQLite storage
            if (analyticsData.store_visits && typeof analyticsData.store_visits !== 'string') {
                analyticsData.store_visits = JSON.stringify(analyticsData.store_visits);
            }
            
            if (analyticsData.daily_sales && typeof analyticsData.daily_sales !== 'string') {
                analyticsData.daily_sales = JSON.stringify(analyticsData.daily_sales);
            }
            
            if (analyticsData.country_sales && typeof analyticsData.country_sales !== 'string') {
                analyticsData.country_sales = JSON.stringify(analyticsData.country_sales);
            }

            const updatedAnalytics = {
                ...latestAnalytics,
                ...analyticsData,
            };

            return this.analyticsRepository.save(updatedAnalytics);
        } catch (error) {
            this.logger.error('Error updating analytics data', error);
            throw new Error('Failed to update analytics data');
        }
    }
} 