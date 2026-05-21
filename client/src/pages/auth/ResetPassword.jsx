import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthLayout from './AuthLayout.jsx';
import Button from '../../components/Button.jsx';
import Input from '../../components/Input.jsx';
import { useApp } from '../../context/AppContext.jsx';

// Đặt lại mật khẩu sau khi OTP `reset_password` đã hợp lệ.
export default function ResetPasswordPage() {
  const nav = useNavigate();
  const { pushToast } = useApp();
  const [pw, setPw] = useState('');
  const [pw2, setPw2] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = (e) => {
    e.preventDefault();
    if (pw.length < 8) {
      pushToast({ kind: 'error', title: 'Mật khẩu quá ngắn', message: 'Mật khẩu cần tối thiểu 8 ký tự.' });
      return;
    }
    if (pw !== pw2) {
      pushToast({ kind: 'error', title: 'Mật khẩu không khớp', message: 'Hai ô mật khẩu phải giống nhau.' });
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      pushToast({ kind: 'success', title: 'Đã đặt lại mật khẩu', message: 'Hãy đăng nhập bằng mật khẩu mới.' });
      nav('/login', { replace: true });
    }, 600);
  };

  return (
    <AuthLayout
      title="Đặt lại mật khẩu"
      subtitle="Chọn mật khẩu mới — bạn sẽ dùng mật khẩu này cho lần đăng nhập tiếp theo."
      footer={
        <span>
          Đổi ý?{' '}
          <Link to="/login" className="text-text-link hover:underline">Về trang đăng nhập</Link>
        </span>
      }
    >
      <form onSubmit={submit} className="flex flex-col gap-sm">
        <Input
          type="password"
          leadingIcon="shield"
          placeholder="Mật khẩu mới"
          aria-label="Mật khẩu mới"
          autoComplete="new-password"
          required
          value={pw}
          onChange={(e) => setPw(e.target.value)}
          hint="Tối thiểu 8 ký tự, nên có chữ hoa và số."
        />
        <Input
          type="password"
          leadingIcon="shield"
          placeholder="Nhập lại mật khẩu mới"
          aria-label="Nhập lại mật khẩu mới"
          autoComplete="new-password"
          required
          value={pw2}
          onChange={(e) => setPw2(e.target.value)}
        />
        <Button type="submit" loading={loading} className="mt-xs">
          Lưu mật khẩu mới
        </Button>
      </form>
    </AuthLayout>
  );
}
