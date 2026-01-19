import {
  Controller,
  Post,
  Get,
  Body,
  Res,
  HttpStatus,
  HttpException,
} from '@nestjs/common';
import { Response } from 'express';
import { AdminAuthService } from './admin-auth.service';
import { AdminLoginDto } from './dto/admin-login.dto';
import { AdminChangePasswordDto } from './dto/admin-change-password.dto';
import { ActivityLogService } from '../activity/activity-log.service';

// Cookie configuration
const getCookieOptions = (): {
  httpOnly: boolean;
  secure: boolean;
  signed: boolean;
  sameSite: 'strict' | 'lax' | 'none';
  maxAge: number;
  path: string;
} => {
  const isProduction = process.env.NODE_ENV === 'production';
  const cookieSecure = process.env.COOKIE_SECURE === 'true' || isProduction;

  return {
    httpOnly: true,
    secure: cookieSecure,
    signed: true,
    sameSite: isProduction ? 'strict' : 'lax',
    maxAge: Number(process.env.ADMIN_SESSION_EXPIRY) || 24 * 60 * 60 * 1000, // 24 hours
    path: '/',
  };
};

@Controller('admin/auth')
export class AdminAuthController {
  constructor(
    private readonly adminAuthService: AdminAuthService,
    private readonly activityLogService: ActivityLogService,
  ) {}

  /**
   * POST /admin/auth/login
   * Authenticate admin with email/password
   */
  @Post('login')
  async login(
    @Body() loginDto: AdminLoginDto,
    @Res() response: Response,
  ) {
    try {
      const ipAddress = response.req.ip || response.req.socket.remoteAddress || 'unknown';
      const userAgent = response.req.headers['user-agent'] || 'unknown';

      const { admin, token } = await this.adminAuthService.login(
        loginDto.email,
        loginDto.password,
        ipAddress,
        userAgent,
      );

      // Set session cookie
      response.cookie('admin_session', token, getCookieOptions());

      // Log the login activity
      await this.activityLogService.log({
        adminId: admin._id as any,
        adminEmail: admin.email!,
        action: 'auth.login',
        actionCategory: 'auth',
        description: `Admin logged in from ${ipAddress}`,
        metadata: { ipAddress, userAgent },
      });

      return response.status(HttpStatus.OK).json({
        statusCode: HttpStatus.OK,
        message: 'Login successful',
        data: { admin },
      });
    } catch (error) {
      return response.status(error.status || HttpStatus.INTERNAL_SERVER_ERROR).json({
        statusCode: error.status || HttpStatus.INTERNAL_SERVER_ERROR,
        message: error.message || 'Login failed',
      });
    }
  }

