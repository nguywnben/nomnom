import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import Button from '../../components/Button.jsx';
import Card from '../../components/Card.jsx';
import Icon from '../../components/Icon.jsx';
import { formatVnd } from '../../lib/formatVnd.js';
import { apiGet } from '../../lib/api.js';

export default function VnpayReturn() {
  const [params] = useSearchParams();
  const nav = useNavigate();

  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('failed');
  const [orderCode, setOrderCode] = useState('');
  const [amount, setAmount] = useState(0);
  const [txn, setTxn] = useState('—');
  const [errorReason, setErrorReason] = useState('');
  const [autoTick, setAutoTick] = useState(6);

  useEffect(() => {
    const verifyPayment = async () => {
      const vnp_ResponseCode = params.get('vnp_ResponseCode');
      const vnp_TxnRef = params.get('vnp_TxnRef') || '';
      const vnp_Amount = Number(params.get('vnp_Amount') || 0) / 100;
      const vnp_TransactionNo = params.get('vnp_TransactionNo') || '—';

      setOrderCode(vnp_TxnRef);
      setAmount(vnp_Amount);
      setTxn(vnp_TransactionNo);

      // Nếu người dùng chọn hủy giao dịch trên cổng VNPay
      if (vnp_ResponseCode === '24') {
        setStatus('cancelled');
        setLoading(false);
        return;
      }

      try {
        // Gửi toàn bộ query parameters tới backend để đối soát
        const res = await apiGet(`/api/v1/payments/vnpay/verify${window.location.search}`);
        if (res.success) {
          setStatus('succeeded');
          setOrderCode(res.orderCode);
        } else {
          setStatus('failed');
          setErrorReason(res.reason || 'Xác thực thanh toán thất bại');
        }
      } catch (err) {
        setStatus('failed');
        setErrorReason(err.message || 'Lỗi hệ thống khi xác thực giao dịch');
      } finally {
        setLoading(false);
      }
    };

    verifyPayment();
  }, [params]);

  useEffect(() => {
    if (status !== 'succeeded') return undefined;
    if (autoTick <= 0) {
      nav(`/app/track/${orderCode}`, { replace: true });
      return undefined;
    }
    const t = setTimeout(() => setAutoTick((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [autoTick, status, orderCode, nav]);

  const view = useMemo(() => {
    if (status === 'succeeded') {
      return {
        icon: 'check',
        title: 'Thanh toán thành công',
        message: 'Cảm ơn bạn! Chúng tôi đã nhận thanh toán và đang chuyển đơn đến nhà hàng.',
        toneBg: 'bg-[#e6f4ea] text-success',
        primary: { label: 'Theo dõi đơn hàng', to: `/app/track/${orderCode}` },
        secondary: { label: 'Về trang chủ', to: '/app' },
      };
    }
    if (status === 'failed') {
      return {
        icon: 'alert',
        title: 'Thanh toán thất bại',
        message: errorReason || 'Giao dịch không thành công. Vui lòng thử lại hoặc dùng phương thức khác.',
        toneBg: 'bg-[#fbeaea] text-error',
        primary: { label: 'Thử lại', to: '/app/checkout' },
        secondary: { label: 'Về giỏ hàng', to: '/app' },
      };
    }
    return {
      icon: 'x',
      title: 'Bạn đã hủy thanh toán',
      message: 'Đơn hàng vẫn được lưu — bạn có thể quay lại thanh toán bất cứ lúc nào.',
      toneBg: 'bg-canvas-soft text-ink',
      primary: { label: 'Tiếp tục thanh toán', to: '/app/checkout' },
      secondary: { label: 'Về trang chủ', to: '/app' },
    };
  }, [status, errorReason, orderCode]);

  if (loading) {
    return (
      <div className="container-page py-xxl">
        <div className="mx-auto max-w-lg">
          <Card padded className="text-center py-xxl">
            <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-ink border-t-transparent" />
            <h1 className="mt-base text-title-lg text-ink">Đang xác thực giao dịch…</h1>
            <p className="mt-xs text-body-sm text-body">Vui lòng không đóng trình duyệt hoặc tải lại trang này.</p>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="container-page py-xxl">
      <div className="mx-auto max-w-lg">
        <Card padded className="text-center">
          <span
            className={
              'mx-auto grid h-16 w-16 place-items-center rounded-pill ' + view.toneBg
            }
          >
            <Icon name={view.icon} size={28} />
          </span>
          <h1 className="mt-base text-display-sm text-ink md:text-display-md">{view.title}</h1>
          <p className="mt-xs text-body-md text-body">{view.message}</p>

          <div className="mt-md grid grid-cols-1 gap-2 rounded-md border border-hairline-strong bg-canvas-soft p-base text-left text-body-sm md:grid-cols-2">
            <Row label="Mã đơn" value={orderCode ? orderCode.toUpperCase() : '—'} />
            <Row label="Mã giao dịch" value={txn} />
            <Row label="Số tiền" value={amount > 0 ? formatVnd(amount) : '—'} />
            <Row label="Phương thức" value="VNPay" />
          </div>

          <div className="mt-md flex flex-col gap-2 md:flex-row md:justify-center">
            <Button as={Link} to={view.primary.to} trailingIcon="arrowRight">
              {view.primary.label}
            </Button>
            <Button as={Link} to={view.secondary.to} variant="secondary">
              {view.secondary.label}
            </Button>
          </div>

          {status === 'succeeded' && autoTick > 0 && (
            <p className="mt-md text-caption text-body">
              Tự chuyển sang trang theo dõi sau <span className="nums">{autoTick}s</span>…
            </p>
          )}
        </Card>
      </div>
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-caption-uppercase text-body">{label}</span>
      <span className="nums text-body-sm font-medium text-ink truncate">{value}</span>
    </div>
  );
}
