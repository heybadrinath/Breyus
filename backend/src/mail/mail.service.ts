import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private transporter;

  constructor(private readonly configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: this.configService.get<string>('MAIL_USER'),
        pass: this.configService.get<string>('MAIL_PASS'),
      },
    });
  }

  async sendOtp(to: string, otp: string): Promise<void> { // ✅ Ensure function name is sendOtp
    const mailOptions = {
      from: this.configService.get<string>('MAIL_USER'),
      to,
      subject: 'Your OTP Code',
      text: `Your OTP is: ${otp}`,
    };

    try {
      await this.transporter.sendMail(mailOptions);
      console.log(`OTP sent to ${to}`);
    } catch (error) {
      console.error('Error sending email:', error);
      throw new Error('Error sending OTP email');
    }
  }
}
