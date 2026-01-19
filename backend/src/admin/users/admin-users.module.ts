import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AdminUsersController } from './admin-users.controller';
import { AdminUsersService } from './admin-users.service';
import { User, UserSchema } from '../../users/user.schema';
import { Company, CompanySchema } from '../../company/company.schema';
import { Trade, TradeSchema } from '../../trade/schema/trade.schema';
import { Product, ProductSchema } from '../../products/schema/products.schema';
import { Wishlist, WishlistSchema } from '../../wishlist/wishlist.schema';
import { Notification, NotificationSchema } from '../../notification/schema/notification.schema';
import { AdminAuthModule } from '../auth/admin-auth.module';
import { ActivityLogModule } from '../activity/activity-log.module';
import { MailModule } from '../../mail/mail.module';
import { NotificationModule } from '../../notification/notification.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Company.name, schema: CompanySchema },
      { name: Trade.name, schema: TradeSchema },
      { name: Product.name, schema: ProductSchema },
      { name: Wishlist.name, schema: WishlistSchema },
      { name: Notification.name, schema: NotificationSchema },
    ]),
    forwardRef(() => AdminAuthModule),
    forwardRef(() => ActivityLogModule),
    MailModule,
    NotificationModule,
  ],
  controllers: [AdminUsersController],
  providers: [AdminUsersService],
  exports: [AdminUsersService],
})
export class AdminUsersModule {}
