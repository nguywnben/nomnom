import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import Button from '../../components/Button.jsx';
import Card from '../../components/Card.jsx';
import Icon from '../../components/Icon.jsx';
import { formatVnd } from '../../lib/formatVnd.js';

// Trang nhận redirect từ VNPay sau khi thanh toán — đọc query string giả lập
// rồi hiển thị 1 trong 3 trạng thái (success / failed / cancelled), khớp với
// bảng `payments.status` trong database.sql.
//
// URL ví dụ:
//   /app/checkout/vnpay/return?status=succeeded&order=ord-a1b2c&amount=458000&txn=VNP1234567
//   /app/checkout/vnpay/return?status=failed&reason=Insufficient%20funds
//   /app/checkout/vnpay/return?status=cancelled
export default function VnpayReturn() {
  const [params] = useSearchParams();
  const nav = useNavigate();

  const status = params.get('status') || 'succeeded';
  const orderId = params.get('order') || 'ord-demo';
  const amount = Number(params.get('amount') || 0);
  const txn = params.get('txn') || '—';
  const reason = params.get('reason') || '';

  const [autoTick, setAutoTick] = useState(6);

  useEffect(() => {
    if (status !== 'succeeded') return undefined;
    if (autoTick <= 0) {
      nav(`/app/track/${orderId}`, { replace: true });
      return undefined;
    }
    const t = setTimeout(() => setAutoTick((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [autoTick, status, orderId, nav]);

  const view = useMemo(() => {
    if (status === 'succeeded') {
      return {
        icon: 'check',
        title: 'Thanh toán thành công',
        message: 'Cảm ơn bạn! Chúng tôi đã nhận thanh toán và đang chuyển đơn đến nhà hàng.',
        toneBg: 'bg-[#e6f4ea] text-success',
        primary: { label: 'Theo dõi đơn hàng', to: `/app/track/${orderId}` },
        secondary: { label: 'Về trang chủ', to: '/app' },
      };
    }
    if (status === 'failed') {
      return {
        icon: 'alert',
        title: 'Thanh toán thất bại',
        message: reason || 'Giao dịch không thành công. Vui lòng thử lại hoặc dùng phương thức khác.',
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
  }, [status, reason, orderId]);

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
            <Row label="Mã đơn" value={orderId.toUpperCase()} />
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
