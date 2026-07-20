import {
  Injectable,
  Inject,
  Logger,
  OnModuleDestroy,
  ServiceUnavailableException,
} from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import * as crypto from 'crypto';
import axios from 'axios';
import Redis from 'ioredis';
import { REDIS_CLIENT } from './redis.provider';
import { emailTemplates } from './templates/email.templates';

interface OtpData {
  otp: string;
  timestamp: number;
  used: boolean;
}

type EmailProvider = 'brevo' | 'mailjet' | 'smtp' | 'development' | 'disabled';

interface BrevoEmailResponse {
  messageId?: string;
}

interface MailjetEmailResponse {
  Messages?: Array<{
    Status?: string;
    Errors?: Array<{ ErrorMessage?: string }>;
    To?: Array<{ MessageID?: number; MessageUUID?: string }>;
  }>;
}

interface TransactionalEmail {
  to: string;
  subject: string;
  html: string;
  required: boolean;
}

@Injectable()
export class MailService implements OnModuleDestroy {
  private readonly logger = new Logger(MailService.name);
  private transporter: nodemailer.Transporter | null = null;
  private emailProvider: EmailProvider = 'disabled';
  private readonly fromName = process.env.EMAIL_FROM_NAME || 'Breyus';
  private readonly fromEmail =
    process.env.EMAIL_FROM || process.env.SMTP_USER || '';
  private readonly nonOtpEmailEnabled =
    process.env.EMAIL_NOTIFICATIONS_ENABLED?.toLowerCase() === 'true';

  // Fallback in-memory store (used when Redis is unavailable)
  private otpStore: Record<string, OtpData> = {};

  // OTP expiry time: 10 minutes
  private readonly OTP_EXPIRY_SECONDS = 10 * 60;
  private readonly OTP_PREFIX = 'otp:';

  constructor(@Inject(REDIS_CLIENT) private readonly redis: Redis | null) {
    this.initializeEmailProvider();
  }

