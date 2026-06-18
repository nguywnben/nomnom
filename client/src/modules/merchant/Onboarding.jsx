import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import clsx from 'clsx';
import Button from '../../components/Button.jsx';
import Card from '../../components/Card.jsx';
import Icon from '../../components/Icon.jsx';
import Input, { Select, Textarea } from '../../components/Input.jsx';
import { useApp } from '../../context/AppContext.jsx';
import { applyMerchantApi, fetchMe, fetchCuisinesApi } from '../../lib/api.js';
import { uploadFile } from '../../lib/upload.js';

// Onboarding cho chủ quán — gom toàn bộ trường KYC khớp với bảng `restaurants`:
const STEPS = [
  { id: 'info', label: 'Thông tin quán', icon: 'store' },
  { id: 'address', label: 'Địa chỉ', icon: 'pin' },
  { id: 'docs', label: 'Giấy tờ', icon: 'shield' },
  { id: 'banking', label: 'Ngân hàng', icon: 'wallet' },
  { id: 'review', label: 'Xác nhận', icon: 'check' },
];

const STEP_FIELDS = {
  info: ['name', 'cuisine', 'phone', 'avgPrepTime', 'tagline', 'description', 'minOrderAmount'],
  address: ['addressLine', 'ward', 'district', 'city', 'baseDeliveryFee'],
  docs: ['logoUrl', 'bannerUrl', 'licenseUrl', 'foodSafetyUrl'],
  banking: ['bankName', 'bankAccountNo', 'bankAccountHolder'],
  review: [],
};

