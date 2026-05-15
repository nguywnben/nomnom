import clsx from 'clsx';
import Icon from './Icon.jsx';
import Card from './Card.jsx';

// Compact stat card used across dashboards.
//   Title (caption-uppercase, body)
//   Value (display-md, ink)
//   Delta (caption, success/error)
export default function StatCard({ label, value, delta, deltaTone = 'success', icon, sub, dark }) {
  return (
    <Card variant={dark ? 'dark' : 'default'} padded className="flex flex-col gap-sm">
      <div className="flex items-center justify-between">
        <span className={clsx('text-caption-uppercase', dark ? 'text-on-dark-soft' : 'text-body')}>
          {label}
        </span>
        {icon && (
          <span
            className={clsx(
              'grid h-8 w-8 place-items-center rounded-md',
              dark ? 'bg-surface-dark-elevated text-on-dark-soft' : 'bg-surface-strong text-body',
            )}
          >
            <Icon name={icon} size={16} />
          </span>
        )}
      </div>
      <div className={clsx('text-display-md nums leading-none', dark ? 'text-on-dark' : 'text-ink')}>
        {value}
      </div>
      {(delta || sub) && (
        <div className="flex items-center gap-2">
          {delta && (
            <span
              className={clsx(
                'text-caption font-medium',
                deltaTone === 'success' ? 'text-success' : deltaTone === 'error' ? 'text-error' : 'text-body',
              )}
            >
              {delta}
            </span>
          )}
          {sub && (
            <span className={clsx('text-caption', dark ? 'text-on-dark-soft' : 'text-body')}>{sub}</span>
          )}
        </div>
      )}
    </Card>
  );
}
