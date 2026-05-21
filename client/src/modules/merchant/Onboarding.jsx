import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../../components/Button.jsx';
import Card from '../../components/Card.jsx';
import Icon from '../../components/Icon.jsx';
import Input, { Select, Textarea } from '../../components/Input.jsx';
import { useApp } from '../../context/AppContext.jsx';

// Onboarding cho chủ quán — gom toàn bộ trường KYC khớp với bảng `restaurants`:
// name, slug, tagline, description, address, ward, district, city, lat/lng,
// business_license_url, food_safety_cert_url, base_delivery_fee, min_order_amount,
// avg_prep_time_min, cuisine_id.
const STEPS = [
  { id: 'info', label: 'Thông tin quán', icon: 'store' },
  { id: 'address', label: 'Địa chỉ', icon: 'pin' },
  { id: 'docs', label: 'Giấy tờ', icon: 'shield' },
  { id: 'banking', label: 'Ngân hàng', icon: 'wallet' },
  { id: 'review', label: 'Xác nhận', icon: 'check' },
];

const CUISINES = [
  { value: 'italian', label: 'Ý' },
  { value: 'american', label: 'Mỹ' },
  { value: 'japanese', label: 'Nhật' },
  { value: 'healthy', label: 'Lành mạnh' },
  { value: 'mexican', label: 'Mexico' },
  { value: 'coffee', label: 'Cà phê' },
  { value: 'bakery', label: 'Tiệm bánh' },
];

