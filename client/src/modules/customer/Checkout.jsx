import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Badge from '../../components/Badge.jsx';
import Button, { IconButton } from '../../components/Button.jsx';
import Card from '../../components/Card.jsx';
import Icon from '../../components/Icon.jsx';
import Image from '../../components/Image.jsx';
import EmptyState from '../../components/EmptyState.jsx';
import Input, { Select, Textarea } from '../../components/Input.jsx';
import Stepper from '../../components/Stepper.jsx';
import { useApp } from '../../context/AppContext.jsx';
// Import formatVnd
import { formatVnd } from '../../lib/formatVnd.js';
import { apiGet, apiPost } from '../../lib/api.js';
import { createAdministrativeLocationsApi } from '../../lib/administrativeLocations.js';

const locationsApi = createAdministrativeLocationsApi(apiGet);

function normalizeLocationName(value) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/^(tinh|thanh pho|phuong|xa)\s+/i, '')
    .trim()
    .toLowerCase();
}

const PAYMENTS = [
  { id: 'cod', label: 'Thanh toán khi nhận hàng (COD)', detail: 'Thanh toán khi nhận món', icon: 'cash' },
  { id: 'vnpay', label: 'VNPay', detail: 'Thanh toán qua cổng VNPay', icon: 'card' },
];

const CHECKOUT_STEPS = [
  { label: 'Giỏ hàng' },
  { label: 'Thanh toán' },
  { label: 'Hoàn tất' },
];

