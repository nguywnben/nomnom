import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import Badge from '../../components/Badge.jsx';
import Button from '../../components/Button.jsx';
import Card from '../../components/Card.jsx';
import Icon from '../../components/Icon.jsx';
import Avatar from '../../components/Avatar.jsx';
import EmptyState from '../../components/EmptyState.jsx';
import StarRating from '../../components/StarRating.jsx';
import Pagination from '../../components/Pagination.jsx';
import { Select, Textarea } from '../../components/Input.jsx';
import { useApp } from '../../context/AppContext.jsx';
import { apiGet, apiPatch } from '../../lib/api.js';
import { formatVnd } from '../../lib/formatVnd.js';

const getRemainingTimeText = (createdAt) => {
  const created = new Date(createdAt);
  const expiry = created.getTime() + 7 * 24 * 60 * 60 * 1000;
  const diffMs = expiry - Date.now();
  if (diffMs <= 0) return 'Đã hết hạn chỉnh sửa';
  
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays > 0) {
    return `Còn lại ${diffDays} ngày để sửa`;
  }
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  if (diffHours > 0) {
    return `Còn lại ${diffHours} giờ để sửa`;
  }
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  return `Còn lại ${diffMinutes} phút để sửa`;
};

export default function RestaurantReviews() {
  const { id } = useParams(); // ID nhà hàng
  const nav = useNavigate();
  const { currentCustomer, pushToast } = useApp();
  
  const [restaurant, setRestaurant] = useState(null);
  const [orders, setOrders] = useState([]);
  const [restaurantReviews, setRestaurantReviews] = useState([]);
  const [reviewPage, setReviewPage] = useState(1);
  const [reviewRating, setReviewRating] = useState('');
  const [reviewSort, setReviewSort] = useState('newest');
  const [reviewTotal, setReviewTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // States cho chỉnh sửa đánh giá
  const [editingReview, setEditingReview] = useState(null);
  const [editRating, setEditRating] = useState(0);
  const [editComment, setEditComment] = useState('');
  const [updating, setUpdating] = useState(false);

  const handleUpdateReview = async () => {
    if (!editRating) return;
    setUpdating(true);
    try {
      await apiPatch(`/api/v1/orders/reviews/${editingReview.id}`, {
        rating: editRating,
        comment: editComment.trim() || null,
      });
      
      pushToast({
        kind: 'success',
        title: 'Cập nhật thành công',
        message: 'Đánh giá của bạn đã được cập nhật thành công.',
      });
      
      // Tải lại danh sách đánh giá của nhà hàng
      const reviewsData = await apiGet(`/api/v1/restaurants/${id}/reviews?limit=10&page=${reviewPage}&rating=${reviewRating}&sort=${reviewSort}`);
      setRestaurantReviews(reviewsData?.data || []);
      setReviewTotal(Number(reviewsData?.pagination?.total ?? 0));
      
      setEditingReview(null);
    } catch (err) {
      pushToast({
        kind: 'error',
        title: 'Lỗi cập nhật',
        message: err.message || 'Không thể lưu thay đổi đánh giá lúc này.',
      });
    } finally {
      setUpdating(false);
    }
  };

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

        if (currentCustomer) {
          const ordersData = await apiGet('/api/v1/orders?restaurantId=' + id);
          if (!active) return;
          setOrders((ordersData || []).filter(o => o.status === 'delivered'));
        } else {
          setOrders([]);
        }

        // 3. Lấy đánh giá của các khách hàng khác
        const reviewsData = await apiGet(`/api/v1/restaurants/${id}/reviews?limit=10&page=${reviewPage}&rating=${reviewRating}&sort=${reviewSort}`);
        if (!active) return;
        setRestaurantReviews(reviewsData?.data || []);
        setReviewTotal(Number(reviewsData?.pagination?.total ?? 0));

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
  }, [currentCustomer, id, reviewPage, reviewRating, reviewSort]);

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
      <button
        type="button"
        onClick={() => (window.history.length > 1 ? nav(-1) : nav(`/app/restaurant/${restaurant.id}`))}
        className="inline-flex items-center gap-1 text-button text-body hover:text-ink transition-colors"
      >
        <Icon name="chevronLeft" size={14} /> Quay lại trang quán ăn
      </button>
      
      <div className="mt-2 mb-base">
        <div className="text-caption-uppercase text-body">Đánh giá quán ăn</div>
        <h1 className="text-display-lg text-ink">{restaurant.name}</h1>
        <p className="text-body-sm text-body mt-1">{restaurant.addressLine}</p>
      </div>

      <div className="grid gap-xl lg:grid-cols-[360px_1fr]">
        <div className="space-y-base">
          {!currentCustomer ? (
            <Card padded>
              <div className="text-title-md text-ink">Đánh giá sau khi nhận hàng</div>
              <p className="mt-1 text-body-sm text-body">Đăng nhập bằng tài khoản khách hàng để đánh giá các đơn đã giao.</p>
              <Link to={`/login?next=${encodeURIComponent(`/app/reviews/${restaurant.id}`)}`}>
                <Button className="mt-base">Đăng nhập</Button>
              </Link>
            </Card>
          ) : orders.length === 0 ? (
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
                      <Link to={`/app/reviews/write/${o.id}`} state={{ from: `/app/reviews/${restaurant.id}` }}>
                        <Button size="sm">Đánh giá ngay</Button>
                      </Link>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        <aside>
          <Card padded>
            <div className="flex flex-wrap items-end justify-between gap-sm">
              <div>
                <div className="text-title-md text-ink">Tất cả đánh giá</div>
                <div className="mt-1 text-caption text-body">{reviewTotal} đánh giá về quán</div>
              </div>
              <div className="flex flex-wrap gap-xs">
                <Select
                  className="w-36"
                  aria-label="Lọc theo số sao"
                  value={reviewRating}
                  onChange={(event) => { setReviewRating(event.target.value); setReviewPage(1); }}
                  options={[
                    { value: '', label: 'Tất cả sao' },
                    ...[5, 4, 3, 2, 1].map((star) => ({ value: String(star), label: `${star} sao` })),
                  ]}
                />
                <Select
                  className="w-36"
                  aria-label="Sắp xếp đánh giá"
                  value={reviewSort}
                  onChange={(event) => { setReviewSort(event.target.value); setReviewPage(1); }}
                  options={[
                    { value: 'newest', label: 'Mới nhất' },
                    { value: 'oldest', label: 'Cũ nhất' },
                  ]}
                />
              </div>
            </div>
            <div className="mt-base">
            {restaurantReviews.length === 0 ? (
              <div className="text-caption text-body py-xl text-center">Chưa có đánh giá phù hợp.</div>
            ) : (
              <div className="space-y-base">
                {restaurantReviews.map((rev) => {
                  const isOwnReview = String(rev.customerId) === String(currentCustomer?.id);
                  const showEditButton = isOwnReview && rev.canEdit;
                  return (
                    <div key={rev.id} className="flex flex-col gap-1 pb-base border-b border-hairline last:border-0 last:pb-0">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Avatar src={rev.customerAvatar} name={rev.customerName} size="sm" />
                          <div className="flex flex-col">
                            <span className="text-body-sm font-semibold text-ink">{rev.customerName}</span>
                            <span className="text-caption-sm text-body">{new Date(rev.createdAt).toLocaleDateString('vi-VN')}</span>
                          </div>
                          <Badge tone="outline">{rev.rating}★</Badge>
                        </div>
                        {showEditButton && (
                          <div className="flex items-center gap-xs">
                           
                            <button
                              onClick={() => {
                                setEditingReview(rev);
                                setEditRating(rev.rating);
                                setEditComment(rev.comment || '');
                              }}
                              className="text-caption font-semibold text-primary hover:underline flex items-center gap-xs"
                            >
                              <Icon name="edit" size={12} />
                              Sửa
                            </button>
                          </div>
                        )}
                      </div>

                      {rev.itemName && (
                        <div className="text-caption font-medium text-body-sm bg-canvas-soft px-2 py-0.5 rounded border border-hairline w-fit my-1">
                          Món: <span className="text-ink font-semibold">{rev.itemName}</span>
                        </div>
                      )}

                      <p className="text-caption text-body leading-relaxed mt-1">
                        {rev.comment}
                        {rev.isEdited && (
                          <span className="ml-base text-caption-sm text-body font-normal italic bg-canvas-soft px-1.5 py-0.5 rounded border border-hairline">
                            đã chỉnh sửa
                          </span>
                        )}
                      </p>

                      {rev.replyText && (
                        <div className="ml-4 mt-sm p-2 bg-canvas-soft border-l border-primary rounded text-xs text-body leading-relaxed">
                          <span className="font-semibold text-ink">Quán phản hồi:</span> {rev.replyText}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
            </div>
            {reviewTotal > 10 && (
              <Pagination
                className="mt-base border-t border-hairline pt-base"
                total={reviewTotal}
                pageSize={10}
                page={reviewPage}
                onChange={setReviewPage}
              />
            )}
          </Card>
        </aside>
      </div>

      {editingReview && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <Card padded className="max-w-md w-full animate-fade-in shadow-xl bg-surface-card border border-hairline-strong">
            <div className="flex items-center justify-between border-b border-hairline pb-sm mb-base">
              <h2 className="text-title-lg font-bold text-ink">Chỉnh sửa đánh giá</h2>
              <button 
                onClick={() => setEditingReview(null)} 
                className="text-body hover:text-ink transition-colors p-1"
                aria-label="Đóng"
              >
                <Icon name="close" size={20} />
              </button>
            </div>

            <div className="mb-base p-sm bg-red-50 text-red-600 rounded-md border border-red-200 text-xs space-y-1">
              <div className="font-semibold flex items-center gap-xs">
                <Icon name="warning" size={14} className="text-red-600" />
                Lưu ý: Bạn chỉ có thể chỉnh sửa đánh giá này 1 lần duy nhất.
              </div>
              <div className="font-medium text-red-500 pl-4">{getRemainingTimeText(editingReview.createdAt)}</div>
            </div>
            
            {editingReview.itemName && (
              <div className="mb-base p-sm bg-canvas-soft rounded-md border border-hairline flex items-center gap-xs">
                <span className="text-body-sm font-medium text-ink">Sản phẩm:</span>
                <span className="text-body-sm font-semibold text-primary">{editingReview.itemName}</span>
              </div>
            )}
            
            <div className="space-y-base">
              <div>
                <label className="block text-body-sm font-semibold text-ink mb-xs">Số sao đánh giá</label>
                <StarRating value={editRating} onChange={setEditRating} size={26} />
              </div>
              
              <div>
                <label htmlFor="edit-comment" className="block text-body-sm font-semibold text-ink mb-xs">Nội dung nhận xét</label>
                <Textarea
                  id="edit-comment"
                  rows={4}
                  placeholder="Chia sẻ cảm nhận của bạn về quán ăn..."
                  value={editComment}
                  onChange={(e) => setEditComment(e.target.value)}
                />
              </div>
            </div>
            
            <div className="flex items-center justify-end gap-xs mt-xl pt-sm border-t border-hairline">
              <Button variant="secondary" onClick={() => setEditingReview(null)} disabled={updating}>
                Hủy
              </Button>
              <Button onClick={handleUpdateReview} disabled={updating || !editRating}>
                {updating ? 'Đang lưu...' : 'Lưu thay đổi'}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
