import { Link } from 'react-router-dom';
import Badge from '../../components/Badge.jsx';
import Button from '../../components/Button.jsx';
import Card from '../../components/Card.jsx';
import Image from '../../components/Image.jsx';
import EmptyState from '../../components/EmptyState.jsx';
import { useApp } from '../../context/AppContext.jsx';
import { restaurants } from '../../data/mock.js';
import { formatVnd } from '../../lib/formatVnd.js';

const STATUS_TONE = {
  preparing: 'warning',
  delivering: 'success',
  delivered: 'default',
};

const STATUS_LABEL = {
  preparing: 'Đang chuẩn bị',
  delivering: 'Đang giao',
  delivered: 'Đã giao',
};

export default function CustomerOrders() {
  const { orders } = useApp();

  return (
    <div className="container-page py-xl">
      <div className="mb-base">
        <div className="text-caption-uppercase text-body">Lịch sử</div>
        <h1 className="text-display-lg text-ink">Đơn hàng của bạn</h1>
      </div>

      {orders.length === 0 ? (
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
            const r = restaurants.find((rr) => rr.id === o.restaurantId);
            return (
              <Card key={o.id} padded className="flex flex-col gap-sm md:flex-row md:items-center md:gap-base">
                <Image src={r?.banner} alt={r?.name} className="h-24 w-32 rounded-md" ratio="4/3" />
                <div className="flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-title-md text-ink">{r?.name}</div>
                    <Badge tone={STATUS_TONE[o.status]} dot>{STATUS_LABEL[o.status]}</Badge>
                  </div>
                  <div className="text-body-sm text-body">
                    {o.items.map((i) => `${i.quantity}× ${i.name}`).join(', ')}
                  </div>
                  <div className="mt-1 flex items-center gap-base text-caption text-body">
                    <span>#{o.id}</span>
                    <span>{new Date(o.placedAt).toLocaleString()}</span>
                    <span className="nums">{formatVnd(o.total)}</span>
                  </div>
                </div>
                <div className="flex items-center gap-xs">
                  {o.status !== 'delivered' && (
                    <Link to={`/app/track/${o.id}`}>
                      <Button size="sm">Theo dõi</Button>
                    </Link>
                  )}
                  <Link to={`/app/reviews/${o.restaurantId}`}>
                    <Button size="sm" variant="secondary">
                      Đánh giá
                    </Button>
                  </Link>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