export default function MerchantOnboarding() {
  const nav = useNavigate();
  const { pushToast } = useApp();
  const [stepIdx, setStepIdx] = useState(0);
  const [form, setForm] = useState({
    name: '',
    slug: '',
    cuisine: 'italian',
    tagline: '',
    description: '',
    phone: '',
    avgPrepTime: 20,
    addressLine: '',
    ward: '',
    district: '',
    city: 'TP. Hồ Chí Minh',
    baseDeliveryFee: 25000,
    minOrderAmount: 50000,
    licenseFile: null,
    foodSafetyFile: null,
    bankName: 'Vietcombank',
    bankAccountNo: '',
    bankAccountHolder: '',
  });

  const set = (patch) => setForm((cur) => ({ ...cur, ...patch }));
  const step = STEPS[stepIdx];

  const next = () => setStepIdx((i) => Math.min(i + 1, STEPS.length - 1));
  const back = () => setStepIdx((i) => Math.max(i - 1, 0));

  const submit = () => {
    pushToast({
      kind: 'success',
      title: 'Đã gửi hồ sơ đăng ký',
      message: 'Đội ngũ NomNom sẽ xét duyệt trong 1-3 ngày làm việc.',
    });
    nav('/merchant/pending', { replace: true });
  };

  return (
    <div className="container-page py-xl">
      <div className="mx-auto max-w-3xl">
        <div className="mb-base">
          <div className="text-caption-uppercase text-body">Đối tác NomNom</div>
          <h1 className="text-display-md text-ink md:text-display-lg">Đăng ký quán ăn</h1>
          <p className="mt-xs text-body-md text-body">
            Hoàn tất 5 bước để hồ sơ quán được xét duyệt. Bạn có thể quay lại sửa trước khi gửi.
          </p>
        </div>

        {/* Stepper */}
        <div className="mb-base overflow-x-auto no-scrollbar">
          <ol className="flex min-w-max items-center gap-2">
            {STEPS.map((s, i) => {
              const done = i < stepIdx;
              const current = i === stepIdx;
              return (
                <li key={s.id} className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => i <= stepIdx && setStepIdx(i)}
                    className={
                      'inline-flex items-center gap-1.5 rounded-pill border px-3 py-1.5 text-caption transition-colors ' +
                      (current
                        ? 'border-ink bg-primary text-on-primary'
                        : done
                          ? 'border-hairline-strong bg-canvas-soft text-ink'
                          : 'border-hairline-strong bg-surface-card text-body')
                    }
                  >
                    <Icon name={done ? 'check' : s.icon} size={12} />
                    {i + 1}. {s.label}
                  </button>
                  {i < STEPS.length - 1 && (
                    <span className="h-px w-6 bg-hairline-strong" aria-hidden />
                  )}
                </li>
              );
            })}
          </ol>
        </div>

        <Card padded className="space-y-base">
          <div>
            <h2 className="text-display-sm text-ink">{step.label}</h2>
            <p className="text-body-sm text-body">Bước {stepIdx + 1} trên {STEPS.length}</p>
          </div>

          {step.id === 'info' && (
            <div className="grid gap-sm md:grid-cols-2">
              <Input placeholder="Tên quán" aria-label="Tên quán" required value={form.name} onChange={(e) => set({ name: e.target.value })} />
              <Input placeholder="Slug (vd: cinque-pizzeria)" aria-label="Slug" value={form.slug} onChange={(e) => set({ slug: e.target.value })} />
              <Select
                aria-label="Loại ẩm thực"
                options={CUISINES}
                value={form.cuisine}
                onChange={(e) => set({ cuisine: e.target.value })}
              />
              <Input
                placeholder="Số điện thoại liên hệ"
                aria-label="Số điện thoại"
                inputMode="tel"
                value={form.phone}
                onChange={(e) => set({ phone: e.target.value })}
              />
              <Input
                className="md:col-span-2"
                placeholder="Slogan ngắn (vd: Pizza nướng củi kiểu Neapolitan)"
                aria-label="Slogan"
                value={form.tagline}
                onChange={(e) => set({ tagline: e.target.value })}
              />
              <Textarea
                className="md:col-span-2"
                placeholder="Giới thiệu quán (250 ký tự)"
                rows={4}
                value={form.description}
                onChange={(e) => set({ description: e.target.value })}
              />
              <Input
                type="number"
                placeholder="Thời gian chuẩn bị trung bình (phút)"
                aria-label="Thời gian chuẩn bị"
                value={form.avgPrepTime}
                onChange={(e) => set({ avgPrepTime: Number(e.target.value) })}
                hint="Hiển thị cho khách trong ETA."
              />
              <Input
                type="number"
                placeholder="Đơn tối thiểu (VND)"
                aria-label="Đơn tối thiểu"
                value={form.minOrderAmount}
                onChange={(e) => set({ minOrderAmount: Number(e.target.value) })}
              />
            </div>
          )}

          {step.id === 'address' && (
            <div className="grid gap-sm md:grid-cols-2">
              <Input className="md:col-span-2" placeholder="Số nhà, đường" aria-label="Địa chỉ" value={form.addressLine} onChange={(e) => set({ addressLine: e.target.value })} />
              <Input placeholder="Phường/Xã" aria-label="Phường/Xã" value={form.ward} onChange={(e) => set({ ward: e.target.value })} />
              <Input placeholder="Quận/Huyện" aria-label="Quận/Huyện" value={form.district} onChange={(e) => set({ district: e.target.value })} />
              <Input placeholder="Tỉnh/Thành phố" aria-label="Tỉnh/Thành phố" required value={form.city} onChange={(e) => set({ city: e.target.value })} />
              <Input
                type="number"
                placeholder="Phí giao hàng cơ bản (VND)"
                aria-label="Phí giao hàng cơ bản"
                value={form.baseDeliveryFee}
                onChange={(e) => set({ baseDeliveryFee: Number(e.target.value) })}
              />
              <div className="md:col-span-2 rounded-md border border-dashed border-hairline-strong bg-canvas-soft p-base text-center">
                <Icon name="pin" size={18} className="mx-auto text-body" />
                <p className="mt-1 text-body-sm text-body">
                  Khi tích hợp bản đồ thật, kéo ghim để xác định kinh độ / vĩ độ (cột latitude, longitude).
                </p>
              </div>
            </div>
          )}

          {step.id === 'docs' && (
            <div className="grid gap-sm md:grid-cols-2">
              <FileBox
                title="Giấy phép kinh doanh"
                hint="Ảnh chụp rõ nội dung, dung lượng dưới 5 MB."
                file={form.licenseFile}
                onChange={(f) => set({ licenseFile: f })}
              />
              <FileBox
                title="Chứng nhận VSATTP"
                hint="Bắt buộc với quán đang hoạt động."
                file={form.foodSafetyFile}
                onChange={(f) => set({ foodSafetyFile: f })}
              />
            </div>
          )}

          {step.id === 'banking' && (
            <div className="grid gap-sm md:grid-cols-2">
              <Select
                aria-label="Ngân hàng"
                options={[
                  'Vietcombank',
                  'Techcombank',
                  'BIDV',
                  'VietinBank',
                  'ACB',
                  'MB Bank',
                  'TPBank',
                  'VPBank',
                  'Sacombank',
                ].map((b) => ({ value: b, label: b }))}
                value={form.bankName}
                onChange={(e) => set({ bankName: e.target.value })}
              />
              <Input
                placeholder="Số tài khoản"
                aria-label="Số tài khoản"
                value={form.bankAccountNo}
                onChange={(e) => set({ bankAccountNo: e.target.value })}
              />
              <Input
                className="md:col-span-2"
                placeholder="Chủ tài khoản (không dấu)"
                aria-label="Chủ tài khoản"
                value={form.bankAccountHolder}
                onChange={(e) => set({ bankAccountHolder: e.target.value })}
              />
              <p className="md:col-span-2 text-caption text-body">
                Tài khoản này sẽ dùng để NomNom chuyển doanh thu sau khi đối soát hằng tuần (xem trang <strong>Ví & Rút tiền</strong>).
              </p>
            </div>
          )}

          {step.id === 'review' && (
            <div className="space-y-sm">
              <ReviewRow label="Tên quán" value={form.name || '—'} />
              <ReviewRow label="Loại ẩm thực" value={CUISINES.find((c) => c.value === form.cuisine)?.label} />
              <ReviewRow label="Địa chỉ" value={[form.addressLine, form.ward, form.district, form.city].filter(Boolean).join(', ') || '—'} />
              <ReviewRow label="Giấy phép kinh doanh" value={form.licenseFile ? form.licenseFile.name : '— (chưa tải lên)'} />
              <ReviewRow label="VSATTP" value={form.foodSafetyFile ? form.foodSafetyFile.name : '— (chưa tải lên)'} />
              <ReviewRow label="Ngân hàng" value={form.bankName} />
              <ReviewRow label="Số tài khoản" value={form.bankAccountNo || '—'} />
              <p className="text-caption text-body">
                Sau khi gửi, hồ sơ chuyển sang trạng thái <span className="font-medium text-ink">Chờ duyệt</span>. Bạn vẫn có thể chỉnh sửa thực đơn trong khi chờ.
              </p>
            </div>
          )}

          <div className="flex flex-col gap-2 border-t border-hairline pt-base md:flex-row md:justify-between">
            <Button variant="secondary" onClick={back} disabled={stepIdx === 0}>
              Quay lại
            </Button>
            {stepIdx < STEPS.length - 1 ? (
              <Button onClick={next} trailingIcon="arrowRight">
                Tiếp tục
              </Button>
            ) : (
              <Button onClick={submit} trailingIcon="check">
                Gửi hồ sơ
              </Button>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}

function FileBox({ title, hint, file, onChange }) {
  return (
    <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-md border border-dashed border-hairline-strong bg-canvas-soft p-base text-center transition-colors hover:bg-canvas">
      <Icon name="upload" size={20} className="text-body" />
      <span className="text-body-sm font-medium text-ink">{title}</span>
      <span className="text-caption text-body">{hint}</span>
      {file && (
        <span className="text-caption text-text-link">{file.name}</span>
      )}
      <input
        type="file"
        accept="image/*,application/pdf"
        className="hidden"
        onChange={(e) => onChange(e.target.files?.[0] || null)}
      />
    </label>
  );
}

function ReviewRow({ label, value }) {
  return (
    <div className="flex items-start justify-between gap-base border-b border-hairline pb-2 last:border-0">
      <span className="text-caption-uppercase text-body">{label}</span>
      <span className="text-body-sm text-ink text-right">{value}</span>
    </div>
  );
}
