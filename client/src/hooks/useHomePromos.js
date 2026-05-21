import { useEffect, useState } from 'react';
import { fetchHomePromos } from '../lib/api.js';

export function useHomePromos() {
  const [promos, setPromos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const { data } = await fetchHomePromos();
        if (!cancelled) {
          setPromos(data ?? []);
          setError(null);
        }
      } catch (e) {
        if (!cancelled) {
          setError(e.message ?? 'Không tải được khuyến mãi');
          setPromos([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return { promos, loading, error };
}
