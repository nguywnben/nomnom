import assert from 'node:assert/strict';
import test from 'node:test';
import { buildTrendingDishes } from './homeDishes.js';

test('buildTrendingDishes keeps the real menu item id for server-backed cart writes', () => {
  const result = buildTrendingDishes([
    {
      id: 1,
      name: 'Margherita',
      imageUrl: 'https://example.com/margherita.jpg',
      price: 338000,
      restaurantId: 1,
      restaurantName: 'Cinque Pizzeria',
      restaurantLogo: 'https://example.com/cinque.jpg',
      baseDeliveryFee: 62000,
      avgPrepTimeMin: 25,
    },
  ]);

  assert.deepEqual(result, [
    {
      id: 1,
      menuItemId: 1,
      name: 'Margherita',
      image: 'https://example.com/margherita.jpg',
      imageUrl: 'https://example.com/margherita.jpg',
      price: 338000,
      restaurantId: 1,
      restaurantName: 'Cinque Pizzeria',
      restaurantLogo: 'https://example.com/cinque.jpg',
      fee: 62000,
      eta: '25 phút',
    },
  ]);
});

test('buildTrendingDishes drops incomplete items that cannot be ordered', () => {
  const result = buildTrendingDishes([
    { id: null, name: 'Missing id', price: 100000, restaurantId: 1 },
    { id: 2, name: 'Missing price', restaurantId: 1 },
    { id: 3, name: 'Missing restaurant', price: 100000 },
  ]);

  assert.deepEqual(result, []);
});
