import { useEffect } from 'react';
import clsx from 'clsx';
import Icon from './Icon.jsx';
import { useBodyScrollLock } from '../hooks/useBodyScrollLock.js';

// Responsive overlay:
//   • Mobile (<768px): bottom-sheet — anchored to bottom, slides up,
//     rounded-t-xxl (24px), grab handle, max-h 88vh.
//   • Desktop (>=768px): centered card, rounded-lg (12px).
// Touch targets: close button is 44px square.
export default function Modal({ open, onClose, title, children, footer, size = 'md', hideHeader = false }) {
  useBodyScrollLock(open);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === 'Escape' && onClose?.();
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex flex-col md:items-center md:justify-center">
      {/* Backdrop — fills upper area on mobile, full-screen behind on desktop */}
      <button
        aria-label="Đóng"
        onClick={onClose}
        className="flex-1 bg-ink/30 backdrop-blur-[1px] fade-in md:absolute md:inset-0 md:flex-none"
      />

      {/* Sheet / Modal — same component, responsive shape */}
      <div
        role="dialog"
        aria-modal="true"
        className={clsx(
          'relative z-10 flex w-full flex-col overflow-hidden bg-surface-card slide-in-up shadow-soft-lg',
          // Mobile: full-width sheet at the bottom
          'max-h-[88vh] rounded-t-xxl border-t border-hairline-strong',
          // Desktop: centered modal
          'md:mx-base md:rounded-lg md:border md:border-hairline-strong md:max-h-[92vh] md:slide-in-up',
          size === 'sm' && 'md:max-w-md',
          size === 'md' && 'md:max-w-lg',
          size === 'lg' && 'md:max-w-2xl',
          size === 'xl' && 'md:max-w-3xl',
        )}
      >
        {/* Grab handle (mobile only) */}
        <div className="flex justify-center pt-2 md:hidden">
          <div className="h-1 w-10 rounded-pill bg-hairline-strong" />
        </div>

        {!hideHeader && (
          <header className="flex items-center justify-between px-lg pt-base pb-base md:pt-lg">
          <h2 className="text-display-sm text-ink">{title}</h2>
          <button
            onClick={onClose}
            className="grid h-11 w-11 place-items-center rounded-md text-body hover:bg-canvas-soft hover:text-ink md:h-9 md:w-9"
            aria-label="Đóng"
          >
            <Icon name="close" size={18} />
          </button>
          </header>
        )}
        <div className="overflow-y-auto px-lg pb-lg">{children}</div>
        {footer && (
          <footer className="flex flex-col items-stretch gap-xs border-t border-hairline px-lg py-base md:flex-row md:items-center md:justify-end">
            {footer}
          </footer>
        )}
        {/* Safe area for iOS home indicator */}
        <div className="pb-safe md:hidden" />
      </div>
    </div>
  );
}
