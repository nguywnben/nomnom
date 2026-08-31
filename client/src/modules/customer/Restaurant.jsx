import { useMemo, useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import Badge from '../../components/Badge.jsx';
import Button from '../../components/Button.jsx';
import { IconButton } from '../../components/Button.jsx';
import Card from '../../components/Card.jsx';
import Icon from '../../components/Icon.jsx';
import Image from '../../components/Image.jsx';
import StarRating from '../../components/StarRating.jsx';
import Avatar from '../../components/Avatar.jsx';
import EmptyState from '../../components/EmptyState.jsx';
import Skeleton from '../../components/Skeleton.jsx';
import { useApp } from '../../context/AppContext.jsx';
import { formatVnd } from '../../lib/formatVnd.js';
import { fetchRestaurantVouchersApi, saveVoucherApi } from '../../lib/api.js';
import { useRestaurantDetail } from '../../hooks/useRestaurantDetail.js';
import { useRestaurantMenu } from '../../hooks/useRestaurantMenu.js';
import { useRestaurantReviews } from '../../hooks/useRestaurantReviews.js';
import { useHorizontalDragScroll } from '../../hooks/useHorizontalDragScroll.js';

export default function CustomerRestaurant() {
  const { id } = useParams();
  const nav = useNavigate();
  const { addToCart, setCartOpen, pushToast, shopAsCustomer, customerCartRestriction, currentLocation, cart, setItemQty } = useApp();
  const [cat, setCat] = useState('Tất cả');
  const [menuQuery, setMenuQuery] = useState('');
  const [vouchers, setVouchers] = useState([]);
  const voucherScroll = useHorizontalDragScroll();
  const voucherScrollRef = voucherScroll.ref;
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  useEffect(() => {
    const el = voucherScrollRef.current;
    if (!el) return;

    const updateVoucherScrollState = () => {
      setCanScrollLeft(el.scrollLeft > 5);
      setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 5);
    };

    updateVoucherScrollState();
    el.addEventListener('scroll', updateVoucherScrollState, { passive: true });
    window.addEventListener('resize', updateVoucherScrollState);
    return () => {
      el.removeEventListener('scroll', updateVoucherScrollState);
      window.removeEventListener('resize', updateVoucherScrollState);
    };
  }, [vouchers, voucherScrollRef]);

  const scrollVouchers = (direction) => {
    const el = voucherScrollRef.current;
    if (!el) return;
    const scrollAmount = (el.clientWidth / 3) * 2;
    el.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    });
  };

  useEffect(() => {
    if (!id) return;
    fetchRestaurantVouchersApi(id)
      .then((data) => setVouchers(data?.items ?? []))
      .catch((err) => console.error('Failed to load restaurant vouchers:', err));
  }, [id]);

  const handleSaveVoucher = async (v) => {
    try {
      const res = await saveVoucherApi({ voucherId: v.id });
      pushToast({
        kind: 'success',
        title: 'Đã lưu mã',
        message: res.message || `Đã lưu mã ${v.code} vào kho ưu đãi của bạn!`,
      });
      setVouchers((prev) =>
        prev.map((item) => (item.id === v.id ? { ...item, isSaved: true } : item))
      );
    } catch (err) {
      pushToast({
        kind: 'error',
        title: 'Không thể lưu mã',
        message: err.message || 'Mã giảm giá không hợp lệ hoặc đã hết lượt.',
      });
    }
  };

  const { restaurant, loading: restaurantLoading, error: restaurantError } = useRestaurantDetail(id, currentLocation);
  const { categories, loading: menuLoading, error: menuError } = useRestaurantMenu(id);
  const { reviews, loading: reviewsLoading, error: reviewsError } = useRestaurantReviews(id);

  const categoryNames = useMemo(() => ['Tất cả', ...categories.map((c) => c.name)], [categories]);
  const menuItems = useMemo(
    () => categories.flatMap((category) => category.items.map((item) => ({ ...item, categoryName: category.name }))),
    [categories],
  );
  const filteredItems = useMemo(
    () => {
      const needle = menuQuery.trim().toLowerCase();
      return (cat === 'Tất cả' ? menuItems : menuItems.filter((item) => item.categoryName === cat)).filter((item) =>
        needle
          ? item.name.toLowerCase().includes(needle) || (item.description ?? '').toLowerCase().includes(needle)
          : true,
      );
    },
    [cat, menuItems, menuQuery],
  );

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: restaurant?.name || 'NomNom',
          text: restaurant?.tagline || 'Khám phá quán ăn trên NomNom',
          url: window.location.href,
        });
      } else {
        await navigator.clipboard.writeText(window.location.href);
        pushToast({
          kind: 'success',
          title: 'Đã sao chép liên kết',
          message: 'Đã sao chép liên kết quán ăn vào bộ nhớ tạm!',
        });
      }
    } catch {
      await navigator.clipboard.writeText(window.location.href);
      pushToast({
        kind: 'success',
        title: 'Đã sao chép liên kết',
        message: 'Đã sao chép liên kết quán ăn vào bộ nhớ tạm!',
      });
    }
  };

  const qtyFor = (id) => {
    const it = cart.items.find((i) => String(i.menuItemId) === String(id));
    return it ? it.quantity : 0;
  };
  const cartItemFor = (id) => cart.items.find((i) => String(i.menuItemId) === String(id));

  if (restaurantError?.status === 404) {
    return (
      <div className="container-page py-section">
        <EmptyState
          icon="store"
          title="Không tìm thấy quán"
          message="Quán bạn đang tìm không tồn tại hoặc đã ngừng hoạt động."
          action={
            <Link to="/app/search">
              <Button variant="secondary">Quay lại tìm kiếm</Button>
            </Link>
          }
        />
      </div>
    );
  }

  if (!restaurantLoading && restaurantError && restaurantError.status !== 404) {
    return (
      <div className="container-page py-section">
        <EmptyState
          icon="alert"
          title="Không tải được quán"
          message={restaurantError.message ?? 'Vui lòng thử lại sau.'}
          action={
            <Button variant="secondary" onClick={() => nav(0)}>
              Tải lại
            </Button>
          }
        />
      </div>
    );
  }

  if (restaurantLoading) {
    return <RestaurantSkeleton />;
  }

  if (!restaurant) return null;

  const outsideDeliveryRange = restaurant.isWithinDeliveryRange === false;
  const isOpen = Boolean(restaurant.isOpenNow);
  const addressLine = [restaurant.addressLine, restaurant.ward, restaurant.district, restaurant.city]
    .filter(Boolean)
    .join(', ');
  const activeCategories = categoryNames.length > 1 ? categoryNames : ['Tất cả'];

  return (
    <div className="bg-canvas min-h-screen">
      {/* RESTAURANT HERO */}
      <div className="relative h-52 w-full overflow-hidden bg-ink md:h-64 lg:h-72">
        <Image
          src={restaurant.bannerUrl}
          alt={restaurant.name}
          className="h-full w-full object-cover"
          ratio="16/6"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink/85 via-ink/40 to-transparent" />
        <div className="absolute inset-x-0 top-0">
          <div className="container-page pt-base">
            <button
              type="button"
              onClick={() => nav(-1)}
              className="inline-flex items-center gap-1.5 rounded-full bg-black/50 px-3 py-1.5 text-button text-white backdrop-blur-sm transition-colors hover:bg-black/70"
            >
              <Icon name="chevronLeft" size={14} /> Quay lại
            </button>
          </div>
        </div>
        <div className="absolute inset-x-0 bottom-0">
          <div className="container-page pb-base md:pb-md">
            <div className="flex items-end gap-base">
              <Image
                src={restaurant.logoUrl}
                alt={restaurant.name}
                className="h-16 w-16 md:h-20 md:w-20 rounded-lg border border-hairline-strong shrink-0 shadow-soft"
                ratio="1"
              />
              <div className="flex-1 text-on-dark">
                <div className="flex flex-wrap items-center gap-2">
                  {restaurant.cuisineName && (
                    <Badge tone="default" className="!bg-canvas/15 !text-on-dark">
                      {restaurant.cuisineName}
                    </Badge>
                  )}
                </div>
                <h1 className="mt-1 text-display-lg">{restaurant.name}</h1>
                {restaurant.tagline && <div className="text-body-sm text-on-dark-soft">{restaurant.tagline}</div>}
              </div>
              <div className="hidden md:flex items-center gap-2">
                <Button variant="primary" onClick={handleShare}>
                  Chia sẻ
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <section className="border-b border-hairline">
        <div className="container-page py-base text-body-sm">
          <div className="flex flex-col gap-3 md:hidden">
            <div className="flex items-center justify-between gap-2">
              <span className="inline-flex min-w-0 items-center gap-1 text-ink">
                <Icon name="starFilled" size={14} className="shrink-0" />
                <strong className="nums">{restaurant.ratingAvg.toFixed(1)}</strong>
                <span className="truncate text-body">({restaurant.reviewCount} đánh giá)</span>
              </span>
              <span className="shrink-0">
                {isOpen ? (
                  <Badge tone="success" dot>
                    Đang mở cửa
                  </Badge>
                ) : (
                  <Badge tone="error" dot>
                    Đóng cửa
                  </Badge>
                )}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-lg border border-hairline-strong bg-canvas-soft px-3 py-2">
                <div className="text-caption text-body">Chuẩn bị</div>
                <div className="mt-1 inline-flex items-center gap-1 font-medium text-ink">
                  <Icon name="clock" size={14} />
                  {restaurant.avgPrepTimeMin}p
                </div>
              </div>
              <div className="rounded-lg border border-hairline-strong bg-canvas-soft px-3 py-2">
                <div className="text-caption text-body">Khoảng cách</div>
                <div className="mt-1 inline-flex items-center gap-1 font-medium text-ink">
                  <Icon name="bike" size={14} />
                  <span className="nums">{restaurant.estimatedDistanceKm ? `${restaurant.estimatedDistanceKm} km` : 'Gần bạn'}</span>
                </div>
              </div>
              <div className="rounded-lg border border-hairline-strong bg-canvas-soft px-3 py-2">
                <div className="text-caption text-body">Đơn tối thiểu</div>
                <div className="mt-1 inline-flex items-center gap-1 font-medium text-ink">
                  <Icon name="cash" size={14} />
                  <span className="nums">{Number(restaurant.minOrderAmount) > 0 ? formatVnd(restaurant.minOrderAmount) : '0 ₫'}</span>
                </div>
              </div>
            </div>
            <div className="flex items-start gap-2 rounded-lg border border-hairline bg-surface-card px-3 py-2.5">
              <Icon name="pin" size={14} className="mt-0.5 shrink-0 text-body" />
              <span className="text-body leading-snug">{addressLine}</span>
            </div>
          </div>

          <div className="hidden md:flex md:flex-wrap md:items-center md:gap-base">
            <span className="inline-flex items-center gap-1 text-ink">
              <Icon name="starFilled" size={14} /> <strong className="nums">{restaurant.ratingAvg.toFixed(1)}</strong>
              <span className="text-body">({restaurant.reviewCount} đánh giá)</span>
            </span>
            <span className="inline-flex items-center gap-1 text-body">
              <Icon name="clock" size={14} /> {restaurant.avgPrepTimeMin} phút
            </span>
            {restaurant.estimatedDistanceKm !== null && restaurant.estimatedDistanceKm !== undefined && (
              <span className="inline-flex items-center gap-1 text-body">
                <Icon name="bike" size={14} /> Cách bạn <strong className="nums text-ink">{restaurant.estimatedDistanceKm} km</strong>
              </span>
            )}
            {Number(restaurant.minOrderAmount) > 0 && (
              <span className="inline-flex items-center gap-1 text-body">
                <Icon name="cash" size={14} /> Đơn tối thiểu: <strong className="nums text-ink">{formatVnd(restaurant.minOrderAmount)}</strong>
              </span>
            )}
            <span className="inline-flex items-center gap-1 text-body">
              <Icon name="pin" size={14} /> {addressLine}
            </span>
            <span className="ml-auto inline-flex items-center gap-1">
              {isOpen ? (
                <Badge tone="success" dot>
                  Đang mở cửa
                </Badge>
              ) : (
                <Badge tone="error" dot>
                  Đóng cửa
                </Badge>
              )}
            </span>
          </div>
        </div>
      </section>

      <div className="container-page grid min-w-0 gap-xl py-xl md:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0">
          {!isOpen && (
            <div className="mb-base flex items-start gap-sm rounded-md border border-hairline-strong bg-canvas-soft p-base text-body-sm text-body" role="status">
              <Icon name="clock" size={18} className="mt-0.5 shrink-0 text-ink" />
              <div>
                <div className="font-semibold text-ink">Quán đang đóng cửa</div>
                <p className="mt-1">Bạn vẫn có thể xem thực đơn, nhưng chưa thể thêm món vào giỏ hàng.</p>
              </div>
            </div>
          )}
          {/* Băng chuyền Voucher Ưu đãi Quán */}
          {vouchers.length > 0 && (
            <div className="mb-base overflow-hidden rounded-lg border border-hairline-strong bg-canvas-soft p-base">
              <div className="mb-sm flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-body-sm font-semibold text-ink">
                  <Icon name="zap" size={16} className="text-ink" />
                  <span>Ưu đãi từ quán ({vouchers.length})</span>
                </div>
                <div className="flex items-center gap-2">
                  <Link to="/app/profile/promotions" className="text-caption font-medium text-text-link hover:underline">
                    Kho voucher ›
                  </Link>
                  {vouchers.length > 3 && (
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => scrollVouchers('left')}
                        disabled={!canScrollLeft}
                        aria-label="Cuộn xem ưu đãi trước"
                        className="grid h-6 w-6 place-items-center rounded-full border border-hairline bg-surface-card text-ink transition-all hover:bg-canvas-soft disabled:opacity-25 disabled:pointer-events-none shadow-xs"
                      >
                        <Icon name="chevronLeft" size={12} />
                      </button>
                      <button
                        type="button"
                        onClick={() => scrollVouchers('right')}
                        disabled={!canScrollRight}
                        aria-label="Cuộn xem thêm ưu đãi"
                        className="grid h-6 w-6 place-items-center rounded-full border border-hairline bg-surface-card text-ink transition-all hover:bg-canvas-soft disabled:opacity-25 disabled:pointer-events-none shadow-xs"
                      >
                        <Icon name="chevronRight" size={12} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
              <div
                ref={voucherScrollRef}
                onMouseDown={voucherScroll.onMouseDown}
                onClickCapture={voucherScroll.onClickCapture}
                className="flex max-w-full cursor-grab gap-2 overflow-x-auto no-scrollbar pb-1 active:cursor-grabbing select-none"
                role="region"
                aria-label="Ưu đãi từ quán — kéo cuộn ngang hoặc bấm mũi tên"
              >
                {vouchers.map((v) => {
                  const discountLabel = v.discountType === 'percent'
                    ? `Giảm ${v.discountValue}%`
                    : `Giảm ${formatVnd(v.discountValue)}`;
                  const isSaved = v.isSaved;

                  return (
                    <div
                      key={v.id}
                      className="flex min-w-[210px] md:min-w-[calc((100%-20px)/3.15)] md:max-w-[calc((100%-20px)/3.15)] shrink-0 items-center justify-between gap-2 rounded-lg border border-hairline-strong bg-surface-card px-2.5 py-2 transition-shadow hover:shadow-soft"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-body-sm font-bold text-ink truncate">{v.code}</span>
                          <span className="shrink-0 rounded bg-primary/10 px-1.5 py-0.5 text-[11px] font-semibold text-primary">
                            {discountLabel}
                          </span>
                        </div>
                        <div className="mt-0.5 text-[11px] text-body truncate">
                          {v.minOrderAmount > 0 ? `Đơn từ ${formatVnd(v.minOrderAmount)}` : 'Mọi đơn hàng'}
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant={isSaved ? 'secondary' : 'primary'}
                        disabled={isSaved}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSaveVoucher(v);
                        }}
                        className="!h-7 !px-2.5 !text-caption shrink-0"
                      >
                        {isSaved ? 'Đã lưu ✓' : 'Lưu'}
                      </Button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Tiêu đề & Bộ lọc Thực đơn */}
          <div className="mb-base pt-1">
            <div className="mb-3">
              <h2 className="text-display-xs text-ink font-bold">Thực đơn món ăn</h2>
              <p className="text-caption text-body">Khám phá các món ăn đặc sắc được chuẩn bị bởi {restaurant.name}</p>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-sm">
              <div className="flex max-w-full items-center gap-xs overflow-x-auto no-scrollbar flex-1 min-w-0">
                {activeCategories.map((c) => (
                  <button
                    key={c}
                    onClick={() => setCat(c)}
                    className={
                      'h-9 inline-flex items-center justify-center whitespace-nowrap rounded-md px-sm text-button transition-colors shrink-0 ' +
                      (cat === c
                        ? 'bg-primary text-on-primary shadow-xs'
                        : 'bg-surface-card border border-hairline-strong text-ink hover:bg-canvas-soft')
                    }
                  >
                    {c}
                  </button>
                ))}
              </div>
              <div className="relative w-full sm:w-60 shrink-0 h-9">
                <Icon name="search" size={16} className="pointer-events-none absolute left-sm top-1/2 -translate-y-1/2 text-body" />
                <input
                  value={menuQuery}
                  onChange={(e) => setMenuQuery(e.target.value)}
                  placeholder="Tìm món trong thực đơn…"
                  aria-label="Tìm trong thực đơn"
                  className="h-full w-full rounded-md border border-hairline-strong bg-surface-card pl-9 pr-base text-body-sm text-ink outline-none placeholder:text-muted focus:border-ink transition-colors"
                />
              </div>
            </div>
          </div>

          {menuLoading ? (
            <div className="grid gap-base sm:grid-cols-2">
              {Array.from({ length: 4 }).map((_, index) => (
                <Card key={index} padded={false} className="flex overflow-hidden">
                  <div className="flex-1 p-base">
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="mt-2 h-4 w-full" />
                    <Skeleton className="mt-2 h-4 w-3/5" />
                    <Skeleton className="mt-4 h-9 w-32 rounded-md" />
                  </div>
                  <Skeleton className="w-32 shrink-0 rounded-none" />
                </Card>
              ))}
            </div>
          ) : menuError ? (
            <EmptyState
              icon="alert"
              title="Không tải được thực đơn"
              message={menuError.message ?? 'Vui lòng thử lại sau.'}
            />
          ) : filteredItems.length === 0 ? (
            <EmptyState
              icon="search"
              title="Không tìm thấy món"
              message="Thử từ khóa khác hoặc chọn danh mục khác."
            />
          ) : (
            <div className="grid gap-base sm:grid-cols-2">
              {filteredItems.map((item) => (
                <MenuCard
                  key={item.id}
                  item={item}
                  qty={qtyFor(item.id)}
                  disabled={!isOpen || !shopAsCustomer || !currentLocation || outsideDeliveryRange}
                  restaurantClosed={!isOpen}
                  onClick={() => nav('/app/dish/' + item.id)}
                  onAdd={async () => {
                    if (!shopAsCustomer) {
                      pushToast({
                        kind: 'warning',
                        title: customerCartRestriction?.title ?? 'Không thể đặt món',
                        message: customerCartRestriction?.message ?? 'Tài khoản này không thể đặt hàng.',
                        duration: 4200,
                      });
                      return;
                    }
                    if (!isOpen) {
                      pushToast({
                        kind: 'error',
                        title: 'Quán ăn đóng cửa',
                        message: 'Vui lòng đặt hàng vào lần mở cửa tiếp theo.',
                      });
                      return;
                    }
                    if (outsideDeliveryRange) {
                      pushToast({ kind: 'warning', title: 'Ngoài phạm vi giao hàng', message: 'Quán này chưa giao đến vị trí hiện tại của bạn.' });
                      return;
                    }

                    addToCart(
                      restaurant.id,
                      { ...item, restaurantName: restaurant.name, restaurantLogo: restaurant.logoUrl },
                      1,
                      {},
                    );
                  }}
                  onDec={() => {
                    const it = cartItemFor(item.id);
                    if (it) setItemQty(it.id, it.quantity - 1);
                  }}
                />
              ))}
            </div>
          )}

          <section className="mt-xxl">
            <div className="mb-base flex items-center justify-between">
              <h2 className="text-display-sm text-ink">Đánh giá gần đây</h2>
              <Button variant="tertiary" onClick={() => nav(`/app/reviews/${restaurant.id}`)}>
                Xem tất cả
              </Button>
            </div>
            {reviewsLoading ? (
              <div className="grid gap-base md:grid-cols-2">
                {Array.from({ length: 2 }).map((_, index) => (
                  <Card key={index} className="flex flex-col gap-2">
                    <Skeleton className="h-5 w-40" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-5/6" />
                  </Card>
                ))}
              </div>
            ) : reviewsError ? (
              <EmptyState
                icon="alert"
                title="Không tải được đánh giá"
                message={reviewsError.message ?? 'Vui lòng thử lại sau.'}
              />
            ) : reviews.length === 0 ? (
              <EmptyState
                icon="star"
                title="Chưa có đánh giá"
                message="Hãy là người đầu tiên chia sẻ trải nghiệm về quán ăn này."
              />
            ) : (
              <div className="grid gap-base md:grid-cols-2">
                {reviews.map((rev) => (
                  <Card key={rev.id} className="flex flex-col gap-2">
                    <div className="flex items-center gap-sm">
                      <Avatar src={rev.avatar} name={rev.author} />
                      <div className="flex-1">
                        <div className="text-body-sm font-semibold text-ink">{rev.author}</div>
                        <div className="text-caption text-body">{rev.when}</div>
                      </div>
                      <StarRating value={rev.rating} />
                    </div>
                    <p className="text-body-sm text-body">{rev.text}</p>
                    {rev.replyText && (
                      <div className="mt-2 ml-4 p-2 bg-canvas-soft border-l-2 border-primary rounded-r text-body-sm leading-relaxed">
                        <div className="font-semibold text-ink text-xs mb-1">
                          Phản hồi của quán ({rev.replyAt || 'gần đây'}):
                        </div>
                        <p className="text-body text-xs">{rev.replyText}</p>
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            )}
          </section>
        </div>

        <aside className="hidden md:block">
          <Card padded className="sticky top-24 flex flex-col gap-base">
            {restaurant.description && (
              <div>
                <div className="text-caption-uppercase text-body">Giới thiệu quán</div>
                <p className="text-body-sm text-ink leading-relaxed mt-1">{restaurant.description}</p>
              </div>
            )}
            <div>
              <div className="text-caption-uppercase text-body">Thời gian chuẩn bị món</div>
              <div className="text-body-sm text-ink">{restaurant.avgPrepTimeMin} phút</div>
            </div>
            {restaurant.estimatedDistanceKm !== null && restaurant.estimatedDistanceKm !== undefined && (
              <div>
                <div className="text-caption-uppercase text-body">Khoảng cách</div>
                <div className="text-body-sm font-semibold text-ink nums">~{restaurant.estimatedDistanceKm} km</div>
              </div>
            )}
            {Number(restaurant.minOrderAmount) > 0 && (
              <div>
                <div className="text-caption-uppercase text-body">Đơn tối thiểu</div>
                <div className="text-body-sm font-semibold text-ink nums">{formatVnd(restaurant.minOrderAmount)}</div>
              </div>
            )}
            <div>
              <div className="text-caption-uppercase text-body">Ẩm thực</div>
              <div className="text-body-sm text-ink">{restaurant.cuisineName}</div>
            </div>
            <div>
              <div className="text-caption-uppercase text-body">Địa chỉ</div>
              <div className="text-body-sm text-ink">{addressLine}</div>
            </div>
            {restaurant.phone && (
              <div>
                <div className="text-caption-uppercase text-body">Điện thoại</div>
                <div className="text-body-sm text-ink">{restaurant.phone}</div>
              </div>
            )}
            <Button variant="secondary" leadingIcon="chat" onClick={() => nav('/chat/inbox')}>
              Trò chuyện với quán
            </Button>
            <Button onClick={() => setCartOpen(true)} disabled={!isOpen}>
              {isOpen ? 'Xem giỏ hàng' : 'Quán đang đóng cửa'}
            </Button>
          </Card>
        </aside>
      </div>
    </div>
  );
}

function MenuCard({ item, onAdd, onDec, qty = 0, onClick, disabled, restaurantClosed }) {
  const isOutOfStock = !item.inStock;
  const isDisabled = disabled || isOutOfStock;

  return (
    <Card
      padded={false}
      className={`flex overflow-hidden cursor-pointer hover:shadow-soft transition-shadow ${isOutOfStock ? 'opacity-60 select-none' : ''}`}
      onClick={onClick}
    >
      <div className="flex-1 p-base flex flex-col justify-between">
        <div>
          <div className="flex items-start justify-between gap-2">
            <span className="text-title-md text-ink font-semibold line-clamp-1">{item.name}</span>
            <span className="nums text-title-sm text-ink font-semibold shrink-0">{formatVnd(item.price)}</span>
          </div>
          <p className="mt-1 text-body-sm text-body line-clamp-2">{item.description}</p>
          <div className="mt-2 flex flex-wrap items-center gap-1">
            {item.isFeatured && <Badge tone="outline">Nổi bật</Badge>}
            {item.prepTimeMin > 0 && <Badge tone="outline">{item.prepTimeMin} phút</Badge>}
            {item.ratingAvg > 0 && <Badge tone="outline">⭐ {item.ratingAvg.toFixed(1)}</Badge>}
            {isOutOfStock && <Badge tone="error">Hết hàng</Badge>}
          </div>
        </div>
        <div className="mt-sm">
          {qty > 0 && !isDisabled ? (
            <div className="inline-flex items-center gap-1 rounded-md border border-hairline-strong bg-surface-card p-1" onClick={(e) => e.stopPropagation()}>
              <IconButton
                icon="minus"
                size="sm"
                variant="secondary"
                label={`Giảm số lượng ${item.name}`}
                onClick={onDec}
              />
              <span className="w-8 text-center nums text-button text-ink" aria-live="polite">{qty}</span>
              <IconButton
                icon="plus"
                size="sm"
                variant="primary"
                label={`Tăng số lượng ${item.name}`}
                onClick={onAdd}
              />
            </div>
          ) : (
            <IconButton
              icon={isOutOfStock ? 'close' : 'plus'}
              label={isOutOfStock ? `${item.name} đã hết hàng` : restaurantClosed ? `Quán đang đóng cửa, chưa thể thêm ${item.name}` : `Thêm ${item.name} vào giỏ`}
              variant={isDisabled ? 'secondary' : 'primary'}
              size="sm"
              disabled={isDisabled}
              className={isDisabled ? 'cursor-not-allowed opacity-40' : ''}
              onClick={(e) => {
                e.stopPropagation();
                onAdd();
              }}
            />
          )}
        </div>
      </div>
      <div className="w-32 shrink-0">
        <Image src={item.imageUrl} alt={item.name} className="h-full w-full object-cover" ratio="1" />
      </div>
    </Card>
  );
}

function RestaurantSkeleton() {
  return (
    <div className="bg-canvas">
      <div className="relative">
        <Skeleton className="h-[260px] w-full rounded-none md:h-[420px]" />
        <div className="absolute inset-0 bg-gradient-to-t from-ink/50 to-transparent" />
        <div className="absolute inset-x-0 bottom-0">
          <div className="container-page pb-lg">
            <div className="flex items-end gap-base">
              <Skeleton className="h-20 w-20 rounded-lg" />
              <div className="flex-1">
                <Skeleton className="h-6 w-40" />
                <Skeleton className="mt-2 h-4 w-56" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <section className="border-b border-hairline">
        <div className="container-page py-base">
          <Skeleton className="h-5 w-full" />
        </div>
      </section>

      <div className="container-page grid gap-xl py-xl md:grid-cols-[1fr_320px]">
        <div>
          <div className="mb-base flex gap-xs overflow-x-auto no-scrollbar">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-9 w-20 rounded-md shrink-0" />
            ))}
          </div>
          <div className="grid gap-base sm:grid-cols-2">
            {Array.from({ length: 4 }).map((_, index) => (
              <Card key={index} padded={false} className="flex overflow-hidden">
                <div className="flex-1 p-base">
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="mt-2 h-4 w-full" />
                  <Skeleton className="mt-2 h-4 w-3/5" />
                  <Skeleton className="mt-4 h-9 w-32 rounded-md" />
                </div>
                <Skeleton className="w-32 shrink-0 rounded-none" />
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
