import Card from './Card.jsx';
import Skeleton from './Skeleton.jsx';

export default function TableSkeleton({ rows = 5, cols = 5, className = '' }) {
  return (
    <Card padded={false} className={`overflow-hidden ${className}`}>
      {/* Desktop Table Header */}
      <div className="hidden border-b border-hairline bg-canvas-soft px-base py-sm md:grid md:grid-flow-col md:auto-cols-fr md:gap-base">
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} className="h-4 w-20" rounded="sm" />
        ))}
      </div>

      {/* Rows (Responsive: stacked on mobile, grid on desktop) */}
      <div className="divide-y divide-hairline">
        {Array.from({ length: rows }).map((_, r) => (
          <div
            key={r}
            className="flex flex-col gap-sm p-base md:grid md:grid-flow-col md:auto-cols-fr md:items-center md:gap-base"
          >
            {Array.from({ length: cols }).map((_, c) => (
              <div key={c} className="flex items-center gap-2">
                {c === 0 && <Skeleton className="h-8 w-8 shrink-0 rounded-md" />}
                <Skeleton
                  className={`h-4 ${c === 0 ? 'w-28' : c === cols - 1 ? 'w-16' : 'w-20'}`}
                  rounded="sm"
                />
              </div>
            ))}
          </div>
        ))}
      </div>
    </Card>
  );
}
