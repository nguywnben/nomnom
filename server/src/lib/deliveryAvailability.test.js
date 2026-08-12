import test from 'node:test';
import assert from 'node:assert/strict';
import { getDeliveryAvailability, parseCurrentLocation } from './deliveryAvailability.js';

test('delivery availability requires a valid current location', () => {
  assert.equal(parseCurrentLocation({ latitude: 'abc', longitude: '106.7' }), null);
  assert.deepEqual(
    getDeliveryAvailability({ latitude: 10.77, longitude: 106.7 }, null),
    { status: 'location_required', estimatedDistanceKm: null, isWithinDeliveryRange: null },
  );
});

test('delivery availability blocks a restaurant beyond the estimated delivery radius', () => {
  const availability = getDeliveryAvailability(
    { latitude: 10.77, longitude: 106.7 },
    { latitude: 10.9, longitude: 106.7 },
  );
  assert.equal(availability.status, 'outside_range');
  assert.equal(availability.isWithinDeliveryRange, false);
});
