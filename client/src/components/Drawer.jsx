import { useEffect } from 'react';
import clsx from 'clsx';
import Icon from './Icon.jsx';
import { useBodyScrollLock } from '../hooks/useBodyScrollLock.js';

// Responsive drawer with three sides:
//   • side="right" — bottom-sheet on mobile, right-anchored slide-in on desktop
//   • side="left"  — slides in from the left on every viewport (hamburger drawer)
//   • side="bottom"— always bottom-sheet
//
// Mobile bottom sheets use rounded-t-xxl (24px) + grab handle + safe-area pad.
export default function Drawer({
  open,
  onClose,
  title,
  side = 'right',
  width = 'md',
  children,
  footer,
}) {
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

  // ---- side="left" — left-anchored on every viewport
  if (side === 'left') {
    return (
      <div className="fixed inset-0 z-50 flex">
        <aside
          className={clsx(
            'flex h-full max-w-[88vw] flex-col border-r border-hairline-strong bg-surface-card slide-in-left',
            width === 'sm' && 'w-[280px]',
            width === 'md' && 'w-[300px]',
            width === 'lg' && 'w-[340px]',
          )}
        >
          <DrawerHeader title={title} onClose={onClose} />
          <div className="flex-1 overflow-y-auto">{children}</div>
          {footer && <footer className="border-t border-hairline px-lg py-base">{footer}</footer>}
        </aside>
        <button
          aria-label="Dismiss"
          onClick={onClose}
          className="flex-1 bg-ink/30 backdrop-blur-[1px] fade-in"
        />
      </div>
    );
  }

  // ---- side="bottom" — always bottom-sheet
  if (side === 'bottom') {
    return (
      <div className="fixed inset-0 z-50 flex flex-col">
        <button
          aria-label="Dismiss"
          onClick={onClose}
          className="flex-1 bg-ink/30 backdrop-blur-[1px] fade-in"
        />
        <aside className="max-h-[88vh] w-full overflow-hidden rounded-t-xxl border-t border-hairline-strong bg-surface-card slide-in-up">
          <div className="flex justify-center pt-2">
            <div className="h-1 w-10 rounded-pill bg-hairline-strong" />
          </div>
          <DrawerHeader title={title} onClose={onClose} />
          <div className="overflow-y-auto">{children}</div>
          {footer && <footer className="border-t border-hairline px-lg py-base">{footer}</footer>}
          <div className="pb-safe" />
        </aside>
      </div>
    );
  }

  // ---- side="right" — bottom sheet on mobile, right-drawer on desktop
  return (
    <div className="fixed inset-0 z-50 flex flex-col md:flex-row md:items-stretch md:justify-end">
      <button
        aria-label="Dismiss"
        onClick={onClose}
        className="flex-1 bg-ink/30 backdrop-blur-[1px] fade-in md:flex-1"
      />
      <aside
        className={clsx(
          'flex w-full flex-col overflow-hidden bg-surface-card',
          // Mobile: bottom sheet
          'max-h-[88vh] rounded-t-xxl border-t border-hairline-strong slide-in-up',
          // Desktop: right slide
          'md:max-h-none md:h-full md:rounded-none md:border-l md:border-t-0 md:slide-in-right',
          width === 'sm' && 'md:w-[360px]',
          width === 'md' && 'md:w-[440px]',
          width === 'lg' && 'md:w-[560px]',
        )}
      >
        <div className="flex justify-center pt-2 md:hidden">
          <div className="h-1 w-10 rounded-pill bg-hairline-strong" />
        </div>
        <DrawerHeader title={title} onClose={onClose} />
        <div className="flex-1 overflow-y-auto">{children}</div>
        {footer && (
          <footer className="border-t border-hairline px-lg py-base pb-safe md:pb-base">{footer}</footer>
        )}
      </aside>
    </div>
  );
}

function DrawerHeader({ title, onClose }) {
  return (
    <header className="flex items-center justify-between border-b border-hairline px-lg py-base">
      <h2 className="text-display-sm text-ink">{title}</h2>
      <button
        onClick={onClose}
        className="grid h-11 w-11 place-items-center rounded-md text-body hover:bg-canvas-soft hover:text-ink md:h-9 md:w-9"
        aria-label="Close"
      >
        <Icon name="close" size={18} />
      </button>
    </header>
  );
}
