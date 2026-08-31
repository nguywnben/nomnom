import assert from 'node:assert/strict';
import test from 'node:test';

import { validateCustomerCancellation } from './customerCancellation.js';

test('customer can cancel an unpaid order before restaurant acceptance', () => {
  assert.doesNotThrow(() => validateCustomerCancellation({
    status: 'placed',
    payment_status: 'unpaid',
  }));
});

test('customer cannot silently cancel a captured payment', () => {
  assert.throws(
    () => validateCustomerCancellation({ status: 'placed', payment_status: 'paid' }),
    (error) => error.status === 409 && error.code === 'PAID_ORDER_REQUIRES_REFUND',
  );
});

test('customer cannot cancel after restaurant acceptance', () => {
  assert.throws(
    () => validateCustomerCancellation({ status: 'accepted', payment_status: 'unpaid' }),
    (error) => error.status === 409 && error.code === 'ORDER_NOT_CANCELLABLE',
  );
});
