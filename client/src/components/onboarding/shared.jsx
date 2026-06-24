import clsx from 'clsx';
import { Link } from 'react-router-dom';
import Button from '../Button.jsx';
import Card from '../Card.jsx';
import Icon from '../Icon.jsx';

export const BANK_OPTIONS = [
  'Vietcombank',
  'Techcombank',
  'BIDV',
  'VietinBank',
  'ACB',
  'MB Bank',
  'TPBank',
  'VPBank',
  'Sacombank',
].map((b) => ({ value: b, label: b }));

export const VEHICLE_TYPE_OPTIONS = [
  { value: 'motorbike', label: 'Xe máy' },
  { value: 'bicycle', label: 'Xe đạp' },
  { value: 'car', label: 'Ô tô' },
];

export function vehicleTypeLabel(value) {
  return VEHICLE_TYPE_OPTIONS.find((o) => o.value === value)?.label ?? value;
}

export function OnboardingLoading({ message }) {
  return (
    <div className="container-page flex min-h-[60vh] flex-col items-center justify-center py-xl">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      <p className="mt-base animate-pulse text-body-md font-medium text-body">{message}</p>
    </div>
  );
}

export function OnboardingShell({ eyebrow, title, subtitle, backHref = '/', children }) {
  return (
    <div className="min-h-screen bg-canvas">
      <div className="container-page py-xl">
        <div className="mx-auto max-w-3xl">
          <Link
            to={backHref}
            className="mb-base inline-flex items-center gap-1 text-body-sm text-body transition-colors hover:text-ink"
          >
            <Icon name="chevronLeft" size={16} />
            Về trang chủ
          </Link>
          <div className="mb-base">
            <div className="text-caption-uppercase text-body">{eyebrow}</div>
            <h1 className="text-display-md text-ink md:text-display-lg">{title}</h1>
            {subtitle ? <p className="mt-xs text-body-md text-body">{subtitle}</p> : null}
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}

export function OnboardingProgress({ stepIdx, totalSteps }) {
  const progress = Math.round(((stepIdx + 1) / totalSteps) * 100);
  return (
    <div className="mb-base">
      <div className="mb-1 flex items-center justify-between text-caption text-body">
        <span>Tiến độ hồ sơ</span>
        <span className="nums font-medium text-ink">
          {stepIdx + 1}/{totalSteps} · {progress}%
        </span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-pill bg-canvas-soft">
        <div
          className="h-full rounded-pill bg-primary transition-[width] duration-300 ease-out"
          style={{ width: `${progress}%` }}
          role="progressbar"
          aria-valuenow={progress}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>
    </div>
  );
}

export function OnboardingStepper({ steps, stepIdx, onStepClick }) {
  return (
    <div className="mb-base overflow-x-auto no-scrollbar">
      <ol className="flex min-w-max items-center gap-2">
        {steps.map((s, i) => {
          const done = i < stepIdx;
          const current = i === stepIdx;
          return (
            <li key={s.id} className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onStepClick(i)}
                className={clsx(
                  'inline-flex items-center gap-1.5 rounded-pill border px-3 py-1.5 text-caption transition-colors',
                  current && 'border-ink bg-primary text-on-primary',
                  !current && done && 'border-hairline-strong bg-canvas-soft text-ink',
                  !current && !done && 'border-hairline-strong bg-surface-card text-body',
                )}
              >
                <Icon name={done ? 'check' : s.icon} size={12} />
                {i + 1}. {s.label}
              </button>
              {i < steps.length - 1 && <span className="h-px w-6 bg-hairline-strong" aria-hidden />}
            </li>
          );
        })}
      </ol>
    </div>
  );
}

export function OnboardingStepHeader({ label, stepIdx, totalSteps }) {
  return (
    <div>
      <h2 className="text-display-sm text-ink">{label}</h2>
      <p className="text-body-sm text-body">
        Bước {stepIdx + 1} trên {totalSteps}
      </p>
    </div>
  );
}

