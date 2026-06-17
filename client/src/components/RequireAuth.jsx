import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext.jsx';

/**
 * Bảo vệ portal theo vai trò — chưa đăng nhập thì chuyển /login?next=...
 * @param {{ role: 'customer'|'merchant'|'driver'|'admin' }} props
 */
export default function RequireAuth({ role }) {
  const { authReady, authedRoles, user } = useApp();
  const location = useLocation();

  if (!authReady) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center p-xl text-body">
        Đang tải phiên đăng nhập…
      </div>
    );
  }

  if (!authedRoles[role]) {
    if (user) {
      if (role === 'merchant') {
        return <Navigate to="/merchant/onboarding" replace />;
      }
      if (role === 'driver') {
        return <Navigate to="/driver/onboarding" replace />;
      }
    }
    const next = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?next=${next}`} replace />;
  }

  return <Outlet />;
}
