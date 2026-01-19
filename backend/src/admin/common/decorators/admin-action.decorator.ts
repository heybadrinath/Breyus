import { SetMetadata } from '@nestjs/common';

export interface AdminActionMetadata {
  action: string;
  category: string;
  description?: string;
}

export const ADMIN_ACTION_KEY = 'adminAction';

/**
 * Decorator to mark an endpoint for automatic activity logging
 *
 * Usage:
 * @AdminAction({ action: 'user.suspend', category: 'users' })
 * @Post(':id/suspend')
 * async suspendUser(...) { ... }
 */
export const AdminAction = (metadata: AdminActionMetadata) =>
  SetMetadata(ADMIN_ACTION_KEY, metadata);
