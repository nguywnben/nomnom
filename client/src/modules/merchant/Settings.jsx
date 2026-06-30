import { useState, useEffect } from 'react';
import Button, { IconButton } from '../../components/Button.jsx';
import Card from '../../components/Card.jsx';
import Icon from '../../components/Icon.jsx';
import Input, { Select, Textarea } from '../../components/Input.jsx';
import Switch from '../../components/Switch.jsx';
import { useApp } from '../../context/AppContext.jsx';
import { fetchCuisinesApi } from '../../lib/api.js';

// Cài đặt quán — gắn với `restaurants.*` (base_delivery_fee, min_order_amount,
// avg_prep_time_min, is_open_now, address, cuisine, banner_url, logo_url) và
// một bảng giờ mở/đóng theo ngày (chưa có trong schema; gợi ý mở rộng).
const DAYS = [
  { id: 'mon', label: 'Thứ 2' },
  { id: 'tue', label: 'Thứ 3' },
  { id: 'wed', label: 'Thứ 4' },
  { id: 'thu', label: 'Thứ 5' },
  { id: 'fri', label: 'Thứ 6' },
  { id: 'sat', label: 'Thứ 7' },
  { id: 'sun', label: 'Chủ nhật' },
];

export default function MerchantSettings() {
  const { pushToast } = useApp();
  const [tab, setTab] = useState('profile');
  const [isOpenNow, setIsOpenNow] = useState(true);
  const [cuisines, setCuisines] = useState([]);
  const [hours, setHours] = useState(() =>
    DAYS.reduce((acc, d) => {
      acc[d.id] = { open: true, from: '08:00', to: '22:00' };
      return acc;
    }, {}),
  );
  const [form, setForm] = useState({
    name: 'Cinque Pizzeria',
    tagline: 'Pizza nướng lò củi kiểu Neapolitan từ năm 2017.',
    description: '',
    phone: '0901 234 567',
    address: '12 Linden Ave',
    ward: 'Phường Bến Nghé',
    district: 'Quận 1',
    city: 'TP. Hồ Chí Minh',
    cuisine: '',
    baseDeliveryFee: 25000,
    minOrderAmount: 50000,
    avgPrepTime: 22,
  });

  const set = (patch) => setForm((cur) => ({ ...cur, ...patch }));

  useEffect(() => {
    async function loadCuisines() {
      try {
        const res = await fetchCuisinesApi();
        if (res?.data) {
          const list = res.data.map(c => ({ value: String(c.id), label: c.name }));
          setCuisines(list);
          if (list.length > 0) {
            setForm(prev => ({ ...prev, cuisine: list[0].value }));
          }
        }
      } catch (err) {
        console.error('Lỗi lấy danh sách ẩm thực:', err);
      }
    }
    loadCuisines();
  }, []);

  const save = () => {
    pushToast({ kind: 'success', title: 'Đã lưu cài đặt', message: 'Thay đổi sẽ áp dụng ngay với khách hàng.' });
  };

  return (
    <div className="space-y-base">
      <div className="flex flex-wrap items-end justify-between gap-sm">
        <div>
          <div className="text-caption-uppercase text-body">Quản trị</div>
          <h1 className="text-display-lg text-ink">Cài đặt quán</h1>
          <p className="mt-xs text-body-sm text-body">Cập nhật thông tin hiển thị, giờ mở cửa, phí giao hàng và thiết lập vận hành.</p>
        </div>
        <Switch
          checked={isOpenNow}
          onChange={(v) => {
            setIsOpenNow(v);
            pushToast({
              kind: v ? 'success' : 'warning',
              title: v ? 'Quán đã mở cửa' : 'Quán đã đóng cửa',
              message: v ? 'Bắt đầu nhận đơn ngay.' : 'Khách sẽ không thấy thực đơn của bạn.',
            });
          }}
          label={isOpenNow ? 'Đang nhận đơn' : 'Đang đóng cửa'}
        />
      </div>

      {/* Tab strip */}
      <div className="inline-flex rounded-md border border-hairline-strong bg-surface-card p-1">
        {[
          { id: 'profile', label: 'Thông tin' },
          { id: 'hours', label: 'Giờ mở cửa' },
          { id: 'delivery', label: 'Phí & đơn tối thiểu' },
          { id: 'staff', label: 'Nhân viên' },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={
              'h-9 rounded-sm px-3 text-button transition-colors ' +
              (tab === t.id ? 'bg-primary text-on-primary' : 'text-ink hover:bg-canvas-soft')
            }
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'profile' && (
        <Card padded className="grid gap-sm md:grid-cols-2">
          <Input placeholder="Tên quán" aria-label="Tên quán" value={form.name} onChange={(e) => set({ name: e.target.value })} />
          <Input placeholder="Số điện thoại" aria-label="Số điện thoại" value={form.phone} onChange={(e) => set({ phone: e.target.value })} />
          <Input className="md:col-span-2" placeholder="Slogan ngắn" aria-label="Slogan" value={form.tagline} onChange={(e) => set({ tagline: e.target.value })} />
          <Textarea className="md:col-span-2" placeholder="Giới thiệu quán" rows={4} value={form.description} onChange={(e) => set({ description: e.target.value })} />
          <Input placeholder="Số nhà, đường" value={form.address} onChange={(e) => set({ address: e.target.value })} />
          <Input placeholder="Phường/Xã" value={form.ward} onChange={(e) => set({ ward: e.target.value })} />
          <Input placeholder="Quận/Huyện" value={form.district} onChange={(e) => set({ district: e.target.value })} />
          <Input placeholder="Tỉnh/Thành phố" value={form.city} onChange={(e) => set({ city: e.target.value })} />
          <Select
            options={cuisines}
            value={form.cuisine}
            onChange={(e) => set({ cuisine: e.target.value })}
          />
          <div className="md:col-span-2 flex justify-end gap-2">
            <Button variant="secondary">Hủy</Button>
            <Button onClick={save}>Lưu thay đổi</Button>
          </div>
        </Card>
      )}

      {tab === 'hours' && (
        <Card padded className="space-y-2">
          {DAYS.map((d) => {
            const v = hours[d.id];
            return (
              <div key={d.id} className="grid grid-cols-1 items-center gap-2 border-b border-hairline pb-2 last:border-0 md:grid-cols-[160px_1fr_auto]">
                <div className="text-body-sm font-medium text-ink">{d.label}</div>
                <div className="flex items-center gap-2">
                  <input
                    type="time"
                    value={v.from}
                    disabled={!v.open}
                    onChange={(e) => setHours((cur) => ({ ...cur, [d.id]: { ...cur[d.id], from: e.target.value } }))}
                    className="h-11 rounded-md border border-hairline-strong bg-surface-card px-base text-body-sm text-ink outline-none disabled:opacity-50"
                  />
                  <span className="text-body">đến</span>
                  <input
                    type="time"
                    value={v.to}
                    disabled={!v.open}
                    onChange={(e) => setHours((cur) => ({ ...cur, [d.id]: { ...cur[d.id], to: e.target.value } }))}
                    className="h-11 rounded-md border border-hairline-strong bg-surface-card px-base text-body-sm text-ink outline-none disabled:opacity-50"
                  />
                </div>
                <Switch
                  size="sm"
                  checked={v.open}
                  onChange={(checked) => setHours((cur) => ({ ...cur, [d.id]: { ...cur[d.id], open: checked } }))}
                  label={v.open ? 'Mở' : 'Nghỉ'}
                />
              </div>
            );
          })}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary">Áp dụng cho tất cả</Button>
            <Button onClick={save}>Lưu lịch hoạt động</Button>
          </div>
        </Card>
      )}

      {tab === 'delivery' && (
        <Card padded className="grid gap-sm md:grid-cols-2">
          <Input
            type="number"
            placeholder="Phí giao hàng cơ bản (VND)"
            aria-label="Phí giao hàng cơ bản"
            value={form.baseDeliveryFee}
            onChange={(e) => set({ baseDeliveryFee: Number(e.target.value) })}
            hint="Hiển thị trên thẻ quán và trang thực đơn."
          />
          <Input
            type="number"
            placeholder="Giá trị đơn tối thiểu (VND)"
            aria-label="Đơn tối thiểu"
            value={form.minOrderAmount}
            onChange={(e) => set({ minOrderAmount: Number(e.target.value) })}
            hint="Khách chưa đủ ngưỡng sẽ không thanh toán được."
          />
          <Input
            type="number"
            placeholder="Thời gian chuẩn bị trung bình (phút)"
            aria-label="Thời gian chuẩn bị"
            value={form.avgPrepTime}
            onChange={(e) => set({ avgPrepTime: Number(e.target.value) })}
            hint="Dùng để tính ETA cho khách hàng."
          />
          <div className="rounded-md border border-hairline-strong bg-canvas-soft p-base text-body-sm text-body">
            Hoa hồng nền tảng hiện đang là <span className="font-semibold text-ink">15%</span> trên mỗi đơn (theo
            cấu hình <code>default_commission_rate</code>). Bạn không cần chỉnh ở đây.
          </div>
          <div className="md:col-span-2 flex justify-end">
            <Button onClick={save}>Lưu cài đặt giao hàng</Button>
          </div>
        </Card>
      )}

      {tab === 'staff' && (
        <Card padded>
          <div className="mb-base flex items-center justify-between">
            <div>
              <div className="text-title-md text-ink">Nhân viên quán</div>
              <div className="text-body-sm text-body">Cấp quyền cho người khác cùng quản lý đơn và thực đơn.</div>
            </div>
            <Button leadingIcon="plus">Mời nhân viên</Button>
          </div>
          <ul className="divide-y divide-hairline">
            {[
              { name: 'Trần Quốc Anh', role: 'Chủ quán', email: 'anh@cinque.vn' },
              { name: 'Lê Mai Anh', role: 'Quản lý', email: 'mai.le@cinque.vn' },
              { name: 'Phạm Văn Bình', role: 'Nhân viên', email: 'binh.pham@cinque.vn' },
            ].map((s) => (
              <li key={s.email} className="flex items-center justify-between py-3">
                <div className="min-w-0">
                  <div className="text-body-sm font-medium text-ink truncate">{s.name}</div>
                  <div className="text-caption text-body">{s.email}</div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-caption text-body">{s.role}</span>
                  <IconButton icon="edit" label="Sửa" size="sm" />
                  <IconButton icon="trash" label="Gỡ" size="sm" />
                </div>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
