import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AlertsController } from './alerts.controller';
import { AlertsService } from './alerts.service';
import { AlertRule, AlertRuleSchema } from './schemas/alert-rule.schema';
import { AlertHistory, AlertHistorySchema } from './schemas/alert-history.schema';
import { AdminAuthModule } from '../auth/admin-auth.module';
import { MailModule } from '../../mail/mail.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: AlertRule.name, schema: AlertRuleSchema },
      { name: AlertHistory.name, schema: AlertHistorySchema },
    ]),
    AdminAuthModule,
    MailModule,
  ],
  controllers: [AlertsController],
  providers: [AlertsService],
  exports: [AlertsService],
})
export class AlertsModule {}
