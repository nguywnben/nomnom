/**
 * Gộp primary_role vào danh sách roles từ user_roles.
 * Đảm bảo user có quyền portal khớp với primary_role (vd. admin vào /admin).
 */
export function mergeUserRoles(primaryRole, roles = []) {
  const set = new Set(roles ?? []);
  if (primaryRole) {
    set.add(primaryRole);
  }
  return [...set].sort();
}
