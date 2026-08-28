import { useNavigate } from 'react-router-dom';
import Icon from '../../../components/Icon.jsx';

// Shared mobile-first sub-header used across /app/profile/* sub-pages.
export default function ProfileSubHeader({ title, eyebrow = 'Tài khoản', backTo, backLabel = 'Quay lại' }) {
  const nav = useNavigate();
  const onBack = () => {
    if (backTo) {
      nav(backTo);
    } else if (window.history.length > 1) {
      nav(-1);
    } else {
      nav('/app/profile');
    }
  };

  return (
    <>
      {/* Mobile compact sticky bar */}
      <header className="sticky top-14 z-20 -mx-base mb-2 flex h-14 items-center gap-1 border-b border-hairline bg-canvas/95 px-base backdrop-blur md:hidden">
        <button
          type="button"
          onClick={onBack}
          aria-label={backLabel}
          className="grid h-10 w-10 place-items-center rounded-md text-ink hover:bg-canvas-soft"
        >
          <Icon name="chevronLeft" size={18} />
        </button>
        <div className="text-title-md text-ink truncate">{title}</div>
      </header>

      {/* Desktop editorial header */}
      <div className="hidden md:block md:mb-base">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1 text-button text-body hover:text-ink transition-colors"
        >
          <Icon name="chevronLeft" size={14} /> {backLabel}
        </button>
        <div className="mt-2 text-caption-uppercase text-body">{eyebrow}</div>
        <h1 className="text-display-lg text-ink">{title}</h1>
      </div>
    </>
  );
}