export function OnboardingFormCard({ children }) {
  return <Card padded className="space-y-base">{children}</Card>;
}

export function OnboardingFileBox({ title, hint, file, url, uploading, onChange, error, required }) {
  return (
    <div className="flex flex-col gap-xxs">
      <label
        className={clsx(
          'relative flex min-h-[150px] cursor-pointer flex-col items-center justify-center gap-2 rounded-md border border-dashed p-base text-center transition-colors',
          error ? 'border-error bg-[#fbeaea] hover:bg-[#fae2e2]' : 'border-hairline-strong bg-canvas-soft hover:bg-canvas',
        )}
      >
        {uploading ? (
          <div className="flex flex-col items-center gap-1.5 py-sm">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            <span className="text-caption text-body">Đang tải lên…</span>
          </div>
        ) : url ? (
          <div className="space-y-1.5 py-xs">
            <img src={url} alt={title} className="mx-auto max-h-[80px] rounded object-cover shadow-sm" />
            <span className="block max-w-[200px] truncate text-caption font-semibold text-ink">
              {file?.name || 'Đã tải lên'}
            </span>
            <span className="text-caption text-text-link">Thay đổi ảnh</span>
          </div>
        ) : (
          <>
            <Icon name="upload" size={20} className="text-body" />
            <span className="text-body-sm font-medium text-ink">
              {title}
              {required ? <span className="ml-1 text-error">*</span> : null}
            </span>
            <span className="text-caption text-body">{hint}</span>
          </>
        )}
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          disabled={uploading}
          onChange={(e) => {
            const f = e.target.files?.[0] || null;
            e.target.value = '';
            if (f) onChange(f);
          }}
        />
      </label>
      {error ? <span className="text-caption text-error">{error}</span> : null}
    </div>
  );
}

export function OnboardingReviewRow({ label, value }) {
  return (
    <div className="flex items-start justify-between gap-base border-b border-hairline pb-2 last:border-0">
      <span className="text-caption-uppercase text-body">{label}</span>
      <span className="text-right text-body-sm text-ink">{value}</span>
    </div>
  );
}

export function OnboardingStepNav({
  stepIdx,
  totalSteps,
  onBack,
  onNext,
  onSubmit,
  submitting,
  submitLabel = 'Gửi hồ sơ',
  submittingLabel = 'Đang gửi hồ sơ…',
}) {
  return (
    <div className="flex flex-col gap-2 border-t border-hairline pt-base md:flex-row md:justify-between">
      <Button variant="secondary" onClick={onBack} disabled={stepIdx === 0 || submitting}>
        Quay lại
      </Button>
      {stepIdx < totalSteps - 1 ? (
        <Button onClick={onNext} trailingIcon="arrowRight" disabled={submitting}>
          Tiếp tục
        </Button>
      ) : (
        <Button onClick={onSubmit} disabled={submitting} trailingIcon="check">
          {submitting ? submittingLabel : submitLabel}
        </Button>
      )}
    </div>
  );
}

export function OnboardingInfoBanner({ icon = 'pin', children }) {
  return (
    <div className="rounded-md border border-dashed border-hairline-strong bg-canvas-soft p-base text-center">
      <Icon name={icon} size={18} className="mx-auto text-body" />
      <p className="mt-1 text-body-sm text-body">{children}</p>
    </div>
  );
}

export function OnboardingBlocked({ title, message, backHref = '/app', backLabel = 'Về trang chủ' }) {
  return (
    <OnboardingShell eyebrow="Đăng ký đối tác" title={title} backHref={backHref}>
      <div className="rounded-lg border border-hairline bg-surface p-lg text-center shadow-sm">
        <Icon name="shield" size={32} className="mx-auto text-warning" />
        <p className="mt-base text-body-md text-body">{message}</p>
        <div className="mt-lg">
          <Link to={backHref}>
            <Button variant="secondary">{backLabel}</Button>
          </Link>
        </div>
      </div>
    </OnboardingShell>
  );
}
