import clsx from 'clsx';

export default function Switch({ checked, onChange, label, hint, size = 'md', className }) {
  const w = size === 'lg' ? 'w-12 h-7' : 'w-10 h-6';
  const dot = size === 'lg' ? 'h-6 w-6' : 'h-5 w-5';
  const offset = size === 'lg' ? 'translate-x-5' : 'translate-x-4';
  return (
    <label className={clsx('inline-flex items-center gap-3 cursor-pointer select-none', className)}>
      <span
        className={clsx(
          'relative inline-flex items-center rounded-pill border transition-colors',
          w,
          checked
            ? 'bg-primary border-primary'
            : 'bg-surface-strong border-hairline-strong',
        )}
      >
        <span
          className={clsx(
            'absolute left-0.5 top-1/2 -translate-y-1/2 transform rounded-full bg-canvas shadow-soft transition-transform',
            dot,
            checked && offset,
          )}
        />
      </span>
      {label && (
        <span className="flex flex-col leading-tight">
          <span className="text-body-sm text-ink font-medium">{label}</span>
          {hint && <span className="text-caption text-body">{hint}</span>}
        </span>
      )}
      <input
        type="checkbox"
        className="sr-only"
        checked={checked}
        onChange={(e) => onChange?.(e.target.checked)}
      />
    </label>
  );
}
