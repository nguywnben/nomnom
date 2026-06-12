/** @typedef {'customer'|'merchant'|'driver'|'admin'} Role */

/** Quyền truy cập portal — chỉ từ bảng `user_roles`, không gồm `primary_role`. */
export function buildPermittedRoles(roles) {
  const set = new Set(roles ?? []);
  return {
    customer: set.has('customer'),
    merchant: set.has('merchant'),
    driver: set.has('driver'),
    admin: set.has('admin'),
  };
}

/** @deprecated Dùng `buildPermittedRoles` — giữ tạm để tránh gãy import cũ. */
export function buildAuthedRoles(roles) {
  return buildPermittedRoles(roles);
}

/** Đường dẫn đăng nhập kèm quay lại trang trước (dùng trong /app). */
export function loginHref(nextPath = '/app') {
  return `/login?next=${encodeURIComponent(nextPath)}`;
}

export const ROLE_HOME = {
  customer: '/app',
  merchant: '/merchant',
  driver: '/driver',
  admin: '/admin',
};

/**
 * Sau đăng nhập: ưu tiên `next` nếu có; không thì theo `primary_role`.
 * @param {string|null} nextPath
 * @param {{ primaryRole: Role, roles: Role[] }} user
 */
export function resolveLoginRedirect(nextPath, user) {
  if (nextPath) {
    return nextPath;
  }
  return ROLE_HOME[user.primaryRole] ?? '/app';
}
