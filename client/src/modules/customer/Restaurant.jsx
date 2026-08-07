import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import Badge from '../../components/Badge.jsx';
import Button from '../../components/Button.jsx';
import Card from '../../components/Card.jsx';
import Icon from '../../components/Icon.jsx';
import Image from '../../components/Image.jsx';
import StarRating from '../../components/StarRating.jsx';
import Avatar from '../../components/Avatar.jsx';
import EmptyState from '../../components/EmptyState.jsx';
import Skeleton from '../../components/Skeleton.jsx';
import { useApp } from '../../context/AppContext.jsx';
import { formatVnd } from '../../lib/formatVnd.js';
import { useRestaurantDetail } from '../../hooks/useRestaurantDetail.js';
import { useRestaurantMenu } from '../../hooks/useRestaurantMenu.js';
import { useRestaurantReviews } from '../../hooks/useRestaurantReviews.js';

export default function CustomerRestaurant() {
  const { id } = useParams();
  const nav = useNavigate();
  const { addToCart, setCartOpen, pushToast, shopAsCustomer, customerCartRestriction } = useApp();
  const [cat, setCat] = useState('Tất cả');

  const { restaurant, loading: restaurantLoading, error: restaurantError } = useRestaurantDetail(id);
  const { categories, loading: menuLoading, error: menuError } = useRestaurantMenu(id);
  const { reviews, loading: reviewsLoading, error: reviewsError } = useRestaurantReviews(id);

  const categoryNames = useMemo(() => ['Tất cả', ...categories.map((c) => c.name)], [categories]);
  const menuItems = useMemo(
    () => categories.flatMap((category) => category.items.map((item) => ({ ...item, categoryName: category.name }))),
    [categories],
  );
  const filteredItems = useMemo(
    () => (cat === 'Tất cả' ? menuItems : menuItems.filter((item) => item.categoryName === cat)),
    [cat, menuItems],
  );

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

  if (!restaurant) {
    return <RestaurantSkeleton />;
  }

  const isOpen = Boolean(restaurant.isOpenNow);
  const addressLine = [restaurant.addressLine, restaurant.ward, restaurant.district, restaurant.city]
    .filter(Boolean)
    .join(', ');
  const activeCategories = categoryNames.length > 1 ? categoryNames : ['Tất cả'];

  return (
    <div className="bg-canvas">
      <div className="relative">
        <Image
          src={restaurant.bannerUrl}
          alt={restaurant.name}
          ratio="21/9"
          className="w-full max-h-[420px]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink/60 to-transparent" />
        <div className="absolute inset-x-0 bottom-0">
          <div className="container-page pb-lg">
            <div className="flex items-end gap-base">
              <Image
                src={restaurant.logoUrl}
                alt={restaurant.name}
                className="h-20 w-20 rounded-lg border border-hairline-strong"
                ratio="1"
              />
              <div className="flex-1 text-on-dark">
                <div className="flex flex-wrap items-center gap-2">
                  {restaurant.cuisineName && (
                    <Badge tone="default" className="!bg-canvas/15 !text-on-dark">
                      {restaurant.cuisineName}
                    </Badge>
                  )}
                  {!isOpen && <Badge tone="error">Đóng cửa</Badge>}
                </div>
                <h1 className="mt-1 text-display-lg">{restaurant.name}</h1>
                <div className="text-body-sm text-on-dark-soft">{restaurant.tagline}</div>
              </div>
              <div className="hidden md:flex items-center gap-2">
                <Button variant="dark">Lưu</Button>
                <Button variant="primary">Chia sẻ</Button>
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
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-lg border border-hairline-strong bg-canvas-soft px-3 py-2">
                <div className="text-caption text-body">Thời gian giao</div>
                <div className="mt-1 inline-flex items-center gap-1.5 font-medium text-ink">
                  <Icon name="clock" size={14} />
                  {restaurant.avgPrepTimeMin} phút
                </div>
              </div>
              <div className="rounded-lg border border-hairline-strong bg-canvas-soft px-3 py-2">
                <div className="text-caption text-body">Đơn tối thiểu</div>
                <div className="mt-1 inline-flex items-center gap-1.5 font-medium text-ink">
                  <Icon name="cash" size={14} />
                  <span className="nums">{formatVnd(restaurant.minOrderAmount)}</span>
                </div>
              </div>
              <div className="col-span-2 rounded-lg border border-hairline-strong bg-canvas-soft px-3 py-2">
                <div className="text-caption text-body">Phí giao hàng</div>
                <div className="mt-1 inline-flex items-center gap-1.5 font-medium text-ink">
                  <Icon name="pin" size={14} />
                  <span className="nums">{formatVnd(restaurant.baseDeliveryFee)}</span>
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
            <span className="inline-flex items-center gap-1 text-body">
              <Icon name="pin" size={14} /> {addressLine}
            </span>
            <span className="inline-flex items-center gap-1 text-body">
              <Icon name="cash" size={14} /> phí giao {formatVnd(restaurant.baseDeliveryFee)}
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

      <div className="container-page grid gap-xl py-xl md:grid-cols-[1fr_320px]">
        <div>
          <div className="mb-base flex items-center gap-xs overflow-x-auto no-scrollbar">
            {activeCategories.map((c) => (
              <button
                key={c}
                onClick={() => setCat(c)}
                className={
                  'h-9 whitespace-nowrap rounded-md px-sm text-button transition-colors ' +
                  (cat === c
                    ? 'bg-primary text-on-primary'
                    : 'bg-surface-card border border-hairline-strong text-ink hover:bg-canvas-soft')
                }
              >
                {c}
              </button>
            ))}
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
          ) : (
            <div className="grid gap-base sm:grid-cols-2">
              {filteredItems.map((item) => (
                <MenuCard
                  key={item.id}
                  item={item}
                  disabled={!isOpen || !shopAsCustomer}
                  onAdd={() => {
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

                    addToCart(
                      restaurant.id,
                      { ...item, restaurantName: restaurant.name, restaurantLogo: restaurant.logoUrl },
                      1,
                      { baseDeliveryFee: restaurant.baseDeliveryFee },
                    );
                    setCartOpen(true);
                  }}
                />
              ))}
            </div>
          )}

          <section className="mt-xxl">
            <div className="mb-base flex items-center justify-between">
              <h2 className="text-display-sm text-ink">Đánh giá gần đây</h2>
              <Button variant="tertiary" onClick={() => nav(`/app/reviews/${restaurant.id}`)}>
                Viết đánh giá
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
            <div>
              <div className="text-caption-uppercase text-body">Giờ hoạt động hôm nay</div>
              <div className="text-body-sm text-ink">{restaurant.avgPrepTimeMin + 5} phút</div>
            </div>
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

function MenuCard({ item, onAdd, disabled }) {
  const isOutOfStock = !item.inStock;
  const isDisabled = disabled || isOutOfStock;

  return (
    <Card padded={false} className={`flex overflow-hidden ${isOutOfStock ? 'opacity-60 select-none' : ''}`}>
      <div className="flex-1 p-base flex flex-col justify-between">
        <div>
          <div className="flex items-start justify-between gap-2">
            <Link to={`/app/menu-items/${item.id}`} className="text-title-md text-ink font-semibold hover:underline line-clamp-1">
              {item.name}
            </Link>
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
          <Button
            variant={isDisabled ? 'secondary' : 'primary'}
            size="sm"
            leadingIcon={isOutOfStock ? 'close' : 'plus'}
            disabled={isDisabled}
            onClick={onAdd}
          >
            {isOutOfStock ? 'Hết hàng' : 'Thêm vào giỏ hàng'}
          </Button>
        </div>
      </div>
      <Link to={`/app/menu-items/${item.id}`} className="w-32 shrink-0">
        <Image src={item.imageUrl} alt={item.name} className="h-full w-full object-cover" ratio="1" />
      </Link>
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
