const KEY_ACCESS = 'nomnom_access_token';
const KEY_REFRESH = 'nomnom_refresh_token';

export function getAccessToken() {
  return localStorage.getItem(KEY_ACCESS);
}

export function getRefreshToken() {
  return localStorage.getItem(KEY_REFRESH);
}

export function saveTokens(accessToken, refreshToken) {
  if (accessToken) localStorage.setItem(KEY_ACCESS, accessToken);
  if (refreshToken) localStorage.setItem(KEY_REFRESH, refreshToken);
}

export function clearTokens() {
  localStorage.removeItem(KEY_ACCESS);
  localStorage.removeItem(KEY_REFRESH);
}

export function hasStoredSession() {
  return Boolean(getAccessToken() || getRefreshToken());
}
