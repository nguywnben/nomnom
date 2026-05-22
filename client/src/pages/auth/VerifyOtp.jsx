import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import AuthLayout from './AuthLayout.jsx';
import Button from '../../components/Button.jsx';
import Icon from '../../components/Icon.jsx';
import { useApp } from '../../context/AppContext.jsx';
import {
  forgotPasswordResendCodeApi,
  forgotPasswordVerifyApi,
  registerResendCodeApi,
} from '../../lib/api.js';

const PURPOSE_TITLE = {
  register: 'Xác minh email',
  login: 'Đăng nhập bằng OTP',
  reset_password: 'Đặt lại mật khẩu',
};

const PURPOSE_SUB = {
  register: 'Nhập mã 6 chữ số trong email để hoàn tất tạo tài khoản NomNom.',
  login: 'Nhập mã 6 chữ số để hoàn tất đăng nhập.',
  reset_password: 'Nhập mã 6 chữ số để xác minh và đặt mật khẩu mới.',
};

export default function VerifyOtpPage() {
  const nav = useNavigate();
  const [params] = useSearchParams();
  const { pushToast, completeRegistration } = useApp();

  const purpose = params.get('purpose') || 'register';
  const dest = params.get('dest') || '';
  const next = params.get('next') || '/app';

  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const [seconds, setSeconds] = useState(60);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState('');
  const refs = useRef([]);

  useEffect(() => {
    if (seconds <= 0) return undefined;
    const t = setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [seconds]);

  const setDigit = (idx, v) => {
    if (!/^\d?$/.test(v)) return;
    setDigits((cur) => {
      const nextDigits = [...cur];
      nextDigits[idx] = v;
      return nextDigits;
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

  const submit = async (e) => {
    e.preventDefault();
    if (!canSubmit) return;

    if ((purpose === 'register' || purpose === 'reset_password') && !dest) {
      setError(
        purpose === 'register'
          ? 'Thiếu email đăng ký. Vui lòng quay lại form đăng ký.'
          : 'Thiếu email. Vui lòng quay lại trang quên mật khẩu.',
      );
      return;
    }

    setError('');
    setLoading(true);
    try {
      if (purpose === 'register') {
        await completeRegistration(dest, code);
        pushToast({
          kind: 'success',
          title: 'Đăng ký thành công',
          message: 'Chào mừng bạn đến với NomNom!',
        });
        nav('/app', { replace: true });
        return;
      }

      if (purpose === 'reset_password') {
        const { resetToken } = await forgotPasswordVerifyApi({ email: dest, code });
        nav(`/reset-password?token=${encodeURIComponent(resetToken)}`, { replace: true });
        return;
      }

      pushToast({ kind: 'success', title: 'Xác minh thành công', message: 'Mã hợp lệ.' });
      nav(next, { replace: true });
    } catch (err) {
      setError(err.message ?? 'Mã không hợp lệ.');
    } finally {
      setLoading(false);
    }
  };

  const resend = async () => {
    if ((purpose !== 'register' && purpose !== 'reset_password') || !dest) {
      pushToast({ kind: 'info', title: 'Sắp ra mắt', message: 'Chức năng gửi lại mã chưa khả dụng.' });
      return;
    }
    if (seconds > 0 || resending || loading) return;

    setResending(true);
    try {
      if (purpose === 'register') {
        await registerResendCodeApi(dest);
      } else {
        await forgotPasswordResendCodeApi(dest);
      }
      setSeconds(60);
      setDigits(['', '', '', '', '', '']);
      setError('');
      pushToast({ kind: 'info', title: 'Đã gửi lại mã', message: `Mã mới đã gửi đến ${dest}.` });
      refs.current[0]?.focus();
    } catch (err) {
      pushToast({ kind: 'error', title: 'Không gửi được', message: err.message ?? 'Thử lại sau.' });
    } finally {
      setResending(false);
    }
  };

  const resendDisabled = seconds > 0 || loading || resending;

  const backLink =
    purpose === 'register' ? '/register' : purpose === 'reset_password' ? '/forgot-password' : '/login';

  return (
    <AuthLayout
      title={PURPOSE_TITLE[purpose] || PURPOSE_TITLE.register}
      subtitle={PURPOSE_SUB[purpose] || PURPOSE_SUB.register}
      footer={
        <span>
          Sai email hoặc cần sửa thông tin?{' '}
          <Link to={backLink} className="text-text-link hover:underline">
            Quay lại
          </Link>
        </span>
      }
    >
      <div className="mb-base inline-flex items-center gap-2 rounded-md border border-hairline-strong bg-canvas-soft px-base py-2 text-caption text-body">
        <Icon name="mail" size={14} />
        Mã đã gửi tới <span className="font-medium text-ink">{dest || 'email của bạn'}</span>
      </div>

      <form onSubmit={submit} className="flex flex-col gap-sm">
        <div className="grid grid-cols-6 gap-2" onPaste={onPaste}>
          {digits.map((d, i) => (
            <input
              key={i}
              ref={(el) => {
                refs.current[i] = el;
              }}
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

        {error && (
          <p className="text-caption text-error" role="alert">
            {error}
          </p>
        )}

        <div className="flex items-center justify-between text-caption text-body">
          <span>
            {seconds > 0 ? (
              <>
                Gửi lại sau <span className="nums">{seconds}s</span>
              </>
            ) : (
              'Chưa nhận được mã?'
            )}
          </span>
          <button
            type="button"
            disabled={resendDisabled}
            onClick={resend}
            aria-busy={resending}
            className="inline-flex items-center gap-1.5 text-text-link hover:underline disabled:cursor-not-allowed disabled:text-muted-soft disabled:no-underline disabled:opacity-60"
          >
            {resending && <Icon name="spinner" size={14} className="animate-spin" />}
            {resending ? 'Đang gửi…' : 'Gửi lại mã'}
          </button>
        </div>

        <Button type="submit" disabled={!canSubmit} loading={loading} className="mt-xs">
          {purpose === 'register'
            ? 'Hoàn tất đăng ký'
            : purpose === 'reset_password'
              ? 'Tiếp tục đặt mật khẩu'
              : 'Xác minh'}
        </Button>
      </form>
    </AuthLayout>
  );
}
