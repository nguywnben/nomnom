import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import AuthLayout from './AuthLayout.jsx';
import Button from '../../components/Button.jsx';
import Input from '../../components/Input.jsx';
import Icon from '../../components/Icon.jsx';
import Tabs from '../../components/Tabs.jsx';
import { useApp } from '../../context/AppContext.jsx';

// Trang đăng nhập đầy đủ — phục vụ cả 4 vai trò trong bảng `users.primary_role`.
// Mock: bấm nút sẽ set authed và điều hướng theo `?next=` hoặc trang nhà của vai trò.
export default function LoginPage() {
  const nav = useNavigate();
  const [params] = useSearchParams();
  const nextPath = params.get('next') || '/app';
  const { setAuthedRoles, pushToast } = useApp();

  const [channel, setChannel] = useState('email');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = (e) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      if (channel === 'phone') {
        nav(`/verify-otp?purpose=login&dest=${encodeURIComponent(phone)}&next=${encodeURIComponent(nextPath)}`);
        return;
      }
      setAuthedRoles((cur) => ({ ...cur, customer: true }));
      pushToast({ kind: 'success', title: 'Đăng nhập thành công', message: 'Chào mừng trở lại NomNom.' });
      nav(nextPath, { replace: true });
    }, 600);
  };

  return (
    <AuthLayout
      title="Đăng nhập"
      subtitle="Tiếp tục bằng email & mật khẩu hoặc số điện thoại với mã OTP."
      footer={
        <span>
          Chưa có tài khoản?{' '}
          <Link to="/register" className="text-text-link hover:underline">
            Tạo tài khoản
          </Link>
        </span>
      }
    >
      <Tabs
        className="w-full"
        items={[
          { value: 'email', label: 'Email & mật khẩu' },
          { value: 'phone', label: 'Số điện thoại' },
        ]}
        value={channel}
        onChange={setChannel}
      />

      <form onSubmit={submit} className="mt-base flex flex-col gap-sm">
        {channel === 'email' ? (
          <>
            <Input
              type="email"
              leadingIcon="mail"
              placeholder="Email"
              aria-label="Email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <Input
              type={showPw ? 'text' : 'password'}
              leadingIcon="shield"
              trailingIcon={showPw ? 'bellOff' : 'bell'}
              placeholder="Mật khẩu"
              aria-label="Mật khẩu"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <div className="flex items-center justify-between text-caption">
              <label className="inline-flex items-center gap-2 text-body">
                <input type="checkbox" className="accent-black" /> Ghi nhớ đăng nhập
              </label>
              <button
                type="button"
                className="text-text-link hover:underline"
                onClick={() => {
                  setShowPw((s) => !s);
                }}
              >
                {showPw ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
              </button>
            </div>
          </>
        ) : (
          <Input
            leadingIcon="phone"
            placeholder="Số điện thoại"
            aria-label="Số điện thoại"
            inputMode="tel"
            autoComplete="tel"
            required
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            hint="Mã OTP 6 chữ số sẽ được gửi qua SMS."
          />
        )}

        <Button type="submit" loading={loading} className="mt-xs">
          {channel === 'phone' ? 'Gửi mã OTP' : 'Đăng nhập'}
        </Button>

        {channel === 'email' && (
          <Link
            to="/forgot-password"
            className="text-center text-button text-text-link hover:underline"
          >
            Quên mật khẩu?
          </Link>
        )}
      </form>

      <div className="relative my-md">
        <div className="absolute inset-0 flex items-center">
          <div className="h-px w-full bg-hairline" />
        </div>
        <span className="relative mx-auto block w-fit bg-canvas px-2 text-caption text-body">
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
            type="button"
            onClick={() => {
              setAuthedRoles((c) => ({ ...c, customer: true }));
              pushToast({ kind: 'success', title: 'Đã đăng nhập', message: `Đã tiếp tục với ${s.label}.` });
              nav(nextPath, { replace: true });
            }}
            className="flex h-11 items-center justify-center gap-2 rounded-md border border-hairline-strong bg-surface-card text-button text-ink hover:bg-canvas-soft"
          >
            <Icon name={s.icon} size={16} />
            {s.label}
          </button>
        ))}
      </div>

      <p className="mt-md text-caption text-body">
        Bằng việc đăng nhập, bạn đồng ý với{' '}
        <Link to="/" className="text-text-link hover:underline">Điều khoản</Link> và{' '}
        <Link to="/" className="text-text-link hover:underline">Chính sách bảo mật</Link> của NomNom.
      </p>
    </AuthLayout>
  );
}
