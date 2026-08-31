import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import Badge from '../../components/Badge.jsx';
import Button from '../../components/Button.jsx';
import Card from '../../components/Card.jsx';
import Input, { Select, Textarea } from '../../components/Input.jsx';
import Modal from '../../components/Modal.jsx';
import Tabs from '../../components/Tabs.jsx';
import {
  cancelMerchantAddressChangeRequest,
  createMerchantAddressChangeRequest,
  fetchMerchantSettingsApi,
  updateMerchantSettingsApi,
} from '../../lib/api.js';
import { apiGet } from '../../lib/api.js';
import { createAdministrativeLocationsApi } from '../../lib/administrativeLocations.js';
import { useApp } from '../../context/AppContext.jsx';

const locationsApi = createAdministrativeLocationsApi(apiGet);

const EMPTY = {
  name: '',
  phone: '',
  tagline: '',
  description: '',
  addressLine: '',
  ward: '',
  district: '',
  city: '',
  minOrderAmount: 0,
  avgPrepTimeMin: 20,
  isOpenNow: false,
  bankName: '',
  bankAccountNo: '',
  bankAccountHolder: '',
};

export default function MerchantSettings() {
  const { pushToast, setMerchantRestaurant, logout, user } = useApp();
  const nav = useNavigate();
  const outletCtx = useOutletContext();
  const [tab, setTab] = useState('profile');
  const [form, setForm] = useState(EMPTY);
  const [saved, setSaved] = useState(EMPTY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);
  const [error, setError] = useState('');
  const [addressChangeRequest, setAddressChangeRequest] = useState(null);
  const [addressModalOpen, setAddressModalOpen] = useState(false);
  const [addressForm, setAddressForm] = useState({ addressLine: '', ward: '', district: '', city: '' });
  const [addressSubmitting, setAddressSubmitting] = useState(false);
  const [provinces, setProvinces] = useState([]);
  const [wards, setWards] = useState([]);
  const [provinceCode, setProvinceCode] = useState('');
  const [wardCode, setWardCode] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetchMerchantSettingsApi();
      setForm(response.restaurant);
      setSaved(response.restaurant);
      setAddressChangeRequest(response.addressChangeRequest ?? null);
      setError('');
    } catch (err) {
      setError(err.message || 'Không thể tải cài đặt quán.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const set = (patch) => setForm((current) => ({ ...current, ...patch }));
  const setAddress = (patch) => setAddressForm((current) => ({ ...current, ...patch }));

  useEffect(() => { locationsApi.getProvinces().then(setProvinces).catch(() => setProvinces([])); }, []);
  useEffect(() => { if (!provinceCode) { setWards([]); return; } locationsApi.getWards(provinceCode).then(setWards).catch(() => setWards([])); }, [provinceCode]);

  const openAddressModal = () => {
    setProvinceCode('');
    setWardCode('');
    setAddressForm({
      addressLine: form.addressLine || '',
      ward: form.ward || '',
      district: form.district || '',
      city: form.city || '',
    });
    setAddressModalOpen(true);
  };

  const submitAddressChange = async () => {
    setAddressSubmitting(true);
    try {
      const response = await createMerchantAddressChangeRequest(addressForm);
      setAddressChangeRequest(response.request);
      setAddressModalOpen(false);
      pushToast({ kind: 'success', title: 'Đã gửi yêu cầu', message: 'Địa chỉ hiện tại vẫn được dùng cho đến khi admin duyệt.' });
    } catch (err) {
      pushToast({ kind: 'error', title: 'Không thể gửi yêu cầu', message: err.message || 'Vui lòng kiểm tra lại thông tin địa chỉ.' });
    } finally {
      setAddressSubmitting(false);
    }
  };

  const cancelAddressChange = async () => {
    if (!addressChangeRequest?.id) return;
    setAddressSubmitting(true);
    try {
      const response = await cancelMerchantAddressChangeRequest(addressChangeRequest.id);
      setAddressChangeRequest(response.request);
      pushToast({ kind: 'info', title: 'Đã hủy yêu cầu', message: 'Bạn có thể gửi một yêu cầu đổi địa chỉ mới.' });
    } catch (err) {
      pushToast({ kind: 'error', title: 'Không thể hủy yêu cầu', message: err.message || 'Vui lòng thử lại sau.' });
    } finally {
      setAddressSubmitting(false);
    }
  };

  const save = async () => {
    setSaving(true);
    try {
      const editableSettings = { ...form };
      ['addressLine', 'ward', 'district', 'city', 'id', 'slug', 'commissionRate'].forEach((key) => delete editableSettings[key]);
      const response = await updateMerchantSettingsApi(editableSettings);
      setForm(response.restaurant);
      setSaved(response.restaurant);
      setMerchantRestaurant?.((prev) => (prev ? { ...prev, is_open_now: response.restaurant.isOpenNow } : prev));
      if (outletCtx?.setRestaurantOpen) {
        outletCtx.setRestaurantOpen(Boolean(response.restaurant.isOpenNow));
      }
      setError('');
      pushToast({ kind: 'success', title: 'Đã lưu cài đặt', message: 'Thông tin mới đã được cập nhật.' });
    } catch (err) {
      setError(err.message || 'Không thể lưu cài đặt.');
      pushToast({ kind: 'error', title: 'Lưu thất bại', message: err.message || 'Vui lòng kiểm tra dữ liệu.' });
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await logout();
      nav('/login', { replace: true });
    } catch (err) {
      pushToast({ kind: 'error', title: 'Đăng xuất thất bại', message: err.message || 'Vui lòng thử lại sau.' });
    } finally {
      setLoggingOut(false);
    }
  };

  if (loading && !form.id) {
    return <div className="py-section text-center text-body-sm text-body" role="status">Đang tải cài đặt...</div>;
  }

  return (
    <div className="space-y-base">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-base">
        <div>
          <div className="text-caption-uppercase text-body">Hồ sơ & Hoạt động</div>
          <h1 className="text-display-lg text-ink">Cài đặt Quán ăn</h1>
          <p className="mt-xs text-body-sm text-body">
            Cập nhật thông tin thương hiệu, thiết lập thời gian chuẩn bị món và liên kết tài khoản ngân hàng nhận doanh thu.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-xs">
          <Badge tone={form.isOpenNow ? 'success' : 'warning'} dot>
            {form.isOpenNow ? 'Đang mở cửa' : 'Đang đóng cửa'}
          </Badge>
          <Badge tone="outline">Hoa hồng {form.commissionRate}%</Badge>
        </div>
      </div>

      {error && (
        <div className="rounded-md border border-error bg-[#fbeaea] p-sm text-body-sm text-error" role="alert">
          {error}
        </div>
      )}

      {/* Toolbar: Tabs + Save button */}
      <div className="flex flex-col gap-sm sm:flex-row sm:items-center sm:justify-between">
        <Tabs
          size="sm"
          className="w-fit max-w-full"
          items={[
            { value: 'profile', label: 'Thông tin' },
            { value: 'operations', label: 'Vận hành' },
            { value: 'bank', label: 'Nhận tiền' },
          ]}
          value={tab}
          onChange={setTab}
        />

        <Button leadingIcon="check" size="sm" onClick={save} loading={saving}>
          Lưu thay đổi
        </Button>
      </div>

      {tab === 'profile' && (
        <Card padded className="grid gap-sm md:grid-cols-2">
          <Input id="merchant-name" label="Tên quán" placeholder="VD: Bếp Sông Quê, Pizza Napoli" required value={form.name} onChange={(event) => set({ name: event.target.value })} />
          <Input id="merchant-phone" label="Số điện thoại" placeholder="VD: 0901234567" value={form.phone} onChange={(event) => set({ phone: event.target.value })} />
          <Input id="merchant-tagline" label="Slogan" placeholder="VD: Hương vị đậm đà chuẩn vị truyền thống" className="md:col-span-2" value={form.tagline} onChange={(event) => set({ tagline: event.target.value })} />
          <div className="md:col-span-2">
            <Textarea id="merchant-description" label="Giới thiệu" placeholder="Giới thiệu ngắn gọn về phong cách ẩm thực, cam kết vệ sinh và điểm đặc sắc của quán..." rows={4} value={form.description} onChange={(event) => set({ description: event.target.value })} />
          </div>
          <Input id="merchant-address" label="Địa chỉ" value={form.addressLine} disabled hint="Địa chỉ đang áp dụng để vận hành và tính phí giao hàng." />
          <Input id="merchant-ward" label="Phường/Xã" value={form.ward} disabled />
          <Input id="merchant-district" label="Quận/Huyện" value={form.district} disabled />
          <Input id="merchant-city" label="Tỉnh/Thành phố" value={form.city} disabled />
          <div className="md:col-span-2 rounded-md border border-hairline-strong bg-canvas-soft p-base">
            {addressChangeRequest?.status === 'pending' ? (
              <div className="flex flex-wrap items-center justify-between gap-sm">
                <div>
                  <div className="text-body-sm font-semibold text-ink">Yêu cầu đổi địa chỉ đang chờ duyệt</div>
                  <p className="mt-1 text-caption text-body">
                    Đề xuất: {[addressChangeRequest.proposedAddress.addressLine, addressChangeRequest.proposedAddress.ward, addressChangeRequest.proposedAddress.district, addressChangeRequest.proposedAddress.city].filter(Boolean).join(', ')}
                  </p>
                </div>
                <Button variant="secondary" size="sm" onClick={cancelAddressChange} loading={addressSubmitting}>Hủy yêu cầu</Button>
              </div>
            ) : (
              <div className="flex flex-wrap items-center justify-between gap-sm">
                <div>
                  <div className="text-body-sm font-semibold text-ink">Cần đổi địa chỉ quán?</div>
                  <p className="mt-1 text-caption text-body">
                    Admin sẽ kiểm tra và duyệt trước khi địa chỉ mới được áp dụng.
                    {addressChangeRequest?.status === 'rejected' && addressChangeRequest.rejectionReason ? ` Lý do từ chối gần nhất: ${addressChangeRequest.rejectionReason}` : ''}
                  </p>
                </div>
                <Button variant="secondary" size="sm" onClick={openAddressModal}>Gửi yêu cầu đổi địa chỉ</Button>
              </div>
            )}
          </div>
        </Card>
      )}

      {tab === 'operations' && (
        <Card padded className="grid gap-sm md:grid-cols-2">
          <Input id="min-order-amount" type="number" min="0" step="1000" label="Đơn tối thiểu (VND)" placeholder="VD: 50000 (0 là mọi đơn)" value={form.minOrderAmount} onChange={(event) => set({ minOrderAmount: Number(event.target.value) })} />
          <Input id="avg-prep-time" type="number" min="1" max="300" label="Chuẩn bị trung bình (phút)" placeholder="VD: 15" value={form.avgPrepTimeMin} onChange={(event) => set({ avgPrepTimeMin: Number(event.target.value) })} />
          <div className="md:col-span-2 rounded-md border border-hairline-strong bg-canvas-soft p-base text-body-sm text-body">
            Hoa hồng hiện tại: <span className="font-semibold text-ink">{form.commissionRate}%</span>. Tỷ lệ này do quản trị viên cấu hình.
          </div>
        </Card>
      )}

      {tab === 'bank' && (
        <Card padded className="grid gap-sm md:grid-cols-2">
          <Input id="bank-name" label="Tên ngân hàng" placeholder="Ví dụ: Vietcombank" value={form.bankName} onChange={(event) => set({ bankName: event.target.value })} />
          <Input id="bank-account" label="Số tài khoản" placeholder="VD: 0123456789" inputMode="numeric" value={form.bankAccountNo} onChange={(event) => set({ bankAccountNo: event.target.value })} hint="Chỉ nhập từ 6 đến 40 chữ số." />
          <Input id="bank-holder" label="Chủ tài khoản" placeholder="VD: NGUYEN VAN A" className="md:col-span-2" value={form.bankAccountHolder} onChange={(event) => set({ bankAccountHolder: event.target.value.toUpperCase() })} />
        </Card>
      )}

      <div className="pt-base border-t border-hairline">
        <Card padded className="border-hairline-strong">
          <div className="flex flex-wrap items-center justify-between gap-sm">
            <div>
              <div className="text-body-sm font-semibold text-ink">Đăng xuất tài khoản</div>
              <p className="mt-xs text-caption text-body">
                {user?.email ? `Đang đăng nhập với email: ${user.email}. ` : ''}Đăng xuất khỏi phiên làm việc hiện tại trên thiết bị này.
              </p>
            </div>
            <Button
              variant="critical"
              size="sm"
              leadingIcon="logout"
              onClick={() => setLogoutConfirmOpen(true)}
            >
              Đăng xuất
            </Button>
          </div>
        </Card>
      </div>

      <Modal
        open={addressModalOpen}
        onClose={() => setAddressModalOpen(false)}
        title="Yêu cầu đổi địa chỉ quán"
        size="lg"
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => setAddressModalOpen(false)} disabled={addressSubmitting}>
              Hủy
            </Button>
            <Button size="sm" onClick={submitAddressChange} loading={addressSubmitting}>
              Gửi yêu cầu
            </Button>
          </>
        }
      >
        <div className="grid gap-sm md:grid-cols-2">
          <Select id="request-city" label="Tỉnh/Thành phố" required value={provinceCode} options={[{ value: '', label: 'Chọn Tỉnh/Thành phố' }, ...provinces.map((item) => ({ value: item.code, label: item.name }))]} onChange={(event) => { const item = provinces.find((value) => value.code === event.target.value); setProvinceCode(event.target.value); setWardCode(''); setAddress({ city: item?.name ?? '', district: '', ward: '' }); }} />
          <Select id="request-ward" label="Phường/Xã" required value={wardCode} disabled={!provinceCode} options={[{ value: '', label: provinceCode ? 'Chọn Phường/Xã' : 'Chọn Tỉnh/Thành phố trước' }, ...wards.map((item) => ({ value: item.code, label: item.name }))]} onChange={(event) => { const item = wards.find((value) => value.code === event.target.value); setWardCode(event.target.value); setAddress({ ward: item?.name ?? '' }); }} />
          <Input id="request-address-line" className="md:col-span-2" label="Số nhà, tên đường cụ thể" placeholder="Số nhà, tên đường cụ thể..." required value={addressForm.addressLine} onChange={(event) => setAddress({ addressLine: event.target.value })} />
          <p className="md:col-span-2 text-caption text-body">Địa chỉ mới chỉ có hiệu lực sau khi admin duyệt; trong lúc chờ, hệ thống vẫn dùng địa chỉ hiện tại.</p>
        </div>
      </Modal>

      <Modal
        open={logoutConfirmOpen}
        onClose={() => setLogoutConfirmOpen(false)}
        title="Xác nhận đăng xuất"
        size="sm"
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => setLogoutConfirmOpen(false)} disabled={loggingOut}>
              Hủy
            </Button>
            <Button
              variant="critical"
              size="sm"
              leadingIcon="logout"
              onClick={handleLogout}
              loading={loggingOut}
            >
              Đăng xuất
            </Button>
          </>
        }
      >
        <p className="text-body-sm text-body">
          Bạn có chắc chắn muốn đăng xuất khỏi cổng quản trị quán đối tác không?
        </p>
      </Modal>
    </div>
  );
}
