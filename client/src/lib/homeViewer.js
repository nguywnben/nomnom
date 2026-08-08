const HOME_VIEWER_KEY = 'nomnom.home-viewer';

function createViewerId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 14)}`;
}

export function getHomeViewerId() {
  if (typeof localStorage === 'undefined') return 'anonymous';

  try {
    const stored = localStorage.getItem(HOME_VIEWER_KEY);
    if (stored) return stored;

    const viewerId = createViewerId();
    localStorage.setItem(HOME_VIEWER_KEY, viewerId);
    return viewerId;
  } catch {
    return 'anonymous';
  }
}
