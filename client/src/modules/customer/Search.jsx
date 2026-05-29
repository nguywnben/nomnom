import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import Badge from '../../components/Badge.jsx';
import Button from '../../components/Button.jsx';
import Card from '../../components/Card.jsx';
import Icon from '../../components/Icon.jsx';
import Image from '../../components/Image.jsx';
import Input from '../../components/Input.jsx';
import EmptyState from '../../components/EmptyState.jsx';
import Tabs from '../../components/Tabs.jsx';
import { formatVnd } from '../../lib/formatVnd.js';
import { useRestaurants } from '../../hooks/useRestaurants.js';
import { useCuisines } from '../../hooks/useCuisines.js';

const LEGACY_CAT_TO_CUISINE_SLUG = {
  pizza: 'italian',
  burgers: 'american',
  sushi: 'japanese',
  bowls: 'healthy',
  noodles: 'japanese',
  tacos: 'mexican',
  drinks: 'coffee',
  desserts: 'bakery',
};

function parseCuisineSlugsFromParams(searchParams) {
  const raw = searchParams.get('cuisine');
  if (raw) {
    return raw.split(',').map((s) => s.trim()).filter(Boolean);
  }
  const legacy = searchParams.get('cat');
  if (legacy && LEGACY_CAT_TO_CUISINE_SLUG[legacy]) {
    return [LEGACY_CAT_TO_CUISINE_SLUG[legacy]];
  }
  return [];
}

