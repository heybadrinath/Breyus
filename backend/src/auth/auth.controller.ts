import { Controller, Post, Body, HttpCode, HttpStatus, Get, Headers, UseGuards, Request, HttpException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { ForgotPasswordDto, ResetPasswordDto, RegistrationDto } from './dto';
import { Logger } from '@nestjs/common';

@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(private readonly authService: AuthService) {}

  @Post('send-otp')
  async sendOTP(@Body() body: { email: string; password: string; role?: string }) {
    return await this.authService.generateOtpAndSend(body.email, body.password, body.role);
  }

  @Post('verify-otp')
  async verifyOTP(@Body() body: { email: string; otp: string }) {
    return await this.authService.verifyOtp(body.email, body.otp);
  }

  @Get('validate-token')
  async validateToken(@Headers('authorization') authHeader: string) {
    if (!authHeader) {
      return { valid: false, message: 'No token provided' };
    }

    const token = authHeader.replace('Bearer ', '');
    return this.authService.validateToken(token);
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    return await this.authService.forgotPassword(
      forgotPasswordDto.email,
      forgotPasswordDto.role
    );
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    return await this.authService.resetPassword(
      resetPasswordDto.email,
      resetPasswordDto.otp,
      resetPasswordDto.newPassword,
      resetPasswordDto.role
    );
  }

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() registrationDto: RegistrationDto) {
    try {
      return await this.authService.register(
        registrationDto.email,
        registrationDto.password,
        registrationDto.firstName,
        registrationDto.lastName,
        registrationDto.role,
      );
    } catch (error) {
      this.logger.error(`Registration error: ${error.message}`, error.stack);
      
      if (error.status === 401 && error.message.includes('already registered')) {
        throw new HttpException(
          'Email already registered',
          HttpStatus.CONFLICT,
        );
      }
      
      throw new HttpException(
        'Registration failed. Please try again later.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('verify-registration-otp')
  @HttpCode(HttpStatus.OK)
  async verifyRegistrationOtp(@Body() body: { email: string; otp: string }) {
    try {
      return await this.authService.verifyRegistrationOtp(
        body.email,
        body.otp,
      );
    } catch (error) {
      this.logger.error(`OTP verification error: ${error.message}`, error.stack);
      throw new HttpException(
        'OTP verification failed. Please try again.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
