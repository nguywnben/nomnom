import test from 'node:test';
import assert from 'node:assert/strict';

import { customerNotificationForAction, resolveStatusAction } from './merchantOrders.js';

test('merchant starts restaurant-managed delivery from ready state', () => {
  assert.deepEqual(resolveStatusAction('start_delivery', { status: 'ready_for_pickup' }), {
    from: 'ready_for_pickup',
    to: 'delivering',
    setDeliveringAt: true,
  });
});

test('merchant cannot start delivery before the order is ready', () => {
  assert.throws(
    () => resolveStatusAction('start_delivery', { status: 'preparing' }),
    (error) => error.status === 409,
  );
});

test('customer delivery notifications describe the restaurant-managed flow', () => {
  const ready = customerNotificationForAction('ready', 'ORD-ABCDE', 'NomNom Kitchen');
  const delivering = customerNotificationForAction('start_delivery', 'ORD-ABCDE', 'NomNom Kitchen');

  assert.equal(ready.body.includes('tài xế'), false);
  assert.equal(delivering.type, 'order_delivering');
  assert.match(delivering.body, /đang được giao/i);
});
