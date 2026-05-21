import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthLayout from './AuthLayout.jsx';
import Button from '../../components/Button.jsx';
import Input from '../../components/Input.jsx';
import Tabs from '../../components/Tabs.jsx';
import { useApp } from '../../context/AppContext.jsx';

// Quên mật khẩu — gửi OTP qua email hoặc SMS, tương ứng `otp_codes.purpose = 'reset_password'`.
export default function ForgotPasswordPage() {
  const nav = useNavigate();
  const { pushToast } = useApp();
  const [channel, setChannel] = useState('email');
  const [value, setValue] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = (e) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      pushToast({
        kind: 'info',
        title: 'Đã gửi mã đặt lại',
        message: `Mã 6 chữ số đã gửi đến ${value}.`,
      });
      nav(`/verify-otp?purpose=reset_password&dest=${encodeURIComponent(value)}`);
    }, 600);
  };

  return (
    <AuthLayout
      title="Quên mật khẩu?"
      subtitle="Nhập email hoặc số điện thoại đã đăng ký — chúng tôi sẽ gửi mã xác minh để bạn đặt lại mật khẩu."
      footer={
        <span>
          Nhớ ra rồi?{' '}
          <Link to="/login" className="text-text-link hover:underline">Quay lại đăng nhập</Link>
        </span>
      }
    >
      <Tabs
        className="w-full"
        items={[
          { value: 'email', label: 'Qua email' },
          { value: 'phone', label: 'Qua SMS' },
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
            required
            value={value}
            onChange={(e) => setValue(e.target.value)}
          />
        ) : (
          <Input
            leadingIcon="phone"
            inputMode="tel"
            placeholder="Số điện thoại đã đăng ký"
            aria-label="Số điện thoại đã đăng ký"
            required
            value={value}
            onChange={(e) => setValue(e.target.value)}
          />
        )}

        <Button type="submit" loading={loading}>
          Gửi mã xác minh
        </Button>
      </form>
    </AuthLayout>
  );
}
