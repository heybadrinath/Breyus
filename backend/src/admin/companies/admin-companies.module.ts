import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AdminCompaniesService } from './admin-companies.service';
import { AdminCompaniesController } from './admin-companies.controller';
import { Company, CompanySchema } from '../../company/company.schema';
import { User, UserSchema } from '../../users/user.schema';
import { Trade, TradeSchema } from '../../trade/schema/trade.schema';
import { Product, ProductSchema } from '../../products/schema/products.schema';
import { Wishlist, WishlistSchema } from '../../wishlist/wishlist.schema';
import { Notification, NotificationSchema } from '../../notification/schema/notification.schema';
import { Conversation, ConversationSchema } from '../../inbox/schemas/conversations.schema';
import { Message, MessageSchema } from '../../inbox/schemas/messages.schema';
import { AdminModule } from '../admin.module';
import { MailModule } from '../../mail/mail.module';
import { NotificationModule } from '../../notification/notification.module';
import { ActivityLogModule } from '../activity/activity-log.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Company.name, schema: CompanySchema },
      { name: User.name, schema: UserSchema },
      { name: Trade.name, schema: TradeSchema },
      { name: Product.name, schema: ProductSchema },
      { name: Wishlist.name, schema: WishlistSchema },
      { name: Notification.name, schema: NotificationSchema },
      { name: Conversation.name, schema: ConversationSchema },
      { name: Message.name, schema: MessageSchema },
    ]),
    forwardRef(() => AdminModule),
    MailModule,
    NotificationModule,
    ActivityLogModule,
  ],
  controllers: [AdminCompaniesController],
  providers: [AdminCompaniesService],
  exports: [AdminCompaniesService],
})
export class AdminCompaniesModule {}
