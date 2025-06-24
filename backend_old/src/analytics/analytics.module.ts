import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';
import { StoreVisit } from './entities/store-visit.entity';
import { AnalyticsSale } from './entities/sale.entity';
import { Task } from './entities/task.entity';

@Module({
    imports: [TypeOrmModule.forFeature([StoreVisit, AnalyticsSale, Task])],
    controllers: [AnalyticsController],
    providers: [AnalyticsService],
    exports: [AnalyticsService]
})
export class AnalyticsModule {} 