export default function CustomerSearch() {
  const [params, setParams] = useSearchParams();
  const initialQuery = params.get('q') || '';

  const [q, setQ] = useState(initialQuery);
  const [debouncedQ, setDebouncedQ] = useState(initialQuery);
  const [cuisineSlugs, setCuisineSlugs] = useState(() => parseCuisineSlugsFromParams(params));
  const [openOnly, setOpenOnly] = useState(params.get('open') === 'true');
  const [sort, setSort] = useState(params.get('sort') || 'rating');
  const [page, setPage] = useState(parseInt(params.get('page') || '1', 10));
  const [view, setView] = useState('grid');

  const { cuisines } = useCuisines();

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQ(q);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [q]);

  const filters = {
    q: debouncedQ,
    cuisine: cuisineSlugs.join(','),
    open: openOnly,
    sort,
    page,
    limit: 20,
  };

  const { data: restaurants, pagination, loading, hasMore } = useRestaurants(filters);

  useEffect(() => {
    setParams(
      (prev) => {
        const np = new URLSearchParams(prev);
        np.delete('cat');
        if (debouncedQ) np.set('q', debouncedQ);
        else np.delete('q');
        if (cuisineSlugs.length) np.set('cuisine', cuisineSlugs.join(','));
        else np.delete('cuisine');
        if (openOnly) np.set('open', 'true');
        else np.delete('open');
        if (sort && sort !== 'rating') np.set('sort', sort);
        else np.delete('sort');
        if (page > 1) np.set('page', page.toString());
        else np.delete('page');
        return np;
      },
      { replace: true }
    );
  }, [debouncedQ, cuisineSlugs, openOnly, sort, page, setParams]);

  const toggleCuisine = (slug) => {
    setCuisineSlugs((prev) => {
      const next = prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug];
      setPage(1);
      return next;
    });
  };

  return (
    <div className="container-page py-xl">
      <div className="mb-base flex flex-col gap-2">
        <div className="text-caption-uppercase text-body">Khám phá</div>
        <h1 className="text-display-lg text-ink">Tìm nhà hàng.</h1>
      </div>

      {/* Search */}
      <div className="mb-base flex flex-col gap-xs md:flex-row md:items-center">
        <Input
          leadingIcon="search"
          placeholder="Tìm theo tên quán, slogan..."
          aria-label="Tìm kiếm nhà hàng"
          className="flex-1"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <div className="flex items-center gap-xs">
          <Tabs
            items={[
              { value: 'grid', label: 'Lưới' },
              { value: 'list', label: 'Danh sách' },
            ]}
            value={view}
            onChange={setView}
          />
          <Badge tone="outline">{pagination.total} kết quả</Badge>
        </div>
      </div>

      <div className="grid gap-base md:grid-cols-[260px_1fr]">
        {/* Sidebar filters */}
        <aside className="flex flex-col gap-base">
          <Card padded className="flex flex-col gap-md">
            <FilterGroup title="Sắp xếp">
              <select
                className="w-full rounded-md border border-hairline-strong bg-surface px-3 py-2 text-body-sm text-ink outline-none transition-colors focus:border-ink"
                value={sort}
                onChange={(e) => {
                  setSort(e.target.value);
                  setPage(1);
                }}
              >
                <option value="rating">Đánh giá: Cao đến thấp</option>
                <option value="fee">Phí giao hàng: Thấp đến cao</option>
                <option value="new">Mới nhất</option>
              </select>
            </FilterGroup>

            <FilterGroup title="Loại ẩm thực">
              <div className="flex flex-wrap gap-1">
                {cuisines.map((c) => (
                  <button
                    key={c.slug}
                    type="button"
                    onClick={() => toggleCuisine(c.slug)}
                    className={
                      'rounded-pill border px-2.5 py-1 text-caption transition-colors ' +
                      (cuisineSlugs.includes(c.slug)
                        ? 'border-ink bg-primary text-on-primary'
                        : 'border-hairline-strong bg-surface-card text-ink hover:bg-canvas-soft')
                    }
                  >
                    {c.name}
                  </button>
                ))}
              </div>
            </FilterGroup>

            <label className="flex cursor-pointer items-center gap-2 text-body-sm text-ink">
              <input
                type="checkbox"
                className="accent-black"
                checked={openOnly}
                onChange={(e) => {
                  setOpenOnly(e.target.checked);
                  setPage(1);
                }}
              />
              Chỉ quán đang mở (is_open_now)
            </label>

            <Button
              variant="secondary"
              onClick={() => {
                setQ('');
                setDebouncedQ('');
                setCuisineSlugs([]);
                setOpenOnly(false);
                setSort('rating');
                setPage(1);
                setParams({}, { replace: true });
              }}
            >
              Đặt lại bộ lọc
            </Button>
          </Card>
        </aside>

        {/* Results */}
        <div className="flex flex-col gap-base">
          {loading && restaurants.length === 0 ? (
            view === 'grid' ? (
              <div className="grid grid-cols-2 gap-base xl:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <SkeletonCard key={i} />
                ))}
              </div>
            ) : (
              <div className="flex flex-col divide-y divide-hairline rounded-lg border border-hairline-strong bg-surface-card">
                {Array.from({ length: 5 }).map((_, i) => (
                  <SkeletonRow key={i} />
                ))}
              </div>
            )
          ) : restaurants.length === 0 ? (
            <EmptyState
              icon="search"
              title="Không có nhà hàng nào phù hợp"
              message="Hãy thử từ khóa khác hoặc nới lỏng bộ lọc của bạn."
            />
          ) : (
            <>
              {view === 'grid' ? (
                <div className="grid grid-cols-2 gap-base xl:grid-cols-3">
                  {restaurants.map((r) => (
                    <RestaurantResultCard key={r.id} r={r} />
                  ))}
                </div>
              ) : (
                <div className="flex flex-col divide-y divide-hairline rounded-lg border border-hairline-strong bg-surface-card">
                  {restaurants.map((r) => (
                    <RestaurantResultRow key={r.id} r={r} />
                  ))}
                </div>
              )}
              {hasMore && (
                <div className="mt-xl flex justify-center">
                  <Button
                    variant="secondary"
                    onClick={() => setPage((p) => p + 1)}
                    disabled={loading}
                  >
                    {loading ? 'Đang tải...' : 'Tải thêm'}
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function FilterGroup({ title, children }) {
  return (
    <div>
      <div className="text-caption-uppercase text-body mb-xs">{title}</div>
      {children}
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="flex flex-col overflow-hidden rounded-lg border border-hairline-strong bg-surface-card animate-pulse">
      <div className="w-full aspect-[16/10] bg-surface-strong" />
      <div className="flex flex-1 flex-col gap-2 p-base">
        <div className="h-5 w-3/4 rounded bg-surface-strong" />
        <div className="h-4 w-1/2 rounded bg-surface-strong" />
        <div className="mt-auto pt-2 flex gap-2">
          <div className="h-4 w-16 rounded bg-surface-strong" />
          <div className="h-4 w-16 rounded bg-surface-strong" />
        </div>
      </div>
    </div>
  );
}

function SkeletonRow() {
  return (
    <div className="flex items-center gap-base p-sm animate-pulse">
      <div className="h-16 w-24 shrink-0 rounded-md bg-surface-strong" />
      <div className="min-w-0 flex-1 flex flex-col gap-2">
        <div className="h-5 w-1/3 rounded bg-surface-strong" />
        <div className="h-4 w-1/4 rounded bg-surface-strong" />
      </div>
    </div>
  );
}

function RestaurantResultCard({ r }) {
  return (
    <Link
      to={`/app/restaurant/${r.id}`}
      className="group flex flex-col overflow-hidden rounded-lg border border-hairline-strong bg-surface-card transition-shadow hover:shadow-soft"
    >
      <div className="relative">
        <Image src={r.bannerUrl} alt={r.name} ratio="16/10" className="w-full" />
        {!r.isOpenNow && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <span className="rounded bg-black/80 px-2 py-1 text-caption font-semibold text-white">Đóng cửa</span>
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1 p-base">
        <div className="flex items-center justify-between gap-2">
          <span className="text-title-md text-ink line-clamp-2 leading-tight">{r.name}</span>
          <span className="inline-flex shrink-0 items-center gap-1 text-body-sm text-ink">
            <Icon name="starFilled" size={12} />
            <span className="nums">{Number(r.ratingAvg).toFixed(1)}</span>
          </span>
        </div>
        <span className="text-body-sm text-body line-clamp-2">{r.tagline}</span>
        <div className="mt-auto flex flex-col gap-1.5 pt-2 text-caption text-body md:hidden">
          <div className="flex items-center justify-between gap-2">
            <span className="inline-flex min-w-0 items-center gap-1">
              <Icon name="clock" size={12} className="shrink-0" />
              <span className="truncate">{r.avgPrepTimeMin}p</span>
            </span>
            <span className="inline-flex shrink-0 items-center gap-1 nums">
              Phí: {formatVnd(r.baseDeliveryFee)}
            </span>
          </div>
        </div>
        <div className="mt-auto hidden flex-wrap items-center gap-x-3 gap-y-1 pt-2 text-caption text-body md:flex">
          <span className="inline-flex items-center gap-1">
            <Icon name="clock" size={12} /> {r.avgPrepTimeMin}p
          </span>
          <span className="inline-flex items-center gap-1 nums">
            Phí: {formatVnd(r.baseDeliveryFee)}
          </span>
        </div>
      </div>
    </Link>
  );
}

function RestaurantResultRow({ r }) {
  return (
    <Link to={`/app/restaurant/${r.id}`} className="flex items-center gap-base p-sm hover:bg-canvas-soft">
      <div className="relative h-16 w-24 shrink-0 rounded-md overflow-hidden">
        <Image src={r.bannerUrl} alt={r.name} className="h-full w-full" ratio="16/10" />
        {!r.isOpenNow && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <span className="text-[10px] font-semibold text-white">ĐÓNG</span>
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <span className="text-title-md text-ink line-clamp-2 leading-tight">{r.name}</span>
          <span className="inline-flex shrink-0 items-center gap-1 text-body-sm text-ink">
            <Icon name="starFilled" size={12} />
            <span className="nums">{Number(r.ratingAvg).toFixed(1)}</span>
          </span>
        </div>
        <span className="text-body-sm text-body line-clamp-2">{r.tagline}</span>
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-caption text-body md:hidden">
          <span className="inline-flex items-center gap-1">
            <Icon name="clock" size={12} /> {r.avgPrepTimeMin}p
          </span>
          <span className="inline-flex items-center gap-1 nums">Phí: {formatVnd(r.baseDeliveryFee)}</span>
        </div>
        <div className="mt-1 hidden flex-wrap items-center gap-x-3 gap-y-1 text-caption text-body md:flex">
          <span>{r.avgPrepTimeMin}p</span>
          <span className="nums">Phí: {formatVnd(r.baseDeliveryFee)}</span>
        </div>
      </div>
      <Icon name="arrowRight" size={16} className="shrink-0 text-body" />
    </Link>
  );
}
