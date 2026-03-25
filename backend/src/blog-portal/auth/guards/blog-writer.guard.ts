import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
} from '@nestjs/common';
import { BlogUser } from '../../schemas/blog-user.schema';

/**
 * BlogWriterGuard - Protects routes requiring writer status
 *
 * Must be used AFTER BlogAuthGuard to ensure blogUser is attached to request.
 * Checks if the authenticated blog user has isWriter = true.
 */
@Injectable()
export class BlogWriterGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const blogUser: BlogUser = request.blogUser;

    if (!blogUser) {
      throw new ForbiddenException('Blog user not found in request');
    }

    if (!blogUser.isWriter) {
      throw new ForbiddenException('Writer access required');
    }

    return true;
  }
}
