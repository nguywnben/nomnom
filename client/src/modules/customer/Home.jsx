import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useOutletContext } from 'react-router-dom';
import clsx from 'clsx';
import Badge from '../../components/Badge.jsx';
import Button from '../../components/Button.jsx';
import Icon from '../../components/Icon.jsx';
import Image from '../../components/Image.jsx';
import Avatar from '../../components/Avatar.jsx';
import Skeleton from '../../components/Skeleton.jsx';
import DishQuickViewModal from './DishQuickViewModal.jsx';
import { useHomeCategories } from '../../hooks/useHomeCategories.js';
import { useHomePromos } from '../../hooks/useHomePromos.js';
import { useCuisines } from '../../hooks/useCuisines.js';
import { useHorizontalDragScroll } from '../../hooks/useHorizontalDragScroll.js';
import { useApp } from '../../context/AppContext.jsx';
import { formatVnd } from '../../lib/formatVnd.js';
import { useSearchSuggestions } from '../../hooks/useSearchSuggestions.js';
import {
  fetchFeaturedRestaurantsApi,
  fetchNearbyDishesApi,
  fetchTrendingDishesApi,
  fetchOrderAgainApi,
  fetchHomePageConfigApi,
} from '../../lib/api.js';

const HERO_BG = 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1800&q=80';

const HERO_TRUST_TAGS = [
  { label: 'Gọn gàng, tìm món nhanh', icon: 'check' },
  { label: 'Đơn theo dõi rõ từng bước', icon: 'package' },
  { label: 'Nhiều quán hay quanh bạn', icon: 'pin' },
  { label: 'Rõ giá trước khi thanh toán', icon: 'shield' },
  { label: 'Hỗ trợ nhanh khi cần', icon: 'chat' },
];

// Prefetch chunk lazy (trang quán / món) khi người dùng hover card — giảm thời gian chờ chuyển trang.
const prefetchRestaurantChunk = () => import('../../modules/customer/Restaurant.jsx').catch(() => {});
const prefetchDishChunk = () => import('../../modules/customer/DishDetail.jsx').catch(() => {});

