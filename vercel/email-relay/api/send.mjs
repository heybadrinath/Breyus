import nodemailer from 'nodemailer';
import { parseAndValidateMessage } from '../lib/relay-message.mjs';

const MAILJET_CREDENTIAL_CHECK_URL =
  'https://api.mailjet.com/v3/REST/sender?Limit=1';

function sendJson(response, statusCode, payload) {
  response.status(statusCode).json(payload);
}

function getBasicAuthorization(request) {
  const authorization = request.headers.authorization;
  if (typeof authorization !== 'string' || !authorization.startsWith('Basic ')) {
    throw new Error('Basic authorization is required.');
  }
  return authorization;
}

async function verifyMailjetCredentials(authorization) {
  const response = await fetch(MAILJET_CREDENTIAL_CHECK_URL, {
    headers: {
      accept: 'application/json',
      authorization,
    },
    signal: AbortSignal.timeout(8_000),
  });

  if (!response.ok) {
    throw new Error('Mailjet credential validation failed.');
  }
}

function createTransporter() {
  const port = Number.parseInt(process.env.SMTP_PORT || '465', 10);
  const requiredEnvironment = [
    'SMTP_HOST',
    'SMTP_USER',
    'SMTP_PASS',
    'EMAIL_FROM',
  ];
  const missing = requiredEnvironment.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(`Missing relay configuration: ${missing.join(', ')}`);
  }

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure: port === 465,
    connectionTimeout: 8_000,
    greetingTimeout: 8_000,
    socketTimeout: 15_000,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

export default async function handler(request, response) {
  if (request.method === 'GET') {
    sendJson(response, 200, { status: 'ok' });
    return;
  }
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'GET, POST');
    sendJson(response, 405, { error: 'Method not allowed.' });
    return;
  }

  try {
    const authorization = getBasicAuthorization(request);
    const email = parseAndValidateMessage(
      request.body,
      process.env.ALLOWED_FROM_EMAIL || process.env.EMAIL_FROM,
    );

    await verifyMailjetCredentials(authorization);
    const sendResult = await createTransporter().sendMail({
      from: `"${email.from.name}" <${process.env.EMAIL_FROM}>`,
      to: email.to,
      subject: email.subject,
      html: email.html,
    });

    sendJson(response, 200, {
      Messages: [
        {
          Status: 'success',
          To: [{ MessageUUID: sendResult.messageId }],
        },
      ],
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Relay failure.';
    const isClientError =
      message.includes('required') ||
      message.includes('allowed') ||
      message.includes('invalid') ||
      message.includes('too large');
    const statusCode = message.includes('authorization')
      ? 401
      : message.includes('credential')
        ? 403
        : isClientError
          ? 400
          : 503;

    sendJson(response, statusCode, { error: message });
  }
}
