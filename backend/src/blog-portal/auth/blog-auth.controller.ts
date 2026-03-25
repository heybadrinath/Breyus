import {
  Controller,
  Post,
  Get,
  Body,
  Res,
  Req,
  UseGuards,
  HttpCode,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response, Request } from 'express';
import * as jwt from 'jsonwebtoken';
import { BlogAuthService } from './blog-auth.service';
import { BlogAuthGuard } from './guards/blog-auth.guard';
import { BlogUserDecorator } from './decorators/blog-user.decorator';
import { BlogUser } from '../schemas/blog-user.schema';
import { BlogSession } from '../schemas/blog-session.schema';
import {
  BlogSignupDto,
  BreyusMemberOtpRequestDto,
  BreyusMemberOtpVerifyDto,
} from './dto/blog-signup.dto';
import {
  BlogLoginDto,
  BlogForgotPasswordDto,
  BlogResetPasswordDto,
  BlogChangePasswordDto,
} from './dto/blog-login.dto';
import { DeviceInfo } from '../schemas/blog-session.schema';

/**
 * BlogAuthController - Blog Portal Authentication Endpoints
 *
 * Routes:
 * - POST /blog-portal/auth/signup - Blog-only user signup
 * - POST /blog-portal/auth/login - Blog-only user login
 * - POST /blog-portal/auth/breyus/request-otp - Breyus member OTP request
 * - POST /blog-portal/auth/breyus/verify-otp - Breyus member OTP verification
 * - GET /blog-portal/auth/me - Get current user
 * - POST /blog-portal/auth/logout - Logout
 * - POST /blog-portal/auth/forgot-password - Request password reset
 * - POST /blog-portal/auth/reset-password - Reset password with OTP
 * - POST /blog-portal/auth/change-password - Change password (authenticated)
 * - POST /blog-portal/auth/check-email - Check if email is Breyus member
 * - GET /blog-portal/auth/check-session - Check for active Breyus session (SSO)
 * - POST /blog-portal/auth/sso-login - Login using active Breyus session
 */
@Controller('blog-portal/auth')
export class BlogAuthController {
  private readonly logger = new Logger(BlogAuthController.name);
  private readonly COOKIE_NAME = 'blog_session';
  private readonly COOKIE_MAX_AGE = 30 * 24 * 60 * 60 * 1000; // 30 days

  constructor(private readonly blogAuthService: BlogAuthService) {}

  /**
   * Blog-only user signup
   */
  @Post('signup')
  async signup(
    @Body() dto: BlogSignupDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { user, token } = await this.blogAuthService.signup(dto);
    this.setSessionCookie(res, token);
    return this.formatUserResponse(user, 'Signup successful');
  }

