import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private transporter;
  private readonly logger = new Logger(MailService.name);
  private readonly isDev: boolean;
  private readonly supportEmail: string;
  private readonly companyName: string;

  constructor(private readonly configService: ConfigService) {
    this.isDev = this.configService.get('NODE_ENV') === 'development';
    this.supportEmail = this.configService.get<string>('SUPPORT_EMAIL', 'support@breyus.com');
    this.companyName = this.configService.get<string>('COMPANY_NAME', 'Breyus');
    
    // Create transporter based on environment
    if (!this.isDev) {
      // Production mode - create real Gmail transporter
      const mailUser = this.configService.get<string>('MAIL_USER');
      const mailPass = this.configService.get<string>('MAIL_PASS');
      
      if (!mailUser || !mailPass) {
        this.logger.error('❌ Gmail credentials not configured! Please set MAIL_USER and MAIL_PASS in .env file');
        throw new Error('Gmail credentials not configured');
      }
      
      this.transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: mailUser,
          pass: mailPass,
        },
        // Additional Gmail-specific options
        secure: true, // Use TLS
        port: 465,
        tls: {
          rejectUnauthorized: false
        }
      });
      
      // Test the connection
      this.verifyConnection();
      this.logger.log(`📧 Production mode: Gmail SMTP configured for ${mailUser}`);
    } else {
      // Development mode - just log emails
      this.logger.log('🔧 Development mode: Emails will be logged to console (no real emails sent)');
    }
    
    this.logger.log(`Mail service initialized - Company: ${this.companyName}, Support: ${this.supportEmail}`);
  }

  private async verifyConnection() {
    try {
      await this.transporter.verify();
      this.logger.log('✅ Gmail SMTP connection verified successfully');
    } catch (error) {
      this.logger.error('❌ Gmail SMTP connection failed:', error.message);
      this.logger.error('📋 Please check:');
      this.logger.error('   1. MAIL_USER is correct Gmail address');
      this.logger.error('   2. MAIL_PASS is a Gmail App Password (not regular password)');
      this.logger.error('   3. Gmail account has 2FA enabled');
      this.logger.error('   4. App Password was generated from Google Account Settings');
    }
  }

  async sendOtp(to: string, otp: string): Promise<void> {
    // In development mode, just log the OTP
    if (this.isDev) {
      this.logger.log(`[DEV MODE] OTP for ${to}: ${otp}`);
      return;
    }

    const mailOptions = {
      from: this.configService.get<string>('MAIL_USER'),
      to,
      subject: `${this.companyName} - Your OTP Code for Secure Access`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; text-align: center; background-color: #f9f9f9;">
          <div style="max-width: 500px; margin: auto; background: #fff; padding: 20px; border-radius: 10px; box-shadow: 0px 0px 10px rgba(0,0,0,0.1);">

            <h2 style="color: #333;">Your One-Time Password (OTP)</h2>
            <p style="font-size: 18px; color: #555;">Use the code below to complete your login on <strong>${this.companyName}</strong>:</p>

            <div style="font-size: 24px; font-weight: bold; color: #007bff; padding: 10px 20px; background: #e9ecef; display: inline-block; border-radius: 5px; margin-top: 10px;">
              ${otp}
            </div>

            <p style="color: #777; font-size: 14px; margin-top: 20px;">This OTP is valid for only 10 minutes. Do not share it with anyone.</p>

            <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">

            <p style="color: #999; font-size: 12px;">If you didn't request this code, please ignore this email.</p>

            <p style="font-size: 14px; color: #666; margin-top: 10px;">Powered by <strong>${this.companyName}</strong></p>

            <p style="font-size: 14px; color: #555; margin-top: 15px;">
              Need help? Contact our support team at 
              <a href="mailto:${this.supportEmail}" style="color: #007bff; text-decoration: none;">${this.supportEmail}</a>
            </p>
          </div>
        </div>
      `,
    };

    try {
      this.logger.log(`📤 Attempting to send OTP to ${to}...`);
      const info = await this.transporter.sendMail(mailOptions);
      this.logger.log(`✅ OTP sent successfully to ${to} - MessageId: ${info.messageId}`);
      return;
    } catch (error) {
      this.logger.error(`❌ Failed to send OTP to ${to}:`, error.message);
      
      // Provide specific error guidance
      if (error.code === 'EAUTH') {
        this.logger.error('🔑 Authentication failed - Please check your Gmail App Password');
        this.logger.error('📋 To fix this:');
        this.logger.error('   1. Go to https://myaccount.google.com/apppasswords');
        this.logger.error('   2. Generate a new App Password for "Mail"');
        this.logger.error('   3. Update MAIL_PASS in your .env file with the 16-character password');
      } else if (error.code === 'ENOTFOUND') {
        this.logger.error('🌐 Network error - Check your internet connection');
      } else if (error.code === 'ETIMEDOUT') {
        this.logger.error('⏱️ Connection timeout - Gmail servers might be busy');
      }
      
      throw new Error(`Failed to send OTP email: ${error.message}`);
    }
  }

  async sendPasswordResetOtp(to: string, otp: string): Promise<void> {
    // In development mode, just log the OTP
    if (this.isDev) {
      this.logger.log(`[DEV MODE] Password Reset OTP for ${to}: ${otp}`);
      return;
    }

    const mailOptions = {
      from: this.configService.get<string>('MAIL_USER'),
      to,
      subject: `${this.companyName} - Password Reset Request`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; text-align: center; background-color: #f9f9f9;">
          <div style="max-width: 500px; margin: auto; background: #fff; padding: 20px; border-radius: 10px; box-shadow: 0px 0px 10px rgba(0,0,0,0.1);">

            <h2 style="color: #333;">Password Reset Request</h2>
            <p style="font-size: 18px; color: #555;">We received a request to reset your password on <strong>${this.companyName}</strong>.</p>
            <p style="font-size: 16px; color: #555;">Use the code below to reset your password:</p>

            <div style="font-size: 24px; font-weight: bold; color: #007bff; padding: 10px 20px; background: #e9ecef; display: inline-block; border-radius: 5px; margin-top: 10px;">
              ${otp}
            </div>

            <p style="color: #777; font-size: 14px; margin-top: 20px;">This reset code is valid for only 10 minutes. Do not share it with anyone.</p>

            <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">

            <p style="color: #999; font-size: 12px;">If you didn't request this password reset, please ignore this email or contact support.</p>

            <p style="font-size: 14px; color: #666; margin-top: 10px;">Powered by <strong>${this.companyName}</strong></p>

            <p style="font-size: 14px; color: #555; margin-top: 15px;">
              Need help? Contact our support team at 
              <a href="mailto:${this.supportEmail}" style="color: #007bff; text-decoration: none;">${this.supportEmail}</a>
            </p>
          </div>
        </div>
      `,
    };

    try {
      this.logger.log(`📤 Attempting to send password reset OTP to ${to}...`);
      const info = await this.transporter.sendMail(mailOptions);
      this.logger.log(`✅ Password Reset OTP sent successfully to ${to} - MessageId: ${info.messageId}`);
      return;
    } catch (error) {
      this.logger.error(`❌ Failed to send password reset OTP to ${to}:`, error.message);
      throw new Error(`Failed to send password reset email: ${error.message}`);
    }
  }
}
