import { calculateDistance, hasValidCoordinates } from './geo.js';

function quoteError(code, message) {
  const error = new Error(message);
  error.code = code;
  return error;
}

export async function buildShippingQuote({ restaurant, address }) {
  if (!restaurant?.id) throw quoteError('SHIPPING_CART_NOT_READY', 'Giỏ hàng chưa sẵn sàng để tính phí giao hàng.');
  if (!hasValidCoordinates(restaurant)) throw quoteError('SHIPPING_RESTAURANT_LOCATION_MISSING', 'Quán ăn chưa có tọa độ hợp lệ để tính phí giao hàng.');
  if (!hasValidCoordinates(address)) throw quoteError('SHIPPING_ADDRESS_LOCATION_MISSING', 'Địa chỉ giao hàng cần có tọa độ hợp lệ để tính phí.');

  const origin = [Number(restaurant.longitude), Number(restaurant.latitude)];
  const destination = [Number(address.longitude), Number(address.latitude)];
  let distanceKm;
  let durationMin;
  let source = 'estimated';

  if (process.env.ORS_API_KEY) {
    try {
      const response = await fetch(`${(process.env.ORS_API_BASE_URL ?? 'https://api.heigit.org/openrouteservice').replace(/\/$/, '')}/v2/directions/driving-car`, {
        method: 'POST', headers: { Authorization: process.env.ORS_API_KEY, 'Content-Type': 'application/json' },
        body: JSON.stringify({ coordinates: [origin, destination] }), signal: AbortSignal.timeout(6000),
      });
      const summary = response.ok ? (await response.json())?.routes?.[0]?.summary : null;
      if (summary && Number.isFinite(Number(summary.distance)) && Number.isFinite(Number(summary.duration))) {
        distanceKm = Number(summary.distance) / 1000;
        durationMin = Math.max(1, Math.ceil(Number(summary.duration) / 60));
        source = 'openrouteservice';
      }
    } catch (error) { console.warn('[shipping] ORS unavailable; using estimate:', error.message); }
  }

  if (!Number.isFinite(distanceKm)) {
    distanceKm = calculateDistance(origin[1], origin[0], destination[1], destination[0]) * 1.3;
    durationMin = Math.max(1, Math.ceil((distanceKm / 24) * 60));
  }
  if (distanceKm > 12) throw quoteError('SHIPPING_DISTANCE_UNSUPPORTED', `Địa chỉ này cách quán ${distanceKm.toFixed(1)} km, vượt quá phạm vi giao hàng.`);
  return { total: Math.min(50000, 15000 + Math.ceil(distanceKm) * 5000), distanceKm: Number(distanceKm.toFixed(2)), durationMin, source };
}