export default function CustomerCheckout() {
  const nav = useNavigate();
  const {
    cart,
    cartSubtotal,
    discount,
    pushToast,
    currentCustomer,
    clearCart,
    appliedPromo,
    applyPromo,
    setAppliedPromo,
    deliveryAddress,
    setItemQty,
  } = useApp();
  const [payment, setPayment] = useState('cod');
  const [addresses, setAddresses] = useState([]);
  const [loadingAddresses, setLoadingAddresses] = useState(true);
  const [addressId, setAddressId] = useState(null);
  const [shippingQuote, setShippingQuote] = useState(null);
  const [shippingQuoteLoading, setShippingQuoteLoading] = useState(false);
  const [isAddingNewAddress, setIsAddingNewAddress] = useState(false);
  const [promoCode, setPromoCode] = useState('');
  // Trạng thái cho địa chỉ mới nếu người dùng chưa lưu địa chỉ nào hoặc bấm thêm mới
  const [newRecipientName, setNewRecipientName] = useState('');
  const [newLine1, setNewLine1] = useState('');
  const [makeDefault] = useState(true);

  const [provinces, setProvinces] = useState([]);
  const [wards, setWards] = useState([]);
  const [selectedProvinceCode, setSelectedProvinceCode] = useState('');
  const [selectedWardCode, setSelectedWardCode] = useState('');

  const [selectedProvinceName, setSelectedProvinceName] = useState('');
  const [selectedWardName, setSelectedWardName] = useState('');
  const [newCoordinates, setNewCoordinates] = useState(null);
  const [locatingAddress, setLocatingAddress] = useState(false);

  const [note, setNote] = useState('');
  const [placing, setPlacing] = useState(false);
  const [phone, setPhone] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [recipientNameError, setRecipientNameError] = useState('');
  const [line1Error, setLine1Error] = useState('');
  const [provinceError, setProvinceError] = useState('');
  const [wardError, setWardError] = useState('');

  useEffect(() => {
    setLoadingAddresses(true);
    apiGet('/api/v1/me/addresses')
      .then((data) => {
        setAddresses(data || []);
        if (data && data.length > 0) {
          const preferred =
            (deliveryAddress?.id != null && data.find((a) => String(a.id) === String(deliveryAddress.id))) ||
            data.find((a) => a.isDefault) ||
            data[0];
          setAddressId(preferred.id);
          setPhone(preferred.recipientPhone || currentCustomer?.phone || '');
          setNote(preferred.deliveryNote || '');
        } else {
          // Bật số điện thoại mặc định cho form tạo địa chỉ mới nếu giỏ address bị trống
          setPhone(currentCustomer?.phone || '');
          setIsAddingNewAddress(true);
        }
      })
      .catch((err) => console.error('Failed to load addresses:', err))
      .finally(() => setLoadingAddresses(false));
  }, [currentCustomer, deliveryAddress]);

  const restaurantName = cart.restaurantName ?? 'Quán ăn';
  const quotedDeliveryFee = shippingQuote?.total ?? 0;
  const quotedCartTotal = Math.max(0, cartSubtotal + quotedDeliveryFee - discount);
  const cartTotal = quotedCartTotal;

  /* const useCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocationError('Trình duyệt không hỗ trợ vị trí.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setNewLocation({ latitude: coords.latitude, longitude: coords.longitude });
        setLocationError('');
      },
      () => setLocationError('Hãy cho phép quyền vị trí để tính phí giao hàng chính xác.'),
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }; */

  useEffect(() => { locationsApi.getProvinces().then(setProvinces).catch((error) => pushToast({ kind: 'error', title: 'Không tải được địa giới', message: error.message })); }, [pushToast]);
  useEffect(() => {
    if (!selectedProvinceCode) { setWards([]); return; }
    locationsApi.getWards(selectedProvinceCode).then(setWards).catch(() => setWards([]));
  }, [selectedProvinceCode]);

  const useCurrentLocation = () => {
    if (!navigator.geolocation) {
      pushToast({ kind: 'error', title: 'Không hỗ trợ vị trí', message: 'Trình duyệt này không hỗ trợ định vị.' });
      return;
    }
    setLocatingAddress(true);
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        try {
          const { address } = await apiPost('/api/v1/shipping/reverse-address', {
            latitude: coords.latitude,
            longitude: coords.longitude,
          });
          const province = provinces.find((item) => normalizeLocationName(item.name) === normalizeLocationName(address.city));
          if (!province) throw new Error('Không đối chiếu được Tỉnh/Thành phố từ vị trí hiện tại.');
          const provinceWards = await locationsApi.getWards(province.code);
          const ward = provinceWards.find((item) => normalizeLocationName(item.name) === normalizeLocationName(address.ward));
          if (!ward) throw new Error('Không đối chiếu được Phường/Xã từ vị trí hiện tại.');

          setWards(provinceWards);
          setSelectedProvinceCode(province.code);
          setSelectedProvinceName(province.name);
          setSelectedWardCode(ward.code);
          setSelectedWardName(ward.name);
          setNewLine1(address.line1);
          setNewCoordinates({ latitude: coords.latitude, longitude: coords.longitude });
          setProvinceError('');
          setWardError('');
          setLine1Error('');
          pushToast({ kind: 'success', title: 'Đã xác định vị trí', message: 'Địa chỉ giao hàng đã được điền tự động.' });
        } catch (error) {
          pushToast({ kind: 'error', title: 'Không thể điền địa chỉ', message: error.message });
        } finally {
          setLocatingAddress(false);
        }
      },
      (error) => {
        const message = error.code === error.PERMISSION_DENIED
          ? 'Hãy cho phép NomNom truy cập vị trí trong trình duyệt.'
          : 'Không lấy được vị trí hiện tại. Vui lòng thử lại.';
        pushToast({ kind: 'error', title: 'Không thể lấy vị trí', message });
        setLocatingAddress(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
    );
  };

  /* const legacyUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocationError('Trình duyệt không hỗ trợ lấy vị trí.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setNewLatitude(String(coords.latitude));
        setNewLongitude(String(coords.longitude));
        setLocationError('');
      },
      () => setLocationError('Không thể lấy vị trí. Hãy cho phép quyền vị trí hoặc nhập tọa độ.'),
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }; */

  /* useEffect(() => {
    ghnLocationsApi.getProvinces()
      .then(setProvinces)
      .catch(err => console.error('Failed to load provinces:', err));
  }, []);

  useEffect(() => {
    if (!selectedProvinceCode) {
      setDistricts([]);
      setSelectedDistrictCode('');
      setWards([]);
      setSelectedWardCode('');
      return;
    }
    ghnLocationsApi.getDistricts(selectedProvinceCode)
      .then(setDistricts)
      .catch(err => console.error('Failed to load districts:', err));
  }, [selectedProvinceCode]);

  useEffect(() => {
    if (!selectedDistrictCode) {
      setWards([]);
      setSelectedWardCode('');
      return;
    }
    ghnLocationsApi.getWards(selectedDistrictCode)
      .then(setWards)
      .catch(err => console.error('Failed to load wards:', err));
  }, [selectedDistrictCode]); */

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

  useEffect(() => {
    if (isAddingNewAddress || !addressId) {
      setShippingQuote(null);
      return;
    }
    const address = addresses.find((item) => item.id === addressId);
    if (!Number.isFinite(Number(address?.latitude)) || !Number.isFinite(Number(address?.longitude))) {
      setShippingQuote(null);
      return;
    }
    let cancelled = false;
    setShippingQuoteLoading(true);
    apiPost('/api/v1/shipping/quote', { addressId })
      .then((data) => { if (!cancelled) setShippingQuote(data.quote); })
      .catch((error) => {
        if (!cancelled) {
          setShippingQuote(null);
          pushToast({ kind: 'error', title: 'Không thể tính phí giao hàng', message: error.message });
        }
      })
      .finally(() => { if (!cancelled) setShippingQuoteLoading(false); });
    return () => { cancelled = true; };
  }, [addressId, addresses, isAddingNewAddress, pushToast]);

  useEffect(() => {
    if (!isAddingNewAddress) return undefined;
    const draftAddress = { line1: newLine1.trim(), ward: selectedWardName.trim(), district: '', city: selectedProvinceName.trim(), ...newCoordinates };
    if (![draftAddress.line1, draftAddress.ward, draftAddress.city].every(Boolean)) {
      setShippingQuote(null);
      setShippingQuoteLoading(false);
      return undefined;
    }
    let cancelled = false;
    const timer = window.setTimeout(() => {
      setShippingQuoteLoading(true);
      apiPost('/api/v1/shipping/quote-address', draftAddress)
        .then((data) => { if (!cancelled) setShippingQuote(data.quote); })
        .catch((error) => {
          if (!cancelled) {
            setShippingQuote(null);
            pushToast({ kind: 'error', title: 'Không thể tính phí giao hàng', message: error.message });
          }
        })
        .finally(() => { if (!cancelled) setShippingQuoteLoading(false); });
    }, 600);
    return () => { cancelled = true; window.clearTimeout(timer); };
  }, [isAddingNewAddress, newLine1, selectedWardName, selectedProvinceName, newCoordinates, pushToast]);

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
      if (!selectedProvinceName.trim()) {
        setProvinceError('Vui lòng chọn Tỉnh/Thành phố');
        hasError = true;
      }
      if (!selectedWardName.trim()) {
        setWardError('Vui lòng chọn Phường/Xã');
        hasError = true;
      }
    }

    if (hasError) {
      pushToast({ kind: 'error', title: 'Thiếu thông tin', message: 'Vui lòng kiểm tra lại thông tin nhập' });
      return;
    }

    if (!shippingQuote) {
      pushToast({ kind: 'error', title: 'Chưa có phí giao hàng', message: 'Hãy hoàn tất địa chỉ và chờ hệ thống báo giá.' });
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
          district: '',
          city: selectedProvinceName,
          ...newCoordinates,
          deliveryNote: note,
          isDefault: makeDefault
        });
        finalAddressId = newAddr.id;
        // Giữ địa chỉ vừa tạo làm địa chỉ đã chọn. Nếu đặt đơn lỗi và khách thử lại,
        // checkout sẽ dùng lại địa chỉ này thay vì tạo thêm bản sao.
        setAddresses((current) => [
          { ...newAddr, isDefault: Boolean(newAddr.isDefault) },
          ...current.map((item) => ({ ...item, isDefault: newAddr.isDefault ? false : item.isDefault })),
        ]);
        setAddressId(newAddr.id);
        setIsAddingNewAddress(false);
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
        voucherCode: appliedPromo?.code || null,
      });
      if (payment === 'vnpay') {
        const payRes = await apiPost('/api/v1/payments/vnpay', { orderId: res.order.id });
        window.location.href = payRes.paymentUrl;
      } else {
        clearCart();
        nav('/app/order/success/' + res.order.order_code);
      }
    } catch (err) {
      const paymentMessage = err.status >= 500
        ? 'Không thể kết nối cổng thanh toán lúc này. Vui lòng thử lại sau ít phút hoặc chọn COD.'
        : err.message || 'Không thể tạo đơn hàng';
      pushToast({
        kind: 'error',
        title: payment === 'vnpay' ? 'Thanh toán chưa thể thực hiện' : 'Lỗi đặt hàng',
        message: paymentMessage,
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
          <Stepper steps={CHECKOUT_STEPS} current={2} className="lg:hidden" />
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
            <Stepper steps={CHECKOUT_STEPS} current={2} className="hidden lg:flex" />
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
                    <div className="flex justify-end">
                      <Button type="button" variant="secondary" size="sm" leadingIcon="pin" loading={locatingAddress} onClick={useCurrentLocation}>
                        Dùng vị trí hiện tại
                      </Button>
                    </div>

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
                        <Select value={selectedProvinceCode} options={[{ value: '', label: 'Chọn Tỉnh/Thành phố' }, ...provinces.map((item) => ({ value: item.code, label: item.name }))]} onChange={(e) => { const item = provinces.find((value) => value.code === e.target.value); setNewCoordinates(null); setSelectedProvinceCode(e.target.value); setSelectedProvinceName(item?.name ?? ''); setSelectedWardCode(''); setSelectedWardName(''); if (provinceError) setProvinceError(''); }} error={provinceError} />
                        {provinceError && <div className="text-xs text-red-500 mt-1">{provinceError}</div>}
                      </div>

                      <div className="flex flex-col gap-1">
                        <label className="text-body-sm font-medium text-ink">Phường/Xã</label>
                        <Select value={selectedWardCode} disabled={!selectedProvinceCode} options={[{ value: '', label: selectedProvinceCode ? 'Chọn Phường/Xã' : 'Chọn Tỉnh/Thành phố trước' }, ...wards.map((item) => ({ value: item.code, label: item.name }))]} onChange={(e) => { const item = wards.find((value) => value.code === e.target.value); setNewCoordinates(null); setSelectedWardCode(e.target.value); setSelectedWardName(item?.name ?? ''); if (wardError) setWardError(''); }} error={wardError} />
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
                          setNewCoordinates(null);
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
                      <div className="text-caption text-body">{formatVnd(i.price)} / món</div>
                    </div>
                    <div className="flex items-center gap-1">
                      <IconButton
                        icon="minus"
                        size="sm"
                        variant="secondary"
                        label={`Giảm số lượng ${i.name}`}
                        onClick={() => setItemQty(i.id, i.quantity - 1)}
                      />
                      <span className="w-8 text-center nums text-button text-ink" aria-live="polite">{i.quantity}</span>
                      <IconButton
                        icon="plus"
                        size="sm"
                        variant="secondary"
                        label={`Tăng số lượng ${i.name}`}
                        onClick={() => setItemQty(i.id, i.quantity + 1)}
                      />
                    </div>
                    <span className="nums text-body-sm text-ink w-20 text-right">{formatVnd(i.price * i.quantity)}</span>
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
              {discount > 0 && <Row label="Khuyến mãi" value={`−${formatVnd(discount)}`} tone="success" />}
              <div className="my-2 h-px bg-hairline" />
              <Row
                label="Phí giao hàng"
                value={shippingQuoteLoading ? 'Đang tính...' : shippingQuote ? formatVnd(quotedDeliveryFee) : 'Chọn địa chỉ có vị trí'}
              />
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
