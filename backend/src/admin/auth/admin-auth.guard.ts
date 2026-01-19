import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { AdminAuthService } from './admin-auth.service';

@Injectable()
export class AdminAuthGuard implements CanActivate {
  constructor(private readonly adminAuthService: AdminAuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    // Get token from signed cookie
    const token = request.signedCookies?.['admin_session'];

    if (!token) {
      throw new UnauthorizedException('Not authenticated');
    }

    try {
      // Validate token and get admin
      const admin = await this.adminAuthService.validateToken(token);

      // Attach admin to request for use in controllers
      request.admin = admin;

      return true;
    } catch (error) {
      throw new UnauthorizedException(error.message || 'Invalid session');
    }
  }
}
