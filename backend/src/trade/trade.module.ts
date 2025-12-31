import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TradeService } from './trade.service';
import { TradeController } from './trade.controller';
import { InvoiceService } from './invoice.service';
import { TradeGateway } from './trade.gateway';
import { TradeNotificationService } from './trade-notification.service';
import { AuditService } from './audit.service';
import { Trade, TradeSchema } from './schema/trade.schema';
import { AuditLog, AuditLogSchema } from './schema/audit-log.schema';
import { Product, ProductSchema } from '../products/schema/products.schema';
import { AuthModule } from '../auth/auth.module';
import { MailModule } from '../mail/mail.module';
import { UsersModule } from '../users/users.module';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Trade.name, schema: TradeSchema },
      { name: Product.name, schema: ProductSchema },
      { name: AuditLog.name, schema: AuditLogSchema }
    ]),
    AuthModule,
    MailModule,
    forwardRef(() => UsersModule),
    NotificationModule,
  ],
  providers: [TradeService, InvoiceService, TradeGateway, TradeNotificationService, AuditService],
  controllers: [TradeController],
  exports: [TradeService, TradeGateway, TradeNotificationService, AuditService]
})
export class TradeModule {}
