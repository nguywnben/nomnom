/**
 * Chuẩn hóa danh sách role từ bảng `user_roles`.
 * `primary_role` không được gộp vào — dùng riêng cho hiển thị / chuyển hướng UI.
 */
export function normalizeRoles(roles = []) {
  return [...new Set(roles ?? [])].sort();
}

export function hasRole(roles, role) {
  return (roles ?? []).includes(role);
}
