import { useCallback, useEffect, useState } from 'react';
import Button from '../../components/Button.jsx';
import Card from '../../components/Card.jsx';
import Input, { Textarea } from '../../components/Input.jsx';
import Switch from '../../components/Switch.jsx';
import Tabs from '../../components/Tabs.jsx';
import { fetchMerchantSettingsApi, updateMerchantSettingsApi } from '../../lib/api.js';
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

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetchMerchantSettingsApi();
      setForm(response.restaurant);
      setSaved(response.restaurant);
      setError('');
    } catch (err) {
      setError(err.message || 'Không thể tải cài đặt quán.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const set = (patch) => setForm((current) => ({ ...current, ...patch }));

  const save = async () => {
    setSaving(true);
    try {
      const response = await updateMerchantSettingsApi(form);
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
          <Input id="merchant-address" label="Địa chỉ" value={form.addressLine} disabled hint="Liên hệ admin để thay đổi địa chỉ đã xác minh." />
          <Input id="merchant-ward" label="Phường/Xã" value={form.ward} disabled />
          <Input id="merchant-district" label="Quận/Huyện" value={form.district} disabled />
          <Input id="merchant-city" label="Tỉnh/Thành phố" value={form.city} disabled />
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
    </div>
  );
}
