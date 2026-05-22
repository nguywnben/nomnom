import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthLayout from './AuthLayout.jsx';
import Button from '../../components/Button.jsx';
import Input from '../../components/Input.jsx';
import { useApp } from '../../context/AppContext.jsx';

export default function RegisterPage() {
  const nav = useNavigate();
  const { registerSendCode, pushToast } = useApp();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [agree, setAgree] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    if (!agree) {
      pushToast({ kind: 'error', title: 'Cần đồng ý điều khoản', message: 'Hãy đồng ý điều khoản để tiếp tục.' });
      return;
    }
    setError('');
    setLoading(true);
    try {
      const trimmedEmail = email.trim().toLowerCase();
      await registerSendCode({
        fullName: fullName.trim(),
        email: trimmedEmail,
        password,
      });
      pushToast({
        kind: 'info',
        title: 'Đã gửi mã xác minh',
        message: `Kiểm tra hộp thư ${trimmedEmail} (cả thư rác) để lấy mã 6 số.`,
        duration: 5000,
      });
      nav(
        `/verify-otp?purpose=register&dest=${encodeURIComponent(trimmedEmail)}`,
        { replace: true },
      );
    } catch (err) {
      setError(err.message ?? 'Không gửi được mã xác minh.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Tạo tài khoản khách hàng"
      subtitle="Nhập thông tin — chúng tôi sẽ gửi mã 6 số qua email để hoàn tất đăng ký."
      footer={
        <span>
          Đã có tài khoản?{' '}
          <Link to="/login" className="text-text-link hover:underline">
            Đăng nhập
          </Link>
        </span>
      }
    >
      <form onSubmit={submit} className="flex flex-col gap-sm">
        <Input
          leadingIcon="user"
          placeholder="Họ và tên"
          aria-label="Họ và tên"
          required
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
        />
        <Input
          type="email"
          leadingIcon="mail"
          placeholder="Email"
          aria-label="Email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          hint="Mã xác minh sẽ được gửi đến email này."
        />
        <Input
          type={showPw ? 'text' : 'password'}
          leadingIcon="shield"
          placeholder="Mật khẩu (tối thiểu 8 ký tự)"
          aria-label="Mật khẩu"
          autoComplete="new-password"
          required
          minLength={8}
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

        {error && (
          <p className="text-caption text-error" role="alert">
            {error}
          </p>
        )}

        <label className="mt-xs flex items-start gap-2 text-caption text-body">
          <input
            type="checkbox"
            className="mt-0.5 accent-black"
            checked={agree}
            onChange={(e) => setAgree(e.target.checked)}
          />
          <span>
            Tôi đồng ý với{' '}
            <Link
              to="/dieu-khoan-su-dung"
              className="text-text-link hover:underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              Điều khoản sử dụng
            </Link>{' '}
            và{' '}
            <Link
              to="/chinh-sach-bao-mat"
              className="text-text-link hover:underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              Chính sách bảo mật
            </Link>{' '}
            của NomNom.
          </span>
        </label>

        <Button type="submit" loading={loading} className="mt-xs">
          Tạo tài khoản khách hàng
        </Button>
      </form>

      <p className="mt-md rounded-md border border-hairline bg-canvas-soft p-sm text-caption text-body">
        Bạn là chủ quán hoặc tài xế?{' '}
        <Link to="/hop-tac" className="text-text-link hover:underline">
          Xem hợp tác đối tác
        </Link>{' '}
        — đăng ký merchant/driver sẽ có luồng riêng, không qua trang này.
      </p>
    </AuthLayout>
  );
}
