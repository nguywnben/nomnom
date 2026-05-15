import clsx from 'clsx';

const ROUNDED = {
  none: 'rounded-none',
  xs: 'rounded-xs',
  sm: 'rounded-sm',
  md: 'rounded-md',
  lg: 'rounded-lg',
  xl: 'rounded-xl',
  pill: 'rounded-pill',
  full: 'rounded-full',
};

/**
 * Boneyard-style skeleton: soft neutral base + smooth diagonal shimmer (not abrupt pulse).
 * Uses DESIGN tokens: `hairline-soft` / `surface-strong` / canvas highlight.
 */
export default function Skeleton({
  className,
  rounded = 'md',
  /** Optional margin utility string, e.g. `mt-2` or `mx-auto` */
  margin,
  ...props
}) {
  const r = ROUNDED[rounded] ?? ROUNDED.md;

  return (
    <div
      className={clsx(
        'relative isolate overflow-hidden bg-hairline-soft',
        r,
        margin,
        className,
      )}
      aria-hidden
      {...props}
    >
      {/* Sheen layer — skew + opacity fade matches premium marketing skeletons */}
      <span className="pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]">
        <span
          className={clsx(
            'absolute -inset-y-6 -left-[40%] w-[55%]',
            'bg-gradient-to-r from-transparent via-canvas/80 to-transparent',
            'opacity-0 shadow-[0_0_24px_rgba(255,255,255,0.35)]',
            'animate-skeleton-shimmer',
          )}
        />
      </span>
    </div>
  );
}
