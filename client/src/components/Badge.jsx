import clsx from 'clsx';

// badge-pill — DESIGN.md
//   bg surface-strong / text ink / caption-uppercase / rounded-pill / pad 4x10

const tones = {
  default: 'bg-surface-strong text-ink',
  dark: 'bg-surface-dark text-on-dark',
  outline: 'bg-canvas border border-hairline-strong text-ink',
  success: 'bg-[#e6f4ea] text-success',
  error: 'bg-[#fbeaea] text-error',
  warning: 'bg-[#fbf1de] text-accent-warning',
  preview: 'bg-[#f1e8f7] text-accent-preview',
  live: 'bg-[#e6f4ea] text-success',
};

export default function Badge({ children, tone = 'default', upper = true, dot = false, className }) {
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1 rounded-pill px-2.5 py-0.5',
        upper ? 'text-caption-uppercase' : 'text-caption font-medium',
        tones[tone],
        className,
      )}
    >
      {dot && (
        <span
          className={clsx(
            'inline-block h-1.5 w-1.5 rounded-full',
            tone === 'success' || tone === 'live'
              ? 'bg-success'
              : tone === 'error'
                ? 'bg-error'
                : tone === 'warning'
                  ? 'bg-accent-warning'
                  : 'bg-ink',
            tone === 'live' && 'pulse-dot',
          )}
        />
      )}
      {children}
    </span>
  );
}
