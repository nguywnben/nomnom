import clsx from 'clsx';
import { forwardRef } from 'react';
import Icon from './Icon.jsx';

// Strict DESIGN.md mapping:
//   primary   -> background primary (#000) + on-primary (#fff), rounded-md
//   secondary -> surface-card + 1px hairline-strong border + ink
//   tertiary  -> transparent + text-link (#0d74ce) — inline only
//   ghost     -> transparent + ink, hairline on hover (utility)
//   danger    -> ink with error border-tinted, used sparingly
//
// States: Default / Hover / Active / Disabled.

// Sizes — 48px+ touch targets on mobile, editorial tighter on desktop.
const sizeStyles = {
  xs: 'h-7 px-2 text-caption',
  sm: 'h-9 px-sm text-button',
  md: 'h-12 md:h-10 px-base text-button',
  lg: 'h-14 md:h-12 px-md text-button',
};

const variantStyles = {
  primary:
    'bg-primary text-on-primary border border-primary hover:bg-primary-active active:bg-primary-active disabled:bg-muted-soft disabled:border-muted-soft disabled:text-canvas',
  secondary:
    'bg-surface-card text-ink border border-hairline-strong hover:bg-canvas-soft active:bg-surface-strong disabled:text-muted-soft disabled:border-hairline',
  tertiary:
    'link-underline bg-transparent text-text-link border border-transparent hover:text-link-secondary disabled:text-muted-soft',
  ghost:
    'bg-transparent text-ink border border-transparent hover:bg-canvas-soft active:bg-surface-strong disabled:text-muted-soft',
  dark:
    'bg-surface-dark text-on-dark border border-surface-dark hover:bg-surface-dark-elevated disabled:opacity-50',
  critical:
    'bg-error text-white border border-error hover:bg-[#b91c1c] active:bg-[#b91c1c] disabled:bg-muted-soft disabled:border-muted-soft disabled:text-canvas',
  danger:
    'bg-error text-white border border-error hover:bg-[#b91c1c] active:bg-[#b91c1c] disabled:bg-muted-soft disabled:border-muted-soft disabled:text-canvas',
};

const Button = forwardRef(function Button(
  {
    as: Component = 'button',
    variant = 'primary',
    size = 'md',
    leadingIcon,
    trailingIcon,
    loading = false,
    disabled = false,
    className,
    children,
    ...props
  },
  ref,
) {
  const isDisabled = disabled || loading;
  return (
    <Component
      ref={ref}
      disabled={Component === 'button' ? isDisabled : undefined}
      className={clsx(
        'inline-flex select-none items-center justify-center gap-2 rounded-md font-medium transition-[background-color,border-color,color,box-shadow,transform] duration-200 ease-out',
        'disabled:cursor-not-allowed',
        sizeStyles[size],
        variantStyles[variant],
        className,
      )}
      {...props}
    >
      {loading ? (
        <Icon name="spinner" size={16} className="animate-spin" />
      ) : (
        leadingIcon && <Icon name={leadingIcon} size={16} />
      )}
      {children && <span className="leading-none">{children}</span>}
      {!loading && trailingIcon && <Icon name={trailingIcon} size={16} />}
    </Component>
  );
});

export default Button;

export function IconButton({ icon, label, variant = 'ghost', size = 'md', badge, className, ...props }) {
  // 44px+ default for mobile reach; sm stays 32 for dense table rows.
  const dim =
    size === 'sm'
      ? 'h-9 w-9 md:h-8 md:w-8'
      : size === 'lg'
        ? 'h-14 w-14 md:h-12 md:w-12'
        : 'h-11 w-11 md:h-10 md:w-10';
  return (
    <button
      aria-label={label}
      title={label}
      className={clsx(
        'relative inline-flex items-center justify-center rounded-md transition-[background-color,border-color,color,box-shadow,transform] duration-200 ease-out',
        dim,
        variant === 'primary'
          ? 'bg-primary text-on-primary hover:bg-primary-active'
          : variant === 'secondary'
            ? 'bg-surface-card border border-hairline-strong text-ink hover:bg-canvas-soft'
            : 'text-ink hover:bg-canvas-soft',
        className,
      )}
      {...props}
    >
      <Icon name={icon} size={size === 'sm' ? 16 : 18} />
      {Boolean(badge) && (
        <span className="pointer-events-none absolute -top-1 -right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-primary px-1 font-mono text-[10px] font-bold leading-none text-white shadow-xs">
          {badge}
        </span>
      )}
    </button>
  );
}
