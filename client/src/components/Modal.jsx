import { useEffect, useRef } from 'react';
import clsx from 'clsx';
import Icon from './Icon.jsx';
import { useBodyScrollLock } from '../hooks/useBodyScrollLock.js';

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

// Responsive overlay:
//   • Mobile (<768px): bottom-sheet — anchored to bottom, slides up,
//     rounded-t-xxl (24px), grab handle, max-h 88vh.
//   • Desktop (>=768px): centered card, rounded-lg (12px).
// Touch targets: close button is 44px square.
//
// Accessibility: Escape đóng, scroll lock, focus trap trong dialog,
// restore focus về phần tử kích hoạt khi đóng.
export default function Modal({ open, onClose, title, children, footer, size = 'md', hideHeader = false }) {
  useBodyScrollLock(open);
  const dialogRef = useRef(null);
  const restoreFocusRef = useRef(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!open) return undefined;
    restoreFocusRef.current = document.activeElement;
    return () => {
      restoreFocusRef.current?.focus?.();
      restoreFocusRef.current = null;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;
    const dialog = dialogRef.current;
    if (!dialog) return undefined;

    // Chỉ tự động focus một lần khi mở modal nếu con trỏ chưa nằm trong modal
    if (!dialog.contains(document.activeElement)) {
      const autoEl = dialog.querySelector('[autofocus]:not([disabled])');
      const inputEl = dialog.querySelector(
        'input:not([disabled]):not([type="hidden"]), textarea:not([disabled]), select:not([disabled])'
      );
      const contentAction = dialog.querySelector(
        '.overflow-y-auto button:not([disabled]), footer button:not([disabled])'
      );
      const firstEl = dialog.querySelector(FOCUSABLE);
      (autoEl || inputEl || contentAction || firstEl || dialog)?.focus?.();
    }

    const onKey = (e) => {
      if (e.key === 'Escape') {
        onCloseRef.current?.();
        return;
      }
      if (e.key !== 'Tab' || !dialog) return;
      const focusables = Array.from(dialog.querySelectorAll(FOCUSABLE)).filter(
        (el) => el.offsetParent !== null || el === document.activeElement,
      );
      if (focusables.length === 0) {
        e.preventDefault();
        dialog.focus();
        return;
      }
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement;
      if (e.shiftKey && (active === first || active === dialog)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex flex-col md:items-center md:justify-center">
      {/* Backdrop — fills upper area on mobile, full-screen behind on desktop */}
      <button
        type="button"
        aria-label="Đóng"
        onClick={onClose}
        className="flex-1 bg-ink/30 backdrop-blur-[1px] fade-in md:absolute md:inset-0 md:flex-none"
      />

      {/* Sheet / Modal — same component, responsive shape */}
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
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
              type="button"
              onClick={onClose}
              className="grid h-11 w-11 place-items-center rounded-md text-body hover:bg-canvas-soft hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-primary md:h-9 md:w-9"
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