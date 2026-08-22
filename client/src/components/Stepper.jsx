import clsx from 'clsx';
import Icon from './Icon.jsx';

// Stepper — hiển thị tiến trình nhiều bước (1 Giỏ hàng → 2 Thanh toán → 3 Hoàn tất).
// `current` là bước hiện tại (1-based). Trạng thái: done / active / todo.
export default function Stepper({ steps = [], current = 1, className }) {
  return (
    <ol className={clsx('flex items-center gap-0.5', className)} aria-label="Tiến trình">
      {steps.map((step, index) => {
        const n = index + 1;
        const state = n < current ? 'done' : n === current ? 'active' : 'todo';
        return (
          <li key={step.label} className="flex min-w-0 items-center gap-0.5">
            <span
              className={clsx(
                'grid h-6 w-6 shrink-0 place-items-center rounded-pill text-caption font-semibold transition-colors',
                state === 'done' && 'bg-primary text-on-primary',
                state === 'active' && 'bg-primary text-on-primary',
                state === 'todo' && 'bg-surface-strong text-body',
              )}
              aria-current={state === 'active' ? 'step' : undefined}
            >
              {state === 'done' ? <Icon name="check" size={12} /> : n}
            </span>
            <span
              className={clsx(
                'hidden text-caption font-medium sm:inline',
                state === 'active' ? 'text-ink' : 'text-body',
              )}
            >
              {step.label}
            </span>
            {index < steps.length - 1 && (
              <span
                className={clsx(
                  'mx-1 h-px w-4 shrink-0 sm:w-6',
                  n < current ? 'bg-primary' : 'bg-hairline-strong',
                )}
                aria-hidden="true"
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}