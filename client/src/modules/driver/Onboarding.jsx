import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import Input, { Select } from '../../components/Input.jsx';
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
  VEHICLE_TYPE_OPTIONS,
  vehicleTypeLabel,
} from '../../components/onboarding/shared.jsx';
import { useApp } from '../../context/AppContext.jsx';
import { applyDriverProfile, fetchDriverProfile, fetchMe, updateDriverProfile } from '../../lib/api.js';
import { uploadFile } from '../../lib/upload.js';

const STEPS = [
  { id: 'personal', label: 'Cá nhân', icon: 'user' },
  { id: 'vehicle', label: 'Phương tiện', icon: 'bike' },
  { id: 'docs', label: 'Giấy tờ', icon: 'shield' },
  { id: 'banking', label: 'Ngân hàng', icon: 'wallet' },
  { id: 'review', label: 'Xác nhận', icon: 'check' },
];

const STEP_FIELDS = {
  personal: ['nationalId', 'driverLicenseNo'],
  vehicle: ['vehicleType', 'vehicleModel', 'licensePlate'],
  docs: ['idCardUrl', 'driverLicenseUrl', 'portraitUrl'],
  banking: ['bankName', 'bankAccountNo', 'bankAccountHolder'],
  review: [],
};

const DOC_UPLOAD_KEYS = {
  idCard: { urlField: 'idCardUrl', fileKey: 'idCardFile', title: 'CCCD/CMND' },
  driverLicense: { urlField: 'driverLicenseUrl', fileKey: 'driverLicenseFile', title: 'Bằng lái' },
  portrait: { urlField: 'portraitUrl', fileKey: 'portraitFile', title: 'Ảnh chân dung' },
};

