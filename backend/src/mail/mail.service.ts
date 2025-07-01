import { Injectable } from '@nestjs/common';
import * as SibApiV3Sdk from 'sib-api-v3-sdk';
import * as crypto from 'crypto';

interface OtpData {
  otp: string;
  timestamp: number; 
  used: boolean; 
}

@Injectable()
export class MailService {
  private apiClient: SibApiV3Sdk.ApiClient;
  private transactionalEmailsApi: SibApiV3Sdk.TransactionalEmailsApi;


  private otpStore: Record<string, OtpData> = {};

  constructor() {
    this.apiClient = SibApiV3Sdk.ApiClient.instance;
    const apiKey = this.apiClient.authentications['api-key'];
    apiKey.apiKey = process.env.EMAIL_SERVICE_API_KEY;
    this.transactionalEmailsApi = new SibApiV3Sdk.TransactionalEmailsApi();
  }

  
  generateOtp(): string {
    return crypto.randomInt(100000, 1000000).toString();
  }


  async sendOtpEmail(to: string, otp: string): Promise<void> {
    const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
    sendSmtpEmail.to = [{ email: to }];
    sendSmtpEmail.sender = { email: process.env.EMAIL_FROM, name: process.env.EMAIL_FROM_NAME }; 
    sendSmtpEmail.subject = 'Your OTP for Authentication';
    console.log(to + ': ' + otp);
    sendSmtpEmail.htmlContent = `
      <html>
        <body>
          <p>Hello,</p>
          <p>Your OTP for authentication is <strong>${otp}</strong>.</p>
          <p>This OTP is valid for 10 minutes.</p>
        </body>
      </html>
    `;

    // try {
      // const result = await this.transactionalEmailsApi.sendTransacEmail(sendSmtpEmail);
      // console.log('OTP sent successfully', result);
    // } catch (error) {
    //   console.error('Error sending OTP email:', error);
    // }
  }

  
  storeOtp(email: string, otp: string): void {
    this.otpStore[email] = {
      otp,
      timestamp: Date.now(),
      used: false,  
    };
  }

  
  validateOtp(email: string, otp: string): boolean {
    const otpData = this.otpStore[email];

    if (!otpData) {
      return false; 
    }

    const timeDiff = Date.now() - otpData.timestamp;
    const expiryTime = 10 * 60 * 1000; 

    if (timeDiff > expiryTime) {
      delete this.otpStore[email]; 
      return false;
    }

  
    if (otpData.used) {
      return false; 
    }


    if (otpData.otp === otp) {

      otpData.used = true;
      return true;
    }

    return false; 
  }
}
