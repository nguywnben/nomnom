import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import Badge from '../../components/Badge.jsx';
import Button from '../../components/Button.jsx';
import Card from '../../components/Card.jsx';
import Icon from '../../components/Icon.jsx';
import StarRating from '../../components/StarRating.jsx';
import Avatar from '../../components/Avatar.jsx';
import { Textarea } from '../../components/Input.jsx';
import { useApp } from '../../context/AppContext.jsx';
import { apiGet, apiPost } from '../../lib/api.js';

export default function Reviews() {
  const { id } = useParams(); // ID đơn hàng
  const nav = useNavigate();
  const { pushToast } = useApp();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [restaurantReviews, setRestaurantReviews] = useState([]);

  const [ratings, setRatings] = useState({});
  const [comments, setComments] = useState({});
  const [restaurantRating, setRestaurantRating] = useState(0);
  const [restaurantComment, setRestaurantComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);

    apiGet('/api/v1/orders/' + id)
      .then(async (orderData) => {
        if (!active) return;
        setOrder(orderData);
        
        // Khởi tạo state rating và comment cho từng món ăn
        if (orderData?.items) {
          const initRatings = {};
          const initComments = {};
          orderData.items.forEach((item) => {
            initRatings[item.menuItemId] = 0;
            initComments[item.menuItemId] = '';
          });
          setRatings(initRatings);
          setComments(initComments);
        }

        // Tải đánh giá nhà hàng cho thanh bên
        if (orderData?.restaurant_id) {
          try {
            const reviewsData = await apiGet(`/api/v1/restaurants/${orderData.restaurant_id}/reviews?limit=5`);
            if (active) {
              const formatted = (reviewsData?.data || []).map((r) => ({
                id: r.id,
                author: r.customerName,
                avatar: r.customerAvatar,
                rating: r.rating,
                text: r.comment,
                replyText: r.replyText,
              }));
              setRestaurantReviews(formatted);
            }
          } catch (err) {
            console.error('Lỗi tải đánh giá nhà hàng:', err);
          }
        }
      })
      .catch((err) => {
        if (active) setError(err.message || 'Không thể tải thông tin đơn hàng.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [id]);

  const submit = async () => {
    const dishReviews = order.items
      .filter((item) => !order.reviewedMenuItemIds?.includes(Number(item.menuItemId)))
      .filter((item) => Number(ratings[item.menuItemId]) > 0)
      .map((item) => ({
        menuItemId: item.menuItemId,
        rating: ratings[item.menuItemId],
        comment: comments[item.menuItemId]?.trim() || null,
      }));
    const restaurantReview = !order.restaurantReviewed && restaurantRating
      ? { rating: restaurantRating, comment: restaurantComment.trim() || null }
      : null;

    if (!restaurantReview && dishReviews.length === 0) {
      pushToast({
        kind: 'info',
        title: 'Chưa chọn nội dung đánh giá',
        message: 'Bạn có thể chọn đánh giá quán, một vài món hoặc quay lại để bỏ qua.',
      });
      return;
    }

    setSubmitting(true);
    try {
      await apiPost(`/api/v1/orders/${order.id}/review`, {
        restaurantReview,
        dishReviews,
      });

      pushToast({
        kind: 'success',
        title: 'Cảm ơn bạn đã đánh giá',
        message: `${order.restaurant?.name || 'Quán ăn'} rất trân trọng ý kiến đóng góp của bạn.`,
      });

      // Điều hướng quay lại trang danh sách đơn hàng cần đánh giá của nhà hàng
      nav(`/app/reviews/${order.restaurant_id}`);
    } catch (err) {
      console.error(err);
      pushToast({
        kind: 'error',
        title: 'Lỗi đánh giá',
        message: err.message || 'Không thể gửi đánh giá, vui lòng thử lại sau.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="container-page py-section text-center">Đang tải thông tin...</div>;
  }

  if (error || !order) {
    return (
      <div className="container-page py-xl text-center">
        <Card padded className="max-w-md mx-auto">
          <div className="text-xl font-bold text-ink mb-sm">Lỗi</div>
          <p className="text-body mb-base">{error || 'Không tìm thấy thông tin đơn hàng.'}</p>
          <Button onClick={() => nav('/app/orders')}>Quay lại đơn hàng</Button>
        </Card>
      </div>
    );
  }

  if (order.status !== 'delivered') {
    return (
      <div className="container-page py-xl text-center">
        <Card padded className="max-w-md mx-auto">
          <div className="text-xl font-bold text-ink mb-sm">Chưa thể đánh giá</div>
          <p className="text-body mb-base">Bạn chỉ có thể đánh giá đơn hàng sau khi nhận hàng thành công.</p>
          <Button onClick={() => nav('/app/orders')}>Quay lại đơn hàng</Button>
        </Card>
      </div>
    );
  }

  const r = order.restaurant;

  return (
    <div className="container-page py-xl">
      <Link to={`/app/reviews/${order.restaurant_id}`} className="inline-flex items-center gap-1 text-button text-body hover:text-ink">
        <Icon name="chevronLeft" size={14} /> Quay lại danh sách đơn hàng
      </Link>
      <div className="mt-2 mb-base">
        <div className="text-caption-uppercase text-body">Để lại đánh giá</div>
        <h1 className="text-display-lg text-ink">{r?.name}</h1>
      </div>

      <div className="grid gap-xl lg:grid-cols-[1fr_360px]">
        <div className="space-y-base">
          <Card padded>
            <div className="flex flex-wrap items-start justify-between gap-sm">
              <div>
                <div className="text-title-md font-semibold text-ink">Đánh giá quán ăn</div>
                <p className="mt-1 text-caption text-body">Chia sẻ trải nghiệm chung về đơn hàng và quán. Không bắt buộc.</p>
              </div>
              {order.restaurantReviewed ? (
                <Badge tone="success">Đã đánh giá</Badge>
              ) : (
                <StarRating value={restaurantRating} onChange={setRestaurantRating} size={24} />
              )}
            </div>
            {!order.restaurantReviewed && restaurantRating > 0 && (
              <Textarea
                className="mt-base"
                rows={3}
                placeholder={`Nhận xét về ${r?.name || 'quán ăn'} (không bắt buộc)`}
                aria-label="Nhận xét về quán ăn"
                value={restaurantComment}
                onChange={(event) => setRestaurantComment(event.target.value)}
              />
            )}
          </Card>

          <div className="pt-sm">
            <div className="text-title-md font-semibold text-ink">Đánh giá món ăn</div>
            <p className="mt-1 text-caption text-body">Chỉ chọn những món bạn muốn đánh giá. Nhận xét không bắt buộc.</p>
          </div>
          {order.items?.map((item) => (
            <Card padded key={item.id}>
              <div className="flex items-center gap-sm">
                <img
                  src={item.imageUrl || '/placeholder.png'}
                  alt={item.name}
                  className="h-12 w-12 rounded-md object-cover"
                  onError={(e) => {
                    e.target.src = '/placeholder.png';
                  }}
                />
                <div className="flex-1">
                  <div className="text-title-md text-ink">{item.name}</div>
                  <div className="text-caption text-body">Số lượng: {item.quantity}</div>
                </div>
                {order.reviewedMenuItemIds?.includes(Number(item.menuItemId)) ? (
                  <Badge tone="success">Đã đánh giá</Badge>
                ) : (
                  <StarRating
                    value={ratings[item.menuItemId] || 0}
                    onChange={(val) => setRatings((prev) => ({ ...prev, [item.menuItemId]: val }))}
                    size={22}
                  />
                )}
              </div>
              {!order.reviewedMenuItemIds?.includes(Number(item.menuItemId)) && ratings[item.menuItemId] > 0 && (
                <Textarea
                  className="mt-base"
                  rows={3}
                  placeholder={`Nhận xét về ${item.name} (không bắt buộc)`}
                  aria-label={`Đánh giá món ${item.name}`}
                  value={comments[item.menuItemId] || ''}
                  onChange={(e) => setComments((prev) => ({ ...prev, [item.menuItemId]: e.target.value }))}
                />
              )}
            </Card>
          ))}

          <div className="flex items-center justify-end gap-xs">
            <Button variant="secondary" onClick={() => nav(`/app/reviews/${order.restaurant_id}`)}>
              {order.isReviewed ? 'Quay lại' : 'Để sau'}
            </Button>
            {!order.isReviewed && (
              <Button onClick={submit} disabled={submitting}>
                {submitting ? 'Đang gửi...' : 'Gửi đánh giá đã chọn'}
              </Button>
            )}
          </div>
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
                      <Avatar src={rev.avatar} name={rev.author} size="sm" />
                      <span className="text-body-sm font-semibold text-ink">{rev.author}</span>
                      <Badge tone="outline">{rev.rating}★</Badge>
                    </div>
                    <p className="text-caption text-body leading-relaxed">{rev.text}</p>
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
