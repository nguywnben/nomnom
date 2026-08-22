import { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext.jsx';
import { searchExploreApi } from '../lib/api.js';

// Gợi ý tìm kiếm (autocomplete) — debounce 250ms, dùng chung cho hero search
// và trang /app/search. Trả về { restaurants, menuItems } hoặc null khi không active.
export function useSearchSuggestions(query, { limit = 4, enabled = true } = {}) {
  const { currentLocation } = useApp();
  const [suggestions, setSuggestions] = useState(null);

  useEffect(() => {
    const q = (query || '').trim();
    if (!enabled || q.length < 1) {
      setSuggestions(null);
      return undefined;
    }
    let active = true;
    const timer = window.setTimeout(() => {
      searchExploreApi({
        q,
        page: 1,
        limit,
        latitude: currentLocation?.latitude,
        longitude: currentLocation?.longitude,
      })
        .then((res) => {
          if (active) setSuggestions(res);
        })
        .catch(() => {
          if (active) setSuggestions(null);
        });
    }, 250);
    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [currentLocation, enabled, limit, query]);

  return suggestions;
}

// Lịch sử tìm kiếm gần đây (localStorage) — dùng cho /app/search.
const HISTORY_KEY = 'nomnom-search-history';
const HISTORY_MAX = 6;

export function getRecentSearches() {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    const list = raw ? JSON.parse(raw) : [];
    return Array.isArray(list) ? list.slice(0, HISTORY_MAX) : [];
  } catch {
    return [];
  }
}

export function addRecentSearch(term) {
  const clean = (term || '').trim();
  if (!clean) return;
  const next = [clean, ...getRecentSearches().filter((t) => t.toLowerCase() !== clean.toLowerCase())].slice(0, HISTORY_MAX);
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
  } catch {
    // localStorage không khả dụng
  }
}

export function clearRecentSearches() {
  try {
    localStorage.removeItem(HISTORY_KEY);
  } catch {
    // ignore
  }
}