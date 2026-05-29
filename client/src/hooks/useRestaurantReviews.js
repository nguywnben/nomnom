import { useEffect, useState } from 'react';
import { fetchRestaurantReviews } from '../lib/api.js';

function formatRelativeTime(value) {
  const date = new Date(value);
  const diffMs = date.getTime() - Date.now();
  const diffMinutes = Math.round(diffMs / 60000);
  const absMinutes = Math.abs(diffMinutes);

  if (absMinutes < 60) {
    return absMinutes <= 1 ? 'vừa xong' : `${absMinutes} phút ${diffMinutes < 0 ? 'trước' : 'nữa'}`;
  }

  const diffHours = Math.round(diffMinutes / 60);
  const absHours = Math.abs(diffHours);
  if (absHours < 24) {
    return `${absHours} giờ ${diffHours < 0 ? 'trước' : 'nữa'}`;
  }

  const diffDays = Math.round(diffHours / 24);
  const absDays = Math.abs(diffDays);
  return `${absDays} ngày ${diffDays < 0 ? 'trước' : 'nữa'}`;
}

export function useRestaurantReviews(idOrSlug) {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    if (!idOrSlug) {
      setReviews([]);
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
        const data = await fetchRestaurantReviews(idOrSlug);
        if (!cancelled) {
          setReviews(
            (data?.reviews ?? []).map((review) => ({
              id: review.id,
              author: review.authorName,
              avatar: review.avatarUrl,
              rating: review.rating,
              when: formatRelativeTime(review.createdAt),
              text: review.comment,
            })),
          );
          setError(null);
        }
      } catch (e) {
        if (!cancelled) {
          setReviews([]);
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

  return { reviews, loading, error };
}