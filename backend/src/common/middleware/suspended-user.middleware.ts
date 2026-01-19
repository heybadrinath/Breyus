import { Injectable, NestMiddleware, HttpStatus } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from '../../users/user.schema';
import { AuthService } from '../../auth/auth.service';

/**
 * Middleware to block suspended users from accessing the API.
 *
 * This middleware checks if the authenticated user has been suspended.
 * If suspended, it clears their session cookie and returns a 403 Forbidden response.
 *
 * Applied to all non-admin routes via AppModule.
 */
@Injectable()
export class SuspendedUserMiddleware implements NestMiddleware {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    private authService: AuthService,
  ) {}

  async use(req: Request, res: Response, next: NextFunction) {
    // Get the account token from signed cookies
    const accountToken = req.signedCookies?.['account'];

    // If no token, user is not authenticated - let other guards handle it
    if (!accountToken) {
      return next();
    }

    try {
      // Validate the token and extract user info
      const decoded = this.authService.validateAccountToken(accountToken) as { userId?: string; companyId?: string };
      const userId = decoded?.userId;

      if (!userId) {
        return next();
      }

      // Check if user is suspended (lean query for performance)
      const user = await this.userModel
        .findById(userId)
        .select('isSuspended')
        .lean()
        .exec();

      if (user?.isSuspended) {
        // Clear the authentication cookie
        res.clearCookie('account', {
          httpOnly: true,
          signed: true,
          sameSite: 'lax',
          secure: process.env.NODE_ENV === 'production',
        });

        return res.status(HttpStatus.FORBIDDEN).json({
          statusCode: HttpStatus.FORBIDDEN,
          message: 'Your account has been suspended. Please contact support for assistance.',
          error: 'AccountSuspended',
        });
      }

      // User is not suspended, continue
      next();
    } catch (error) {
      // Token validation failed - let other middleware/guards handle it
      next();
    }
  }
}
