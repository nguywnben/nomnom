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
    appliedPromo,
    applyPromo,
    setAppliedPromo,
  } = useApp();
  const [payment, setPayment] = useState('cod');
  const [addresses, setAddresses] = useState([]);
  const [loadingAddresses, setLoadingAddresses] = useState(true);
  const [addressId, setAddressId] = useState(null);
  const [isAddingNewAddress, setIsAddingNewAddress] = useState(false);
  const [promoCode, setPromoCode] = useState('');
  
  // Trạng thái cho địa chỉ mới nếu người dùng chưa lưu địa chỉ nào hoặc bấm thêm mới
  const [newRecipientName, setNewRecipientName] = useState('');
  const [newLine1, setNewLine1] = useState('');
  
  // Location states
  const [provinces, setProvinces] = useState([]);
  const [wards, setWards] = useState([]);
  
  const [selectedProvinceCode, setSelectedProvinceCode] = useState('');
  const [selectedProvinceName, setSelectedProvinceName] = useState('');
  
  const [selectedWardCode, setSelectedWardCode] = useState('');
  const [selectedWardName, setSelectedWardName] = useState('');
  
  const [note, setNote] = useState('');
  const [placing, setPlacing] = useState(false);
  const [phone, setPhone] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [recipientNameError, setRecipientNameError] = useState('');
  const [line1Error, setLine1Error] = useState('');
  const [provinceError, setProvinceError] = useState('');
  const [wardError, setWardError] = useState('');
  
  // Dữ liệu nhà hàng tạm cho giao diện nếu giỏ hàng có `restaurantId`
  // Ứng dụng thực tế nên lấy từ API /cart hoặc /orders
  const [restaurant] = useState({ name: 'Nhà hàng' });

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
          setIsAddingNewAddress(true);
        }
      })
      .catch((err) => console.error('Failed to load addresses:', err))
      .finally(() => setLoadingAddresses(false));
  }, [currentCustomer]);

  const restaurantName = cart.restaurantName ?? restaurant?.name ?? 'Quán ăn';

  useEffect(() => {
    fetch('https://provinces.open-api.vn/api/v2/p/')
      .then(res => res.json())
      .then(data => setProvinces(data))
      .catch(err => console.error('Failed to load provinces:', err));
  }, []);

  useEffect(() => {
    if (!selectedProvinceCode) {
      setWards([]);
      setSelectedWardCode('');
      return;
    }
    fetch(`https://provinces.open-api.vn/api/v2/p/${selectedProvinceCode}?depth=2`)
      .then(res => res.json())
      .then(data => setWards(data.wards || []))
      .catch(err => console.error('Failed to load wards:', err));
  }, [selectedProvinceCode]);

  useEffect(() => {
    if (addressId && addresses.length > 0 && !isAddingNewAddress) {
      const addr = addresses.find((a) => a.id === addressId);
      if (addr) {
        setPhone(addr.recipientPhone || currentCustomer?.phone || '');
        setNote(addr.deliveryNote || '');
        setPhoneError('');
      }
    }
  }, [addressId, addresses, currentCustomer, isAddingNewAddress]);

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
    let hasError = false;

    if (!phone.trim()) {
      setPhoneError('Vui lòng nhập số điện thoại');
      hasError = true;
    } else {
      const phoneRegex = /^[0-9+\-\s()]{8,15}$/;
      if (!phoneRegex.test(phone.trim())) {
        setPhoneError('Số điện thoại không hợp lệ');
        hasError = true;
      }
    }

    if (isAddingNewAddress) {
      if (!newRecipientName.trim()) {
        setRecipientNameError('Vui lòng nhập tên người nhận');
        hasError = true;
      }
      if (!newLine1.trim()) {
        setLine1Error('Vui lòng nhập địa chỉ cụ thể');
        hasError = true;
      }
      if (!selectedProvinceCode) {
        setProvinceError('Vui lòng chọn Tỉnh/Thành phố');
        hasError = true;
      }
      if (!selectedWardCode) {
        setWardError('Vui lòng chọn Phường/Xã');
        hasError = true;
      }
    }

    if (hasError) {
      pushToast({ kind: 'error', title: 'Thiếu thông tin', message: 'Vui lòng kiểm tra lại thông tin nhập' });
      return;
    }

    setPlacing(true);
    try {
      let finalAddressId = addressId;

      // Logic tạo tự động nếu người chọn thêm địa chỉ mới
      if (isAddingNewAddress) {
        // Gọi API tạo địa chỉ
        const newAddr = await apiPost('/api/v1/me/addresses', {
          label: 'Nhà',
          recipientName: newRecipientName.trim(),
          recipientPhone: phone.trim(),
          line1: newLine1.trim(),
          ward: selectedWardName,
          city: selectedProvinceName,
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
        customerNote: note,
        voucherCode: appliedPromo?.code || undefined,
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
            <div className="mb-sm flex items-center justify-between">
              <div className="text-title-md text-ink">Giao đến</div>
              {addresses.length > 0 && (
                <Button 
                  size="sm" 
                  variant="secondary" 
                  onClick={() => setIsAddingNewAddress(!isAddingNewAddress)}
                >
                  {isAddingNewAddress ? 'Chọn địa chỉ đã lưu' : 'Thêm địa chỉ mới'}
                </Button>
              )}
            </div>
            <div className="flex flex-col gap-xs">
              {loadingAddresses ? (
                <div className="text-body-sm text-body px-2">Đang tải địa chỉ...</div>
              ) : isAddingNewAddress ? (
                <div className="flex flex-col gap-sm mt-2">
                  <div className="grid grid-cols-2 gap-sm">
                    <div className="flex flex-col gap-1">
                      <label className="text-body-sm font-medium text-ink">Tên người nhận</label>
                      <Input
                        leadingIcon="user"
                        placeholder="Nhập tên người nhận"
                        value={newRecipientName}
                        onChange={(e) => {
                          setNewRecipientName(e.target.value);
                          if (recipientNameError) setRecipientNameError('');
                        }}
                        error={recipientNameError}
                      />
                    </div>
                    
                    <div className="flex flex-col gap-1">
                      <label className="text-body-sm font-medium text-ink">Số điện thoại</label>
                      <Input
                        leadingIcon="phone"
                        placeholder="Số điện thoại"
                        value={phone}
                        onChange={(e) => {
                          setPhone(e.target.value);
                          if (phoneError) setPhoneError('');
                        }}
                        error={phoneError}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-sm">
                    <div className="flex flex-col gap-1">
                      <label className="text-body-sm font-medium text-ink">Tỉnh/Thành phố</label>
                      <select
                        className={`flex h-11 w-full items-center rounded-md border ${provinceError ? 'border-red-500' : 'border-hairline-strong'} bg-surface bg-transparent px-3 text-body-base text-ink focus:border-ink hover:border-ink focus:outline-none`}
                        value={selectedProvinceCode}
                        onChange={(e) => {
                          setSelectedProvinceCode(e.target.value);
                          setSelectedProvinceName(e.target.options[e.target.selectedIndex].text);
                          if (provinceError) setProvinceError('');
                        }}
                      >
                        <option value="">Chọn Tỉnh/Thành phố</option>
                        {provinces.map((p) => (
                          <option key={p.code} value={p.code}>{p.name}</option>
                        ))}
                      </select>
                      {provinceError && <div className="text-xs text-red-500 mt-1">{provinceError}</div>}
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-body-sm font-medium text-ink">Phường/Xã</label>
                      <select
                        className={`flex h-11 w-full items-center rounded-md border ${wardError ? 'border-red-500' : 'border-hairline-strong'} bg-surface bg-transparent px-3 text-body-base text-ink focus:border-ink hover:border-ink focus:outline-none disabled:opacity-50`}
                        value={selectedWardCode}
                        onChange={(e) => {
                          setSelectedWardCode(e.target.value);
                          setSelectedWardName(e.target.options[e.target.selectedIndex].text);
                          if (wardError) setWardError('');
                        }}
                        disabled={!selectedProvinceCode}
                      >
                        <option value="">Chọn Phường/Xã</option>
                        {wards.map((w) => (
                          <option key={w.code} value={w.code}>{w.name}</option>
                        ))}
                      </select>
                      {wardError && <div className="text-xs text-red-500 mt-1">{wardError}</div>}
                    </div>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-body-sm font-medium text-ink">Địa chỉ cụ thể</label>
                    <Input
                      leadingIcon="pin"
                      placeholder="Ví dụ: 123 Lê Lợi"
                      value={newLine1}
                      onChange={(e) => {
                        setNewLine1(e.target.value);
                        if (line1Error) setLine1Error('');
                      }}
                      error={line1Error}
                    />
                  </div>
                  
                  <div className="flex flex-col gap-1">
                    <label className="text-body-sm font-medium text-ink">Ghi chú giao hàng</label>
                    <Textarea
                      id="checkout-note"
                      placeholder="Không bắt buộc. Mã cổng, lối vào tòa nhà..."
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                    />
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-sm">
                  <div className="flex flex-col gap-1">
                    <label className="text-body-sm font-medium text-ink">Địa chỉ giao hàng</label>
                    <select
                      className="flex h-11 w-full items-center rounded-md border border-hairline-strong bg-surface bg-transparent px-3 text-body-base text-ink focus:border-ink hover:border-ink focus:outline-none"
                      value={addressId || ''}
                      onChange={(e) => setAddressId(Number(e.target.value))}
                    >
                      {addresses.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.label ? `[${a.label}] ` : ''}{a.line1}, {a.ward ? `${a.ward}, ` : ''}{a.district ? `${a.district}, ` : ''}{a.city}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-body-sm font-medium text-ink">Số điện thoại</label>
                    <Input
                      leadingIcon="phone"
                      placeholder="Số điện thoại"
                      value={phone}
                      onChange={(e) => {
                        setPhone(e.target.value);
                        if (phoneError) setPhoneError('');
                      }}
                      error={phoneError}
                      hint="Tài xế sẽ gọi số này khi giao tới."
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-body-sm font-medium text-ink">Ghi chú mở rộng</label>
                    <Textarea
                      id="checkout-note"
                      placeholder="Ghi chú giao hàng (không bắt buộc)..."
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                    />
                  </div>
                </div>
              )}
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
            <div className="mb-sm flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                {cart.restaurantLogo && (
                  <Image src={cart.restaurantLogo} alt={restaurantName} className="h-8 w-8 rounded-md" ratio="1" />
                )}
                <div className="text-title-md text-ink truncate">Tóm tắt đơn hàng</div>
              </div>
              <Badge tone="outline">{restaurantName}</Badge>
            </div>
            <div className="flex flex-col divide-y divide-hairline">
              {cart.items.map((i) => (
                <div key={i.id} className="flex items-center gap-sm py-sm">
                  <Image src={i.imageUrl ?? i.image} alt={i.name} className="h-14 w-14 rounded-md" ratio="1" />
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
            {/* Promo Code Input */}
            <div className="flex flex-col gap-xs border-b border-hairline pb-sm mb-xs">
              <div className="text-caption-uppercase text-body">Mã giảm giá</div>
              {appliedPromo ? (
                <div className="flex items-center justify-between rounded-md border border-success/30 bg-[#e6f4ea] px-sm py-2">
                  <div className="min-w-0 flex-1">
                    <div className="text-body-sm font-semibold text-success font-mono">{appliedPromo.code}</div>
                    <div className="text-caption text-success truncate">{appliedPromo.label}</div>
                  </div>
                  <button
                    onClick={() => setAppliedPromo(null)}
                    className="text-body hover:text-ink shrink-0 ml-2"
                    aria-label="Xóa"
                  >
                    <Icon name="close" size={14} />
                  </button>
                </div>
              ) : (
                <div className="flex gap-xs">
                  <Input
                    className="flex-1"
                    placeholder="Ví dụ: NOMNOM15"
                    aria-label="Mã giảm giá"
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                  />
                  <Button
                    variant="secondary"
                    disabled={!promoCode.trim()}
                    onClick={async () => {
                      const ok = await applyPromo(promoCode);
                      if (ok) setPromoCode('');
                    }}
                  >
                    Áp dụng
                  </Button>
                </div>
              )}
            </div>

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
