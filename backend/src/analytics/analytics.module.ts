import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';
import { Trade, TradeSchema } from '../trade/schema/trade.schema';
import { Product, ProductSchema } from '../products/schema/products.schema';
import { Company, CompanySchema } from '../company/company.schema';
import { AuthModule } from '../auth/auth.module';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: Trade.name, schema: TradeSchema },
            { name: Product.name, schema: ProductSchema },
            { name: Company.name, schema: CompanySchema },
        ]),
        AuthModule,
    ],
    controllers: [AnalyticsController],
    providers: [AnalyticsService],
    exports: [AnalyticsService],
})
export class AnalyticsModule {}
