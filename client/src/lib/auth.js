/** @typedef {'customer'|'merchant'|'driver'|'admin'} Role */

export function buildAuthedRoles(roles, primaryRole) {
  const set = new Set(roles ?? []);
  if (primaryRole) {
    set.add(primaryRole);
  }
  return {
    customer: set.has('customer'),
    merchant: set.has('merchant'),
    driver: set.has('driver'),
    admin: set.has('admin'),
  };
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
 * Sau đăng nhập: ưu tiên `next` nếu user có quyền portal tương ứng.
 * @param {string|null} nextPath
 * @param {{ primaryRole: Role, roles: Role[] }} user
 */
export function resolveLoginRedirect(nextPath, user) {
  if (nextPath) {
    return nextPath;
  }
  return ROLE_HOME[user.primaryRole] ?? '/app';
}
