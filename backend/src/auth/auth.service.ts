import { Injectable } from '@nestjs/common';
import { MailService } from '../mail/mail.service'; // Import MailService

@Injectable()
export class AuthService {
  private otpStore = new Map<string, string>(); // Temporary OTP storage

  constructor(private readonly mailService: MailService) {} // Inject MailService

  async generateOtpAndSend(email: string) {
    const otp = Math.floor(100000 + Math.random() * 900000).toString(); // Generate 6-digit OTP
    this.otpStore.set(email, otp);

    await this.mailService.sendOtp(email, otp); // ✅ Send OTP via email
    console.log(`OTP for ${email}: ${otp}`); // Debug log

    return { message: 'OTP sent successfully' };
  }

  async verifyOtp(email: string, otp: string) {
    const storedOtp = this.otpStore.get(email);

    if (!storedOtp || storedOtp !== otp) {
      return { message: 'Invalid OTP', success: false };
    }

    this.otpStore.delete(email); // ✅ Remove OTP after verification
    return { message: 'OTP verified successfully', success: true };
  }
}
