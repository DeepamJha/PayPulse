import crypto from 'crypto';
import { verifyRazorpaySignature } from '../src/webhooks';

describe('Razorpay webhook signatures', () => {
  test('accepts a valid HMAC signature', () => {
    const body = Buffer.from('{"event":"payment.captured"}');
    const secret = 'test-secret';
    const signature = crypto.createHmac('sha256', secret).update(body).digest('hex');
    expect(verifyRazorpaySignature(body, signature, secret)).toBe(true);
  });

  test('rejects an invalid signature', () => {
    expect(verifyRazorpaySignature(
      Buffer.from('{}'),
      'invalid',
      'test-secret',
    )).toBe(false);
  });
});
