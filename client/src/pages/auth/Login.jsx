import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import AuthLayout from './AuthLayout.jsx';
import Button from '../../components/Button.jsx';
import Input from '../../components/Input.jsx';
import Tabs from '../../components/Tabs.jsx';
import { useApp } from '../../context/AppContext.jsx';
import { resolveLoginRedirect } from '../../lib/auth.js';
import { getRememberLoginPref } from '../../lib/authStorage.js';

export default function LoginPage() {
  const nav = useNavigate();
  const [params] = useSearchParams();
  const nextPath = params.get('next') || '/app';
  const { login, pushToast } = useApp();

  const [channel, setChannel] = useState('email');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [rememberMe, setRememberMe] = useState(() => getRememberLoginPref());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    if (channel === 'phone') {
      pushToast({
        kind: 'info',
        title: 'Sắp ra mắt',
        message: 'Đăng nhập bằng OTP sẽ được bổ sung sau.',
      });
      return;
    }
    setError('');
    setLoading(true);
    try {
      const user = await login(email.trim(), password, { remember: rememberMe });
      pushToast({ kind: 'success', title: 'Đăng nhập thành công', message: `Chào ${user.fullName}!` });
      nav(resolveLoginRedirect(nextPath, user), { replace: true });
    } catch (err) {
      setError(err.message ?? 'Đăng nhập thất bại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Đăng nhập"
      subtitle="Dùng email và mật khẩu đã đăng ký trong hệ thống NomNom."
      footer={
        <span>
          Chưa có tài khoản?{' '}
          <Link to="/register" className="text-text-link hover:underline">
            Tạo tài khoản khách hàng
          </Link>
        </span>
      }
    >
      <Tabs
        className="w-fit"
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
              placeholder="Mật khẩu"
              aria-label="Mật khẩu"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => {
                const v = e.target.value;
                setPassword(v);
                if (!v) setShowPw(false);
              }}
              trailingButton={
                password.length > 0
                  ? {
                      icon: showPw ? 'eyeOff' : 'eye',
                      onClick: () => setShowPw((s) => !s),
                      'aria-label': showPw ? 'Ẩn mật khẩu' : 'Hiện mật khẩu',
                    }
                  : undefined
              }
            />
            <label className="inline-flex cursor-pointer items-center gap-2 text-caption text-body">
              <input
                type="checkbox"
                className="accent-black"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              Ghi nhớ đăng nhập
            </label>
          </>
        ) : (
          <p className="rounded-md border border-hairline bg-canvas-soft p-sm text-body-sm text-body">
            Đăng nhập OTP qua SMS sẽ được bổ sung sau. Hiện tại vui lòng dùng email & mật khẩu.
          </p>
        )}

        {error && (
          <p className="text-caption text-error" role="alert">
            {error}
          </p>
        )}

        <Button type="submit" loading={loading} className="mt-xs" disabled={channel === 'phone'}>
          Đăng nhập
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

      <p className="mt-md text-caption leading-snug text-body">
        Bạn là chủ quán hoặc tài xế?{' '}
        <Link to="/login?next=/merchant" className="text-text-link hover:underline">
          Đăng nhập nhà hàng
        </Link>{' '}
        ·{' '}
        <Link to="/login?next=/driver" className="text-text-link hover:underline">
          Đăng nhập tài xế
        </Link>
        . Khách mới có thể{' '}
        <Link to="/register" className="text-text-link hover:underline">
          tạo tài khoản
        </Link>{' '}
        miễn phí.
      </p>
    </AuthLayout>
  );
}
