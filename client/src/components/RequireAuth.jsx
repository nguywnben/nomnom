import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext.jsx';
import { ROLE_HOME } from '../lib/auth.js';

/**
 * Bảo vệ portal theo quyền `user_roles` — không dùng `primary_role`.
 * @param {{ role: 'customer'|'merchant'|'driver'|'admin' }} props
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

  if (!permittedRoles[role]) {
    if (user) {
      if (role === 'merchant') {
        return <Navigate to="/merchant/onboarding" replace />;
      }
      if (role === 'driver') {
        return <Navigate to="/driver/onboarding" replace />;
      }
      const primary = user.primaryRole;
      const primaryHome = ROLE_HOME[primary] ?? '/app';
      const canEnterPrimary =
        primary === 'customer' || Boolean(permittedRoles[primary]);
      return <Navigate to={canEnterPrimary ? primaryHome : '/app'} replace />;
    }
    const next = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?next=${next}`} replace />;
  }

  return <Outlet />;
}
