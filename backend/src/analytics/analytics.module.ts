import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';
import { ExportService } from './export.service';
import { Trade, TradeSchema } from '../trade/schema/trade.schema';
import { Product, ProductSchema } from '../products/schema/products.schema';
import { Company, CompanySchema } from '../company/company.schema';
import { AuthModule } from '../auth/auth.module';
import { CacheModule } from '../common/cache/cache.module';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: Trade.name, schema: TradeSchema },
            { name: Product.name, schema: ProductSchema },
            { name: Company.name, schema: CompanySchema },
        ]),
        AuthModule,
        CacheModule,
    ],
    controllers: [AnalyticsController],
    providers: [AnalyticsService, ExportService],
    exports: [AnalyticsService],
})
export class AnalyticsModule {}
