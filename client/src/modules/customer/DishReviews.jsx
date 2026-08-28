import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import EmptyState from '../../components/EmptyState.jsx';
import Icon from '../../components/Icon.jsx';
import Image from '../../components/Image.jsx';
import Pagination from '../../components/Pagination.jsx';
import ReviewCard from '../../components/ReviewCard.jsx';
import { Select } from '../../components/Input.jsx';
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

  return (
    <div className="container-page py-xl">
      <button
        type="button"
        onClick={() => nav(-1)}
        className="inline-flex items-center gap-1 text-button text-body hover:text-ink transition-colors"
      >
        <Icon name="chevronLeft" size={14} /> Quay lại món ăn
      </button>

      {item && (
        <div className="mt-base flex items-center gap-base border-b border-hairline pb-base">
          <Image src={item.imageUrl} alt={item.name} ratio="1" className="h-20 w-20 rounded-md" />
          <div className="min-w-0 flex-1">
            <div className="text-caption-uppercase text-body">Đánh giá món ăn</div>
            <h1 className="text-display-md text-ink">{item.name}</h1>
            <Link to={`/app/restaurant/${item.restaurantId}`} className="text-body-sm text-text-link hover:underline">
              {item.restaurantName}
            </Link>
          </div>
          <div className="text-right">
            <div className="nums text-display-sm text-ink">{Number(stats?.average ?? 0).toFixed(1)}</div>
            <StarRating value={Number(stats?.average ?? 0)} />
            <div className="text-caption text-body">{stats?.total ?? 0} đánh giá</div>
          </div>
        </div>
      )}

      <div className="mt-base flex flex-wrap gap-sm">
        <Select
          className="w-48"
          aria-label="Lọc theo số sao"
          value={rating}
          onChange={(event) => { setRating(event.target.value); setPage(1); }}
          options={[
            { value: '', label: 'Tất cả số sao' },
            ...[5, 4, 3, 2, 1].map((star) => ({ value: String(star), label: `${star} sao (${stats?.distribution?.[star] ?? 0})` })),
          ]}
        />
        <Select
          className="w-48"
          aria-label="Sắp xếp đánh giá"
          value={sort}
          onChange={(event) => { setSort(event.target.value); setPage(1); }}
          options={[
            { value: 'newest', label: 'Mới nhất' },
            { value: 'oldest', label: 'Cũ nhất' },
          ]}
        />
      </div>

      <div className="mt-base">
        {loading ? (
          <div className="py-xxl text-center text-body">Đang tải đánh giá...</div>
        ) : error ? (
          <EmptyState icon="alert" title="Không tải được đánh giá" message={error} />
        ) : reviews.length === 0 ? (
          <EmptyState icon="star" title="Chưa có đánh giá phù hợp" message="Hãy thử một mức sao khác hoặc quay lại sau." />
        ) : (
          <div className="grid gap-base md:grid-cols-2">
            {reviews.map((review) => <ReviewCard key={review.id} review={review} />)}
          </div>
        )}
      </div>

      {(result?.pagination?.total ?? 0) > PAGE_SIZE && (
        <Pagination
          className="mt-xl border-t border-hairline pt-base"
          total={result.pagination.total}
          pageSize={PAGE_SIZE}
          page={page}
          onChange={setPage}
        />
      )}
    </div>
  );
}
