import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AdminKycService } from './admin-kyc.service';
import { AdminKycController } from './admin-kyc.controller';
import { Company, CompanySchema } from '../../company/company.schema';
import { User, UserSchema } from '../../users/user.schema';
import { AdminModule } from '../admin.module';
import { MailModule } from '../../mail/mail.module';
import { NotificationModule } from '../../notification/notification.module';
import { ActivityLogModule } from '../activity/activity-log.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Company.name, schema: CompanySchema },
      { name: User.name, schema: UserSchema },
    ]),
    forwardRef(() => AdminModule),
    MailModule,
    NotificationModule,
    ActivityLogModule,
  ],
  controllers: [AdminKycController],
  providers: [AdminKycService],
  exports: [AdminKycService],
})
export class AdminKycModule {}
