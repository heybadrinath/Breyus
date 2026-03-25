import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AdminDisputesController } from './admin-disputes.controller';
import { AdminDisputesService } from './admin-disputes.service';
import {
  TradeDispute,
  TradeDisputeSchema,
} from './schemas/trade-dispute.schema';
import { Trade, TradeSchema } from '../../trade/schema/trade.schema';
import { User, UserSchema } from '../../users/user.schema';
import { AdminUser, AdminUserSchema } from '../auth/schemas/admin-user.schema';
import { AdminAuthModule } from '../auth/admin-auth.module';
import { ActivityLogModule } from '../activity/activity-log.module';
import { NotificationModule } from '../../notification/notification.module';
import { MailModule } from '../../mail/mail.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: TradeDispute.name, schema: TradeDisputeSchema },
      { name: Trade.name, schema: TradeSchema },
      { name: User.name, schema: UserSchema },
      { name: AdminUser.name, schema: AdminUserSchema },
    ]),
    forwardRef(() => AdminAuthModule),
    forwardRef(() => ActivityLogModule),
    NotificationModule,
    forwardRef(() => MailModule),
  ],
  controllers: [AdminDisputesController],
  providers: [AdminDisputesService],
  exports: [AdminDisputesService],
})
export class AdminDisputesModule {}
