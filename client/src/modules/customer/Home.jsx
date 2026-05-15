import { Link, useNavigate } from 'react-router-dom';
import Badge from '../../components/Badge.jsx';
import Button from '../../components/Button.jsx';
import Icon from '../../components/Icon.jsx';
import Image from '../../components/Image.jsx';
import Avatar from '../../components/Avatar.jsx';
import Skeleton from '../../components/Skeleton.jsx';
import { categories, helpers, restaurants } from '../../data/mock.js';
import { useApp } from '../../context/AppContext.jsx';

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

const QUICK_FILTERS = [
  { label: 'Giao hàng miễn phí', icon: 'bike' },
  { label: 'Dưới 30 phút', icon: 'clock' },
  { label: 'Đánh giá cao', icon: 'starFilled' },
  { label: 'Mới trên NomNom', icon: 'zap' },
];

const MOODS = [
  { id: 'comfort', label: 'Món ăn quen thuộc', sub: 'Burger, mì Ý, mì ramen', image: helpers.unsplash('photo-1568901346375-23c9450c58cd', 800), link: 'burgers' },
  { id: 'healthy', label: 'Món ăn tốt cho sức khỏe', sub: 'Rau xanh, ngũ cốc, protein', image: helpers.unsplash('photo-1512621776951-a57141f2eefd', 800), link: 'bowls' },
  { id: 'sweet', label: 'Món ngọt', sub: 'Bánh ngọt, bánh donut, kem', image: helpers.unsplash('photo-1551024601-bec78aea704b', 800), link: 'desserts' },
  { id: 'fast', label: 'Ăn nhẹ', sub: 'Sẵn sàng dưới 25 phút', image: helpers.unsplash('photo-1565299585323-38d6b0865b47', 800), link: 'tacos' },
];

