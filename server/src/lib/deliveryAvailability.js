import { calculateDistance, hasValidCoordinates } from './geo.js';

export const DELIVERY_RADIUS_KM = 12;
export const ROAD_DISTANCE_FACTOR = 1.3;

export function parseCurrentLocation(query) {
  const latitude = Number(query?.latitude);
  const longitude = Number(query?.longitude);
  return hasValidCoordinates({ latitude, longitude }) ? { latitude, longitude } : null;
}

export function getDeliveryAvailability(restaurant, currentLocation) {
  if (!currentLocation) return { status: 'location_required', estimatedDistanceKm: null, isWithinDeliveryRange: null };
  if (!hasValidCoordinates(restaurant)) return { status: 'outside_range', estimatedDistanceKm: null, isWithinDeliveryRange: false };

  const directDistanceKm = calculateDistance(
    currentLocation.latitude,
    currentLocation.longitude,
    Number(restaurant.latitude),
    Number(restaurant.longitude),
  );
  const estimatedDistanceKm = Number((directDistanceKm * ROAD_DISTANCE_FACTOR).toFixed(2));
  const isWithinDeliveryRange = estimatedDistanceKm <= DELIVERY_RADIUS_KM;
  return {
    status: isWithinDeliveryRange ? 'available' : 'outside_range',
    estimatedDistanceKm,
    isWithinDeliveryRange,
  };
}
