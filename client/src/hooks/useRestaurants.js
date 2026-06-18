import { useState, useEffect } from 'react';
import { fetchRestaurants } from '../lib/api.js';

export function useRestaurants(filters) {
  const [data, setData] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hasMore, setHasMore] = useState(false);

  useEffect(() => {
    let ignore = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetchRestaurants(filters);
        if (!ignore) {
          setData((prev) => {
            if (filters.page > 1) {
              return [...prev, ...res.data];
            }
            return res.data;
          });
          setPagination(res.pagination);
          setHasMore(res.pagination.page * res.pagination.limit < res.pagination.total);
        }
      } catch (err) {
        if (!ignore) setError(err);
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    load();
    return () => {
      ignore = true;
    };
  }, [JSON.stringify(filters)]);

  return { data, pagination, loading, error, hasMore };
}
