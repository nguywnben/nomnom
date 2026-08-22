import { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import Badge from '../../components/Badge.jsx';
import Button from '../../components/Button.jsx';
import Card from '../../components/Card.jsx';
import Icon from '../../components/Icon.jsx';
import { formatVnd } from '../../lib/formatVnd.js';
import { apiGet } from '../../lib/api.js';

export default function OrderSuccess() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [error, setError] = useState('');
  const nav = useNavigate();

  useEffect(() => {
    let active = true;
    apiGet('/api/v1/orders/' + id)
      .then((data) => {
        if (active) setOrder(data);
      })
      .catch((err) => {
        if (active) setError(err.message || 'Không tìm thấy đơn hàng.');
      });
    return () => { active = false; };
  }, [id]);

  if (error) {
    return (
      <div className="container-page py-xl">
        <Card padded className="mx-auto max-w-md text-center">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-pill bg-[#fbeaea] text-error">
            <Icon name="alert" size={22} />
          </span>
          <h1 className="mt-base text-display-sm text-ink">Không tìm thấy đơn hàng</h1>
          <p className="mt-xs text-body-sm text-body">{error}</p>
          <div className="mt-base flex flex-wrap items-center justify-center gap-xs">
            <Button onClick={() => nav('/app/orders')}>Xem đơn hàng của tôi</Button>
            <Button as={Link} to="/app" variant="secondary">Về trang chủ</Button>
          </div>
        </Card>
      </div>
    );
  }

  if (!order) {
    return <div className="container-page py-xxl text-center">Đang tải...</div>;
  }

  // Tính toán thời gian dự kiến (ETA) một cách tương đối hoặc hiển thị tuyệt đối
  const formatTime = (isoString) => {
    if (!isoString) return '--:--';
    return new Date(isoString).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="container-page py-xxl">
      <div className="mx-auto max-w-2xl text-center">
        <span className="inline-grid h-14 w-14 place-items-center rounded-pill bg-[#e6f4ea] text-success">
          <Icon name="check" size={22} />
        </span>
        <h1 className="mt-md text-display-lg text-ink">Đã đặt hàng.</h1>
        <p className="mt-xs text-body-md text-body">
          Chúng tôi đã gửi đơn hàng của bạn đến nhà bếp và điều phối tài xế. Chúng tôi sẽ cập nhật cho bạn.
        </p>

        <Card padded hover={false} className="mt-xl text-left">
          <div className="mb-sm flex items-center justify-between">
            <div className="text-caption-uppercase text-body">Mã đơn hàng</div>
            <Badge tone="outline">{order.order_code}</Badge>
          </div>
          <div className="flex flex-col divide-y divide-hairline">
            <Row label="Thời gian dự kiến" value={formatTime(order.estimated_delivery_at)} />
            <Row label="Thanh toán" value={order.payment_method === 'cod' ? 'Thanh toán khi nhận hàng' : 'VNPay'} />
            <Row label="Tạm tính" value={formatVnd(Number(order.subtotal ?? 0))} />
            <Row label="Phí giao hàng" value={formatVnd(Number(order.delivery_fee ?? 0))} />
            {Number(order.discount_amount) > 0 && (
              <Row label="Khuyến mãi" value={`−${formatVnd(Number(order.discount_amount))}`} tone="success" />
            )}
            <Row label="Tổng cộng" value={formatVnd(Number(order.total_amount ?? 0))} bold />
          </div>
        </Card>

        <div className="mt-md flex flex-wrap items-center justify-center gap-xs">
          <Button onClick={() => nav('/app/track/' + order.order_code)} trailingIcon="arrowRight">
            Theo dõi đơn hàng
          </Button>
          <Link to="/app">
            <Button variant="secondary">Về trang chủ</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, bold, tone }) {
  return (
    <div className="flex items-center justify-between py-2">
      <span className={'text-body-sm ' + (tone === 'success' ? 'text-success' : 'text-body')}>{label}</span>
      <span className={'nums ' + (bold ? 'text-display-sm text-ink' : 'text-body-sm text-ink')}>{value}</span>
    </div>
  );
}
