import { useCallback, useEffect, useMemo, useState } from 'react';
import Avatar from '../../components/Avatar.jsx';
import Badge from '../../components/Badge.jsx';
import Button from '../../components/Button.jsx';
import Card from '../../components/Card.jsx';
import Input from '../../components/Input.jsx';
import StarRating from '../../components/StarRating.jsx';
import Tabs from '../../components/Tabs.jsx';
import EmptyState from '../../components/EmptyState.jsx';
import Pagination from '../../components/Pagination.jsx';
import { useApp } from '../../context/AppContext.jsx';
import { fetchAdminReviews, updateAdminReviewHidden } from '../../lib/api.js';

const PAGE_SIZE = 10;

export default function AdminReviewsModeration() {
  const { pushToast } = useApp();
  const [reviews, setReviews] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState('all');
  const [searchText, setSearchText] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Debounce search input
  useEffect(() => {
    const handle = setTimeout(() => {
      setDebouncedSearch(searchText);
      setPage(1);
    }, 250);
    return () => clearTimeout(handle);
  }, [searchText]);

  const loadReviews = useCallback(async () => {
    setLoading(true);
    try {
      let apiHidden = 'all';
      if (tab === 'hidden') apiHidden = 'true';
      else if (tab === 'low') apiHidden = 'false';

      const data = await fetchAdminReviews({
        hidden: apiHidden,
        page,
        q: debouncedSearch,
        ratingMax: tab === 'low' ? 3 : undefined,
      });

      const mapped = (data.items || []).map((r) => ({
        id: r.id,
        customer: r.customer_name || 'Khách ẩn danh',
        customerAvatar: r.customer_avatar,
        restaurant: r.restaurant_name || 'Quán ăn',
        orderId: r.order_code || 'ORD-UNKNOWN',
        rating: r.rating,
        comment: r.comment || '',
        isHidden: Boolean(r.is_hidden),
        at: r.created_at,
      }));

      // Filter locally for the low-rating view
      let filtered = mapped;
      if (tab === 'low') {
        filtered = mapped.filter((r) => r.rating <= 3);
      }

      setReviews(filtered);
      setTotal(data.pagination?.total ?? 0);
    } catch (err) {
      pushToast({
        kind: 'error',
        title: 'Lỗi tải đánh giá',
        message: err.message || 'Không thể kết nối đến server.',
      });
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, page, pushToast, tab]);

  useEffect(() => {
    loadReviews();
  }, [loadReviews]);

  const handleHide = async (id) => {
    try {
      await updateAdminReviewHidden(id, true);
      pushToast({ kind: 'info', title: 'Đã ẩn đánh giá', message: 'Khách hàng và quán sẽ không còn thấy.' });
      loadReviews();
    } catch (err) {
      pushToast({ kind: 'error', title: 'Lỗi', message: err.message || 'Không thể ẩn đánh giá.' });
    }
  };

  const handleUnhide = async (id) => {
    try {
      await updateAdminReviewHidden(id, false);
      pushToast({ kind: 'success', title: 'Đã hiện lại đánh giá', message: 'Đánh giá hiển thị bình thường.' });
      loadReviews();
    } catch (err) {
      pushToast({ kind: 'error', title: 'Lỗi', message: err.message || 'Không thể hiển thị lại đánh giá.' });
    }
  };


  // Filter list by text input in frontend as well
  const displayedReviews = useMemo(() => {
    const needle = debouncedSearch.trim().toLowerCase();
    if (!needle) return reviews;
    return reviews.filter(
      (r) =>
        r.customer.toLowerCase().includes(needle) ||
        r.restaurant.toLowerCase().includes(needle) ||
        r.comment.toLowerCase().includes(needle)
    );
  }, [reviews, debouncedSearch]);

  return (
    <div className="space-y-base">
      <div className="flex flex-wrap items-end justify-between gap-sm">
        <div>
          <div className="text-caption-uppercase text-body">Khách hàng</div>
          <h1 className="text-display-lg text-ink">Kiểm duyệt đánh giá</h1>
        </div>
        <Input
          className="w-full md:w-72"
          leadingIcon="search"
          placeholder="Tìm theo khách, quán, nội dung…"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
        />
      </div>

      <Tabs
        className="w-fit max-w-full"
        items={[
          { value: 'low', label: '≤ 3 sao' },
          { value: 'hidden', label: 'Đã ẩn' },
          { value: 'all', label: 'Tất cả' },
        ]}
        value={tab}
        onChange={(val) => {
          setTab(val);
          setPage(1);
        }}
      />

      {loading ? (
        <Card padded className="text-center text-body py-xxl">
          Đang tải dữ liệu đánh giá...
        </Card>
      ) : displayedReviews.length === 0 ? (
        <EmptyState icon="starFilled" title="Không có đánh giá phù hợp" />
      ) : (
        <div className="space-y-base">
          <ul className="space-y-base">
            {displayedReviews.map((r) => (
              <Card padded as="li" key={r.id}>
                <div className="flex items-start gap-sm">
                  <Avatar name={r.customer} src={r.customerAvatar} />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <div className="text-body-sm font-semibold text-ink">{r.customer}</div>
                        <div className="text-caption text-body">
                          {r.restaurant} · Đơn <span className="nums">#{r.orderId}</span> ·{' '}
                          {new Date(r.at).toLocaleString('vi-VN')}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <StarRating value={r.rating} />
                        {r.isHidden && <Badge tone="error">Đã ẩn</Badge>}
                      </div>
                    </div>
                    <p className="mt-2 text-body-sm text-ink">{r.comment}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      {r.isHidden ? (
                        <Button
                          size="sm"
                          variant="secondary"
                          leadingIcon="check"
                          onClick={() => handleUnhide(r.id)}
                        >
                          Hiện lại
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="secondary"
                          leadingIcon="bellOff"
                          onClick={() => handleHide(r.id)}
                        >
                          Ẩn đánh giá
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </ul>

          <div className="border-t border-hairline pt-base">
            <Pagination total={total} pageSize={PAGE_SIZE} page={page} onChange={setPage} />
          </div>
        </div>
      )}
    </div>
  );
}
