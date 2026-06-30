import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import Button from '../../../components/Button.jsx';
import Card from '../../../components/Card.jsx';
import Icon from '../../../components/Icon.jsx';
import Modal from '../../../components/Modal.jsx';
import Switch from '../../../components/Switch.jsx';
import Input, { Select } from '../../../components/Input.jsx';
import { useApp } from '../../../context/AppContext.jsx';
import { changePasswordApi, logoutAllApi } from '../../../lib/api.js';
import ProfileSubHeader from './ProfileSubHeader.jsx';

// Cài đặt ứng dụng — ngôn ngữ, hiển thị, thông báo, dữ liệu, vùng nguy hiểm.
const LANGUAGE_OPTIONS = [
  { value: 'vi', label: 'Tiếng Việt' },
  { value: 'en', label: 'English' },
];

const REGION_OPTIONS = [
  { value: 'vn-hcm', label: 'TP. Hồ Chí Minh' },
  { value: 'vn-han', label: 'Hà Nội' },
  { value: 'vn-dad', label: 'Đà Nẵng' },
  { value: 'vn-cat', label: 'Cần Thơ' },
];

// ---------------------------------------------------------------------------
// Notification preferences — sống trong Settings (trang Notifications giờ là
// inbox hiển thị danh sách thông báo, không còn chứa toggle).
// ---------------------------------------------------------------------------
const NOTIFICATION_CHANNELS = [
  { id: 'push', label: 'Thông báo đẩy (push)', hint: 'Hiển thị ngay trên thiết bị.' },
  { id: 'email', label: 'Email', hint: 'Tóm tắt biên lai và thông báo quan trọng.' },
  { id: 'sms', label: 'Tin nhắn SMS', hint: 'Áp dụng cho cảnh báo bảo mật và OTP.' },
];

const NOTIFICATION_GROUPS = [
  {
    id: 'orders',
    title: 'Đơn hàng & giao hàng',
    icon: 'package',
    items: [
      { id: 'order-status', label: 'Cập nhật trạng thái đơn', hint: 'Khi nhà hàng xác nhận, tài xế nhận đơn, đến nơi.' },
      { id: 'driver-eta', label: 'Cập nhật vị trí tài xế', hint: 'ETA mới khi tài xế gần đến.' },
      { id: 'order-issue', label: 'Sự cố đơn hàng', hint: 'Khi món hết hàng hoặc đơn cần xác nhận lại.' },
    ],
  },
  {
    id: 'promos',
    title: 'Khuyến mãi',
    icon: 'zap',
    items: [
      { id: 'promo-personal', label: 'Ưu đãi cá nhân hoá', hint: 'Voucher gợi ý dựa trên thói quen đặt món.' },
      { id: 'promo-weekly', label: 'Bản tin tuần', hint: 'Tổng hợp ưu đãi cuối tuần.' },
      { id: 'promo-flash', label: 'Flash sale', hint: 'Thông báo nhanh khi có khuyến mãi giờ vàng.' },
    ],
  },
  {
    id: 'account',
    title: 'Tài khoản & bảo mật',
    icon: 'shield',
    items: [
      { id: 'account-login', label: 'Đăng nhập từ thiết bị mới', hint: 'Cảnh báo bảo mật quan trọng.' },
      { id: 'account-changes', label: 'Thay đổi thông tin tài khoản', hint: 'Khi email hoặc số điện thoại thay đổi.' },
    ],
  },
];

const STORAGE_KEY = 'nomnom-settings';

const NOTIFICATION_DEFAULTS = {
  muteAll: false,
  'ch-push': true,
  'ch-email': true,
  'ch-sms': false,
  'order-status': true,
  'driver-eta': true,
  'order-issue': true,
  'promo-personal': true,
  'promo-weekly': false,
  'promo-flash': false,
  'account-login': true,
  'account-changes': true,
};

