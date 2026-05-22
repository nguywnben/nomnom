import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthLayout from './AuthLayout.jsx';
import Button from '../../components/Button.jsx';
import Input from '../../components/Input.jsx';
import Tabs from '../../components/Tabs.jsx';
import { useApp } from '../../context/AppContext.jsx';
import { forgotPasswordSendCodeApi } from '../../lib/api.js';

export default function ForgotPasswordPage() {
  const nav = useNavigate();
  const { pushToast } = useApp();
  const [channel, setChannel] = useState('email');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    if (channel === 'phone') {
      pushToast({
        kind: 'info',
        title: 'Sắp ra mắt',
        message: 'Đặt lại mật khẩu qua SMS sẽ được bổ sung sau.',
      });
      return;
    }

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
      <Tabs
        className="w-fit"
        items={[
          { value: 'email', label: 'Email' },
          { value: 'phone', label: 'Số điện thoại' },
        ]}
        value={channel}
        onChange={setChannel}
      />

      <form onSubmit={submit} className="mt-base flex flex-col gap-sm">
        {channel === 'email' ? (
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
        ) : (
          <p className="rounded-md border border-hairline bg-canvas-soft p-sm text-body-sm text-body">
            Đặt lại mật khẩu qua SMS sẽ được bổ sung sau. Vui lòng dùng email.
          </p>
        )}

        {error && (
          <p className="text-caption text-error" role="alert">
            {error}
          </p>
        )}

        <Button type="submit" loading={loading} disabled={channel === 'phone'}>
          Gửi mã xác minh
        </Button>
      </form>
    </AuthLayout>
  );
}
