import { Injectable, Inject, Logger, OnModuleDestroy } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import * as crypto from 'crypto';
import Redis from 'ioredis';
import { REDIS_CLIENT } from './redis.provider';
import { emailTemplates } from './templates/email.templates';

interface OtpData {
  otp: string;
  timestamp: number;
  used: boolean;
}

@Injectable()
export class MailService implements OnModuleDestroy {
  private readonly logger = new Logger(MailService.name);
  private transporter: nodemailer.Transporter | null = null;
  private isEmailConfigured: boolean;

  // Fallback in-memory store (used when Redis is unavailable)
  private otpStore: Record<string, OtpData> = {};

  // OTP expiry time: 10 minutes
  private readonly OTP_EXPIRY_SECONDS = 10 * 60;
  private readonly OTP_PREFIX = 'otp:';

  constructor(@Inject(REDIS_CLIENT) private readonly redis: Redis | null) {
    this.initializeTransporter();
  }

  private initializeTransporter(): void {
    const smtpHost = process.env.SMTP_HOST;
    const smtpPort = parseInt(process.env.SMTP_PORT || '587', 10);
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;

    this.isEmailConfigured = !!(smtpHost && smtpUser && smtpPass);

    if (!this.isEmailConfigured) {
      this.logger.warn(
        'Email service not configured (SMTP_HOST, SMTP_USER, SMTP_PASS required). ' +
          'OTPs will be logged to console for development.',
      );
      return;
    }

    this.transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465, // true for 465, false for other ports
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
        this.isEmailConfigured = false;
      } else {
        this.logger.log('SMTP transporter is ready to send emails');
      }
    });
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
          return false;
        }

        const otpData: OtpData = JSON.parse(data);

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

  /**
   * Send OTP verification email
   */
  async sendOtpEmail(to: string, otp: string): Promise<void> {
    // Development mode: log to console
    if (!this.isEmailConfigured) {
      console.log(`\n📧 [DEV MODE] OTP for ${to}: ${otp}\n`);
      return;
    }

    const mailOptions: nodemailer.SendMailOptions = {
      from: `"${process.env.EMAIL_FROM_NAME || 'Breyus'}" <${process.env.EMAIL_FROM || process.env.SMTP_USER}>`,
      to,
      subject: 'Verify Your Email - Breyus',
      html: emailTemplates.otpVerification(otp),
    };

    try {
      const info = await this.transporter!.sendMail(mailOptions);
      this.logger.log(`OTP email sent to ${to}: ${info.messageId}`);
    } catch (error) {
      this.logger.error(`Error sending OTP email: ${error}`);
      // Fallback: log OTP to console on email failure
      console.log(`\n📧 [FALLBACK] OTP for ${to}: ${otp}\n`);
    }
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(to: string, otp: string): Promise<void> {
    // Development mode: log to console
    if (!this.isEmailConfigured) {
      console.log(`\n📧 [DEV MODE] Password Reset OTP for ${to}: ${otp}\n`);
      return;
    }

    const mailOptions: nodemailer.SendMailOptions = {
      from: `"${process.env.EMAIL_FROM_NAME || 'Breyus'}" <${process.env.EMAIL_FROM || process.env.SMTP_USER}>`,
      to,
      subject: 'Password Reset Request - Breyus',
      html: emailTemplates.passwordReset(otp),
    };

    try {
      const info = await this.transporter!.sendMail(mailOptions);
      this.logger.log(`Password reset email sent to ${to}: ${info.messageId}`);
    } catch (error) {
      this.logger.error(`Error sending password reset email: ${error}`);
      // Fallback: log OTP to console on email failure
      console.log(`\n📧 [FALLBACK] Password Reset OTP for ${to}: ${otp}\n`);
    }
  }

  /**
   * Send trade notification email
   */
  async sendTradeNotificationEmail(
    to: string,
    subject: string,
    html: string,
  ): Promise<void> {
    // Development mode: log to console
    if (!this.isEmailConfigured) {
      this.logger.log(
        `\n📧 [DEV MODE] Trade notification to ${to}: ${subject}\n`,
      );
      return;
    }

    const mailOptions: nodemailer.SendMailOptions = {
      from: `"${process.env.EMAIL_FROM_NAME || 'Breyus'}" <${process.env.EMAIL_FROM || process.env.SMTP_USER}>`,
      to,
      subject: `${subject} - Breyus`,
      html,
    };

    try {
      const info = await this.transporter!.sendMail(mailOptions);
      this.logger.log(
        `Trade notification email sent to ${to}: ${info.messageId}`,
      );
    } catch (error) {
      this.logger.error(`Error sending trade notification email: ${error}`);
    }
  }
}
