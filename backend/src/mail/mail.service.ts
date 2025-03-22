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

  async sendOtp(to: string, otp: string): Promise<void> {
    const mailOptions = {
      from: this.configService.get<string>('MAIL_USER'),
      to,
      subject: 'Breyus - Your OTP Code for Secure Access',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; text-align: center; background-color: #f9f9f9;">
          <div style="max-width: 500px; margin: auto; background: #fff; padding: 20px; border-radius: 10px; box-shadow: 0px 0px 10px rgba(0,0,0,0.1);">

            <h2 style="color: #333;">Your One-Time Password (OTP)</h2>
            <p style="font-size: 18px; color: #555;">Use the code below to complete your login on <strong>Breyus</strong>:</p>

            <div style="font-size: 24px; font-weight: bold; color: #007bff; padding: 10px 20px; background: #e9ecef; display: inline-block; border-radius: 5px; margin-top: 10px;">
              ${otp}
            </div>

            <p style="color: #777; font-size: 14px; margin-top: 20px;">This OTP is valid for only 10 minutes. Do not share it with anyone.</p>

            <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">

            <p style="color: #999; font-size: 12px;">If you didn’t request this code, please ignore this email.</p>

            <p style="font-size: 14px; color: #666; margin-top: 10px;">Powered by <strong>Breyus</strong></p>

            <p style="font-size: 14px; color: #555; margin-top: 15px;">
              Need help? Contact our support team at 
              <a href="mailto:support@breyus.com" style="color: #007bff; text-decoration: none;">support@breyus.com</a>
            </p>
          </div>
        </div>
      `,
    };

    try {
      await this.transporter.sendMail(mailOptions);
      console.log(`✅ OTP sent to ${to}`);
    } catch (error) {
      console.error('❌ Error sending email:', error);
      throw new Error('Error sending OTP email');
    }
  }
}
