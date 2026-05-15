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
  return (
    <div className="pointer-events-none fixed bottom-base right-base z-50 flex flex-col gap-xs">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={clsx(
            'pointer-events-auto flex w-[320px] items-start gap-sm rounded-md border bg-surface-card p-sm shadow-soft-md slide-in-right',
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
}
