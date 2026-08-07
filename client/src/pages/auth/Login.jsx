import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import AuthLayout from './AuthLayout.jsx';
import Button from '../../components/Button.jsx';
import Input from '../../components/Input.jsx';
import { useApp } from '../../context/AppContext.jsx';
import { resolveLoginRedirect } from '../../lib/auth.js';
import { getRememberLoginPref } from '../../lib/authStorage.js';

export default function LoginPage() {
  const nav = useNavigate();
  const [params] = useSearchParams();
  const { login, pushToast } = useApp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(() => getRememberLoginPref());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(email.trim(), password, { remember: rememberMe });
      pushToast({ kind: 'success', title: 'Đăng nhập thành công', message: `Chào ${user.fullName}!` });
      nav(resolveLoginRedirect(params.get('next'), user), { replace: true });
    } catch (requestError) {
      setError(requestError.message || 'Không thể đăng nhập. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Đăng nhập"
      subtitle="Dùng email và mật khẩu đã đăng ký trong hệ thống NomNom."
      footer={<span>Chưa có tài khoản? <Link to="/register" className="text-text-link hover:underline">Tạo tài khoản khách hàng</Link></span>}
    >
      <form onSubmit={submit} className="flex flex-col gap-sm">
        <Input type="email" leadingIcon="mail" placeholder="Email" aria-label="Email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} />
        <Input
          type={showPassword ? 'text' : 'password'}
          leadingIcon="shield"
          placeholder="Mật khẩu"
          aria-label="Mật khẩu"
          autoComplete="current-password"
          required
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          trailingButton={password ? { icon: showPassword ? 'eyeOff' : 'eye', onClick: () => setShowPassword((shown) => !shown), 'aria-label': showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu' } : undefined}
        />
        <label className="inline-flex cursor-pointer items-center gap-2 text-caption text-body">
          <input type="checkbox" className="accent-black" checked={rememberMe} onChange={(event) => setRememberMe(event.target.checked)} />
          Ghi nhớ đăng nhập
        </label>
        {error && <p className="text-caption text-error" role="alert">{error}</p>}
        <Button type="submit" loading={loading} className="mt-xs">Đăng nhập</Button>
        <Link to="/forgot-password" className="text-center text-button text-text-link hover:underline">Quên mật khẩu?</Link>
      </form>
      <p className="mt-md text-caption leading-snug text-body">
        Bạn là chủ quán? <Link to="/login?next=/merchant" className="text-text-link hover:underline">Đăng nhập nhà hàng</Link>. Khách mới có thể <Link to="/register" className="text-text-link hover:underline">tạo tài khoản</Link> miễn phí.
      </p>
    </AuthLayout>
  );
}