import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import Badge from '../../components/Badge.jsx';
import Button from '../../components/Button.jsx';
import Card from '../../components/Card.jsx';
import Icon from '../../components/Icon.jsx';
import Image from '../../components/Image.jsx';
import Input from '../../components/Input.jsx';
import EmptyState from '../../components/EmptyState.jsx';
import Tabs from '../../components/Tabs.jsx';
import { cuisines, restaurants } from '../../data/mock.js';
import { formatVnd } from '../../lib/formatVnd.js';

// --------------------------------------------------------------------------
// Khoảng giá sản phẩm — dual-thumb range slider, snap theo mốc cố định.
// Hiển thị đúng 5 khoảng giá (6 mốc: từ tối thiểu → cao nhất, mốc cuối = trần / "Không giới hạn" khi chọn max).
// --------------------------------------------------------------------------
const PRICE_STOPS = [
  0,
  100_000,
  200_000,
  350_000,
  500_000,
  1_000_000,
];

const PRICE_MIN_INDEX = 0;
const PRICE_MAX_INDEX = PRICE_STOPS.length - 1;

// platform_config.max_search_radius_km trong database.sql
const MAX_SEARCH_RADIUS_KM = 8;

const CUISINE_SLUG_SET = new Set(cuisines.map((c) => c.slug));

/** Liên kết cũ ?cat=pizza từ carousel — map sang slug `cuisines`. */
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
    const parts = raw.split(',').map((s) => s.trim()).filter(Boolean);
    return parts.filter((slug) => CUISINE_SLUG_SET.has(slug));
  }
  const legacy = searchParams.get('cat');
  if (legacy && LEGACY_CAT_TO_CUISINE_SLUG[legacy]) {
    const slug = LEGACY_CAT_TO_CUISINE_SLUG[legacy];
    return CUISINE_SLUG_SET.has(slug) ? [slug] : [];
  }
  return [];
}

function cuisineNamesForSlugs(slugs) {
  return cuisines.filter((c) => slugs.includes(c.slug)).map((c) => c.name);
}

// Lọc theo `restaurants` (rating_avg, is_open, cuisine_id→cuisines.name, khoảng cách tính từ tọa độ).
function restaurantPassesBase(r, cuisineSlugs, minRating, maxDistance, openOnly) {
  if (openOnly && !r.open) return false;
  if (r.rating < minRating) return false;
  if (r.distanceKm > maxDistance) return false;
  if (cuisineSlugs.length) {
    const names = cuisineNamesForSlugs(cuisineSlugs);
    if (!names.includes(r.cuisine)) return false;
  }
  return true;
}

function dishMatchesQuery(dish, q) {
  const needle = q.trim().toLowerCase();
  if (!needle) return true;
  const hay = `${dish.name} ${dish.desc ?? ''} ${dish.category} ${(dish.tags ?? []).join(' ')}`.toLowerCase();
  return hay.includes(needle);
}

function dishMatchesPrice(dish, priceFilterActive, priceRange, priceMinValue, priceMaxValue) {
  if (!priceFilterActive) return true;
  const upperBound = priceRange[1] === PRICE_MAX_INDEX ? Infinity : priceMaxValue;
  return dish.price >= priceMinValue && dish.price <= upperBound;
}

/** `menu_categories.name` trong DB — mock dùng `dish.category`. */
function dishPassesMenuGroups(dish, menuGroups) {
  if (!menuGroups.length) return true;
  return menuGroups.includes(dish.category);
}

/** Gắn với dữ liệu món (mock: tags tiếng Việt); khi có bảng menu_item_tags sẽ map sang đó. */
function dishPassesTagFilters(dish, selectedTags) {
  if (!selectedTags.length) return true;
  const itemTags = new Set((dish.tags ?? []).map((t) => String(t).toLowerCase()));
  return selectedTags.some((t) => itemTags.has(String(t).toLowerCase()));
}