export default function CustomerHome() {
  const nav = useNavigate();
  const { orders, addToCart, setCartOpen } = useApp();
  // Khi tích hợp API: thay bằng isPending / isLoading từ fetch (vd. TanStack Query).
  const featuredRestaurantsLoading = false;

  // Compose a "trending dishes" carousel by pulling 1–2 items from each open restaurant.
  const trending = restaurants
    .filter((r) => r.open)
    .flatMap((r) =>
      r.menu
        .filter((m) => m.inStock)
        .slice(0, 2)
        .map((m) => ({ ...m, restaurantId: r.id, restaurantName: r.name, restaurantLogo: r.logo, fee: r.fee, eta: r.eta })),
    )
    .slice(0, 10);

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

        <div className="container-page py-xxl md:py-section">
          <div className="mx-auto max-w-2xl text-center">
            <span className="inline-flex items-center gap-1 rounded-pill bg-canvas/15 px-2.5 py-0.5 text-caption text-on-dark backdrop-blur">
              <Icon name="pin" size={12} />
              Giao hàng đến · 120 Wythe Ave
              <Icon name="chevronDown" size={12} />
            </span>
            <h1 className="mt-base text-display-lg text-on-dark md:text-display-xl lg:text-display-mega">
              Đói bụng? Đặt món ngay.
            </h1>
            <p className="mt-xs text-body-md text-on-dark-soft">
              Tìm bữa ăn tiếp theo từ <span className="nums">{restaurants.length * 268}</span>{' '}
              quán ăn gần đây.
            </p>

            {/* Hero search bar — prominent, white card on dark hero */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const q = new FormData(e.currentTarget).get('q');
                nav('/app/search' + (q ? `?q=${encodeURIComponent(q)}` : ''));
              }}
              className="mt-lg flex items-stretch gap-xs rounded-lg border border-hairline-strong bg-surface-card p-1 shadow-soft-lg md:gap-1"
            >
              <div className="hidden items-center gap-2 border-r border-hairline pl-sm pr-2 md:flex">
                <Icon name="pin" size={16} className="text-body" />
                <span className="text-body-sm text-ink whitespace-nowrap">Brooklyn</span>
                <Icon name="chevronDown" size={12} className="text-body" />
              </div>
              <div className="flex flex-1 items-center gap-2 px-sm">
                <Icon name="search" size={16} className="text-body" />
                <input
                  name="q"
                  type="search"
                  placeholder="Tìm kiếm quán ăn hoặc món ăn…"
                  className="h-11 w-full bg-transparent text-body-md text-ink placeholder:text-muted outline-none"
                />
              </div>
              <Button type="submit" size="lg" className="px-md">
                Tìm quán ăn
              </Button>
            </form>

            {/* Quick filters */}
            <div className="mt-base flex flex-wrap items-center justify-center gap-1.5">
              {QUICK_FILTERS.map((f) => (
                <button
                  key={f.label}
                  onClick={() => nav('/app/search')}
                  className="inline-flex items-center gap-1.5 rounded-pill border border-canvas/30 bg-canvas/10 px-2.5 py-1 text-caption text-on-dark backdrop-blur hover:bg-canvas/20"
                >
                  <Icon name={f.icon} size={12} />
                  {f.label}
                </button>
              ))}
            </div>
          </div>
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
        <div className="-mx-base flex gap-base overflow-x-auto px-base pb-1 no-scrollbar md:mx-0 md:px-0">
          {categories.map((c) => (
            <Link
              key={c.id}
              to={`/app/search?cat=${c.id}`}
              className="group flex w-[88px] shrink-0 flex-col items-center gap-1.5 md:w-[104px]"
            >
              <span className="relative overflow-hidden rounded-pill border border-hairline-strong bg-surface-card transition-shadow group-hover:shadow-soft">
                <Image
                  src={c.image}
                  alt={c.name}
                  ratio="1"
                  className="h-20 w-20 md:h-24 md:w-24"
                />
              </span>
              <span className="text-caption font-medium text-ink text-center">
                <span aria-hidden="true">{c.emoji} </span>
                {c.name}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* ----------------------------------------------------------------- */}
      {/* PROMO STRIP — image-bg banners with overlay text.                  */}
      {/* ----------------------------------------------------------------- */}
      <section className="container-page py-xl">
        <div className="grid gap-base md:grid-cols-3">
          <PromoBanner
            image={helpers.unsplash('photo-1565299624946-b28f40a0ae38', 1000)}
            tag="Sử dụng NOMNOM15"
            title="Giảm 15% cho đơn hàng đầu tiên"
            sub="Mỗi khách hàng một mã khuyến mãi · Giảm tối đa 10$"
            cta="Nhận ngay"
          />
          <PromoBanner
            image={helpers.unsplash('photo-1551782450-a2132b4ba21d', 1000)}
            tag="Trưa · 11–2"
            title="Miễn phí giao hàng cho đơn trên 20$"
            sub="Tránh giờ cao điểm văn phòng · T2–T6"
            cta="Đặt bữa trưa"
          />
          <PromoBanner
            image={helpers.unsplash('photo-1569718212165-3a8278d5f624', 1000)}
            tag="Mới mở"
            title="5 bếp mới tuần này"
            sub="Thử ngay trước khi kín chỗ"
            cta="Khám phá"
          />
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
          <div className="grid gap-base md:grid-cols-2 lg:grid-cols-3">
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
                addToCart(d.restaurantId, d, 1);
                setCartOpen(true);
              }}
            />
          ))}
        </div>
      </section>

      {/* ----------------------------------------------------------------- */}
      {/* MOOD TILES — image-overlay collections.                            */}
      {/* ----------------------------------------------------------------- */}
      <section className="container-page pb-xxl">
        <SectionHeader caption="Khám phá" title="Theo tâm trạng" />
        <div className="grid gap-base sm:grid-cols-2 lg:grid-cols-4">
          {MOODS.map((m) => (
            <Link
              key={m.id}
              to={`/app/search?cat=${m.link}`}
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
    <div className="grid gap-base md:grid-cols-2 lg:grid-cols-3">
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

function PromoBanner({ image, tag, title, sub, cta }) {
  return (
    <button type="button" className="group relative isolate aspect-[16/9] overflow-hidden rounded-lg text-left">
      <Image src={image} alt="" ratio="16/9" className="absolute inset-0 h-full w-full transition-transform group-hover:scale-105" />
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
    </button>
  );
}

function RestaurantCard({ restaurant: r }) {
  const promoBadge =
    r.fee < 2 ? 'Phí 0$' : r.rating >= 4.8 ? 'Đánh giá cao' : r.priceLevel === 1 ? 'Giá tốt' : null;
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
        <div className="mt-2 flex items-center gap-2 text-caption text-body">
          <span className="inline-flex items-center gap-1">
            <Icon name="clock" size={12} /> <span className="nums">{r.eta}</span>
          </span>
          <span className="text-muted-soft">·</span>
          <span className="inline-flex items-center gap-1 nums">
            phí giao ${r.fee.toFixed(2)}
          </span>
          <span className="text-muted-soft">·</span>
          <span className="inline-flex items-center gap-1 nums">{r.distanceKm} km</span>
        </div>
      </div>
    </Link>
  );
}

function DishCard({ dish, onAdd }) {
  return (
    <div className="w-[240px] shrink-0">
      <div className="group relative overflow-hidden rounded-lg border border-hairline-strong bg-surface-card">
        <Link to={`/app/restaurant/${dish.restaurantId}`} aria-label={`Open ${dish.restaurantName}`}>
          <Image src={dish.image} alt={dish.name} ratio="1" className="w-full transition-transform group-hover:scale-105" />
        </Link>
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
      </div>
      <div className="mt-2">
        <div className="flex items-start justify-between gap-2">
          <span className="text-body-sm font-semibold text-ink line-clamp-1">{dish.name}</span>
          <span className="nums text-body-sm font-semibold text-ink">${dish.price.toFixed(2)}</span>
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
