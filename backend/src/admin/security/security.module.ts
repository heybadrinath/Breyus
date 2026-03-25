import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SecurityService } from './security.service';
import { SecurityController } from './security.controller';
import { BlockedIP, BlockedIPSchema } from './schemas/blocked-ip.schema';
import {
  FailedLoginAttempt,
  FailedLoginAttemptSchema,
} from './schemas/failed-login-attempt.schema';
import { ActivityLogModule } from '../activity/activity-log.module';
import { AdminAuthModule } from '../auth/admin-auth.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: BlockedIP.name, schema: BlockedIPSchema },
      { name: FailedLoginAttempt.name, schema: FailedLoginAttemptSchema },
    ]),
    forwardRef(() => AdminAuthModule),
    ActivityLogModule,
  ],
  controllers: [SecurityController],
  providers: [SecurityService],
  exports: [SecurityService],
})
export class SecurityModule {}
