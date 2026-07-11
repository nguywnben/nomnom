import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import Badge from '../../components/Badge.jsx';
import Button from '../../components/Button.jsx';
import Card from '../../components/Card.jsx';
import Icon from '../../components/Icon.jsx';
import Avatar from '../../components/Avatar.jsx';
import EmptyState from '../../components/EmptyState.jsx';
import { apiGet } from '../../lib/api.js';
import { formatVnd } from '../../lib/formatVnd.js';

export default function RestaurantReviews() {
  const { id } = useParams(); // ID nhà hàng
  const nav = useNavigate();
  
  const [restaurant, setRestaurant] = useState(null);
  const [orders, setOrders] = useState([]);
  const [restaurantReviews, setRestaurantReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);

    const loadData = async () => {
      try {
        // 1. Lấy thông tin nhà hàng
        const restData = await apiGet('/api/v1/restaurants/' + id);
        if (!active) return;
        setRestaurant(restData);

        // 2. Lấy danh sách các đơn hàng đã đặt của quán
        const ordersData = await apiGet('/api/v1/orders?restaurantId=' + id);
        if (!active) return;
        // Chỉ lọc các đơn hàng đã giao thành công (delivered)
        const deliveredOrders = (ordersData || []).filter(o => o.status === 'delivered');
        setOrders(deliveredOrders);

        // 3. Lấy đánh giá của các khách hàng khác
        const reviewsData = await apiGet(`/api/v1/restaurants/${id}/reviews?limit=10`);
        if (!active) return;
        setRestaurantReviews(reviewsData?.data || []);

      } catch (err) {
        if (active) setError(err.message || 'Không thể tải thông tin dữ liệu.');
      } finally {
        if (active) setLoading(false);
      }
    };

    loadData();

    return () => {
      active = false;
    };
  }, [id]);

  if (loading) {
    return <div className="container-page py-section text-center">Đang tải danh sách...</div>;
  }

  if (error || !restaurant) {
    return (
      <div className="container-page py-xl text-center">
        <Card padded className="max-w-md mx-auto">
          <div className="text-xl font-bold text-ink mb-sm">Lỗi</div>
          <p className="text-body mb-base">{error || 'Không tìm thấy thông tin quán ăn.'}</p>
          <Button onClick={() => nav('/app/orders')}>Quay lại đơn hàng</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="container-page py-xl">
      <Link to={`/app/restaurant/${restaurant.id}`} className="inline-flex items-center gap-1 text-button text-body hover:text-ink">
        <Icon name="chevronLeft" size={14} /> Quay lại trang quán ăn
      </Link>
      
      <div className="mt-2 mb-base">
        <div className="text-caption-uppercase text-body">Danh sách đơn hàng cần đánh giá</div>
        <h1 className="text-display-lg text-ink">{restaurant.name}</h1>
        <p className="text-body-sm text-body mt-1">{restaurant.addressLine}</p>
      </div>

      <div className="grid gap-xl lg:grid-cols-[1fr_360px]">
        <div className="space-y-base">
          {orders.length === 0 ? (
            <EmptyState
              icon="package"
              title="Chưa có đơn hàng nào hoàn thành"
              message="Bạn chỉ có thể đánh giá các đơn hàng đã được giao hàng thành công từ quán ăn này."
              action={
                <Link to={`/app/restaurant/${restaurant.id}`}>
                  <Button>Xem thực đơn của quán</Button>
                </Link>
              }
            />
          ) : (
            <div className="flex flex-col gap-base">
              {orders.map((o) => (
                <Card key={o.id} padded className="flex flex-col gap-sm sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-base mb-1">
                      <span className="text-title-sm text-ink font-semibold">#{o.order_code}</span>
                      <span className="text-caption text-body">
                        {new Date(o.placed_at).toLocaleDateString('vi-VN')}
                      </span>
                      <span className="nums text-body-sm font-medium text-ink">
                        {formatVnd(Number(o.total_amount))}
                      </span>
                    </div>
                    <div className="text-body-sm text-body line-clamp-1">
                      {o.items?.map((i) => `${i.quantity}× ${i.item_name_snapshot}`).join(', ')}
                    </div>
                  </div>

                  <div className="mt-sm sm:mt-0">
                    {o.isReviewed ? (
                      <div className="inline-flex items-center gap-1.5 text-success font-medium text-body-sm py-1.5 px-3 bg-success/10 rounded-pill">
                        <Icon name="check" size={14} />
                        Đã đánh giá
                      </div>
                    ) : (
                      <Link to={`/app/reviews/write/${o.id}`}>
                        <Button size="sm">Đánh giá ngay</Button>
                      </Link>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <Card padded>
            <div className="text-title-md text-ink mb-base">Nhận xét của khách hàng khác</div>
            {restaurantReviews.length === 0 ? (
              <div className="text-caption text-body py-sm text-center">Chưa có đánh giá nào khác.</div>
            ) : (
              <div className="space-y-base">
                {restaurantReviews.map((rev) => (
                  <div key={rev.id} className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <Avatar src={rev.customerAvatar} name={rev.customerName} size="sm" />
                      <span className="text-body-sm font-semibold text-ink">{rev.customerName}</span>
                      <Badge tone="outline">{rev.rating}★</Badge>
                    </div>
                    <p className="text-caption text-body leading-relaxed">{rev.comment}</p>
                    {rev.replyText && (
                      <div className="ml-4 p-2 bg-canvas-soft border-l border-primary rounded text-xs text-body leading-relaxed">
                        <span className="font-semibold text-ink">Quán phản hồi:</span> {rev.replyText}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Card>
        </aside>
      </div>
    </div>
  );
}
