import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AdminTradesController } from './admin-trades.controller';
import { AdminTradesService } from './admin-trades.service';
import { Trade, TradeSchema } from '../../trade/schema/trade.schema';
import { User, UserSchema } from '../../users/user.schema';
import { Product, ProductSchema } from '../../products/schema/products.schema';
import { AdminAuthModule } from '../auth/admin-auth.module';
import { ActivityLogModule } from '../activity/activity-log.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Trade.name, schema: TradeSchema },
      { name: User.name, schema: UserSchema },
      { name: Product.name, schema: ProductSchema },
    ]),
    forwardRef(() => AdminAuthModule),
    forwardRef(() => ActivityLogModule),
  ],
  controllers: [AdminTradesController],
  providers: [AdminTradesService],
  exports: [AdminTradesService],
})
export class AdminTradesModule {}