export default function CustomerHome() {
  const nav = useNavigate();
  const { deliveryLocalityLine } = useOutletContext() ?? {};
  const { user, shopAsCustomer, currentLocation } = useApp();
  const canViewOrderAgain = Boolean(user?.id && shopAsCustomer);
  const { categories, loading: categoriesLoading, error: categoriesError } = useHomeCategories(currentLocation);
  const { promos, loading: promosLoading, error: promosError } = useHomePromos();
  const { cuisines, loading: cuisinesLoading } = useCuisines();
  const cuisineScroll = useHorizontalDragScroll();
  const exploreScroll = useHorizontalDragScroll();
  const nearbyScroll = useHorizontalDragScroll();
  const trendingScroll = useHorizontalDragScroll();

  const [featuredRestaurants, setFeaturedRestaurants] = useState([]);
  const [featuredLoading, setFeaturedLoading] = useState(true);

  const [trendingDishes, setTrendingDishes] = useState([]);
  const [trendingLoading, setTrendingLoading] = useState(true);
  const [trendingSource, setTrendingSource] = useState('today');

  const [nearbyDishes, setNearbyDishes] = useState([]);
  const [nearbyLoading, setNearbyLoading] = useState(true);
  const nearbySeed = useRef(`${Date.now()}${Math.random().toString(36).slice(2)}`);

  const [orderAgainList, setOrderAgainList] = useState([]);
  const [quickViewDish, setQuickViewDish] = useState(null);
  const [pageConfig, setPageConfig] = useState(null);
  const [heroQuery, setHeroQuery] = useState('');
  const heroSuggestions = useSearchSuggestions(heroQuery, { limit: 4 });

  useEffect(() => {
    fetchHomePageConfigApi().then((response) => setPageConfig(response.config ?? null)).catch(() => {});
  }, []);

  const sectionProps = (id) => {
    const section = pageConfig?.sections?.find((item) => item.id === id);
    return { hidden: section?.isVisible === false, style: section ? { order: section.sortOrder } : undefined };
  };
  const hero = pageConfig?.hero;

  useEffect(() => {
    let mounted = true;

    fetchFeaturedRestaurantsApi(currentLocation)
      .then((res) => {
        if (mounted) setFeaturedRestaurants(res.data ?? []);
      })
      .catch((err) => console.error('Failed fetching featured restaurants:', err))
      .finally(() => {
        if (mounted) setFeaturedLoading(false);
      });

    fetchTrendingDishesApi(currentLocation)
      .then((res) => {
        if (mounted) {
          setTrendingDishes(res.data ?? []);
          setTrendingSource(res.source ?? 'today');
        }
      })
      .catch((err) => console.error('Failed fetching trending dishes:', err))
      .finally(() => {
        if (mounted) setTrendingLoading(false);
      });

    fetchNearbyDishesApi(currentLocation, nearbySeed.current)
      .then((res) => {
        if (mounted) setNearbyDishes(res.data ?? []);
      })
      .catch((err) => console.error('Failed fetching nearby dishes:', err))
      .finally(() => {
        if (mounted) setNearbyLoading(false);
      });

    if (canViewOrderAgain) {
      fetchOrderAgainApi()
        .then((res) => {
          if (mounted) setOrderAgainList(res.data ?? []);
        })
        .catch(() => {});
    } else {
      setOrderAgainList([]);
    }

    return () => {
      mounted = false;
    };
  }, [canViewOrderAgain, currentLocation]);

  return (
    <div className="flex flex-col bg-canvas">
      {/* HERO */}
      <section className="relative isolate" style={{ order: 0 }}>
        <div
          className="absolute inset-0 -z-10"
          style={{
            backgroundImage: `url(${hero?.imageUrl || HERO_BG})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
          aria-hidden="true"
        />
        <div
          className="absolute inset-0 -z-10 bg-gradient-to-b from-ink/65 via-ink/45 to-ink/65"
          aria-hidden="true"
        />

        <div className="container-page pb-xxl pt-28 max-md:pt-[max(7rem,calc(env(safe-area-inset-top,0px)+5.5rem))] md:pt-32 md:pb-section">
          <div className="mx-auto max-w-2xl text-center">
            <span className="inline-flex max-w-full items-center gap-1 rounded-pill bg-canvas/15 px-2.5 py-0.5 text-caption text-on-dark backdrop-blur">
              <Icon name="pin" size={12} className="shrink-0" />
              <span className="min-w-0 truncate">Khám phá quanh bạn · {deliveryLocalityLine}</span>
            </span>
            <h1 className="mt-base text-display-lg text-on-dark md:text-display-xl lg:text-display-mega">
              {hero?.title || 'Đói bụng? Đặt món ngay.'}
            </h1>
            <p className="mt-xs text-body-md text-on-dark-soft">
              {hero?.subtitle || 'Khám phá món ngon giao siêu tốc từ các quán ăn hàng đầu quanh bạn.'}
            </p>

            {/* Hero search bar */}
            <div className="relative">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const q = heroQuery.trim();
                  nav('/app/search' + (q ? `?q=${encodeURIComponent(q)}` : ''));
                }}
                className="mt-lg flex items-stretch gap-0.5 rounded-lg border border-hairline-strong bg-surface-card p-0.5 shadow-soft-lg sm:gap-xs sm:p-1 md:gap-1"
              >
                <div className="flex min-w-0 flex-1 items-center gap-1.5 px-2 sm:gap-2 sm:px-sm">
                  <Icon name="search" size={14} className="text-body md:hidden" />
                  <Icon name="search" size={16} className="hidden text-body md:block" />
                  <input
                    name="q"
                    type="search"
                    value={heroQuery}
                    onChange={(e) => setHeroQuery(e.target.value)}
                    placeholder="Tìm kiếm quán ăn hoặc món ăn…"
                    autoComplete="off"
                    className="h-9 w-full min-w-0 bg-transparent text-body-sm text-ink placeholder:text-muted outline-none sm:h-10 md:h-11 md:text-body-md"
                  />
                </div>
                <Button
                  type="submit"
                  size="lg"
                  className="shrink-0 !h-9 !px-3 !text-caption sm:!h-10 sm:!px-sm sm:!text-button md:!h-12 md:!px-md"
                >
                  <span className="md:hidden">Tìm</span>
                  <span className="hidden md:inline">Tìm món & quán</span>
                </Button>
              </form>

              {/* Gợi ý khi gõ */}
              {heroQuery.trim().length > 0 && heroSuggestions && (
                <div className="absolute inset-x-0 top-[calc(100%-0.25rem)] z-20 mt-xs overflow-hidden rounded-lg border border-hairline-strong bg-surface-card py-1 text-left shadow-soft-md">
                  {heroSuggestions.restaurants?.length === 0 && heroSuggestions.menuItems?.length === 0 ? (
                    <div className="px-sm py-2 text-caption text-body">Không tìm thấy kết quả.</div>
                  ) : (
                    <>
                      {(heroSuggestions.menuItems ?? []).slice(0, 4).map((item) => (
                        <Link
                          key={`m-${item.id}`}
                          to={`/app/dish/${item.id}`}
                          onClick={() => setHeroQuery('')}
                          className="flex items-center gap-sm px-sm py-2 hover:bg-canvas-soft"
                        >
                          <Icon name="search" size={14} className="shrink-0 text-body" />
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-body-sm text-ink">{item.name}</span>
                            <span className="block truncate text-caption text-body">{item.restaurantName}</span>
                          </span>
                        </Link>
                      ))}
                      {(heroSuggestions.restaurants ?? []).slice(0, 3).map((r) => (
                        <Link
                          key={`r-${r.id}`}
                          to={`/app/restaurant/${r.id}`}
                          onClick={() => setHeroQuery('')}
                          className="flex items-center gap-sm px-sm py-2 hover:bg-canvas-soft"
                        >
                          <Icon name="store" size={14} className="shrink-0 text-body" />
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-body-sm text-ink">{r.name}</span>
                            <span className="block truncate text-caption text-body">{r.cuisineName ?? 'Quán ăn'}</span>
                          </span>
                        </Link>
                      ))}
                      <Link
                        to={`/app/search?q=${encodeURIComponent(heroQuery.trim())}`}
                        onClick={() => setHeroQuery('')}
                        className="flex items-center gap-sm border-t border-hairline px-sm py-2 text-button text-text-link hover:bg-canvas-soft"
                      >
                        Xem tất cả kết quả cho "{heroQuery.trim()}"
                      </Link>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Trust tags */}
            <div className="mt-base -mx-base overflow-x-auto px-base pb-1 no-scrollbar md:mx-0 md:overflow-visible md:px-0 md:pb-0">
              <div
                className="flex w-max max-md:snap-x max-md:snap-mandatory flex-nowrap gap-1.5 max-md:pr-base md:w-full md:flex-wrap md:justify-center"
                role="list"
                aria-label="Điểm nổi bật NomNom"
              >
                {HERO_TRUST_TAGS.map((f) => (
                  <span
                    key={f.label}
                    role="listitem"
                    className="inline-flex max-md:snap-start shrink-0 items-center gap-1 rounded-pill border border-canvas/30 bg-canvas/10 px-2 py-1 text-[11px] font-medium leading-tight text-on-dark backdrop-blur sm:text-caption md:gap-1.5 md:px-2.5 md:py-1"
                  >
                    <Icon name={f.icon} size={11} />
                    {f.label}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="pointer-events-none absolute inset-x-0 bottom-base flex justify-center text-on-dark-soft">
          <Icon name="chevronDown" size={20} className="opacity-70" />
        </div>
      </section>

      {/* CUISINES */}
      <section className="container-page py-xl" {...sectionProps('cuisines')}>
        <SectionHeader
          caption="Khám phá nhanh"
          title="Loại hình ẩm thực"
          right={<CarouselArrows scrollRef={cuisineScroll.ref} />}
        />
        <div
          ref={cuisineScroll.ref}
          onMouseDown={cuisineScroll.onMouseDown}
          onClickCapture={cuisineScroll.onClickCapture}
          className="-mx-base min-w-0 cursor-default overflow-x-auto overscroll-x-contain px-base pb-1 no-scrollbar active:cursor-grabbing md:mx-0 md:px-0"
          role="region"
          aria-label="Loại hình ẩm thực — cuộn ngang"
        >
          <div className="flex w-max gap-sm">
            {cuisinesLoading && Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="w-28 shrink-0"><Skeleton className="aspect-square w-full rounded-lg" /><Skeleton className="mt-2 h-3 w-3/4" rounded="sm" /></div>
            ))}
            {!cuisinesLoading && cuisines.map((cuisine) => (
              <Link
                key={cuisine.id}
                to={`/app/search?cuisine=${encodeURIComponent(cuisine.slug)}`}
                className="group w-28 shrink-0 cursor-pointer"
              >
                <div className="relative aspect-square overflow-hidden rounded-lg border border-hairline-strong bg-canvas-soft transition-shadow duration-200 ease-out group-hover:shadow-soft">
                  {cuisine.iconUrl ? <img src={cuisine.iconUrl} alt="" className="h-full w-full object-cover" /> : <div className="grid h-full place-items-center text-body"><Icon name="grid" size={22} /></div>}
                </div>
                <div className="mt-xs truncate text-center text-body-sm font-medium text-ink">{cuisine.name}</div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURED DISHES */}
      <section className="container-page pb-xl" {...sectionProps('featured-dishes')}>
        <SectionHeader
          caption="Khám phá hôm nay"
          title="Món nổi bật từ nhiều quán"
          right={
            <div className="flex items-center gap-sm">
              <CarouselArrows scrollRef={exploreScroll.ref} />
              <Link to="/app/search?tab=food" className="text-button text-text-link hover:underline">
                Xem tất cả
              </Link>
            </div>
          }
        />
        <div
          ref={exploreScroll.ref}
          onMouseDown={exploreScroll.onMouseDown}
          onClickCapture={exploreScroll.onClickCapture}
          className="-mx-base min-w-0 cursor-default overflow-x-auto overscroll-x-contain px-base pb-1 no-scrollbar active:cursor-grabbing md:mx-0 md:px-0"
          role="region"
          aria-label="Món nổi bật từ nhiều quán — cuộn ngang"
        >
          <div className="flex w-max flex-nowrap gap-base">
            {categoriesLoading &&
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="w-[232px] shrink-0 overflow-hidden rounded-lg border border-hairline-strong bg-surface-card md:w-[248px]">
                  <Skeleton className="aspect-[4/3] w-full rounded-none" rounded="none" />
                  <div className="space-y-2 p-sm">
                    <Skeleton className="h-4 w-3/4" rounded="sm" />
                    <Skeleton className="h-3 w-1/2" rounded="sm" />
                  </div>
                </div>
              ))}
            {!categoriesLoading && categoriesError && (
              <p className="px-2 text-body-sm text-body">{categoriesError}</p>
            )}
            {!categoriesLoading &&
              !categoriesError &&
              categories.map((c) => (
                <HomeDishCard key={c.id} dish={c} onPreview={() => setQuickViewDish(c)} />
              ))}
          </div>
        </div>
      </section>

      {/* NEARBY DISHES */}
      <section className="container-page" {...sectionProps('nearby-dishes')}>
        <SectionHeader
          caption="Theo vị trí hiện tại"
          title="Các món gần bạn"
          right={
            <div className="flex items-center gap-sm">
              <CarouselArrows scrollRef={nearbyScroll.ref} />
              <Link to="/app/search?tab=food" className="text-button text-text-link hover:underline">
                Xem tất cả
              </Link>
            </div>
          }
        />
        {nearbyLoading ? (
          <DishCarouselSkeleton />
        ) : !currentLocation ? (
          <p className="text-body-sm text-body">Hãy cho phép truy cập vị trí để xem các món có thể giao đến bạn.</p>
        ) : nearbyDishes.length === 0 ? (
          <p className="text-body-sm text-body">Chưa có món nào đang giao đến khu vực của bạn.</p>
        ) : (
          <div
            ref={nearbyScroll.ref}
            onMouseDown={nearbyScroll.onMouseDown}
            onClickCapture={nearbyScroll.onClickCapture}
            className="-mx-base flex cursor-default gap-base overflow-x-auto px-base pb-1 no-scrollbar active:cursor-grabbing md:mx-0 md:px-0"
          >
            {nearbyDishes.map((dish) => (
              <DishCard key={dish.id} dish={dish} onPreview={() => setQuickViewDish(dish)} />
            ))}
          </div>
        )}
      </section>

      {/* PROMO STRIP */}
      <section className="container-page py-xl" {...sectionProps('promos')}>
        <div className="grid gap-base md:grid-cols-3">
          {promosLoading &&
            Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="aspect-[16/9] w-full rounded-lg" />
            ))}
          {!promosLoading && promosError && (
            <p className="col-span-full text-body-sm text-body md:col-span-3">{promosError}</p>
          )}
          {!promosLoading &&
            !promosError &&
            promos.map((p) => (
              <PromoBanner
                key={p.id}
                image={p.imageUrl}
                tag={p.tag}
                title={p.title}
                sub={p.subtitle}
                cta={p.ctaLabel}
                linkUrl={p.linkUrl}
              />
            ))}
        </div>
      </section>

      {/* TODAY'S TRENDING DISHES */}
      <section className="container-page pb-xl" {...sectionProps('trending')}>
        <SectionHeader
          caption={trendingSource === 'today' ? 'Được giao nhiều hôm nay' : 'Đang hot'}
          title={trendingSource === 'today' ? 'Thịnh hành hôm nay' : 'Các món thịnh hành'}
          right={
            <div className="flex items-center gap-sm">
              <CarouselArrows scrollRef={trendingScroll.ref} />
              <Link to="/app/search?tab=food" className="text-button text-text-link hover:underline">
                Xem tất cả
              </Link>
            </div>
          }
        />
        {trendingLoading ? (
          <div className="-mx-base flex gap-base overflow-x-auto px-base pb-1 no-scrollbar md:mx-0 md:px-0">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="w-[232px] shrink-0 overflow-hidden rounded-lg border border-hairline-strong bg-surface-card md:w-[248px]">
                <Skeleton className="aspect-[4/3] w-full rounded-none" rounded="none" />
                <div className="space-y-2 p-sm">
                  <Skeleton className="h-4 w-3/4" rounded="sm" />
                  <Skeleton className="h-3 w-1/2" rounded="sm" />
                </div>
              </div>
            ))}
          </div>
        ) : trendingDishes.length === 0 ? (
          <p className="text-body-sm text-body">Chưa có món thịnh hành.</p>
        ) : (
          <div
            ref={trendingScroll.ref}
            onMouseDown={trendingScroll.onMouseDown}
            onClickCapture={trendingScroll.onClickCapture}
            className="-mx-base flex cursor-default gap-base overflow-x-auto px-base pb-1 no-scrollbar active:cursor-grabbing md:mx-0 md:px-0"
          >
            {trendingDishes.map((d) => (
              <DishCard
                key={d.id}
                dish={d}
                onPreview={() => setQuickViewDish(d)}
              />
            ))}
          </div>
        )}
      </section>

      {/* ORDER AGAIN (Chỉ hiển thị khi đã đăng nhập và có lịch sử) */}
      {canViewOrderAgain && orderAgainList.length > 0 && (
        <section className="container-page pb-xl" {...sectionProps('order-again')}>
          <SectionHeader
            caption="Chào mừng trở lại"
            title="Đặt lại món"
            right={
              <Link to="/app/orders" className="text-button text-text-link hover:underline">
                Đơn hàng của bạn
              </Link>
            }
          />
          <div className="-mx-base flex gap-sm overflow-x-auto px-base pb-1 no-scrollbar md:mx-0 md:px-0">
            {orderAgainList.map((r) => (
              <Link
                key={r.id}
                to={`/app/restaurant/${r.id}`}
                className="group flex w-[260px] shrink-0 items-center gap-sm rounded-lg border border-hairline-strong bg-surface-card p-sm transition-shadow hover:shadow-soft"
              >
                <Image src={r.logo} alt={r.name} className="h-12 w-12 rounded-md" ratio="1" />
                <div className="min-w-0 flex-1">
                  <div className="text-body-sm font-semibold text-ink truncate">{r.name}</div>
                  <div className="text-caption text-body inline-flex items-center gap-1">
                    <Icon name="clock" size={11} /> {r.eta}
                  </div>
                </div>
                <Icon name="arrowRight" size={14} className="text-body group-hover:text-ink" />
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* FEATURED RESTAURANTS */}
      <section className="container-page pb-xl" {...sectionProps('featured-restaurants')}>
        <SectionHeader
          caption="Nổi bật"
          title="Quán ăn nổi bật"
          right={
            <Link to="/app/search" className="text-button text-text-link hover:underline">
              Xem tất cả
            </Link>
          }
        />
        {featuredLoading ? (
          <FeaturedRestaurantGridSkeleton />
        ) : featuredRestaurants.length === 0 ? (
          <p className="text-body-sm text-body">Chưa có quán ăn nổi bật nào.</p>
        ) : (
          <div className="grid grid-cols-2 gap-base lg:grid-cols-3">
            {featuredRestaurants.map((r) => (
              <RestaurantCard key={r.id} restaurant={r} />
            ))}
          </div>
        )}
      </section>

      {/* MOOD TILES */}
      <section className="container-page pb-xxl" {...sectionProps('moods')}>
        <SectionHeader caption="Khám phá" title="Theo tâm trạng" />
        <div className="grid grid-cols-2 gap-base lg:grid-cols-4">
          {(pageConfig?.moods ?? []).filter((m) => m.isVisible).map((m) => (
            <Link
              key={m.id}
              to={m.linkUrl}
              className="group relative aspect-[4/5] overflow-hidden rounded-lg border border-hairline-strong transition-shadow hover:shadow-soft"
            >
              <Image src={m.imageUrl} alt={m.label} ratio="4/5" className="h-full w-full" />
              <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-ink/15 to-transparent" />
              <div className="absolute inset-0 flex flex-col justify-end p-base text-on-dark">
                <span className="text-caption-uppercase text-on-dark-soft">{m.subtitle}</span>
                <span className="text-display-sm">{m.label}</span>
                <span className="mt-1 inline-flex items-center gap-1 text-button text-on-dark">
                  Khám phá <Icon name="arrowRight" size={14} />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* QUIET PARTNER CTA */}
      <section className="border-t border-hairline bg-canvas-soft" {...sectionProps('partner')}>
        <div className="container-page flex flex-col items-center gap-sm py-xl text-center md:flex-row md:items-center md:justify-between md:text-left">
          <div className="flex items-center gap-sm">
            <span className="grid h-10 w-10 place-items-center rounded-md bg-primary text-on-primary">
              <Icon name="store" size={18} />
            </span>
            <div>
              <div className="text-title-md text-ink">Hợp tác với NomNom</div>
              <div className="text-body-sm text-body">
                Bạn có quán ăn hoặc muốn giao hàng? Hãy tham gia nền tảng.
              </div>
            </div>
          </div>
          <div className="flex items-center gap-xs">
            <Button variant="secondary" size="sm" onClick={() => nav('/merchant')}>
              Dành cho quán ăn
            </Button>
          </div>
        </div>
      </section>

      <DishQuickViewModal dish={quickViewDish} onClose={() => setQuickViewDish(null)} />
    </div>
  );
}


// ---------------------------------------------------------------------------
// Pieces
// ---------------------------------------------------------------------------

/** Mirrors <RestaurantCard /> layout (16:10 media, logo chip, title/rating/meta) to avoid CLS. */
function FeaturedRestaurantGridSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-base lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="flex flex-col overflow-hidden rounded-lg border border-hairline-strong bg-surface-card"
        >
          <div className="relative">
            <Skeleton className="aspect-[16/10] w-full rounded-none" rounded="none" />
            <div className="absolute -bottom-3 right-base">
              <Skeleton className="h-10 w-10 ring-2 ring-canvas" rounded="md" />
            </div>
          </div>
          <div className="flex min-h-[108px] flex-1 flex-col gap-1 p-base pt-md">
            <div className="flex items-start justify-between gap-2">
              <Skeleton className="h-[22px] min-h-[22px] flex-1 max-w-[72%]" rounded="sm" />
              <Skeleton className="h-4 min-h-4 w-14 shrink-0" rounded="sm" />
            </div>
            <Skeleton className="h-[14px] min-h-[14px] w-[85%] max-w-[240px]" rounded="sm" />
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <Skeleton className="h-[13px] min-h-[13px] w-24" rounded="sm" />
              <Skeleton className="h-[13px] min-h-[13px] w-28" rounded="sm" />
              <Skeleton className="h-[13px] min-h-[13px] w-16" rounded="sm" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function DishCarouselSkeleton() {
  return (
    <div className="-mx-base flex gap-base overflow-hidden px-base pb-1 md:mx-0 md:px-0">
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className="w-[232px] shrink-0 overflow-hidden rounded-lg border border-hairline-strong bg-surface-card md:w-[248px]">
          <Skeleton className="aspect-[4/3] w-full rounded-none" rounded="none" />
          <div className="space-y-2 p-sm">
            <Skeleton className="h-4 w-3/4" rounded="sm" />
            <Skeleton className="h-3 w-1/2" rounded="sm" />
          </div>
        </div>
      ))}
    </div>
  );
}

function SectionHeader({ caption, title, right }) {
  return (
    <div className="mb-base flex items-end justify-between gap-base">
      <div>
        {caption && <div className="text-caption-uppercase text-body">{caption}</div>}
        <h2 className="text-display-md text-ink">{title}</h2>
      </div>
      {right}
    </div>
  );
}

function CarouselArrows({ scrollRef, className }) {
  const onScroll = (dir) => {
    scrollRef.current?.scrollBy({ left: dir * 320, behavior: 'smooth' });
  };
  return (
    <div className={clsx('hidden items-center gap-1 md:flex', className)}>
      <button
        type="button"
        onClick={() => onScroll(-1)}
        aria-label="Cuộn sang trước"
        className="grid h-9 w-9 place-items-center rounded-md border border-hairline-strong bg-surface-card text-ink hover:bg-canvas-soft"
      >
        <Icon name="chevronLeft" size={16} />
      </button>
      <button
        type="button"
        onClick={() => onScroll(1)}
        aria-label="Cuộn tiếp theo"
        className="grid h-9 w-9 place-items-center rounded-md border border-hairline-strong bg-surface-card text-ink hover:bg-canvas-soft"
      >
        <Icon name="chevronRight" size={16} />
      </button>
    </div>
  );
}

function HomeDishCard({ dish, onPreview }) {
  const prepTime = Number(dish.prepTimeMin ?? 0);
  const isOpen = dish.isOpenNow ?? true;
  const deliveryBadge = dish.isWithinDeliveryRange === false
    ? 'Ngoài phạm vi'
    : dish.isWithinDeliveryRange === null
      ? 'Cần vị trí'
      : null;

  return (
    <button
      type="button"
      onClick={onPreview}
      onMouseEnter={prefetchDishChunk}
      className="group flex w-[232px] shrink-0 cursor-pointer flex-col overflow-hidden rounded-lg border border-hairline-strong bg-surface-card text-left transition-shadow hover:shadow-soft md:w-[248px]"
      aria-label={`Xem nhanh ${dish.name} từ ${dish.restaurantName}`}
    >
      <div className="relative">
        <Image src={dish.imageUrl} alt={dish.name} ratio="4/3" className="w-full" />
        {!isOpen && <Badge tone="error" className="absolute left-sm top-sm">Đóng cửa</Badge>}
        {deliveryBadge && (
          <Badge tone="default" className={`absolute left-sm ${!isOpen ? 'top-9' : 'top-sm'}`}>
            {deliveryBadge}
          </Badge>
        )}
      </div>
      <div className="flex min-h-[88px] flex-1 flex-col gap-1 p-sm">
        <div className="flex items-start justify-between gap-2">
          <span className="line-clamp-1 min-w-0 text-body-sm font-semibold text-ink">{dish.name}</span>
          <span className="shrink-0 nums text-body-sm font-semibold text-ink">{formatVnd(dish.price)}</span>
        </div>
        <span className="line-clamp-1 text-caption text-body">{dish.restaurantName}</span>
        {prepTime > 0 && (
          <span className="mt-auto inline-flex items-center gap-1 text-caption text-body">
            <Icon name="clock" size={12} /> Chuẩn bị khoảng {prepTime} phút
          </span>
        )}
      </div>
    </button>
  );
}

function PromoBanner({ image, tag, title, sub, cta, linkUrl }) {
  const inner = (
    <>
      <Image src={image} alt={title} ratio="16/9" className="absolute inset-0 h-full w-full" />
      <div className="absolute inset-0 bg-gradient-to-r from-ink/85 via-ink/45 to-transparent" />
      <div className="relative flex h-full flex-col justify-between p-base text-on-dark">
        <Badge tone="dark" className="self-start !bg-canvas/15 !text-on-dark backdrop-blur">
          {tag}
        </Badge>
        <div>
          <h3 className="text-display-sm">{title}</h3>
          <p className="mt-0.5 text-body-sm text-on-dark-soft">{sub}</p>
          <span className="mt-sm inline-flex items-center gap-1 text-button text-on-dark">
            {cta} <Icon name="arrowRight" size={14} />
          </span>
        </div>
      </div>
    </>
  );

  const className =
    'group relative isolate block aspect-[16/9] overflow-hidden rounded-lg text-left transition-shadow hover:shadow-soft';

  if (linkUrl) {
    return (
      <Link to={linkUrl} className={className}>
        {inner}
      </Link>
    );
  }

  return (
    <button type="button" className={className}>
      {inner}
    </button>
  );
}

function RestaurantCard({ restaurant: r }) {
  const banner = r.bannerUrl || r.banner;
  const logo = r.logoUrl || r.logo;
  const rating = Number(r.ratingAvg ?? r.rating ?? 0);
  const reviewCount = Number(r.reviewCount ?? 0);
  const cuisine = r.cuisineName || r.cuisine || 'Ẩm thực';
  const eta = r.avgPrepTimeMin ? `${r.avgPrepTimeMin}p` : r.eta || '20p';
  const isOpen = r.isOpenNow ?? r.open ?? true;

  const promoBadge = rating >= 4.8 ? 'Đánh giá cao' : null;

  return (
    <Link
      to={`/app/restaurant/${r.id}`}
      onMouseEnter={prefetchRestaurantChunk}
      className="group flex flex-col overflow-hidden rounded-lg border border-hairline-strong bg-surface-card transition-shadow hover:shadow-soft"
    >
      <div className="relative">
        <Image src={banner} alt={r.name} ratio="16/10" className="w-full" />
        <div className="absolute left-sm top-sm flex gap-1">
          {promoBadge && <Badge tone="default" className="bg-surface-card/95 backdrop-blur">{promoBadge}</Badge>}
          {!isOpen && <Badge tone="error">Đóng cửa</Badge>}
          {r.isWithinDeliveryRange === false && <Badge tone="default" className="bg-surface-card/95">Ngoài phạm vi</Badge>}
          {r.isWithinDeliveryRange === null && <Badge tone="default" className="bg-surface-card/95">Cần vị trí</Badge>}
        </div>
        <div className="absolute -bottom-3 right-base">
          <Avatar src={logo} name={r.name} square size="md" className="ring-2 ring-canvas" />
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-1 p-base pt-md">
        <div className="flex items-start justify-between gap-2">
          <div className="text-title-md text-ink leading-tight">{r.name}</div>
          <span className="inline-flex shrink-0 items-center gap-0.5 text-body-sm text-ink">
            <Icon name="starFilled" size={12} />
            <span className="nums">{rating.toFixed(1)}</span>
            {reviewCount > 0 && <span className="text-body">({reviewCount})</span>}
          </span>
        </div>
        <div className="text-caption text-body truncate">
          {cuisine} {r.district ? `· ${r.district}` : ''}
        </div>
        <div className="mt-2 text-caption text-body">
          <div className="flex items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1">
              <Icon name="clock" size={12} /> <span className="nums">{eta}</span>
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

function DishCard({ dish, onPreview }) {
  const image = dish.image || dish.imageUrl;
  const prepTime = Number(dish.prepTimeMin ?? dish.avgPrepTimeMin ?? 0);
  const prepLabel = prepTime > 0 ? `Chuẩn bị khoảng ${prepTime} phút` : dish.eta;
  const isOpen = dish.isOpenNow ?? true;

  return (
    <div className="group flex w-[232px] shrink-0 flex-col overflow-hidden rounded-lg border border-hairline-strong bg-surface-card text-left transition-shadow hover:shadow-soft md:w-[248px]">
      <div className="relative">
<button
      type="button"
      onClick={onPreview}
      onMouseEnter={prefetchDishChunk}
      className="block w-full cursor-pointer text-left"
      aria-label={`Xem nhanh ${dish.name}`}
    >
          <Image src={image} alt={dish.name} ratio="4/3" className="w-full" />
        </button>
        {!isOpen && <Badge tone="error" className="absolute left-sm top-sm">Đóng cửa</Badge>}
        {dish.isWithinDeliveryRange === false && <Badge tone="default" className="absolute left-sm top-sm">Ngoài phạm vi</Badge>}
        {dish.isWithinDeliveryRange === null && <Badge tone="default" className="absolute left-sm top-sm">Cần vị trí</Badge>}
      </div>
      <div className="flex min-h-[88px] flex-1 flex-col gap-1 p-sm">
        <div className="flex items-start justify-between gap-2">
          <button
            type="button"
            onClick={onPreview}
            className="min-w-0 cursor-pointer text-left text-body-sm font-semibold text-ink line-clamp-1"
          >
            {dish.name}
          </button>
          <span className="nums text-body-sm font-semibold text-ink">{formatVnd(dish.price)}</span>
        </div>
        <span className="line-clamp-1 text-caption text-body">{dish.restaurantName}</span>
        {prepLabel && (
          <span className="mt-auto inline-flex items-center gap-1 text-caption text-body">
            <Icon name="clock" size={12} /> {prepLabel}
          </span>
        )}
      </div>
    </div>
  );
}

