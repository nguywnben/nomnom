import clsx from 'clsx';
import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import Badge from '../../components/Badge.jsx';
import Button from '../../components/Button.jsx';
import Card from '../../components/Card.jsx';
import EmptyState from '../../components/EmptyState.jsx';
import Icon from '../../components/Icon.jsx';
import Image from '../../components/Image.jsx';
import Pagination from '../../components/Pagination.jsx';
import ReviewCard from '../../components/ReviewCard.jsx';
import StarRating from '../../components/StarRating.jsx';
import { fetchMenuItemReviewsApi } from '../../lib/api.js';

const PAGE_SIZE = 10;

export default function DishReviews() {
  const { id } = useParams();
  const nav = useNavigate();
  const [page, setPage] = useState(1);
  const [rating, setRating] = useState('');
  const [sort, setSort] = useState('newest');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    fetchMenuItemReviewsApi(id, { page, limit: PAGE_SIZE, rating, sort })
      .then((data) => {
        if (active) setResult(data);
      })
      .catch((err) => {
        if (active) setError(err.message || 'Không thể tải đánh giá món ăn.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [id, page, rating, sort]);

  const item = result?.item;
  const reviews = result?.data ?? [];
  const stats = result?.stats;
  const total = result?.pagination?.total ?? 0;

  return (
    <div className="container-page py-xl space-y-base">
      <div>
        <button
          type="button"
          onClick={() => (window.history.length > 1 ? nav(-1) : nav(`/app/dish/${id}`))}
          className="inline-flex items-center gap-1 text-button text-body hover:text-ink transition-colors cursor-pointer"
        >
          <Icon name="chevronLeft" size={14} /> Quay lại món ăn
        </button>

        {item && (
          <div className="mt-2 flex flex-wrap items-end justify-between gap-base border-b border-hairline pb-base">
            <div className="flex items-center gap-base">
              <Image src={item.imageUrl} alt={item.name} ratio="1" className="h-16 w-16 rounded-lg object-cover border border-hairline shrink-0" />
              <div>
                <div className="text-caption-uppercase text-body">Đánh giá món ăn</div>
                <h1 className="text-display-md text-ink">{item.name}</h1>
                <Link to={`/app/restaurant/${item.restaurantId}`} className="text-body-sm text-text-link hover:underline">
                  {item.restaurantName}
                </Link>
              </div>
            </div>
            <Link to={`/app/dish/${item.id}`} state={{ from: `/app/restaurant/${item.restaurantId}` }}>
              <Button size="sm" variant="secondary" leadingIcon="tag">
                Xem chi tiết món
              </Button>
            </Link>
          </div>
        )}
      </div>

      <div className="grid gap-xl lg:grid-cols-[320px_1fr]">
        {/* Cột trái: Tổng quan điểm số & Biểu đồ phân bổ sao */}
        <div className="space-y-base">
          <Card padded className="space-y-base">
            <div>
              <div className="text-caption-uppercase text-body">Đánh giá trung bình</div>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-display-lg text-ink font-bold nums">
                  {Number(stats?.average ?? item?.ratingAvg ?? 0).toFixed(1)}
                </span>
                <span className="text-body-sm text-body">trên 5</span>
              </div>
              <div className="mt-1">
                <StarRating value={Number(stats?.average ?? item?.ratingAvg ?? 0)} size={20} />
              </div>
              <div className="mt-1 text-caption text-body">
                Dựa trên <strong>{stats?.total ?? total}</strong> lượt đánh giá
              </div>
            </div>

            {/* Thanh phân bổ số sao 5★ đến 1★ */}
            <div className="space-y-1.5 border-t border-hairline pt-sm">
              <div className="text-caption-uppercase text-body text-[11px] mb-1">Chi tiết mức sao</div>
              {[5, 4, 3, 2, 1].map((star) => {
                const count = stats?.distribution?.[star] ?? 0;
                const totalCount = stats?.total ?? total;
                const percent = totalCount > 0 ? (count / totalCount) * 100 : 0;
                const isSelected = rating === String(star);

                return (
                  <button
                    key={star}
                    type="button"
                    onClick={() => {
                      setRating(isSelected ? '' : String(star));
                      setPage(1);
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
        </div>

        {/* Cột phải: Toolbar bộ lọc & Danh sách nhận xét */}
        <div className="space-y-base">
          {/* Thanh Toolbar lọc */}
          <div className="flex flex-wrap items-center justify-between gap-sm border-b border-hairline pb-sm">
            <div className="text-body-sm font-semibold text-ink">
              {rating ? `Đánh giá ${rating} sao` : 'Tất cả đánh giá'}
              <span className="text-caption font-normal text-body ml-2">({total} nhận xét)</span>
            </div>

            <div className="flex items-center gap-xs">
              <select
                className="h-9 rounded-md border border-hairline-strong bg-surface-card px-3 text-body-sm text-ink outline-none cursor-pointer focus:border-ink transition-colors"
                value={rating}
                onChange={(event) => {
                  setRating(event.target.value);
                  setPage(1);
                }}
                aria-label="Lọc theo số sao"
              >
                <option value="">Tất cả số sao</option>
                <option value="5">5 sao ({stats?.distribution?.[5] ?? 0})</option>
                <option value="4">4 sao ({stats?.distribution?.[4] ?? 0})</option>
                <option value="3">3 sao ({stats?.distribution?.[3] ?? 0})</option>
                <option value="2">2 sao ({stats?.distribution?.[2] ?? 0})</option>
                <option value="1">1 sao ({stats?.distribution?.[1] ?? 0})</option>
              </select>

              <select
                className="h-9 rounded-md border border-hairline-strong bg-surface-card px-3 text-body-sm text-ink outline-none cursor-pointer focus:border-ink transition-colors"
                value={sort}
                onChange={(event) => {
                  setSort(event.target.value);
                  setPage(1);
                }}
                aria-label="Sắp xếp đánh giá"
              >
                <option value="newest">Mới nhất</option>
                <option value="oldest">Cũ nhất</option>
              </select>
            </div>
          </div>

          {/* Danh sách thẻ đánh giá */}
          <div>
            {loading ? (
              <div className="py-xxl text-center text-body">Đang tải đánh giá...</div>
            ) : error ? (
              <EmptyState icon="alert" title="Không tải được đánh giá" message={error} />
            ) : reviews.length === 0 ? (
              <EmptyState
                icon="star"
                title="Chưa có đánh giá phù hợp"
                message="Hãy thử một mức sao khác hoặc quay lại sau."
              />
            ) : (
              <div className="grid gap-base md:grid-cols-2">
                {reviews.map((review) => (
                  <ReviewCard key={review.id} review={review} />
                ))}
              </div>
            )}
          </div>

          {total > PAGE_SIZE && (
            <Pagination
              className="mt-xl border-t border-hairline pt-base"
              total={total}
              pageSize={PAGE_SIZE}
              page={page}
              onChange={setPage}
            />
          )}
        </div>
      </div>
    </div>
  );
}
