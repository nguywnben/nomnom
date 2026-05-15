import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Drawer from '../../components/Drawer.jsx';
import Button, { IconButton } from '../../components/Button.jsx';
import Icon from '../../components/Icon.jsx';
import Input from '../../components/Input.jsx';
import Image from '../../components/Image.jsx';
import EmptyState from '../../components/EmptyState.jsx';
import Badge from '../../components/Badge.jsx';
import { useApp } from '../../context/AppContext.jsx';
import { restaurants } from '../../data/mock.js';

export default function CartDrawer() {
  const nav = useNavigate();
  const {
    cart,
    cartOpen,
    setCartOpen,
    setItemQty,
    removeFromCart,
    cartSubtotal,
    deliveryFee,
    discount,
    cartTotal,
    syncing,
    applyPromo,
    appliedPromo,
    setAppliedPromo,
    authedRoles,
  } = useApp();
  const [promoCode, setPromoCode] = useState('');

  const restaurant = restaurants.find((r) => r.id === cart.restaurantId);

  return (
    <Drawer
      open={cartOpen}
      onClose={() => setCartOpen(false)}
      title="Giỏ hàng của bạn"
      footer={
        cart.items.length ? (
          <div className="flex flex-col gap-sm">
            <div className="flex items-center justify-between text-body-sm">
              <span className="text-body">Tạm tính</span>
              <span className="nums text-ink">${cartSubtotal.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between text-body-sm">
              <span className="text-body">Phí giao hàng</span>
              <span className="nums text-ink">${deliveryFee.toFixed(2)}</span>
            </div>
            {discount > 0 && (
              <div className="flex items-center justify-between text-body-sm">
                <span className="text-success">Khuyến mãi</span>
                <span className="nums text-success">−${discount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex items-center justify-between border-t border-hairline pt-sm">
              <span className="text-title-sm text-ink">Tổng cộng</span>
              <span className="nums text-display-sm text-ink">${cartTotal.toFixed(2)}</span>
            </div>
            <Button
              className="mt-xs w-full"
              onClick={() => {
                setCartOpen(false);
                nav('/app/checkout');
              }}
            >
              Thanh toán
            </Button>
          </div>
        ) : null
      }
    >
      <div className="flex flex-col gap-base p-lg">
        {/* Sync status — only visible when logged in */}
        {authedRoles.customer && cart.items.length > 0 && (
          <div className="flex items-center gap-2 rounded-md bg-canvas-soft px-sm py-2 text-caption text-body">
            <Icon
              name="refresh"
              size={12}
              className={syncing ? 'animate-spin text-ink' : 'text-success'}
            />
            {syncing ? 'Đang đồng bộ giỏ hàng với tài khoản của bạn…' : 'Giỏ hàng đã đồng bộ với mara@example.com'}
          </div>
        )}

        {restaurant && (
          <div className="flex items-center gap-sm rounded-md border border-hairline p-sm">
            <Image
              src={restaurant.logo}
              alt={restaurant.name}
              className="h-10 w-10 rounded-md"
              ratio="1"
            />
            <div className="flex-1 min-w-0">
              <div className="text-body-sm font-semibold text-ink truncate">{restaurant.name}</div>
              <div className="text-caption text-body">
                {restaurant.eta} · phí giao ${deliveryFee.toFixed(2)}
              </div>
            </div>
            <Badge tone="success" dot>Mở cửa</Badge>
          </div>
        )}

        {cart.items.length === 0 ? (
          <EmptyState
            icon="cart"
            title="Giỏ hàng trống"
            message="Thêm món từ bất kỳ quán ăn nào đang mở cửa để bắt đầu."
          />
        ) : (
          <div className="flex flex-col divide-y divide-hairline">
            {cart.items.map((i) => (
              <div key={i.id} className="flex items-center gap-sm py-sm">
                <Image src={i.image} alt={i.name} className="h-14 w-14 rounded-md" ratio="1" />
                <div className="flex-1 min-w-0">
                  <div className="text-body-sm font-semibold text-ink truncate">{i.name}</div>
                  <div className="text-caption text-body">${i.price.toFixed(2)}</div>
                </div>
                <div className="flex items-center gap-1">
                  <IconButton
                    icon="minus"
                    size="sm"
                    variant="secondary"
                    label="Giảm"
                    onClick={() => setItemQty(i.id, i.quantity - 1)}
                  />
                  <span className="w-7 text-center text-body-sm font-semibold nums">{i.quantity}</span>
                  <IconButton
                    icon="plus"
                    size="sm"
                    variant="secondary"
                    label="Tăng"
                    onClick={() => setItemQty(i.id, i.quantity + 1)}
                  />
                </div>
                <button
                  className="ml-1 text-body hover:text-error"
                  onClick={() => removeFromCart(i.id)}
                  aria-label="Xóa"
                >
                  <Icon name="trash" size={16} />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Promo */}
        {cart.items.length > 0 && (
          <div className="mt-xs flex flex-col gap-xs">
            <div className="text-caption-uppercase text-body">Mã khuyến mãi</div>
            {appliedPromo ? (
              <div className="flex items-center justify-between rounded-md border border-success bg-[#e6f4ea] px-sm py-2">
                <div>
                  <div className="text-body-sm font-semibold text-ink">{appliedPromo.code}</div>
                  <div className="text-caption text-body">{appliedPromo.label}</div>
                </div>
                <button
                  onClick={() => setAppliedPromo(null)}
                  className="text-body hover:text-ink"
                  aria-label="Xóa"
                >
                  <Icon name="close" size={14} />
                </button>
              </div>
            ) : (
              <div className="flex gap-xs">
                <Input
                  className="flex-1"
                  placeholder="NOMNOM15"
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value)}
                />
                <Button
                  variant="secondary"
                  onClick={() => {
                    applyPromo(promoCode);
                    setPromoCode('');
                  }}
                >
                  Áp dụng
                </Button>
              </div>
            )}
            <div className="text-caption text-body">
              Thử dùng <span className="font-mono text-ink">NOMNOM15</span>, <span className="font-mono text-ink">WELCOME5</span>, hoặc <span className="font-mono text-ink">FREEFEE</span>.
            </div>
          </div>
        )}
      </div>
    </Drawer>
  );
}
