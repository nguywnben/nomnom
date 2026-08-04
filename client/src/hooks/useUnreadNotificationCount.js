import { useEffect, useState } from 'react';
import { fetchNotificationsApi } from '../lib/api.js';

const NOTIFICATIONS_CHANGED_EVENT = 'nomnom:notifications-changed';

export function announceNotificationsChanged() {
  window.dispatchEvent(new Event(NOTIFICATIONS_CHANGED_EVENT));
}

export function useUnreadNotificationCount(enabled = true) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!enabled) {
      setCount(0);
      return undefined;
    }

    let active = true;
    const refresh = async () => {
      try {
        const response = await fetchNotificationsApi({ unread: true, page: 1, limit: 1 });
        if (active) setCount(Number(response.unreadCount) || 0);
      } catch {
        if (active) setCount(0);
      }
    };

    refresh();
    const timer = window.setInterval(refresh, 15000);
    window.addEventListener(NOTIFICATIONS_CHANGED_EVENT, refresh);
    return () => {
      active = false;
      window.clearInterval(timer);
      window.removeEventListener(NOTIFICATIONS_CHANGED_EVENT, refresh);
    };
  }, [enabled]);

  return count;
}