function restaurantMatchesQuery(r, q) {
  const needle = q.trim().toLowerCase();
  if (!needle) return true;
  const hay = `${r.name} ${r.tagline} ${r.cuisine} ${r.tags.join(' ')}`.toLowerCase();
  return hay.includes(needle);
}

function restaurantHasMenuPriceInRange(r, priceFilterActive, priceRange, priceMinValue, priceMaxValue) {
  if (!priceFilterActive) return true;
  const upperBound = priceRange[1] === PRICE_MAX_INDEX ? Infinity : priceMaxValue;
  return (r.menu ?? []).some((m) => m.price >= priceMinValue && m.price <= upperBound);
}

function getMinMenuPrice(r) {
  if (!r?.menu?.length) return 0;
  return Math.min(...r.menu.map((m) => m.price));
}

function formatBracket(stopIndex, side) {
  const value = PRICE_STOPS[stopIndex];
  if (side === 'max' && stopIndex === PRICE_MAX_INDEX) return 'Không giới hạn';
  return formatVnd(value);
}

export default function CustomerSearch() {
  const [params, setParams] = useSearchParams();
  const initialQuery = params.get('q') || '';
  const initialTab = params.get('tab') === 'restaurants' ? 'restaurants' : 'dishes';

  const [q, setQ] = useState(initialQuery);
  const [cuisineSlugs, setCuisineSlugs] = useState(() => parseCuisineSlugsFromParams(params));
  const [menuGroups, setMenuGroups] = useState([]);
  const [dishTags, setDishTags] = useState([]);
  const [openOnly, setOpenOnly] = useState(false);
  const [minRating, setMinRating] = useState(0);
  const [maxDistance, setMaxDistance] = useState(5);
  // Dual-thumb price range as indices into PRICE_STOPS — keeps the slider math
  // simple and the snap behaviour predictable.
  const [priceRange, setPriceRange] = useState([PRICE_MIN_INDEX, PRICE_MAX_INDEX]);
  const [view, setView] = useState('grid');
  const [scope, setScope] = useState(initialTab);

  const priceMinValue = PRICE_STOPS[priceRange[0]];
  const priceMaxValue = PRICE_STOPS[priceRange[1]];
  const priceFilterActive = priceRange[0] !== PRICE_MIN_INDEX || priceRange[1] !== PRICE_MAX_INDEX;

  const cuisineUrlKey = `${params.get('cuisine') || ''}|${params.get('cat') || ''}`;
  useEffect(() => {
    setCuisineSlugs(parseCuisineSlugsFromParams(params));
  }, [cuisineUrlKey]);

  const menuCategoryOptions = useMemo(() => {
    const s = new Set();
    for (const r of restaurants) {
      for (const d of r.menu ?? []) {
        if (d.category) s.add(d.category);
      }
    }
    return Array.from(s).sort((a, b) => a.localeCompare(b, 'vi'));
  }, []);

  const dishTagOptions = useMemo(() => {
    const s = new Set();
    for (const r of restaurants) {
      for (const d of r.menu ?? []) {
        for (const t of d.tags ?? []) {
          if (t) s.add(t);
        }
      }
    }
    return Array.from(s).sort((a, b) => a.localeCompare(b, 'vi'));
  }, []);

  const syncCuisineParams = (nextSlugs) => {
    setParams(
      (prev) => {
        const np = new URLSearchParams(prev);
        np.delete('cat');
        if (nextSlugs.length) np.set('cuisine', nextSlugs.join(','));
        else np.delete('cuisine');
        return np;
      },
      { replace: true },
    );
  };

  const filteredDishes = useMemo(() => {
    const hits = [];
    for (const r of restaurants) {
      if (!restaurantPassesBase(r, cuisineSlugs, minRating, maxDistance, openOnly)) continue;
      for (const dish of r.menu ?? []) {
        if (!dish.inStock) continue;
        if (!dishMatchesQuery(dish, q)) continue;
        if (!dishMatchesPrice(dish, priceFilterActive, priceRange, priceMinValue, priceMaxValue)) continue;
        if (!dishPassesMenuGroups(dish, menuGroups)) continue;
        if (!dishPassesTagFilters(dish, dishTags)) continue;
        hits.push({ dish, restaurant: r });
      }
    }
    return hits;
  }, [
    q,
    cuisineSlugs,
    menuGroups,
    dishTags,
    minRating,
    maxDistance,
    openOnly,
    priceFilterActive,
    priceMinValue,
    priceMaxValue,
    priceRange,
  ]);

  const filteredRestaurants = useMemo(() => {
    return restaurants.filter((r) => {
      if (!restaurantPassesBase(r, cuisineSlugs, minRating, maxDistance, openOnly)) return false;
      if (!restaurantMatchesQuery(r, q)) return false;
      if (!restaurantHasMenuPriceInRange(r, priceFilterActive, priceRange, priceMinValue, priceMaxValue))
        return false;
      return true;
    });
  }, [
    q,
    cuisineSlugs,
    minRating,
    maxDistance,
    openOnly,
    priceFilterActive,
    priceMinValue,
    priceMaxValue,
    priceRange,
  ]);

  const activeResults = scope === 'dishes' ? filteredDishes : filteredRestaurants;

  const toggle = (setter, list, v) =>
    setter(list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);

  const toggleCuisine = (slug) => {
    const next = cuisineSlugs.includes(slug)
      ? cuisineSlugs.filter((s) => s !== slug)
      : [...cuisineSlugs, slug];
    setCuisineSlugs(next);
    syncCuisineParams(next);
  };

  return (
    <div className="container-page py-xl">
      <div className="mb-base flex flex-col gap-2">
        <div className="text-caption-uppercase text-body">Khám phá</div>
        <h1 className="text-display-lg text-ink">Tìm món và nhà hàng.</h1>
        <Tabs
          className="w-fit self-start max-w-full"
          items={[
            { value: 'dishes', label: 'Món ăn' },
            { value: 'restaurants', label: 'Nhà hàng' },
          ]}
          value={scope}
          onChange={(next) => {
            setScope(next);
            setParams(
              (prev) => {
                const np = new URLSearchParams(prev);
                if (next === 'restaurants') np.set('tab', 'restaurants');
                else np.delete('tab');
                return np;
              },
              { replace: true },
            );
          }}
        />
      </div>

      {/* Search */}
      <div className="mb-base flex flex-col gap-xs md:flex-row md:items-center">
        <Input
          leadingIcon="search"
          placeholder={
            scope === 'dishes'
              ? 'Tìm theo tên món, mô tả, danh mục…'
              : 'Tìm theo tên quán, slogan, loại ẩm thực…'
          }
          aria-label={scope === 'dishes' ? 'Tìm kiếm món ăn' : 'Tìm kiếm nhà hàng'}
          className="flex-1"
          value={q}
          onChange={(e) => {
            const v = e.target.value;
            setQ(v);
            setParams(
              (prev) => {
                const np = new URLSearchParams(prev);
                np.set('q', v);
                return np;
              },
              { replace: true },
            );
          }}
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
          <Badge tone="outline">{activeResults.length} kết quả</Badge>
        </div>
      </div>

      <div className="grid gap-base md:grid-cols-[260px_1fr]">
        {/* Sidebar filters */}
        <aside className="flex flex-col gap-base">
          <Card padded className="flex flex-col gap-md">
            <FilterGroup title="Loại ẩm thực">
              <p className="mb-xs text-body-sm text-body">Theo bảng cuisines (restaurants.cuisine_id).</p>
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

            {scope === 'dishes' && (
              <FilterGroup title="Nhóm món trên thực đơn">
                <p className="mb-xs text-body-sm text-body">Tên nhóm menu_categories theo từng quán.</p>
                <div className="flex max-h-48 flex-wrap gap-1 overflow-y-auto pr-1">
                  {menuCategoryOptions.map((name) => (
                    <button
                      key={name}
                      type="button"
                      onClick={() => toggle(setMenuGroups, menuGroups, name)}
                      className={
                        'rounded-pill border px-2.5 py-1 text-caption transition-colors ' +
                        (menuGroups.includes(name)
                          ? 'border-ink bg-primary text-on-primary'
                          : 'border-hairline-strong bg-surface-card text-ink hover:bg-canvas-soft')
                      }
                    >
                      {name}
                    </button>
                  ))}
                </div>
              </FilterGroup>
            )}

            <FilterGroup title={`Khoảng cách tối đa — ${maxDistance.toFixed(1)} km`}>
              <p className="mb-xs text-body-sm text-body">Tối đa {MAX_SEARCH_RADIUS_KM} km (max_search_radius_km).</p>
              <input
                type="range"
                min={0.5}
                max={MAX_SEARCH_RADIUS_KM}
                step={0.1}
                value={Math.min(maxDistance, MAX_SEARCH_RADIUS_KM)}
                onChange={(e) => setMaxDistance(parseFloat(e.target.value))}
                className="w-full accent-black"
              />
            </FilterGroup>

            <FilterGroup title={`Đánh giá quán tối thiểu — ${minRating.toFixed(1)}★`}>
              <p className="mb-xs text-body-sm text-body">restaurants.rating_avg.</p>
              <input
                type="range"
                min={0}
                max={5}
                step={0.1}
                value={minRating}
                onChange={(e) => setMinRating(parseFloat(e.target.value))}
                className="w-full accent-black"
              />
            </FilterGroup>

            <label className="flex cursor-pointer items-center gap-2 text-body-sm text-ink">
              <input
                type="checkbox"
                className="accent-black"
                checked={openOnly}
                onChange={(e) => setOpenOnly(e.target.checked)}
              />
              Chỉ quán đang mở (is_open_now)
            </label>

            <FilterGroup
              title={
                priceFilterActive
                  ? scope === 'dishes'
                    ? `Giá món — ${formatBracket(priceRange[0], 'min')} – ${formatBracket(priceRange[1], 'max')}`
                    : `Giá món trên thực đơn (có ít nhất một món) — ${formatBracket(priceRange[0], 'min')} – ${formatBracket(priceRange[1], 'max')}`
                  : scope === 'dishes'
                    ? 'Giá món (menu_items.price)'
                    : 'Giá món trên thực đơn (menu_items.price)'
              }
            >
              {scope === 'restaurants' && (
                <p className="mb-xs text-body-sm text-body">Quán có ít nhất một món trong khoảng giá.</p>
              )}
              {scope === 'dishes' && (
                <p className="mb-xs text-body-sm text-body">menu_items.price.</p>
              )}
              <PriceRangeSlider value={priceRange} onChange={setPriceRange} />
            </FilterGroup>

            {scope === 'dishes' && dishTagOptions.length > 0 && (
              <FilterGroup title="Ghi chú món (demo)">
                <p className="mb-xs text-body-sm text-body">Chưa có cột tag trên menu_items; lọc theo tags trong mock.</p>
                <div className="flex flex-wrap gap-1">
                  {dishTagOptions.map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => toggle(setDishTags, dishTags, t)}
                      className={
                        'rounded-pill border px-2.5 py-1 text-caption transition-colors ' +
                        (dishTags.includes(t)
                          ? 'border-ink bg-primary text-on-primary'
                          : 'border-hairline-strong bg-surface-card text-ink hover:bg-canvas-soft')
                      }
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </FilterGroup>
            )}

            <Button
              variant="secondary"
              onClick={() => {
                setQ('');
                setCuisineSlugs([]);
                setMenuGroups([]);
                setDishTags([]);
                setOpenOnly(false);
                setMinRating(0);
                setMaxDistance(5);
                setPriceRange([PRICE_MIN_INDEX, PRICE_MAX_INDEX]);
                setScope('dishes');
                setParams(
                  (prev) => {
                    const np = new URLSearchParams(prev);
                    np.delete('q');
                    np.delete('cat');
                    np.delete('cuisine');
                    np.delete('tab');
                    return np;
                  },
                  { replace: true },
                );
              }}
            >
              Đặt lại bộ lọc
            </Button>
          </Card>
        </aside>

        {/* Results */}
        <div className="flex flex-col gap-base">
          {activeResults.length === 0 ? (
            <EmptyState
              icon="search"
              title={scope === 'dishes' ? 'Không có món nào phù hợp' : 'Không có nhà hàng nào phù hợp'}
              message={
                scope === 'dishes'
                  ? 'Hãy thử từ khóa khác, mở rộng khoảng giá, khoảng cách hoặc xóa danh mục đang chọn.'
                  : 'Hãy thử từ khóa khác, nới bộ lọc hoặc chuyển sang tab Món ăn để tìm theo tên món.'
              }
            />
          ) : view === 'grid' ? (
            <div className="grid grid-cols-2 gap-base xl:grid-cols-3">
              {scope === 'dishes'
                ? filteredDishes.map((hit) => (
                    <DishResultCard key={`${hit.restaurant.id}-${hit.dish.id}`} hit={hit} />
                  ))
                : filteredRestaurants.map((r) => <RestaurantResultCard key={r.id} r={r} />)}
            </div>
          ) : (
            <div className="flex flex-col divide-y divide-hairline rounded-lg border border-hairline-strong bg-surface-card">
              {scope === 'dishes'
                ? filteredDishes.map((hit) => (
                    <DishResultRow key={`${hit.restaurant.id}-${hit.dish.id}`} hit={hit} />
                  ))
                : filteredRestaurants.map((r) => <RestaurantResultRow key={r.id} r={r} />)}
            </div>
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

// Dual-thumb range slider that snaps to PRICE_STOPS indices.
//
// The element is rendered as two overlaid <input type=range>; the parent
// `.range-dual` styles ensure only the round thumbs receive pointer events,
// so both handles stay independently grabbable. A faux track + highlighted
// middle segment sit behind them; tick marks reuse PRICE_STOPS so the user
// has visual reference for the dense low end and sparser high end.
function PriceRangeSlider({ value, onChange }) {
  const [minIdx, maxIdx] = value;
  const max = PRICE_MAX_INDEX;
  const leftPct = (minIdx / max) * 100;
  const rightPct = (maxIdx / max) * 100;

  const setMin = (n) => {
    const clamped = Math.min(Number(n), maxIdx);
    onChange([clamped, maxIdx]);
  };
  const setMax = (n) => {
    const clamped = Math.max(Number(n), minIdx);
    onChange([minIdx, clamped]);
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="relative h-7">
        {/* Faux track */}
        <div className="absolute left-0 right-0 top-1/2 h-1 -translate-y-1/2 rounded-pill bg-surface-strong" />
        {/* Highlighted segment */}
        <div
          className="absolute top-1/2 h-1 -translate-y-1/2 rounded-pill bg-ink"
          style={{ left: `${leftPct}%`, right: `${100 - rightPct}%` }}
        />
        {/* Tick marks */}
        <div className="pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2">
          {PRICE_STOPS.map((_, i) => {
            const inRange = i >= minIdx && i <= maxIdx;
            return (
              <span
                key={i}
                className={
                  'absolute top-1/2 h-2 w-px -translate-y-1/2 ' +
                  (inRange ? 'bg-ink/40' : 'bg-hairline-strong')
                }
                style={{ left: `${(i / max) * 100}%` }}
              />
            );
          })}
        </div>
        {/* Thumbs — both sliders stack on the same line */}
        <input
          type="range"
          min={0}
          max={max}
          step={1}
          value={minIdx}
          onChange={(e) => setMin(e.target.value)}
          aria-label="Giá tối thiểu"
          className="range-dual absolute inset-x-0 top-1/2 -translate-y-1/2"
        />
        <input
          type="range"
          min={0}
          max={max}
          step={1}
          value={maxIdx}
          onChange={(e) => setMax(e.target.value)}
          aria-label="Giá tối đa"
          className="range-dual absolute inset-x-0 top-1/2 -translate-y-1/2"
        />
      </div>

      {/* Live readout */}
      <div className="flex items-center justify-between text-caption text-body nums">
        <span>{formatBracket(minIdx, 'min')}</span>
        <span>{formatBracket(maxIdx, 'max')}</span>
      </div>
    </div>
  );
}

function DishResultCard({ hit }) {
  const { dish, restaurant: r } = hit;
  return (
    <Link
      to={`/app/restaurant/${r.id}`}
      className="group flex flex-col overflow-hidden rounded-lg border border-hairline-strong bg-surface-card transition-shadow hover:shadow-soft"
    >
      <Image src={dish.image} alt={dish.name} ratio="1" className="w-full" />
      <div className="flex flex-1 flex-col gap-1 p-base">
        <div className="flex items-start justify-between gap-2">
          <span className="text-title-md text-ink line-clamp-2 leading-tight">{dish.name}</span>
          <span className="nums shrink-0 text-body-sm font-semibold text-ink">{formatVnd(dish.price)}</span>
        </div>
        <span className="text-body-sm text-body line-clamp-1">{r.name}</span>
        <div className="mt-auto flex flex-col gap-1.5 pt-2 text-caption text-body md:hidden">
          <div className="flex items-center justify-between gap-2">
            <span className="inline-flex min-w-0 items-center gap-1">
              <Icon name="clock" size={12} className="shrink-0" />
              <span className="truncate">{r.eta}</span>
            </span>
            <span className="inline-flex shrink-0 items-center gap-1 nums">
              <Icon name="pin" size={12} />
              {r.distanceKm} km
            </span>
          </div>
          <span className="text-caption text-body line-clamp-1">{dish.category}</span>
        </div>
        <div className="mt-auto hidden flex-wrap items-center gap-x-3 gap-y-1 pt-2 text-caption text-body md:flex">
          <span className="inline-flex items-center gap-1">
            <Icon name="clock" size={12} /> {r.eta}
          </span>
          <span className="inline-flex items-center gap-1">
            <Icon name="pin" size={12} /> {r.distanceKm} km
          </span>
          <span className="inline-flex items-center gap-1">
            <Icon name="starFilled" size={12} />
            <span className="nums">{r.rating.toFixed(1)}</span>
          </span>
          <span>{dish.category}</span>
        </div>
      </div>
    </Link>
  );
}

function DishResultRow({ hit }) {
  const { dish, restaurant: r } = hit;
  return (
    <Link to={`/app/restaurant/${r.id}`} className="flex items-center gap-base p-sm hover:bg-canvas-soft">
      <Image src={dish.image} alt={dish.name} className="h-16 w-16 shrink-0 rounded-md" ratio="1" />
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <span className="text-title-md text-ink line-clamp-2 leading-tight">{dish.name}</span>
          <span className="nums shrink-0 text-body-sm font-semibold text-ink">{formatVnd(dish.price)}</span>
        </div>
        <span className="text-body-sm text-body">{r.name}</span>
        <div className="mt-1 flex flex-col gap-1 text-caption text-body md:hidden">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <span className="inline-flex items-center gap-1">
              <Icon name="clock" size={12} /> {r.eta}
            </span>
            <span className="inline-flex items-center gap-1 nums">
              <Icon name="pin" size={12} /> {r.distanceKm} km
            </span>
            <span className="inline-flex items-center gap-1 nums">{dish.category}</span>
          </div>
        </div>
        <div className="mt-1 hidden flex-wrap items-center gap-x-3 gap-y-1 text-caption text-body md:flex">
          <span>{r.eta}</span>
          <span>{r.distanceKm} km</span>
          <span className="nums">{r.rating.toFixed(1)}★</span>
          <span>{dish.category}</span>
        </div>
      </div>
      <Icon name="arrowRight" size={16} className="shrink-0 text-body" />
    </Link>
  );
}

function RestaurantResultCard({ r }) {
  const minPrice = getMinMenuPrice(r);
  return (
    <Link
      to={`/app/restaurant/${r.id}`}
      className="group flex flex-col overflow-hidden rounded-lg border border-hairline-strong bg-surface-card transition-shadow hover:shadow-soft"
    >
      <Image src={r.banner} alt={r.name} ratio="16/10" className="w-full" />
      <div className="flex flex-1 flex-col gap-1 p-base">
        <div className="flex items-center justify-between gap-2">
          <span className="text-title-md text-ink line-clamp-2 leading-tight">{r.name}</span>
          <span className="inline-flex shrink-0 items-center gap-1 text-body-sm text-ink">
            <Icon name="starFilled" size={12} />
            <span className="nums">{r.rating.toFixed(1)}</span>
          </span>
        </div>
        <span className="text-body-sm text-body line-clamp-2">{r.tagline}</span>
        <div className="mt-auto flex flex-col gap-1.5 pt-2 text-caption text-body md:hidden">
          <div className="flex items-center justify-between gap-2">
            <span className="inline-flex min-w-0 items-center gap-1">
              <Icon name="clock" size={12} className="shrink-0" />
              <span className="truncate">{r.eta}</span>
            </span>
            <span className="inline-flex shrink-0 items-center gap-1 nums">
              <Icon name="pin" size={12} />
              {r.distanceKm} km
            </span>
          </div>
          <span className="inline-flex w-fit items-center gap-1 rounded-md border border-hairline-soft bg-canvas-soft px-2 py-1 nums">
            Từ {formatVnd(minPrice)}
          </span>
        </div>
        <div className="mt-auto hidden flex-wrap items-center gap-x-3 gap-y-1 pt-2 text-caption text-body md:flex">
          <span className="inline-flex items-center gap-1">
            <Icon name="clock" size={12} /> {r.eta}
          </span>
          <span className="inline-flex items-center gap-1">
            <Icon name="pin" size={12} /> {r.distanceKm} km
          </span>
          <span className="inline-flex items-center gap-1 nums">Từ {formatVnd(minPrice)}</span>
        </div>
      </div>
    </Link>
  );
}

function RestaurantResultRow({ r }) {
  const minPrice = getMinMenuPrice(r);
  return (
    <Link to={`/app/restaurant/${r.id}`} className="flex items-center gap-base p-sm hover:bg-canvas-soft">
      <Image src={r.banner} alt={r.name} className="h-16 w-24 shrink-0 rounded-md" ratio="16/10" />
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <span className="text-title-md text-ink line-clamp-2 leading-tight">{r.name}</span>
          <span className="inline-flex shrink-0 items-center gap-1 text-body-sm text-ink">
            <Icon name="starFilled" size={12} />
            <span className="nums">{r.rating.toFixed(1)}</span>
          </span>
        </div>
        <span className="text-body-sm text-body line-clamp-2">{r.tagline}</span>
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-caption text-body md:hidden">
          <span className="inline-flex items-center gap-1">
            <Icon name="clock" size={12} /> {r.eta}
          </span>
          <span className="inline-flex items-center gap-1 nums">
            <Icon name="pin" size={12} /> {r.distanceKm} km
          </span>
          <span className="inline-flex items-center gap-1 nums">Từ {formatVnd(minPrice)}</span>
        </div>
        <div className="mt-1 hidden flex-wrap items-center gap-x-3 gap-y-1 text-caption text-body md:flex">
          <span>{r.eta}</span>
          <span>{r.distanceKm} km</span>
          <span className="nums">Từ {formatVnd(minPrice)}</span>
        </div>
      </div>
      <Icon name="arrowRight" size={16} className="shrink-0 text-body" />
    </Link>
  );
}
