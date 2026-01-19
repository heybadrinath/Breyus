import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AdminRole } from '../schemas/admin-user.schema';
import { ROLES_KEY } from '../decorators/require-role.decorator';

/**
 * SECURITY FIX: Role-Based Access Control guard for Admin endpoints (Audit Bug - IDOR)
 *
 * This guard checks if the authenticated admin has one of the required roles.
 * Must be used AFTER AdminAuthGuard which attaches the admin object to the request.
 *
 * Usage with controller:
 *   @Controller('admin/users')
 *   @UseGuards(AdminAuthGuard, AdminRolesGuard)
 *   export class AdminUsersController {
 *     @Get()
 *     @RequireRole('super_admin', 'admin', 'viewer')
 *     async list() { ... }
 *
 *     @Delete(':id')
 *     @RequireRole('super_admin')
 *     async delete() { ... }
 *   }
 */
@Injectable()
export class AdminRolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // Get required roles from decorator metadata
    const requiredRoles = this.reflector.getAllAndOverride<AdminRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // If no roles specified, deny access (fail-safe)
    // Endpoints without @RequireRole decorator cannot be accessed
    if (!requiredRoles || requiredRoles.length === 0) {
      throw new ForbiddenException(
        'Access denied: No role permissions defined for this endpoint'
      );
    }

    // Get admin from request (attached by AdminAuthGuard)
    const request = context.switchToHttp().getRequest();
    const admin = request.admin;

    if (!admin) {
      throw new ForbiddenException(
        'Access denied: Admin authentication required'
      );
    }

    // Check if admin has one of the required roles
    const hasRole = requiredRoles.includes(admin.role);

    if (!hasRole) {
      throw new ForbiddenException(
        `Access denied: This action requires one of these roles: ${requiredRoles.join(', ')}`
      );
    }

    return true;
  }
}
