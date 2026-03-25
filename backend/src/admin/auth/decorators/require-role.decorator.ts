import { SetMetadata } from '@nestjs/common';
import { AdminRole } from '../schemas/admin-user.schema';

/**
 * SECURITY FIX: Role-Based Access Control decorator for Admin endpoints (Audit Bug - IDOR)
 *
 * Usage:
 *   @RequireRole('super_admin')                    // Only super_admin
 *   @RequireRole('super_admin', 'admin')           // super_admin OR admin
 *   @RequireRole('super_admin', 'admin', 'viewer') // Any authenticated admin
 *
 * Permission Matrix:
 * | Action              | super_admin | admin | viewer |
 * |---------------------|-------------|-------|--------|
 * | View data           | Yes         | Yes   | Yes    |
 * | Suspend/Update      | Yes         | Yes   | No     |
 * | Delete permanently  | Yes         | No    | No     |
 * | Create admin users  | Yes         | No    | No     |
 */
export const ROLES_KEY = 'roles';

export const RequireRole = (...roles: AdminRole[]) =>
  SetMetadata(ROLES_KEY, roles);

// Convenience decorators for common role patterns
export const SuperAdminOnly = () => RequireRole('super_admin');
export const AdminOrAbove = () => RequireRole('super_admin', 'admin');
export const AnyAdmin = () => RequireRole('super_admin', 'admin', 'viewer');
