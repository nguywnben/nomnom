import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Badge from '../../components/Badge.jsx';
import Button from '../../components/Button.jsx';
import { IconButton } from '../../components/Button.jsx';
import Card from '../../components/Card.jsx';
import Icon from '../../components/Icon.jsx';
import Image from '../../components/Image.jsx';
import Skeleton from '../../components/Skeleton.jsx';
import NotFoundPage from '../../pages/NotFound.jsx';
import { useApp } from '../../context/AppContext.jsx';
import { formatVnd } from '../../lib/formatVnd.js';
import { fetchMenuItemDetailApi } from '../../lib/api.js';

export default function CustomerDishDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const { addToCart, setCartOpen, pushToast, shopAsCustomer } = useApp();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    const dishId = Number(id);
    if (!dishId || isNaN(dishId)) {
      setError({ status: 404, message: 'ID món ăn không hợp lệ.' });
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    fetchMenuItemDetailApi(dishId)
      .then((res) => {
        if (!res || !res.item) {
          throw { status: 404, message: 'Không tìm thấy món ăn.' };
        }
        setData(res);
      })
      .catch((err) => {
        console.error('Error fetching dish details:', err);
        setError(err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [id]);

  if (loading) {
    return <DishDetailSkeleton />;
  }

  if (error || !data) {
    return <NotFoundPage />;
  }

  const { item, restaurant } = data;

  return (
    <div className="bg-canvas min-h-screen">
      <div className="container-page pt-base">
        <button
          type="button"
          onClick={() => nav(-1)}
          className="inline-flex h-10 items-center gap-1 rounded-md bg-surface-card border border-hairline-strong px-3 text-button text-ink shadow-soft transition-colors hover:bg-canvas-soft"
        >
          <Icon name="chevronLeft" size={16} /> Quay lại
        </button>
      </div>

      <div className="container-page grid gap-xl py-xl md:grid-cols-[1fr_360px]">
        {/* Left column: Image and Description */}
        <div className="flex flex-col gap-base">
          <Image
            src={item.imageUrl}
            alt={item.name}
            ratio="16/9"
            className="w-full rounded-lg border border-hairline-strong"
          />
          <div className="flex flex-col gap-sm">
            <h2 className="text-display-sm font-semibold text-ink border-b border-hairline pb-sm">Mô tả món ăn</h2>
            <p className="text-body-md text-body leading-relaxed whitespace-pre-line">
              {item.description || 'Chưa có mô tả chi tiết cho món ăn này.'}
            </p>
          </div>
        </div>

        {/* Right column: Form details and restaurant info */}
        <div className="flex flex-col gap-base">
          <Card padded className="flex flex-col gap-base">
            <div>
              <h1 className="text-display-md font-bold text-ink leading-tight">{item.name}</h1>
              <div className="mt-sm flex flex-wrap items-center gap-1.5">
                {item.isFeatured && <Badge tone="default">Nổi bật</Badge>}
                {item.prepTimeMin > 0 && <Badge tone="outline">⏰ {item.prepTimeMin} phút</Badge>}
                {item.ratingAvg > 0 && <Badge tone="outline">⭐ {item.ratingAvg.toFixed(1)}</Badge>}
                {item.inStock ? <Badge tone="success">Còn hàng</Badge> : <Badge tone="error">Hết hàng</Badge>}
              </div>
            </div>

            <div className="border-t border-hairline pt-base">
              <div className="text-caption text-body">Giá bán</div>
              <div className="nums text-display-lg font-bold text-primary mt-xxs">{formatVnd(item.price)}</div>
            </div>

            {/* Quantity control & Add to cart */}
            {item.inStock && shopAsCustomer && restaurant.isOpenNow && (
              <div className="border-t border-hairline pt-base flex flex-col gap-base">
                <div className="flex items-center justify-between">
                  <span className="text-body-sm font-medium text-body">Số lượng</span>
                  <div className="flex items-center gap-sm">
                    <IconButton
                      icon="minus"
                      label="Giảm số lượng"
                      variant="secondary"
                      size="sm"
                      disabled={quantity <= 1}
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    />
                    <span className="nums text-title-md font-semibold text-ink w-8 text-center">
                      {quantity}
                    </span>
                    <IconButton
                      icon="plus"
                      label="Tăng số lượng"
                      variant="secondary"
                      size="sm"
                      onClick={() => setQuantity((q) => q + 1)}
                    />
                  </div>
                </div>

                <Button
                  onClick={() => {
                    addToCart(
                      restaurant.id,
                      {
                        id: item.id,
                        name: item.name,
                        price: item.price,
                        imageUrl: item.imageUrl,
                        description: item.description,
                        inStock: item.inStock,
                        prepTimeMin: item.prepTimeMin,
                        ratingAvg: item.ratingAvg,
                        restaurantName: restaurant.name,
                        restaurantLogo: restaurant.logoUrl,
                      },
                      quantity,
                      { baseDeliveryFee: restaurant.baseDeliveryFee },
                    );
                    setCartOpen(true);
                    pushToast({
                      kind: 'success',
                      title: 'Đã thêm vào giỏ hàng',
                      message: `Đã thêm ${quantity} phần ${item.name} vào giỏ hàng.`,
                    });
                  }}
                  className="w-full mt-xs"
                >
                  Thêm vào giỏ hàng • {formatVnd(item.price * quantity)}
                </Button>
              </div>
            )}

            {(!item.inStock || !shopAsCustomer || !restaurant.isOpenNow) && (
              <div className="border-t border-hairline pt-base text-center text-body-sm text-body font-medium">
                {!restaurant.isOpenNow
                  ? 'Quán hiện đang đóng cửa'
                  : !item.inStock
                  ? 'Món ăn hiện đã hết hàng'
                  : 'Tài khoản không hỗ trợ đặt món'}
              </div>
            )}
          </Card>

          {/* Restaurant details card */}
          <Card padded className="flex flex-col gap-sm">
            <div className="flex items-center gap-sm">
              <Image
                src={restaurant.logoUrl}
                alt={restaurant.name}
                className="h-12 w-12 rounded-lg border border-hairline"
                ratio="1"
              />
              <div className="flex-1 min-w-0">
                <h3 className="text-title-sm font-bold text-ink truncate">{restaurant.name}</h3>
                <p className="text-caption text-body truncate">{restaurant.tagline}</p>
              </div>
            </div>

            <div className="border-t border-hairline pt-sm flex flex-col gap-xs text-body-sm text-body">
              <div className="flex items-center gap-1">
                <Icon name="starFilled" size={14} className="text-primary shrink-0" />
                <span className="text-ink font-semibold">{restaurant.ratingAvg.toFixed(1)}</span> ({restaurant.reviewCount} đánh giá)
              </div>
              <div className="flex items-center gap-1">
                <Icon name="pin" size={14} className="shrink-0" />
                <span className="truncate">
                  {[restaurant.addressLine, restaurant.ward, restaurant.district, restaurant.city]
                    .filter(Boolean)
                    .join(', ')}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <Icon name="bike" size={14} className="shrink-0" />
                <span>Phí giao hàng: <span className="text-ink font-semibold">{formatVnd(restaurant.baseDeliveryFee)}</span></span>
              </div>
            </div>

            <Button
              variant="secondary"
              className="w-full mt-xs"
              onClick={() => nav('/app/restaurant/' + restaurant.id)}
            >
              Xem thực đơn của quán
            </Button>
          </Card>
        </div>
      </div>
    </div>
  );
}

function DishDetailSkeleton() {
  return (
    <div className="bg-canvas min-h-screen">
      <div className="container-page pt-base">
        <Skeleton className="h-10 w-24 rounded-md" />
      </div>

      <div className="container-page grid gap-xl py-xl md:grid-cols-[1fr_360px]">
        <div className="flex flex-col gap-base">
          <Skeleton className="w-full rounded-lg aspect-video" />
          <div className="flex flex-col gap-sm">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        </div>

        <div className="flex flex-col gap-base">
          <Card padded className="flex flex-col gap-base">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-5 w-1/2" />
            <div className="border-t border-hairline pt-base">
              <Skeleton className="h-10 w-full" />
            </div>
          </Card>

          <Card padded className="flex flex-col gap-base">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-16 w-full" />
          </Card>
        </div>
      </div>
    </div>
  );
}
