const KEY_ACCESS = 'nomnom_access_token';
const KEY_REFRESH = 'nomnom_refresh_token';
const KEY_REMEMBER_PREF = 'nomnom_remember_login';

function storeForRemember(remember) {
  return remember ? localStorage : sessionStorage;
}

/** Đọc token từ storage đang có phiên (local hoặc session). */
function activeStore() {
  if (localStorage.getItem(KEY_ACCESS) || localStorage.getItem(KEY_REFRESH)) {
    return localStorage;
  }
  if (sessionStorage.getItem(KEY_ACCESS) || sessionStorage.getItem(KEY_REFRESH)) {
    return sessionStorage;
  }
  return null;
}

export function getRememberLoginPref() {
  return localStorage.getItem(KEY_REMEMBER_PREF) !== '0';
}

export function setRememberLoginPref(remember) {
  localStorage.setItem(KEY_REMEMBER_PREF, remember ? '1' : '0');
}

export function getAccessToken() {
  return activeStore()?.getItem(KEY_ACCESS) ?? null;
}

export function getRefreshToken() {
  return activeStore()?.getItem(KEY_REFRESH) ?? null;
}

/**
 * @param {string} accessToken
 * @param {string} refreshToken
 * @param {{ remember?: boolean }} [opts] — remember=true: localStorage (sau khi đóng trình duyệt vẫn vào); false: sessionStorage
 */
export function saveTokens(accessToken, refreshToken, { remember = true } = {}) {
  localStorage.removeItem(KEY_ACCESS);
  localStorage.removeItem(KEY_REFRESH);
  sessionStorage.removeItem(KEY_ACCESS);
  sessionStorage.removeItem(KEY_REFRESH);

  setRememberLoginPref(remember);
  const store = storeForRemember(remember);
  if (accessToken) store.setItem(KEY_ACCESS, accessToken);
  if (refreshToken) store.setItem(KEY_REFRESH, refreshToken);
}

export function clearTokens() {
  localStorage.removeItem(KEY_ACCESS);
  localStorage.removeItem(KEY_REFRESH);
  sessionStorage.removeItem(KEY_ACCESS);
  sessionStorage.removeItem(KEY_REFRESH);
}

export function hasStoredSession() {
  return Boolean(getAccessToken() || getRefreshToken());
}
