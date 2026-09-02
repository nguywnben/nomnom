import clsx from 'clsx';
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
import Skeleton from '../../components/Skeleton.jsx';
import { Textarea } from '../../components/Input.jsx';
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
  const [stats, setStats] = useState(null);
  const [target, setTarget] = useState('all');
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
      const reviewsData = await apiGet(`/api/v1/restaurants/${id}/reviews?limit=10&page=${reviewPage}&rating=${reviewRating}&sort=${reviewSort}&target=${target}`);
      setRestaurantReviews(reviewsData?.data || []);
      setReviewTotal(Number(reviewsData?.pagination?.total ?? 0));
      if (reviewsData?.stats) setStats(reviewsData.stats);
      
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
        const reviewsData = await apiGet(`/api/v1/restaurants/${id}/reviews?limit=10&page=${reviewPage}&rating=${reviewRating}&sort=${reviewSort}&target=${target}`);
        if (!active) return;
        setRestaurantReviews(reviewsData?.data || []);
        setReviewTotal(Number(reviewsData?.pagination?.total ?? 0));
        if (reviewsData?.stats) setStats(reviewsData.stats);

      } catch (err) {
        if (!active) return;
        setError(err.message || 'Không thể tải thông tin dữ liệu.');
      } finally {
        if (active) setLoading(false);
      }
    };

    loadData();

    return () => {
      active = false;
    };
  }, [currentCustomer, id, reviewPage, reviewRating, reviewSort, target]);

  if (loading) {
    return <RestaurantReviewsSkeleton />;
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
    <div className="container-page py-xl space-y-base">
      <div>
        <button
          type="button"
          onClick={() => (window.history.length > 1 ? nav(-1) : nav(`/app/restaurant/${restaurant.slug || restaurant.id}`))}
          className="inline-flex items-center gap-1 text-button text-body hover:text-ink transition-colors cursor-pointer"
        >
          <Icon name="chevronLeft" size={14} /> Quay lại trang quán ăn
        </button>
        
        <div className="mt-2 flex flex-wrap items-end justify-between gap-base border-b border-hairline pb-base">
          <div>
            <div className="text-caption-uppercase text-body">Đánh giá khách hàng</div>
            <h1 className="text-display-lg text-ink">{restaurant.name}</h1>
            <p className="text-body-sm text-body mt-0.5">{restaurant.addressLine}</p>
          </div>
          <Link to={`/app/restaurant/${restaurant.slug || restaurant.id}`}>
            <Button size="sm" variant="secondary" leadingIcon="store">
              Xem thực đơn quán
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-xl lg:grid-cols-[340px_1fr]">
        {/* Cột trái: Tổng quan đánh giá & Đơn hàng của bạn */}
        <div className="space-y-base">
          {/* Card Tổng quan điểm số */}
          <Card padded className="space-y-base">
            <div>
              <div className="text-caption-uppercase text-body">Tổng quan đánh giá</div>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-display-lg text-ink font-bold nums">
                  {Number(stats?.average ?? restaurant.ratingAvg ?? 0).toFixed(1)}
                </span>
                <span className="text-body-sm text-body">trên 5</span>
              </div>
              <div className="mt-1">
                <StarRating value={Number(stats?.average ?? restaurant.ratingAvg ?? 0)} size={20} />
              </div>
              <div className="mt-1.5 text-caption text-body">
                Dựa trên <strong>{stats?.total ?? 0}</strong> lượt đánh giá
                {stats?.restaurantCount !== undefined && stats?.dishCount !== undefined && (
                  <div className="mt-0.5 text-[11px] text-muted">
                    ({stats.restaurantCount} về quán · {stats.dishCount} về món ăn)
                  </div>
                )}
              </div>
            </div>

            {/* Thanh phân bổ số sao 5★ đến 1★ */}
            <div className="space-y-1.5 border-t border-hairline pt-sm">
              <div className="text-caption-uppercase text-body text-[11px] mb-1">Chi tiết mức sao</div>
              {[5, 4, 3, 2, 1].map((star) => {
                const count = stats?.distribution?.[star] ?? 0;
                const totalCount = stats?.total ?? 0;
                const percent = totalCount > 0 ? (count / totalCount) * 100 : 0;
                const isSelected = reviewRating === String(star);

                return (
                  <button
                    key={star}
                    type="button"
                    onClick={() => {
                      setReviewRating(isSelected ? '' : String(star));
                      setReviewPage(1);
                    }}
                    className={clsx(
                      'w-full flex items-center gap-2 text-caption rounded-md px-2 py-1 transition-colors cursor-pointer text-left',
                      isSelected ? 'bg-ink text-canvas font-semibold' : 'hover:bg-canvas-soft text-body',
                    )}
                  >
                    <span className="w-5 text-right font-medium">{star}★</span>
                    <div className="h-2 flex-1 rounded-full bg-canvas-soft overflow-hidden border border-hairline/40">
                      <div
                        className={clsx('h-full rounded-full transition-all duration-300', isSelected ? 'bg-canvas' : 'bg-primary')}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                    <span className="w-7 text-right nums text-caption font-medium">{count}</span>
                  </button>
                );
              })}
            </div>
          </Card>

          {/* Card Đơn hàng của bạn tại quán */}
          <Card padded className="space-y-sm">
            <div className="text-title-sm font-bold text-ink">Đơn hàng của bạn</div>
            {!currentCustomer ? (
              <div className="text-body-sm text-body space-y-2">
                <p>Đăng nhập để xem và đánh giá các đơn đã mua tại quán.</p>
                <Link to={`/login?next=${encodeURIComponent(`/app/reviews/${restaurant.id}`)}`}>
                  <Button size="sm" className="w-full">Đăng nhập</Button>
                </Link>
              </div>
            ) : orders.length === 0 ? (
              <div className="text-center py-sm space-y-2">
                <p className="text-caption text-body">Bạn chưa có đơn hàng hoàn thành nào tại quán ăn này.</p>
                <Link to={`/app/restaurant/${restaurant.slug || restaurant.id}`}>
                  <Button size="sm" variant="secondary">Đặt món ngay</Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-sm max-h-[300px] overflow-y-auto no-scrollbar">
                {orders.map((o) => (
                  <div key={o.id} className="rounded-md border border-hairline bg-canvas-soft/40 p-sm space-y-1.5">
                    <div className="flex items-center justify-between text-caption">
                      <span className="font-mono font-bold text-ink">#{o.order_code}</span>
                      <span className="text-muted">{new Date(o.placed_at).toLocaleDateString('vi-VN')}</span>
                    </div>
                    <div className="text-caption text-body line-clamp-1">
                      {o.items?.map((i) => `${i.quantity}× ${i.item_name_snapshot}`).join(', ')}
                    </div>
                    <div className="flex items-center justify-between pt-1">
                      <span className="nums text-body-sm font-semibold text-ink">{formatVnd(Number(o.total_amount))}</span>
                      {o.isReviewed ? (
                        <span className="inline-flex items-center gap-1 text-success text-caption font-medium">
                          <Icon name="check" size={12} /> Đã đánh giá
                        </span>
                      ) : (
                        <Link to={`/app/reviews/write/${o.id}`} state={{ from: `/app/reviews/${restaurant.id}` }}>
                          <Button size="sm">Đánh giá ngay</Button>
                        </Link>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Cột phải: Toolbar bộ lọc & Danh sách nhận xét */}
        <div className="space-y-base">
          {/* Thanh Toolbar lọc kiểu Menu.jsx */}
          <div className="flex flex-col gap-sm sm:flex-row sm:items-center sm:justify-between border-b border-hairline pb-sm">
            {/* Tabs chọn phân loại Quán / Món */}
            <div className="flex max-w-full items-center gap-xs overflow-x-auto no-scrollbar flex-1 min-w-0 pb-1">
              {[
                { id: 'all', label: 'Tất cả', count: stats?.total ?? reviewTotal },
                { id: 'restaurant', label: 'Đánh giá Quán', count: stats?.restaurantCount },
                { id: 'dish', label: 'Đánh giá Món', count: stats?.dishCount },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    setTarget(tab.id);
                    setReviewPage(1);
                  }}
                  className={clsx(
                    'h-9 inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-md px-sm text-button transition-colors shrink-0 cursor-pointer',
                    target === tab.id
                      ? 'bg-primary text-on-primary shadow-xs'
                      : 'bg-surface-card border border-hairline-strong text-ink hover:bg-canvas-soft',
                  )}
                >
                  <span>{tab.label}</span>
                  {tab.count !== undefined && (
                    <span
                      className={clsx(
                        'rounded-full px-1.5 py-0.2 text-caption nums',
                        target === tab.id ? 'bg-white/20 text-white' : 'bg-canvas-soft text-body',
                      )}
                    >
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Selects bộ lọc bên phải */}
            <div className="flex items-center gap-xs shrink-0">
              <select
                className="h-9 rounded-md border border-hairline-strong bg-surface-card px-3 text-body-sm text-ink outline-none cursor-pointer focus:border-ink transition-colors"
                value={reviewRating}
                onChange={(event) => {
                  setReviewRating(event.target.value);
                  setReviewPage(1);
                }}
                aria-label="Lọc theo số sao"
              >
                <option value="">Tất cả sao</option>
                <option value="5">5 sao</option>
                <option value="4">4 sao</option>
                <option value="3">3 sao</option>
                <option value="2">2 sao</option>
                <option value="1">1 sao</option>
              </select>

              <select
                className="h-9 rounded-md border border-hairline-strong bg-surface-card px-3 text-body-sm text-ink outline-none cursor-pointer focus:border-ink transition-colors"
                value={reviewSort}
                onChange={(event) => {
                  setReviewSort(event.target.value);
                  setReviewPage(1);
                }}
                aria-label="Sắp xếp đánh giá"
              >
                <option value="newest">Mới nhất</option>
                <option value="oldest">Cũ nhất</option>
              </select>
            </div>
          </div>

          {/* Danh sách các thẻ nhận xét */}
          {restaurantReviews.length === 0 ? (
            <EmptyState
              icon="starFilled"
              title="Chưa có đánh giá phù hợp"
              message="Hãy thử chọn một mức sao khác hoặc quay lại sau."
            />
          ) : (
            <div className="space-y-base">
              {restaurantReviews.map((rev) => {
                const isOwnReview = String(rev.customerId) === String(currentCustomer?.id);
                const showEditButton = isOwnReview && rev.canEdit;

                return (
                  <Card key={rev.id} padded className="space-y-sm">
                    <div className="flex items-start gap-sm">
                      <Avatar src={rev.customerAvatar} name={rev.customerName} />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-body-sm font-semibold text-ink">{rev.customerName}</span>
                              {/* Phân loại đánh giá Quán hay Món */}
                              {rev.itemName ? (
                                <span className="inline-flex items-center gap-1.5 rounded bg-canvas-soft border border-hairline px-2 py-0.5 text-caption font-medium text-ink">
                                  {rev.itemImage ? (
                                    <img
                                      src={rev.itemImage}
                                      alt={rev.itemName}
                                      className="h-4 w-4 rounded object-cover border border-hairline shrink-0"
                                      onError={(e) => {
                                        e.target.style.display = 'none';
                                      }}
                                    />
                                  ) : (
                                    <Icon name="tag" size={12} className="text-primary shrink-0" />
                                  )}
                                  <span className="font-semibold text-ink">{rev.itemName}</span>
                                </span>
                              ) : (
                                <Badge tone="outline" className="text-caption">
                                  Đánh giá quán
                                </Badge>
                              )}
                            </div>
                            <div className="mt-0.5 text-caption text-body">
                              {new Date(rev.createdAt).toLocaleDateString('vi-VN')}
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <StarRating value={rev.rating} size={18} />
                            {showEditButton && (
                              <button
                                onClick={() => {
                                  setEditingReview(rev);
                                  setEditRating(rev.rating);
                                  setEditComment(rev.comment || '');
                                }}
                                className="text-caption font-semibold text-primary hover:underline flex items-center gap-1 cursor-pointer ml-1"
                              >
                                <Icon name="edit" size={12} />
                                Sửa
                              </button>
                            )}
                          </div>
                        </div>

                        <p className="mt-2 text-body-sm text-ink leading-relaxed">
                          {rev.comment || (
                            <span className="text-muted italic">Khách hàng chỉ chấm {rev.rating} sao và không để lại nhận xét.</span>
                          )}
                          {rev.isEdited && (
                            <span className="ml-2 text-[11px] text-muted italic bg-canvas-soft px-1.5 py-0.2 rounded border border-hairline">
                              đã chỉnh sửa
                            </span>
                          )}
                        </p>

                        {rev.replyText && (
                          <div className="mt-sm rounded-md border border-hairline-strong bg-canvas-soft p-sm">
                            <div className="flex items-center justify-between text-caption text-body">
                              <span className="inline-flex items-center gap-1 font-semibold text-ink">
                                <Icon name="store" size={12} /> Phản hồi của quán
                              </span>
                              {rev.replyAt && <span>{new Date(rev.replyAt).toLocaleDateString('vi-VN')}</span>}
                            </div>
                            <p className="mt-1 text-body-sm text-ink">{rev.replyText}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>
                );
              })}

              {reviewTotal > 10 && (
                <Pagination
                  className="mt-base border-t border-hairline pt-base"
                  total={reviewTotal}
                  pageSize={10}
                  page={reviewPage}
                  onChange={setReviewPage}
                />
              )}
            </div>
          )}
        </div>
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
                  maxLength={500}
                  placeholder="Chia sẻ cảm nhận của bạn về quán ăn..."
                  value={editComment}
                  onChange={(e) => setEditComment(e.target.value.slice(0, 500))}
                />
                <div className="mt-1 text-right text-[11px] text-muted">
                  {editComment.length}/500 ký tự
                </div>
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

function RestaurantReviewsSkeleton() {
  return (
    <div className="container-page py-xl space-y-base">
      <Skeleton className="h-5 w-36" />
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-40" />
        </div>
        <Skeleton className="h-9 w-32 rounded-lg" />
      </div>

      <div className="grid gap-base md:grid-cols-3">
        <Card padded className="space-y-3">
          <Skeleton className="h-5 w-28" />
          <Skeleton className="h-10 w-20" />
          <Skeleton className="h-4 w-32" />
        </Card>
        <Card padded className="space-y-2 md:col-span-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="h-4 w-12" />
              <Skeleton className="h-3 flex-1 rounded-full" />
              <Skeleton className="h-4 w-8" />
            </div>
          ))}
        </Card>
      </div>

      <div className="grid gap-base md:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} padded className="space-y-3">
            <div className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="space-y-1.5 flex-1">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </Card>
        ))}
      </div>
    </div>
  );
}
