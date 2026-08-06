import test from 'node:test';
import assert from 'node:assert/strict';
import { toHomeRestaurant } from './homeRestaurants.js';

test('adapts restaurant API data for the customer home card', () => {
  const restaurant = toHomeRestaurant({
    id: 1,
    name: 'Cinque Pizzeria',
    bannerUrl: 'https://example.test/banner.jpg',
    logoUrl: 'https://example.test/logo.jpg',
    cuisineName: 'Ý',
    tagline: 'Pizza nướng lò củi',
    ratingAvg: '4.80',
    reviewCount: 1240,
    baseDeliveryFee: 62000,
    avgPrepTimeMin: 25,
    isOpenNow: true,
  });

  assert.deepEqual(restaurant, {
    id: 1,
    name: 'Cinque Pizzeria',
    banner: 'https://example.test/banner.jpg',
    logo: 'https://example.test/logo.jpg',
    cuisine: 'Ý',
    tags: ['Pizza nướng lò củi'],
    rating: 4.8,
    reviewCount: 1240,
    fee: 62000,
    eta: '25 phút',
    distanceKm: null,
    open: true,
  });
});
