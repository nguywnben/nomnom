import test from 'node:test';
import assert from 'node:assert/strict';

import {
  isProtectedDemoEmail,
  isProtectedDemoUserId,
  isProtectedDemoRestaurantId,
  assertNotProtectedDemoUser,
  assertNotProtectedDemoRestaurant,
} from './demoGuard.js';

test('isProtectedDemoEmail identifies demo emails correctly', () => {
  assert.equal(isProtectedDemoEmail('admin@nomnom.local'), true);
  assert.equal(isProtectedDemoEmail('KHachHang@nomnom.local '), true);
  assert.equal(isProtectedDemoEmail('nhahang@nomnom.local'), true);
  assert.equal(isProtectedDemoEmail('someone.else@example.com'), false);
  assert.equal(isProtectedDemoEmail(null), false);
});

test('isProtectedDemoUserId identifies seed demo accounts', () => {
  assert.equal(isProtectedDemoUserId(1), true);
  assert.equal(isProtectedDemoUserId('2'), true);
  assert.equal(isProtectedDemoUserId(7), true);
  assert.equal(isProtectedDemoUserId(999), false);
  assert.equal(isProtectedDemoUserId(null), false);
});

test('isProtectedDemoRestaurantId identifies seed demo restaurants', () => {
  assert.equal(isProtectedDemoRestaurantId(1), true);
  assert.equal(isProtectedDemoRestaurantId('2'), true);
  assert.equal(isProtectedDemoRestaurantId(3), true);
  assert.equal(isProtectedDemoRestaurantId(150), false);
  assert.equal(isProtectedDemoRestaurantId(null), false);
});

test('assertNotProtectedDemoUser throws 403 for demo accounts', () => {
  assert.throws(
    () => assertNotProtectedDemoUser({ userId: 1 }),
    (err) => err.status === 403 && err.code === 'DEMO_ACCOUNT_PROTECTED',
  );

  assert.throws(
    () => assertNotProtectedDemoUser({ email: 'admin@nomnom.local' }),
    (err) => err.status === 403 && err.code === 'DEMO_ACCOUNT_PROTECTED',
  );

  // Normal user should not throw
  assert.doesNotThrow(() => assertNotProtectedDemoUser({ userId: 100, email: 'custom@example.com' }));
});

test('assertNotProtectedDemoRestaurant throws 403 for demo restaurants', () => {
  assert.throws(
    () => assertNotProtectedDemoRestaurant(1),
    (err) => err.status === 403 && err.code === 'DEMO_RESTAURANT_PROTECTED',
  );

  assert.doesNotThrow(() => assertNotProtectedDemoRestaurant(99));
});
