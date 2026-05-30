import { useEffect, useState } from 'react';
import { fetchRestaurantMenu } from '../lib/api.js';

export function useRestaurantMenu(idOrSlug) {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    if (!idOrSlug) {
      setCategories([]);
      setLoading(false);
      setError(null);
      return () => {
        cancelled = true;
      };
    }

    setLoading(true);
    setError(null);

    (async () => {
      try {
        const data = await fetchRestaurantMenu(idOrSlug);
        if (!cancelled) {
          setCategories(data?.categories ?? []);
          setError(null);
        }
      } catch (e) {
        if (!cancelled) {
          setCategories([]);
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

  return { categories, loading, error };
}