export default function DriverOnboarding() {
  const nav = useNavigate();
  const { pushToast, grantCurrentUserRole, setUser } = useApp();
  const [stepIdx, setStepIdx] = useState(0);
  const [checkingProfile, setCheckingProfile] = useState(true);
  const [applyBlockedReason, setApplyBlockedReason] = useState(null);
  const [isResubmit, setIsResubmit] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    clearErrors,
    watch,
    trigger,
    formState: { errors },
  } = useForm({
    defaultValues: {
      nationalId: '',
      driverLicenseNo: '',
      vehicleType: 'motorbike',
      vehicleModel: '',
      licensePlate: '',
      idCardUrl: '',
      driverLicenseUrl: '',
      portraitUrl: '',
      bankName: 'Vietcombank',
      bankAccountNo: '',
      bankAccountHolder: '',
    },
    mode: 'onTouched',
  });

  const [files, setFiles] = useState({
    idCardFile: null,
    driverLicenseFile: null,
    portraitFile: null,
  });

  const [uploading, setUploading] = useState({
    idCard: false,
    driverLicense: false,
    portrait: false,
  });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [data, meRes] = await Promise.all([
          fetchDriverProfile(),
          fetchMe().catch(() => null),
        ]);
        if (cancelled) return;

        if (meRes?.user) {
          setUser(meRes.user);
        }

        const status = data.approval_status ?? 'none';
        const partnerAccess = meRes?.user?.partnerAccess;

        if (status === 'pending' || status === 'approved') {
          nav('/driver/pending', { replace: true });
          return;
        }

        if (status === 'rejected') {
          setIsResubmit(true);
        } else if (partnerAccess && !partnerAccess.canApplyDriver) {
          setApplyBlockedReason(partnerAccess.driverApplyBlockReason);
        }

        const profile = data.profile;
        if (profile) {
          setValue('nationalId', profile.nationalId ?? '');
          setValue('driverLicenseNo', profile.driverLicenseNo ?? '');
          setValue('vehicleType', profile.vehicleType ?? 'motorbike');
          setValue('vehicleModel', profile.vehicleModel ?? '');
          setValue('licensePlate', profile.licensePlate ?? '');
          setValue('idCardUrl', profile.idCardUrl ?? '');
          setValue('driverLicenseUrl', profile.driverLicenseUrl ?? '');
          setValue('portraitUrl', profile.portraitUrl ?? '');
          setValue('bankAccountNo', profile.bankAccountNo ?? '');
          setValue('bankName', profile.bankName ?? 'Vietcombank');
          setValue('bankAccountHolder', profile.bankAccountHolder ?? '');
        }
      } catch {
        // Chưa có hồ sơ — cho phép đăng ký mới
      } finally {
        if (!cancelled) setCheckingProfile(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [nav, setUser, setValue]);

  const step = STEPS[stepIdx];
  const formValues = watch();

  const handleFileChange = async (key, file) => {
    const meta = DOC_UPLOAD_KEYS[key];
    if (!file || !meta) return;

    setUploading((prev) => ({ ...prev, [key]: true }));
    try {
      const { url } = await uploadFile(file, 'driver-kyc');
      setFiles((prev) => ({ ...prev, [meta.fileKey]: file }));
      setValue(meta.urlField, url, { shouldValidate: true });
      clearErrors(meta.urlField);
      pushToast({
        kind: 'success',
        title: 'Tải ảnh thành công',
        message: `Đã cập nhật ${meta.title}.`,
        duration: 2800,
      });
    } catch (err) {
      pushToast({
        kind: 'error',
        title: 'Lỗi tải ảnh',
        message: err.message || 'Mạng lỗi hoặc kích thước tệp quá lớn.',
        duration: 4500,
      });
    } finally {
      setUploading((prev) => ({ ...prev, [key]: false }));
    }
  };

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

  const handleNext = async () => {
    const isValid = await trigger(STEP_FIELDS[step.id]);
    if (isValid) {
      setStepIdx((i) => Math.min(i + 1, STEPS.length - 1));
    }
  };

  const onSubmit = handleSubmit(async (data) => {
    setSubmitting(true);
    try {
      const payload = {
        nationalId: data.nationalId.trim(),
        driverLicenseNo: data.driverLicenseNo.trim(),
        vehicleType: data.vehicleType,
        vehicleModel: data.vehicleModel.trim(),
        licensePlate: data.licensePlate.trim(),
        idCardUrl: data.idCardUrl.trim(),
        driverLicenseUrl: data.driverLicenseUrl.trim(),
        portraitUrl: data.portraitUrl.trim(),
        bankAccountNo: data.bankAccountNo.trim(),
        bankName: data.bankName.trim(),
        bankAccountHolder: data.bankAccountHolder.trim(),
      };

      const action = isResubmit ? updateDriverProfile : applyDriverProfile;
      const result = await action(payload);
      grantCurrentUserRole('driver');

      pushToast({
        kind: 'success',
        title: isResubmit ? 'Đã gửi lại hồ sơ tài xế' : 'Đã gửi hồ sơ tài xế',
        message: 'NomNom sẽ xem xét trong 24–48 giờ và liên hệ qua số điện thoại đã đăng ký.',
        duration: 5000,
      });
      nav('/driver/pending', { replace: true, state: { approvalStatus: result.approval_status ?? 'pending' } });
    } catch (err) {
      pushToast({
        kind: 'error',
        title: 'Không thể gửi hồ sơ',
        message: err.message ?? 'Vui lòng kiểm tra lại thông tin và thử lại.',
        duration: 5500,
      });
    } finally {
      setSubmitting(false);
    }
  });

  if (checkingProfile) {
    return <OnboardingLoading message="Đang kiểm tra hồ sơ tài xế…" />;
  }

  if (applyBlockedReason) {
    return (
      <OnboardingBlocked
        title="Không thể đăng ký tài xế"
        message={applyBlockedReason}
        backHref="/app"
        backLabel="Về trang đặt món"
      />
    );
  }

  return (
    <OnboardingShell
      eyebrow="Đối tác NomNom"
      title={isResubmit ? 'Cập nhật hồ sơ tài xế' : 'Đăng ký tài xế'}
      subtitle={
        isResubmit
          ? 'Chỉnh sửa thông tin theo phản hồi từ NomNom và gửi lại hồ sơ để được xét duyệt.'
          : 'Hoàn tất 5 bước để hồ sơ tài xế được xét duyệt. Bạn có thể quay lại sửa trước khi gửi.'
      }
    >
      <OnboardingProgress stepIdx={stepIdx} totalSteps={STEPS.length} />
      <OnboardingStepper steps={STEPS} stepIdx={stepIdx} onStepClick={goToStep} />

      <OnboardingFormCard>
        <OnboardingStepHeader label={step.label} stepIdx={stepIdx} totalSteps={STEPS.length} />

        {step.id === 'personal' && (
          <div className="grid gap-sm md:grid-cols-2">
            <Input
              id="nationalId"
              label="Số CCCD / CMND"
              required
              placeholder="Nhập số căn cước"
              inputMode="numeric"
              error={errors.nationalId?.message}
              {...register('nationalId', {
                required: 'Vui lòng nhập số CCCD/CMND.',
                pattern: { value: /^\d{9,12}$/, message: 'Số CCCD/CMND phải từ 9 đến 12 chữ số.' },
              })}
            />
            <Input
              id="driverLicenseNo"
              label="Số bằng lái"
              required
              placeholder="Nhập số bằng lái"
              error={errors.driverLicenseNo?.message}
              {...register('driverLicenseNo', {
                required: 'Vui lòng nhập số bằng lái.',
                minLength: { value: 5, message: 'Số bằng lái không hợp lệ.' },
              })}
            />
            <p className="md:col-span-2 text-caption text-body">
              Thông tin phải trùng khớp với giấy tờ bạn tải lên ở bước tiếp theo.
            </p>
          </div>
        )}

        {step.id === 'vehicle' && (
          <div className="grid gap-sm md:grid-cols-2">
            <Select
              id="vehicleType"
              label="Loại phương tiện"
              required
              options={VEHICLE_TYPE_OPTIONS}
              error={errors.vehicleType?.message}
              {...register('vehicleType', { required: 'Vui lòng chọn loại phương tiện.' })}
            />
            <Input
              id="vehicleModel"
              label="Hãng & mẫu xe"
              required
              placeholder="vd: Honda Wave Alpha"
              error={errors.vehicleModel?.message}
              {...register('vehicleModel', {
                required: 'Vui lòng nhập hãng và mẫu xe.',
                minLength: { value: 2, message: 'Hãng & mẫu xe quá ngắn.' },
              })}
            />
            <Input
              id="licensePlate"
              label="Biển số xe"
              required
              className="md:col-span-2"
              placeholder="vd: 59A1-123.45"
              error={errors.licensePlate?.message}
              {...register('licensePlate', {
                required: 'Vui lòng nhập biển số xe.',
                minLength: { value: 4, message: 'Biển số xe không hợp lệ.' },
              })}
            />
            <div className="md:col-span-2">
              <OnboardingInfoBanner icon="bike">
                Biển số hiển thị cho khách hàng để xác nhận khi bạn đến lấy hàng.
              </OnboardingInfoBanner>
            </div>
          </div>
        )}

        {step.id === 'docs' && (
          <div className="grid gap-sm md:grid-cols-2">
            <input type="hidden" {...register('idCardUrl', { required: 'Vui lòng tải ảnh CCCD/CMND.' })} />
            <input type="hidden" {...register('driverLicenseUrl', { required: 'Vui lòng tải ảnh bằng lái.' })} />
            <input type="hidden" {...register('portraitUrl', { required: 'Vui lòng tải ảnh chân dung.' })} />

            <OnboardingFileBox
              title="CCCD/CMND (mặt trước)"
              required
              hint="Ảnh rõ nét, chụp đủ 4 góc. JPEG/PNG dưới 5 MB."
              file={files.idCardFile}
              url={formValues.idCardUrl}
              uploading={uploading.idCard}
              onChange={(f) => handleFileChange('idCard', f)}
              error={errors.idCardUrl?.message}
            />
            <OnboardingFileBox
              title="Bằng lái xe"
              required
              hint="Bắt buộc với xe máy và ô tô."
              file={files.driverLicenseFile}
              url={formValues.driverLicenseUrl}
              uploading={uploading.driverLicense}
              onChange={(f) => handleFileChange('driverLicense', f)}
              error={errors.driverLicenseUrl?.message}
            />
            <OnboardingFileBox
              title="Ảnh chân dung"
              required
              hint="Ảnh nửa người, ánh sáng tự nhiên."
              file={files.portraitFile}
              url={formValues.portraitUrl}
              uploading={uploading.portrait}
              onChange={(f) => handleFileChange('portrait', f)}
              error={errors.portraitUrl?.message}
            />
          </div>
        )}

        {step.id === 'banking' && (
          <div className="grid gap-sm md:grid-cols-2">
            <Select
              id="bankName"
              label="Ngân hàng thụ hưởng"
              required
              options={BANK_OPTIONS}
              error={errors.bankName?.message}
              {...register('bankName', { required: 'Vui lòng chọn ngân hàng.' })}
            />
            <Input
              id="bankAccountNo"
              label="Số tài khoản"
              required
              placeholder="Nhập số tài khoản"
              error={errors.bankAccountNo?.message}
              {...register('bankAccountNo', {
                required: 'Vui lòng nhập số tài khoản.',
                pattern: { value: /^\d{6,20}$/, message: 'Số tài khoản phải từ 6 đến 20 chữ số.' },
              })}
            />
            <Input
              id="bankAccountHolder"
              label="Chủ tài khoản"
              required
              className="md:col-span-2"
              placeholder="VIET HOA KHONG DAU"
              error={errors.bankAccountHolder?.message}
              {...register('bankAccountHolder', {
                required: 'Vui lòng nhập tên chủ tài khoản.',
                pattern: { value: /^[A-Z\s]+$/, message: 'Tên chủ tài khoản phải viết hoa không dấu.' },
                onChange: (e) => {
                  e.target.value = e.target.value.toUpperCase();
                },
              })}
            />
            <p className="md:col-span-2 text-caption text-body">
              Tiền chuyến và rút ví sẽ chuyển về tài khoản này sau khi hoàn thành giao hàng.
            </p>
          </div>
        )}

        {step.id === 'review' && (
          <div className="space-y-sm">
            <OnboardingReviewRow label="CCCD/CMND" value={formValues.nationalId || '—'} />
            <OnboardingReviewRow label="Bằng lái" value={formValues.driverLicenseNo || '—'} />
            <OnboardingReviewRow
              label="Phương tiện"
              value={`${vehicleTypeLabel(formValues.vehicleType)} · ${formValues.vehicleModel || '—'} · ${formValues.licensePlate || '—'}`}
            />
            <OnboardingReviewRow label="CCCD (ảnh)" value={formValues.idCardUrl ? 'Đã tải lên' : '— (chưa tải)'} />
            <OnboardingReviewRow label="Bằng lái (ảnh)" value={formValues.driverLicenseUrl ? 'Đã tải lên' : '— (chưa tải)'} />
            <OnboardingReviewRow label="Chân dung" value={formValues.portraitUrl ? 'Đã tải lên' : '— (chưa tải)'} />
            <OnboardingReviewRow label="Ngân hàng" value={formValues.bankName} />
            <OnboardingReviewRow label="Số tài khoản" value={formValues.bankAccountNo || '—'} />
            <OnboardingReviewRow label="Chủ tài khoản" value={formValues.bankAccountHolder || '—'} />
            <p className="text-caption text-body">
              Sau khi gửi, hồ sơ chuyển sang trạng thái{' '}
              <span className="font-semibold text-ink">Chờ duyệt</span>. Bạn có thể theo dõi tại trang Chờ duyệt.
            </p>
          </div>
        )}

        <OnboardingStepNav
          stepIdx={stepIdx}
          totalSteps={STEPS.length}
          onBack={() => setStepIdx((i) => Math.max(i - 1, 0))}
          onNext={handleNext}
          onSubmit={onSubmit}
          submitting={submitting}
          submitLabel={isResubmit ? 'Gửi lại hồ sơ' : 'Gửi hồ sơ'}
        />
      </OnboardingFormCard>
    </OnboardingShell>
  );
}
