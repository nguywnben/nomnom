import { Link } from 'react-router-dom';
import Logo from '../../components/Logo.jsx';
import { helpers } from '../../data/mock.js';

// ---------------------------------------------------------------------------
// Khung 2 cột cho mọi trang xác thực (đăng nhập / đăng ký / quên mật khẩu /
// nhập OTP). Trái: form. Phải: ảnh + slogan (desktop only).
// Khớp theo bảng `users` + `otp_codes` trong database.sql.
// ---------------------------------------------------------------------------
const SIDE_BG = helpers.unsplash('photo-1504674900247-0877df9cc836', 1400);

export default function AuthLayout({ title, subtitle, children, footer }) {
  return (
    <div className="grid min-h-[100dvh] grid-cols-1 bg-canvas lg:grid-cols-[1fr_1.05fr]">
      {/* Form column */}
      <div className="flex min-h-[100dvh] flex-col">
        <header className="flex items-center justify-between px-base py-base md:px-xl">
          <Link to="/" aria-label="Về trang chủ NomNom">
            <Logo size="sm" />
          </Link>
          <Link to="/" className="text-button text-body hover:text-ink">
            Về trang chủ
          </Link>
        </header>

        <main className="flex flex-1 items-center justify-center px-base pb-xl md:px-xl">
          <div className="w-full max-w-md">
            <div className="mb-lg">
              <h1 className="text-display-md text-ink md:text-display-lg">{title}</h1>
              {subtitle && (
                <p className="mt-xs text-body-md text-body">{subtitle}</p>
              )}
            </div>
            {children}
          </div>
        </main>

        {footer && (
          <footer className="border-t border-hairline px-base py-md text-caption text-body md:px-xl">
            {footer}
          </footer>
        )}
      </div>

      {/* Hero column */}
      <aside
        className="relative hidden overflow-hidden lg:block"
        style={{
          backgroundImage: `url(${SIDE_BG})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
        aria-hidden="true"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-ink/75 via-ink/55 to-ink/80" />
        <div className="relative z-10 flex h-full flex-col justify-between p-xxl text-on-dark">
          <div className="text-caption-uppercase text-on-dark-soft">NomNom · Đặt món online</div>
          <div className="max-w-md">
            <div className="text-display-md leading-tight md:text-display-lg">
              Bữa ăn tiếp theo của bạn chỉ cách một lần đăng nhập.
            </div>
            <p className="mt-base text-body-md text-on-dark-soft">
              Hơn 2.000 quán trong khu vực bạn ở — theo dõi đơn hàng từng bước,
              thanh toán an toàn, giao nhanh trong 30 phút.
            </p>
          </div>
          <div className="text-caption text-on-dark-soft">
            © 2026 NomNom · Bảo mật theo tiêu chuẩn.
          </div>
        </div>
      </aside>
    </div>
  );
}
