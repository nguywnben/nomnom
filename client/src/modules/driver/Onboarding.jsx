import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../../components/Button.jsx';
import Card from '../../components/Card.jsx';
import Icon from '../../components/Icon.jsx';
import Input, { Select } from '../../components/Input.jsx';
import { useApp } from '../../context/AppContext.jsx';
import { applyDriverProfile, fetchDriverProfile, updateDriverProfile, uploadImageApi } from '../../lib/api.js';

// Đăng ký tài xế — gom các trường KYC khớp `driver_profiles`:
// national_id, driver_license_no, vehicle_type, vehicle_model, license_plate,
// id_card_url, driver_license_url, portrait_url, bank_*.
const STEPS = ['Cá nhân', 'Phương tiện', 'Giấy tờ', 'Ngân hàng', 'Xác nhận'];

export default function DriverOnboarding() {
  const nav = useNavigate();
  const { pushToast, grantCurrentUserRole } = useApp();
  const [step, setStep] = useState(0);
  const [profileState, setProfileState] = useState('loading');
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    nationalId: '',
    driverLicenseNo: '',
    vehicleType: 'motorbike',
    vehicleModel: '',
    licensePlate: '',
    idCardFile: null,
    licenseFile: null,
    portraitFile: null,
    bankName: 'Vietcombank',
    bankAccountNo: '',
    bankAccountHolder: '',
  });
  const set = (patch) => setForm((cur) => ({ ...cur, ...patch }));

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await fetchDriverProfile();
        if (cancelled) return;
        setProfileState(data.approval_status ?? 'none');
        if (data.profile) {
          setForm((cur) => ({
            ...cur,
            nationalId: data.profile.nationalId ?? cur.nationalId,
            driverLicenseNo: data.profile.driverLicenseNo ?? cur.driverLicenseNo,
            vehicleType: data.profile.vehicleType ?? cur.vehicleType,
            vehicleModel: data.profile.vehicleModel ?? cur.vehicleModel,
            licensePlate: data.profile.licensePlate ?? cur.licensePlate,
            bankAccountNo: data.profile.bankAccountNo ?? cur.bankAccountNo,
            bankName: data.profile.bankName ?? cur.bankName,
            bankAccountHolder: data.profile.bankAccountHolder ?? cur.bankAccountHolder,
          }));
        }
        if (data.approval_status === 'pending' || data.approval_status === 'approved') {
          nav('/driver/pending', { replace: true });
        }
      } catch {
        if (!cancelled) setProfileState('none');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [nav]);

  const submit = async () => {
    if (!form.idCardFile || !form.licenseFile || !form.portraitFile) {
      pushToast({ kind: 'error', title: 'Thiếu ảnh bắt buộc', message: 'Vui lòng tải lên CCCD/CMND, bằng lái và ảnh chân dung.' });
      return;
    }

    setSubmitting(true);
    try {
      const [idCard, driverLicense, portrait] = await Promise.all([
        uploadImageApi(form.idCardFile, 'driver-kyc'),
        form.licenseFile ? uploadImageApi(form.licenseFile, 'driver-kyc') : Promise.resolve({ url: '' }),
        uploadImageApi(form.portraitFile, 'driver-kyc'),
      ]);

      const payload = {
        nationalId: form.nationalId.trim(),
        driverLicenseNo: form.driverLicenseNo.trim(),
        vehicleType: form.vehicleType,
        vehicleModel: form.vehicleModel.trim(),
        licensePlate: form.licensePlate.trim(),
        idCardUrl: idCard.url,
        driverLicenseUrl: driverLicense.url || '',
        portraitUrl: portrait.url,
        bankAccountNo: form.bankAccountNo.trim(),
        bankName: form.bankName.trim(),
        bankAccountHolder: form.bankAccountHolder.trim(),
      };

      const action = profileState === 'rejected' ? updateDriverProfile : applyDriverProfile;
      const data = await action(payload);
      grantCurrentUserRole('driver');

      pushToast({
        kind: 'success',
        title: profileState === 'rejected' ? 'Đã gửi lại hồ sơ tài xế' : 'Đã gửi hồ sơ tài xế',
        message: 'NomNom sẽ xem xét trong 24-48 giờ và liên hệ qua điện thoại.',
      });
      nav('/driver/pending', { replace: true, state: { approvalStatus: data.approval_status ?? 'pending' } });
    } catch (err) {
      pushToast({ kind: 'error', title: 'Không thể gửi hồ sơ', message: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="px-base py-base">
      <div className="mb-base">
        <div className="text-caption-uppercase text-body">Tài xế</div>
        <h1 className="text-display-md text-ink">Đăng ký tài xế</h1>
        <p className="mt-xs text-body-sm text-body">Cập nhật giấy tờ để đối tác NomNom xét duyệt — mất khoảng 5 phút.</p>
      </div>

      {/* Stepper */}
      <ol className="mb-base flex items-center gap-2 overflow-x-auto no-scrollbar">
        {STEPS.map((s, i) => {
          const done = i < step;
          const cur = i === step;
          return (
            <li key={s} className="flex shrink-0 items-center gap-2">
              <button
                onClick={() => i <= step && setStep(i)}
                className={
                  'inline-flex items-center gap-1.5 rounded-pill border px-3 py-1.5 text-caption ' +
                  (cur ? 'border-ink bg-primary text-on-primary' : done ? 'border-hairline-strong bg-canvas-soft text-ink' : 'border-hairline-strong bg-surface-card text-body')
                }
              >
                <span className="nums">{i + 1}.</span> {s}
              </button>
              {i < STEPS.length - 1 && <span className="h-px w-4 bg-hairline-strong" aria-hidden />}
            </li>
          );
        })}
      </ol>

      <Card padded className="space-y-base">
        {step === 0 && (
          <div className="grid gap-sm">
            <Input placeholder="Số CCCD" value={form.nationalId} onChange={(e) => set({ nationalId: e.target.value })} inputMode="numeric" required />
            <Input placeholder="Số bằng lái" value={form.driverLicenseNo} onChange={(e) => set({ driverLicenseNo: e.target.value })} />
          </div>
        )}

        {step === 1 && (
          <div className="grid gap-sm">
            <Select
              aria-label="Loại phương tiện"
              options={[
                { value: 'motorbike', label: 'Xe máy' },
                { value: 'bicycle', label: 'Xe đạp' },
                { value: 'car', label: 'Ô tô' },
              ]}
              value={form.vehicleType}
              onChange={(e) => set({ vehicleType: e.target.value })}
            />
            <Input placeholder="Hãng & mẫu xe (vd: Honda Wave Alpha)" value={form.vehicleModel} onChange={(e) => set({ vehicleModel: e.target.value })} />
            <Input placeholder="Biển số xe" value={form.licensePlate} onChange={(e) => set({ licensePlate: e.target.value })} />
            <p className="text-caption text-body">Biển số sẽ hiển thị cho khách hàng để xác nhận khi tài xế đến lấy hàng.</p>
          </div>
        )}

        {step === 2 && (
          <div className="grid gap-sm">
            <FileBox title="CCCD/CMND (mặt trước)" file={form.idCardFile} onChange={(f) => set({ idCardFile: f })} hint="Ảnh rõ nét, chụp đủ 4 góc." />
            <FileBox title="Bằng lái xe" file={form.licenseFile} onChange={(f) => set({ licenseFile: f })} hint="Bắt buộc với ô tô / xe máy." />
            <FileBox title="Ảnh chân dung" file={form.portraitFile} onChange={(f) => set({ portraitFile: f })} hint="Ảnh nửa người, ánh sáng tự nhiên." />
          </div>
        )}

        {step === 3 && (
          <div className="grid gap-sm">
            <Select
              aria-label="Ngân hàng"
              options={['Vietcombank', 'Techcombank', 'BIDV', 'VietinBank', 'ACB', 'MB Bank', 'TPBank'].map((b) => ({ value: b, label: b }))}
              value={form.bankName}
              onChange={(e) => set({ bankName: e.target.value })}
            />
            <Input placeholder="Số tài khoản" value={form.bankAccountNo} onChange={(e) => set({ bankAccountNo: e.target.value })} />
            <Input placeholder="Chủ tài khoản (không dấu)" value={form.bankAccountHolder} onChange={(e) => set({ bankAccountHolder: e.target.value })} />
            <p className="text-caption text-body">Tiền chuyến và rút ví sẽ chuyển về tài khoản này.</p>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-sm">
            <Row label="CCCD" value={form.nationalId} />
            <Row label="Bằng lái" value={form.driverLicenseNo || '—'} />
            <Row label="Phương tiện" value={`${form.vehicleType} · ${form.vehicleModel || '—'} · ${form.licensePlate || '—'}`} />
            <Row label="Giấy tờ" value={[
              form.idCardFile && 'CCCD',
              form.licenseFile && 'Bằng lái',
              form.portraitFile && 'Chân dung',
            ].filter(Boolean).join(' · ') || '—'} />
            <Row label="Ngân hàng" value={`${form.bankName} · ${form.bankAccountNo || '—'}`} />
            <p className="text-caption text-body">
              Sau khi gửi, hồ sơ chuyển sang trạng thái <span className="font-medium text-ink">Chờ duyệt</span>.
            </p>
          </div>
        )}

        <div className="flex flex-col gap-2 border-t border-hairline pt-base md:flex-row md:justify-between">
          <Button variant="secondary" onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0}>
            Quay lại
          </Button>
          {step < STEPS.length - 1 ? (
            <Button trailingIcon="arrowRight" onClick={() => setStep((s) => Math.min(STEPS.length - 1, s + 1))}>
              Tiếp tục
            </Button>
          ) : (
            <Button trailingIcon="check" onClick={submit} disabled={submitting}>
              {submitting ? 'Đang gửi…' : profileState === 'rejected' ? 'Gửi lại hồ sơ' : 'Gửi hồ sơ'}
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
}

function FileBox({ title, hint, file, onChange }) {
  return (
    <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-md border border-dashed border-hairline-strong bg-canvas-soft p-base text-center hover:bg-canvas">
      <Icon name="upload" size={20} className="text-body" />
      <span className="text-body-sm font-medium text-ink">{title}</span>
      <span className="text-caption text-body">{hint}</span>
      {file && <span className="text-caption text-text-link">{file.name}</span>}
      <input type="file" accept="image/*" className="hidden" onChange={(e) => onChange(e.target.files?.[0] || null)} />
    </label>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex items-start justify-between gap-base border-b border-hairline pb-2 last:border-0">
      <span className="text-caption-uppercase text-body">{label}</span>
      <span className="text-body-sm text-ink text-right">{value}</span>
    </div>
  );
}
