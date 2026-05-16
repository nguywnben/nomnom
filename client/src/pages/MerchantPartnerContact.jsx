import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import Badge from '../components/Badge.jsx';
import Button from '../components/Button.jsx';
import Icon from '../components/Icon.jsx';
import Logo from '../components/Logo.jsx';
import { useApp } from '../context/AppContext.jsx';

/** Khớp seed `cuisines` trong database.sql */
const CUISINES = [
  { id: 1, name: 'Ý' },
  { id: 2, name: 'Mỹ' },
  { id: 3, name: 'Nhật' },
  { id: 4, name: 'Lành mạnh' },
  { id: 5, name: 'Mexico' },
  { id: 6, name: 'Cà phê' },
  { id: 7, name: 'Tiệm bánh' },
];

function slugify(input) {
  const s = String(input ?? '')
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 180);
  return s || 'nha-hang';
}

const inputClass =
  'mt-1.5 w-full rounded-md border border-hairline-strong bg-canvas px-base py-2.5 text-body-md text-ink outline-none ring-0 transition-colors placeholder:text-muted focus:border-ink/30';

/** Nhãn trường + dấu * màu đỏ khi bắt buộc; badge “Tùy chọn” khi cột DB cho phép NULL. */
function FieldLabel({ children, optional, required }) {
  return (
    <span className="mb-0 flex flex-wrap items-center justify-between gap-x-2 gap-y-1">
      <span className="text-caption-uppercase text-ink">
        {children}
        {required ? (
          <span className="font-semibold text-red-600" aria-hidden="true">
            {' '}
            *
          </span>
        ) : null}
      </span>
      {optional ? (
        <span className="shrink-0 rounded-pill border border-hairline bg-canvas-soft px-2 py-0.5 text-caption font-medium normal-case tracking-normal text-body">
          Tùy chọn
        </span>
      ) : null}
    </span>
  );
}

const initialForm = {
  fullName: '',
  email: '',
  phone: '',
  password: '',
  passwordConfirm: '',
  restaurantName: '',
  slug: '',
  tagline: '',
  description: '',
  restaurantPhone: '',
  cuisineId: '',
  addressLine: '',
  ward: '',
  district: '',
  city: '',
  latitude: '',
  longitude: '',
  baseDeliveryFee: '30000',
  minOrderAmount: '0',
  avgPrepTimeMin: '20',
  notes: '',
};

const emptyAsset = { file: null, preview: null };

const initialAssets = {
  banner: { ...emptyAsset },
  logo: { ...emptyAsset },
  license: { ...emptyAsset },
  foodSafety: { ...emptyAsset },
};

const ACCEPT_IMAGE = 'image/jpeg,image/png,image/webp,image/gif';
const ACCEPT_IMAGE_PDF = `${ACCEPT_IMAGE},application/pdf`;

const MAX_FILE_BYTES = 10 * 1024 * 1024;

/** Ô chọn tệp + tên file + xem trước ảnh (PDF chỉ hiện tên). */
function FileUploadField({
  label,
  optional,
  required,
  accept,
  hint,
  asset,
  onFile,
  onClear,
}) {
  const id = useId();
  const inputId = `${id}-file`;
  const isImage = asset.file?.type?.startsWith('image/');

  return (
    <div className="sm:col-span-2">
      <FieldLabel optional={optional} required={required}>
        {label}
      </FieldLabel>
      {hint ? <p className="mt-1 text-caption text-body">{hint}</p> : null}
      <div className="mt-1.5 flex flex-col gap-sm sm:flex-row sm:items-center">
        <input
          id={inputId}
          type="file"
          accept={accept}
          className="sr-only"
          onChange={(ev) => {
            const f = ev.target.files?.[0];
            ev.target.value = '';
            onFile(f ?? null);
          }}
        />
        <label
          htmlFor={inputId}
          className="inline-flex cursor-pointer items-center justify-center rounded-md border border-hairline-strong bg-canvas px-base py-2.5 text-body-sm font-medium text-ink transition-colors hover:bg-canvas-soft"
        >
          Chọn tệp…
        </label>
        {asset.file ? (
          <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
            <span className="truncate text-body-sm text-body" title={asset.file.name}>
              {asset.file.name}
            </span>
            <span className="text-caption text-muted nums">
              ({Math.round(asset.file.size / 1024)} KB)
            </span>
            <button
              type="button"
              onClick={onClear}
              className="text-body-sm font-medium text-text-link hover:underline"
            >
              Gỡ tệp
            </button>
          </div>
        ) : (
          <span className="text-body-sm text-muted">Chưa chọn tệp</span>
        )}
      </div>
      {asset.preview && isImage ? (
        <div className="mt-sm overflow-hidden rounded-md border border-hairline-strong bg-canvas-soft">
          <img src={asset.preview} alt="" className="max-h-48 w-full object-contain" />
        </div>
      ) : null}
    </div>
  );
}

