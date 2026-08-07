import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, useWatch } from 'react-hook-form';
import Input, { Select, Textarea } from '../../components/Input.jsx';
import {
  BANK_OPTIONS,
  OnboardingFileBox,
  OnboardingFormCard,
  OnboardingInfoBanner,
  OnboardingBlocked,
  OnboardingLoading,
  OnboardingProgress,
  OnboardingReviewRow,
  OnboardingShell,
  OnboardingStepHeader,
  OnboardingStepNav,
  OnboardingStepper,
} from '../../components/onboarding/shared.jsx';
import { useApp } from '../../context/AppContext.jsx';
import { applyMerchantApi, fetchMe, fetchCuisinesApi, fetchMerchantRestaurantApi } from '../../lib/api.js';
import { uploadFile } from '../../lib/upload.js';
import {
  isMerchantRestaurantApproved,
  isMerchantRestaurantRejected,
  isMerchantRestaurantUnderReview,
} from '../../lib/merchantStatus.js';

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
  const [checkingRestaurant, setCheckingRestaurant] = useState(true);
  const [applyBlockedReason, setApplyBlockedReason] = useState(null);
  const [isResubmit, setIsResubmit] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    setError,
    clearErrors,
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
  const formValues = useWatch({ control });

  useEffect(() => {
    let active = true;

    async function bootstrap() {
      try {
        const [cuisineRes, merchantRes, meRes] = await Promise.all([
          fetchCuisinesApi().catch(() => null),
          fetchMerchantRestaurantApi().catch(() => null),
          fetchMe().catch(() => null),
        ]);

        if (!active) return;

        if (meRes?.user) {
          setUser(meRes.user);
          setRole(meRes.user.primaryRole);
        }

        const partnerAccess = meRes?.user?.partnerAccess;
        if (partnerAccess && !partnerAccess.canApplyMerchant) {
          setApplyBlockedReason(partnerAccess.merchantApplyBlockReason);
        }

        const list = cuisineRes?.data?.map((c) => ({ value: String(c.id), label: c.name })) ?? [];
        setCuisines(list);

        const restaurant = merchantRes?.restaurant;
        if (restaurant) {
          if (isMerchantRestaurantUnderReview(restaurant.status)) {
            nav('/merchant/pending', { replace: true });
            return;
          }
          if (isMerchantRestaurantApproved(restaurant.status)) {
            nav('/merchant', { replace: true });
            return;
          }

          if (isMerchantRestaurantRejected(restaurant.status)) {
            setIsResubmit(true);
          }

          // rejected / draft / closed — cho phép chỉnh sửa và nộp lại
          setIsResubmit(true);
          setValue('name', restaurant.name ?? '');
          setValue('phone', restaurant.phone ?? '');
          setValue('tagline', restaurant.tagline ?? '');
          setValue('description', restaurant.description ?? '');
          setValue('addressLine', restaurant.address_line ?? '');
          setValue('ward', restaurant.ward ?? '');
          setValue('district', restaurant.district ?? '');
          setValue('city', restaurant.city ?? 'TP. Hồ Chí Minh');
          setValue('baseDeliveryFee', Number(restaurant.base_delivery_fee ?? 25000));
          setValue('minOrderAmount', Number(restaurant.min_order_amount ?? 50000));
          setValue('avgPrepTime', Number(restaurant.avg_prep_time_min ?? 20));
          setValue('logoUrl', restaurant.logo_url ?? '');
          setValue('bannerUrl', restaurant.banner_url ?? '');
          setValue('licenseUrl', restaurant.business_license_url ?? '');
          setValue('foodSafetyUrl', restaurant.food_safety_cert_url ?? '');
          setValue('bankName', restaurant.bank_name ?? 'Vietcombank');
          setValue('bankAccountNo', restaurant.bank_account_no ?? '');
          setValue('bankAccountHolder', restaurant.bank_account_holder ?? '');
          if (restaurant.cuisine_id && list.some((c) => c.value === String(restaurant.cuisine_id))) {
            setValue('cuisine', String(restaurant.cuisine_id));
          } else if (list.length > 0) {
            setValue('cuisine', list[0].value);
          }
        } else if (list.length > 0) {
          setValue('cuisine', list[0].value);
        }
      } catch (err) {
        console.error('Lỗi khởi tạo đăng ký quán:', err);
      } finally {
        if (active) setCheckingRestaurant(false);
      }
    }

    bootstrap();
    return () => {
      active = false;
    };
  }, [nav, setRole, setUser, setValue]);

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

  if (checkingRestaurant) {
    return <OnboardingLoading message="Đang kiểm tra hồ sơ quán…" />;
  }

  if (applyBlockedReason) {
    return (
      <OnboardingBlocked
        title="Không thể đăng ký quán"
        message={applyBlockedReason}
        backHref="/app"
        backLabel="Về trang đặt món"
      />
    );
  }

  const back = () => setStepIdx((i) => Math.max(i - 1, 0));

  const goToStep = async (targetIdx) => {
    if (targetIdx < stepIdx) {
      setStepIdx(targetIdx);
      return;
    }
    if (targetIdx === stepIdx) return;

    for (let j = stepIdx; j < targetIdx; j++) {
      const isValid = await trigger(STEP_FIELDS[STEPS[j].id]);
      if (!isValid) {
        setStepIdx(j);
        return;
      }
    }
    setStepIdx(targetIdx);
  };

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
      if (msg.includes('đang chờ xét duyệt')) {
        pushToast({
          kind: 'warning',
          title: 'Hồ sơ đang chờ duyệt',
          message: 'Bạn không thể gửi thêm hồ sơ mới khi đơn đang được xem xét.',
          duration: 5000,
        });
        nav('/merchant/pending', { replace: true });
        return;
      }
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

  return (
    <OnboardingShell
      eyebrow="Đối tác NomNom"
      title={isResubmit ? 'Cập nhật hồ sơ quán' : 'Đăng ký quán ăn'}
      subtitle={
        isResubmit
          ? 'Chỉnh sửa thông tin theo phản hồi từ NomNom và gửi lại hồ sơ để được xét duyệt.'
          : 'Hoàn tất 5 bước để hồ sơ quán được xét duyệt. Bạn có thể quay lại sửa trước khi gửi.'
      }
    >
      <OnboardingProgress stepIdx={stepIdx} totalSteps={STEPS.length} />
      <OnboardingStepper steps={STEPS} stepIdx={stepIdx} onStepClick={goToStep} />

      <OnboardingFormCard>
        <OnboardingStepHeader label={step.label} stepIdx={stepIdx} totalSteps={STEPS.length} />

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
              <div className="md:col-span-2">
                <OnboardingInfoBanner>
                  Hệ thống tự động xác định kinh độ & vĩ độ dựa trên thông tin địa chỉ quán của bạn.
                </OnboardingInfoBanner>
              </div>
            </div>
          )}

          {step.id === 'docs' && (
            <div className="grid gap-sm md:grid-cols-2">
              <input type="hidden" {...register('logoUrl', { required: 'Vui lòng tải lên ảnh đại diện (logo).' })} />
              <input type="hidden" {...register('bannerUrl', { required: 'Vui lòng tải lên ảnh bìa (banner).' })} />
              <input type="hidden" {...register('licenseUrl', { required: 'Vui lòng tải lên ảnh chụp giấy phép kinh doanh.' })} />
              <input type="hidden" {...register('foodSafetyUrl')} />

              <OnboardingFileBox
                title="Ảnh đại diện (Logo)"
                required
                hint="Định dạng JPEG, PNG dưới 5 MB."
                file={files.logoFile}
                url={formValues.logoUrl}
                uploading={uploading.logo}
                onChange={(f) => handleFileChange('logo', f)}
                error={errors.logoUrl?.message}
              />
              <OnboardingFileBox
                title="Ảnh bìa (Banner)"
                required
                hint="Định dạng JPEG, PNG dưới 5 MB."
                file={files.bannerFile}
                url={formValues.bannerUrl}
                uploading={uploading.banner}
                onChange={(f) => handleFileChange('banner', f)}
                error={errors.bannerUrl?.message}
              />
              <OnboardingFileBox
                title="Giấy phép kinh doanh"
                required
                hint="Ảnh chụp rõ nội dung, dưới 5 MB."
                file={files.licenseFile}
                url={formValues.licenseUrl}
                uploading={uploading.license}
                onChange={(f) => handleFileChange('license', f)}
                error={errors.licenseUrl?.message}
              />
              <OnboardingFileBox
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
                options={BANK_OPTIONS}
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
              <OnboardingReviewRow label="Tên quán" value={formValues.name || '—'} />
              <OnboardingReviewRow label="Loại ẩm thực" value={cuisines.find((c) => c.value === formValues.cuisine)?.label || '—'} />
              <OnboardingReviewRow label="Địa chỉ" value={[formValues.addressLine, formValues.ward, formValues.district, formValues.city].filter(Boolean).join(', ') || '—'} />
              <OnboardingReviewRow label="Logo" value={formValues.logoUrl ? 'Đã tải lên' : '— (chưa tải)'} />
              <OnboardingReviewRow label="Ảnh bìa" value={formValues.bannerUrl ? 'Đã tải lên' : '— (chưa tải)'} />
              <OnboardingReviewRow label="Giấy phép kinh doanh" value={formValues.licenseUrl ? 'Đã tải lên' : '— (chưa tải)'} />
              <OnboardingReviewRow label="Chứng nhận VSATTP" value={formValues.foodSafetyUrl ? 'Đã tải lên' : 'Chưa cung cấp (Tùy chọn)'} />
              <OnboardingReviewRow label="Ngân hàng" value={formValues.bankName} />
              <OnboardingReviewRow label="Số tài khoản" value={formValues.bankAccountNo || '—'} />
              <OnboardingReviewRow label="Chủ tài khoản" value={formValues.bankAccountHolder || '—'} />
              <p className="text-caption text-body">
                Sau khi gửi, hồ sơ chuyển sang trạng thái <span className="font-semibold text-ink">Chờ duyệt</span>. Bạn có thể theo dõi tiến trình tại trang Chờ duyệt.
              </p>
            </div>
          )}

          <OnboardingStepNav
            stepIdx={stepIdx}
            totalSteps={STEPS.length}
            onBack={back}
            onNext={handleNext}
            onSubmit={onSubmit}
            submitting={submitting}
          />
      </OnboardingFormCard>
    </OnboardingShell>
  );
}
