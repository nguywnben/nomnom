import { useState } from 'react';
import Icon from './Icon.jsx';
import clsx from 'clsx';

export default function StarRating({
  value = 0,
  onChange,
  size = 16,
  readOnly = !onChange,
  allowClear = true,
  className,
}) {
  const [hover, setHover] = useState(0);
  const display = hover || value;

  const handleClick = (n) => {
    if (!onChange || readOnly) return;
    if (allowClear && value === n) {
      onChange(0);
    } else {
      onChange(n);
    }
  };

  return (
    <div className={clsx('inline-flex items-center gap-0.5', className)}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          disabled={readOnly}
          onMouseEnter={() => !readOnly && setHover(n)}
          onMouseLeave={() => !readOnly && setHover(0)}
          onClick={() => handleClick(n)}
          title={!readOnly && value === n ? 'Nhấp để hủy đánh giá' : undefined}
          className={clsx(
            'p-0.5 -m-0.5 transition-transform active:scale-90',
            !readOnly && 'cursor-pointer',
            display >= n ? 'text-ink' : 'text-muted',
          )}
        >
          <Icon name={display >= n ? 'starFilled' : 'star'} size={size} />
        </button>
      ))}
    </div>
  );
}
