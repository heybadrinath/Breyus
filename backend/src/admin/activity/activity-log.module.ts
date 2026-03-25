import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ActivityLogService } from './activity-log.service';
import { ActivityLogController } from './activity-log.controller';
import {
  AdminActivityLog,
  AdminActivityLogSchema,
} from './schemas/admin-activity-log.schema';
import { AdminAuthModule } from '../auth/admin-auth.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: AdminActivityLog.name, schema: AdminActivityLogSchema },
    ]),
    forwardRef(() => AdminAuthModule),
  ],
  controllers: [ActivityLogController],
  providers: [ActivityLogService],
  exports: [ActivityLogService],
})
export class ActivityLogModule {}
