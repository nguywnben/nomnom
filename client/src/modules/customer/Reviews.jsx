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

const QUICK_TAGS = ['Đúng giờ', 'Nguyên liệu tươi', 'Đóng gói cẩn thận', 'Tài xế thân thiện', 'Làm đúng yêu cầu'];

export default function Reviews() {
  const { id } = useParams(); // ID đơn hàng
  const nav = useNavigate();
  const { pushToast } = useApp();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [restaurantReviews, setRestaurantReviews] = useState([]);

  const [foodRating, setFoodRating] = useState(0);
  const [tags, setTags] = useState([]);
  const [text, setText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);

    apiGet('/api/v1/orders/' + id)
      .then(async (orderData) => {
        if (!active) return;
        setOrder(orderData);
        
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

  const toggle = (t) => setTags((cur) => (cur.includes(t) ? cur.filter((x) => x !== t) : [...cur, t]));

  const submit = async () => {
    if (!foodRating) {
      pushToast({ kind: 'error', title: 'Thêm đánh giá', message: 'Vui lòng chọn số sao đánh giá.' });
      return;
    }

    setSubmitting(true);
    try {
      const commentText = [text.trim(), tags.length > 0 ? `(${tags.join(', ')})` : '']
        .filter(Boolean)
        .join('\n');

      await apiPost(`/api/v1/orders/${order.id}/review`, {
        rating: foodRating,
        comment: commentText || null,
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

  if (order.isReviewed) {
    return (
      <div className="container-page py-xl text-center">
        <Card padded className="max-w-md mx-auto">
          <div className="text-xl font-bold text-ink mb-sm">Đã đánh giá</div>
          <p className="text-body mb-base">Đơn hàng này đã được đánh giá rồi.</p>
          <Button onClick={() => nav(`/app/reviews/${order.restaurant_id}`)}>
            Quay lại danh sách đánh giá quán
          </Button>
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
            <div className="flex items-center gap-sm">
              <img src={r?.banner_url} alt="" className="h-12 w-12 rounded-md object-cover" />
              <div className="flex-1">
                <div className="text-title-md text-ink">{r?.name}</div>
                <div className="text-caption text-body">Trải nghiệm của bạn thế nào?</div>
              </div>
              <StarRating value={foodRating} onChange={setFoodRating} size={22} />
            </div>
            <Textarea
              className="mt-base"
              rows={4}
              id="review-text"
              placeholder="Chia sẻ thêm về chất lượng dịch vụ và đồ ăn của quán ăn (không bắt buộc)..."
              aria-label="Nội dung đánh giá"
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
            <div className="mt-sm flex flex-wrap gap-1">
              {QUICK_TAGS.map((t) => {
                const sel = tags.includes(t);
                return (
                  <button
                    key={t}
                    onClick={() => toggle(t)}
                    className={
                      'rounded-pill border px-2.5 py-1 text-caption transition-colors ' +
                      (sel
                        ? 'border-ink bg-primary text-on-primary'
                        : 'border-hairline-strong bg-surface-card text-ink hover:bg-canvas-soft')
                    }
                  >
                    {t}
                  </button>
                );
              })}
            </div>
          </Card>

          <div className="flex items-center justify-end gap-xs">
            <Button variant="secondary" onClick={() => nav(`/app/reviews/${order.restaurant_id}`)}>
              Bỏ qua
            </Button>
            <Button onClick={submit} disabled={submitting}>
              {submitting ? 'Đang gửi...' : 'Gửi đánh giá'}
            </Button>
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
