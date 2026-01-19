import { Controller, Post, Get, Res, HttpStatus, Body, Inject, forwardRef, UseGuards } from '@nestjs/common';
import { ThrottlerGuard, Throttle, SkipThrottle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { Response } from 'express';
import { InjectModel } from '@nestjs/mongoose';
import { User } from 'src/users/user.schema';
import { Model } from 'mongoose';
import { MailService } from 'src/mail/mail.service';
import { UsersService } from 'src/users/users.service';
import { ForgotPasswordDto, ResetPasswordDto, ChangePasswordDto } from './dto/password-reset.dto';


/**
 * Auth Controller
 * Bug #8 Fix: Rate limiting applied to password reset endpoints
 * - Forgot password: 3 requests per minute (prevent email spam)
 * - Reset password: 3 requests per minute (prevent OTP brute force)
 * - Change password: 5 requests per minute
 */
@Controller('auth')
@UseGuards(ThrottlerGuard)
export class AuthController {
    constructor(
        private readonly authService: AuthService,
        private readonly mailService: MailService,
        @Inject(forwardRef(() => UsersService)) private readonly usersService: UsersService,
        @InjectModel(User.name) private readonly userSchema: Model<User>
    ) { }

    // Skip rate limiting for session validation (called frequently by frontend)
    @Get('validate-cookie')
    @SkipThrottle()
    async validateCookie(@Res() response: Response): Promise<any> {
        const accountToken = response.req.signedCookies['account'];

        if (!accountToken) {
            return response.status(401).send('No valid cookie found');
        }

        try {
            const decodeToken = this.authService.validateAccountToken(accountToken);
            if (!decodeToken) {
                return response.status(401).send('Invalid or expired cookie');
            }
            const userId = (decodeToken as any).userId;
            if (!userId) {
                return response.status(401).send('Invalid or expired cookie');
            }
            const user = await this.userSchema.findById(userId).populate('company', 'role').lean();
            if (!user) {
                return response.status(401).send('User not found');
            }
            // Ensure company is populated and has a role property
            const company = user.company as { role?: string };
            return response.status(200).json({ valid: true, role: company?.role });
        } catch (error) {
            return response.status(401).send('Invalid or expired cookie');
        }
    }

    // Skip rate limiting for user info (called frequently by frontend)
    @Get('me')
    @SkipThrottle()
    async getMe(@Res() response: Response): Promise<any> {
        const accountToken = response.req.signedCookies['account'];
        if (!accountToken) {
            return response.status(401).send({ message: 'No valid cookie found' });
        }
        try {
            const decodeToken = this.authService.validateAccountToken(accountToken);
            if (!decodeToken) {
                return response.status(401).send({ message: 'Invalid or expired cookie' });
            }
            const userId = (decodeToken as any).userId;
            const companyId = (decodeToken as any).companyId;
            if (!userId || !companyId) {
                return response.status(401).send({ message: 'Invalid token structure' });
            }
            // Return BOTH userId and companyId for WebSocket and other uses
            return response.status(200).json({ userId, companyId });
        } catch (error) {
            return response.status(401).send({ message: 'Invalid or expired cookie' });
        }
    }

    @Post('logout')
    async logout(@Res() response: Response): Promise<any> {
        try {
            // Clear the account cookie with the same settings it was set with
            const cookieSecure = process.env.COOKIE_SECURE === 'true'
                || process.env.NODE_ENV === 'production';
            const sameSite = cookieSecure
                ? (process.env.NODE_ENV === 'production' ? 'strict' : 'none')
                : 'lax';

            response.clearCookie('account', {
                httpOnly: true,
                signed: true,
                secure: cookieSecure,
                sameSite,
            });
            return response.status(HttpStatus.OK).json({ message: 'Logged out successfully' });
        } catch (error) {
            return response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: 'Logout failed' });
        }
    }

    // Bug #8 Fix: Strict rate limit on forgot-password to prevent email spam
    @Post('forgot-password')
    @Throttle({ default: { limit: 3, ttl: 60000 } })
    async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto, @Res() response: Response): Promise<any> {
        try {
            const { email } = forgotPasswordDto;

            // Find user by email
            const user = await this.usersService.findByEmail(email);
            if (!user) {
                return response.status(HttpStatus.BAD_REQUEST).json({
                    message: 'No account found with this email address.'
                });
            }

            // Generate OTP and store it
            const otp = this.mailService.generateOtp();
            await this.mailService.storeOtp(email, otp);

            // Set password reset token expiry (10 minutes)
            const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
            await this.usersService.setPasswordResetToken((user as any)._id.toString(), otp, expiresAt);

            // Send password reset email
            await this.mailService.sendPasswordResetEmail(email, otp);

            return response.status(HttpStatus.OK).json({
                message: 'Password reset OTP has been sent to your email.'
            });
        } catch (error) {
            console.error('Forgot password error:', error);
            return response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
                message: 'An error occurred while processing your request.'
            });
        }
    }

    // Bug #8 Fix: Strict rate limit on reset-password to prevent OTP brute force
    @Post('reset-password')
    @Throttle({ default: { limit: 3, ttl: 60000 } })
    async resetPassword(@Body() resetPasswordDto: ResetPasswordDto, @Res() response: Response): Promise<any> {
        try {
            const { email, otp, newPassword } = resetPasswordDto;

            // Validate OTP
            const isValidOtp = await this.mailService.validateOtp(email, otp);
            if (!isValidOtp) {
                return response.status(HttpStatus.BAD_REQUEST).json({
                    message: 'Invalid or expired OTP. Please check your code and try again.'
                });
            }

            // Find user by email
            const user = await this.usersService.findByEmail(email);
            if (!user) {
                return response.status(HttpStatus.BAD_REQUEST).json({
                    message: 'Invalid request.'
                });
            }

            // Check if password reset token is still valid
            if (user.passwordResetExpires && new Date() > user.passwordResetExpires) {
                return response.status(HttpStatus.BAD_REQUEST).json({
                    message: 'OTP has expired. Please request a new one.'
                });
            }

            // Update password
            await this.usersService.updatePassword((user as any)._id.toString(), newPassword);

            return response.status(HttpStatus.OK).json({
                success: true,
                message: 'Password reset successfully.'
            });
        } catch (error) {
            console.error('Reset password error:', error);
            return response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
                message: 'An error occurred while resetting your password.'
            });
        }
    }

    // Bug #8 Fix: Rate limit on change-password (slightly higher since user is authenticated)
    @Post('change-password')
    @Throttle({ default: { limit: 5, ttl: 60000 } })
    async changePassword(@Body() changePasswordDto: ChangePasswordDto, @Res() response: Response): Promise<any> {
        try {
            const accountToken = response.req.signedCookies['account'];
            if (!accountToken) {
                return response.status(HttpStatus.UNAUTHORIZED).json({
                    message: 'Authentication required.'
                });
            }

            const decodeToken = this.authService.validateAccountToken(accountToken);
            if (!decodeToken) {
                return response.status(HttpStatus.UNAUTHORIZED).json({
                    message: 'Invalid or expired session.'
                });
            }

            const userId = (decodeToken as any).userId;
            if (!userId) {
                return response.status(HttpStatus.UNAUTHORIZED).json({
                    message: 'Invalid session.'
                });
            }

            const { currentPassword, newPassword } = changePasswordDto;

            // Verify current password
            const isValidPassword = await this.usersService.verifyPassword(userId, currentPassword);
            if (!isValidPassword) {
                return response.status(HttpStatus.BAD_REQUEST).json({
                    message: 'Incorrect current password. Please try again.'
                });
            }

            // Check if new password is same as current
            const isSamePassword = await this.usersService.verifyPassword(userId, newPassword);
            if (isSamePassword) {
                return response.status(HttpStatus.BAD_REQUEST).json({
                    message: 'New password must be different from current password.'
                });
            }

            // Update password
            await this.usersService.updatePassword(userId, newPassword);

            return response.status(HttpStatus.OK).json({
                success: true,
                message: 'Password changed successfully.'
            });
        } catch (error) {
            console.error('Change password error:', error);
            return response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
                message: 'An error occurred while changing your password.'
            });
        }
    }
}
