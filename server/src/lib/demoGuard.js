export const PROTECTED_DEMO_EMAILS = Object.freeze([
  'admin@nomnom.local',
  'khachhang@nomnom.local',
  'nhahang@nomnom.local',
  'avery@nomnom.example',
  'mara@example.com',
  'owner@cinque.example',
]);

export const PROTECTED_DEMO_USER_IDS = Object.freeze([1, 2, 7]);
export const PROTECTED_DEMO_RESTAURANT_IDS = Object.freeze([1, 2, 3]);

export function normalizeEmail(email) {
  return String(email ?? '').trim().toLowerCase();
}

export function isProtectedDemoEmail(email) {
  if (!email) return false;
  const normalized = normalizeEmail(email);
  return PROTECTED_DEMO_EMAILS.includes(normalized);
}

export function isProtectedDemoUserId(userId) {
  if (userId === null || userId === undefined) return false;
  const numericId = Number(userId);
  return PROTECTED_DEMO_USER_IDS.includes(numericId);
}

export function isProtectedDemoRestaurantId(restaurantId) {
  if (restaurantId === null || restaurantId === undefined) return false;
  const numericId = Number(restaurantId);
  return PROTECTED_DEMO_RESTAURANT_IDS.includes(numericId);
}

export function assertNotProtectedDemoUser({ userId, email } = {}) {
  if (isProtectedDemoUserId(userId) || isProtectedDemoEmail(email)) {
    const error = new Error('Tài khoản trải nghiệm mẫu được bảo vệ, không thể thay đổi mật khẩu hoặc thông tin nhạy cảm.');
    error.status = 403;
    error.code = 'DEMO_ACCOUNT_PROTECTED';
    throw error;
  }
}

export function assertNotProtectedDemoRestaurant(restaurantId) {
  if (isProtectedDemoRestaurantId(restaurantId)) {
    const error = new Error('Quán ăn mẫu được bảo vệ cho trải nghiệm chung, không thể xóa hoặc khóa.');
    error.status = 403;
    error.code = 'DEMO_RESTAURANT_PROTECTED';
    throw error;
  }
}
