import clsx from 'clsx';
import Icon from './Icon.jsx';

// Editorial mock map — dotted grid + isolated SVG route + pulse dot.
// No real map tiles — by design (DESIGN.md says "no atmospheric decoration outside hero").
// Props:
//   stops: [{ id, label, x, y, kind: 'driver' | 'merchant' | 'customer' }]
//   progress: 0-1 along the route
//   variant: 'tall' | 'wide'
export default function MockMap({ stops = [], progress = 0, className, variant = 'wide' }) {
  // Build a smooth path through stops
  const points = stops.map((s) => `${s.x},${s.y}`).join(' L ');
  const dashTotal = 100;
  const dashOffset = (1 - progress) * dashTotal;

  return (
    <div
      className={clsx(
        'relative overflow-hidden rounded-lg border border-hairline-strong map-grid',
        variant === 'tall' ? 'aspect-[3/4]' : 'aspect-[16/9]',
        className,
      )}
    >
      {/* Soft sky wash at the top to anchor the mock UI */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-sky-light/40 to-transparent" />

      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 h-full w-full">
        {/* base route */}
        <path
          d={`M ${points}`}
          fill="none"
          stroke="#dcdee0"
          strokeWidth="0.6"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray="2 2"
        />
        {/* progress route */}
        <path
          d={`M ${points}`}
          fill="none"
          stroke="#171717"
          strokeWidth="0.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          pathLength={dashTotal}
          strokeDasharray={dashTotal}
          strokeDashoffset={dashOffset}
          style={{ transition: 'stroke-dashoffset 600ms ease' }}
        />
      </svg>

      {stops.map((s) => (
        <Stop key={s.id} {...s} />
      ))}

      {/* Mock compass badge */}
      <div className="absolute right-base top-base inline-flex items-center gap-1 rounded-pill border border-hairline-strong bg-surface-card px-2 py-1 text-caption text-body">
        <Icon name="pin" size={12} />
        Lộ trình trực tiếp
      </div>
    </div>
  );
}

function Stop({ x, y, kind, label }) {
  const isDriver = kind === 'driver';
  const isMerchant = kind === 'merchant';

  return (
    <div
      className="absolute -translate-x-1/2 -translate-y-1/2"
      style={{ left: `${x}%`, top: `${y}%` }}
    >
      <div className="relative flex flex-col items-center">
        <div
          className={clsx(
            'grid h-8 w-8 place-items-center rounded-full border-2',
            isDriver
              ? 'border-primary bg-surface-card text-ink'
              : isMerchant
                ? 'border-ink bg-primary text-on-primary'
                : 'border-ink bg-canvas text-ink',
          )}
        >
          <Icon name={isDriver ? 'bike' : isMerchant ? 'store' : 'pin'} size={14} />
        </div>
        {isDriver && (
          <span className="pulse-dot absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-success" />
        )}
        {label && (
          <span className="mt-1 rounded-sm border border-hairline-strong bg-surface-card px-1.5 py-0.5 text-caption text-ink">
            {label}
          </span>
        )}
      </div>
    </div>
  );
}
