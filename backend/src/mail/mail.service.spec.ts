import { ServiceUnavailableException } from '@nestjs/common';
import axios from 'axios';
import Redis from 'ioredis';
import { MailService } from './mail.service';

interface BrevoRequestBody {
  sender: { name: string; email: string };
  to: Array<{ email: string }>;
  subject: string;
  htmlContent: string;
}

interface BrevoRequestConfig {
  headers: Record<string, string>;
}

interface MailjetRequestBody {
  Messages: Array<{
    From: { Email: string; Name: string };
    To: Array<{ Email: string }>;
    Subject: string;
    HTMLPart: string;
  }>;
}

describe('MailService', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.restoreAllMocks();
    process.env = {
      ...originalEnv,
      NODE_ENV: 'production',
      EMAIL_PROVIDER: 'brevo',
      BREVO_API_KEY: 'test-api-key',
      EMAIL_FROM: 'sender@example.com',
      EMAIL_FROM_NAME: 'Breyus',
    };
    delete process.env.EMAIL_NOTIFICATIONS_ENABLED;
    delete process.env.MAILJET_API_KEY;
    delete process.env.MAILJET_SECRET_KEY;
    delete process.env.MAILJET_API_URL;
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('sends OTP email through the Brevo HTTPS API', async () => {
    const postSpy = jest.spyOn(axios, 'post').mockResolvedValue({
      data: { messageId: 'brevo-message-id' },
    });
    const service = new MailService(null);

    await service.sendOtpEmail('user@example.com', '123456');

    expect(postSpy).toHaveBeenCalledTimes(1);
    const [url, untypedBody, untypedConfig] = postSpy.mock.calls[0];
    const body = untypedBody as BrevoRequestBody;
    const config = untypedConfig as unknown as BrevoRequestConfig;

    expect(url).toBe('https://api.brevo.com/v3/smtp/email');
    expect(body.sender).toEqual({
      name: 'Breyus',
      email: 'sender@example.com',
    });
    expect(body.to).toEqual([{ email: 'user@example.com' }]);
    expect(body.subject).toBe('Verify Your Email - Breyus');
    expect(body.htmlContent).toContain('123456');
    expect(config.headers['api-key']).toBe('test-api-key');
  });

  it('reports provider failures instead of claiming OTP delivery', async () => {
    jest.spyOn(axios, 'post').mockRejectedValue(new Error('network failure'));
    const service = new MailService(null);

    await expect(
      service.sendOtpEmail('user@example.com', '123456'),
    ).rejects.toBeInstanceOf(ServiceUnavailableException);
  });

  it('sends OTP email through the Mailjet HTTPS API', async () => {
    process.env.EMAIL_PROVIDER = 'mailjet';
    process.env.MAILJET_API_KEY = 'mailjet-api-key';
    process.env.MAILJET_SECRET_KEY = 'mailjet-secret-key';
    process.env.MAILJET_API_URL = 'https://api.mailjet.com/v3.1/send';
    delete process.env.BREVO_API_KEY;
    const postSpy = jest.spyOn(axios, 'post').mockResolvedValue({
      data: {
        Messages: [
          {
            Status: 'success',
            To: [{ MessageUUID: 'mailjet-message-id' }],
          },
        ],
      },
    });
    const service = new MailService(null);

    await service.sendOtpEmail('user@example.com', '123456');

    const [url, untypedBody, untypedConfig] = postSpy.mock.calls[0];
    const body = untypedBody as MailjetRequestBody;
    const config = untypedConfig as unknown as {
      auth: { username: string; password: string };
    };

    expect(url).toBe('https://api.mailjet.com/v3.1/send');
    expect(body.Messages[0].From).toEqual({
      Email: 'sender@example.com',
      Name: 'Breyus',
    });
    expect(body.Messages[0].To).toEqual([{ Email: 'user@example.com' }]);
    expect(body.Messages[0].Subject).toBe('Verify Your Email - Breyus');
    expect(body.Messages[0].HTMLPart).toContain('123456');
    expect(config.auth).toEqual({
      username: 'mailjet-api-key',
      password: 'mailjet-secret-key',
    });
  });

  it('can route Mailjet delivery through an authenticated HTTPS relay', async () => {
    process.env.EMAIL_PROVIDER = 'mailjet';
    process.env.MAILJET_API_KEY = 'mailjet-api-key';
    process.env.MAILJET_SECRET_KEY = 'mailjet-secret-key';
    process.env.MAILJET_API_URL = 'https://breyus.vercel.app/api/send';
    delete process.env.BREVO_API_KEY;
    const postSpy = jest.spyOn(axios, 'post').mockResolvedValue({
      data: {
        Messages: [
          {
            Status: 'success',
            To: [{ MessageUUID: 'relay-message-id' }],
          },
        ],
      },
    });
    const service = new MailService(null);

    await service.sendOtpEmail('user@example.com', '123456');

    expect(postSpy).toHaveBeenCalledWith(
      'https://breyus.vercel.app/api/send',
      expect.any(Object),
      expect.objectContaining({
        auth: {
          username: 'mailjet-api-key',
          password: 'mailjet-secret-key',
        },
      }),
    );
  });

  it('rejects required email when production credentials are missing', async () => {
    delete process.env.BREVO_API_KEY;
    delete process.env.EMAIL_FROM;
    delete process.env.SMTP_HOST;
    delete process.env.SMTP_USER;
    delete process.env.SMTP_PASS;
    const service = new MailService(null);

    await expect(
      service.sendPasswordResetEmail('user@example.com', '123456'),
    ).rejects.toBeInstanceOf(ServiceUnavailableException);
  });

  it('does not send non-OTP email notifications by default', async () => {
    const postSpy = jest.spyOn(axios, 'post').mockResolvedValue({
      data: { messageId: 'brevo-message-id' },
    });
    const service = new MailService(null);

    await expect(
      service.sendTradeNotificationEmail(
        'user@example.com',
        'Trade updated',
        '<p>Updated</p>',
      ),
    ).resolves.toBeUndefined();
    expect(postSpy).not.toHaveBeenCalled();
  });

  it('does not fail an operation when an enabled notification cannot send', async () => {
    process.env.EMAIL_NOTIFICATIONS_ENABLED = 'true';
    jest.spyOn(axios, 'post').mockRejectedValue(new Error('network failure'));
    const service = new MailService(null);

    await expect(
      service.sendTradeNotificationEmail(
        'user@example.com',
        'Trade updated',
        '<p>Updated</p>',
      ),
    ).resolves.toBeUndefined();
  });

  it('validates the memory fallback when Redis becomes unavailable', async () => {
    const redis = {
      setex: jest.fn().mockRejectedValue(new Error('Redis unavailable')),
      get: jest.fn().mockResolvedValue(null),
      del: jest.fn().mockResolvedValue(1),
    };
    const service = new MailService(redis as unknown as Redis);

    await service.storeOtp('User@Example.com', '123456');

    await expect(
      service.validateOtp('user@example.com', '123456'),
    ).resolves.toBe(true);
  });
});
