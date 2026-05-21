import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext.jsx';

/**
 * Bảo vệ portal theo vai trò — chưa đăng nhập thì chuyển /login?next=...
 * @param {{ role: 'customer'|'merchant'|'driver'|'admin' }} props
 */
export default function RequireAuth({ role }) {
  const { authReady, authedRoles } = useApp();
  const location = useLocation();

  if (!authReady) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center p-xl text-body">
        Đang tải phiên đăng nhập…
      </div>
    );
  }

  if (!authedRoles[role]) {
    const next = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?next=${next}`} replace />;
  }

  return <Outlet />;
}
