import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
} from '@nestjs/common';
import { BlogUser } from '../../schemas/blog-user.schema';

/**
 * BlogMemberGuard - Protects routes requiring Breyus member status
 *
 * Must be used AFTER BlogAuthGuard to ensure blogUser is attached to request.
 * Checks if the authenticated blog user has isBrèyusMember = true.
 *
 * Used for member-only blog content access.
 */
@Injectable()
export class BlogMemberGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const blogUser: BlogUser = request.blogUser;

    if (!blogUser) {
      throw new ForbiddenException('Blog user not found in request');
    }

    if (!blogUser.isBrèyusMember) {
      throw new ForbiddenException(
        'Breyus membership required to access this content',
      );
    }

    return true;
  }
}