  private initializeEmailProvider(): void {
    const requestedProvider = process.env.EMAIL_PROVIDER?.toLowerCase();
    const brevoApiKey = process.env.BREVO_API_KEY;
    const mailjetApiKey = process.env.MAILJET_API_KEY;
    const mailjetSecretKey = process.env.MAILJET_SECRET_KEY;
    const smtpHost = process.env.SMTP_HOST;
    const smtpPort = parseInt(process.env.SMTP_PORT || '587', 10);
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;

    if (requestedProvider === 'mailjet') {
      if (mailjetApiKey && mailjetSecretKey && this.fromEmail) {
        this.emailProvider = 'mailjet';
        this.logger.log('Email provider configured: Mailjet HTTPS API');
      } else {
        this.configureUnavailableProvider(
          'Mailjet requires MAILJET_API_KEY, MAILJET_SECRET_KEY, and EMAIL_FROM.',
        );
      }
      return;
    }

    if (requestedProvider === 'brevo') {
      if (brevoApiKey && this.fromEmail) {
        this.emailProvider = 'brevo';
        this.logger.log('Email provider configured: Brevo HTTPS API');
      } else {
        this.configureUnavailableProvider(
          'Brevo requires BREVO_API_KEY and EMAIL_FROM.',
        );
      }
      return;
    }

    if (requestedProvider && requestedProvider !== 'smtp') {
      this.configureUnavailableProvider(
        `Unsupported EMAIL_PROVIDER: ${requestedProvider}.`,
      );
      return;
    }

    if (
      !requestedProvider &&
      mailjetApiKey &&
      mailjetSecretKey &&
      this.fromEmail
    ) {
      this.emailProvider = 'mailjet';
      this.logger.log('Email provider configured: Mailjet HTTPS API');
      return;
    }

    if (!requestedProvider && brevoApiKey && this.fromEmail) {
      this.emailProvider = 'brevo';
      this.logger.log('Email provider configured: Brevo HTTPS API');
      return;
    }

    if (!(smtpHost && smtpUser && smtpPass)) {
      this.configureUnavailableProvider(
        'Email service requires HTTPS API credentials or complete SMTP settings.',
      );
      return;
    }

    this.emailProvider = 'smtp';
    this.transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465, // true for 465, false for other ports
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 15000,
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    });

    // Verify transporter configuration
    this.transporter.verify((error) => {
      if (error) {
        this.logger.error(
          `SMTP transporter verification failed: ${error.message}`,
        );
        this.emailProvider =
          process.env.NODE_ENV === 'production' ? 'disabled' : 'development';
      } else {
        this.logger.log('SMTP transporter is ready to send emails');
      }
    });
  }

  private configureUnavailableProvider(reason: string): void {
    if (process.env.NODE_ENV === 'production') {
      this.emailProvider = 'disabled';
      this.logger.error(`${reason} Email delivery is disabled in production.`);
      return;
    }

    this.emailProvider = 'development';
    this.logger.warn(`${reason} Emails will be logged in development mode.`);
  }

  async onModuleDestroy(): Promise<void> {
    if (this.redis) {
      await this.redis.quit();
      this.logger.log('Redis connection closed');
    }
    if (this.transporter) {
      this.transporter.close();
      this.logger.log('SMTP transporter closed');
    }
  }

  /**
   * Generate a 6-digit OTP
   */
  generateOtp(): string {
    return crypto.randomInt(100000, 1000000).toString();
  }

  /**
   * Store OTP in Redis (or fallback to in-memory)
   */
  async storeOtp(email: string, otp: string): Promise<void> {
    const normalizedEmail = email.toLowerCase().trim();
    const otpData: OtpData = {
      otp,
      timestamp: Date.now(),
      used: false,
    };

    if (this.redis) {
      try {
        const key = `${this.OTP_PREFIX}${normalizedEmail}`;
        await this.redis.setex(
          key,
          this.OTP_EXPIRY_SECONDS,
          JSON.stringify(otpData),
        );
        this.logger.debug(`OTP stored in Redis for: ${normalizedEmail}`);
      } catch (error) {
        this.logger.error(
          `Redis storeOtp error, falling back to memory: ${error}`,
        );
        this.otpStore[normalizedEmail] = otpData;
      }
    } else {
      // Fallback to in-memory storage
      this.otpStore[normalizedEmail] = otpData;
      this.logger.debug(`OTP stored in memory for: ${normalizedEmail}`);
    }
  }

  /**
   * Delete an OTP after a failed delivery attempt.
   */
  async deleteOtp(email: string): Promise<void> {
    const normalizedEmail = email.toLowerCase().trim();
    delete this.otpStore[normalizedEmail];

    if (!this.redis) {
      return;
    }

    try {
      await this.redis.del(`${this.OTP_PREFIX}${normalizedEmail}`);
    } catch (error) {
      this.logger.error(`Redis deleteOtp error: ${error}`);
    }
  }

  /**
   * Validate OTP from Redis (or fallback to in-memory)
   */
  async validateOtp(email: string, otp: string): Promise<boolean> {
    const normalizedEmail = email.toLowerCase().trim();

    if (this.redis) {
      try {
        const key = `${this.OTP_PREFIX}${normalizedEmail}`;
        const data = await this.redis.get(key);

        if (!data) {
          this.logger.debug(`No OTP found in Redis for: ${normalizedEmail}`);
          return this.validateOtpFromMemory(normalizedEmail, otp);
        }

        const parsedOtpData: unknown = JSON.parse(data);
        if (!this.isOtpData(parsedOtpData)) {
          this.logger.error(`Invalid OTP data found for: ${normalizedEmail}`);
          await this.redis.del(key);
          return false;
        }
        const otpData = parsedOtpData;

        // Check if already used
        if (otpData.used) {
          this.logger.debug(`OTP already used for: ${normalizedEmail}`);
          return false;
        }

        // Check if expired (redundant since Redis TTL handles this, but good for safety)
        const timeDiff = Date.now() - otpData.timestamp;
        if (timeDiff > this.OTP_EXPIRY_SECONDS * 1000) {
          await this.redis.del(key);
          return false;
        }

        // Verify OTP matches
        if (otpData.otp === otp) {
          // Mark as used
          otpData.used = true;
          // Update with remaining TTL
          const ttl = await this.redis.ttl(key);
          if (ttl > 0) {
            await this.redis.setex(key, ttl, JSON.stringify(otpData));
          }
          this.logger.debug(
            `OTP validated successfully for: ${normalizedEmail}`,
          );
          return true;
        }

        return false;
      } catch (error) {
        this.logger.error(
          `Redis validateOtp error, falling back to memory: ${error}`,
        );
        return this.validateOtpFromMemory(normalizedEmail, otp);
      }
    } else {
      return this.validateOtpFromMemory(normalizedEmail, otp);
    }
  }

  /**
   * In-memory OTP validation (fallback)
   */
  private validateOtpFromMemory(email: string, otp: string): boolean {
    const otpData = this.otpStore[email];

    if (!otpData) {
      return false;
    }

    const timeDiff = Date.now() - otpData.timestamp;
    const expiryTime = this.OTP_EXPIRY_SECONDS * 1000;

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

  private isOtpData(value: unknown): value is OtpData {
    if (!value || typeof value !== 'object') {
      return false;
    }

    const candidate = value as Partial<OtpData>;
    return (
      typeof candidate.otp === 'string' &&
      typeof candidate.timestamp === 'number' &&
      typeof candidate.used === 'boolean'
    );
  }

  /**
   * Send OTP verification email
   */
  async sendOtpEmail(to: string, otp: string): Promise<void> {
    if (this.emailProvider === 'development') {
      console.log(`\n📧 [DEV MODE] OTP for ${to}: ${otp}\n`);
      return;
    }

    await this.sendTransactionalEmail({
      to,
      subject: 'Verify Your Email - Breyus',
      html: emailTemplates.otpVerification(otp),
      required: true,
    });
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(to: string, otp: string): Promise<void> {
    if (this.emailProvider === 'development') {
      console.log(`\n📧 [DEV MODE] Password Reset OTP for ${to}: ${otp}\n`);
      return;
    }

    await this.sendTransactionalEmail({
      to,
      subject: 'Password Reset Request - Breyus',
      html: emailTemplates.passwordReset(otp),
      required: true,
    });
  }

  /**
   * Send trade notification email
   */
  async sendTradeNotificationEmail(
    to: string,
    subject: string,
    html: string,
  ): Promise<void> {
    if (!this.nonOtpEmailEnabled) {
      this.logger.debug('Non-OTP email skipped by configuration.');
      return;
    }

    if (this.emailProvider === 'development') {
      this.logger.log(
        `\n📧 [DEV MODE] Trade notification to ${to}: ${subject}\n`,
      );
      return;
    }

    await this.sendTransactionalEmail({
      to,
      subject: `${subject} - Breyus`,
      html,
      required: false,
    });
  }

  private async sendTransactionalEmail(
    email: TransactionalEmail,
  ): Promise<void> {
    if (this.emailProvider === 'disabled') {
      this.handleDeliveryFailure(
        email,
        'No production email provider is configured.',
      );
      return;
    }

    try {
      let messageId: string;
      if (this.emailProvider === 'brevo') {
        messageId = await this.sendViaBrevo(email);
      } else if (this.emailProvider === 'mailjet') {
        messageId = await this.sendViaMailjet(email);
      } else {
        messageId = await this.sendViaSmtp(email);
      }

      this.logger.log(
        `Email accepted for ${this.maskEmail(email.to)}: ${messageId}`,
      );
    } catch (error) {
      this.handleDeliveryFailure(email, this.describeProviderError(error));
    }
  }

  private async sendViaBrevo(email: TransactionalEmail): Promise<string> {
    const response = await axios.post<BrevoEmailResponse>(
      'https://api.brevo.com/v3/smtp/email',
      {
        sender: {
          name: this.fromName,
          email: this.fromEmail,
        },
        to: [{ email: email.to }],
        subject: email.subject,
        htmlContent: email.html,
        tags: ['breyus-transactional'],
      },
      {
        headers: {
          accept: 'application/json',
          'api-key': process.env.BREVO_API_KEY,
          'content-type': 'application/json',
        },
        timeout: 10000,
      },
    );

    if (!response.data.messageId) {
      throw new Error('Brevo did not return a message ID.');
    }

    return response.data.messageId;
  }

  private async sendViaMailjet(email: TransactionalEmail): Promise<string> {
    const apiUrl =
      process.env.MAILJET_API_URL ||
      (process.env.NODE_ENV === 'production'
        ? 'https://breyus.vercel.app/api/send'
        : 'https://api.mailjet.com/v3.1/send');
    const response = await axios.post<MailjetEmailResponse>(
      apiUrl,
      {
        Messages: [
          {
            From: {
              Email: this.fromEmail,
              Name: this.fromName,
            },
            To: [{ Email: email.to }],
            Subject: email.subject,
            HTMLPart: email.html,
          },
        ],
      },
      {
        auth: {
          username: process.env.MAILJET_API_KEY || '',
          password: process.env.MAILJET_SECRET_KEY || '',
        },
        timeout: 10000,
      },
    );

    const result = response.data.Messages?.[0];
    const recipient = result?.To?.[0];
    const messageId =
      recipient?.MessageUUID || recipient?.MessageID?.toString();
    if (result?.Status !== 'success' || !messageId) {
      throw new Error(
        result?.Errors?.[0]?.ErrorMessage ||
          'Mailjet did not accept the email for delivery.',
      );
    }

    return messageId;
  }

  private async sendViaSmtp(email: TransactionalEmail): Promise<string> {
    if (!this.transporter) {
      throw new Error('SMTP transporter is unavailable.');
    }

    const sendResult: unknown = await this.transporter.sendMail({
      from: `"${this.fromName}" <${this.fromEmail}>`,
      to: email.to,
      subject: email.subject,
      html: email.html,
    });

    if (
      !sendResult ||
      typeof sendResult !== 'object' ||
      !('messageId' in sendResult) ||
      typeof sendResult.messageId !== 'string'
    ) {
      throw new Error('SMTP provider did not return a message ID.');
    }

    return sendResult.messageId;
  }

  private handleDeliveryFailure(
    email: TransactionalEmail,
    reason: string,
  ): void {
    this.logger.error(
      `Email delivery failed for ${this.maskEmail(email.to)}: ${reason}`,
    );

    if (email.required) {
      throw new ServiceUnavailableException(
        'Email delivery is temporarily unavailable. Please try again shortly.',
      );
    }
  }

  private describeProviderError(error: unknown): string {
    if (axios.isAxiosError(error)) {
      const providerData = error.response?.data as
        | {
            message?: string;
            data?: { error?: string };
            ErrorMessage?: string;
          }
        | undefined;
      const providerMessage =
        providerData?.message ||
        providerData?.data?.error ||
        providerData?.ErrorMessage;
      return [
        error.response?.status
          ? `Provider returned HTTP ${error.response.status}`
          : error.code || 'Provider request failed',
        providerMessage,
      ]
        .filter(Boolean)
        .join(': ');
    }

    return error instanceof Error ? error.message : 'Unknown provider error';
  }

  private maskEmail(email: string): string {
    const [localPart, domain] = email.split('@');
    if (!domain) {
      return '[invalid-email]';
    }

    return `${localPart.slice(0, 1)}***@${domain}`;
  }
}