  /**
   * POST /admin/auth/logout
   * Clear admin session
   */
  @Post('logout')
  async logout(@Res() response: Response) {
    try {
      const token = response.req.signedCookies['admin_session'];

      if (token) {
        // Get admin info before logout for logging
        try {
          const admin = await this.adminAuthService.getMe(token);
          await this.adminAuthService.logout(token);

          // Log the logout activity
          await this.activityLogService.log({
            adminId: admin._id as any,
            adminEmail: admin.email!,
            action: 'auth.logout',
            actionCategory: 'auth',
            description: 'Admin logged out',
            metadata: {
              ipAddress: response.req.ip || 'unknown',
              userAgent: response.req.headers['user-agent'] || 'unknown',
            },
          });
        } catch {
          // Token already invalid, just clear cookie
        }
      }

      // Clear the session cookie
      response.clearCookie('admin_session', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        signed: true,
        path: '/',
      });

      return response.status(HttpStatus.OK).json({
        statusCode: HttpStatus.OK,
        message: 'Logged out successfully',
      });
    } catch (error) {
      return response.status(error.status || HttpStatus.INTERNAL_SERVER_ERROR).json({
        statusCode: error.status || HttpStatus.INTERNAL_SERVER_ERROR,
        message: error.message || 'Logout failed',
      });
    }
  }

  /**
   * GET /admin/auth/me
   * Get current admin info
   */
  @Get('me')
  async getMe(@Res() response: Response) {
    try {
      const token = response.req.signedCookies['admin_session'];

      if (!token) {
        return response.status(HttpStatus.UNAUTHORIZED).json({
          statusCode: HttpStatus.UNAUTHORIZED,
          message: 'Not authenticated',
          valid: false,
        });
      }

      const admin = await this.adminAuthService.getMe(token);

      return response.status(HttpStatus.OK).json({
        statusCode: HttpStatus.OK,
        message: 'Success',
        data: admin,
        valid: true,
      });
    } catch (error) {
      return response.status(HttpStatus.UNAUTHORIZED).json({
        statusCode: HttpStatus.UNAUTHORIZED,
        message: error.message || 'Not authenticated',
        valid: false,
      });
    }
  }

  /**
   * POST /admin/auth/change-password
   * Change admin password
   */
  @Post('change-password')
  async changePassword(
    @Body() changePasswordDto: AdminChangePasswordDto,
    @Res() response: Response,
  ) {
    try {
      const token = response.req.signedCookies['admin_session'];

      if (!token) {
        return response.status(HttpStatus.UNAUTHORIZED).json({
          statusCode: HttpStatus.UNAUTHORIZED,
          message: 'Not authenticated',
        });
      }

      const admin = await this.adminAuthService.getMe(token);

      await this.adminAuthService.changePassword(
        token,
        changePasswordDto.currentPassword,
        changePasswordDto.newPassword,
      );

      // Log the password change
      await this.activityLogService.log({
        adminId: admin._id as any,
        adminEmail: admin.email!,
        action: 'auth.change_password',
        actionCategory: 'auth',
        description: 'Admin changed password',
        metadata: {
          ipAddress: response.req.ip || 'unknown',
          userAgent: response.req.headers['user-agent'] || 'unknown',
        },
      });

      return response.status(HttpStatus.OK).json({
        statusCode: HttpStatus.OK,
        message: 'Password changed successfully',
      });
    } catch (error) {
      return response.status(error.status || HttpStatus.INTERNAL_SERVER_ERROR).json({
        statusCode: error.status || HttpStatus.INTERNAL_SERVER_ERROR,
        message: error.message || 'Failed to change password',
      });
    }
  }

  /**
   * GET /admin/auth/sessions
   * Get all active sessions for current admin
   */
  @Get('sessions')
  async getSessions(@Res() response: Response) {
    try {
      const token = response.req.signedCookies['admin_session'];

      if (!token) {
        return response.status(HttpStatus.UNAUTHORIZED).json({
          statusCode: HttpStatus.UNAUTHORIZED,
          message: 'Not authenticated',
        });
      }

      const admin = await this.adminAuthService.validateToken(token);
      const sessions = await this.adminAuthService.getSessions(admin._id as any);

      return response.status(HttpStatus.OK).json({
        statusCode: HttpStatus.OK,
        message: 'Success',
        data: sessions,
      });
    } catch (error) {
      return response.status(error.status || HttpStatus.INTERNAL_SERVER_ERROR).json({
        statusCode: error.status || HttpStatus.INTERNAL_SERVER_ERROR,
        message: error.message || 'Failed to get sessions',
      });
    }
  }

  /**
   * POST /admin/auth/sessions/revoke-all
   * Revoke all other sessions (logout from all other devices)
   */
  @Post('sessions/revoke-all')
  async revokeAllSessions(@Res() response: Response) {
    try {
      const token = response.req.signedCookies['admin_session'];

      if (!token) {
        return response.status(HttpStatus.UNAUTHORIZED).json({
          statusCode: HttpStatus.UNAUTHORIZED,
          message: 'Not authenticated',
        });
      }

      const admin = await this.adminAuthService.getMe(token);
      await this.adminAuthService.revokeAllOtherSessions(token);

      // Log the session revocation
      await this.activityLogService.log({
        adminId: admin._id as any,
        adminEmail: admin.email!,
        action: 'auth.revoke_sessions',
        actionCategory: 'auth',
        description: 'Admin revoked all other sessions',
        metadata: {
          ipAddress: response.req.ip || 'unknown',
          userAgent: response.req.headers['user-agent'] || 'unknown',
        },
      });

      return response.status(HttpStatus.OK).json({
        statusCode: HttpStatus.OK,
        message: 'All other sessions revoked',
      });
    } catch (error) {
      return response.status(error.status || HttpStatus.INTERNAL_SERVER_ERROR).json({
        statusCode: error.status || HttpStatus.INTERNAL_SERVER_ERROR,
        message: error.message || 'Failed to revoke sessions',
      });
    }
  }
}
