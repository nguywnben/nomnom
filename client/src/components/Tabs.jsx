import clsx from 'clsx';

export default function Tabs({ items, value, onChange, className }) {
  return (
    <div
      role="tablist"
      className={clsx(
        'inline-flex w-fit max-w-full items-center gap-1 rounded-md border border-hairline-strong bg-surface-card p-1',
        className,
      )}
    >
      {items.map((it) => {
        const active = value === it.value;
        return (
          <button
            key={it.value}
            role="tab"
            aria-selected={active}
            onClick={() => onChange?.(it.value)}
            className={clsx(
              'h-8 rounded-sm px-sm text-button transition-colors',
              active ? 'bg-primary text-on-primary' : 'text-ink hover:bg-canvas-soft',
            )}
          >
            {it.label}
          </button>
        );
      })}
    </div>
  );
}
