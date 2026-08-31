import test from 'node:test';
import assert from 'node:assert/strict';

import { validateCheckoutAvailability } from './checkoutValidation.js';

const activeRestaurant = { id: 7, status: 'active', is_open_now: 1 };
const availableItem = {
  menu_item_id: 9,
  menu_restaurant_id: 7,
  menu_status: 'active',
  in_stock: 1,
  quantity: 2,
  unit_price: 45000,
  price: 45000,
};

test('checkout accepts an active restaurant and unchanged available items', () => {
  assert.doesNotThrow(() => validateCheckoutAvailability(activeRestaurant, [availableItem]));
});

test('checkout rejects a restaurant that is closed or inactive', () => {
  assert.throws(
    () => validateCheckoutAvailability({ ...activeRestaurant, is_open_now: 0 }, [availableItem]),
    (error) => error.code === 'RESTAURANT_CLOSED' && error.status === 409,
  );
  assert.throws(
    () => validateCheckoutAvailability({ ...activeRestaurant, status: 'suspended' }, [availableItem]),
    (error) => error.code === 'RESTAURANT_UNAVAILABLE' && error.status === 409,
  );
});

test('checkout rejects stale, foreign and excessive cart items', () => {
  assert.throws(
    () => validateCheckoutAvailability(activeRestaurant, [{ ...availableItem, in_stock: 0 }]),
    (error) => error.code === 'ITEM_UNAVAILABLE',
  );
  assert.throws(
    () => validateCheckoutAvailability(activeRestaurant, [{ ...availableItem, menu_restaurant_id: 8 }]),
    (error) => error.code === 'CART_RESTAURANT_MISMATCH',
  );
  assert.throws(
    () => validateCheckoutAvailability(activeRestaurant, [{ ...availableItem, quantity: 100 }]),
    (error) => error.code === 'INVALID_ITEM_QUANTITY',
  );
});

test('checkout requires confirmation when a menu price changed after adding to cart', () => {
  assert.throws(
    () => validateCheckoutAvailability(activeRestaurant, [{ ...availableItem, price: 50000 }]),
    (error) => error.code === 'PRICE_CHANGED' && error.status === 409,
  );
});