export default function MerchantOnboarding() {
  const nav = useNavigate();
  const { pushToast, setUser, setRole } = useApp();
  const [stepIdx, setStepIdx] = useState(0);
  const [cuisines, setCuisines] = useState([]);

  const {
    register,
    handleSubmit,
    setValue,
    setError,
    clearErrors,
    watch,
    trigger,
    formState: { errors },
  } = useForm({
    defaultValues: {
      name: '',
      cuisine: '',
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
      logoUrl: '',
      bannerUrl: '',
      licenseUrl: '',
      foodSafetyUrl: '',
      bankName: 'Vietcombank',
      bankAccountNo: '',
      bankAccountHolder: '',
    },
    mode: 'onTouched',
  });

  useEffect(() => {
    async function loadCuisines() {
      try {
        const res = await fetchCuisinesApi();
        if (res?.data) {
          const list = res.data.map(c => ({ value: String(c.id), label: c.name }));
          setCuisines(list);
          if (list.length > 0) {
            setValue('cuisine', list[0].value);
          }
        }
      } catch (err) {
        console.error('Lỗi lấy danh sách ẩm thực:', err);
      }
    }
    loadCuisines();
  }, [setValue]);

  const [files, setFiles] = useState({
    logoFile: null,
    bannerFile: null,
    licenseFile: null,
    foodSafetyFile: null,
  });

  const [uploading, setUploading] = useState({
    logo: false,
    banner: false,
    license: false,
    foodSafety: false,
  });

  const [submitting, setSubmitting] = useState(false);

  const step = STEPS[stepIdx];

  const back = () => setStepIdx((i) => Math.max(i - 1, 0));

  const handleFileChange = async (key, file) => {
    if (!file) return;
    setUploading((prev) => ({ ...prev, [key]: true }));
    try {
      const folder = 'restaurant';
      const { url } = await uploadFile(file, folder);
      
      setFiles((prev) => ({ ...prev, [`${key}File`]: file }));
      setValue(`${key}Url`, url, { shouldValidate: true });
      clearErrors(`${key}Url`);

      pushToast({
        kind: 'success',
        title: 'Tải ảnh thành công',
        message: `Đã cập nhật ảnh ${key === 'logo' ? 'logo' : key === 'banner' ? 'banner' : key === 'license' ? 'giấy phép' : 'VSATTP'}.`,
        duration: 3000,
      });
    } catch (err) {
      pushToast({
        kind: 'error',
        title: 'Lỗi tải ảnh',
        message: err.message || 'Mạng lỗi hoặc kích thước tệp quá lớn.',
        duration: 5000,
      });
    } finally {
      setUploading((prev) => ({ ...prev, [key]: false }));
    }
  };

  const handleNext = async () => {
    const fields = STEP_FIELDS[step.id];
    const isValid = await trigger(fields);
    if (isValid) {
      setStepIdx((i) => Math.min(i + 1, STEPS.length - 1));
    }
  };

  const onSubmit = handleSubmit(async (data) => {
    setSubmitting(true);
    try {
      const cuisineId = Number(data.cuisine);

      // Gửi dữ liệu đăng ký lên backend
      await applyMerchantApi({
        name: data.name,
        cuisineId,
        tagline: data.tagline,
        description: data.description,
        phone: data.phone,
        addressLine: data.addressLine,
        ward: data.ward,
        district: data.district,
        city: data.city,
        baseDeliveryFee: data.baseDeliveryFee,
        minOrderAmount: data.minOrderAmount,
        avgPrepTimeMin: data.avgPrepTime,
        bannerUrl: data.bannerUrl,
        logoUrl: data.logoUrl,
        businessLicenseUrl: data.licenseUrl,
        foodSafetyCertUrl: data.foodSafetyUrl || null,
        bankName: data.bankName,
        bankAccountNo: data.bankAccountNo,
        bankAccountHolder: data.bankAccountHolder,
      });

      pushToast({
        kind: 'success',
        title: 'Đăng ký thành công',
        message: 'Hồ sơ quán của bạn đã được gửi và đang chờ Admin duyệt.',
        duration: 5000,
      });

      // Đồng bộ thông tin phiên làm việc hiện tại của user để nạp vai trò merchant vừa được cấp
      try {
        const { user: me } = await fetchMe();
        if (me) {
          setUser(me);
          setRole(me.primaryRole);
        }
      } catch (err) {
        console.error('Lỗi đồng bộ thông tin phiên đăng nhập:', err);
      }

      nav('/merchant/pending', { replace: true });
    } catch (err) {
      const msg = err.message || '';
      if (msg.includes('Số điện thoại') || msg.includes('phone')) {
        setError('phone', { type: 'manual', message: 'Số điện thoại này đã được một nhà hàng khác sử dụng.' });
        setStepIdx(0); // Quay về step 1
      } else if (msg.includes('Tên quán') || msg.includes('name')) {
        setError('name', { type: 'manual', message: 'Tên quán ăn này đã tồn tại trên hệ thống.' });
        setStepIdx(0); // Quay về step 1
      } else {
        pushToast({
          kind: 'error',
          title: 'Đăng ký thất bại',
          message: msg || 'Số điện thoại hoặc tên quán đã được đăng ký trên hệ thống.',
          duration: 6000,
        });
      }
    } finally {
      setSubmitting(false);
    }
  });

  const formValues = watch();

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
                    onClick={async () => {
                      if (i < stepIdx) {
                        setStepIdx(i);
                      } else if (i === stepIdx) {
                        // Stay
                      } else {
                        // Check validation of intermediate steps
                        let canAdvance = true;
                        for (let j = stepIdx; j < i; j++) {
                          const isValid = await trigger(STEP_FIELDS[STEPS[j].id]);
                          if (!isValid) {
                            canAdvance = false;
                            setStepIdx(j);
                            break;
                          }
                        }
                        if (canAdvance) {
                          setStepIdx(i);
                        }
                      }
                    }}
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
              <Input
                id="name"
                label="Tên quán ăn"
                required
                placeholder="Nhập tên quán ăn của bạn"
                aria-label="Tên quán"
                error={errors.name?.message}
                {...register('name', {
                  required: 'Vui lòng nhập tên quán ăn.',
                  minLength: { value: 3, message: 'Tên quán ăn phải từ 3 đến 160 ký tự.' },
                  maxLength: { value: 160, message: 'Tên quán ăn phải từ 3 đến 160 ký tự.' }
                })}
              />
              <Select
                id="cuisine"
                label="Loại hình ẩm thực"
                required
                aria-label="Loại ẩm thực"
                options={cuisines}
                error={errors.cuisine?.message}
                {...register('cuisine', { required: 'Vui lòng chọn loại hình ẩm thực.' })}
              />
              <Input
                id="phone"
                label="Số điện thoại liên hệ"
                required
                placeholder="Nhập số điện thoại quán"
                aria-label="Số điện thoại"
                inputMode="tel"
                error={errors.phone?.message}
                {...register('phone', {
                  required: 'Vui lòng nhập số điện thoại liên hệ.',
                  pattern: { value: /^\d{9,11}$/, message: 'Số điện thoại không hợp lệ (yêu cầu từ 9 đến 11 chữ số).' }
                })}
              />
              <Input
                id="avgPrepTime"
                label="Thời gian chuẩn bị trung bình (phút)"
                required
                placeholder="Nhập thời gian chuẩn bị"
                aria-label="Thời gian chuẩn bị"
                type="number"
                hint="Hiển thị cho khách trong ETA."
                error={errors.avgPrepTime?.message}
                {...register('avgPrepTime', {
                  valueAsNumber: true,
                  required: 'Vui lòng nhập thời gian chuẩn bị.',
                  min: { value: 1, message: 'Thời gian chuẩn bị phải lớn hơn 0 phút.' }
                })}
              />
              <Input
                id="tagline"
                label="Slogan / Khẩu hiệu quán"
                className="md:col-span-2"
                placeholder="Slogan ngắn (vd: Pizza nướng củi kiểu Neapolitan)"
                aria-label="Slogan"
                error={errors.tagline?.message}
                {...register('tagline', {
                  maxLength: { value: 160, message: 'Slogan không được vượt quá 160 ký tự.' }
                })}
              />
              <Textarea
                id="description"
                label="Giới thiệu về quán"
                className="md:col-span-2"
                placeholder="Giới thiệu quán (tối đa 250 ký tự)"
                rows={4}
                error={errors.description?.message}
                {...register('description', {
                  maxLength: { value: 250, message: 'Giới thiệu quán không được vượt quá 250 ký tự.' }
                })}
              />
              <Input
                id="minOrderAmount"
                label="Giá trị đơn hàng tối thiểu (VND)"
                required
                className="md:col-span-2"
                type="number"
                placeholder="Đơn tối thiểu (VND)"
                aria-label="Đơn tối thiểu"
                error={errors.minOrderAmount?.message}
                {...register('minOrderAmount', {
                  valueAsNumber: true,
                  required: 'Vui lòng nhập giá trị đơn hàng tối thiểu.',
                  min: { value: 0, message: 'Giá trị đơn hàng tối thiểu phải lớn hơn hoặc bằng 0.' }
                })}
              />
            </div>
          )}

          {step.id === 'address' && (
            <div className="grid gap-sm md:grid-cols-2">
              <Input
                id="addressLine"
                label="Số nhà, tên đường"
                required
                className="md:col-span-2"
                placeholder="Số nhà, đường"
                aria-label="Địa chỉ"
                error={errors.addressLine?.message}
                {...register('addressLine', { required: 'Vui lòng nhập số nhà, tên đường.' })}
              />
              <Input
                id="ward"
                label="Phường / Xã"
                placeholder="Phường/Xã"
                aria-label="Phường/Xã"
                error={errors.ward?.message}
                {...register('ward')}
              />
              <Input
                id="district"
                label="Quận / Huyện"
                required
                placeholder="Quận/Huyện"
                aria-label="Quận/Huyện"
                error={errors.district?.message}
                {...register('district', { required: 'Vui lòng nhập quận/huyện.' })}
              />
              <Input
                id="city"
                label="Tỉnh / Thành phố"
                required
                placeholder="Tỉnh/Thành phố"
                aria-label="Tỉnh/Thành phố"
                error={errors.city?.message}
                {...register('city', { required: 'Vui lòng nhập tỉnh/thành phố.' })}
              />
              <Input
                id="baseDeliveryFee"
                label="Phí giao hàng cơ bản (VND)"
                required
                className="md:col-span-2"
                type="number"
                placeholder="Phí giao hàng cơ bản (VND)"
                aria-label="Phí giao hàng cơ bản"
                error={errors.baseDeliveryFee?.message}
                {...register('baseDeliveryFee', {
                  valueAsNumber: true,
                  required: 'Vui lòng nhập phí giao hàng cơ bản.',
                  min: { value: 0, message: 'Phí giao hàng cơ bản phải lớn hơn hoặc bằng 0.' }
                })}
              />
              <div className="md:col-span-2 rounded-md border border-dashed border-hairline-strong bg-canvas-soft p-base text-center">
                <Icon name="pin" size={18} className="mx-auto text-body" />
                <p className="mt-1 text-body-sm text-body">
                  Hệ thống tự động xác định kinh độ & vĩ độ dựa trên thông tin địa chỉ quán của bạn.
                </p>
              </div>
            </div>
          )}

          {step.id === 'docs' && (
            <div className="grid gap-sm md:grid-cols-2">
              <input type="hidden" {...register('logoUrl', { required: 'Vui lòng tải lên ảnh đại diện (logo).' })} />
              <input type="hidden" {...register('bannerUrl', { required: 'Vui lòng tải lên ảnh bìa (banner).' })} />
              <input type="hidden" {...register('licenseUrl', { required: 'Vui lòng tải lên ảnh chụp giấy phép kinh doanh.' })} />
              <input type="hidden" {...register('foodSafetyUrl')} />

              <FileBox
                title="Ảnh đại diện (Logo)"
                required
                hint="Định dạng JPEG, PNG dưới 5 MB."
                file={files.logoFile}
                url={formValues.logoUrl}
                uploading={uploading.logo}
                onChange={(f) => handleFileChange('logo', f)}
                error={errors.logoUrl?.message}
              />
              <FileBox
                title="Ảnh bìa (Banner)"
                required
                hint="Định dạng JPEG, PNG dưới 5 MB."
                file={files.bannerFile}
                url={formValues.bannerUrl}
                uploading={uploading.banner}
                onChange={(f) => handleFileChange('banner', f)}
                error={errors.bannerUrl?.message}
              />
              <FileBox
                title="Giấy phép kinh doanh"
                required
                hint="Ảnh chụp rõ nội dung, dưới 5 MB."
                file={files.licenseFile}
                url={formValues.licenseUrl}
                uploading={uploading.license}
                onChange={(f) => handleFileChange('license', f)}
                error={errors.licenseUrl?.message}
              />
              <FileBox
                title="Chứng nhận VSATTP"
                hint="Tùy chọn. Ảnh chụp rõ nội dung."
                file={files.foodSafetyFile}
                url={formValues.foodSafetyUrl}
                uploading={uploading.foodSafety}
                onChange={(f) => handleFileChange('foodSafety', f)}
                error={errors.foodSafetyUrl?.message}
              />
            </div>
          )}

          {step.id === 'banking' && (
            <div className="grid gap-sm md:grid-cols-2">
              <Select
                id="bankName"
                label="Ngân hàng thụ hưởng"
                required
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
                error={errors.bankName?.message}
                {...register('bankName', { required: 'Vui lòng chọn ngân hàng thụ hưởng.' })}
              />
              <Input
                id="bankAccountNo"
                label="Số tài khoản ngân hàng"
                required
                placeholder="Nhập số tài khoản"
                aria-label="Số tài khoản"
                error={errors.bankAccountNo?.message}
                {...register('bankAccountNo', { required: 'Vui lòng nhập số tài khoản ngân hàng.' })}
              />
              <Input
                id="bankAccountHolder"
                label="Tên chủ tài khoản"
                required
                className="md:col-span-2"
                placeholder="Chủ tài khoản (viết hoa không dấu)"
                aria-label="Chủ tài khoản"
                error={errors.bankAccountHolder?.message}
                {...register('bankAccountHolder', {
                  required: 'Vui lòng nhập tên chủ tài khoản.',
                  pattern: { value: /^[A-Z\s]+$/, message: 'Tên chủ tài khoản phải viết hoa không dấu.' },
                  onChange: (e) => {
                    e.target.value = e.target.value.toUpperCase();
                  }
                })}
              />
              <p className="md:col-span-2 text-caption text-body">
                Tài khoản này sẽ dùng để NomNom chuyển doanh thu sau khi đối soát hằng tuần (xem trang <strong>Ví & Rút tiền</strong>).
              </p>
            </div>
          )}

          {step.id === 'review' && (
            <div className="space-y-sm">
              <ReviewRow label="Tên quán" value={formValues.name || '—'} />
              <ReviewRow label="Loại ẩm thực" value={cuisines.find((c) => c.value === formValues.cuisine)?.label || '—'} />
              <ReviewRow label="Địa chỉ" value={[formValues.addressLine, formValues.ward, formValues.district, formValues.city].filter(Boolean).join(', ') || '—'} />
              <ReviewRow label="Logo" value={formValues.logoUrl ? 'Đã tải lên' : '— (chưa tải)'} />
              <ReviewRow label="Ảnh bìa" value={formValues.bannerUrl ? 'Đã tải lên' : '— (chưa tải)'} />
              <ReviewRow label="Giấy phép kinh doanh" value={formValues.licenseUrl ? 'Đã tải lên' : '— (chưa tải)'} />
              <ReviewRow label="Chứng nhận VSATTP" value={formValues.foodSafetyUrl ? 'Đã tải lên' : 'Chưa cung cấp (Tùy chọn)'} />
              <ReviewRow label="Ngân hàng" value={formValues.bankName} />
              <ReviewRow label="Số tài khoản" value={formValues.bankAccountNo || '—'} />
              <ReviewRow label="Chủ tài khoản" value={formValues.bankAccountHolder || '—'} />
              <p className="text-caption text-body">
                Sau khi gửi, hồ sơ chuyển sang trạng thái <span className="font-semibold text-ink">Chờ duyệt</span>. Bạn có thể theo dõi tiến trình tại trang Chờ duyệt.
              </p>
            </div>
          )}

          <div className="flex flex-col gap-2 border-t border-hairline pt-base md:flex-row md:justify-between">
            <Button variant="secondary" onClick={back} disabled={stepIdx === 0 || submitting}>
              Quay lại
            </Button>
            {stepIdx < STEPS.length - 1 ? (
              <Button onClick={handleNext} trailingIcon="arrowRight">
                Tiếp tục
              </Button>
            ) : (
              <Button onClick={onSubmit} disabled={submitting} trailingIcon="check">
                {submitting ? 'Đang gửi hồ sơ...' : 'Gửi hồ sơ'}
              </Button>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}

function FileBox({ title, hint, file, url, uploading, onChange, error, required }) {
  return (
    <div className="flex flex-col gap-xxs">
      <label className={clsx(
        "relative flex cursor-pointer flex-col items-center justify-center gap-2 rounded-md border border-dashed p-base text-center transition-colors min-h-[150px]",
        error ? "border-error bg-[#fbeaea] hover:bg-[#fae2e2]" : "border-hairline-strong bg-canvas-soft hover:bg-canvas"
      )}>
        {uploading ? (
          <div className="flex flex-col items-center gap-1.5 py-sm">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            <span className="text-caption text-body">Đang tải lên...</span>
          </div>
        ) : url ? (
          <div className="space-y-1.5 py-xs">
            <img src={url} alt={title} className="mx-auto max-h-[80px] rounded object-cover shadow-sm" />
            <span className="block text-caption font-semibold text-ink truncate max-w-[200px]">{file?.name || 'Đã tải lên'}</span>
            <span className="text-caption text-text-link">Thay đổi ảnh</span>
          </div>
        ) : (
          <>
            <Icon name="upload" size={20} className="text-body animate-pulse" />
            <span className="text-body-sm font-medium text-ink">
              {title}
              {required && <span className="text-error ml-1">*</span>}
            </span>
            <span className="text-caption text-body">{hint}</span>
          </>
        )}
        <input
          type="file"
          accept="image/*"
          className="hidden"
          disabled={uploading}
          onChange={(e) => {
            const f = e.target.files?.[0] || null;
            if (f) onChange(f);
          }}
        />
      </label>
      {error && <span className="text-caption text-error">{error}</span>}
    </div>
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
