import assert from 'node:assert/strict';
import test from 'node:test';

import { evaluateVoucher } from './voucher.js';

const NOW = new Date('2026-08-03T12:00:00.000Z');
const baseVoucher = {
  id: 1,
  restaurant_id: 5,
  code: 'SAVE20',
  discount_type: 'percent',
  discount_value: 20,
  max_discount_amount: 50000,
  min_order_amount: 100000,
  usage_limit: 10,
  per_user_limit: 1,
  starts_at: '2026-08-01T00:00:00.000Z',
  ends_at: '2026-08-10T00:00:00.000Z',
  status: 'active',
};

test('percent voucher applies its maximum discount cap', () => {
  const result = evaluateVoucher(baseVoucher, {
    subtotal: 400000,
    restaurantId: 5,
    totalUsage: 0,
    customerUsage: 0,
    now: NOW,
  });
  assert.deepEqual(result, { ok: true, discountAmount: 50000 });
});

test('fixed voucher cannot discount below zero', () => {
  const result = evaluateVoucher(
    { ...baseVoucher, discount_type: 'fixed', discount_value: 500000, max_discount_amount: null },
    { subtotal: 120000, restaurantId: 5, totalUsage: 0, customerUsage: 0, now: NOW },
  );
  assert.deepEqual(result, { ok: true, discountAmount: 120000 });
});

test('voucher validation rejects wrong restaurant, quota and per-user limit', () => {
  assert.equal(evaluateVoucher(baseVoucher, { subtotal: 400000, restaurantId: 6, totalUsage: 0, customerUsage: 0, now: NOW }).reason, 'wrong_restaurant');
  assert.equal(evaluateVoucher(baseVoucher, { subtotal: 400000, restaurantId: 5, totalUsage: 10, customerUsage: 0, now: NOW }).reason, 'usage_limit_reached');
  assert.equal(evaluateVoucher(baseVoucher, { subtotal: 400000, restaurantId: 5, totalUsage: 1, customerUsage: 1, now: NOW }).reason, 'per_user_limit_reached');
});

test('voucher validation rejects inactive, expired and below-minimum orders', () => {
  assert.equal(evaluateVoucher({ ...baseVoucher, status: 'paused' }, { subtotal: 400000, restaurantId: 5, totalUsage: 0, customerUsage: 0, now: NOW }).reason, 'inactive');
  assert.equal(evaluateVoucher(baseVoucher, { subtotal: 400000, restaurantId: 5, totalUsage: 0, customerUsage: 0, now: new Date('2026-08-11T00:00:00.000Z') }).reason, 'expired');
  assert.equal(evaluateVoucher(baseVoucher, { subtotal: 99999, restaurantId: 5, totalUsage: 0, customerUsage: 0, now: NOW }).reason, 'min_order_not_met');
});

test('global voucher applies to any restaurant', () => {
  const result = evaluateVoucher(
    { ...baseVoucher, restaurant_id: null },
    { subtotal: 150000, restaurantId: 999, totalUsage: 0, customerUsage: 0, now: NOW },
  );
  assert.deepEqual(result, { ok: true, discountAmount: 30000 });
});
