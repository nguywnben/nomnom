import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Badge from '../../components/Badge.jsx';
import Button from '../../components/Button.jsx';
import Card from '../../components/Card.jsx';
import Image from '../../components/Image.jsx';
import EmptyState from '../../components/EmptyState.jsx';
import Tabs from '../../components/Tabs.jsx';
import Pagination from '../../components/Pagination.jsx';
import Icon from '../../components/Icon.jsx';
import { apiGet } from '../../lib/api.js';
import { formatVnd } from '../../lib/formatVnd.js';

const STATUS_TONE = {
  pending_payment: 'warning',
  payment_failed: 'critical',
  placed: 'warning',
  accepted: 'warning',
  preparing: 'warning',
  ready_for_pickup: 'warning',
  picked_up: 'delivering',
  delivering: 'success',
  delivered: 'default',
  cancelled: 'critical',
  failed: 'critical',
  expired: 'critical',
};

const STATUS_LABEL = {
  pending_payment: 'Chờ thanh toán',
  payment_failed: 'Thanh toán chưa thành công',
  placed: 'Đã đặt',
  accepted: 'Đã nhận đơn',
  preparing: 'Đang chuẩn bị',
  ready_for_pickup: 'Sẵn sàng lấy',
  picked_up: 'Tài xế đã lấy',
  delivering: 'Đang giao',
  delivered: 'Đã giao',
  cancelled: 'Đã hủy',
  failed: 'Thất bại',
  expired: 'Hết hạn',
};

export default function CustomerOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [total, setTotal] = useState(0);

  useEffect(() => {
    setLoading(true);
    const query = new URLSearchParams();
    if (filterStatus !== 'all') {
      query.set('status', filterStatus);
    }
    query.set('page', page.toString());
    query.set('limit', pageSize.toString());

    apiGet('/api/v1/me/orders?' + query.toString())
      .then((res) => {
        setOrders(res?.data || []);
        setTotal(res?.pagination?.total || 0);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [filterStatus, page]);

  return (
    <div className="container-page py-xl">
      <div className="mb-base flex flex-col justify-between gap-base md:flex-row md:items-end">
        <div>
          <div className="text-caption-uppercase text-body">Lịch sử</div>
          <h1 className="text-display-lg text-ink">Đơn hàng của bạn</h1>
        </div>
        <div className="shrink-0">
          <Tabs
            items={[
              { value: 'all', label: 'Tất cả' },
              { value: 'active', label: 'Đang giao' },
              { value: 'delivered', label: 'Đã giao' },
              { value: 'cancelled', label: 'Đã huỷ' },
            ]}
            value={filterStatus}
            onChange={(val) => {
              setFilterStatus(val);
              setPage(1);
            }}
          />
        </div>
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
          <div className="flex flex-col gap-base">
            {orders.map((order) => (
              <Card
                key={order.id}
                as={Link}
                to={`/app/track/${order.orderCode}`}
                className="flex items-center gap-base p-base no-underline"
              >
                <Image
                  src={order.restaurantBanner}
                  alt={order.restaurantName}
                  className="h-20 w-24 shrink-0 rounded-md object-cover"
                  ratio="4/3"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <div className="truncate text-title-md text-ink">{order.restaurantName || 'Quán ăn'}</div>
                    <Badge tone={STATUS_TONE[order.status] ?? 'default'} dot>
                      {STATUS_LABEL[order.status] ?? order.status}
                    </Badge>
                  </div>
                  <p className="mt-1 truncate text-body-sm text-body">
                    {(order.items ?? []).map((item) => `${item.quantity}x ${item.name}`).join(', ')}
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-x-base gap-y-1 text-caption text-body">
                    <span>#{order.orderCode}</span>
                    <span>{new Date(order.placedAt).toLocaleString('vi-VN')}</span>
                    <span className="nums font-semibold text-ink">{formatVnd(Number(order.totalAmount))}</span>
                  </div>
                </div>
                <Icon name="arrowRight" size={18} className="shrink-0 text-body" />
              </Card>
            ))}
          </div>

          <Pagination
            total={total}
            pageSize={pageSize}
            page={page}
            onChange={setPage}
            className="mt-lg border-t border-hairline pt-base"
          />
        </div>
      )}

    </div>
  );
}
