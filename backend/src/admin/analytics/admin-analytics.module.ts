import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AdminAnalyticsController } from './admin-analytics.controller';
import { AdminAnalyticsService } from './admin-analytics.service';
import { ExportService } from './export/export.service';
import { Trade, TradeSchema } from '../../trade/schema/trade.schema';
import { Product, ProductSchema } from '../../products/schema/products.schema';
import { Company, CompanySchema } from '../../company/company.schema';
import { User, UserSchema } from '../../users/user.schema';
import { CacheModule } from '../../common/cache/cache.module';
import { AdminAuthModule } from '../auth/admin-auth.module';
import { ActivityLogModule } from '../activity/activity-log.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Trade.name, schema: TradeSchema },
      { name: Product.name, schema: ProductSchema },
      { name: Company.name, schema: CompanySchema },
      { name: User.name, schema: UserSchema },
    ]),
    CacheModule,
    AdminAuthModule,
    ActivityLogModule,
  ],
  controllers: [AdminAnalyticsController],
  providers: [AdminAnalyticsService, ExportService],
  exports: [AdminAnalyticsService],
})
export class AdminAnalyticsModule {}
