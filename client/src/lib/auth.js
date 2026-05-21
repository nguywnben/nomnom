/** @typedef {'customer'|'merchant'|'driver'|'admin'} Role */

export function buildAuthedRoles(roles) {
  const set = new Set(roles ?? []);
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
  const roles = user.roles ?? [];
  if (nextPath) {
    if (nextPath.startsWith('/admin') && roles.includes('admin')) return nextPath;
    if (nextPath.startsWith('/merchant') && roles.includes('merchant')) return nextPath;
    if (nextPath.startsWith('/driver') && roles.includes('driver')) return nextPath;
    if (nextPath.startsWith('/app') && roles.includes('customer')) return nextPath;
    if (
      !nextPath.startsWith('/admin') &&
      !nextPath.startsWith('/merchant') &&
      !nextPath.startsWith('/driver') &&
      !nextPath.startsWith('/app')
    ) {
      return nextPath;
    }
  }
  return ROLE_HOME[user.primaryRole] ?? '/app';
}
