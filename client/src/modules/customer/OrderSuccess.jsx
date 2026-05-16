import { Link, useNavigate, useParams } from 'react-router-dom';
import Badge from '../../components/Badge.jsx';
import Button from '../../components/Button.jsx';
import Card from '../../components/Card.jsx';
import Icon from '../../components/Icon.jsx';
import { useApp } from '../../context/AppContext.jsx';
import { formatVnd } from '../../lib/formatVnd.js';

export default function OrderSuccess() {
  const { id } = useParams();
  const { orders } = useApp();
  const order = orders.find((o) => o.id === id) || orders[0];
  const nav = useNavigate();

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

        <Card padded className="mt-xl text-left">
          <div className="mb-sm flex items-center justify-between">
            <div className="text-caption-uppercase text-body">Mã đơn hàng</div>
            <Badge tone="outline">{order?.id}</Badge>
          </div>
          <div className="flex flex-col divide-y divide-hairline">
            <Row label="Thời gian dự kiến" value="~28 phút" />
            <Row label="Thanh toán" value={order?.payment ?? 'card'} />
            <Row label="Tạm tính" value={formatVnd(order?.subtotal ?? 0)} />
            <Row label="Phí giao hàng" value={formatVnd(order?.deliveryFee ?? 0)} />
            {order?.discount > 0 && (
              <Row label="Khuyến mãi" value={`−${formatVnd(order.discount)}`} tone="success" />
            )}
            <Row label="Tổng cộng" value={formatVnd(order?.total ?? 0)} bold />
          </div>
        </Card>

        <div className="mt-md flex flex-wrap items-center justify-center gap-xs">
          <Button onClick={() => nav('/app/track/' + (order?.id ?? ''))} trailingIcon="arrowRight">
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
