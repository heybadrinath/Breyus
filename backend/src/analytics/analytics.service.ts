import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Raw } from 'typeorm';
import { StoreVisit } from './entities/store-visit.entity';
import { AnalyticsSale } from './entities/sale.entity';
import { Task } from './entities/task.entity';
import { format, subDays, eachDayOfInterval } from 'date-fns';

interface DailyStoreVisit {
    date: string;
    dayName: string;
    visits: number;
}

interface DailySale {
    date: string;
    time: string;
    amount: number;
    productName?: string;
}

interface TaskStatusDistribution {
    status: string;
    count: number;
    percentage: number;
}

@Injectable()
export class AnalyticsService {
    private readonly logger = new Logger(AnalyticsService.name);

    constructor(
        @InjectRepository(StoreVisit)
        private storeVisitRepository: Repository<StoreVisit>,
        @InjectRepository(AnalyticsSale)
        private saleRepository: Repository<AnalyticsSale>,
        @InjectRepository(Task)
        private taskRepository: Repository<Task>,
    ) {}

    async getDailyStoreVisits(seller_id: string, days: number = 30): Promise<DailyStoreVisit[]> {
        this.logger.log(`Fetching daily store visits for seller ${seller_id} for the last ${days} days`);
        const endDate = new Date();
        const startDate = subDays(endDate, days - 1);

        const dateInterval = eachDayOfInterval({ start: startDate, end: endDate });
        const dateMap = new Map<string, DailyStoreVisit>();
        dateInterval.forEach(date => {
            const formattedDate = format(date, 'yyyy-MM-dd');
            dateMap.set(formattedDate, {
                date: formattedDate,
                dayName: format(date, 'EEE'),
                visits: 0,
            });
        });

        const visits = await this.storeVisitRepository.find({
            where: {
                seller_id,
                visit_date: Raw(alias => `${alias} >= :startDate AND ${alias} <= :endDate`, { 
                    startDate: format(startDate, 'yyyy-MM-dd'), 
                    endDate: format(endDate, 'yyyy-MM-dd') 
                }),
            },
            order: { visit_date: 'ASC' },
        });

        visits.forEach(visit => {
            const formattedDate = visit.visit_date;
            const entry = dateMap.get(formattedDate);
            if (entry) {
                entry.visits += visit.visitor_count;
            }
        });
            
        return Array.from(dateMap.values());
    }

    async getDailySales(seller_id: string, days: number = 30): Promise<DailySale[]> {
        this.logger.log(`Fetching daily sales data for seller ${seller_id} for the last ${days} days`);
        const endDate = new Date();
        const startDate = subDays(endDate, days - 1);

        const sales = await this.saleRepository.find({
            where: {
                seller_id,
                sale_date: Raw(alias => `${alias} >= :startDate AND ${alias} <= :endDate`, { 
                    startDate: format(startDate, 'yyyy-MM-dd'), 
                    endDate: format(endDate, 'yyyy-MM-dd') 
                }),
            },
            order: { sale_date: 'ASC', sale_time: 'ASC' },
        });

        return sales.map(sale => ({
            date: sale.sale_date,
            time: sale.sale_time,
            amount: sale.amount,
            productName: sale.product_name,
        }));
    }

    async getTasksStatusDistribution(seller_id: string): Promise<TaskStatusDistribution[]> {
        this.logger.log(`Fetching tasks status distribution for seller ${seller_id}`);
        const statuses = ['completed', 'pending', 'in_progress', 'cancelled'];
        const distribution: TaskStatusDistribution[] = [];

        const totalTasksResult = await this.taskRepository
            .createQueryBuilder("task")
            .select("COUNT(task.id)", "total")
            .where("task.seller_id = :seller_id", { seller_id })
            .getRawOne<{ total?: string }>();

        const totalTasks = parseInt(totalTasksResult?.total ?? '0', 10);

        if (totalTasks === 0) {
            return statuses.map(status => ({ status, count: 0, percentage: 0 }));
        }

        for (const status of statuses) {
            const result = await this.taskRepository
                .createQueryBuilder("task")
                .select("COUNT(task.id)", "count")
                .where("task.status = :status", { status })
                .andWhere("task.seller_id = :seller_id", { seller_id })
                .getRawOne<{ count?: string }>();
            
            const count = parseInt(result?.count ?? '0', 10);
            distribution.push({
                status,
                count,
                percentage: parseFloat(((count / totalTasks) * 100).toFixed(2)),
            });
        }

        return distribution;
    }

    async getDashboardAnalytics(seller_id: string, days: number = 30): Promise<{
        dailyVisits: DailyStoreVisit[];
        dailySales: DailySale[];
        tasksDistribution: TaskStatusDistribution[];
    }> {
        this.logger.log(`Fetching combined dashboard analytics for seller ${seller_id} for the last ${days} days`);
        const [dailyVisits, dailySales, tasksDistribution] = await Promise.all([
            this.getDailyStoreVisits(seller_id, days),
            this.getDailySales(seller_id, days),
            this.getTasksStatusDistribution(seller_id),
        ]);

        return {
            dailyVisits,
            dailySales,
            tasksDistribution,
        };
    }
} 