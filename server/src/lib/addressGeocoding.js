function geocodingError(message, status = 400) {
  const error = new Error(message);
  error.status = status;
  return error;
}

export async function geocodeVietnamAddress({ line1, ward, district, city }) {
  if (!process.env.ORS_API_KEY) throw geocodingError('Hệ thống chưa cấu hình dịch vụ xác định vị trí.', 503);

  const url = new URL('https://api.heigit.org/pelias/v1/search');
  url.searchParams.set('text', [line1, ward, district, city, 'Vietnam'].filter(Boolean).join(', '));
  url.searchParams.set('boundary.country', 'VN');
  url.searchParams.set('size', '1');
  const response = await fetch(url, {
    headers: { Authorization: process.env.ORS_API_KEY },
    signal: AbortSignal.timeout(8000),
  });
  const feature = response.ok ? (await response.json())?.features?.[0] : null;
  const [longitude, latitude] = feature?.geometry?.coordinates ?? [];
  if (!Number.isFinite(Number(latitude)) || !Number.isFinite(Number(longitude))) {
    throw geocodingError('Không xác định được vị trí từ địa chỉ này. Vui lòng kiểm tra lại địa chỉ.');
  }
  return { latitude: Number(latitude), longitude: Number(longitude) };
}

export async function reverseGeocodeVietnamLocation({ latitude, longitude }) {
  const lat = Number(latitude);
  const lon = Number(longitude);
  if (!Number.isFinite(lat) || !Number.isFinite(lon) || lat < -90 || lat > 90 || lon < -180 || lon > 180) {
    throw geocodingError('Tọa độ vị trí không hợp lệ.');
  }

  const url = new URL('https://nominatim.openstreetmap.org/reverse');
  url.searchParams.set('format', 'jsonv2');
  url.searchParams.set('lat', String(lat));
  url.searchParams.set('lon', String(lon));
  url.searchParams.set('accept-language', 'vi');
  url.searchParams.set('addressdetails', '1');
  url.searchParams.set('zoom', '18');
  const response = await fetch(url, {
    headers: { 'User-Agent': 'NomNom/1.0 (food-delivery graduation project)' },
    signal: AbortSignal.timeout(8000),
  });
  const data = response.ok ? await response.json() : null;
  const address = data?.address ?? {};
  const city = address.city || address.province || address.state;
  const ward = address.county || address.suburb || address.quarter || address.municipality || address.village || address.town;
  const street = address.road || address.pedestrian || address.residential;
  const line1 = [address.house_number, street].filter(Boolean).join(' ')
    || address.hamlet
    || address.neighbourhood
    || address.village
    || address.town
    || data?.name;
  if (!city || !ward || !line1) {
    throw geocodingError('Không xác định được địa chỉ hành chính từ vị trí hiện tại. Vui lòng nhập địa chỉ thủ công.');
  }
  return { line1, ward, city, latitude: lat, longitude: lon };
}
