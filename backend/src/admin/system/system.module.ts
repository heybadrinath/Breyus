import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SystemController } from './system.controller';
import { SystemService } from './system.service';
import { HealthService } from './health.service';
import { ScriptRunnerService } from './script-runner.service';
import {
  MaintenanceConfig,
  MaintenanceConfigSchema,
} from './schemas/maintenance-config.schema';
import { ActivityLogModule } from '../activity/activity-log.module';
import { AdminAuthModule } from '../auth/admin-auth.module';
import { AdminGatewayModule } from '../gateway/admin-gateway.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: MaintenanceConfig.name, schema: MaintenanceConfigSchema },
    ]),
    ActivityLogModule,
    AdminAuthModule,
    forwardRef(() => AdminGatewayModule),
  ],
  controllers: [SystemController],
  providers: [SystemService, HealthService, ScriptRunnerService],
  exports: [SystemService, HealthService, ScriptRunnerService],
})
export class SystemModule {}