export default function MerchantPartnerContact() {
  const { pushToast } = useApp();
  const [form, setForm] = useState(initialForm);
  const [slugManual, setSlugManual] = useState(false);
  const [assets, setAssets] = useState(initialAssets);
  const assetsRef = useRef(assets);
  assetsRef.current = assets;

  useEffect(() => {
    return () => {
      for (const a of Object.values(assetsRef.current)) {
        if (a.preview) URL.revokeObjectURL(a.preview);
      }
    };
  }, []);

  const setAsset = useCallback((key, file) => {
    setAssets((prev) => {
      const cur = prev[key];
      if (cur.preview) URL.revokeObjectURL(cur.preview);
      if (!file) {
        return { ...prev, [key]: { file: null, preview: null } };
      }
      return { ...prev, [key]: { file, preview: URL.createObjectURL(file) } };
    });
  }, []);

  const clearAllAssets = useCallback(() => {
    setAssets((prev) => {
      for (const a of Object.values(prev)) {
        if (a.preview) URL.revokeObjectURL(a.preview);
      }
      return {
        banner: { file: null, preview: null },
        logo: { file: null, preview: null },
        license: { file: null, preview: null },
        foodSafety: { file: null, preview: null },
      };
    });
  }, []);

  const set = useCallback((key, value) => {
    setForm((f) => ({ ...f, [key]: value }));
  }, []);

  function assignAsset(key, file) {
    if (file && file.size > MAX_FILE_BYTES) {
      pushToast({
        kind: 'error',
        title: 'Tệp quá lớn',
        message: `Mỗi tệp tối đa ${MAX_FILE_BYTES / 1024 / 1024} MB. Vui lòng chọn tệp nhỏ hơn.`,
      });
      return;
    }
    setAsset(key, file);
  }

  function handleRestaurantNameChange(value) {
    setForm((f) => {
      const next = { ...f, restaurantName: value };
      if (!slugManual) next.slug = slugify(value);
      return next;
    });
  }

  function handleSlugChange(value) {
    setSlugManual(true);
    set('slug', value);
  }

  function parseOptionalCoord(raw) {
    const t = String(raw).trim();
    if (!t) return null;
    const n = Number(t);
    if (!Number.isFinite(n)) return NaN;
    return n;
  }

  function handleSubmit(e) {
    e.preventDefault();
    const {
      fullName,
      email,
      phone,
      password,
      passwordConfirm,
      restaurantName,
      slug,
      addressLine,
      city,
      baseDeliveryFee,
      minOrderAmount,
      avgPrepTimeMin,
    } = form;

    if (!fullName.trim() || !email.trim() || !phone.trim()) {
      pushToast({
        kind: 'error',
        title: 'Chưa đủ thông tin',
        message: 'Vui lòng điền họ tên, email và số điện thoại người đại diện.',
      });
      return;
    }
    if (!password || password.length < 8) {
      pushToast({
        kind: 'error',
        title: 'Mật khẩu chưa đạt',
        message: 'Mật khẩu cần ít nhất 8 ký tự.',
      });
      return;
    }
    if (password !== passwordConfirm) {
      pushToast({ kind: 'error', title: 'Mật khẩu', message: 'Hai lần nhập mật khẩu không giống nhau.' });
      return;
    }
    if (!restaurantName.trim() || !slug.trim() || !addressLine.trim() || !city.trim()) {
      pushToast({
        kind: 'error',
        title: 'Chưa đủ thông tin quán',
        message: 'Vui lòng điền tên quán, đường dẫn hiển thị, địa chỉ cụ thể và tỉnh/thành phố.',
      });
      return;
    }
    const fee = Number(baseDeliveryFee);
    const minOrder = Number(minOrderAmount);
    const prep = Number(avgPrepTimeMin);
    if (!Number.isInteger(fee) || fee < 0) {
      pushToast({ kind: 'error', title: 'Phí giao hàng', message: 'Nhập số tiền (VND) hợp lệ, tối thiểu 0.' });
      return;
    }
    if (!Number.isInteger(minOrder) || minOrder < 0) {
      pushToast({ kind: 'error', title: 'Đơn tối thiểu', message: 'Nhập số tiền (VND) hợp lệ, tối thiểu 0.' });
      return;
    }
    if (!Number.isInteger(prep) || prep < 1 || prep > 300) {
      pushToast({
        kind: 'error',
        title: 'Thời gian chuẩn bị',
        message: 'Nhập số phút từ 1 đến 300.',
      });
      return;
    }
    const lat = parseOptionalCoord(form.latitude);
    const lng = parseOptionalCoord(form.longitude);
    if (lat !== null && Number.isNaN(lat)) {
      pushToast({ kind: 'error', title: 'Vị trí bản đồ', message: 'Vĩ độ không đúng định dạng — để trống hoặc nhập số thập phân.' });
      return;
    }
    if (lng !== null && Number.isNaN(lng)) {
      pushToast({ kind: 'error', title: 'Vị trí bản đồ', message: 'Kinh độ không đúng định dạng — để trống hoặc nhập số thập phân.' });
      return;
    }

    pushToast({
      kind: 'success',
      title: 'Đã tiếp nhận hồ sơ (bản demo)',
      message: 'Hiện chưa kết nối máy chủ. Khi có API, NomNom sẽ tạo tài khoản và gửi hồ sơ duyệt quán cho bạn.',
    });
    setForm(initialForm);
    setSlugManual(false);
    clearAllAssets();
  }

  return (
    <div className="min-h-screen bg-canvas">
      <header className="sticky top-0 z-10 border-b border-hairline bg-canvas/95 backdrop-blur">
        <div className="container-page flex h-14 items-center justify-between gap-base">
          <Link
            to={{ pathname: '/', hash: 'doi-tac' }}
            className="inline-flex items-center gap-1 text-body-sm font-medium text-body hover:text-ink"
          >
            <Icon name="chevronLeft" size={18} />
            Quay lại trang chủ
          </Link>
          <Link to="/" className="inline-flex shrink-0" aria-label="NomNom">
            <Logo mono />
          </Link>
        </div>
      </header>

      <main className="container-page max-w-4xl py-xxl md:py-section">
        <Badge tone="outline" className="mb-base">
          Đối tác nhà hàng
        </Badge>
        <h1 className="text-display-md text-ink md:text-display-lg">Đăng ký mở quán trên NomNom</h1>
        <p className="mt-sm max-w-2xl text-body-md text-body">
          Điền thông tin bên dưới để đội phụ trách đối tác liên hệ xác minh và thiết lập tài khoản. Các mục có dấu{' '}
          <span className="font-semibold text-red-600">*</span> màu đỏ là bắt buộc; mục có nhãn{' '}
          <span className="font-medium text-ink">Tùy chọn</span> có thể bổ sung sau hoặc để trống nếu chưa có.
        </p>

        <form
          onSubmit={handleSubmit}
          className="mt-xxl space-y-xxl rounded-lg border border-hairline-strong bg-surface-card p-base md:p-xl"
          noValidate
        >
          {/* --- Người đại diện --- */}
          <section>
            <h2 className="text-title-md text-ink">Bước 1 — Tài khoản người đại diện</h2>
            <p className="mt-1 text-body-sm text-body">
              Người sở hữu tài khoản quản lý quán trên NomNom (đăng nhập, nhận đơn, thanh toán). Thông tin này dùng để
              xác thực và liên hệ trực tiếp.
            </p>
            <div className="mt-base grid gap-base sm:grid-cols-2">
              <label className="block sm:col-span-2">
                <FieldLabel required>Họ và tên</FieldLabel>
                <input
                  type="text"
                  value={form.fullName}
                  onChange={(ev) => set('fullName', ev.target.value)}
                  maxLength={120}
                  autoComplete="name"
                  className={inputClass}
                  placeholder="Ví dụ: Nguyễn Thị Minh"
                  required
                />
              </label>
              <label className="block sm:col-span-2">
                <FieldLabel required>Email làm việc</FieldLabel>
                <input
                  type="email"
                  value={form.email}
                  onChange={(ev) => set('email', ev.target.value)}
                  maxLength={160}
                  autoComplete="email"
                  className={inputClass}
                  placeholder="minh.nguyen@email.com"
                  required
                />
              </label>
              <label className="block">
                <FieldLabel required>Số điện thoại</FieldLabel>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(ev) => set('phone', ev.target.value)}
                  maxLength={20}
                  autoComplete="tel"
                  inputMode="tel"
                  className={inputClass}
                  placeholder="0901 234 567"
                  required
                />
              </label>
              <label className="block">
                <FieldLabel required>Mật khẩu đăng nhập</FieldLabel>
                <input
                  type="password"
                  value={form.password}
                  onChange={(ev) => set('password', ev.target.value)}
                  autoComplete="new-password"
                  className={inputClass}
                  placeholder="Ít nhất 8 ký tự, nên có chữ và số"
                />
              </label>
              <label className="block sm:col-span-2">
                <FieldLabel required>Nhập lại mật khẩu</FieldLabel>
                <input
                  type="password"
                  value={form.passwordConfirm}
                  onChange={(ev) => set('passwordConfirm', ev.target.value)}
                  autoComplete="new-password"
                  className={inputClass}
                  placeholder="Nhập lại đúng mật khẩu phía trên"
                />
              </label>
            </div>
          </section>

          {/* --- Nhà hàng --- */}
          <section>
            <h2 className="text-title-md text-ink">Bước 2 — Thông tin nhà hàng</h2>
            <p className="mt-1 text-body-sm text-body">
              Hiển thị trên ứng dụng và dùng khi giao hàng. Địa chỉ càng đầy đủ, tài xế và khách càng dễ tìm quán.
            </p>
            <div className="mt-base grid gap-base sm:grid-cols-2">
              <label className="block sm:col-span-2">
                <FieldLabel required>Tên nhà hàng / thương hiệu</FieldLabel>
                <input
                  type="text"
                  value={form.restaurantName}
                  onChange={(ev) => handleRestaurantNameChange(ev.target.value)}
                  maxLength={160}
                  autoComplete="organization"
                  className={inputClass}
                  placeholder="Ví dụ: Phở Hà Nội — Chi nhánh Lê Lợi"
                  required
                />
              </label>
              <label className="block sm:col-span-2">
                <FieldLabel required>Đường dẫn hiển thị trên NomNom</FieldLabel>
                <input
                  type="text"
                  value={form.slug}
                  onChange={(ev) => handleSlugChange(ev.target.value)}
                  maxLength={180}
                  className={inputClass}
                  placeholder="pho-ha-noi-le-loi"
                />
                <span className="mt-1 block text-caption text-body">
                  Dùng chữ thường, số và dấu gạch ngang — không dấu cách. Gợi ý được tạo từ tên quán; bạn có thể chỉnh
                  lại cho dễ nhớ (mỗi quán một đường dẫn duy nhất).
                </span>
              </label>
              <label className="block sm:col-span-2">
                <FieldLabel optional>Câu giới thiệu ngắn</FieldLabel>
                <input
                  type="text"
                  value={form.tagline}
                  onChange={(ev) => set('tagline', ev.target.value)}
                  maxLength={255}
                  className={inputClass}
                  placeholder="Ví dụ: Phở tái nạm ninh xương 12 giờ — ship nóng trong 25 phút"
                />
              </label>
              <label className="block sm:col-span-2">
                <FieldLabel optional>Giới thiệu chi tiết</FieldLabel>
                <textarea
                  value={form.description}
                  onChange={(ev) => set('description', ev.target.value)}
                  rows={4}
                  className={inputClass}
                  placeholder="Story quán, giờ cao điểm, món bán chạy, chính sách đóng cửa… (có thể để trống và bổ sung sau)"
                />
              </label>
              <label className="block">
                <FieldLabel optional>Hotline quán</FieldLabel>
                <input
                  type="tel"
                  value={form.restaurantPhone}
                  onChange={(ev) => set('restaurantPhone', ev.target.value)}
                  maxLength={20}
                  className={inputClass}
                  placeholder="Để trống nếu trùng SĐT người đại diện"
                />
              </label>
              <label className="block">
                <FieldLabel optional>Loại ẩm thực</FieldLabel>
                <select
                  value={form.cuisineId}
                  onChange={(ev) => set('cuisineId', ev.target.value)}
                  className={inputClass}
                >
                  <option value="">Chọn loại hình (có thể để trống)</option>
                  {CUISINES.map((c) => (
                    <option key={c.id} value={String(c.id)}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block sm:col-span-2">
                <FieldLabel required>Địa chỉ lấy hàng — số nhà, đường</FieldLabel>
                <input
                  type="text"
                  value={form.addressLine}
                  onChange={(ev) => set('addressLine', ev.target.value)}
                  maxLength={255}
                  className={inputClass}
                  placeholder="Ví dụ: 42 Lý Tự Trọng, phường Bến Nghé"
                  required
                />
              </label>
              <label className="block">
                <FieldLabel optional>Phường / xã</FieldLabel>
                <input
                  type="text"
                  value={form.ward}
                  onChange={(ev) => set('ward', ev.target.value)}
                  maxLength={120}
                  className={inputClass}
                  placeholder="Ví dụ: Phường Bến Nghé"
                />
              </label>
              <label className="block">
                <FieldLabel optional>Quận / huyện</FieldLabel>
                <input
                  type="text"
                  value={form.district}
                  onChange={(ev) => set('district', ev.target.value)}
                  maxLength={120}
                  className={inputClass}
                  placeholder="Ví dụ: Quận 1"
                />
              </label>
              <label className="block sm:col-span-2">
                <FieldLabel required>Tỉnh / thành phố</FieldLabel>
                <input
                  type="text"
                  value={form.city}
                  onChange={(ev) => set('city', ev.target.value)}
                  maxLength={120}
                  className={inputClass}
                  placeholder="Ví dụ: Thành phố Hồ Chí Minh"
                  required
                />
              </label>
              <label className="block">
                <FieldLabel optional>Tọa độ — vĩ độ</FieldLabel>
                <input
                  type="text"
                  inputMode="decimal"
                  value={form.latitude}
                  onChange={(ev) => set('latitude', ev.target.value)}
                  className={inputClass}
                  placeholder="Ví dụ: 10.7769 (để trống nếu chưa có)"
                />
              </label>
              <label className="block">
                <FieldLabel optional>Tọa độ — kinh độ</FieldLabel>
                <input
                  type="text"
                  inputMode="decimal"
                  value={form.longitude}
                  onChange={(ev) => set('longitude', ev.target.value)}
                  className={inputClass}
                  placeholder="Ví dụ: 106.7009 (để trống nếu chưa có)"
                />
              </label>
              <label className="block">
                <FieldLabel required>Phí giao hàng cơ bản (VNĐ)</FieldLabel>
                <input
                  type="number"
                  min={0}
                  step={1000}
                  value={form.baseDeliveryFee}
                  onChange={(ev) => set('baseDeliveryFee', ev.target.value)}
                  className={inputClass}
                  placeholder="30000"
                />
                <span className="mt-1 block text-caption text-body">Mức phí mặc định hiển thị cho khách (có thể chỉnh sau khi duyệt).</span>
              </label>
              <label className="block">
                <FieldLabel required>Giá trị đơn tối thiểu (VNĐ)</FieldLabel>
                <input
                  type="number"
                  min={0}
                  step={1000}
                  value={form.minOrderAmount}
                  onChange={(ev) => set('minOrderAmount', ev.target.value)}
                  className={inputClass}
                  placeholder="0 — không giới hạn tối thiểu"
                />
              </label>
              <label className="block sm:col-span-2">
                <FieldLabel required>Thời gian chuẩn bị trung bình (phút)</FieldLabel>
                <input
                  type="number"
                  min={1}
                  max={300}
                  value={form.avgPrepTimeMin}
                  onChange={(ev) => set('avgPrepTimeMin', ev.target.value)}
                  className={inputClass}
                  placeholder="Ví dụ: 20"
                />
                <span className="mt-1 block text-caption text-body">
                  Ước lượng từ lúc nhận đơn đến khi sẵn sàng giao cho tài xế.
                </span>
              </label>

              <div className="sm:col-span-2">
                <p className="text-caption-uppercase text-ink">Hình ảnh &amp; giấy tờ (tùy chọn)</p>
                <p className="mt-1 text-caption text-body">
                  Tải tệp từ máy tính hoặc điện thoại. Ảnh bìa và logo nên là JPG/PNG/WebP; giấy tờ có thể là ảnh chụp
                  hoặc PDF. Sau khi có backend, NomNom sẽ upload lên lưu trữ và lưu URL vào cơ sở dữ liệu.
                </p>
              </div>
              <FileUploadField
                label="Ảnh bìa quán"
                optional
                accept={ACCEPT_IMAGE}
                hint="Ảnh ngang, tối thiểu khoảng 1200×600px nếu có — định dạng JPG, PNG, WebP hoặc GIF."
                asset={assets.banner}
                onFile={(f) => assignAsset('banner', f)}
                onClear={() => setAsset('banner', null)}
              />
              <FileUploadField
                label="Logo quán"
                optional
                accept={ACCEPT_IMAGE}
                hint="Vuông hoặc gần vuông, nền trong suốt hoặc nền trắng đều được."
                asset={assets.logo}
                onFile={(f) => assignAsset('logo', f)}
                onClear={() => setAsset('logo', null)}
              />
              <FileUploadField
                label="Giấy phép kinh doanh"
                optional
                accept={ACCEPT_IMAGE_PDF}
                hint="Bản scan/ảnh chụp rõ nét hoặc file PDF."
                asset={assets.license}
                onFile={(f) => assignAsset('license', f)}
                onClear={() => setAsset('license', null)}
              />
              <FileUploadField
                label="Giấy chứng nhận VSATTP (hoặc tương đương)"
                optional
                accept={ACCEPT_IMAGE_PDF}
                hint="Nếu chưa có, có thể bổ sung sau khi đội đối tác liên hệ."
                asset={assets.foodSafety}
                onFile={(f) => assignAsset('foodSafety', f)}
                onClear={() => setAsset('foodSafety', null)}
              />
              <label className="block sm:col-span-2">
                <FieldLabel optional>Ghi chú cho đội NomNom</FieldLabel>
                <textarea
                  value={form.notes}
                  onChange={(ev) => set('notes', ev.target.value)}
                  rows={3}
                  className={inputClass}
                  placeholder="Giờ làm việc dự kiến, số chi nhánh, câu hỏi về phí nền tảng…"
                />
              </label>
            </div>
          </section>

          <div className="flex flex-wrap items-center gap-xs border-t border-hairline pt-base">
            <Button type="submit" trailingIcon="arrowRight">
              Gửi hồ sơ đăng ký
            </Button>
            <Button as={Link} to="/faq#faq-quan-an" variant="secondary">
              Câu hỏi thường gặp
            </Button>
          </div>
          <p className="text-caption text-body">
            Đây là giao diện demo: dữ liệu chưa được gửi lên máy chủ. Khi hệ thống thật hoạt động, NomNom sẽ tạo tài
            khoản, gán quyền chủ quán và lưu hồ sơ quán ở trạng thái chờ duyệt theo quy trình nội bộ.
          </p>
        </form>

        <aside className="mt-xxl space-y-base rounded-lg border border-hairline-strong bg-canvas-soft p-base md:p-lg">
          <div className="text-caption-uppercase text-ink">Cần hỗ trợ trực tiếp?</div>
          <a
            href="mailto:doi-tac@nomnom.example?subject=Đăng%20ký%20đối%20tác%20NomNom"
            className="flex items-start gap-3 rounded-md p-sm text-body-sm text-ink transition-colors hover:bg-canvas"
          >
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-md border border-hairline-strong bg-surface-card">
              <Icon name="mail" size={16} />
            </span>
            <span>
              <span className="font-medium">Email đối tác</span>
              <br />
              <span className="text-text-link">doi-tac@nomnom.example</span>
            </span>
          </a>
          <a
            href="tel:+842812345678"
            className="flex items-start gap-3 rounded-md p-sm text-body-sm text-ink transition-colors hover:bg-canvas"
          >
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-md border border-hairline-strong bg-surface-card">
              <Icon name="phone" size={16} />
            </span>
            <span>
              <span className="font-medium">Hotline</span>
              <br />
              <span className="text-text-link nums">028 1234 5678</span>
              <span className="text-body"> · 9:00–18:00</span>
            </span>
          </a>
          <Link
            to="/faq#faq-quan-an"
            className="flex items-center gap-2 text-body-sm font-medium text-text-link hover:underline"
          >
            Xem câu hỏi thường gặp dành cho quán
            <Icon name="chevronRight" size={16} />
          </Link>
        </aside>
      </main>
    </div>
  );
}
