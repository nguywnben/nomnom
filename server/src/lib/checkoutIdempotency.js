import crypto from 'node:crypto';

export function normalizeIdempotencyKey(value) {
  const key = String(value ?? '').trim();
  if (key.length < 8 || key.length > 128 || !/^[A-Za-z0-9._:-]+$/.test(key)) {
    const error = new Error('IDEMPOTENCY_KEY_INVALID');
    error.status = 400;
    error.code = 'IDEMPOTENCY_KEY_INVALID';
    throw error;
  }
  return key;
}

export function buildCheckoutRequestHash({ addressId, paymentMethod, customerNote, voucherCode }) {
  const canonicalPayload = JSON.stringify({
    addressId: addressId == null || addressId === '' ? null : Number(addressId),
    paymentMethod: String(paymentMethod ?? '').trim().toLowerCase(),
    customerNote: String(customerNote ?? '').trim(),
    voucherCode: String(voucherCode ?? '').trim().toUpperCase(),
  });
  return crypto.createHash('sha256').update(canonicalPayload).digest('hex');
}
