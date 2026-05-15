import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Badge from '../../components/Badge.jsx';
import Button from '../../components/Button.jsx';
import Card from '../../components/Card.jsx';
import Icon from '../../components/Icon.jsx';
import Image from '../../components/Image.jsx';
import EmptyState from '../../components/EmptyState.jsx';
import Input, { Textarea } from '../../components/Input.jsx';
import { useApp } from '../../context/AppContext.jsx';
import { restaurants } from '../../data/mock.js';

const PAYMENTS = [
  { id: 'card', label: 'Thẻ', detail: 'Visa ··· 4823', icon: 'card' },
  { id: 'wallet', label: 'Ví điện tử', detail: 'Ví NomNom · $48.20', icon: 'wallet' },
  { id: 'cash', label: 'Thanh toán khi nhận hàng', detail: 'Thanh toán tiền mặt cho tài xế', icon: 'cash' },
];

export default function CustomerCheckout() {
  const nav = useNavigate();
  const {
    cart,
    cartSubtotal,
    deliveryFee,
    discount,
    cartTotal,
    placeOrder,
    pushToast,
    currentCustomer,
  } = useApp();
  const [payment, setPayment] = useState('card');
  const [address, setAddress] = useState(currentCustomer.address);
  const [note, setNote] = useState('');
  const [placing, setPlacing] = useState(false);

  const restaurant = restaurants.find((r) => r.id === cart.restaurantId);

  if (!cart.items.length) {
    return (
      <div className="container-page py-section">
        <EmptyState
          icon="cart"
          title="Giỏ hàng trống"
          message="Thêm món từ bất kỳ quán ăn nào để đặt hàng."
          action={
            <Link to="/app/search">
              <Button>Khám phá quán ăn</Button>
            </Link>
          }
        />
      </div>
    );
  }

  const onPlace = () => {
    setPlacing(true);
    // Simulate failure for "card" with luck of 1-in-8
    setTimeout(() => {
      if (payment === 'card' && Math.random() < 0.125) {
        setPlacing(false);
        pushToast({
          kind: 'error',
          title: 'Thanh toán bị từ chối',
          message: 'Thẻ của bạn bị từ chối. Hãy thử phương thức thanh toán khác.',
        });
        return;
      }
      const order = placeOrder(payment);
      setPlacing(false);
      nav('/app/order/success/' + order.id);
    }, 900);
  };

  return (
    <div className="pb-32 lg:pb-0">
      <div className="container-page py-base md:py-xl">
        {/* Mobile header — back arrow + title (no big "display-lg" wasting space) */}
        <div className="flex items-center gap-2 lg:hidden">
          <Link
            to="/app"
            className="grid h-11 w-11 place-items-center -ml-2 rounded-md text-ink hover:bg-canvas-soft"
            aria-label="Back"
          >
            <Icon name="chevronLeft" size={18} />
          </Link>
          <div className="flex-1">
            <div className="text-title-md text-ink">Thanh toán</div>
            <div className="text-caption text-body">Xác nhận đơn hàng của bạn</div>
          </div>
          <Badge tone="default" dot>Bước 2 trên 3</Badge>
        </div>

        {/* Desktop header */}
        <div className="hidden lg:block">
          <Link to="/app" className="text-button text-body hover:text-ink inline-flex items-center gap-1">
            <Icon name="chevronLeft" size={14} /> Về trang chủ
          </Link>
          <div className="mt-2 flex items-end justify-between">
            <div>
              <div className="text-caption-uppercase text-body">Thanh toán</div>
              <h1 className="text-display-lg text-ink">Xác nhận đơn hàng của bạn</h1>
            </div>
            <Badge tone="default" dot>Bước 2 trên 3</Badge>
          </div>
        </div>

        <div className="mt-base grid gap-base md:mt-xl md:gap-xl lg:grid-cols-[1fr_360px]">
          <div className="flex flex-col gap-base">
          <Card padded>
            <div className="mb-sm text-title-md text-ink">Giao đến</div>
            <div className="flex flex-col gap-xs">
              <Input
                label="Địa chỉ"
                leadingIcon="pin"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
              <Input
                label="Số điện thoại"
                leadingIcon="phone"
                value={currentCustomer.phone}
                readOnly
                hint="Tài xế có thể gọi số này để giao hàng."
              />
              <Textarea
                label="Ghi chú giao hàng (không bắt buộc)"
                placeholder="Mã cổng, lối vào tòa nhà, hướng dẫn nhận hàng…"
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </div>
          </Card>

          <Card padded>
            <div className="mb-sm text-title-md text-ink">Thanh toán</div>
            <div className="grid gap-xs sm:grid-cols-3">
              {PAYMENTS.map((p) => {
                const sel = payment === p.id;
                return (
                  <button
                    key={p.id}
                    onClick={() => setPayment(p.id)}
                    className={
                      'flex flex-col items-start gap-2 rounded-md border p-sm text-left transition-colors ' +
                      (sel
                        ? 'border-ink bg-canvas-soft'
                        : 'border-hairline-strong bg-surface-card hover:bg-canvas-soft')
                    }
                  >
                    <span className="grid h-8 w-8 place-items-center rounded-md bg-surface-strong text-ink">
                      <Icon name={p.icon} size={16} />
                    </span>
                    <div>
                      <div className="text-body-sm font-semibold text-ink">{p.label}</div>
                      <div className="text-caption text-body">{p.detail}</div>
                    </div>
                    {sel && (
                      <span className="ml-auto inline-flex items-center gap-1 text-caption text-success">
                        <Icon name="check" size={12} /> Đã chọn
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
            {payment === 'card' && (
              <div className="mt-sm rounded-md border border-hairline bg-canvas-soft p-sm text-caption text-body">
                Thanh toán bằng thẻ đôi khi thất bại trong bản dùng thử để mô phỏng nhà cung cấp thực tế — đây là thiết kế có chủ đích.
              </div>
            )}
          </Card>

          <Card padded>
            <div className="mb-sm flex items-center justify-between">
              <div className="text-title-md text-ink">Tóm tắt đơn hàng</div>
              <Badge tone="outline">{restaurant?.name}</Badge>
            </div>
            <div className="flex flex-col divide-y divide-hairline">
              {cart.items.map((i) => (
                <div key={i.id} className="flex items-center gap-sm py-sm">
                  <Image src={i.image} alt={i.name} className="h-14 w-14 rounded-md" ratio="1" />
                  <div className="flex-1">
                    <div className="text-body-sm font-semibold text-ink">{i.name}</div>
                    <div className="text-caption text-body">SL {i.quantity}</div>
                  </div>
                  <span className="nums text-body-sm text-ink">${(i.price * i.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <Card padded className="flex flex-col gap-sm">
            <div className="text-title-md text-ink">Tổng cộng</div>
            <Row label="Tạm tính" value={`$${cartSubtotal.toFixed(2)}`} />
            <Row label="Phí giao hàng" value={`$${deliveryFee.toFixed(2)}`} />
            {discount > 0 && <Row label="Khuyến mãi" value={`−$${discount.toFixed(2)}`} tone="success" />}
            <div className="my-2 h-px bg-hairline" />
            <Row label="Tổng cộng" value={`$${cartTotal.toFixed(2)}`} bold />
            {/* Desktop place-order button — mobile uses the sticky bottom bar */}
            <Button onClick={onPlace} loading={placing} className="hidden lg:flex">
              {placing ? 'Đang đặt hàng…' : `Đặt hàng — $${cartTotal.toFixed(2)}`}
            </Button>
            <p className="text-caption text-body">
              Bằng việc đặt đơn hàng này, bạn đồng ý với Điều khoản của NomNom.
            </p>
          </Card>
        </aside>
      </div>
      </div>

      {/* Mobile sticky checkout bar — fixed to bottom, above safe area */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-hairline-strong bg-surface-card shadow-soft-lg lg:hidden">
        <div className="flex items-center gap-sm px-base py-sm">
          <div className="flex-1 leading-tight">
            <div className="text-caption-uppercase text-body">Tổng cộng</div>
            <div className="nums text-title-md text-ink">${cartTotal.toFixed(2)}</div>
          </div>
          <Button size="lg" onClick={onPlace} loading={placing} className="flex-1 sm:flex-none">
            {placing ? 'Đang đặt hàng…' : 'Đặt hàng'}
          </Button>
        </div>
        <div className="pb-safe" />
      </div>
    </div>
  );
}

function Row({ label, value, bold, tone }) {
  return (
    <div className="flex items-center justify-between">
      <span className={'text-body-sm ' + (tone === 'success' ? 'text-success' : 'text-body')}>{label}</span>
      <span className={'nums ' + (bold ? 'text-display-sm text-ink' : 'text-body-sm text-ink')}>{value}</span>
    </div>
  );
}
