import { SetMetadata } from '@nestjs/common';

export const ADMIN_ACTION_KEY = 'adminAction';
export const ADMIN_ACTION_CATEGORY_KEY = 'adminActionCategory';

/**
 * Decorator to mark admin actions for activity logging
 * @param action - The action identifier (e.g., 'company.verify', 'user.suspend')
 * @param category - The action category (e.g., 'companies', 'users', 'kyc')
 */
export const AdminAction = (action: string, category: string) => {
  return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    SetMetadata(ADMIN_ACTION_KEY, action)(target, propertyKey, descriptor);
    SetMetadata(ADMIN_ACTION_CATEGORY_KEY, category)(target, propertyKey, descriptor);
    return descriptor;
  };
};
