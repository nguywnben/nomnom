/** @typedef {'customer'|'merchant'|'admin'} Role */

/** Quyền truy cập portal — chỉ từ bảng `user_roles`, không gồm `primary_role`. */
export function buildPermittedRoles(roles) {
  const set = new Set(roles ?? []);
  return {
    customer: set.has('customer'),
    merchant: set.has('merchant'),
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
  admin: '/admin',
};

/**
 * Sau đăng nhập: ưu tiên `next` nếu user có quyền portal tương ứng.
 * @param {string|null} nextPath
 * @param {{ primaryRole: Role, roles: Role[] }} user
 */
export function resolveLoginRedirect(nextPath, user) {
  const roles = Array.isArray(user?.roles) ? user.roles : [];
  if (nextPath) {
    if (nextPath.startsWith('/admin') && roles.includes('admin')) return nextPath;
    if (nextPath.startsWith('/merchant')) {
      if (nextPath === '/merchant/onboarding' || nextPath === '/merchant/pending') return nextPath;
      if (roles.includes('merchant')) return nextPath;
    }
    if (nextPath.startsWith('/app') && roles.length > 0) return nextPath;
    if (
      !nextPath.startsWith('/admin') &&
      !nextPath.startsWith('/merchant') &&
      !nextPath.startsWith('/app')
    ) {
      return nextPath;
    }
  }
  return ROLE_HOME[user.primaryRole] ?? '/app';
}
