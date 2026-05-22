import { Navigate, Outlet } from 'react-router-dom';
import { useApp } from '../context/AppContext.jsx';

/**
 * Chặn trang khách (login, register, …) khi đã có phiên đăng nhập.
 */
export default function RedirectIfAuthed({ to = '/app' }) {
  const { authReady, user } = useApp();

  if (!authReady) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center p-xl text-body">
        Đang tải phiên đăng nhập…
      </div>
    );
  }

  if (user) {
    return <Navigate to={to} replace />;
  }

  return <Outlet />;
}
