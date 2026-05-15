import { useState } from 'react';
import Icon from './Icon.jsx';
import clsx from 'clsx';

export default function StarRating({
  value = 0,
  onChange,
  size = 16,
  readOnly = !onChange,
  className,
}) {
  const [hover, setHover] = useState(0);
  const display = hover || value;
  return (
    <div className={clsx('inline-flex items-center gap-0.5', className)}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          disabled={readOnly}
          onMouseEnter={() => !readOnly && setHover(n)}
          onMouseLeave={() => !readOnly && setHover(0)}
          onClick={() => onChange && onChange(n)}
          className={clsx(
            'p-0.5 -m-0.5',
            !readOnly && 'cursor-pointer',
            display >= n ? 'text-ink' : 'text-muted-soft',
          )}
        >
          <Icon name={display >= n ? 'starFilled' : 'star'} size={size} />
        </button>
      ))}
    </div>
  );
}
