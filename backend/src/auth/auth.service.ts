import { Injectable } from '@nestjs/common';
import { MailService } from '../mail/mail.service';

@Injectable()
export class AuthService {
  constructor(private readonly mailService: MailService) {}

  async generateOtpAndSend(to: string) {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    await this.mailService.sendOtp(to, otp);
    return { message: 'OTP sent successfully' };
  }
}
