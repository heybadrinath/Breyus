import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AdminAuthController } from './admin-auth.controller';
import { AdminAuthService } from './admin-auth.service';
import { AdminAuthGuard } from './admin-auth.guard';
// SECURITY FIX: Import RBAC guard (Audit Bug - IDOR)
import { AdminRolesGuard } from './guards/admin-roles.guard';
import { AdminUser, AdminUserSchema } from './schemas/admin-user.schema';
import {
  AdminSession,
  AdminSessionSchema,
} from './schemas/admin-session.schema';
import { ActivityLogModule } from '../activity/activity-log.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: AdminUser.name, schema: AdminUserSchema },
      { name: AdminSession.name, schema: AdminSessionSchema },
    ]),
    forwardRef(() => ActivityLogModule),
  ],
  controllers: [AdminAuthController],
  // SECURITY FIX: Added AdminRolesGuard for RBAC (Audit Bug - IDOR)
  providers: [AdminAuthService, AdminAuthGuard, AdminRolesGuard],
  exports: [AdminAuthService, AdminAuthGuard, AdminRolesGuard, MongooseModule],
})
export class AdminAuthModule {}
