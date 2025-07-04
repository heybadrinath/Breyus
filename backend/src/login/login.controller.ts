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
            throw new HttpException('Internal server error', HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }


    @Post("validate-otp")
    async validateOtp(@Body() otpDto: otpDto, @Res() response: Response): Promise<void> {
        try {
            const result = await this.loginService.ValidateOtp(otpDto);
            response.cookie('account', result.AccountToken, {
                httpOnly: true,
                maxAge: 1000 * 60 * 60 * 2,
                signed: true,
                secure: process.env.NODE_ENV === 'production' || true,
                sameSite: (process.env.NODE_ENV === 'production')? 'strict': 'none'
            })
            
            response.status(HttpStatus.OK).json(result);

        } catch (e) {
            throw new HttpException('Internal server error', HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

}
