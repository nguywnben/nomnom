import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext.jsx';
import { resolveLoginRedirect } from '../lib/auth.js';

/**
 * Chặn trang khách (login, register, …) khi đã có phiên đăng nhập.
 */
export default function RedirectIfAuthed() {
  const { authReady, user } = useApp();
  const location = useLocation();

  if (!authReady) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center p-xl text-body">
        Đang tải phiên đăng nhập…
      </div>
    );
  }

  if (user) {
    const searchParams = new URLSearchParams(location.search);
    const nextPath = searchParams.get('next');
    const target = resolveLoginRedirect(nextPath, user);
    return <Navigate to={target} replace />;
  }

  return <Outlet />;
}
