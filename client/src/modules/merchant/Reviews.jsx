import clsx from 'clsx';
import { useCallback, useEffect, useMemo, useState } from 'react';
import Avatar from '../../components/Avatar.jsx';
import Badge from '../../components/Badge.jsx';
import Button from '../../components/Button.jsx';
import Card from '../../components/Card.jsx';
import EmptyState from '../../components/EmptyState.jsx';
import Icon from '../../components/Icon.jsx';
import { Select, Textarea } from '../../components/Input.jsx';
import Pagination from '../../components/Pagination.jsx';
import StarRating from '../../components/StarRating.jsx';
import { useApp } from '../../context/AppContext.jsx';
import { fetchMerchantReviewsApi, replyMerchantReviewApi } from '../../lib/api.js';

const PAGE_SIZE = 10;

export default function MerchantReviews() {
  const { pushToast } = useApp();
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [summary, setSummary] = useState({ total: 0, restaurantCount: 0, dishCount: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [replyingId, setReplyingId] = useState(null);
  const [replyDrafts, setReplyDrafts] = useState({});
  const [savingId, setSavingId] = useState(null);
  const [targetFilter, setTargetFilter] = useState('all');
  const [ratingFilter, setRatingFilter] = useState('all');
  const [replyFilter, setReplyFilter] = useState('all');

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await fetchMerchantReviewsApi({
        page,
        limit: PAGE_SIZE,
        rating: ratingFilter === 'all' ? undefined : Number(ratingFilter),
        replied: replyFilter,
        target: targetFilter,
      });
      setItems(data?.items ?? []);
      setTotal(data?.total ?? 0);
      if (data?.summary) {
        setSummary(data.summary);
      }
    } catch (err) {
      setError(err.message ?? 'Không thể tải đánh giá.');
    } finally {
      setLoading(false);
    }
  }, [page, ratingFilter, replyFilter, targetFilter]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const stats = useMemo(() => {
    if (items.length === 0) return { avg: 0, count: 0 };
    return {
      avg: items.reduce((sum, item) => sum + Number(item.rating ?? 0), 0) / items.length,
      count: items.length,
    };
  }, [items]);

  const distribution = useMemo(() => {
    const counts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    items.forEach((item) => {
      const star = Math.round(Number(item.rating || 0));
      if (counts[star] !== undefined) counts[star]++;
    });
    return counts;
  }, [items]);

  const submitReply = async (reviewId) => {
    const replyText = String(replyDrafts[reviewId] ?? '').trim();
    if (!replyText) {
      pushToast({ kind: 'error', title: 'Thiếu nội dung', message: 'Vui lòng nhập phản hồi.' });
      return;
    }

    setSavingId(reviewId);
    try {
      const data = await replyMerchantReviewApi(reviewId, replyText);
      setItems((cur) =>
        cur.map((item) =>
          Number(item.id) === Number(reviewId)
            ? { ...item, replyText: data.review.replyText, replyAt: data.review.replyAt }
            : item,
        ),
      );
      setReplyDrafts((cur) => ({ ...cur, [reviewId]: '' }));
      setReplyingId(null);
      pushToast({ kind: 'success', title: 'Đã phản hồi', message: 'Khách sẽ thấy phản hồi trong trang quán.' });
    } catch (err) {
      pushToast({ kind: 'error', title: 'Không thể gửi phản hồi', message: err.message ?? 'Vui lòng thử lại.' });
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="space-y-base">
      <div className="flex flex-wrap items-end justify-between gap-base">
        <div>
          <div className="text-caption-uppercase text-body">Chăm sóc Khách hàng</div>
          <h1 className="text-display-lg text-ink">Đánh giá & Phản hồi Khách hàng</h1>
          <p className="mt-xs text-body-sm text-body">
            Xem phản hồi chất lượng món ăn, dịch vụ phục vụ và gửi câu trả lời trực tiếp đến thực khách.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-xs">
          <Badge tone="outline">Tổng {summary.total || items.length} đánh giá</Badge>
          <Badge tone="default">{summary.restaurantCount || 0} quán</Badge>
          <Badge tone="default">{summary.dishCount || 0} món</Badge>
        </div>
      </div>

      {/* Category Tabs & Filters Bar (Tương tự /merchant/menu) */}
      <div className="flex flex-col gap-sm lg:flex-row lg:items-center lg:justify-between border-b border-hairline pb-sm">
        {/* Bên trái: Nút lọc phân loại kiểu Menu.jsx */}
        <div className="flex max-w-full items-center gap-xs overflow-x-auto no-scrollbar flex-1 min-w-0 pb-1">
          {[
            { id: 'all', label: 'Tất cả', count: summary.total },
            { id: 'restaurant', label: 'Đánh giá Quán & Đơn', count: summary.restaurantCount },
            { id: 'dish', label: 'Đánh giá Món ăn', count: summary.dishCount },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                setTargetFilter(tab.id);
                setPage(1);
              }}
              className={clsx(
                'h-9 inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-md px-sm text-button transition-colors shrink-0 cursor-pointer',
                targetFilter === tab.id
                  ? 'bg-primary text-on-primary shadow-xs'
                  : 'bg-surface-card border border-hairline-strong text-ink hover:bg-canvas-soft',
              )}
            >
              <span>{tab.label}</span>
              <span
                className={clsx(
                  'rounded-full px-1.5 py-0.2 text-caption nums',
                  targetFilter === tab.id ? 'bg-white/20 text-white' : 'bg-canvas-soft text-body',
                )}
              >
                {tab.count ?? 0}
              </span>
            </button>
          ))}
        </div>

        {/* Bên phải: 2 Select nhỏ gọn */}
        <div className="flex flex-wrap items-center gap-xs shrink-0">
          <select
            className="h-9 rounded-md border border-hairline-strong bg-surface-card px-3 text-body-sm text-ink outline-none cursor-pointer focus:border-ink transition-colors"
            value={ratingFilter}
            onChange={(e) => {
              setRatingFilter(e.target.value);
              setPage(1);
            }}
            aria-label="Lọc theo số sao"
          >
            <option value="all">Tất cả mức đánh giá</option>
            <option value="5">5 sao</option>
            <option value="4">4 sao</option>
            <option value="3">3 sao</option>
            <option value="2">2 sao</option>
            <option value="1">1 sao</option>
          </select>

          <select
            className="h-9 rounded-md border border-hairline-strong bg-surface-card px-3 text-body-sm text-ink outline-none cursor-pointer focus:border-ink transition-colors"
            value={replyFilter}
            onChange={(e) => {
              setReplyFilter(e.target.value);
              setPage(1);
            }}
            aria-label="Lọc theo phản hồi"
          >
            <option value="all">Tất cả trạng thái phản hồi</option>
            <option value="false">Chưa phản hồi</option>
            <option value="true">Đã phản hồi</option>
          </select>
        </div>
      </div>

      <div className="grid gap-base lg:grid-cols-[280px_1fr]">
        <Card padded className="h-fit space-y-base">
          <div>
            <div className="text-caption-uppercase text-body">Điểm trung bình</div>
            <div className="text-display-lg text-ink nums mt-1">{stats.avg.toFixed(1)}</div>
            <div className="mt-1">
              <StarRating value={stats.avg} size={20} />
            </div>
            <div className="mt-1 text-caption text-body">
              {stats.count} đánh giá phù hợp
            </div>
          </div>

          {/* Phân bổ tỷ lệ sao 1-5 sao */}
          <div className="space-y-1.5 border-t border-hairline pt-sm">
            <div className="text-caption-uppercase text-body text-[11px] mb-1">Phân bổ số sao</div>
            {[5, 4, 3, 2, 1].map((star) => {
              const count = distribution[star] || 0;
              const percent = stats.count > 0 ? (count / stats.count) * 100 : 0;
              return (
                <div key={star} className="flex items-center gap-2 text-caption">
                  <span className="w-5 text-body text-right font-medium">{star}★</span>
                  <div className="h-1.5 flex-1 rounded-full bg-canvas-soft overflow-hidden">
                    <div
                      className="h-full rounded-full bg-primary transition-all duration-300"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                  <span className="w-5 text-body text-left nums">{count}</span>
                </div>
              );
            })}
          </div>
        </Card>

        <div className="space-y-base">
          {loading ? (
            <Card padded>
              <div className="py-xl text-center text-body">Đang tải đánh giá...</div>
            </Card>
          ) : error ? (
            <Card padded>
              <div className="space-y-sm text-center">
                <div className="text-title-md text-ink">Không thể tải đánh giá</div>
                <p className="text-body text-body-sm">{error}</p>
                <Button onClick={loadData}>Thử lại</Button>
              </div>
            </Card>
          ) : items.length === 0 ? (
            <EmptyState
              icon="starFilled"
              title="Chưa có đánh giá nào"
              message="Khi khách hàng gửi đánh giá cho đơn hàng hoặc món ăn, nhận xét sẽ xuất hiện ở đây."
            />
          ) : (
            <div className="space-y-base">
              {items.map((review) => (
                <Card key={review.id} padded className="space-y-sm">
                  <div className="flex items-start gap-sm">
                    <Avatar src={review.customerAvatar} name={review.customerName} />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-body-sm font-semibold text-ink">{review.customerName}</span>
                            {/* Phân loại đánh giá Quán hay Đánh giá Món */}
                            {review.menuItemId ? (
                              <span className="inline-flex items-center gap-1.5 rounded bg-canvas-soft border border-hairline px-2 py-0.5 text-caption font-medium text-ink">
                                {review.menuItemImage ? (
                                  <img
                                    src={review.menuItemImage}
                                    alt={review.menuItemName}
                                    className="h-4 w-4 rounded object-cover border border-hairline shrink-0"
                                    onError={(e) => {
                                      e.target.style.display = 'none';
                                    }}
                                  />
                                ) : (
                                  <Icon name="tag" size={12} className="text-primary shrink-0" />
                                )}
                                <span className="font-semibold text-ink">{review.menuItemName || `#${review.menuItemId}`}</span>
                              </span>
                            ) : (
                              <Badge tone="outline" className="text-caption">
                                Đánh giá quán
                              </Badge>
                            )}
                          </div>
                          <div className="mt-0.5 text-caption text-body">
                            Đơn <span className="nums font-medium text-ink">{review.orderCode ?? `#${review.orderId}`}</span> · {new Date(review.createdAt).toLocaleDateString('vi-VN')}
                          </div>
                        </div>
                        <StarRating value={review.rating} size={18} />
                      </div>

                      <p className="mt-2 text-body-sm text-ink leading-relaxed">
                        {review.comment || (
                          <span className="text-muted italic">Khách hàng chỉ chấm {review.rating} sao và không để lại bình luận.</span>
                        )}
                      </p>

                      {review.replyText ? (
                        <div className="mt-sm rounded-md border border-hairline-strong bg-canvas-soft p-sm">
                          <div className="flex items-center justify-between text-caption text-body">
                            <span className="inline-flex items-center gap-1 font-semibold text-ink">
                              <Icon name="store" size={12} /> Phản hồi của quán
                            </span>
                            {review.replyAt && <span>{new Date(review.replyAt).toLocaleDateString('vi-VN')}</span>}
                          </div>
                          <p className="mt-1 text-body-sm text-ink">{review.replyText}</p>
                        </div>
                      ) : replyingId === review.id ? (
                        <div className="mt-sm space-y-2">
                          <Textarea
                            rows={3}
                            placeholder="Cảm ơn bạn đã đóng góp ý kiến cho quán…"
                            value={replyDrafts[review.id] ?? ''}
                            onChange={(e) => setReplyDrafts((cur) => ({ ...cur, [review.id]: e.target.value }))}
                          />
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => {
                                setReplyingId(null);
                                setReplyDrafts((cur) => ({ ...cur, [review.id]: '' }));
                              }}
                            >
                              Hủy
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => submitReply(review.id)}
                              loading={savingId === review.id}
                              leadingIcon="send"
                            >
                              Gửi phản hồi
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="mt-2 flex items-center gap-2">
                          <Badge tone="warning">Chưa phản hồi</Badge>
                          <button
                            onClick={() => setReplyingId(review.id)}
                            className="text-button text-caption text-text-link hover:underline cursor-pointer"
                          >
                            Trả lời khách
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              ))}

              {total > PAGE_SIZE && (
                <div className="flex justify-center pt-base">
                  <Pagination
                    total={total}
                    pageSize={PAGE_SIZE}
                    page={page}
                    onChange={setPage}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
