import {
  clearTokens,
  getAccessToken,
  getRefreshToken,
  saveTokens,
} from './authStorage.js';

const API_BASE = import.meta.env.VITE_API_URL ?? (import.meta.env.DEV ? 'http://localhost:3000' : '');

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
    const err = new Error(body.error ?? body.message ?? `API ${res.status}`);
    err.status = res.status;
    err.errors = body.errors;
    err.details = body.details;
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

export function apiPatch(path, body) {
  return apiFetch(path, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

export function apiDelete(path) {
  return apiFetch(path, { method: 'DELETE' });
}

export function authGet(path) {
  return apiGet(path);
}

export function uploadImageApi(file, folder) {
  const formData = new FormData();
  formData.append('file', file);
  if (folder) {
    formData.append('folder', folder);
  }
  return apiFetch('/api/v1/uploads', {
    method: 'POST',
    body: formData,
  });
}

export function fetchDriverProfile() {
  return apiGet('/api/v1/driver/me/profile');
}

export function applyDriverProfile(payload) {
  return apiPost('/api/v1/driver/apply', payload);
}

export function updateDriverProfile(payload) {
  return apiPatch('/api/v1/driver/me/profile', payload);
}

/** @returns {Promise<{ accessToken, refreshToken, expiresIn, user }>} */
export function loginApi(email, password, rememberMe = true) {
  return apiPost('/api/v1/auth/login', { email, password, rememberMe });
}

export function fetchAdminOverview(range = 'month') {
  const params = new URLSearchParams({ range });
  return apiGet(`/api/v1/admin/overview?${params.toString()}`);
}

export function queryAdminUsers({ role = 'all', status = 'all', q = '', page = 1, limit = 20 } = {}) {
  const params = new URLSearchParams({
    role,
    status,
    q,
    page: String(page),
    limit: String(limit),
  });
  return apiGet(`/api/v1/admin/usersQuery?${params.toString()}`);
}

export function updateAdminUserStatus(userId, status, suspensionDays, suspensionReason) {
  const body = { status };
  if (status === 'suspended') {
    body.suspensionDays = suspensionDays;
    body.suspensionReason = suspensionReason;
  }
  return apiFetch(`/api/v1/admin/users/${encodeURIComponent(userId)}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

export function resetAdminUserPassword(userId, newPassword) {
  return apiPost(`/api/v1/admin/users/${encodeURIComponent(userId)}/reset-password`, {
    newPassword,
  });
}

/** Gửi mã OTP đăng ký qua email */
export function registerSendCodeApi({ fullName, email, password }) {
  return apiPost('/api/v1/auth/register/send-code', { fullName, email, password });
}

/** Xác minh OTP và tạo tài khoản */
export function registerVerifyApi({ email, code }) {
  return apiPost('/api/v1/auth/register/verify', { email, code });
}

/** Gửi lại mã OTP đăng ký */
export function registerResendCodeApi(email) {
  return apiPost('/api/v1/auth/register/resend-code', { email });
}

/** Quên mật khẩu — gửi OTP email */
export function forgotPasswordSendCodeApi(email) {
  return apiPost('/api/v1/auth/forgot-password/send-code', { email });
}

export function forgotPasswordResendCodeApi(email) {
  return apiPost('/api/v1/auth/forgot-password/resend-code', { email });
}

export function forgotPasswordVerifyApi({ email, code }) {
  return apiPost('/api/v1/auth/forgot-password/verify', { email, code });
}

export function resetPasswordApi({ resetToken, password }) {
  return apiPost('/api/v1/auth/forgot-password/reset', { resetToken, password });
}

export function fetchMe() {
  return apiGet('/api/v1/auth/me');
}

export function logoutApi() {
  const refreshToken = getRefreshToken();
  return apiPost('/api/v1/auth/logout', refreshToken ? { refreshToken } : {}).catch(() => ({}));
}

export function logoutAllApi() {
  return apiPost('/api/v1/auth/logout-all');
}

export function updateMeProfile(body) {
  return apiPatch('/api/v1/me', body);
}

export function changePasswordApi({ currentPassword, newPassword }) {
  return apiPost('/api/v1/me/change-password', { currentPassword, newPassword });
}

/** Carousel "Khám phá theo món ăn" — GET /api/v1/home/categories */
export function fetchHomeCategories() {
  return apiGet('/api/v1/home/categories');
}

/** Banner khuyến mãi 3 cột — GET /api/v1/home/promos */
export function fetchHomePromos() {
  return apiGet('/api/v1/home/promos');
}

/** Đăng ký đối tác nhà hàng mới — POST /api/v1/merchant/apply */
export function applyMerchantApi(data) {
  return apiPost('/api/v1/merchant/apply', data);
}

/** Lấy thông tin nhà hàng của người dùng hiện tại — GET /api/v1/merchant/me/restaurant */
export function fetchMerchantRestaurantApi() {
  return apiGet('/api/v1/merchant/me/restaurant');
}

/** Lấy thông tin KPI và thống kê cho Dashboard của merchant — GET /api/v1/merchant/me/dashboard */
export function fetchMerchantDashboardApi(range = 'today') {
  return apiGet(`/api/v1/merchant/me/dashboard?range=${range}`);
}

/** Đơn hàng của quán — GET /api/v1/merchant/me/orders */
export function fetchMerchantOrdersApi({ date, status } = {}) {
  const params = new URLSearchParams();
  if (date) params.set('date', date);
  if (status) params.set('status', status);
  const qs = params.toString();
  return apiGet(`/api/v1/merchant/me/orders${qs ? `?${qs}` : ''}`);
}

/** Cập nhật trạng thái đơn quán — PATCH /api/v1/merchant/me/orders/:orderCode/status */
export function updateMerchantOrderStatusApi(orderCode, action, cancelReason) {
  const body = { action };
  if (cancelReason) body.cancelReason = cancelReason;
  return apiPatch(`/api/v1/merchant/me/orders/${encodeURIComponent(orderCode)}/status`, body);
}

export function fetchMerchantVouchersApi() {
  return apiGet('/api/v1/merchant/me/vouchers');
}

export function createMerchantVoucherApi(body) {
  return apiPost('/api/v1/merchant/me/vouchers', body);
}

export function updateMerchantVoucherApi(id, body) {
  return apiPatch(`/api/v1/merchant/me/vouchers/${encodeURIComponent(id)}`, body);
}

export function deleteMerchantVoucherApi(id) {
  return apiDelete(`/api/v1/merchant/me/vouchers/${encodeURIComponent(id)}`);
}

export function fetchMerchantReviewsApi({ page = 1, limit = 50, rating, replied = 'all' } = {}) {
  const params = new URLSearchParams({ page: String(page), limit: String(limit), replied });
  if (rating) params.set('rating', String(rating));
  return apiGet(`/api/v1/merchant/me/reviews?${params.toString()}`);
}

export function replyMerchantReviewApi(reviewId, replyText) {
  return apiPatch(`/api/v1/merchant/me/reviews/${encodeURIComponent(reviewId)}/reply`, { replyText });
}

export function fetchRestaurantVouchersApi(restaurantId) {
  return apiGet(`/api/v1/restaurants/${encodeURIComponent(restaurantId)}/vouchers`);
}

/** Lấy danh sách các loại hình ẩm thực — GET /api/v1/home/cuisines */
export function fetchCuisinesApi() {
  return apiGet('/api/v1/home/cuisines');
}

export function fetchAdminPendingRestaurants() {
  return apiGet('/api/v1/admin/restaurants/pending');
}

export function approveAdminRestaurant(restaurantId) {
  return apiPost(`/api/v1/admin/restaurants/${encodeURIComponent(restaurantId)}/approve`);
}

export function rejectAdminRestaurant(restaurantId, reason) {
  return apiPost(`/api/v1/admin/restaurants/${encodeURIComponent(restaurantId)}/reject`, { reason });
}

export function fetchAdminPendingDrivers() {
  return apiGet('/api/v1/admin/drivers/pending');
}

export function approveAdminDriver(userId) {
  return apiPost(`/api/v1/admin/drivers/${encodeURIComponent(userId)}/approve`);
}

export function rejectAdminDriver(userId, reason) {
  return apiPost(`/api/v1/admin/drivers/${encodeURIComponent(userId)}/reject`, { reason });
}

export function fetchAdminOrders({ status = 'all', paymentMethod = 'all', q = '', page = 1 } = {}) {
  const params = new URLSearchParams({
    status,
    paymentMethod,
    q,
    page: String(page),
  });
  return apiGet(`/api/v1/admin/orders?${params.toString()}`);
}

export function fetchAdminOrderDetail(orderId) {
  return apiGet(`/api/v1/admin/orders/${encodeURIComponent(orderId)}`);
}

export function cancelAdminOrder(orderId, reason) {
  return apiPost(`/api/v1/admin/orders/${encodeURIComponent(orderId)}/cancel`, { reason });
}

export function fetchAdminReviews({ hidden = 'all', page = 1, q = '', ratingMax } = {}) {
  const params = new URLSearchParams({ hidden, page: String(page), q });
  if (ratingMax) params.set('ratingMax', String(ratingMax));
  return apiGet(`/api/v1/admin/reviews?${params.toString()}`);
}

export function updateAdminReviewHidden(reviewId, isHidden) {
  return apiPatch(`/api/v1/admin/reviews/${encodeURIComponent(reviewId)}`, { isHidden });
}

export function fetchRestaurants(params = {}) {
  const query = new URLSearchParams(params).toString();
  return apiGet(`/api/v1/restaurants${query ? `?${query}` : ''}`);
}

export function fetchCuisines() {
  return apiGet('/api/v1/cuisines');
}

export function fetchRestaurantDetail(idOrSlug) {
  const id = String(idOrSlug).replace(/^r-/, '');
  return apiGet(`/api/v1/restaurants/${encodeURIComponent(id)}`);
}

export function fetchRestaurantMenu(idOrSlug) {
  const id = String(idOrSlug).replace(/^r-/, '');
  return apiGet(`/api/v1/restaurants/${encodeURIComponent(id)}/menu`);
}

export function fetchRestaurantReviews(idOrSlug) {
  const id = String(idOrSlug).replace(/^r-/, '');
  return apiGet(`/api/v1/restaurants/${encodeURIComponent(id)}/reviews`);
}

export function fetchCartApi() {
  return apiGet('/api/v1/cart');
}

export function addCartItemApi({ menuItemId, quantity, note }) {
  return apiPost('/api/v1/cart/items', { menuItemId, quantity, note });
}

export function updateCartItemApi(itemId, { quantity, note }) {
  return apiPatch(`/api/v1/cart/items/${encodeURIComponent(itemId)}`, { quantity, note });
}

export function deleteCartItemApi(itemId) {
  return apiDelete(`/api/v1/cart/items/${encodeURIComponent(itemId)}`);
}

export function clearCartApi() {
  return apiDelete('/api/v1/cart');
}

export function fetchMerchantMenuApi() {
  return apiGet('/api/v1/merchant/me/menu');
}

export function createMerchantCategoryApi(body) {
  return apiPost('/api/v1/merchant/me/categories', body);
}

export function updateMerchantCategoryApi(id, body) {
  return apiPatch(`/api/v1/merchant/me/categories/${encodeURIComponent(id)}`, body);
}

export function deleteMerchantCategoryApi(id) {
  return apiDelete(`/api/v1/merchant/me/categories/${encodeURIComponent(id)}`);
}

export function createMerchantMenuItemApi(body) {
  return apiPost('/api/v1/merchant/me/items', body);
}

export function updateMerchantMenuItemApi(id, body) {
  return apiPatch(`/api/v1/merchant/me/items/${encodeURIComponent(id)}`, body);
}

export function deleteMerchantMenuItemApi(id) {
  return apiDelete(`/api/v1/merchant/me/items/${encodeURIComponent(id)}`);
}

export function validateVoucherApi(code, subtotal) {
  return apiPost('/api/v1/vouchers/validate', { code, subtotal });
}

export function fetchMyVouchersApi() {
  return apiGet('/api/v1/me/vouchers');
}

/** Top quán nổi bật — GET /api/v1/home/featured-restaurants */
export function fetchFeaturedRestaurantsApi() {
  return apiGet('/api/v1/home/featured-restaurants');
}

/** Các món thịnh hành — GET /api/v1/home/trending-dishes */
export function fetchTrendingDishesApi() {
  return apiGet('/api/v1/home/trending-dishes');
}

/** Đặt lại món từ lịch sử — GET /api/v1/home/order-again */
export function fetchOrderAgainApi() {
  return apiGet('/api/v1/home/order-again');
}

/** Tìm kiếm kết hợp nhà hàng & món ăn — GET /api/v1/menu-items/search */
export function searchExploreApi(params = {}) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, val]) => {
    if (val !== undefined && val !== null && val !== '') {
      query.set(key, String(val));
    }
  });
  return apiGet(`/api/v1/menu-items/search?${query.toString()}`);
}

/** Lấy chi tiết món ăn — GET /api/v1/menu-items/:id */
export function fetchMenuItemDetailApi(id) {
  return apiGet(`/api/v1/menu-items/${encodeURIComponent(id)}`);

// Wave 5: notifications, merchant finance/settings, admin finance/config, and contextual chat.
export function fetchNotificationsApi({ unread = false, type = 'all', page = 1, limit = 50 } = {}) {
  const params = new URLSearchParams({ page: String(page), limit: String(limit), type });
  if (unread) params.set('unread', 'true');
  return apiGet('/api/v1/me/notifications?' + params.toString());
}

export function markNotificationReadApi(id) {
  return apiPatch('/api/v1/me/notifications/' + encodeURIComponent(id) + '/read', {});
}

export function markAllNotificationsReadApi() {
  return apiPost('/api/v1/me/notifications/read-all', {});
}

export function fetchMerchantWalletApi() {
  return apiGet('/api/v1/merchant/me/wallet');
}

export function requestMerchantPayoutApi(amount) {
  return apiPost('/api/v1/merchant/me/payouts', { amount });
}

export function fetchMerchantSettingsApi() {
  return apiGet('/api/v1/merchant/me/settings');
}

export function updateMerchantSettingsApi(body) {
  return apiPatch('/api/v1/merchant/me/settings', body);
}

export function fetchAdminPayoutsApi({ status = 'all', q = '', page = 1, limit = 20 } = {}) {
  const params = new URLSearchParams({ status, q, page: String(page), limit: String(limit), ownerType: 'merchant' });
  return apiGet('/api/v1/admin/payouts?' + params.toString());
}

export function updateAdminPayoutApi(id, body) {
  return apiPatch('/api/v1/admin/payouts/' + encodeURIComponent(id), body);
}

export function fetchAdminFinancialApi(range = 'month') {
  return apiGet('/api/v1/admin/financial?range=' + encodeURIComponent(range));
}

export function fetchAdminConfigApi() {
  return apiGet('/api/v1/admin/config');
}

export function updateAdminConfigApi(key, value) {
  return apiPatch('/api/v1/admin/config/' + encodeURIComponent(key), { value });
}

export function fetchChatConversationsApi() {
  return apiGet('/api/v1/chat/conversations');
}

export function createOrderConversationApi(orderId, counterpartRole) {
  return apiPost('/api/v1/chat/conversations', { orderId, counterpartRole });
}

export function fetchChatMessagesApi(conversationId, afterId = 0) {
  return apiGet('/api/v1/chat/conversations/' + encodeURIComponent(conversationId) + '/messages?afterId=' + encodeURIComponent(afterId));
}

export function sendChatMessageApi(conversationId, text) {
  return apiPost('/api/v1/chat/conversations/' + encodeURIComponent(conversationId) + '/messages', { text });
}

export function markChatReadApi(conversationId) {
  return apiPost('/api/v1/chat/conversations/' + encodeURIComponent(conversationId) + '/read', {});
}

export function fetchAdminAuditLogs({ action = 'all', targetType = 'all', q = '', page = 1, limit = 20 } = {}) {
  const params = new URLSearchParams({
    action,
    targetType,
    q,
    page: String(page),
    limit: String(limit),
  });
  return apiGet('/api/v1/admin/audit-logs?' + params.toString());
}
