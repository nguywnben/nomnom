import { useEffect, useState } from 'react';
import { formatHeroLocalityFromNominatim } from '../lib/formatVnLocality.js';

const NOMINATIM_REVERSE = 'https://nominatim.openstreetmap.org/reverse';

/**
 * Nhãn địa phương cho badge hero: Nominatim `county, state` (nguyên văn từ API).
 * Cần HTTPS (hoặc localhost) + quyền truy cập vị trí.
 */
export function useGeolocationLocalityLabel() {
  const [text, setText] = useState('Đang xác định khu vực…');

  useEffect(() => {
    if (!navigator.geolocation) {
      setText('Khu vực của bạn');
      return;
    }

    let cancelled = false;

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        if (cancelled) return;
        try {
          const { latitude, longitude } = pos.coords;
          const url = new URL(NOMINATIM_REVERSE);
          url.searchParams.set('format', 'jsonv2');
          url.searchParams.set('lat', String(latitude));
          url.searchParams.set('lon', String(longitude));
          url.searchParams.set('accept-language', 'vi');
          url.searchParams.set('addressdetails', '1');
          url.searchParams.set('zoom', '16');

          const res = await fetch(url.toString(), {
            headers: {
              'Accept-Language': 'vi',
            },
          });
          if (!res.ok) throw new Error('reverse failed');
          const data = await res.json();
          const line = formatHeroLocalityFromNominatim(data.address);
          if (cancelled) return;
          setText(line && line.length > 0 ? line : 'Khu vực của bạn');
        } catch {
          if (!cancelled) setText('Khu vực của bạn');
        }
      },
      () => {
        if (!cancelled) setText('Khu vực của bạn');
      },
      {
        enableHighAccuracy: false,
        timeout: 15000,
        maximumAge: 600000,
      },
    );

    return () => {
      cancelled = true;
    };
  }, []);

  return text;
}
