import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Badge from '../../components/Badge.jsx';
import Button from '../../components/Button.jsx';
import Card from '../../components/Card.jsx';
import Image from '../../components/Image.jsx';
import EmptyState from '../../components/EmptyState.jsx';
import { apiGet } from '../../lib/api.js';
import { formatVnd } from '../../lib/formatVnd.js';

const STATUS_TONE = {
  pending_payment: 'warning',
  placed: 'warning',
  accepted: 'warning',
  preparing: 'warning',
  ready_for_pickup: 'warning',
  picked_up: 'delivering',
  delivering: 'success',
  delivered: 'default',
  cancelled: 'critical',
  failed: 'critical',
};

const STATUS_LABEL = {
  pending_payment: 'Chờ thanh toán',
  placed: 'Đã đặt',
  accepted: 'Đã nhận đơn',
  preparing: 'Đang chuẩn bị',
  ready_for_pickup: 'Sẵn sàng lấy',
  picked_up: 'Tài xế đã lấy',
  delivering: 'Đang giao',
  delivered: 'Đã giao',
  cancelled: 'Đã hủy',
  failed: 'Thất bại',
};

export default function CustomerOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // We assume backend has a GET /api/v1/orders route for history
    // Since backend has GET /api/v1/orders/:id, let's suppose there's a list route GET /api/v1/orders
    apiGet('/api/v1/orders')
      .then((data) => {
        setOrders(data || []);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="container-page py-xl">
      <div className="mb-base">
        <div className="text-caption-uppercase text-body">Lịch sử</div>
        <h1 className="text-display-lg text-ink">Đơn hàng của bạn</h1>
      </div>

      {loading ? (
        <div className="text-center py-section">Đang tải...</div>
      ) : orders.length === 0 ? (
        <EmptyState
          icon="package"
          title="Chưa có đơn hàng nào"
          message="Sau khi bạn đặt món, trạng thái đơn hàng sẽ hiển thị trực tiếp ở đây."
          action={
            <Link to="/app/search">
              <Button>Tìm quán ăn</Button>
            </Link>
          }
        />
      ) : (
        <div className="flex flex-col gap-base">
          {orders.map((o) => {
            const statusLabel = STATUS_LABEL[o.status] || o.status;
            const toneColor = STATUS_TONE[o.status] || 'default';
            return (
              <Card key={o.id} padded className="flex flex-col gap-sm md:flex-row md:items-center md:gap-base">
                <Image src={o.restaurant?.banner_url} alt={o.restaurant?.name} className="h-24 w-32 rounded-md" ratio="4/3" />
                <div className="flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-title-md text-ink">{o.restaurant?.name || 'Nhà hàng'}</div>
                    <Badge tone={toneColor} dot>{statusLabel}</Badge>
                  </div>
                  <div className="text-body-sm text-body">
                    {/* Make sure order_items are included in the array elements */}
                    {o.items?.map((i) => `${i.quantity}× ${i.item_name_snapshot}`).join(', ')}
                  </div>
                  <div className="mt-1 flex items-center gap-base text-caption text-body">
                    <span>#{o.order_code}</span>
                    <span>{new Date(o.placed_at).toLocaleString('vi-VN')}</span>
                    <span className="nums">{formatVnd(Number(o.total_amount))}</span>
                  </div>
                </div>
                <div className="flex items-center gap-xs">
                  {o.status !== 'delivered' && o.status !== 'cancelled' && o.status !== 'failed' && (
                    <Link to={`/app/track/${o.order_code}`}>
                      <Button size="sm">Theo dõi</Button>
                    </Link>
                  )}
                  {o.status === 'delivered' && !o.isReviewed && (
                    <Link to={`/app/reviews/write/${o.id}`}>
                      <Button size="sm" variant="secondary">
                        Đánh giá
                      </Button>
                    </Link>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
