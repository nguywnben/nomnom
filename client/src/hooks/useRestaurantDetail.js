import { useEffect, useRef, useState } from 'react';
import { fetchRestaurantDetail } from '../lib/api.js';

export function useRestaurantDetail(idOrSlug, currentLocation) {
  const [restaurant, setRestaurant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const lastIdRef = useRef(null);

  useEffect(() => {
    let cancelled = false;

    if (!idOrSlug) {
      setRestaurant(null);
      setError({ status: 404, message: 'Không tìm thấy quán' });
      setLoading(false);
      lastIdRef.current = null;
      return () => {
        cancelled = true;
      };
    }

    const isDifferentRestaurant = lastIdRef.current !== idOrSlug;
    if (isDifferentRestaurant) {
      lastIdRef.current = idOrSlug;
      setLoading(true);
      setError(null);
    }

    (async () => {
      try {
        const data = await fetchRestaurantDetail(idOrSlug, currentLocation);
        if (!cancelled) {
          setRestaurant(data);
          setError(null);
        }
      } catch (e) {
        if (!cancelled) {
          if (isDifferentRestaurant) {
            setRestaurant(null);
          }
          setError(e);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [idOrSlug, currentLocation]);

  return { restaurant, loading, error };
}
