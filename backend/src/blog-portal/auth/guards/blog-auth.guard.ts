import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as crypto from 'crypto';
import { BlogSession } from '../../schemas/blog-session.schema';
import { BlogUser } from '../../schemas/blog-user.schema';

/**
 * BlogAuthGuard - Protects routes requiring blog portal authentication
 *
 * Validates the blog session cookie and attaches the blog user to the request.
 * Separate from main Breyus auth to allow independent sessions.
 */
@Injectable()
export class BlogAuthGuard implements CanActivate {
  constructor(
    @InjectModel(BlogSession.name)
    private blogSessionModel: Model<BlogSession>,
    @InjectModel(BlogUser.name)
    private blogUserModel: Model<BlogUser>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = this.extractToken(request);

    if (!token) {
      throw new UnauthorizedException('Blog session token required');
    }

    // Hash the token to compare with stored hash
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    // Find valid session
    const session = await this.blogSessionModel.findOne({
      tokenHash,
      expiresAt: { $gt: new Date() },
    });

    if (!session) {
      throw new UnauthorizedException('Invalid or expired blog session');
    }

    // Get the blog user
    const blogUser = await this.blogUserModel.findById(session.blogUserId);

    if (!blogUser) {
      throw new UnauthorizedException('Blog user not found');
    }

    // Attach user to request
    request.blogUser = blogUser;
    request.blogSession = session;

    return true;
  }

  private extractToken(request: any): string | null {
    // First try cookie
    const cookieToken = request.cookies?.['blog_session'];
    if (cookieToken) {
      return cookieToken;
    }

    // Fallback to Authorization header
    const authHeader = request.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }

    return null;
  }
}
