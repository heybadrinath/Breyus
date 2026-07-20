import assert from 'node:assert/strict';
import test from 'node:test';
import { parseAndValidateMessage } from '../lib/relay-message.mjs';

function createPayload(overrides = {}) {
  return {
    Messages: [
      {
        From: { Email: 'sender@example.com', Name: 'Breyus' },
        To: [{ Email: 'user@example.com' }],
        Subject: 'Verify Your Email - Breyus',
        HTMLPart: '<p>Your verification code is 123456.</p>',
        ...overrides,
      },
    ],
  };
}

test('accepts a Breyus verification-code message', () => {
  const message = parseAndValidateMessage(
    createPayload(),
    'sender@example.com',
  );

  assert.equal(message.to, 'user@example.com');
  assert.equal(message.subject, 'Verify Your Email - Breyus');
});

test('accepts a Breyus password-reset code', () => {
  const message = parseAndValidateMessage(
    createPayload({ Subject: 'Password Reset Request - Breyus' }),
    'sender@example.com',
  );

  assert.equal(message.subject, 'Password Reset Request - Breyus');
});

test('rejects non-security notification subjects', () => {
  assert.throws(
    () =>
      parseAndValidateMessage(
        createPayload({ Subject: 'Trade updated - Breyus' }),
        'sender@example.com',
      ),
    /Only Breyus security-code emails are allowed/,
  );
});

test('rejects a sender that does not match relay configuration', () => {
  assert.throws(
    () => parseAndValidateMessage(createPayload(), 'other@example.com'),
    /sender is not allowed/,
  );
});

test('rejects messages without a six-digit code', () => {
  assert.throws(
    () =>
      parseAndValidateMessage(
        createPayload({ HTMLPart: '<p>No code here.</p>' }),
        'sender@example.com',
      ),
    /six-digit security code is required/,
  );
});
