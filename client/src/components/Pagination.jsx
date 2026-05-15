import clsx from 'clsx';
import Icon from './Icon.jsx';

// Pagination — Admin data tables.
//   • Editorial 1..N buttons with truncation
//   • DESIGN tokens: rounded-md (8px), hairline borders, Inter 500 buttons,
//     primary-ink for the active page.
export default function Pagination({ total, pageSize, page, onChange, className }) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const range = buildRange(page, pages);
  const start = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(total, page * pageSize);

  return (
    <div className={clsx('flex items-center justify-between gap-base', className)}>
      <span className="text-caption text-body">
        Hiển thị <span className="nums text-ink">{start}</span>–<span className="nums text-ink">{end}</span>{' '}
        của <span className="nums text-ink">{total}</span>
      </span>
      <nav className="inline-flex items-center gap-1" aria-label="Pagination">
        <PageButton
          ariaLabel="Trang trước"
          disabled={page <= 1}
          onClick={() => onChange(Math.max(1, page - 1))}
        >
          <Icon name="chevronLeft" size={14} />
        </PageButton>
        {range.map((p, i) =>
          p === '…' ? (
            <span key={`gap-${i}`} className="px-1 text-body">…</span>
          ) : (
            <PageButton
              key={p}
              active={p === page}
              onClick={() => onChange(p)}
              ariaLabel={`Trang ${p}`}
            >
              <span className="nums">{p}</span>
            </PageButton>
          ),
        )}
        <PageButton
          ariaLabel="Trang tiếp theo"
          disabled={page >= pages}
          onClick={() => onChange(Math.min(pages, page + 1))}
        >
          <Icon name="chevronRight" size={14} />
        </PageButton>
      </nav>
    </div>
  );
}

function PageButton({ active, disabled, onClick, ariaLabel, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      aria-current={active ? 'page' : undefined}
      className={clsx(
        'inline-flex h-8 min-w-8 items-center justify-center rounded-md px-2 text-button transition-colors',
        active
          ? 'bg-primary text-on-primary'
          : 'border border-hairline-strong bg-surface-card text-ink hover:bg-canvas-soft disabled:cursor-not-allowed disabled:text-muted-soft disabled:hover:bg-surface-card',
      )}
    >
      {children}
    </button>
  );
}

function buildRange(page, pages) {
  if (pages <= 7) {
    return Array.from({ length: pages }, (_, i) => i + 1);
  }
  if (page <= 4) return [1, 2, 3, 4, 5, '…', pages];
  if (page >= pages - 3) return [1, '…', pages - 4, pages - 3, pages - 2, pages - 1, pages];
  return [1, '…', page - 1, page, page + 1, '…', pages];
}
