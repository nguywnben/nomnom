import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthLayout from './AuthLayout.jsx';
import Button from '../../components/Button.jsx';
import Input from '../../components/Input.jsx';
import { useApp } from '../../context/AppContext.jsx';
import { forgotPasswordSendCodeApi } from '../../lib/api.js';

export default function ForgotPasswordPage() {
  const nav = useNavigate();
  const { pushToast } = useApp();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    const trimmed = email.trim().toLowerCase();
    setError('');
    setLoading(true);
    try {
      const data = await forgotPasswordSendCodeApi(trimmed);
      pushToast({
        kind: 'info',
        title: 'Đã gửi mã',
        message: data.message ?? `Kiểm tra hộp thư ${trimmed} (cả thư rác).`,
        duration: 5000,
      });
      nav(`/verify-otp?purpose=reset_password&dest=${encodeURIComponent(trimmed)}`, {
        replace: true,
      });
    } catch (err) {
      setError(err.message ?? 'Không gửi được mã xác minh.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Quên mật khẩu?"
      subtitle="Nhập email đã đăng ký — chúng tôi sẽ gửi mã 6 chữ số để bạn đặt lại mật khẩu."
      footer={
        <span>
          Nhớ ra rồi?{' '}
          <Link to="/login" className="text-text-link hover:underline">
            Quay lại đăng nhập
          </Link>
        </span>
      }
    >
      <form onSubmit={submit} className="flex flex-col gap-sm">
        <Input
          type="email"
          leadingIcon="mail"
          placeholder="Email đã đăng ký"
          aria-label="Email đã đăng ký"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        {error && (
          <p className="text-caption text-error" role="alert">
            {error}
          </p>
        )}

        <Button type="submit" loading={loading} className="mt-xs">
          Gửi mã xác minh
        </Button>
      </form>
    </AuthLayout>
  );
}

