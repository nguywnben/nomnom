import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthLayout from './AuthLayout.jsx';
import Button from '../../components/Button.jsx';
import Input from '../../components/Input.jsx';
import { useApp } from '../../context/AppContext.jsx';

// Đăng ký khách hàng — primary_role = customer (luồng /app).
// Tài xế & nhà hàng đăng ký qua kênh riêng (sẽ bổ sung sau).
export default function RegisterPage() {
  const nav = useNavigate();
  const { register, pushToast } = useApp();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
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
      await register({
        fullName: fullName.trim(),
        email: email.trim(),
        phone: phone.trim() || undefined,
        password,
      });
      pushToast({
        kind: 'success',
        title: 'Tạo tài khoản thành công',
        message: 'Chào mừng bạn đến với NomNom!',
      });
      nav('/app', { replace: true });
    } catch (err) {
      setError(err.message ?? 'Đăng ký thất bại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Tạo tài khoản khách hàng"
      subtitle="Đặt món, theo dõi đơn hàng và nhận ưu đãi — chỉ dành cho người dùng ứng dụng khách."
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
          hint="Dùng email này để đăng nhập sau này."
        />
        <Input
          leadingIcon="phone"
          placeholder="Số điện thoại (tuỳ chọn)"
          aria-label="Số điện thoại"
          inputMode="tel"
          autoComplete="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          hint="Để nhận thông báo đơn hàng qua SMS."
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
            <Link to="/dieu-khoan-su-dung" className="text-text-link hover:underline" target="_blank" rel="noopener noreferrer">
              Điều khoản sử dụng
            </Link>{' '}
            và{' '}
            <Link to="/chinh-sach-bao-mat" className="text-text-link hover:underline" target="_blank" rel="noopener noreferrer">
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
