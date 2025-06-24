import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as SibApiV3Sdk from 'sib-api-v3-sdk';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly senderEmail: string;
  private readonly companyName: string;
  private readonly apiInstance: SibApiV3Sdk.TransactionalEmailsApi;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('BREVO_API_KEY');
    if (!apiKey) throw new Error('❌ BREVO_API_KEY is missing from environment');

    const client: SibApiV3Sdk.ApiClient = SibApiV3Sdk.ApiClient.instance;
    client.authentications['api-key'].apiKey = apiKey;

    this.apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();
    this.senderEmail = this.configService.get<string>('SUPPORT_EMAIL', 'support@breyus.com');
    this.companyName = this.configService.get<string>('COMPANY_NAME', 'Breyus');
  }

  async sendOtp(to: string, otp: string): Promise<void> {
    const email: SibApiV3Sdk.SendSmtpEmail = {
      sender: { name: this.companyName, email: this.senderEmail },
      to: [{ email: to }],
      subject: `${this.companyName} - Your OTP Code`,
      htmlContent: `<p>Your OTP is: <strong>${otp}</strong></p><p>This code is valid for 10 minutes.</p>`,
    };

    try {
      const response = await this.apiInstance.sendTransacEmail(email);
      this.logger.log(`✅ OTP sent to ${to} - Message ID: ${response?.messageId || 'N/A'}`);
    } catch (error: any) {
      this.logger.error(`❌ Brevo send error: ${error.message || error}`);
      throw new Error(`Brevo send error: ${error.message || error}`);
    }
  }

  async sendPasswordResetOtp(to: string, otp: string): Promise<void> {
    const email: SibApiV3Sdk.SendSmtpEmail = {
      sender: { name: this.companyName, email: this.senderEmail },
      to: [{ email: to }],
      subject: `${this.companyName} - Password Reset Code`,
      htmlContent: `<p>To reset your password, use this OTP: <strong>${otp}</strong></p><p>This code is valid for 10 minutes.</p>`,
    };

    try {
      const response = await this.apiInstance.sendTransacEmail(email);
      this.logger.log(`✅ Password reset OTP sent to ${to} - Message ID: ${response?.messageId || 'N/A'}`);
    } catch (error: any) {
      this.logger.error(`❌ Brevo send error (password reset): ${error.message || error}`);
      throw new Error(`Brevo send error: ${error.message || error}`);
    }
  }
}
