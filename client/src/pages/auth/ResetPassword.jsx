import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import AuthLayout from './AuthLayout.jsx';
import Button from '../../components/Button.jsx';
import Input from '../../components/Input.jsx';
import { useApp } from '../../context/AppContext.jsx';
import { resetPasswordApi } from '../../lib/api.js';

export default function ResetPasswordPage() {
  const nav = useNavigate();
  const [params] = useSearchParams();
  const resetToken = params.get('token') || '';
  const { pushToast } = useApp();

  const [pw, setPw] = useState('');
  const [pw2, setPw2] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!resetToken) {
    return (
      <AuthLayout
        title="Liên kết không hợp lệ"
        subtitle="Phiên đặt lại mật khẩu đã hết hạn hoặc thiếu mã xác minh."
        footer={
          <Link to="/forgot-password" className="text-text-link hover:underline">
            Yêu cầu mã mới
          </Link>
        }
      >
        <Button as={Link} to="/forgot-password">
          Quên mật khẩu
        </Button>
      </AuthLayout>
    );
  }

  const submit = async (e) => {
    e.preventDefault();
    if (pw.length < 8) {
      pushToast({ kind: 'error', title: 'Mật khẩu quá ngắn', message: 'Mật khẩu cần tối thiểu 8 ký tự.' });
      return;
    }
    if (pw !== pw2) {
      pushToast({ kind: 'error', title: 'Mật khẩu không khớp', message: 'Hai ô mật khẩu phải giống nhau.' });
      return;
    }

    setError('');
    setLoading(true);
    try {
      await resetPasswordApi({ resetToken, password: pw });
      pushToast({
        kind: 'success',
        title: 'Đã đặt lại mật khẩu',
        message: 'Hãy đăng nhập bằng mật khẩu mới.',
      });
      nav('/login', { replace: true });
    } catch (err) {
      setError(err.message ?? 'Không đặt lại được mật khẩu.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Đặt lại mật khẩu"
      subtitle="Chọn mật khẩu mới — bạn sẽ dùng mật khẩu này cho lần đăng nhập tiếp theo."
      footer={
        <span>
          Đổi ý?{' '}
          <Link to="/login" className="text-text-link hover:underline">
            Về trang đăng nhập
          </Link>
        </span>
      }
    >
      <form onSubmit={submit} className="flex flex-col gap-sm">
        <Input
          type={showPw ? 'text' : 'password'}
          leadingIcon="shield"
          placeholder="Mật khẩu mới"
          aria-label="Mật khẩu mới"
          autoComplete="new-password"
          required
          value={pw}
          onChange={(e) => {
            const v = e.target.value;
            setPw(v);
            if (!v) setShowPw(false);
          }}
          hint="Tối thiểu 8 ký tự."
          trailingButton={
            pw.length > 0
              ? {
                  icon: showPw ? 'eyeOff' : 'eye',
                  onClick: () => setShowPw((s) => !s),
                  'aria-label': showPw ? 'Ẩn mật khẩu' : 'Hiện mật khẩu',
                }
              : undefined
          }
        />
        <Input
          type={showPw ? 'text' : 'password'}
          leadingIcon="shield"
          placeholder="Nhập lại mật khẩu mới"
          aria-label="Nhập lại mật khẩu mới"
          autoComplete="new-password"
          required
          value={pw2}
          onChange={(e) => setPw2(e.target.value)}
        />

        {error && (
          <p className="text-caption text-error" role="alert">
            {error}
          </p>
        )}

        <Button type="submit" loading={loading} className="mt-xs">
          Lưu mật khẩu mới
        </Button>
      </form>
    </AuthLayout>
  );
}
