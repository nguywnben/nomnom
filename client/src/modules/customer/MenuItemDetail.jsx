import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import Badge from '../../components/Badge.jsx';
import Button from '../../components/Button.jsx';
import Icon from '../../components/Icon.jsx';
import Image from '../../components/Image.jsx';
import Avatar from '../../components/Avatar.jsx';
import Skeleton from '../../components/Skeleton.jsx';
import EmptyState from '../../components/EmptyState.jsx';
import { formatVnd } from '../../lib/formatVnd.js';
import { fetchMenuItemDetailApi } from '../../lib/api.js';
import { useApp } from '../../context/AppContext.jsx';

export default function MenuItemDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const { addToCart, setCartOpen, shopAsCustomer } = useApp();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [quantity, setQuantity] = useState(1);
  const [note, setNote] = useState('');

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError(null);

    fetchMenuItemDetailApi(id)
      .then((res) => {
        if (mounted) {
          setData(res);
        }
      })
      .catch((err) => {
        if (mounted) setError(err.message || 'Không thể tải thông tin món ăn.');
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [id]);

  if (loading) {
    return (
      <div className="container-page py-xl">
        <Skeleton className="h-6 w-32 mb-base" />
        <div className="grid gap-xl lg:grid-cols-2">
          <Skeleton className="aspect-square w-full rounded-lg" />
          <div className="flex flex-col gap-base">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-6 w-1/4" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-12 w-full rounded-md" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !data?.item) {
    return (
      <div className="container-page py-xxl text-center">
        <EmptyState
          icon="search"
          title="Không tìm thấy món ăn"
          message={error || 'Món ăn không tồn tại hoặc đã bị xóa.'}
          action={
            <Button onClick={() => nav('/app/search')}>Quay lại tìm kiếm</Button>
          }
        />
      </div>
    );
  }

  const { item, restaurant } = data;
  const canOrder = item.canOrder && shopAsCustomer;

  const handleAddToCart = () => {
    if (!canOrder) return;
    addToCart(restaurant.id, item, quantity, {
      baseDeliveryFee: restaurant.baseDeliveryFee,
      restaurantName: restaurant.name,
      restaurantLogo: restaurant.logoUrl,
      note,
    });
    setCartOpen(true);
  };

  return (
    <div className="container-page py-xl">
      {/* Back button & Breadcrumb */}
      <div className="mb-base flex items-center gap-xs text-body-sm">
        <button
          onClick={() => nav(-1)}
          className="inline-flex items-center gap-1 text-body hover:text-ink transition-colors"
        >
          <Icon name="arrowLeft" size={16} /> Quay lại
        </button>
        <span className="text-muted">/</span>
        <Link to={`/app/restaurant/${restaurant.id}`} className="text-body hover:text-ink">
          {restaurant.name}
        </Link>
        <span className="text-muted">/</span>
        <span className="text-ink font-medium line-clamp-1">{item.name}</span>
      </div>

      <div className="grid gap-xl lg:grid-cols-2 items-start">
        {/* Left: Dish Image */}
        <div className="relative overflow-hidden rounded-lg border border-hairline-strong bg-surface-card shadow-soft">
          <Image
            src={item.imageUrl}
            alt={item.name}
            ratio="1"
            className="w-full object-cover"
          />
          {!item.canOrder && (
            <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-base text-center">
              <Badge tone="error" size="lg" className="text-title-md">
                {item.unavailableReason || 'Không thể đặt món này'}
              </Badge>
            </div>
          )}
        </div>

        {/* Right: Dish Info & Actions */}
        <div className="flex flex-col gap-base">
          <div>
            <div className="flex items-center gap-2 mb-xs">
              {item.isFeatured && <Badge tone="default">Nổi bật</Badge>}
              <Badge tone={item.inStock ? 'success' : 'error'}>
                {item.inStock ? 'Còn hàng' : 'Hết hàng'}
              </Badge>
              {item.prepTimeMin > 0 && (
                <span className="inline-flex items-center gap-1 text-caption text-body">
                  <Icon name="clock" size={12} /> {item.prepTimeMin} phút chuẩn bị
                </span>
              )}
            </div>

            <h1 className="text-display-md text-ink font-bold">{item.name}</h1>
            <div className="mt-xs text-display-sm font-semibold text-ink nums">
              {formatVnd(item.price)}
            </div>
          </div>

          {item.description && (
            <p className="text-body-md text-body leading-relaxed border-t border-hairline pt-base">
              {item.description}
            </p>
          )}

          {/* Restaurant details card */}
          <Link
            to={`/app/restaurant/${restaurant.id}`}
            className="flex items-center gap-base p-base rounded-lg border border-hairline-strong bg-surface-card hover:bg-canvas-soft transition-colors"
          >
            <Avatar src={restaurant.logoUrl} name={restaurant.name} square size="lg" />
            <div className="min-w-0 flex-1">
              <div className="text-title-sm font-semibold text-ink truncate">{restaurant.name}</div>
              <div className="text-caption text-body flex items-center gap-2 mt-0.5">
                <span className="inline-flex items-center gap-0.5 text-ink font-medium">
                  <Icon name="starFilled" size={12} /> {restaurant.ratingAvg.toFixed(1)}
                </span>
                <span>·</span>
                <span>Phí giao: {formatVnd(restaurant.baseDeliveryFee)}</span>
              </div>
            </div>
            <Icon name="arrowRight" size={16} className="text-body shrink-0" />
          </Link>

          {/* Order Actions */}
          <div className="border-t border-hairline pt-base flex flex-col gap-md">
            {/* Quantity selector */}
            <div className="flex items-center justify-between">
              <span className="text-body-md font-semibold text-ink">Số lượng</span>
              <div className="flex items-center gap-sm rounded-md border border-hairline-strong bg-surface-card p-1">
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  disabled={!canOrder || quantity <= 1}
                  className="grid h-8 w-8 place-items-center rounded bg-canvas-soft hover:bg-hairline disabled:opacity-40"
                  aria-label="Giảm số lượng"
                >
                  <Icon name="minus" size={14} />
                </button>
                <span className="w-8 text-center text-body-md font-semibold text-ink nums">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={() => setQuantity((q) => q + 1)}
                  disabled={!canOrder}
                  className="grid h-8 w-8 place-items-center rounded bg-canvas-soft hover:bg-hairline disabled:opacity-40"
                  aria-label="Tăng số lượng"
                >
                  <Icon name="plus" size={14} />
                </button>
              </div>
            </div>

            {/* Note input */}
            <div>
              <label className="block text-body-sm font-medium text-ink mb-xs">
                Ghi chú cho món ăn (tùy chọn)
              </label>
              <input
                type="text"
                placeholder="Ví dụ: Bớt cay, không lá hành, để riêng nước sốt..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
                disabled={!canOrder}
                className="w-full rounded-md border border-hairline-strong bg-surface px-3 py-2 text-body-sm text-ink outline-none transition-colors focus:border-ink disabled:opacity-50"
              />
            </div>

            {/* Add to cart button */}
            <Button
              size="lg"
              disabled={!canOrder}
              onClick={handleAddToCart}
              className="w-full justify-center !h-12 !text-button"
            >
              {canOrder
                ? `Thêm vào giỏ hàng · ${formatVnd(item.price * quantity)}`
                : item.unavailableReason || 'Không thể đặt món này'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
