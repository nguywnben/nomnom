import { useState } from 'react';
import Modal from '../../components/Modal.jsx';
import Button from '../../components/Button.jsx';
import Input from '../../components/Input.jsx';
import Icon from '../../components/Icon.jsx';
import { useApp } from '../../context/AppContext.jsx';

export default function AuthModal() {
  const { authModal, setAuthModal, setAuthedRoles, pushToast } = useApp();
  const [tab, setTab] = useState('email'); // 'email' | 'phone'
  const [mode, setMode] = useState(authModal.mode || 'login');
  const [email, setEmail] = useState('mara@example.com');
  const [password, setPassword] = useState('••••••••');
  const [phone, setPhone] = useState('+1 (555) ');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState('input'); // input | otp

  const close = () => {
    setAuthModal({ open: false, mode: 'login' });
    setStep('input');
  };

  const submit = (e) => {
    e.preventDefault();
    if (tab === 'phone' && step === 'input') {
      setStep('otp');
      pushToast({ kind: 'info', title: 'Đã gửi mã', message: 'Mã 6 chữ số đã được gửi đến điện thoại của bạn.' });
      return;
    }
    setAuthedRoles((cur) => ({ ...cur, customer: true }));
    pushToast({
      kind: 'success',
      title: mode === 'login' ? 'Chào mừng trở lại' : 'Đã tạo tài khoản',
      message: 'Bạn đã đăng nhập.',
    });
    close();
  };

  return (
    <Modal
      open={authModal.open}
      onClose={close}
      title={mode === 'login' ? 'Đăng nhập vào NomNom' : 'Tạo tài khoản NomNom của bạn'}
      size="md"
    >
      <div className="flex flex-col gap-base">
        {/* Tab strip */}
        <div className="grid grid-cols-2 rounded-md border border-hairline-strong p-1 text-button">
          {['email', 'phone'].map((t) => (
            <button
              key={t}
              onClick={() => {
                setTab(t);
                setStep('input');
              }}
              className={`h-9 rounded-sm capitalize transition-colors ${
                tab === t ? 'bg-primary text-on-primary' : 'text-ink hover:bg-canvas-soft'
              }`}
            >
              {t === 'email' ? 'Email & mật khẩu' : 'Số điện thoại (OTP)'}
            </button>
          ))}
        </div>

        <form className="flex flex-col gap-sm" onSubmit={submit}>
          {tab === 'email' && (
            <>
              <Input
                id="email"
                type="email"
                leadingIcon="mail"
                placeholder="Email"
                aria-label="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <Input
                id="password"
                type="password"
                leadingIcon="shield"
                placeholder="Mật khẩu"
                aria-label="Mật khẩu"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                hint={mode === 'login' ? 'Dùng email và mật khẩu đã đăng ký.' : 'Khuyến nghị từ 8+ ký tự.'}
              />
            </>
          )}

          {tab === 'phone' && step === 'input' && (
            <Input
              id="phone"
              leadingIcon="phone"
              placeholder="Số điện thoại"
              aria-label="Số điện thoại"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
              hint="Chúng tôi sẽ gửi cho bạn mã 6 chữ số."
            />
          )}

          {tab === 'phone' && step === 'otp' && (
            <Input
              id="otp"
              leadingIcon="zap"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              placeholder="Mã 6 chữ số"
              aria-label="Mã dùng một lần"
              maxLength={6}
              required
              hint="Nhập mã OTP gửi đến điện thoại của bạn."
            />
          )}

          <Button className="mt-xs" type="submit">
            {tab === 'phone' && step === 'input'
              ? 'Gửi mã'
              : mode === 'login'
                ? 'Đăng nhập'
                : 'Tạo tài khoản'}
          </Button>
        </form>

        {/* Social */}
        <div className="relative my-xs">
          <div className="absolute inset-0 flex items-center">
            <div className="h-px w-full bg-hairline" />
          </div>
          <span className="relative mx-auto block w-fit bg-surface-card px-2 text-caption text-body">
            hoặc tiếp tục với
          </span>
        </div>

        <div className="grid grid-cols-3 gap-xs">
          {[
            { label: 'Apple', icon: 'apple' },
            { label: 'Google', icon: 'google' },
            { label: 'Facebook', icon: 'facebook' },
          ].map((s) => (
            <button
              key={s.label}
              onClick={() => {
                setAuthedRoles((c) => ({ ...c, customer: true }));
                pushToast({
                  kind: 'success',
                  title: 'Đã đăng nhập',
                  message: `Đã tiếp tục với ${s.label}.`,
                });
                close();
              }}
              className="flex h-10 items-center justify-center gap-2 rounded-md border border-hairline-strong bg-surface-card text-button text-ink hover:bg-canvas-soft"
            >
              <Icon name={s.icon} size={16} />
              {s.label}
            </button>
          ))}
        </div>

        <p className="text-caption text-body text-center mt-xs">
          {mode === 'login' ? "Chưa có tài khoản? " : 'Đã có tài khoản? '}
          <button
            type="button"
            className="text-text-link hover:underline"
            onClick={() => setMode((m) => (m === 'login' ? 'register' : 'login'))}
          >
            {mode === 'login' ? 'Tạo tài khoản' : 'Đăng nhập'}
          </button>
        </p>
      </div>
    </Modal>
  );
}
