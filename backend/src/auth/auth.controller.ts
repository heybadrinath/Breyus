import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service'; // Import AuthService

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {} // Inject AuthService

  @Post('send-otp')
  async sendOTP(@Body() body) {
    const { email } = body;
    return await this.authService.generateOtpAndSend(email); // Call generateOtpAndSend()
  }
}
