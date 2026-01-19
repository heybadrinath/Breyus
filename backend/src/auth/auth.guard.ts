import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from '../users/user.schema';
import { Company } from '../company/company.schema';

/**
 * AuthGuard - Cookie-based authentication guard
 * Validates the account cookie and attaches user/company to request
 */
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly authService: AuthService,
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(Company.name) private companyModel: Model<Company>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    // Get signed cookie
    const token = request.signedCookies?.account;

    if (!token) {
      throw new UnauthorizedException('Authentication required');
    }

    try {
      // Validate token and get payload
      const payload = this.authService.validateAccountToken(token) as {
        userId: string;
        companyId: string;
      };

      if (!payload.userId) {
        throw new UnauthorizedException('Invalid token payload');
      }

      // Get user from database
      const user = await this.userModel.findById(payload.userId);
      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      // Check if user is suspended
      if ((user as any).isSuspended) {
        throw new UnauthorizedException('Account suspended');
      }

      // Get company
      const company = await this.companyModel.findById(user.company);

      // Attach user and company to request
      request.user = user;
      request.company = company;

      // Also attach role for convenience
      if (company) {
        request.user.role = company.role;
        request.user.companyId = company._id;
      }

      return true;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException('Invalid or expired authentication');
    }
  }
}
