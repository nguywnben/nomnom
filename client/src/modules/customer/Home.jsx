import { Link, useNavigate, useOutletContext } from 'react-router-dom';
import Badge from '../../components/Badge.jsx';
import Button from '../../components/Button.jsx';
import Icon from '../../components/Icon.jsx';
import Image from '../../components/Image.jsx';
import Avatar from '../../components/Avatar.jsx';
import Skeleton from '../../components/Skeleton.jsx';
import { helpers, restaurants } from '../../data/mock.js';
import { useHomeCategories } from '../../hooks/useHomeCategories.js';
import { useHomePromos } from '../../hooks/useHomePromos.js';
import { useHorizontalDragScroll } from '../../hooks/useHorizontalDragScroll.js';
import { useApp } from '../../context/AppContext.jsx';
import { formatViInteger, formatVnd } from '../../lib/formatVnd.js';
import { buildTrendingDishes } from '../../lib/homeDishes.js';

// ---------------------------------------------------------------------------
// Customer Home — native food-app composition.
//   • Full-bleed food hero with embedded search bar
//   • Circular categories carousel
//   • Image-background promo strip
//   • Restaurant cards: large food image, name + ⭐, ETA, $ fee
//   • Trending dishes horizontal scroll
//   • Order-again row (recent restaurants)
//   • Mood-based cuisine tiles
// Design tokens remain pure: rounded-md CTAs (8px), rounded-lg cards (12px),
// Inter type, hairline borders, pure black primary.
// ---------------------------------------------------------------------------

const HERO_BG = helpers.unsplash('photo-1504674900247-0877df9cc836', 1800);

/** Điểm nhấn tĩnh trên hero — câu ngắn kiểu review về trải nghiệm NomNom (không phải bộ lọc tìm kiếm). */
const HERO_TRUST_TAGS = [
  { label: 'Gọn gàng, tìm món nhanh', icon: 'check' },
  { label: 'Đơn theo dõi rõ từng bước', icon: 'package' },
  { label: 'Nhiều quán hay quanh bạn', icon: 'pin' },
  { label: 'Rõ giá trước khi thanh toán', icon: 'shield' },
  { label: 'Hỗ trợ nhanh khi cần', icon: 'chat' },
];

const MOODS = [
  { id: 'comfort', label: 'Món ăn quen thuộc', sub: 'Burger, mì Ý, mì ramen', image: helpers.unsplash('photo-1568901346375-23c9450c58cd', 800), cuisineSlug: 'american' },
  { id: 'healthy', label: 'Món ăn tốt cho sức khỏe', sub: 'Rau xanh, ngũ cốc, protein', image: helpers.unsplash('photo-1512621776951-a57141f2eefd', 800), cuisineSlug: 'healthy' },
  { id: 'sweet', label: 'Món ngọt', sub: 'Bánh ngọt, bánh donut, kem', image: helpers.unsplash('photo-1551024601-bec78aea704b', 800), cuisineSlug: 'bakery' },
  { id: 'fast', label: 'Ăn nhẹ', sub: 'Sẵn sàng dưới 25 phút', image: helpers.unsplash('photo-1565299585323-38d6b0865b47', 800), cuisineSlug: 'mexican' },
];

