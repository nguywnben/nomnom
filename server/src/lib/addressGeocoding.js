function geocodingError(message, status = 400) {
  const error = new Error(message);
  error.status = status;
  return error;
}

async function searchPelias(text) {
  if (!process.env.ORS_API_KEY || !text?.trim()) return null;
  try {
    const url = new URL('https://api.heigit.org/pelias/v1/search');
    url.searchParams.set('text', text);
    url.searchParams.set('boundary.country', 'VN');
    url.searchParams.set('size', '1');
    const response = await fetch(url, {
      headers: { Authorization: process.env.ORS_API_KEY },
      signal: AbortSignal.timeout(6000),
    });
    const feature = response.ok ? (await response.json())?.features?.[0] : null;
    const [longitude, latitude] = feature?.geometry?.coordinates ?? [];
    if (Number.isFinite(Number(latitude)) && Number.isFinite(Number(longitude))) {
      return { latitude: Number(latitude), longitude: Number(longitude) };
    }
  } catch {}
  return null;
}

async function searchNominatim(text) {
  if (!text?.trim()) return null;
  try {
    const url = new URL('https://nominatim.openstreetmap.org/search');
    url.searchParams.set('format', 'jsonv2');
    url.searchParams.set('q', text);
    url.searchParams.set('countrycodes', 'vn');
    url.searchParams.set('accept-language', 'vi');
    url.searchParams.set('limit', '1');
    const response = await fetch(url, {
      headers: { 'User-Agent': 'NomNom/1.0 (food-delivery graduation project)' },
      signal: AbortSignal.timeout(6000),
    });
    const items = response.ok ? await response.json() : null;
    const first = Array.isArray(items) ? items[0] : null;
    const latitude = Number(first?.lat);
    const longitude = Number(first?.lon);
    if (Number.isFinite(latitude) && Number.isFinite(longitude)) {
      return { latitude, longitude };
    }
  } catch {}
  return null;
}

export async function geocodeVietnamAddress({ line1, ward, district, city }) {
  if (!process.env.ORS_API_KEY) {
    throw geocodingError('Hệ thống chưa cấu hình dịch vụ xác định vị trí. Vui lòng liên hệ quản trị viên.', 503);
  }

  const fullText = [line1, ward, district, city, 'Vietnam'].filter(Boolean).join(', ');
  const areaText = [ward, district, city, 'Vietnam'].filter(Boolean).join(', ');
  const cityText = [district, city, 'Vietnam'].filter(Boolean).join(', ');

  // 1. Full address query with ORS Pelias
  let coords = await searchPelias(fullText);
  // 2. Full address query with OSM Nominatim
  if (!coords) coords = await searchNominatim(fullText);
  // 3. Area fallback (Ward + District + City) with ORS
  if (!coords && areaText) coords = await searchPelias(areaText);
  // 4. Area fallback with Nominatim
  if (!coords && areaText) coords = await searchNominatim(areaText);
  // 5. City fallback with Nominatim
  if (!coords && cityText) coords = await searchNominatim(cityText);

  if (!coords) {
    throw geocodingError('Không xác định được vị trí từ địa chỉ này. Vui lòng kiểm tra lại địa chỉ.');
  }
  return coords;
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
  const resolvedCity = address.city || address.province || address.state || address.region;
  const resolvedWard = address.suburb || address.quarter || address.neighbourhood || address.county || address.municipality || address.village || address.town || address.district || address.state_district;
  const street = address.road || address.pedestrian || address.residential || address.footway || address.path || address.neighbourhood;
  const rawLine1 = [address.house_number, street].filter(Boolean).join(' ')
    || address.hamlet
    || address.neighbourhood
    || address.village
    || address.town
    || data?.name;

  const resolvedLine1 = rawLine1 && rawLine1.trim()
    ? rawLine1.trim()
    : resolvedWard
      ? `Khu vực ${resolvedWard}`
      : (data?.display_name ? data.display_name.split(',')[0].trim() : 'Vị trí hiện tại');

  if (!resolvedCity && !resolvedWard) {
    throw geocodingError('Không xác định được địa chỉ hành chính từ vị trí hiện tại. Vui lòng nhập địa chỉ thủ công.');
  }

  return {
    line1: resolvedLine1,
    ward: resolvedWard || resolvedCity,
    city: resolvedCity || resolvedWard,
    latitude: lat,
    longitude: lon,
  };
}
