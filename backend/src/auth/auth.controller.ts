import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service'; // Import AuthService

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {} // Inject AuthService

  @Post('send-otp')
  async sendOTP(@Body() body: { email: string }) {
    return await this.authService.generateOtpAndSend(body.email);
  }

  @Post('verify-otp') // ✅ Keep this method
  async verifyOTP(@Body() body: { email: string; otp: string }) {
    return await this.authService.verifyOtp(body.email, body.otp);
  }
}
