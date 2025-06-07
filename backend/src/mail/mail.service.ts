import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as SibApiV3Sdk from 'sib-api-v3-sdk';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly isDev: boolean;
  private readonly supportEmail: string;
  private readonly companyName: string;
  private readonly apiInstance: SibApiV3Sdk.TransactionalEmailsApi;

  constructor(private readonly configService: ConfigService) {
    this.isDev = this.configService.get('NODE_ENV') === 'development';
    this.supportEmail = this.configService.get('SUPPORT_EMAIL') || 'noreply@yourdomain.com';
    this.companyName = this.configService.get('COMPANY_NAME') || 'Breyus';

    const apiKey = this.configService.get('BREVO_API_KEY');
    if (!apiKey) {
      throw new Error('BREVO_API_KEY is not configured');
    }

    const client = SibApiV3Sdk.ApiClient.instance;
    client.authentications['api-key'].apiKey = apiKey;

    this.apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();

    this.logger.log(`📧 MailService initialized for ${this.companyName} - Mode: ${this.isDev ? 'Dev' : 'Prod'}`);
  }

  async sendOtp(to: string, otp: string): Promise<void> {
    if (this.isDev) {
      this.logger.log(`[DEV MODE] OTP for ${to}: ${otp}`);
      return;
    }

    const senderEmail = this.supportEmail;

    const emailData: SibApiV3Sdk.SendSmtpEmail = {
      to: [{ email: to }],
      sender: { name: this.companyName, email: senderEmail },
      subject: `${this.companyName} - Your OTP Code`,
      htmlContent: `
        <h3>Hello,</h3>
        <p>Your One-Time Password (OTP) is:</p>
        <h2 style="color: #007bff;">${otp}</h2>
        <p>This OTP is valid for 10 minutes.</p>
        <br />
        <p>If you didn't request this, you can safely ignore this email.</p>
      `,
    };

    try {
      await this.apiInstance.sendTransacEmail(emailData);
      this.logger.log(`✅ OTP email sent to ${to}`);
    } catch (error) {
      this.logger.error(`❌ Failed to send OTP: ${error.message}`);
      throw new Error(`Brevo send error: ${error.message}`);
    }
  }

  async sendPasswordResetOtp(to: string, otp: string): Promise<void> {
    return this.sendOtp(to, otp); // Or customize the template like you did for Gmail
  }
}
