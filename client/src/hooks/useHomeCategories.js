import { useEffect, useRef, useState } from 'react';
import { fetchHomeCategories } from '../lib/api.js';

export function useHomeCategories(currentLocation) {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const hasLoadedRef = useRef(false);

  useEffect(() => {
    let cancelled = false;

    if (!hasLoadedRef.current) {
      setLoading(true);
    }

    (async () => {
      try {
        const { data } = await fetchHomeCategories(currentLocation);
        if (!cancelled) {
          setCategories(data ?? []);
          setError(null);
          hasLoadedRef.current = true;
        }
      } catch (e) {
        if (!cancelled) {
          setError(e.message ?? 'Không tải được danh mục');
          if (!hasLoadedRef.current) {
            setCategories([]);
          }
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [currentLocation]);

  return { categories, loading, error };
}