const DEFAULTS = {
  language: 'vi',
  region: 'vn-hcm',
  theme: 'system', // 'light' | 'dark' | 'system'
  reduceMotion: false,
  largeText: false,
  analytics: true,
  autoplay: true,
  notifications: NOTIFICATION_DEFAULTS,
};

// Read once during module init — keeps the component free of an "effect that
// hydrates state" pattern (which the project's lint config disallows).
function readPersisted() {
  if (typeof localStorage === 'undefined') return DEFAULTS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULTS;
    const v = JSON.parse(raw);
    return {
      language: v.language ?? DEFAULTS.language,
      region: v.region ?? DEFAULTS.region,
      theme: v.theme ?? DEFAULTS.theme,
      reduceMotion: !!v.reduceMotion,
      largeText: !!v.largeText,
      analytics: v.analytics !== false,
      autoplay: v.autoplay !== false,
      notifications: { ...NOTIFICATION_DEFAULTS, ...(v.notifications ?? {}) },
    };
  } catch {
    return DEFAULTS;
  }
}

export default function Settings() {
  const nav = useNavigate();
  const { pushToast, logout, user } = useApp();

  const [language, setLanguage] = useState(() => readPersisted().language);
  const [region, setRegion] = useState(() => readPersisted().region);
  const [theme, setTheme] = useState(() => readPersisted().theme);
  const [reduceMotion, setReduceMotion] = useState(() => readPersisted().reduceMotion);
  const [largeText, setLargeText] = useState(() => readPersisted().largeText);
  const [analytics, setAnalytics] = useState(() => readPersisted().analytics);
  const [autoplay, setAutoplay] = useState(() => readPersisted().autoplay);
  const [notifications, setNotifications] = useState(() => readPersisted().notifications);

  const [confirmLogout, setConfirmLogout] = useState(false);
  const [confirmLogoutAll, setConfirmLogoutAll] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordErrors, setPasswordErrors] = useState({});
  const [changingPassword, setChangingPassword] = useState(false);
  const [loggingOutAll, setLoggingOutAll] = useState(false);

  // Persist on change — this effect mutates an external system (localStorage),
  // not React state, so it doesn't trigger the cascading-render lint rule.
  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          language,
          region,
          theme,
          reduceMotion,
          largeText,
          analytics,
          autoplay,
          notifications,
        }),
      );
    } catch {
      /* ignore */
    }
  }, [language, region, theme, reduceMotion, largeText, analytics, autoplay, notifications]);

  const setNotif = (key, value) =>
    setNotifications((cur) => ({ ...cur, [key]: value }));

  const toggleNotif = (key, on) => {
    if (notifications.muteAll) {
      pushToast({
        kind: 'info',
        title: 'Đang tắt tất cả thông báo',
        message: 'Hãy bật lại "Tắt tất cả" trước khi điều chỉnh từng mục.',
      });
      return;
    }
    setNotif(key, on);
  };

  const onLogout = async () => {
    setConfirmLogout(false);
    await logout();
  };

  const onLogoutAll = async () => {
    setConfirmLogoutAll(false);
    setLoggingOutAll(true);
    try {
      await logoutAllApi();
      await logout({ redirectTo: '/login', silent: true });
      pushToast({
        kind: 'success',
        title: 'Đã đăng xuất mọi thiết bị',
        message: 'Phiên trên các thiết bị khác sẽ hết hạn khi gọi API tiếp theo.',
        duration: 4000,
      });
    } catch (err) {
      pushToast({
        kind: 'error',
        title: 'Không thể đăng xuất tất cả',
        message: err.message ?? 'Vui lòng thử lại.',
      });
    } finally {
      setLoggingOutAll(false);
    }
  };

  const resetPasswordForm = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setPasswordErrors({});
  };

  const onChangePassword = async (e) => {
    e.preventDefault();
    setPasswordErrors({});

    const newErrors = {};
    if (!currentPassword) {
      newErrors.currentPassword = 'Mật khẩu cũ không được để trống.';
    }
    if (!newPassword) {
      newErrors.newPassword = 'Mật khẩu mới không được để trống.';
    } else if (newPassword.length < 8) {
      newErrors.newPassword = 'Mật khẩu mới phải có ít nhất 8 ký tự.';
    }
    if (!confirmPassword) {
      newErrors.confirmPassword = 'Vui lòng xác nhận mật khẩu mới.';
    } else if (newPassword !== confirmPassword) {
      newErrors.confirmPassword = 'Mật khẩu xác nhận không khớp.';
    }

    if (Object.keys(newErrors).length > 0) {
      setPasswordErrors(newErrors);
      return;
    }

    setChangingPassword(true);
    try {
      await changePasswordApi({ currentPassword, newPassword });
      setPasswordOpen(false);
      resetPasswordForm();
      pushToast({
        kind: 'success',
        title: 'Đã đổi mật khẩu',
        message: 'Mật khẩu mới có hiệu lực ngay.',
      });
    } catch (err) {
      const msg = err.message ?? 'Không thể đổi mật khẩu.';
      if (msg.toLowerCase().includes('hiện tại') || msg.toLowerCase().includes('cũ') || msg.toLowerCase().includes('current')) {
        setPasswordErrors({ currentPassword: msg });
      } else {
        setPasswordErrors({ newPassword: msg });
      }
    } finally {
      setChangingPassword(false);
    }
  };

  const onDelete = () => {
    setConfirmDelete(false);
    pushToast({
      kind: 'info',
      title: 'Đã gửi yêu cầu xoá',
      message: 'Đội ngũ hỗ trợ sẽ liên hệ để xác nhận trong 24h.',
    });
  };

  return (
    <div className="flex flex-col gap-base p-base md:container-page md:py-xl">
      <ProfileSubHeader title="Cài đặt ứng dụng" />

      {/* Language & region */}
      <Card padded>
        <div className="text-caption-uppercase text-body mb-sm">Ngôn ngữ & khu vực</div>
        <div className="flex flex-col gap-sm">
          <Field label="Ngôn ngữ hiển thị">
            <Select value={language} onChange={(e) => setLanguage(e.target.value)} options={LANGUAGE_OPTIONS} />
          </Field>
          <Field label="Khu vực giao hàng" hint="Dùng để gợi ý nhà hàng gần bạn.">
            <Select value={region} onChange={(e) => setRegion(e.target.value)} options={REGION_OPTIONS} />
          </Field>
        </div>
      </Card>

      {/* Display */}
      <Card padded>
        <div className="text-caption-uppercase text-body mb-sm">Hiển thị</div>
        <div className="flex flex-col gap-sm">
          <Field label="Giao diện">
            <div className="grid grid-cols-3 gap-xs">
              {[
                { id: 'light', label: 'Sáng' },
                { id: 'dark', label: 'Tối' },
                { id: 'system', label: 'Theo hệ thống' },
              ].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTheme(t.id)}
                  className={
                    'h-11 rounded-md border text-button transition-colors ' +
                    (theme === t.id
                      ? 'border-ink bg-primary text-on-primary'
                      : 'border-hairline-strong bg-surface-card text-ink hover:bg-canvas-soft')
                  }
                >
                  {t.label}
                </button>
              ))}
            </div>
          </Field>

          <div className="flex flex-col divide-y divide-hairline">
            <Toggle
              label="Giảm hiệu ứng chuyển động"
              hint="Tắt animation và hiệu ứng trượt khi điều hướng."
              checked={reduceMotion}
              onChange={setReduceMotion}
            />
            <Toggle
              label="Cỡ chữ lớn"
              hint="Phóng to chữ trong toàn bộ ứng dụng."
              checked={largeText}
              onChange={setLargeText}
            />
            <Toggle
              label="Tự phát ảnh động"
              hint="Cho phép phát ảnh GIF / video trên trang chủ."
              checked={autoplay}
              onChange={setAutoplay}
            />
          </div>
        </div>
      </Card>

      {/* Notifications preferences */}
      <Card padded>
        <div className="mb-sm flex items-center justify-between gap-sm">
          <div className="text-caption-uppercase text-body">Thông báo</div>
          <button
            type="button"
            onClick={() => nav('/app/profile/notifications')}
            className="inline-flex items-center gap-1 text-button text-text-link hover:underline"
          >
            Mở hộp thư
            <Icon name="chevronRight" size={12} />
          </button>
        </div>

        {/* Master mute */}
        <Toggle
          label="Tắt tất cả thông báo"
          hint="Khi bật, NomNom sẽ ngừng gửi mọi thông báo, kể cả thông báo đơn hàng."
          checked={notifications.muteAll}
          onChange={(on) => setNotif('muteAll', on)}
          icon={notifications.muteAll ? 'bellOff' : 'bell'}
        />

        {/* Channels */}
        <div className="mt-base">
          <div className="text-caption-uppercase text-body mb-2">Kênh nhận</div>
          <div className="flex flex-col divide-y divide-hairline">
            {NOTIFICATION_CHANNELS.map((c) => {
              const key = `ch-${c.id}`;
              return (
                <Toggle
                  key={c.id}
                  label={c.label}
                  hint={c.hint}
                  checked={!notifications.muteAll && !!notifications[key]}
                  onChange={(on) => toggleNotif(key, on)}
                />
              );
            })}
          </div>
        </div>

        {/* Groups */}
        {NOTIFICATION_GROUPS.map((g) => (
          <div key={g.id} className="mt-base">
            <div className="mb-2 flex items-center gap-2">
              <span className="grid h-7 w-7 place-items-center rounded-md bg-surface-strong text-ink">
                <Icon name={g.icon} size={12} />
              </span>
              <div className="text-title-sm text-ink">{g.title}</div>
            </div>
            <div className="flex flex-col divide-y divide-hairline">
              {g.items.map((it) => (
                <Toggle
                  key={it.id}
                  label={it.label}
                  hint={it.hint}
                  checked={!notifications.muteAll && !!notifications[it.id]}
                  onChange={(on) => toggleNotif(it.id, on)}
                />
              ))}
            </div>
          </div>
        ))}
      </Card>

      {/* Privacy & data */}
      <Card padded>
        <div className="text-caption-uppercase text-body mb-sm">Quyền riêng tư & dữ liệu</div>
        <div className="flex flex-col divide-y divide-hairline">
          <Toggle
            label="Cho phép phân tích sử dụng"
            hint="Giúp chúng tôi cải thiện trải nghiệm — không thu thập dữ liệu nhạy cảm."
            checked={analytics}
            onChange={setAnalytics}
          />
          <ActionRow
            icon="download"
            label="Tải dữ liệu cá nhân"
            hint="Xuất bản sao đơn hàng, đánh giá, địa chỉ ở dạng CSV."
            onClick={() =>
              pushToast({
                kind: 'info',
                title: 'Đang chuẩn bị tệp',
                message: 'Chúng tôi sẽ gửi liên kết tải về qua email.',
              })
            }
          />
          <ActionRow
            icon="refresh"
            label="Xoá bộ nhớ tạm"
            hint="Xoá ảnh và dữ liệu được lưu cục bộ trên thiết bị này."
            onClick={() => {
              try {
                localStorage.removeItem(STORAGE_KEY);
              } catch {
                /* ignore */
              }
              // Reset toggles to defaults so the user immediately sees the
              // result — and the persist effect doesn't just rewrite the file.
              setLanguage(DEFAULTS.language);
              setRegion(DEFAULTS.region);
              setTheme(DEFAULTS.theme);
              setReduceMotion(DEFAULTS.reduceMotion);
              setLargeText(DEFAULTS.largeText);
              setAnalytics(DEFAULTS.analytics);
              setAutoplay(DEFAULTS.autoplay);
              setNotifications(NOTIFICATION_DEFAULTS);
              pushToast({ kind: 'success', title: 'Đã xoá bộ nhớ tạm', message: 'Đã đặt lại tuỳ chọn về mặc định.' });
            }}
          />
        </div>
      </Card>

      {/* About */}
      <Card padded>
        <div className="text-caption-uppercase text-body mb-sm">Về NomNom</div>
        <div className="flex flex-col divide-y divide-hairline">
          <ActionRow
            icon="chat"
            label="Trung tâm hỗ trợ"
            hint="Câu hỏi thường gặp và liên hệ trực tiếp."
            onClick={() => nav('/chat/chat-admin')}
          />
          <ActionRow
            icon="shield"
            label="Điều khoản & quyền riêng tư"
            hint="Đọc các điều khoản sử dụng dịch vụ."
            onClick={() =>
              pushToast({ kind: 'info', title: 'Sắp ra mắt', message: 'Trang chính sách đang được hoàn thiện.' })
            }
          />
          <div className="flex items-center justify-between gap-sm py-3 last:pb-0">
            <div>
              <div className="text-body-sm font-semibold text-ink">Phiên bản</div>
              <div className="text-caption text-body font-mono">NomNom v1.0.0 (build 2026.05)</div>
            </div>
            <Icon name="package" size={16} className="text-body" />
          </div>
        </div>
      </Card>

      {/* Security */}
      {user && (
        <Card padded>
          <div className="text-caption-uppercase text-body mb-sm">Bảo mật tài khoản</div>
          <div className="flex flex-col divide-y divide-hairline">
            <ActionRow
              icon="shield"
              label="Đổi mật khẩu"
              hint="Nhập mật khẩu hiện tại và mật khẩu mới (tối thiểu 8 ký tự)."
              onClick={() => {
                resetPasswordForm();
                setPasswordOpen(true);
              }}
            />
            <ActionRow
              icon="refresh"
              label="Đăng xuất tất cả thiết bị"
              hint="Thu hồi mọi phiên đăng nhập trên điện thoại, máy tính và trình duyệt khác."
              onClick={() => setConfirmLogoutAll(true)}
            />
          </div>
        </Card>
      )}

      {/* Danger zone */}
      {user && (
        <Card padded>
          <div className="text-caption-uppercase text-error mb-sm">Khu vực nguy hiểm</div>
          <div className="flex flex-col gap-xs">
            <Button
              variant="secondary"
              leadingIcon="x"
              className="!justify-start"
              onClick={() => setConfirmLogout(true)}
            >
              Đăng xuất khỏi thiết bị này
            </Button>
            <Button
              variant="secondary"
              leadingIcon="trash"
              className="!justify-start !text-error !border-error/40 hover:!bg-[#fbeaea]"
              onClick={() => setConfirmDelete(true)}
            >
              Xoá tài khoản
            </Button>
          </div>
        </Card>
      )}

      {/* Logout confirm */}
      <Modal
        open={confirmLogout}
        onClose={() => setConfirmLogout(false)}
        title="Đăng xuất khỏi NomNom?"
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setConfirmLogout(false)}>
              Ở lại
            </Button>
            <Button onClick={onLogout}>Đăng xuất</Button>
          </>
        }
      >
        <p className="text-body-sm text-body">
          Giỏ hàng và phiên hiện tại sẽ kết thúc. Bạn có thể đăng nhập lại bất kỳ lúc nào.
        </p>
      </Modal>

      {/* Logout all confirm */}
      <Modal
        open={confirmLogoutAll}
        onClose={() => setConfirmLogoutAll(false)}
        title="Đăng xuất tất cả thiết bị?"
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setConfirmLogoutAll(false)}>
              Hủy
            </Button>
            <Button onClick={onLogoutAll} loading={loggingOutAll}>
              Đăng xuất tất cả
            </Button>
          </>
        }
      >
        <p className="text-body-sm text-body">
          Mọi phiên đăng nhập NomNom sẽ bị thu hồi, kể cả thiết bị này. Bạn sẽ cần đăng nhập lại.
        </p>
      </Modal>

      {/* Change password */}
      <Modal
        open={passwordOpen}
        onClose={() => {
          setPasswordOpen(false);
          resetPasswordForm();
        }}
        title="Đổi mật khẩu"
        size="sm"
        footer={
          <>
            <Button
              variant="secondary"
              type="button"
              onClick={() => {
                setPasswordOpen(false);
                resetPasswordForm();
              }}
            >
              Hủy
            </Button>
            <Button type="submit" form="change-password-form" loading={changingPassword}>
              Lưu mật khẩu
            </Button>
          </>
        }
      >
        <form id="change-password-form" onSubmit={onChangePassword} className="flex flex-col gap-sm">
          <Input
            type="password"
            label="Mật khẩu cũ"
            leadingIcon="shield"
            placeholder="Nhập mật khẩu hiện tại"
            value={currentPassword}
            onChange={(e) => {
              setCurrentPassword(e.target.value);
              if (passwordErrors.currentPassword) setPasswordErrors(prev => ({ ...prev, currentPassword: '' }));
            }}
            autoComplete="current-password"
            required
            error={passwordErrors.currentPassword}
          />
          <Input
            type="password"
            label="Mật khẩu mới"
            leadingIcon="shield"
            placeholder="Tối thiểu 8 ký tự"
            value={newPassword}
            onChange={(e) => {
              setNewPassword(e.target.value);
              if (passwordErrors.newPassword) setPasswordErrors(prev => ({ ...prev, newPassword: '' }));
            }}
            autoComplete="new-password"
            required
            error={passwordErrors.newPassword}
          />
          <Input
            type="password"
            label="Xác nhận mật khẩu"
            leadingIcon="shield"
            placeholder="Nhập lại mật khẩu mới"
            value={confirmPassword}
            onChange={(e) => {
              setConfirmPassword(e.target.value);
              if (passwordErrors.confirmPassword) setPasswordErrors(prev => ({ ...prev, confirmPassword: '' }));
            }}
            autoComplete="new-password"
            required
            error={passwordErrors.confirmPassword}
          />
        </form>
      </Modal>

      {/* Delete confirm */}
      <Modal
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        title="Xoá tài khoản NomNom?"
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setConfirmDelete(false)}>
              Hủy
            </Button>
            <Button
              className="!bg-error !border-error hover:!bg-error/90"
              onClick={onDelete}
            >
              Gửi yêu cầu xoá
            </Button>
          </>
        }
      >
        <p className="text-body-sm text-body">
          Hành động này sẽ xoá vĩnh viễn dữ liệu đơn hàng, đánh giá và địa chỉ của bạn. Đội ngũ hỗ trợ sẽ
          liên hệ để xác nhận trước khi tiến hành.
        </p>
      </Modal>
    </div>
  );
}

function Field({ label, hint, children }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-caption-uppercase text-body">{label}</span>
      {children}
      {hint && <span className="text-caption text-body">{hint}</span>}
    </label>
  );
}

function Toggle({ label, hint, checked, onChange, icon }) {
  return (
    <div className="flex items-start gap-sm py-3 first:pt-0 last:pb-0">
      {icon && (
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-surface-strong text-ink">
          <Icon name={icon} size={14} />
        </span>
      )}
      <div className="min-w-0 flex-1">
        <div className="text-body-sm font-semibold text-ink">{label}</div>
        {hint && <p className="text-caption text-body">{hint}</p>}
      </div>
      <Switch checked={checked} onChange={onChange} />
    </div>
  );
}

function ActionRow({ icon, label, hint, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-sm py-3 text-left first:pt-0 last:pb-0 hover:bg-canvas-soft -mx-base px-base"
    >
      <span className="grid h-9 w-9 place-items-center rounded-md bg-surface-strong text-ink">
        <Icon name={icon} size={16} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-body-sm font-semibold text-ink">{label}</span>
        {hint && <span className="text-caption text-body">{hint}</span>}
      </span>
      <Icon name="chevronRight" size={14} className="text-body" />
    </button>
  );
}
