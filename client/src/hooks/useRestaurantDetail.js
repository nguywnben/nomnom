import { useEffect, useState } from 'react';
import { fetchRestaurantDetail } from '../lib/api.js';

export function useRestaurantDetail(idOrSlug) {
  const [restaurant, setRestaurant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    if (!idOrSlug) {
      setRestaurant(null);
      setError({ status: 404, message: 'Không tìm thấy quán' });
      setLoading(false);
      return () => {
        cancelled = true;
      };
    }

    setLoading(true);
    setError(null);

    (async () => {
      try {
        const data = await fetchRestaurantDetail(idOrSlug);
        if (!cancelled) {
          setRestaurant(data);
          setError(null);
        }
      } catch (e) {
        if (!cancelled) {
          setRestaurant(null);
          setError(e);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [idOrSlug]);

  return { restaurant, loading, error };
}