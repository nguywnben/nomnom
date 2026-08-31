import { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import Badge from '../../components/Badge.jsx';
import Button from '../../components/Button.jsx';
import Card from '../../components/Card.jsx';
import Icon from '../../components/Icon.jsx';
import StarRating from '../../components/StarRating.jsx';
import Avatar from '../../components/Avatar.jsx';
import { Textarea } from '../../components/Input.jsx';
import { useApp } from '../../context/AppContext.jsx';
import { apiGet, apiPost } from '../../lib/api.js';

const RATING_LABELS = {
  1: 'Rất tệ',
  2: 'Không hài lòng',
  3: 'Bình thường',
  4: 'Hài lòng',
  5: 'Tuyệt vời',
};

const QUICK_TAGS = [
  'Món ăn ngon chuẩn vị',
  'Đóng gói cẩn thận',
  'Giao hàng nhanh',
  'Món nóng hổi',
  'Đúng định lượng',
  'Sẽ ủng hộ tiếp',
];

export default function Reviews() {
  const { id } = useParams(); // ID đơn hàng
  const nav = useNavigate();
  const location = useLocation();
  const { pushToast } = useApp();

  const goBack = () => {
    if (location.state?.from) {
      nav(location.state.from);
    } else if (window.history.length > 1) {
      nav(-1);
    } else {
      nav('/app/orders');
    }
  };

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [restaurantReviews, setRestaurantReviews] = useState([]);

  const [ratings, setRatings] = useState({});
  const [comments, setComments] = useState({});
  const [restaurantRating, setRestaurantRating] = useState(0);
  const [restaurantComment, setRestaurantComment] = useState('');
  const [showDishReviews, setShowDishReviews] = useState(false);
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

      // Điều hướng quay lại trang trước đó hoặc danh sách đơn hàng
      if (location.state?.from) {
        nav(location.state.from);
      } else {
        nav('/app/orders');
      }
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
          <Button onClick={goBack}>Quay lại đơn hàng</Button>
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
          <Button onClick={goBack}>Quay lại đơn hàng</Button>
        </Card>
      </div>
    );
  }

  const r = order.restaurant;

  return (
    <div className="container-page py-xl">
      <button
        type="button"
        onClick={goBack}
        className="inline-flex items-center gap-1 text-button text-body hover:text-ink transition-colors"
      >
        <Icon name="chevronLeft" size={14} /> Quay lại đơn hàng
      </button>
      <div className="mt-2 mb-base">
        <div className="text-caption-uppercase text-body">Để lại đánh giá</div>
        <h1 className="text-display-lg text-ink">{r?.name}</h1>
      </div>

      <div className="grid gap-xl lg:grid-cols-[1fr_360px]">
        <div className="space-y-base">
          {/* Card chính: Đánh giá Quán & Đơn hàng */}
          <Card padded className="space-y-base">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-sm border-b border-hairline pb-base">
              <div>
                <div className="text-title-md font-bold text-ink">Đánh giá quán & đơn hàng</div>
                <p className="mt-0.5 text-caption text-body">
                  Bạn cảm thấy trải nghiệm tổng thể từ <strong className="text-ink">{r?.name || 'quán ăn'}</strong> như thế nào?
                </p>
              </div>
              {order.restaurantReviewed ? (
                <Badge tone="success">Đã đánh giá quán</Badge>
              ) : (
                <div className="flex items-center gap-2">
                  <StarRating
                    value={restaurantRating}
                    onChange={setRestaurantRating}
                    size={28}
                  />
                  {restaurantRating > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        setRestaurantRating(0);
                        setRestaurantComment('');
                      }}
                      className="text-caption font-medium text-muted hover:text-error transition-colors cursor-pointer px-1.5 py-0.5 rounded hover:bg-canvas-soft"
                      title="Hủy đánh giá quán"
                    >
                      Hủy
                    </button>
                  )}
                </div>
              )}
            </div>

            {!order.restaurantReviewed && restaurantRating > 0 && (
              <div className="space-y-sm pt-xs animate-in fade-in duration-200">
                {/* Tiêu đề trạng thái cảm xúc cố định bên trong box nhận xét */}
                <div className="flex items-center justify-between pb-1 border-b border-hairline">
                  <div className="text-body-sm font-semibold text-primary flex items-center gap-1.5">
                    <span>{restaurantRating} ★</span>
                    <span>· {RATING_LABELS[restaurantRating]}</span>
                  </div>
                  <span className="text-caption text-body hidden sm:inline">
                    Chọn gợi ý nhanh hoặc tự nhập ý kiến:
                  </span>
                </div>

                {/* Gợi ý nhận xét nhanh */}
                <div className="flex flex-wrap gap-1.5">
                  {QUICK_TAGS.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => {
                        setRestaurantComment((prev) =>
                          prev ? (prev.includes(tag) ? prev : `${prev}, ${tag}`) : tag,
                        );
                      }}
                      className="rounded-full border border-hairline bg-canvas-soft px-3 py-1 text-caption text-ink hover:border-ink transition-colors cursor-pointer"
                    >
                      + {tag}
                    </button>
                  ))}
                </div>

                <div className="relative">
                  <Textarea
                    rows={3}
                    maxLength={500}
                    placeholder={`Chia sẻ cảm nhận chi tiết về ${r?.name || 'quán ăn'} (không bắt buộc)...`}
                    aria-label="Nhận xét về quán ăn"
                    value={restaurantComment}
                    onChange={(event) => setRestaurantComment(event.target.value.slice(0, 500))}
                  />
                  <div className="mt-1 text-right text-[11px] text-muted">
                    {restaurantComment.length}/500 ký tự
                  </div>
                </div>
              </div>
            )}
          </Card>

          {/* Phần phụ: Đánh giá chi tiết từng món ăn (Dạng thu gọn/mở rộng) */}
          {order.items && order.items.length > 0 && (
            <div className="rounded-lg border border-hairline bg-surface-card overflow-hidden">
              <button
                type="button"
                onClick={() => setShowDishReviews((prev) => !prev)}
                className="w-full flex items-center justify-between p-base hover:bg-canvas-soft transition-colors text-left cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="grid h-8 w-8 place-items-center rounded-full bg-canvas-soft text-ink shrink-0">
                    <Icon name="tag" size={16} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-body-sm font-semibold text-ink">
                        Đánh giá chi tiết từng món ăn ({order.items.length} món)
                      </span>
                      {Object.values(ratings).filter((v) => Number(v) > 0).length > 0 && (
                        <Badge tone="default" className="text-[11px]">
                          Đã chọn {Object.values(ratings).filter((v) => Number(v) > 0).length} món
                        </Badge>
                      )}
                    </div>
                    <p className="text-caption text-body mt-0.5">
                      {showDishReviews
                        ? 'Thu gọn danh sách món ăn'
                        : 'Nhấp vào đây nếu bạn muốn chấm điểm hoặc góp ý riêng cho từng món'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 text-caption font-semibold text-body shrink-0 ml-2">
                  <span>{showDishReviews ? 'Thu gọn' : 'Đánh giá món'}</span>
                  <Icon name={showDishReviews ? 'chevronUp' : 'chevronDown'} size={14} />
                </div>
              </button>

              {showDishReviews && (
                <div className="border-t border-hairline p-base space-y-sm bg-canvas-soft/40">
                  {order.items.map((item) => (
                    <Card padded key={item.id} className="border border-hairline bg-surface-card">
                      <div className="flex items-center gap-sm">
                        <img
                          src={item.imageUrl || '/placeholder.png'}
                          alt={item.name}
                          className="h-12 w-12 rounded-md object-cover border border-hairline"
                          onError={(e) => {
                            e.target.src = '/placeholder.png';
                          }}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="text-body font-semibold text-ink truncate">{item.name}</div>
                          <div className="text-caption text-body">Số lượng: {item.quantity}</div>
                        </div>
                        {order.reviewedMenuItemIds?.includes(Number(item.menuItemId)) ? (
                          <Badge tone="success">Đã đánh giá</Badge>
                        ) : (
                          <div className="flex items-center gap-2 shrink-0">
                            <StarRating
                              value={ratings[item.menuItemId] || 0}
                              onChange={(val) => setRatings((prev) => ({ ...prev, [item.menuItemId]: val }))}
                              size={22}
                            />
                            {ratings[item.menuItemId] > 0 && (
                              <button
                                type="button"
                                onClick={() =>
                                  setRatings((prev) => ({ ...prev, [item.menuItemId]: 0 }))
                                }
                                className="text-caption text-muted hover:text-error transition-colors cursor-pointer px-1 py-0.5 rounded hover:bg-canvas-soft"
                                title="Hủy đánh giá món này"
                              >
                                ✕
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                      {!order.reviewedMenuItemIds?.includes(Number(item.menuItemId)) && ratings[item.menuItemId] > 0 && (
                        <div className="mt-sm space-y-1">
                          <div className="text-caption font-semibold text-primary">
                            Đánh giá món: {ratings[item.menuItemId]} ★ ({RATING_LABELS[ratings[item.menuItemId]]})
                          </div>
                          <div className="relative">
                            <Textarea
                              rows={2}
                              maxLength={500}
                              placeholder={`Nhận xét về ${item.name} (không bắt buộc)...`}
                              aria-label={`Đánh giá món ${item.name}`}
                              value={comments[item.menuItemId] || ''}
                              onChange={(e) => setComments((prev) => ({ ...prev, [item.menuItemId]: e.target.value.slice(0, 500) }))}
                            />
                            <div className="mt-0.5 text-right text-[11px] text-muted">
                              {(comments[item.menuItemId] || '').length}/500 ký tự
                            </div>
                          </div>
                        </div>
                      )}
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="flex items-center justify-end gap-xs pt-xs">
            <Button variant="secondary" onClick={goBack}>
              {order.isReviewed ? 'Quay lại' : 'Để sau'}
            </Button>
            {!order.isReviewed && (
              <Button onClick={submit} disabled={submitting}>
                {submitting ? 'Đang gửi...' : 'Gửi đánh giá'}
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
