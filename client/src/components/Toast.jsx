import { createPortal } from 'react-dom';
import { useApp } from '../context/AppContext.jsx';
import Icon from './Icon.jsx';
import clsx from 'clsx';

const tones = {
  success: 'border-success text-success',
  error: 'border-error text-error',
  info: 'border-hairline-strong text-ink',
  warning: 'border-accent-warning text-accent-warning',
};

const titleTones = {
  success: 'text-ink',
  error: 'text-ink',
  info: 'text-ink',
  warning: 'text-ink',
};

const icons = {
  success: 'check',
  error: 'alert',
  info: 'bell',
  warning: 'alert',
};

export default function ToastViewport() {
  const { toasts, dismissToast } = useApp();
  if (!toasts || toasts.length === 0) return null;

  const content = (
    // Mobile: top, below safe-area + ~12px breathing room from the mobile top
    // bar. Desktop (md+): original bottom-right anchored stack.
    <div
      role="status"
      aria-live="polite"
      className={clsx(
        'pointer-events-none fixed z-[100] flex flex-col gap-xs',
        // mobile (default)
        'inset-x-base top-[calc(env(safe-area-inset-top,0px)+12px)] items-center',
        // desktop overrides
        'md:inset-x-auto md:top-auto md:bottom-base md:right-base md:items-stretch',
      )}
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          className={clsx(
            'pointer-events-auto flex w-full max-w-[420px] items-start gap-sm rounded-md border bg-surface-card p-sm shadow-soft-md',
            // entrance: from above on mobile, from the right on desktop
            'slide-in-down md:slide-in-right md:w-[320px]',
            tones[t.kind],
          )}
        >
          <div className={clsx('mt-0.5', tones[t.kind])}>
            <Icon name={icons[t.kind]} size={16} />
          </div>
          <div className="flex-1 min-w-0">
            <div className={clsx('text-body-sm font-semibold', titleTones[t.kind])}>{t.title}</div>
            {t.message && <div className="text-caption text-body mt-0.5">{t.message}</div>}
            {t.sound && (
              <div className="mt-1 inline-flex items-center gap-1 text-caption text-body">
                <Icon name="bell" size={12} /> Thông báo âm thanh
              </div>
            )}
            {t.action && (
              <button
                type="button"
                onClick={() => {
                  t.action.onClick?.();
                  dismissToast(t.id);
                }}
                className="mt-1 text-button font-semibold text-text-link underline-offset-2 hover:underline"
              >
                {t.action.label}
              </button>
            )}
          </div>
          <button
            onClick={() => dismissToast(t.id)}
            className="text-body hover:text-ink"
            aria-label="Đóng"
          >
            <Icon name="close" size={14} />
          </button>
        </div>
      ))}
    </div>
  );

  return typeof document !== 'undefined'
    ? createPortal(content, document.body)
    : content;
}
