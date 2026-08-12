import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import Button from '../../components/Button.jsx';
import { IconButton } from '../../components/Button.jsx';
import Card from '../../components/Card.jsx';
import Icon from '../../components/Icon.jsx';
import Image from '../../components/Image.jsx';
import Input from '../../components/Input.jsx';
import EmptyState from '../../components/EmptyState.jsx';
import Pagination from '../../components/Pagination.jsx';
import Tabs from '../../components/Tabs.jsx';
import { formatVnd } from '../../lib/formatVnd.js';
import { searchExploreApi, fetchCuisinesApi } from '../../lib/api.js';
import { useApp } from '../../context/AppContext.jsx';

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

const SEARCH_PAGE_SIZE = 6;

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
  const { addToCart, setCartOpen, shopAsCustomer } = useApp();
  const [params, setParams] = useSearchParams();

  const initialQuery = params.get('q') || '';
  const [q, setQ] = useState(initialQuery);
  const [debouncedQ, setDebouncedQ] = useState(initialQuery);

  const [cuisineSlugs, setCuisineSlugs] = useState(() => parseCuisineSlugsFromParams(params));
  const [openOnly, setOpenOnly] = useState(params.get('open') === 'true');
  const [minPrice, setMinPrice] = useState(params.get('minPrice') || '');
  const [maxPrice, setMaxPrice] = useState(params.get('maxPrice') || '');
  const [rating, setRating] = useState(params.get('rating') || '');
  const [sort, setSort] = useState(params.get('sort') || 'rating');
  const [page, setPage] = useState(() => Math.max(1, parseInt(params.get('page') || '1', 10) || 1));
  const [view, setView] = useState('grid');
  const [searchTab, setSearchTab] = useState(() => (params.get('tab') === 'restaurants' ? 'restaurants' : 'dishes'));

  const [cuisines, setCuisines] = useState([]);
  const [data, setData] = useState({ restaurants: [], menuItems: [], pagination: { totalRestaurants: 0, totalMenuItems: 0 } });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch cuisines list
  useEffect(() => {
    fetchCuisinesApi()
      .then((res) => setCuisines(res.data ?? []))
      .catch(() => {});
  }, []);

  // Debounce search text
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQ(q);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [q]);

  useEffect(() => {
    setParams(
      (prev) => {
        const np = new URLSearchParams(prev);
        np.delete('cat');
        if (debouncedQ) np.set('q', debouncedQ); else np.delete('q');
        if (cuisineSlugs.length) np.set('cuisine', cuisineSlugs.join(',')); else np.delete('cuisine');
        if (openOnly) np.set('open', 'true'); else np.delete('open');
        if (minPrice) np.set('minPrice', minPrice); else np.delete('minPrice');
        if (maxPrice) np.set('maxPrice', maxPrice); else np.delete('maxPrice');
        if (rating) np.set('rating', rating); else np.delete('rating');
        if (sort && sort !== 'rating') np.set('sort', sort); else np.delete('sort');
        if (searchTab === 'restaurants') np.set('tab', searchTab); else np.delete('tab');
        if (page > 1) np.set('page', page.toString()); else np.delete('page');
        return np;
      },
      { replace: true }
    );
  }, [debouncedQ, cuisineSlugs, openOnly, minPrice, maxPrice, rating, sort, searchTab, page, setParams]);

  // Perform search query
  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError(null);

    searchExploreApi({
      q: debouncedQ,
      cuisine: cuisineSlugs.join(','),
      open: openOnly ? '1' : '',
      minPrice,
      maxPrice,
      rating,
      sort,
      page,
      limit: SEARCH_PAGE_SIZE,
    })
      .then((res) => {
        if (mounted) {
          setData(res);
        }
      })
      .catch((err) => {
        if (mounted) setError(err.message || 'Có lỗi xảy ra khi tìm kiếm.');
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [debouncedQ, cuisineSlugs, openOnly, minPrice, maxPrice, rating, sort, page]);

  const toggleCuisine = (slug) => {
    setCuisineSlugs((prev) => {
      const next = prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug];
      setPage(1);
      return next;
    });
  };

  const visibleRestaurantCount = searchTab === 'restaurants' ? (data.restaurants?.length ?? 0) : 0;
  const visibleDishCount = searchTab === 'dishes' ? (data.menuItems?.length ?? 0) : 0;
  const visibleResults = visibleRestaurantCount + visibleDishCount;
  const showRestaurantFilters = searchTab === 'restaurants';
  const showDishFilters = searchTab === 'dishes';
  const totalRestaurants = Number(data.pagination?.totalRestaurants ?? 0);
  const totalMenuItems = Number(data.pagination?.totalMenuItems ?? 0);
  const paginationTotal = searchTab === 'restaurants' ? totalRestaurants : totalMenuItems;
  const paginationPageCount = Math.ceil(paginationTotal / SEARCH_PAGE_SIZE);

  const changePage = (nextPage) => setPage(nextPage);

  useEffect(() => {
    if (!loading && paginationPageCount > 0 && page > paginationPageCount) {
      setPage(paginationPageCount);
    }
  }, [loading, page, paginationPageCount]);

  return (
    <div className="container-page py-xl">
      <div className="mb-base flex flex-col gap-2">
        <div className="text-caption-uppercase text-body">Khám phá</div>
        <h1 className="text-display-lg text-ink">Khám phá quán và món</h1>
      </div>

      {/* Search Input Bar & View options */}
      <div className="mb-base flex flex-col gap-xs md:flex-row md:items-center">
        <Input
          leadingIcon="search"
          placeholder="Tìm quán ăn hoặc món ăn"
          aria-label="Tìm kiếm quán ăn và món ăn"
          className="flex-1"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <div className="flex flex-wrap items-center gap-xs">
          <Tabs
            items={[
              { value: 'dishes', label: `Món ăn (${data.pagination?.totalMenuItems ?? 0})` },
              { value: 'restaurants', label: `Quán ăn (${data.pagination?.totalRestaurants ?? 0})` },
            ]}
            value={searchTab}
            onChange={(val) => {
              setSearchTab(val);
              setMinPrice('');
              setMaxPrice('');
              setSort(val === 'dishes' ? 'popular' : 'rating');
              setPage(1);
            }}
          />
          <Tabs
            items={[
              { value: 'grid', label: 'Lưới' },
              { value: 'list', label: 'Danh sách' },
            ]}
            value={view}
            onChange={setView}
          />
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
                <option value="rating">Đánh giá cao nhất</option>
                {showRestaurantFilters && <option value="fee">Phí giao thấp nhất</option>}
                {showRestaurantFilters && <option value="new">Quán mới nhất</option>}
                {showDishFilters && <option value="popular">Món phổ biến</option>}
                {showDishFilters && <option value="price_asc">Giá thấp đến cao</option>}
                {showDishFilters && <option value="price_desc">Giá cao đến thấp</option>}
              </select>
            </FilterGroup>

            {showDishFilters && <FilterGroup title="Khoảng giá (VNĐ)">
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  placeholder="Từ"
                  className="w-full rounded-md border border-hairline-strong bg-surface px-2 py-1 text-body-sm text-ink outline-none"
                  value={minPrice}
                  onChange={(e) => {
                    setMinPrice(e.target.value);
                    setPage(1);
                  }}
                />
                <span className="text-body-sm text-muted">-</span>
                <input
                  type="number"
                  placeholder="Đến"
                  className="w-full rounded-md border border-hairline-strong bg-surface px-2 py-1 text-body-sm text-ink outline-none"
                  value={maxPrice}
                  onChange={(e) => {
                    setMaxPrice(e.target.value);
                    setPage(1);
                  }}
                />
              </div>
            </FilterGroup>}

            <FilterGroup title="Đánh giá tối thiểu">
              <select
                className="w-full rounded-md border border-hairline-strong bg-surface px-3 py-2 text-body-sm text-ink outline-none"
                value={rating}
                onChange={(e) => {
                  setRating(e.target.value);
                  setPage(1);
                }}
              >
                <option value="">Tất cả đánh giá</option>
                <option value="4.5">Tốt nhất (từ 4.5 ⭐)</option>
                <option value="4.0">Khá tốt (từ 4.0 ⭐)</option>
                <option value="3.5">Từ 3.5 ⭐</option>
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
              Chỉ quán ăn đang mở
            </label>

            <Button
              variant="secondary"
              onClick={() => {
                setQ('');
                setDebouncedQ('');
                setCuisineSlugs([]);
                setOpenOnly(false);
                setMinPrice('');
                setMaxPrice('');
                setRating('');
                setSort('rating');
                setSearchTab('dishes');
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
          {error && visibleResults === 0 ? (
            <div role="alert" className="rounded-lg border border-error/30 bg-[#fef2f2] p-base text-body-sm text-error">
              Không thể tải kết quả tìm kiếm. Vui lòng tải lại trang và thử lại.
            </div>
          ) : loading && visibleResults === 0 ? (
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
          ) : visibleResults === 0 ? (
            <EmptyState
              icon="search"
              title="Không tìm thấy kết quả phù hợp"
              message="Hãy thử đổi từ khóa tìm kiếm hoặc đặt lại các bộ lọc."
            />
          ) : (
            <>
              {/* RESTAURANTS SECTION */}
              {searchTab === 'restaurants' && data.restaurants?.length > 0 && (
                <section>
                  <div className="mb-sm flex items-center justify-between">
                    <h2 className="text-title-lg text-ink font-semibold">Quán ăn ({data.restaurants.length})</h2>
                  </div>
                  {view === 'grid' ? (
                    <div className="grid grid-cols-2 gap-base xl:grid-cols-3">
                      {data.restaurants.map((r) => (
                        <RestaurantResultCard key={r.id} r={r} />
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col divide-y divide-hairline rounded-lg border border-hairline-strong bg-surface-card">
                      {data.restaurants.map((r) => (
                        <RestaurantResultRow key={r.id} r={r} />
                      ))}
                    </div>
                  )}
                </section>
              )}

              {/* DISHES SECTION */}
              {searchTab === 'dishes' && data.menuItems?.length > 0 && (
                <section>
                  <div className="mb-sm flex items-center justify-between">
                    <h2 className="text-title-lg text-ink font-semibold">Món ăn ({data.menuItems.length})</h2>
                  </div>
                  {view === 'grid' ? (
                    <div className="grid grid-cols-2 gap-base xl:grid-cols-3">
                      {data.menuItems.map((item) => (
                        <MenuItemResultCard
                          key={item.id}
                          item={item}
                          onAdd={() => {
                            if (!shopAsCustomer) return;
                            addToCart(item.restaurantId, item, 1, {
                              baseDeliveryFee: item.baseDeliveryFee,
                              restaurantName: item.restaurantName,
                              restaurantLogo: item.restaurantLogo,
                            });
                            setCartOpen(true);
                          }}
                          addDisabled={!shopAsCustomer || !item.isAvailable}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col divide-y divide-hairline rounded-lg border border-hairline-strong bg-surface-card">
                      {data.menuItems.map((item) => (
                        <MenuItemResultRow
                          key={item.id}
                          item={item}
                          onAdd={() => {
                            if (!shopAsCustomer) return;
                            addToCart(item.restaurantId, item, 1, {
                              baseDeliveryFee: item.baseDeliveryFee,
                              restaurantName: item.restaurantName,
                              restaurantLogo: item.restaurantLogo,
                            });
                            setCartOpen(true);
                          }}
                          addDisabled={!shopAsCustomer || !item.isAvailable}
                        />
                      ))}
                    </div>
                  )}
                </section>
              )}
              {paginationPageCount > 1 && (
                <Pagination
                  total={paginationTotal}
                  pageSize={SEARCH_PAGE_SIZE}
                  page={page}
                  onChange={changePage}
                  className="mt-lg border-t border-hairline pt-base"
                />
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
      <div className="h-16 w-20 shrink-0 rounded-md bg-surface-strong" />
      <div className="flex flex-1 flex-col gap-2">
        <div className="h-4 w-2/3 rounded bg-surface-strong" />
        <div className="h-3 w-1/2 rounded bg-surface-strong" />
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
        <div className="mt-auto flex items-center justify-between pt-2 text-caption text-body">
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
        <div className="mt-1 flex items-center gap-x-3 text-caption text-body">
          <span>{r.avgPrepTimeMin}p</span>
          <span className="nums">Phí: {formatVnd(r.baseDeliveryFee)}</span>
        </div>
      </div>
      <Icon name="arrowRight" size={16} className="shrink-0 text-body" />
    </Link>
  );
}

function MenuItemResultCard({ item, onAdd, addDisabled }) {
  const navigate = useNavigate();
  const openRestaurant = () => navigate(`/app/restaurant/${item.restaurantId}`);

  return (
    <div
      role="link"
      tabIndex={0}
      onClick={openRestaurant}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          openRestaurant();
        }
      }}
      className="group flex cursor-pointer flex-col overflow-hidden rounded-lg border border-hairline-strong bg-surface-card transition-shadow hover:shadow-soft"
    >
      <div className="relative">
        <Image src={item.imageUrl} alt={item.name} ratio="16/10" className="w-full" />
        {!item.isAvailable && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
            <span className="rounded bg-black/80 px-2.5 py-1 text-caption font-semibold text-white">
              {!item.inStock ? 'Hết hàng' : 'Quán đóng cửa'}
            </span>
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1 p-base">
        <div className="flex items-start justify-between gap-2">
          <span className="text-title-md text-ink line-clamp-1 font-semibold">{item.name}</span>
          <span className="nums text-title-md font-semibold text-ink shrink-0">{formatVnd(item.price)}</span>
        </div>
        <span className="text-caption text-body line-clamp-2">{item.description}</span>
        <div className="mt-auto flex items-center justify-between pt-2 border-t border-hairline-soft">
          <Link to={`/app/restaurant/${item.restaurantId}`} onClick={(event) => event.stopPropagation()} className="text-caption text-body hover:text-ink line-clamp-1">
            {item.restaurantName}
          </Link>
          {!addDisabled && (
            <IconButton
              icon="plus"
              label={`Thêm ${item.name} vào giỏ`}
              size="sm"
              variant="secondary"
              onClick={(event) => {
                event.stopPropagation();
                onAdd();
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function MenuItemResultRow({ item, onAdd, addDisabled }) {
  const navigate = useNavigate();
  const openRestaurant = () => navigate(`/app/restaurant/${item.restaurantId}`);

  return (
    <div
      role="link"
      tabIndex={0}
      onClick={openRestaurant}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          openRestaurant();
        }
      }}
      className="flex cursor-pointer items-center gap-base p-sm hover:bg-canvas-soft"
    >
      <div className="relative h-16 w-20 shrink-0 rounded-md overflow-hidden">
        <Image src={item.imageUrl} alt={item.name} className="h-full w-full" ratio="1" />
        {!item.isAvailable && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
            <span className="text-[10px] font-semibold text-white">HẾT</span>
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <span className="text-title-md text-ink line-clamp-1 font-semibold">{item.name}</span>
          <span className="nums text-body-sm font-semibold text-ink shrink-0">{formatVnd(item.price)}</span>
        </div>
        <span className="text-caption text-body line-clamp-1">{item.description}</span>
        <Link to={`/app/restaurant/${item.restaurantId}`} onClick={(event) => event.stopPropagation()} className="text-caption text-muted hover:text-ink">
          {item.restaurantName}
        </Link>
      </div>
      {!addDisabled && (
        <IconButton
          icon="plus"
          label={`Thêm ${item.name} vào giỏ`}
          size="sm"
          variant="secondary"
          className="shrink-0"
          onClick={(event) => {
            event.stopPropagation();
            onAdd();
          }}
        />
      )}
    </div>
  );
}
