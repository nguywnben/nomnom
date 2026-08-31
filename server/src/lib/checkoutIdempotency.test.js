import assert from 'node:assert/strict';
import test from 'node:test';

import {
  buildCheckoutRequestHash,
  normalizeIdempotencyKey,
} from './checkoutIdempotency.js';

test('checkout accepts a bounded opaque idempotency key', () => {
  assert.equal(normalizeIdempotencyKey('  checkout_12345678  '), 'checkout_12345678');
  assert.throws(() => normalizeIdempotencyKey('short'), /IDEMPOTENCY_KEY_INVALID/);
  assert.throws(() => normalizeIdempotencyKey('a'.repeat(129)), /IDEMPOTENCY_KEY_INVALID/);
});

test('checkout request hash is stable and changes with financial inputs', () => {
  const first = buildCheckoutRequestHash({
    addressId: 12,
    paymentMethod: 'cod',
    customerNote: 'Ít cay',
    voucherCode: 'SAVE10',
  });
  const reordered = buildCheckoutRequestHash({
    voucherCode: 'save10',
    customerNote: 'Ít cay',
    paymentMethod: 'cod',
    addressId: '12',
  });

  assert.equal(first, reordered);
  assert.notEqual(first, buildCheckoutRequestHash({
    addressId: 12,
    paymentMethod: 'vnpay',
    customerNote: 'Ít cay',
    voucherCode: 'SAVE10',
  }));
});
