import clsx from 'clsx';

// feature-card     -> bg surface-card / rounded-lg / pad 24 / 1px hairline-strong border
// feature-card-dark-> bg surface-dark / on-dark / rounded-lg / pad 24

export default function Card({
  as: Component = 'div',
  variant = 'default',
  padded = true,
  hover = true,
  className,
  children,
  ...props
}) {
  const isInteractive =
    hover &&
    (typeof props.onClick === 'function' ||
      props.role === 'button' ||
      props.role === 'link' ||
      Component === 'a' ||
      Component === 'button' ||
      typeof Component !== 'string');

  return (
    <Component
      className={clsx(
        'rounded-lg',
        variant === 'default' && 'bg-surface-card border border-hairline-strong text-ink',
        variant === 'soft' && 'bg-canvas-soft border border-hairline text-ink',
        variant === 'dark' && 'bg-surface-dark text-on-dark',
        variant === 'flat' && 'bg-surface-card text-ink',
        padded && 'p-lg',
        isInteractive &&
          'cursor-pointer transition-shadow duration-200 ease-out hover:shadow-soft',
        className,
      )}
      {...props}
    >
      {children}
    </Component>
  );
}