  /**
   * Blog-only user login
   */
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() dto: BlogLoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const deviceInfo = this.extractDeviceInfo(req);
    const ipAddress = this.extractIpAddress(req);
    const { user, token } = await this.blogAuthService.login(
      dto,
      deviceInfo,
      ipAddress,
    );
    this.setSessionCookie(res, token);
    return this.formatUserResponse(user, 'Login successful');
  }

  /**
   * Breyus member OTP request
   */
  @Post('breyus/request-otp')
  @HttpCode(HttpStatus.OK)
  async requestBreyusMemberOtp(@Body() dto: BreyusMemberOtpRequestDto) {
    return this.blogAuthService.requestBreyusMemberOtp(dto);
  }

  /**
   * Breyus member OTP verification
   */
  @Post('breyus/verify-otp')
  @HttpCode(HttpStatus.OK)
  async verifyBreyusMemberOtp(
    @Body() dto: BreyusMemberOtpVerifyDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const deviceInfo = this.extractDeviceInfo(req);
    const ipAddress = this.extractIpAddress(req);
    const { user, token, isNewUser } =
      await this.blogAuthService.verifyBreyusMemberOtp(
        dto,
        deviceInfo,
        ipAddress,
      );
    this.setSessionCookie(res, token);
    return {
      statusCode: HttpStatus.OK,
      message: isNewUser ? 'Welcome to Breyus Blog!' : 'Login successful',
      data: {
        user: this.sanitizeUser(user),
        isNewUser,
      },
    };
  }

  /**
   * Get current user
   */
  @Get('me')
  @UseGuards(BlogAuthGuard)
  async getCurrentUser(@BlogUserDecorator() user: BlogUser) {
    const currentUser = await this.blogAuthService.getCurrentUser(user);
    return this.formatUserResponse(currentUser);
  }

  /**
   * Logout
   */
  @Post('logout')
  @UseGuards(BlogAuthGuard)
  @HttpCode(HttpStatus.OK)
  async logout(
    @Req() req: Request & { blogSession: BlogSession },
    @Res({ passthrough: true }) res: Response,
  ) {
    await this.blogAuthService.logout(req.blogSession._id);
    this.clearSessionCookie(res);
    return {
      statusCode: HttpStatus.OK,
      message: 'Logged out successfully',
    };
  }

  /**
   * Forgot password - request OTP
   */
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  async forgotPassword(@Body() dto: BlogForgotPasswordDto) {
    return this.blogAuthService.forgotPassword(dto);
  }

  /**
   * Reset password with OTP
   */
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  async resetPassword(@Body() dto: BlogResetPasswordDto) {
    return this.blogAuthService.resetPassword(dto);
  }

  /**
   * Change password (authenticated)
   */
  @Post('change-password')
  @UseGuards(BlogAuthGuard)
  @HttpCode(HttpStatus.OK)
  async changePassword(
    @BlogUserDecorator() user: BlogUser,
    @Body() dto: BlogChangePasswordDto,
  ) {
    return this.blogAuthService.changePassword(user, dto);
  }

  /**
   * Check if email is Breyus member
   */
  @Post('check-email')
  @HttpCode(HttpStatus.OK)
  async checkEmail(@Body('email') email: string) {
    return this.blogAuthService.checkBreyusEmail(email);
  }

  /**
   * Check for active Breyus session (SSO)
   * Reads the main platform's 'account' cookie to check for active session
   */
  @Get('check-session')
  async checkBreyusSession(@Req() req: Request) {
    const breyusToken = req.signedCookies?.['account'];

    if (!breyusToken) {
      return {
        statusCode: HttpStatus.OK,
        data: { hasSession: false },
      };
    }

    try {
      // Validate the Breyus JWT token
      const secretKey = process.env.JWT_SECRET_KEY;
      if (!secretKey) {
        this.logger.error('JWT_SECRET_KEY not defined');
        return {
          statusCode: HttpStatus.OK,
          data: { hasSession: false },
        };
      }

      const decoded = jwt.verify(breyusToken, secretKey) as {
        userId: string;
        companyId?: string;
      };

      if (!decoded?.userId) {
        return {
          statusCode: HttpStatus.OK,
          data: { hasSession: false },
        };
      }

      // Get profile info from Breyus user
      const result = await this.blogAuthService.checkBreyusSession(
        decoded.userId,
      );

      return {
        statusCode: HttpStatus.OK,
        data: result,
      };
    } catch (error) {
      this.logger.debug('Invalid or expired Breyus session token');
      return {
        statusCode: HttpStatus.OK,
        data: { hasSession: false },
      };
    }
  }

  /**
   * SSO Login - Login using active Breyus session (no OTP required)
   * User must confirm their identity via "Yes, that's me" button
   */
  @Post('sso-login')
  @HttpCode(HttpStatus.OK)
  async ssoLogin(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const breyusToken = req.signedCookies?.['account'];

    if (!breyusToken) {
      return {
        statusCode: HttpStatus.UNAUTHORIZED,
        message: 'No active Breyus session found',
      };
    }

    try {
      // Validate the Breyus JWT token
      const secretKey = process.env.JWT_SECRET_KEY;
      if (!secretKey) {
        throw new Error('JWT_SECRET_KEY not defined');
      }

      const decoded = jwt.verify(breyusToken, secretKey) as {
        userId: string;
        companyId?: string;
      };

      if (!decoded?.userId) {
        return {
          statusCode: HttpStatus.UNAUTHORIZED,
          message: 'Invalid Breyus session',
        };
      }

      const deviceInfo = this.extractDeviceInfo(req);
      const ipAddress = this.extractIpAddress(req);

      // Perform SSO login
      const { user, token, isNewUser } = await this.blogAuthService.ssoLogin(
        decoded.userId,
        deviceInfo,
        ipAddress,
      );

      // Set blog session cookie
      this.setSessionCookie(res, token);

      return {
        statusCode: HttpStatus.OK,
        message: isNewUser ? 'Welcome to Breyus Blog!' : 'Login successful',
        data: {
          user: this.sanitizeUser(user),
          isNewUser,
        },
      };
    } catch (error: any) {
      this.logger.error('SSO login failed:', error.message);
      return {
        statusCode: HttpStatus.UNAUTHORIZED,
        message: error.message || 'SSO login failed',
      };
    }
  }

  // ─────────────────────────────────────────────────────────────
  // Helper Methods
  // ─────────────────────────────────────────────────────────────

  private setSessionCookie(res: Response, token: string): void {
    res.cookie(this.COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: this.COOKIE_MAX_AGE,
      path: '/',
    });
  }

  private clearSessionCookie(res: Response): void {
    res.clearCookie(this.COOKIE_NAME, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    });
  }

  private extractDeviceInfo(req: Request): DeviceInfo {
    const userAgent = req.headers['user-agent'] || '';
    return {
      browser: this.parseBrowser(userAgent),
      os: this.parseOS(userAgent),
      device: this.parseDevice(userAgent),
    };
  }

  private extractIpAddress(req: Request): string {
    const forwardedFor = req.headers['x-forwarded-for'];
    if (forwardedFor) {
      return Array.isArray(forwardedFor)
        ? forwardedFor[0]
        : forwardedFor.split(',')[0].trim();
    }
    return req.ip || req.socket?.remoteAddress || '';
  }

  private parseBrowser(userAgent: string): string {
    if (userAgent.includes('Chrome')) return 'Chrome';
    if (userAgent.includes('Firefox')) return 'Firefox';
    if (userAgent.includes('Safari')) return 'Safari';
    if (userAgent.includes('Edge')) return 'Edge';
    return 'Unknown';
  }

  private parseOS(userAgent: string): string {
    if (userAgent.includes('Windows')) return 'Windows';
    if (userAgent.includes('Mac')) return 'macOS';
    if (userAgent.includes('Linux')) return 'Linux';
    if (userAgent.includes('Android')) return 'Android';
    if (userAgent.includes('iOS')) return 'iOS';
    return 'Unknown';
  }

  private parseDevice(userAgent: string): string {
    if (userAgent.includes('Mobile')) return 'Mobile';
    if (userAgent.includes('Tablet')) return 'Tablet';
    return 'Desktop';
  }

  private sanitizeUser(user: BlogUser): Partial<BlogUser> {
    return {
      _id: user._id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      companyName: user.companyName,
      isBrèyusMember: user.isBrèyusMember,
      isWriter: user.isWriter,
      writerBio: user.writerBio,
      writerAvatar: user.writerAvatar,
      writerBanner: user.writerBanner,
    };
  }

  private formatUserResponse(user: BlogUser, message?: string) {
    return {
      statusCode: HttpStatus.OK,
      message: message || 'Success',
      data: {
        user: this.sanitizeUser(user),
      },
    };
  }
}
