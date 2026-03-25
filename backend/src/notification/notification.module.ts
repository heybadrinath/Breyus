import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from '../auth/auth.module';
import { NotificationController } from './notification.controller';
import { NotificationService } from './notification.service';
import { MiscNotificationService } from './misc-notification.service';
import { Notification, NotificationSchema } from './schema/notification.schema';
import { User, UserSchema } from '../users/user.schema';
import { Company, CompanySchema } from '../company/company.schema';
import { Product, ProductSchema } from '../products/schema/products.schema';
import { Wishlist, WishlistSchema } from '../wishlist/wishlist.schema';
import { MailModule } from '../mail/mail.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Notification.name, schema: NotificationSchema },
      { name: User.name, schema: UserSchema },
      { name: Company.name, schema: CompanySchema },
      { name: Product.name, schema: ProductSchema },
      { name: Wishlist.name, schema: WishlistSchema },
    ]),
    AuthModule,
    forwardRef(() => MailModule),
  ],
  controllers: [NotificationController],
  providers: [NotificationService, MiscNotificationService],
  exports: [NotificationService, MiscNotificationService],
})
export class NotificationModule {}