export default function CustomerHome() {
  const nav = useNavigate();
  const { deliveryLocalityLine } = useOutletContext() ?? {};
  const { orders, addToCart, setCartOpen, shopAsCustomer } = useApp();
  const { categories, loading: categoriesLoading, error: categoriesError } = useHomeCategories();
  const { promos, loading: promosLoading, error: promosError } = useHomePromos();
  const exploreScroll = useHorizontalDragScroll();
  const featuredRestaurantsLoading = false;

  const trending = buildTrendingDishes(categories);

  // Order-again — distinct restaurants you've ordered from recently.
  const recentRestaurantIds = Array.from(new Set(orders.map((o) => o.restaurantId)));
  const recentRestaurants = recentRestaurantIds
    .map((id) => restaurants.find((r) => r.id === id))
    .filter(Boolean);

  return (
    <div className="bg-canvas">
      {/* ----------------------------------------------------------------- */}
      {/* HERO — full-bleed food background, search bar embedded.            */}
      {/* ----------------------------------------------------------------- */}
      <section className="relative isolate">
        <div
          className="absolute inset-0 -z-10"
          style={{
            backgroundImage: `url(${HERO_BG})`,
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
              <span className="min-w-0 truncate">Giao hàng đến · {deliveryLocalityLine}</span>
            </span>
            <h1 className="mt-base text-display-lg text-on-dark md:text-display-xl lg:text-display-mega">
              Đói bụng? Đặt món ngay.
            </h1>
            <p className="mt-xs text-body-md text-on-dark-soft">
              Tìm bữa ăn tiếp theo từ{' '}
              <span className="nums">{formatViInteger(restaurants.length * 268)}</span>{' '}
              quán ăn gần đây.
            </p>

            {/* Hero search bar — prominent, white card on dark hero */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const q = new FormData(e.currentTarget).get('q');
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
                  placeholder="Tìm kiếm quán ăn hoặc món ăn…"
                  className="h-9 w-full min-w-0 bg-transparent text-body-sm text-ink placeholder:text-muted outline-none sm:h-10 md:h-11 md:text-body-md"
                />
              </div>
              <Button
                type="submit"
                size="lg"
                className="shrink-0 !h-9 !px-3 !text-caption sm:!h-10 sm:!px-sm sm:!text-button md:!h-12 md:!px-md"
              >
                <span className="md:hidden">Tìm</span>
                <span className="hidden md:inline">Tìm quán ăn</span>
              </Button>
            </form>

            {/* Trust tags — mobile: cuộn ngang một hàng; desktop: gói & căn giữa */}
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

        {/* Gợi ý cuộn — giống trang chủ "/" */}
        <div className="pointer-events-none absolute inset-x-0 bottom-base flex justify-center text-on-dark-soft">
          <Icon name="chevronDown" size={20} className="opacity-70" />
        </div>
      </section>

      {/* ----------------------------------------------------------------- */}
      {/* CATEGORIES — circular images, horizontal scroll.                  */}
      {/* ----------------------------------------------------------------- */}
      <section className="container-page pt-xl">
        <SectionHeader
          caption="Bạn đang nghĩ gì?"
          title="Khám phá theo món ăn"
          right={
            <Link to="/app/search" className="text-button text-text-link hover:underline">
              Xem tất cả
            </Link>
          }
        />
        <div
          ref={exploreScroll.ref}
          onMouseDown={exploreScroll.onMouseDown}
          onClickCapture={exploreScroll.onClickCapture}
          className="-mx-base min-w-0 cursor-grab overflow-x-auto overscroll-x-contain px-base pb-1 no-scrollbar active:cursor-grabbing md:mx-0 md:px-0"
          role="region"
          aria-label="Khám phá theo món ăn — cuộn ngang"
        >
          <div className="flex w-max flex-nowrap gap-base">
            {categoriesLoading &&
              Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex w-[88px] shrink-0 flex-col items-center gap-1.5 md:w-[104px]">
                  <Skeleton className="h-20 w-20 rounded-pill md:h-24 md:w-24" />
                  <Skeleton className="h-3 w-14 rounded-sm" />
                </div>
              ))}
            {!categoriesLoading && categoriesError && (
              <p className="px-2 text-body-sm text-body">{categoriesError}</p>
            )}
            {!categoriesLoading &&
              !categoriesError &&
              categories.map((c) => (
                <Link
                  key={c.id}
                  to={
                    c.cuisineSlug
                      ? `/app/search?cuisine=${c.cuisineSlug}`
                      : `/app/search?q=${encodeURIComponent(c.name)}`
                  }
                  className="group flex w-[88px] shrink-0 flex-col items-center gap-1.5 md:w-[104px]"
                  title={c.restaurantName ? `${c.name} · ${c.restaurantName}` : c.name}
                  draggable={false}
                >
                  <span className="relative overflow-hidden rounded-pill border border-hairline-strong bg-surface-card transition-shadow group-hover:shadow-soft">
                    <Image
                      src={c.imageUrl}
                      alt={c.name}
                      ratio="1"
                      className="h-20 w-20 md:h-24 md:w-24 pointer-events-none"
                    />
                  </span>
                  <span className="line-clamp-2 text-center text-caption font-medium text-ink pointer-events-none">
                    {c.name}
                  </span>
                </Link>
              ))}
          </div>
        </div>
      </section>

      {/* ----------------------------------------------------------------- */}
      {/* PROMO STRIP — image-bg banners with overlay text.                  */}
      {/* ----------------------------------------------------------------- */}
      <section className="container-page py-xl">
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

      {/* ----------------------------------------------------------------- */}
      {/* ORDER AGAIN — appears only when there's history.                   */}
      {/* ----------------------------------------------------------------- */}
      {recentRestaurants.length > 0 && (
        <section className="container-page pb-xl">
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
            {recentRestaurants.map((r) => (
              <Link
                key={r.id}
                to={`/app/restaurant/${r.id}`}
                className="group flex w-[260px] shrink-0 items-center gap-sm rounded-lg border border-hairline-strong bg-surface-card p-sm hover:shadow-soft transition-shadow"
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

      {/* ----------------------------------------------------------------- */}
      {/* FEATURED RESTAURANTS — native food cards.                          */}
      {/* ----------------------------------------------------------------- */}
      <section className="container-page pb-xl">
        <SectionHeader
          caption="Nổi bật"
          title="Lựa chọn hàng đầu cho bạn"
          right={
            <Link to="/app/search" className="text-button text-text-link hover:underline">
              Xem tất cả
            </Link>
          }
        />
        {featuredRestaurantsLoading ? (
          <FeaturedRestaurantGridSkeleton />
        ) : (
          <div className="grid grid-cols-2 gap-base lg:grid-cols-3">
            {restaurants.slice(0, 6).map((r) => (
              <RestaurantCard key={r.id} restaurant={r} />
            ))}
          </div>
        )}
      </section>

      {/* ----------------------------------------------------------------- */}
      {/* TRENDING DISHES — horizontal scroll, dish-level cards.             */}
      {/* ----------------------------------------------------------------- */}
      <section className="container-page pb-xl">
        <SectionHeader
          caption="Đang hot"
          title="Các món thịnh hành gần bạn"
        />
        <div className="-mx-base flex gap-base overflow-x-auto px-base pb-1 no-scrollbar md:mx-0 md:px-0">
          {trending.map((d) => (
            <DishCard
              key={d.id}
              dish={d}
              onAdd={() => {
                if (!shopAsCustomer) return;
                addToCart(d.restaurantId, d, 1, { baseDeliveryFee: d.fee, restaurantName: d.restaurantName, restaurantLogo: d.restaurantLogo });
                setCartOpen(true);
              }}
              addDisabled={!shopAsCustomer}
            />
          ))}
        </div>
      </section>

      {/* ----------------------------------------------------------------- */}
      {/* MOOD TILES — image-overlay collections.                            */}
      {/* ----------------------------------------------------------------- */}
      <section className="container-page pb-xxl">
        <SectionHeader caption="Khám phá" title="Theo tâm trạng" />
        <div className="grid grid-cols-2 gap-base lg:grid-cols-4">
          {MOODS.map((m) => (
            <Link
              key={m.id}
              to={`/app/search?cuisine=${m.cuisineSlug}`}
              className="group relative aspect-[4/5] overflow-hidden rounded-lg border border-hairline-strong"
            >
              <Image src={m.image} alt={m.label} ratio="4/5" className="h-full w-full transition-transform group-hover:scale-105" />
              <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-ink/15 to-transparent" />
              <div className="absolute inset-0 flex flex-col justify-end p-base text-on-dark">
                <span className="text-caption-uppercase text-on-dark-soft">{m.sub}</span>
                <span className="text-display-sm">{m.label}</span>
                <span className="mt-1 inline-flex items-center gap-1 text-button text-on-dark">
                  Khám phá <Icon name="arrowRight" size={14} />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ----------------------------------------------------------------- */}
      {/* QUIET PARTNER CTA — small, food-app footer band                    */}
      {/* (replaces the SaaS "Run a restaurant" hero band).                  */}
      {/* ----------------------------------------------------------------- */}
      <section className="border-t border-hairline bg-canvas-soft">
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
            <Button variant="secondary" size="sm" onClick={() => nav('/driver')}>
              Dành cho tài xế
            </Button>
          </div>
        </div>
      </section>
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

function PromoBanner({ image, tag, title, sub, cta, linkUrl }) {
  const inner = (
    <>
      <Image src={image} alt={title} ratio="16/9" className="absolute inset-0 h-full w-full transition-transform group-hover:scale-105" />
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
  const promoBadge =
    r.fee < 50000 ? 'Phí giao thấp' : r.rating >= 4.8 ? 'Đánh giá cao' : r.priceLevel === 1 ? 'Giá tốt' : null;
  return (
    <Link
      to={`/app/restaurant/${r.id}`}
      className="group flex flex-col overflow-hidden rounded-lg border border-hairline-strong bg-surface-card transition-shadow hover:shadow-soft"
    >
      <div className="relative">
        <Image src={r.banner} alt={r.name} ratio="16/10" className="w-full transition-transform group-hover:scale-[1.02]" />
        {/* Promo / status overlay */}
        <div className="absolute left-sm top-sm flex gap-1">
          {promoBadge && <Badge tone="default" className="bg-surface-card/95 backdrop-blur">{promoBadge}</Badge>}
          {!r.open && <Badge tone="error">Đóng cửa</Badge>}
        </div>
        {/* Logo overlay — anchors brand without competing with the photo */}
        <div className="absolute -bottom-3 right-base">
          <Avatar src={r.logo} name={r.name} square size="md" className="ring-2 ring-canvas" />
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-1 p-base pt-md">
        <div className="flex items-start justify-between gap-2">
          <div className="text-title-md text-ink leading-tight">{r.name}</div>
          <span className="inline-flex shrink-0 items-center gap-0.5 text-body-sm text-ink">
            <Icon name="starFilled" size={12} />
            <span className="nums">{r.rating.toFixed(1)}</span>
            <span className="text-body">({Math.round(r.reviewCount / 100) / 10}k)</span>
          </span>
        </div>
        <div className="text-caption text-body">
          {r.cuisine} · {r.tags.slice(0, 2).join(' · ')}
        </div>
        <div className="mt-2 text-caption text-body">
          <div className="flex flex-col gap-1.5 md:hidden">
            <div className="flex items-center justify-between gap-2">
              <span className="inline-flex min-w-0 items-center gap-1">
                <Icon name="clock" size={12} className="shrink-0" />
                <span className="nums truncate">{r.eta}</span>
              </span>
              <span className="inline-flex shrink-0 items-center gap-1 nums">
                <Icon name="pin" size={12} />
                {r.distanceKm} km
              </span>
            </div>
            <div className="flex items-center gap-1.5 rounded-md border border-hairline-soft bg-canvas-soft px-2 py-1.5">
              <Icon name="cash" size={12} className="shrink-0 text-body" />
              <span className="min-w-0 truncate">
                Phí giao <span className="nums font-medium text-ink">{formatVnd(r.fee)}</span>
              </span>
            </div>
          </div>
          <div className="hidden md:flex md:flex-wrap md:items-center md:gap-2">
            <span className="inline-flex items-center gap-1">
              <Icon name="clock" size={12} /> <span className="nums">{r.eta}</span>
            </span>
            <span className="text-muted-soft">·</span>
            <span className="inline-flex items-center gap-1 nums">phí giao {formatVnd(r.fee)}</span>
            <span className="text-muted-soft">·</span>
            <span className="inline-flex items-center gap-1 nums">
              <Icon name="pin" size={12} />
              {r.distanceKm} km
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

function DishCard({ dish, onAdd, addDisabled = false }) {
  return (
    <div className="w-[240px] shrink-0">
      <div className="group relative overflow-hidden rounded-lg border border-hairline-strong bg-surface-card">
        <Link to={`/app/restaurant/${dish.restaurantId}`} aria-label={`Open ${dish.restaurantName}`}>
          <Image src={dish.image} alt={dish.name} ratio="1" className="w-full transition-transform group-hover:scale-105" />
        </Link>
        {!addDisabled && (
        <button
          onClick={(e) => {
            e.preventDefault();
            onAdd?.();
          }}
          className="absolute bottom-2 right-2 grid h-9 w-9 place-items-center rounded-pill bg-primary text-on-primary shadow-soft-md hover:bg-primary-active"
          aria-label={`Add ${dish.name} to cart`}
        >
          <Icon name="plus" size={16} />
        </button>
        )}
      </div>
      <div className="mt-2">
        <div className="flex items-start justify-between gap-2">
          <span className="text-body-sm font-semibold text-ink line-clamp-1">{dish.name}</span>
          <span className="nums text-body-sm font-semibold text-ink">{formatVnd(dish.price)}</span>
        </div>
        <Link
          to={`/app/restaurant/${dish.restaurantId}`}
          className="text-caption text-body hover:text-ink line-clamp-1"
        >
          {dish.restaurantName} · {dish.eta}
        </Link>
      </div>
    </div>
  );
}
