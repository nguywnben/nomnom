import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import Button from '../../components/Button.jsx';
import Card from '../../components/Card.jsx';
import Icon from '../../components/Icon.jsx';
import { useApp } from '../../context/AppContext.jsx';
import { formatVnd } from '../../lib/formatVnd.js';
import { apiGet } from '../../lib/api.js';

export default function VnpayReturn() {
  const [params] = useSearchParams();
  const nav = useNavigate();
  const { clearCart } = useApp();

  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('failed');
  const [orderCode, setOrderCode] = useState('');
  const [amount, setAmount] = useState(0);
  const [txn, setTxn] = useState('—');
  const [errorReason, setErrorReason] = useState('');
  const [autoTick, setAutoTick] = useState(6);

  useEffect(() => {
    let disposed = false;

    const verifyPayment = async () => {
      const responseCode = params.get('vnp_ResponseCode');
      const gatewayReference = params.get('vnp_TxnRef') || '';
      const paidAmount = Number(params.get('vnp_Amount') || 0) / 100;
      const transactionNo = params.get('vnp_TransactionNo') || '-';

      setAmount(paidAmount);
      setTxn(transactionNo);

      try {
        for (let attempt = 0; attempt < 6; attempt += 1) {
          const result = await apiGet('/api/v1/payments/vnpay/return' + window.location.search);
          if (disposed) return;

          if (result.success) {
            setStatus('succeeded');
            setOrderCode(result.orderCode);
            setLoading(false);
            return;
          }
          if (!result.pending) {
            setStatus(responseCode === '24' ? 'cancelled' : 'failed');
            setOrderCode(result.orderCode || gatewayReference);
            setErrorReason(result.reason || 'Payment verification failed.');
            setLoading(false);
            return;
          }
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }

        if (!disposed) {
          setStatus('processing');
          setErrorReason('VNPay đã tiếp nhận giao dịch. Hệ thống vẫn đang chờ xác nhận từ máy chủ.');
          setLoading(false);
        }
      } catch (error) {
        if (!disposed) {
          setStatus('failed');
          setErrorReason(error.message || 'Payment verification failed.');
          setLoading(false);
        }
      }
    };

    verifyPayment();
    return () => {
      disposed = true;
    };
  }, [params]);

  useEffect(() => {
    if (status !== 'succeeded') return;
    clearCart({ localOnly: true });
  }, [clearCart, status]);

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
        message: 'Cảm ơn bạn! Chúng tôi đã nhận thanh toán và đang chuyển đơn đến quán ăn.',
        toneBg: 'bg-[#e6f4ea] text-success',
        primary: { label: 'Theo dõi đơn hàng', to: `/app/track/${orderCode}` },
        secondary: { label: 'Về trang chủ', to: '/app' },
      };
    }
    if (status === 'processing') {
      return {
        icon: 'clock',
        title: 'Đang chờ xác nhận thanh toán',
        message: errorReason,
        toneBg: 'bg-canvas-soft text-ink',
        primary: { label: 'Xem đơn hàng', to: '/app/orders' },
        secondary: { label: 'Về trang chủ', to: '/app' },
      };
    }
    if (status === 'failed') {
      return {
        icon: 'alert',
        title: 'Thanh toán thất bại',
        message: errorReason || 'Giao dịch không thành công. Vui lòng thử lại hoặc dùng phương thức khác.',
        toneBg: 'bg-[#fbeaea] text-error',
        primary: orderCode
          ? { label: 'Thanh toán lại đơn này', to: `/app/track/${orderCode}` }
          : { label: 'Xem đơn hàng', to: '/app/orders' },
        secondary: { label: 'Về trang chủ', to: '/app' },
      };
    }
    return {
      icon: 'x',
      title: 'Bạn đã hủy thanh toán',
      message: 'Đơn hàng vẫn được lưu — bạn có thể quay lại thanh toán bất cứ lúc nào.',
      toneBg: 'bg-canvas-soft text-ink',
      primary: orderCode
        ? { label: 'Tiếp tục thanh toán', to: `/app/track/${orderCode}` }
        : { label: 'Xem đơn hàng', to: '/app/orders' },
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
