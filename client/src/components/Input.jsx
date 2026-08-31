import clsx from 'clsx';
import { forwardRef } from 'react';
import Icon from './Icon.jsx';

// text-input — DESIGN.md
//   bg surface-card / text ink / rounded-md / height 44 / pad 12x16
//   border 1px hairline-strong (không đổi viền khi focus; không nhãn trên — chỉ placeholder)

const Input = forwardRef(function Input(
  { className, fieldClassName, leadingIcon, trailingIcon, trailingButton, error, hint, id, label, required, ...props },
  ref,
) {
  return (
    <div className={clsx('flex flex-col gap-xxs', className)}>
      {label && (
        <label htmlFor={id} className="text-body-sm font-semibold text-ink">
          {label}
          {required && <span className="text-error ml-1">*</span>}
        </label>
      )}
      <div
        className={clsx(
          // 48px tap target on mobile, 44px editorial on desktop
          'flex h-12 md:h-11 items-center gap-2 rounded-md border bg-surface-card px-base',
          error ? 'border-error' : 'border-hairline-strong',
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
        {trailingButton ? (
          <button
            type="button"
            tabIndex={-1}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-sm text-body transition-colors hover:text-ink"
            onClick={trailingButton.onClick}
            aria-label={trailingButton['aria-label']}
          >
            <Icon name={trailingButton.icon} size={18} />
          </button>
        ) : (
          trailingIcon && <Icon name={trailingIcon} size={16} className="text-body" />
        )}
      </div>
      {hint && !error && <span className="text-caption text-body">{hint}</span>}
      {error && <span className="text-caption text-error">{error}</span>}
    </div>
  );
});

export default Input;

export const Textarea = forwardRef(function Textarea(
  { className, fieldClassName, id, hint, label, required, rows = 4, error, ...props },
  ref,
) {
  return (
    <div className={clsx('flex flex-col gap-xxs', className)}>
      {label && (
        <label htmlFor={id} className="text-body-sm font-semibold text-ink">
          {label}
          {required && <span className="text-error ml-1">*</span>}
        </label>
      )}
      <textarea
        ref={ref}
        id={id}
        rows={rows}
        className={clsx(
          'w-full rounded-md border bg-surface-card px-base py-sm text-body-md text-ink',
          'placeholder:text-muted outline-none transition-colors',
          error ? 'border-error' : 'border-hairline-strong',
          fieldClassName,
        )}
        {...props}
      />
      {hint && !error && <span className="text-caption text-body">{hint}</span>}
      {error && <span className="text-caption text-error">{error}</span>}
    </div>
  );
});

export const Select = forwardRef(function Select(
  { className, fieldClassName, id, options = [], hint, label, required, error, ...props },
  ref,
) {
  return (
    <div className={clsx('flex flex-col gap-xxs', className)}>
      {label && (
        <label htmlFor={id} className="text-body-sm font-semibold text-ink">
          {label}
          {required && <span className="text-error ml-1">*</span>}
        </label>
      )}
      <div className="relative">
        <select
          ref={ref}
          id={id}
          className={clsx(
            'w-full appearance-none rounded-md border bg-surface-card px-base pr-10 text-body-md text-ink',
            'h-12 md:h-11 outline-none transition-colors',
            error ? 'border-error' : 'border-hairline-strong',
            fieldClassName,
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
          className="pointer-events-none absolute right-sm top-1/2 -translate-y-1/2 text-body"
        />
      </div>
      {hint && !error && <span className="text-caption text-body">{hint}</span>}
      {error && <span className="text-caption text-error">{error}</span>}
    </div>
  );
});
