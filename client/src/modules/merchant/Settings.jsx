import { useCallback, useEffect, useState } from 'react';
import Button from '../../components/Button.jsx';
import Card from '../../components/Card.jsx';
import Input, { Select, Textarea } from '../../components/Input.jsx';
import Modal from '../../components/Modal.jsx';
import Switch from '../../components/Switch.jsx';
import Tabs from '../../components/Tabs.jsx';
import {
  cancelMerchantAddressChangeRequest,
  createMerchantAddressChangeRequest,
  fetchMerchantGhnDistricts,
  fetchMerchantGhnProvinces,
  fetchMerchantGhnWards,
  fetchMerchantSettingsApi,
  updateMerchantSettingsApi,
} from '../../lib/api.js';
import { useApp } from '../../context/AppContext.jsx';

const EMPTY = {
  name: '',
  phone: '',
  tagline: '',
  description: '',
  addressLine: '',
  ward: '',
  district: '',
  city: '',
  baseDeliveryFee: 0,
  minOrderAmount: 0,
  avgPrepTimeMin: 20,
  isOpenNow: false,
  bankName: '',
  bankAccountNo: '',
  bankAccountHolder: '',
};

export default function MerchantSettings() {
  const { pushToast } = useApp();
  const [tab, setTab] = useState('profile');
  const [form, setForm] = useState(EMPTY);
  const [saved, setSaved] = useState(EMPTY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [addressChangeRequest, setAddressChangeRequest] = useState(null);
  const [addressModalOpen, setAddressModalOpen] = useState(false);
  const [addressForm, setAddressForm] = useState({ addressLine: '', ghnProvinceId: '', ghnDistrictId: '', ghnWardCode: '' });
  const [addressSubmitting, setAddressSubmitting] = useState(false);
  const [provinces, setProvinces] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [wards, setWards] = useState([]);
  const [locationLoading, setLocationLoading] = useState(false);

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

  useEffect(() => {
    if (!addressModalOpen) return undefined;
    let cancelled = false;
    setLocationLoading(true);
    fetchMerchantGhnProvinces()
      .then((items) => { if (!cancelled) setProvinces(items ?? []); })
      .catch((err) => { if (!cancelled) pushToast({ kind: 'error', title: 'Không tải được tỉnh/thành', message: err.message || 'Vui lòng thử lại.' }); })
      .finally(() => { if (!cancelled) setLocationLoading(false); });
    return () => { cancelled = true; };
  }, [addressModalOpen, pushToast]);

  useEffect(() => {
    if (!addressForm.ghnProvinceId) {
      setDistricts([]);
      return undefined;
    }
    let cancelled = false;
    setLocationLoading(true);
    fetchMerchantGhnDistricts(addressForm.ghnProvinceId)
      .then((items) => { if (!cancelled) setDistricts(items ?? []); })
      .catch((err) => { if (!cancelled) pushToast({ kind: 'error', title: 'Không tải được quận/huyện', message: err.message || 'Vui lòng thử lại.' }); })
      .finally(() => { if (!cancelled) setLocationLoading(false); });
    return () => { cancelled = true; };
  }, [addressForm.ghnProvinceId, pushToast]);

  useEffect(() => {
    if (!addressForm.ghnDistrictId) {
      setWards([]);
      return undefined;
    }
    let cancelled = false;
    setLocationLoading(true);
    fetchMerchantGhnWards(addressForm.ghnDistrictId)
      .then((items) => { if (!cancelled) setWards(items ?? []); })
      .catch((err) => { if (!cancelled) pushToast({ kind: 'error', title: 'Không tải được phường/xã', message: err.message || 'Vui lòng thử lại.' }); })
      .finally(() => { if (!cancelled) setLocationLoading(false); });
    return () => { cancelled = true; };
  }, [addressForm.ghnDistrictId, pushToast]);

  const openAddressModal = () => {
    setAddressForm({
      addressLine: form.addressLine || '',
      ghnProvinceId: form.ghnProvinceId ? String(form.ghnProvinceId) : '',
      ghnDistrictId: form.ghnDistrictId ? String(form.ghnDistrictId) : '',
      ghnWardCode: form.ghnWardCode || '',
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
      setError('');
      pushToast({ kind: 'success', title: 'Đã lưu cài đặt', message: 'Thông tin mới đã được cập nhật.' });
    } catch (err) {
      setError(err.message || 'Không thể lưu cài đặt.');
      pushToast({ kind: 'error', title: 'Lưu thất bại', message: err.message || 'Vui lòng kiểm tra dữ liệu.' });
    } finally {
      setSaving(false);
    }
  };

  if (loading && !form.id) {
    return <div className="py-section text-center text-body-sm text-body" role="status">Đang tải cài đặt...</div>;
  }

  return (
    <div className="space-y-base">
      <div className="flex flex-wrap items-end justify-between gap-sm">
        <div>
          <div className="text-caption-uppercase text-body">Quản trị</div>
          <h1 className="text-display-lg text-ink">Cài đặt quán</h1>
          <p className="mt-xs text-body-sm text-body">Quản lý thông tin hiển thị, vận hành và tài khoản nhận tiền.</p>
        </div>
        <Switch
          checked={Boolean(form.isOpenNow)}
          disabled={saving}
          onChange={(checked) => set({ isOpenNow: checked })}
          label={form.isOpenNow ? 'Đang nhận đơn' : 'Đang đóng cửa'}
        />
      </div>

      {error && (
        <div className="rounded-md border border-error bg-[#fbeaea] p-sm text-body-sm text-error" role="alert">
          {error}
        </div>
      )}

      <Tabs
        className="w-fit max-w-full"
        items={[
          { value: 'profile', label: 'Thông tin' },
          { value: 'operations', label: 'Vận hành' },
          { value: 'bank', label: 'Nhận tiền' },
        ]}
        value={tab}
        onChange={setTab}
      />

      {tab === 'profile' && (
        <Card padded className="grid gap-sm md:grid-cols-2">
          <Input id="merchant-name" label="Tên quán" required value={form.name} onChange={(event) => set({ name: event.target.value })} />
          <Input id="merchant-phone" label="Số điện thoại" value={form.phone} onChange={(event) => set({ phone: event.target.value })} />
          <Input id="merchant-tagline" label="Slogan" className="md:col-span-2" value={form.tagline} onChange={(event) => set({ tagline: event.target.value })} />
          <div className="md:col-span-2">
            <Textarea id="merchant-description" label="Giới thiệu" rows={4} value={form.description} onChange={(event) => set({ description: event.target.value })} />
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
        <Card padded className="grid gap-sm md:grid-cols-3">
          <Input id="base-delivery-fee" type="number" min="0" step="1000" label="Phí giao cơ bản (VND)" value={form.baseDeliveryFee} onChange={(event) => set({ baseDeliveryFee: Number(event.target.value) })} />
          <Input id="min-order-amount" type="number" min="0" step="1000" label="Đơn tối thiểu (VND)" value={form.minOrderAmount} onChange={(event) => set({ minOrderAmount: Number(event.target.value) })} />
          <Input id="avg-prep-time" type="number" min="1" max="300" label="Chuẩn bị trung bình (phút)" value={form.avgPrepTimeMin} onChange={(event) => set({ avgPrepTimeMin: Number(event.target.value) })} />
          <div className="md:col-span-3 rounded-md border border-hairline-strong bg-canvas-soft p-base text-body-sm text-body">
            Hoa hồng hiện tại: <span className="font-semibold text-ink">{form.commissionRate}%</span>. Tỷ lệ này do quản trị viên cấu hình.
          </div>
        </Card>
      )}

      {tab === 'bank' && (
        <Card padded className="grid gap-sm md:grid-cols-2">
          <Input id="bank-name" label="Tên ngân hàng" placeholder="Ví dụ: Vietcombank" value={form.bankName} onChange={(event) => set({ bankName: event.target.value })} />
          <Input id="bank-account" label="Số tài khoản" inputMode="numeric" value={form.bankAccountNo} onChange={(event) => set({ bankAccountNo: event.target.value })} hint="Chỉ nhập từ 6 đến 40 chữ số." />
          <Input id="bank-holder" label="Chủ tài khoản" className="md:col-span-2" value={form.bankAccountHolder} onChange={(event) => set({ bankAccountHolder: event.target.value.toUpperCase() })} />
        </Card>
      )}

      <div className="flex justify-end gap-xs">
        <Button variant="secondary" onClick={() => { setForm(saved); setError(''); }} disabled={saving}>Đặt lại</Button>
        <Button leadingIcon="check" onClick={save} loading={saving}>Lưu thay đổi</Button>
      </div>
      <Modal open={addressModalOpen} onClose={() => setAddressModalOpen(false)} title="Yêu cầu đổi địa chỉ quán" size="lg">
        <div className="grid gap-sm md:grid-cols-2">
          <Input id="request-address-line" className="md:col-span-2" label="Địa chỉ cụ thể" required value={addressForm.addressLine} onChange={(event) => setAddress({ addressLine: event.target.value })} />
          <Select
            id="request-city"
            label="Tỉnh/Thành phố"
            required
            value={addressForm.ghnProvinceId}
            disabled={locationLoading && !provinces.length}
            options={[{ value: '', label: 'Chọn Tỉnh/Thành phố' }, ...provinces.map((item) => ({ value: String(item.id), label: item.name }))]}
            onChange={(event) => setAddress({ ghnProvinceId: event.target.value, ghnDistrictId: '', ghnWardCode: '' })}
          />
          <Select
            id="request-district"
            label="Quận/Huyện"
            required
            value={addressForm.ghnDistrictId}
            disabled={!addressForm.ghnProvinceId || (locationLoading && !districts.length)}
            options={[{ value: '', label: addressForm.ghnProvinceId ? 'Chọn Quận/Huyện' : 'Chọn Tỉnh/Thành phố trước' }, ...districts.map((item) => ({ value: String(item.id), label: item.name }))]}
            onChange={(event) => setAddress({ ghnDistrictId: event.target.value, ghnWardCode: '' })}
          />
          <Select
            id="request-ward"
            label="Phường/Xã"
            required
            value={addressForm.ghnWardCode}
            disabled={!addressForm.ghnDistrictId || (locationLoading && !wards.length)}
            options={[{ value: '', label: addressForm.ghnDistrictId ? 'Chọn Phường/Xã' : 'Chọn Quận/Huyện trước' }, ...wards.map((item) => ({ value: String(item.code), label: item.name }))]}
            onChange={(event) => setAddress({ ghnWardCode: event.target.value })}
          />
          <p className="md:col-span-2 text-caption text-body">Địa chỉ mới chỉ có hiệu lực sau khi admin duyệt; trong lúc chờ, hệ thống vẫn dùng địa chỉ hiện tại.</p>
          <div className="flex justify-end gap-2 md:col-span-2">
            <Button variant="secondary" onClick={() => setAddressModalOpen(false)} disabled={addressSubmitting}>Hủy</Button>
            <Button onClick={submitAddressChange} loading={addressSubmitting}>Gửi yêu cầu</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
