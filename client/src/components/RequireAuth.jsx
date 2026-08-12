import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext.jsx';
import { ROLE_HOME } from '../lib/auth.js';

/**
 * Bảo vệ trang theo quyền `user_roles` — không dùng `primary_role`.
 * Khi không truyền `role`, chỉ yêu cầu đăng nhập.
 * @param {{ role?: 'customer'|'merchant'|'admin' }} props
 */
export default function RequireAuth({ role }) {
  const { authReady, permittedRoles, user } = useApp();
  const location = useLocation();

  if (!authReady) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center p-xl text-body">
        Đang tải phiên đăng nhập…
      </div>
    );
  }

  if (!user) {
    const next = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?next=${next}`} replace />;
  }

  if (role && !permittedRoles[role]) {
    if (role === 'merchant') return <Navigate to="/merchant/onboarding" replace />;
    const primary = user.primaryRole;
    const primaryHome = ROLE_HOME[primary] ?? '/app';
    const canEnterPrimary =
      primary === 'customer' || Boolean(permittedRoles[primary]);
    return <Navigate to={canEnterPrimary ? primaryHome : '/app'} replace />;
  }

  return <Outlet />;
}
