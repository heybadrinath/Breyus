import { Controller, Post, Body, Res, HttpException, HttpStatus } from '@nestjs/common';
import { LoginService } from './login.service';
import { Response } from 'express';
import { loginDto, otpDto } from './login.dto';

@Controller('login')
export class LoginController {
    constructor(
        private readonly loginService: LoginService
    ) { }

    // endpoint to login
    @Post()
    async login(@Body() loginDto: loginDto): Promise<boolean> {
        try {
            const result = await this.loginService.Login(loginDto);
            return true;

        } catch (e) {
            // Re-throw HttpException with original message, otherwise throw generic error
            if (e instanceof HttpException) {
                throw e;
            }
            throw new HttpException('An unexpected error occurred. Please try again.', HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }


    @Post("validate-otp")
    async validateOtp(@Body() otpDto: otpDto, @Res() response: Response): Promise<void> {
        try {
            const result = await this.loginService.ValidateOtp(otpDto);
            response.cookie('account', result.AccountToken, {
                httpOnly: true,
                maxAge:  Number(process.env.COOKIE_EXPIRY_LOGIN) || 1000 * 60 * 60 * 24, // 24 hours in ms
                signed: true,
                secure: process.env.NODE_ENV === 'production' || true,
                sameSite: (process.env.NODE_ENV === 'production')? 'strict': 'none'
            })

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
