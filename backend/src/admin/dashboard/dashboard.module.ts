import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { AdminAuthModule } from '../auth/admin-auth.module';
import { ActivityLogModule } from '../activity/activity-log.module';

// Import schemas from existing modules
import { User, UserSchema } from '../../users/user.schema';
import { Company, CompanySchema } from '../../company/company.schema';
import { Trade, TradeSchema } from '../../trade/schema/trade.schema';
import { Product, ProductSchema } from '../../products/schema/products.schema';
import { TradeDispute, TradeDisputeSchema } from '../disputes/schemas/trade-dispute.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Company.name, schema: CompanySchema },
      { name: Trade.name, schema: TradeSchema },
      { name: Product.name, schema: ProductSchema },
      { name: TradeDispute.name, schema: TradeDisputeSchema },
    ]),
    AdminAuthModule,
    ActivityLogModule,
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
  exports: [DashboardService],
})
export class DashboardModule {}
