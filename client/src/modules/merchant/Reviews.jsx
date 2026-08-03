import { useEffect, useMemo, useState } from 'react';
import Avatar from '../../components/Avatar.jsx';
import Badge from '../../components/Badge.jsx';
import Button from '../../components/Button.jsx';
import Card from '../../components/Card.jsx';
import EmptyState from '../../components/EmptyState.jsx';
import Icon from '../../components/Icon.jsx';
import { Textarea } from '../../components/Input.jsx';
import StarRating from '../../components/StarRating.jsx';
import { useApp } from '../../context/AppContext.jsx';
import { fetchMerchantReviewsApi, replyMerchantReviewApi } from '../../lib/api.js';

export default function MerchantReviews() {
  const { pushToast } = useApp();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [replyingId, setReplyingId] = useState(null);
  const [replyDrafts, setReplyDrafts] = useState({});
  const [savingId, setSavingId] = useState(null);

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await fetchMerchantReviewsApi();
      setItems(data?.items ?? []);
    } catch (err) {
      setError(err.message ?? 'Không thể tải review.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const stats = useMemo(() => {
    if (items.length === 0) return { avg: 0, count: 0 };
    return {
      avg: items.reduce((sum, item) => sum + Number(item.rating ?? 0), 0) / items.length,
      count: items.length,
    };
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
      setItems((cur) => cur.map((item) => (Number(item.id) === Number(reviewId) ? { ...item, replyText: data.review.replyText, replyAt: data.review.replyAt } : item)));
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
          <div className="text-caption-uppercase text-body">Khách hàng</div>
          <h1 className="text-display-lg text-ink">Đánh giá</h1>
        </div>
        <Badge tone="outline">{stats.count} đánh giá</Badge>
      </div>

      <div className="grid gap-base lg:grid-cols-[280px_1fr]">
        <Card padded>
          <div className="text-display-lg text-ink nums">{stats.avg.toFixed(1)}</div>
          <StarRating value={stats.avg} />
          <div className="mt-1 text-caption text-body">{stats.count} đánh giá từ khách hàng</div>
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
              title="Chưa có đánh giá"
              message="Khi khách đánh giá xong đơn hàng, các nhận xét sẽ xuất hiện ở đây."
            />
          ) : (
            <div className="space-y-base">
              {items.map((review) => (
                <Card key={review.id} padded>
                  <div className="flex items-start gap-sm">
                    <Avatar src={review.customerAvatar} name={review.customerName} />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <div className="text-body-sm font-semibold text-ink">{review.customerName}</div>
                          <div className="text-caption text-body">
                            Đơn <span className="nums">{review.orderCode ?? review.orderId}</span> · {new Date(review.createdAt).toLocaleDateString('vi-VN')}
                          </div>
                        </div>
                        <StarRating value={review.rating} />
                      </div>
                      <p className="mt-2 text-body-sm text-ink">{review.comment}</p>

                      {review.replyText ? (
                        <div className="mt-sm rounded-md border border-hairline-strong bg-canvas-soft p-sm">
                          <div className="flex items-center justify-between text-caption text-body">
                            <span className="inline-flex items-center gap-1">
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
                            placeholder="Cảm ơn bạn đã đánh giá…"
                            value={replyDrafts[review.id] ?? ''}
                            onChange={(e) => setReplyDrafts((cur) => ({ ...cur, [review.id]: e.target.value }))}
                          />
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="secondary"
                              onClick={() => {
                                setReplyingId(null);
                                setReplyDrafts((cur) => ({ ...cur, [review.id]: '' }));
                              }}
                            >
                              Hủy
                            </Button>
                            <Button onClick={() => submitReply(review.id)} loading={savingId === review.id} leadingIcon="send">
                              Gửi phản hồi
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="mt-2 flex items-center gap-2">
                          <Badge tone="warning">Chưa phản hồi</Badge>
                          <button
                            onClick={() => setReplyingId(review.id)}
                            className="text-button text-text-link hover:underline"
                          >
                            Trả lời khách
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
