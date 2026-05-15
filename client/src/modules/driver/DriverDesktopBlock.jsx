import { Link } from 'react-router-dom';
import Button from '../../components/Button.jsx';

/** Public store / landing URL for the native driver app (override via env in production). */
const DRIVER_APP_DOWNLOAD_URL =
  import.meta.env.VITE_DRIVER_APP_URL ?? 'https://example.com/nomnom-driver-app';

const downloadLinkProps =
  DRIVER_APP_DOWNLOAD_URL.startsWith('http') ?
    { target: '_blank', rel: 'noopener noreferrer' }
  : {};

/**
 * Desktop web (>= 1024px): editorial blocking screen — no phone chrome.
 * Tokens: {colors.canvas}, {colors.ink}, {spacing.section}, {typography.display-lg},
 * {component.button-primary}.
 */
export default function DriverDesktopBlock() {
  return (
    <div className="min-h-[100dvh] bg-canvas text-ink">
      <div className="mx-auto flex min-h-[100dvh] max-w-lg flex-col justify-center px-base py-section">
        <h1 className="text-display-lg text-ink">Thiết bị không phù hợp</h1>
        <p className="mt-md max-w-md text-body-md text-body">
          Ứng dụng tài xế được thiết kế dành riêng cho trải nghiệm di động. Vui lòng sử dụng điện thoại hoặc tải
          ứng dụng chính thức để tiếp tục công việc của bạn.
        </p>
        <div className="mt-xl">
          <Button
            as="a"
            href={DRIVER_APP_DOWNLOAD_URL}
            size="lg"
            className="w-full sm:w-auto"
            {...downloadLinkProps}
          >
            Tải app cho tài xế
          </Button>
        </div>
        <p className="mt-base">
          <Link to="/" className="text-body-sm text-body underline decoration-hairline-strong underline-offset-4 hover:text-ink">
            Về trang chủ
          </Link>
        </p>
      </div>
    </div>
  );
}
