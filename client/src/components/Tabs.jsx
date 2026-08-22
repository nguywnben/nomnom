import { useRef } from 'react';
import clsx from 'clsx';

// Tabs với điều hướng bàn phím chuẩn WAI-ARIA:
//   • Mũi tên ←/→ (hoặc ↑/↓) di chuyển focus và kích hoạt tab.
//   • Home/End tới tab đầu/cuối.
//   • Roving tabindex: chỉ tab đang chọn nằm trong luồng Tab.
export default function Tabs({ items, value, onChange, className }) {
  const refs = useRef([]);

  const moveFocus = (from, delta) => {
    const next = (from + delta + items.length) % items.length;
    refs.current[next]?.focus();
    onChange?.(items[next]?.value);
  };

  const onKeyDown = (e, index) => {
    switch (e.key) {
      case 'ArrowRight':
      case 'ArrowDown':
        e.preventDefault();
        moveFocus(index, 1);
        break;
      case 'ArrowLeft':
      case 'ArrowUp':
        e.preventDefault();
        moveFocus(index, -1);
        break;
      case 'Home':
        e.preventDefault();
        refs.current[0]?.focus();
        onChange?.(items[0]?.value);
        break;
      case 'End':
        e.preventDefault();
        refs.current[items.length - 1]?.focus();
        onChange?.(items[items.length - 1]?.value);
        break;
      default:
        break;
    }
  };

  return (
    <div
      role="tablist"
      aria-orientation="horizontal"
      className={clsx(
        'inline-flex w-fit max-w-full items-center gap-1 rounded-md border border-hairline-strong bg-surface-card p-1',
        className,
      )}
    >
      {items.map((it, index) => {
        const active = value === it.value;
        return (
          <button
            key={it.value}
            ref={(el) => { refs.current[index] = el; }}
            type="button"
            role="tab"
            id={`tab-${it.value}`}
            aria-selected={active}
            aria-controls={`tabpanel-${it.value}`}
            tabIndex={active ? 0 : -1}
            onClick={() => onChange?.(it.value)}
            onKeyDown={(e) => onKeyDown(e, index)}
            className={clsx(
              'h-8 rounded-sm px-sm text-button transition-colors',
              active ? 'bg-primary text-on-primary' : 'text-ink hover:bg-canvas-soft',
            )}
          >
            {it.label}
          </button>
        );
      })}
    </div>
  );
}