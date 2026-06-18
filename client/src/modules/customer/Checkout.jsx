import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Badge from '../../components/Badge.jsx';
import Button from '../../components/Button.jsx';
import Card from '../../components/Card.jsx';
import Icon from '../../components/Icon.jsx';
import Image from '../../components/Image.jsx';
import EmptyState from '../../components/EmptyState.jsx';
import Input, { Textarea } from '../../components/Input.jsx';
import { useApp } from '../../context/AppContext.jsx';
// Import formatVnd
import { formatVnd } from '../../lib/formatVnd.js';
import { apiGet, apiPost } from '../../lib/api.js';

const PAYMENTS = [
  { id: 'cod', label: 'Thanh toán khi nhận hàng (COD)', detail: 'Thanh toán tiền mặt cho tài xế', icon: 'cash' },
  { id: 'vnpay', label: 'VNPay', detail: 'Thanh toán qua cổng VNPay', icon: 'card', disabled: true },
];

export default function CustomerCheckout() {
  const nav = useNavigate();
  const {
    cart,
    cartSubtotal,
    deliveryFee,
    discount,
    cartTotal,
    pushToast,
    currentCustomer,
    clearCart,
  } = useApp();
  const [payment, setPayment] = useState('cod');
  const [addresses, setAddresses] = useState([]);
  const [loadingAddresses, setLoadingAddresses] = useState(true);
  const [addressId, setAddressId] = useState(null);
  
  // Trạng thái cho địa chỉ mới nếu người dùng chưa lưu địa chỉ nào
  const [newLine1, setNewLine1] = useState('');
  const [newCity, setNewCity] = useState('TP. Hồ Chí Minh');
  
  const [note, setNote] = useState('');
  const [placing, setPlacing] = useState(false);
  const [phone, setPhone] = useState('');
  const [phoneError, setPhoneError] = useState('');
  
  // Dữ liệu nhà hàng tạm cho giao diện nếu giỏ hàng có `restaurantId`
  // Ứng dụng thực tế nên lấy từ API /cart hoặc /orders
  const [restaurant, setRestaurant] = useState({ name: 'Nhà hàng' });

  useEffect(() => {
    setLoadingAddresses(true);
    apiGet('/api/v1/me/addresses')
      .then((data) => {
        setAddresses(data || []);
        if (data && data.length > 0) {
          const defaultAddr = data.find((a) => a.isDefault) || data[0];
          setAddressId(defaultAddr.id);
          setPhone(defaultAddr.recipientPhone || currentCustomer?.phone || '');
          setNote(defaultAddr.deliveryNote || '');
        } else {
          // Bật số điện thoại mặc định cho form tạo địa chỉ mới nếu giỏ address bị trống
          setPhone(currentCustomer?.phone || '');
        }
      })
      .catch((err) => console.error('Failed to load addresses:', err))
      .finally(() => setLoadingAddresses(false));
  }, [currentCustomer]);

  useEffect(() => {
    if (addressId && addresses.length > 0) {
      const addr = addresses.find((a) => a.id === addressId);
      if (addr) {
        setPhone(addr.recipientPhone || currentCustomer?.phone || '');
        setNote(addr.deliveryNote || '');
        setPhoneError('');
      }
    }
  }, [addressId, addresses, currentCustomer]);

  if (!cart?.items?.length) {
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

  const onPlace = async () => {
    if (!phone.trim()) {
      setPhoneError('Vui lòng nhập số điện thoại');
      return;
    }
    const phoneRegex = /^[0-9+\-\s()]{8,15}$/;
    if (!phoneRegex.test(phone.trim())) {
      setPhoneError('Số điện thoại không hợp lệ');
      return;
    }

    setPlacing(true);
    try {
      let finalAddressId = addressId;

      // Logic tạo tự động nếu người dùng chưa có Address nào
      if (addresses.length === 0) {
        if (!newLine1.trim()) {
          pushToast({ kind: 'error', title: 'Thiếu thông tin', message: 'Vui lòng nhập địa chỉ giao hàng' });
          setPlacing(false);
          return;
        }
        
        // Gọi API tạo địa chỉ
        const newAddr = await apiPost('/api/v1/me/addresses', {
          label: 'Nhà',
          recipientName: currentCustomer?.name || 'Khách hàng',
          recipientPhone: phone.trim(),
          line1: newLine1.trim(),
          city: newCity.trim(),
          deliveryNote: note
        });
        finalAddressId = newAddr.id;
      } else if (!finalAddressId) {
        pushToast({ kind: 'error', title: 'Thiếu thông tin', message: 'Vui lòng chọn địa chỉ' });
        setPlacing(false);
        return;
      }

      // Xử lý tạo Order
      const res = await apiPost('/api/v1/orders', {
        addressId: finalAddressId,
        paymentMethod: payment,
        customerNote: note
      });
      clearCart();
      nav('/app/order/success/' + res.order.order_code);
    } catch (err) {
      pushToast({
        kind: 'error',
        title: 'Lỗi đặt hàng',
        message: err.message || 'Không thể tạo đơn hàng',
      });
    } finally {
      setPlacing(false);
    }
  };

  return (
    <div className="pb-32 lg:pb-0">
      <div className="container-page py-base md:py-xl">
        {/* Header trên Mobile - Nút quay lại + Tiêu đề (không chứa "display-lg" chiếm diện tích) */}
        <div className="flex items-center gap-2 lg:hidden">
          <Link
            to="/app"
            className="grid h-11 w-11 place-items-center -ml-2 rounded-md text-ink hover:bg-canvas-soft"
            aria-label="Quay lại"
          >
            <Icon name="chevronLeft" size={18} />
          </Link>
          <div className="flex-1">
            <div className="text-title-md text-ink">Thanh toán</div>
            <div className="text-caption text-body">Xác nhận đơn hàng của bạn</div>
          </div>
          <Badge tone="default" dot>Bước 2 trên 3</Badge>
        </div>

        {/* Header trên Desktop */}
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
              {loadingAddresses ? (
                <div className="text-body-sm text-body px-2">Đang tải địa chỉ...</div>
              ) : addresses.length === 0 ? (
                <>
                  {/* Form nhỏ điền nhanh địa chỉ khi chưa có cái nào */}
                  <Input
                    leadingIcon="pin"
                    placeholder="Địa chỉ nhận hàng (Ví dụ: 123 Lê Lợi)"
                    value={newLine1}
                    onChange={(e) => setNewLine1(e.target.value)}
                  />
                  <Input
                    leadingIcon="map"
                    placeholder="Thành phố"
                    value={newCity}
                    onChange={(e) => setNewCity(e.target.value)}
                    hint="Chỉ hỗ trợ TP. Hồ Chí Minh"
                  />
                </>
              ) : (
                <select
                  className="flex h-11 w-full items-center rounded-md border border-hairline-strong bg-surface bg-transparent px-3 text-body-base text-ink placeholder:text-body focus:border-ink hover:border-ink focus:outline-none"
                  value={addressId || ''}
                  onChange={(e) => setAddressId(Number(e.target.value))}
                >
                  {addresses.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.label ? `[${a.label}] ` : ''}{a.line1}, {a.city}
                    </option>
                  ))}
                </select>
              )}

              <Input
                leadingIcon="phone"
                placeholder="Số điện thoại"
                aria-label="Số điện thoại"
                value={phone}
                onChange={(e) => {
                  setPhone(e.target.value);
                  if (phoneError) setPhoneError('');
                }}
                error={phoneError}
                hint="Tài xế có thể gọi số này để giao hàng."
              />
              <Textarea
                id="checkout-note"
                placeholder="Ghi chú giao hàng (không bắt buộc). Mã cổng, lối vào tòa nhà, hướng dẫn nhận hàng…"
                aria-label="Ghi chú giao hàng"
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
                    disabled={p.disabled}
                    onClick={() => setPayment(p.id)}
                    className={
                      'flex flex-col items-start gap-2 rounded-md border p-sm text-left transition-colors ' +
                      (sel
                        ? 'border-ink bg-canvas-soft'
                        : 'border-hairline-strong py-sm px-sm ' + (p.disabled ? 'opacity-50 cursor-not-allowed bg-surface-card' : 'bg-surface-card hover:bg-canvas-soft'))
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
                Giao dịch thẻ do đối tác thanh toán xử lý bảo mật.
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
                  <span className="nums text-body-sm text-ink">{formatVnd(i.price * i.quantity)}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <Card padded className="flex flex-col gap-sm">
            <div className="text-title-md text-ink">Tổng cộng</div>
            <Row label="Tạm tính" value={formatVnd(cartSubtotal)} />
            <Row label="Phí giao hàng" value={formatVnd(deliveryFee)} />
            {discount > 0 && <Row label="Khuyến mãi" value={`−${formatVnd(discount)}`} tone="success" />}
            <div className="my-2 h-px bg-hairline" />
            <Row label="Tổng cộng" value={formatVnd(cartTotal)} bold />
            {/* Nút đặt hàng trên Desktop — màn hình Mobile sử dụng thanh dưới cùng cố định */}
            <Button onClick={onPlace} loading={placing} className="hidden lg:flex">
              {placing ? 'Đang đặt hàng…' : `Đặt hàng — ${formatVnd(cartTotal)}`}
            </Button>
            <p className="text-caption text-body">
              Bằng việc đặt đơn hàng này, bạn đồng ý với Điều khoản của NomNom.
            </p>
          </Card>
        </aside>
      </div>
      </div>

      {/* Thanh thanh toán cố định trên Mobile — gắn chặt dưới cùng, ở trên safe area */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-hairline-strong bg-surface-card shadow-soft-lg lg:hidden">
        <div className="flex items-center gap-sm px-base py-sm">
          <div className="flex-1 leading-tight">
            <div className="text-caption-uppercase text-body">Tổng cộng</div>
            <div className="nums text-title-md text-ink">{formatVnd(cartTotal)}</div>
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
