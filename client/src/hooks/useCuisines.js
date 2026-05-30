import { useState, useEffect } from 'react';
import { fetchCuisines } from '../lib/api.js';

export function useCuisines() {
  const [cuisines, setCuisines] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let ignore = false;
    async function load() {
      try {
        const res = await fetchCuisines();
        if (!ignore) {
          setCuisines(res);
        }
      } catch (error) {
        console.error('Failed to fetch cuisines', error);
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    load();
    return () => { ignore = true; };
  }, []);

  return { cuisines, loading };
}
