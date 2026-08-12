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
