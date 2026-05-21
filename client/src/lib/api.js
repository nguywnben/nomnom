import {
  clearTokens,
  getAccessToken,
  getRefreshToken,
  saveTokens,
} from './authStorage.js';

const API_BASE = import.meta.env.VITE_API_URL ?? '';

let refreshInFlight = null;

async function tryRefresh() {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return false;

  if (!refreshInFlight) {
    refreshInFlight = (async () => {
      const res = await fetch(`${API_BASE}/api/v1/auth/refresh`, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken }),
      });
      if (!res.ok) {
        clearTokens();
        return false;
      }
      const data = await res.json();
      saveTokens(data.accessToken, data.refreshToken);
      return true;
    })().finally(() => {
      refreshInFlight = null;
    });
  }
  return refreshInFlight;
}

export async function apiFetch(path, options = {}, { retry = true } = {}) {
  const headers = {
    Accept: 'application/json',
    ...options.headers,
  };
  const token = getAccessToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  let res = await fetch(`${API_BASE}${path}`, { ...options, headers });

  if (res.status === 401 && retry && getRefreshToken()) {
    const refreshed = await tryRefresh();
    if (refreshed) {
      const nextHeaders = { ...headers, Authorization: `Bearer ${getAccessToken()}` };
      res = await fetch(`${API_BASE}${path}`, { ...options, headers: nextHeaders });
    }
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const err = new Error(body.error ?? `API ${res.status}`);
    err.status = res.status;
    throw err;
  }
  return res.json();
}

export function apiGet(path) {
  return apiFetch(path);
}

export function apiPost(path, body) {
  return apiFetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

/** @returns {Promise<{ accessToken, refreshToken, expiresIn, user }>} */
export function loginApi(email, password) {
  return apiPost('/api/v1/auth/login', { email, password });
}

/** Đăng ký khách hàng — POST /api/v1/auth/register */
export function registerApi({ fullName, email, phone, password }) {
  return apiPost('/api/v1/auth/register', { fullName, email, phone, password });
}

export function fetchMe() {
  return apiGet('/api/v1/auth/me');
}

export function logoutApi() {
  const refreshToken = getRefreshToken();
  return apiPost('/api/v1/auth/logout', refreshToken ? { refreshToken } : {}).catch(() => ({}));
}

/** Carousel "Khám phá theo món ăn" — GET /api/v1/home/categories */
export function fetchHomeCategories() {
  return apiGet('/api/v1/home/categories');
}

/** Banner khuyến mãi 3 cột — GET /api/v1/home/promos */
export function fetchHomePromos() {
  return apiGet('/api/v1/home/promos');
}
