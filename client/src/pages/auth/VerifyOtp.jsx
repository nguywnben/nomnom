import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import AuthLayout from './AuthLayout.jsx';
import Button from '../../components/Button.jsx';
import Icon from '../../components/Icon.jsx';
import { useApp } from '../../context/AppContext.jsx';

const PURPOSE_TITLE = {
  register: 'Xác minh tài khoản',
  login: 'Đăng nhập bằng OTP',
  reset_password: 'Đặt lại mật khẩu',
};

const PURPOSE_SUB = {
  register: 'Nhập mã 6 chữ số chúng tôi vừa gửi để hoàn tất đăng ký.',
  login: 'Nhập mã 6 chữ số để hoàn tất đăng nhập.',
  reset_password: 'Nhập mã 6 chữ số để xác minh và đặt mật khẩu mới.',
};

// Nhập OTP — khớp với bảng `otp_codes` (purpose + attempts + expires_at).
// 6 ô số, tự động chuyển focus & paste 6 ký tự.
export default function VerifyOtpPage() {
  const nav = useNavigate();
  const [params] = useSearchParams();
  const { pushToast } = useApp();

  const purpose = params.get('purpose') || 'register';
  const dest = params.get('dest') || '';
  const next = params.get('next') || '/app';

  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const [seconds, setSeconds] = useState(60);
  const [loading, setLoading] = useState(false);
  const refs = useRef([]);

  useEffect(() => {
    if (seconds <= 0) return undefined;
    const t = setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [seconds]);

  const setDigit = (idx, v) => {
    if (!/^\d?$/.test(v)) return;
    setDigits((cur) => {
      const next = [...cur];
      next[idx] = v;
      return next;
    });
    if (v && idx < 5) refs.current[idx + 1]?.focus();
  };

  const onKeyDown = (idx, e) => {
    if (e.key === 'Backspace' && !digits[idx] && idx > 0) {
      refs.current[idx - 1]?.focus();
    }
  };

  const onPaste = (e) => {
    const text = (e.clipboardData.getData('text') || '').replace(/\D/g, '').slice(0, 6);
    if (!text) return;
    e.preventDefault();
    const arr = ['', '', '', '', '', ''];
    text.split('').forEach((c, i) => (arr[i] = c));
    setDigits(arr);
    refs.current[Math.min(text.length, 5)]?.focus();
  };

  const code = digits.join('');
  const canSubmit = code.length === 6 && !loading;

  const submit = (e) => {
    e.preventDefault();
    if (!canSubmit) return;
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      pushToast({ kind: 'success', title: 'Xác minh thành công', message: 'Mã hợp lệ.' });
      if (purpose === 'reset_password') {
        nav(`/reset-password?token=${encodeURIComponent(code)}`);
      } else if (purpose === 'register') {
        nav('/app', { replace: true });
      } else {
        nav(next, { replace: true });
      }
    }, 500);
  };

  const resend = () => {
    setSeconds(60);
    setDigits(['', '', '', '', '', '']);
    pushToast({ kind: 'info', title: 'Đã gửi lại mã', message: `Mã mới đã gửi đến ${dest}.` });
    refs.current[0]?.focus();
  };

  return (
    <AuthLayout
      title={PURPOSE_TITLE[purpose] || PURPOSE_TITLE.register}
      subtitle={PURPOSE_SUB[purpose] || PURPOSE_SUB.register}
      footer={
        <span>
          Sai địa chỉ?{' '}
          <Link to="/login" className="text-text-link hover:underline">Quay lại</Link>
        </span>
      }
    >
      <div className="mb-base inline-flex items-center gap-2 rounded-md border border-hairline-strong bg-canvas-soft px-base py-2 text-caption text-body">
        <Icon name="mail" size={14} />
        Mã đã gửi tới <span className="font-medium text-ink">{dest || 'địa chỉ của bạn'}</span>
      </div>

      <form onSubmit={submit} className="flex flex-col gap-sm">
        <div className="grid grid-cols-6 gap-2" onPaste={onPaste}>
          {digits.map((d, i) => (
            <input
              key={i}
              ref={(el) => (refs.current[i] = el)}
              value={d}
              onChange={(e) => setDigit(i, e.target.value)}
              onKeyDown={(e) => onKeyDown(i, e)}
              inputMode="numeric"
              maxLength={1}
              aria-label={`Chữ số ${i + 1}`}
              className="h-14 rounded-md border border-hairline-strong bg-surface-card text-center text-display-sm text-ink outline-none focus:border-ink"
            />
          ))}
        </div>

        <div className="flex items-center justify-between text-caption text-body">
          <span>
            {seconds > 0 ? (
              <>Gửi lại sau <span className="nums">{seconds}s</span></>
            ) : (
              'Chưa nhận được mã?'
            )}
          </span>
          <button
            type="button"
            disabled={seconds > 0}
            onClick={resend}
            className="text-text-link hover:underline disabled:cursor-not-allowed disabled:text-muted-soft"
          >
            Gửi lại mã
          </button>
        </div>

        <Button type="submit" disabled={!canSubmit} loading={loading} className="mt-xs">
          Xác minh
        </Button>
      </form>
    </AuthLayout>
  );
}
