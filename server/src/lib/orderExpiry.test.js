import test from 'node:test';
import assert from 'node:assert/strict';

import { canAutomaticallyCancelOrder } from './orderExpiry.js';

test('automatic cancellation never claims a paid order was refunded', () => {
  assert.equal(canAutomaticallyCancelOrder({ paymentStatus: 'paid' }), false);
});

test('automatic cancellation remains available for unpaid orders', () => {
  assert.equal(canAutomaticallyCancelOrder({ paymentStatus: 'unpaid' }), true);
  assert.equal(canAutomaticallyCancelOrder({ paymentStatus: 'failed' }), true);
});
