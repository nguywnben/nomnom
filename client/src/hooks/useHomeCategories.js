import { useEffect, useState } from 'react';
import { fetchHomeCategories } from '../lib/api.js';

export function useHomeCategories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const { data } = await fetchHomeCategories();
        if (!cancelled) {
          setCategories(data ?? []);
          setError(null);
        }
      } catch (e) {
        if (!cancelled) {
          setError(e.message ?? 'Không tải được danh mục');
          setCategories([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return { categories, loading, error };
}
