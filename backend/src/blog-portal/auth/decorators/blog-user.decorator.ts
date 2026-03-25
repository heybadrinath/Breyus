import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { BlogUser } from '../../schemas/blog-user.schema';

/**
 * @BlogUserDecorator - Extracts the blog user from the request
 *
 * Use this decorator in controllers protected by BlogAuthGuard to get the
 * authenticated blog user.
 *
 * @example
 * @Get('profile')
 * @UseGuards(BlogAuthGuard)
 * getProfile(@BlogUserDecorator() user: BlogUser) {
 *   return user;
 * }
 */
export const BlogUserDecorator = createParamDecorator(
  (data: keyof BlogUser | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user: BlogUser = request.blogUser;

    if (!user) {
      return null;
    }

    // If a specific property is requested, return just that property
    if (data) {
      return user[data];
    }

    return user;
  },
);

/**
 * @OptionalBlogUser - Same as BlogUserDecorator but for optional auth routes
 *
 * Used in routes where authentication is optional (e.g., public posts that
 * may show additional features for logged-in users).
 */
export const OptionalBlogUser = createParamDecorator(
  (data: keyof BlogUser | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user: BlogUser | undefined = request.blogUser;

    if (!user) {
      return null;
    }

    if (data) {
      return user[data];
    }

    return user;
  },
);
