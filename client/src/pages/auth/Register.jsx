import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthLayout from './AuthLayout.jsx';
import Button from '../../components/Button.jsx';
import Input from '../../components/Input.jsx';
import Icon from '../../components/Icon.jsx';
import { useApp } from '../../context/AppContext.jsx';

// Đăng ký theo bảng `users` (full_name, email/phone, password_hash, primary_role).
// Sau khi submit → chuyển sang trang nhập OTP (otp_codes.purpose = 'register').
export default function RegisterPage() {
  const nav = useNavigate();
  const { pushToast } = useApp();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [agree, setAgree] = useState(true);
  const [role, setRole] = useState('customer');
  const [loading, setLoading] = useState(false);

  const submit = (e) => {
    e.preventDefault();
    if (!agree) {
      pushToast({ kind: 'error', title: 'Cần đồng ý điều khoản', message: 'Hãy đồng ý điều khoản để tiếp tục.' });
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      pushToast({ kind: 'info', title: 'Đã gửi mã OTP', message: 'Vui lòng kiểm tra điện thoại để xác minh.' });
      nav(`/verify-otp?purpose=register&dest=${encodeURIComponent(phone || email)}&role=${role}`);
    }, 700);
  };

  return (
    <AuthLayout
      title="Tạo tài khoản"
      subtitle="Tạo tài khoản NomNom miễn phí — bạn có thể chọn vai trò sau khi xác minh."
      footer={
        <span>
          Đã có tài khoản?{' '}
          <Link to="/login" className="text-text-link hover:underline">Đăng nhập</Link>
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
          placeholder="Email (không bắt buộc nếu có số điện thoại)"
          aria-label="Email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <Input
          leadingIcon="phone"
          placeholder="Số điện thoại"
          aria-label="Số điện thoại"
          inputMode="tel"
          autoComplete="tel"
          required
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          hint="Dùng để nhận mã OTP và thông báo đơn hàng."
        />
        <Input
          type={showPw ? 'text' : 'password'}
          leadingIcon="shield"
          placeholder="Mật khẩu (tối thiểu 8 ký tự)"
          aria-label="Mật khẩu"
          autoComplete="new-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          hint="Nên gồm chữ hoa, chữ thường, số."
        />

        <div className="flex items-center gap-1.5 text-caption text-body">
          <button
            type="button"
            className="text-text-link hover:underline"
            onClick={() => setShowPw((s) => !s)}
          >
            {showPw ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
          </button>
        </div>

        <fieldset className="rounded-md border border-hairline-strong p-sm">
          <legend className="px-1 text-caption-uppercase text-body">Bạn muốn đăng ký với vai trò</legend>
          <div className="grid grid-cols-3 gap-1.5">
            {[
              { value: 'customer', label: 'Khách hàng', icon: 'user' },
              { value: 'merchant', label: 'Chủ quán', icon: 'store' },
              { value: 'driver', label: 'Tài xế', icon: 'bike' },
            ].map((r) => {
              const active = role === r.value;
              return (
                <button
                  key={r.value}
                  type="button"
                  onClick={() => setRole(r.value)}
                  className={
                    'flex flex-col items-center gap-1 rounded-md border px-2 py-2 text-caption transition-colors ' +
                    (active
                      ? 'border-ink bg-primary text-on-primary'
                      : 'border-hairline-strong bg-surface-card text-ink hover:bg-canvas-soft')
                  }
                >
                  <Icon name={r.icon} size={16} />
                  {r.label}
                </button>
              );
            })}
          </div>
          {role !== 'customer' && (
            <p className="mt-2 text-caption text-body">
              Sau khi xác minh OTP, bạn sẽ được dẫn đến trang hoàn thiện hồ sơ {role === 'merchant' ? 'quán' : 'tài xế'} (KYC).
            </p>
          )}
        </fieldset>

        <label className="mt-xs flex items-start gap-2 text-caption text-body">
          <input
            type="checkbox"
            className="mt-0.5 accent-black"
            checked={agree}
            onChange={(e) => setAgree(e.target.checked)}
          />
          <span>
            Tôi đồng ý với{' '}
            <Link to="/" className="text-text-link hover:underline">Điều khoản sử dụng</Link> và{' '}
            <Link to="/" className="text-text-link hover:underline">Chính sách bảo mật</Link> của NomNom.
          </span>
        </label>

        <Button type="submit" loading={loading} className="mt-xs">
          Tạo tài khoản
        </Button>
      </form>
    </AuthLayout>
  );
}
