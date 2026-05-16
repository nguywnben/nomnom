import { Link } from 'react-router-dom';
import Icon from '../../../components/Icon.jsx';

// Shared mobile-first sub-header used across /app/profile/* sub-pages.
//
// Mobile (<md):
//   • A compact 56px sticky bar with a chevron back button + page title.
//   • Sits flush below the global <MobileTopBar /> (which is also sticky).
// Desktop (≥md):
//   • Becomes editorial: a small "Hồ sơ ›" eyebrow + display-lg title.
//   • Back chevron stays visible above the eyebrow as a quiet text link.
export default function ProfileSubHeader({ title, eyebrow = 'Tài khoản' }) {
  return (
    <>
      {/* Mobile compact sticky bar */}
      <header className="sticky top-14 z-20 -mx-base mb-2 flex h-14 items-center gap-1 border-b border-hairline bg-canvas/95 px-base backdrop-blur md:hidden">
        <Link
          to="/app/profile"
          aria-label="Quay lại hồ sơ"
          className="grid h-10 w-10 place-items-center rounded-md text-ink hover:bg-canvas-soft"
        >
          <Icon name="chevronLeft" size={18} />
        </Link>
        <div className="text-title-md text-ink truncate">{title}</div>
      </header>

      {/* Desktop editorial header */}
      <div className="hidden md:block md:mb-base">
        <Link
          to="/app/profile"
          className="inline-flex items-center gap-1 text-button text-body hover:text-ink"
        >
          <Icon name="chevronLeft" size={14} /> Quay lại hồ sơ
        </Link>
        <div className="mt-2 text-caption-uppercase text-body">{eyebrow}</div>
        <h1 className="text-display-lg text-ink">{title}</h1>
      </div>
    </>
  );
}
