import clsx from 'clsx';
import { forwardRef } from 'react';
import Icon from './Icon.jsx';

// text-input — DESIGN.md
//   bg surface-card / text ink / rounded-md / height 44 / pad 12x16
//   border 1px hairline-strong / focus 2px ink

const Input = forwardRef(function Input(
  { className, fieldClassName, leadingIcon, trailingIcon, error, label, hint, id, ...props },
  ref,
) {
  return (
    <div className={clsx('flex flex-col gap-xxs', className)}>
      {label && (
        <label htmlFor={id} className="text-body-sm font-medium text-ink">
          {label}
        </label>
      )}
      <div
        className={clsx(
          // 48px tap target on mobile, 44px editorial on desktop
          'flex h-12 md:h-11 items-center gap-2 rounded-md border bg-surface-card px-base',
          error ? 'border-error' : 'border-hairline-strong focus-within:border-ink focus-within:border-2',
          'transition-colors',
          fieldClassName,
        )}
      >
        {leadingIcon && <Icon name={leadingIcon} size={16} className="text-body" />}
        <input
          ref={ref}
          id={id}
          className="flex-1 bg-transparent text-body-md text-ink placeholder:text-muted outline-none"
          {...props}
        />
        {trailingIcon && <Icon name={trailingIcon} size={16} className="text-body" />}
      </div>
      {hint && !error && <span className="text-caption text-body">{hint}</span>}
      {error && <span className="text-caption text-error">{error}</span>}
    </div>
  );
});

export default Input;

export function Textarea({ className, label, id, hint, rows = 4, ...props }) {
  return (
    <div className="flex flex-col gap-xxs">
      {label && (
        <label htmlFor={id} className="text-body-sm font-medium text-ink">
          {label}
        </label>
      )}
      <textarea
        id={id}
        rows={rows}
        className={clsx(
          'w-full rounded-md border border-hairline-strong bg-surface-card px-base py-sm text-body-md text-ink',
          'placeholder:text-muted outline-none focus:border-ink focus:border-2 transition-colors',
          className,
        )}
        {...props}
      />
      {hint && <span className="text-caption text-body">{hint}</span>}
    </div>
  );
}

export function Select({ className, label, id, options = [], hint, ...props }) {
  return (
    <div className="flex flex-col gap-xxs">
      {label && (
        <label htmlFor={id} className="text-body-sm font-medium text-ink">
          {label}
        </label>
      )}
      <div className="relative">
        <select
          id={id}
          className={clsx(
            'w-full appearance-none rounded-md border border-hairline-strong bg-surface-card px-base pr-10 text-body-md text-ink',
            'h-12 md:h-11 outline-none focus:border-ink focus:border-2 transition-colors',
            className,
          )}
          {...props}
        >
          {options.map((o) => (
            <option key={o.value ?? o} value={o.value ?? o}>
              {o.label ?? o}
            </option>
          ))}
        </select>
        <Icon
          name="chevronDown"
          size={16}
          className="absolute right-sm top-1/2 -translate-y-1/2 text-body pointer-events-none"
        />
      </div>
      {hint && <span className="text-caption text-body">{hint}</span>}
    </div>
  );
}
