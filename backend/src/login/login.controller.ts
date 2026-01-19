import { Controller, Post, Body, Res, HttpException, HttpStatus, UseGuards } from '@nestjs/common';
import { ThrottlerGuard, Throttle, SkipThrottle } from '@nestjs/throttler';
import { LoginService } from './login.service';
import { Response } from 'express';
import { loginDto, otpDto } from './login.dto';

/**
 * Login Controller
 * Bug #7 Fix: Rate limiting applied to prevent brute force attacks
 * - Login: 5 attempts per minute
 * - OTP validation: 3 attempts per minute
 */
@Controller('login')
@UseGuards(ThrottlerGuard)
export class LoginController {
    constructor(
        private readonly loginService: LoginService
    ) { }

    // endpoint to login
    // TESTING BYPASS: Modified to return token directly without OTP
    // Bug #7 Fix: Rate limit to 5 requests per minute to prevent brute force
    @Post()
    @Throttle({ default: { limit: 5, ttl: 60000 } })
    async login(@Body() loginDto: loginDto, @Res() response: Response): Promise<void> {
        try {
            const result = await this.loginService.Login(loginDto);

            // TESTING BYPASS: Set cookie directly since OTP is bypassed
            const cookieSecure = process.env.COOKIE_SECURE === 'true'
                || process.env.NODE_ENV === 'production';
            const sameSite = cookieSecure
                ? (process.env.NODE_ENV === 'production' ? 'strict' : 'none')
                : 'lax';

            response.cookie('account', result.AccountToken, {
                httpOnly: true,
                maxAge: Number(process.env.COOKIE_EXPIRY_LOGIN) || 1000 * 60 * 60 * 24,
                signed: true,
                secure: cookieSecure,
                sameSite,
            });

            response.status(HttpStatus.OK).json(result);

        } catch (e) {
            // Re-throw HttpException with original message, otherwise throw generic error
            if (e instanceof HttpException) {
                throw e;
            }
            throw new HttpException('An unexpected error occurred. Please try again.', HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }


    // Bug #7 Fix: Stricter rate limit for OTP validation (3 attempts per minute)
    @Post("validate-otp")
    @Throttle({ default: { limit: 3, ttl: 60000 } })
    async validateOtp(@Body() otpDto: otpDto, @Res() response: Response): Promise<void> {
        try {
            const result = await this.loginService.ValidateOtp(otpDto);
            const cookieSecure = process.env.COOKIE_SECURE === 'true'
                || process.env.NODE_ENV === 'production';
            const sameSite = cookieSecure
                ? (process.env.NODE_ENV === 'production' ? 'strict' : 'none')
                : 'lax';

            response.cookie('account', result.AccountToken, {
                httpOnly: true,
                maxAge: Number(process.env.COOKIE_EXPIRY_LOGIN) || 1000 * 60 * 60 * 24, // 24 hours in ms
                signed: true,
                secure: cookieSecure,
                sameSite,
            });

            response.status(HttpStatus.OK).json(result);

        } catch (e) {
            // Re-throw HttpException with original message, otherwise throw generic error
            if (e instanceof HttpException) {
                throw e;
            }
            throw new HttpException('An unexpected error occurred. Please try again.', HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

}
