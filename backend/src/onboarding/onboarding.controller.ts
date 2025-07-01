import { Body, Controller, HttpCode, HttpException, HttpStatus, Post, Session, Headers, Res } from '@nestjs/common';
import { SendEmailOtpDto, VerifyEmailOtpDto, continueOnboardingDto, SetPasswordDto } from './dto/onboarding.dto';
import { OnboardingService } from './onboarding.service';
import { AuthService } from 'src/auth/auth.service';
import { Response } from 'express';

@Controller('onboarding')
export class OnboardingController {
    constructor(
        private readonly onboardingService: OnboardingService,
        private readonly authService: AuthService
    ) { };



    // Endpoint to send OTP email
    @Post('send-otp')
    async sendOtp(@Body() sendEmailOtpDto: SendEmailOtpDto): Promise<string> {
        try {
            const response = await this.onboardingService.sendMailOtp(sendEmailOtpDto);
            return response as string;
        } catch (error) {
            throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    // Endpoint to verify OTP and generate onboarding token
    @Post('verify-otp')
    async verifyOtp(@Body() verifyEmailOtpDto: VerifyEmailOtpDto): Promise<string> {
        try {
            const token = await this.onboardingService.ValidateMailOtp(verifyEmailOtpDto);
            return token;  // return the onboarding token
        } catch (error) {
            throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
        }
    }

    @Post('validate-token')
    async verifyOnboardingToken(@Headers('authorization') token: string) {
        try {
            return await this.authService.verifyOnboardingToken(token);

        } catch (error) {
            throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
        }
    }

    // Endpoint to set a password after OTP verification
    @Post('set-password')
    async setPassword(@Headers('authorization') token: string, @Body() setPasswordDto: SetPasswordDto, @Res() response: Response): Promise<void> {
        try {
            const AccountToken = await this.onboardingService.SetPassword(setPasswordDto, token);
            response.cookie('access_token', AccountToken,{
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                maxAge: 86400000,
                signed: true,
                sameSite: 'lax'
            });
            response.status(HttpStatus.OK).json({message: 'Account created successfully',data: AccountToken});

        } catch (error) {
            throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }


    // Endpoint that validate the jwt token and return the payload if.e userId
    @Post('validate-account-token')
    async validateAccountToken(@Headers('authorization') token: string): Promise<string> {
        try {
            return await this.authService.verifyAccountToken(token);
        } catch (e) {
            throw new HttpException(e.message,HttpStatus.BAD_REQUEST);
        }
    }

    
    // Endpoint to continue onboarding (after setting the password)
    @Post('continue-onboarding')
    async continueOnboarding(@Body() continueOnboardingDto, @Headers('authorization') onBoardingToken: string, @Res() response: Response): Promise<void>{
        try {
            const result = await this.onboardingService.continueOnboarding(continueOnboardingDto,onBoardingToken);
            response.cookie('access_token', result, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                maxAge: 86400000,
                signed: true,
                sameSite: 'lax'
            });
             response.status(HttpStatus.OK).json({ message: 'Onboarding continued successfully', data: result });
        } catch (error) {
            throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
}
