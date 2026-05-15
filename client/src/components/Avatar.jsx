import clsx from 'clsx';
import { useState } from 'react';

const sizes = {
  xs: 'h-6 w-6 text-caption',
  sm: 'h-8 w-8 text-caption',
  md: 'h-10 w-10 text-body-sm',
  lg: 'h-12 w-12 text-body-sm',
  xl: 'h-16 w-16 text-body-md',
};

export default function Avatar({ src, name = '?', size = 'md', square = false, className }) {
  const [errored, setErrored] = useState(false);
  const initials = name
    .split(' ')
    .map((s) => s[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
  return (
    <div
      className={clsx(
        'inline-flex shrink-0 items-center justify-center overflow-hidden bg-surface-strong text-ink',
        square ? 'rounded-md' : 'rounded-full',
        sizes[size],
        className,
      )}
    >
      {src && !errored ? (
        <img
          src={src}
          alt={name}
          className="h-full w-full object-cover"
          onError={() => setErrored(true)}
        />
      ) : (
        <span className="font-semibold">{initials}</span>
      )}
    </div>
  );
}
