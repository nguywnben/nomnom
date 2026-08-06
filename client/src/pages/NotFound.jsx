import { Link } from 'react-router-dom';
import Button from '../components/Button.jsx';
import Icon from '../components/Icon.jsx';
import Logo from '../components/Logo.jsx';

// 404 fallback — dùng cho mọi route không khớp.
export default function NotFoundPage() {
  return (
    <div className="flex min-h-[100dvh] flex-col bg-canvas">
      <header className="flex items-center justify-between px-base py-base md:px-xl">
        <Link to="/" aria-label="Về trang chủ NomNom">
          <Logo size="sm" />
        </Link>
        <Link to="/" className="text-button text-body hover:text-ink">
          Về trang chủ
        </Link>
      </header>

      <main className="flex flex-1 items-center justify-center px-base">
        <div className="max-w-md text-center">
          <span className="mx-auto grid h-20 w-20 place-items-center rounded-pill bg-canvas-soft text-ink">
            <Icon name="search" size={32} />
          </span>
          <div className="mt-base text-display-lg text-ink">404</div>
          <h1 className="mt-1 text-display-md text-ink">Không tìm thấy trang</h1>
          <p className="mt-xs text-body-md text-body">
            Đường dẫn bạn vừa mở có thể đã đổi, đã xóa hoặc chưa từng tồn tại.
          </p>
          <div className="mt-md flex flex-col items-center justify-center gap-2 md:flex-row">
            <Button as={Link} to="/" trailingIcon="arrowRight">
              Về trang chủ
            </Button>
            <Button as={Link} to="/app/search" variant="secondary" leadingIcon="search">
              Tìm món ngay
            </Button>
          </div>
        </div>
      </main>

      <footer className="border-t border-hairline px-base py-md text-caption text-body md:px-xl">
        Nếu bạn nghĩ đây là lỗi của chúng tôi, hãy{' '}
        <Link to="/faq" className="text-text-link hover:underline">liên hệ hỗ trợ</Link>.
      </footer>
    </div>
  );
}
