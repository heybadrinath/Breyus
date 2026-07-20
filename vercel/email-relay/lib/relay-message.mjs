const ALLOWED_SUBJECTS = new Set([
  'Verify Your Email - Breyus',
  'Password Reset Request - Breyus',
]);

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const OTP_PATTERN = /(^|\D)\d{6}(\D|$)/;
const MAX_HTML_LENGTH = 100_000;

function requireString(value, fieldName) {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error(`${fieldName} is required.`);
  }
  return value.trim();
}

export function parseAndValidateMessage(body, configuredFromEmail) {
  const expectedFrom = requireString(configuredFromEmail, 'EMAIL_FROM');
  const message = body?.Messages?.[0];

  if (!message || body.Messages.length !== 1) {
    throw new Error('Exactly one message is required.');
  }

  const fromEmail = requireString(message.From?.Email, 'From.Email');
  const toEmail = requireString(message.To?.[0]?.Email, 'To.Email');
  const subject = requireString(message.Subject, 'Subject');
  const html = requireString(message.HTMLPart, 'HTMLPart');

  if (message.To.length !== 1) {
    throw new Error('Exactly one recipient is required.');
  }
  if (fromEmail.toLowerCase() !== expectedFrom.toLowerCase()) {
    throw new Error('The sender is not allowed.');
  }
  if (!EMAIL_PATTERN.test(toEmail)) {
    throw new Error('The recipient email is invalid.');
  }
  if (!ALLOWED_SUBJECTS.has(subject)) {
    throw new Error('Only Breyus security-code emails are allowed.');
  }
  if (html.length > MAX_HTML_LENGTH) {
    throw new Error('The email content is too large.');
  }
  if (!OTP_PATTERN.test(html)) {
    throw new Error('A six-digit security code is required.');
  }

  return {
    from: {
      name: requireString(message.From?.Name || 'Breyus', 'From.Name'),
      email: fromEmail,
    },
    to: toEmail,
    subject,
    html,
  };
}
