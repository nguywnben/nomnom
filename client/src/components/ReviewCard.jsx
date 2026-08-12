import Avatar from './Avatar.jsx';
import Card from './Card.jsx';
import StarRating from './StarRating.jsx';

export default function ReviewCard({ review }) {
  return (
    <Card padded className="flex flex-col gap-sm">
      <div className="flex items-start gap-sm">
        <Avatar src={review.customerAvatar} name={review.customerName} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <div className="text-body-sm font-semibold text-ink">{review.customerName}</div>
              <div className="text-caption text-body">
                {new Date(review.createdAt).toLocaleDateString('vi-VN')}
              </div>
            </div>
            <StarRating value={review.rating} />
          </div>
          {review.comment ? (
            <p className="mt-sm text-body-sm leading-relaxed text-body">{review.comment}</p>
          ) : (
            <p className="mt-sm text-caption italic text-muted">Khách hàng không để lại nhận xét.</p>
          )}
          {review.replyText && (
            <div className="mt-sm rounded-md border border-hairline-strong bg-canvas-soft p-sm">
              <div className="text-caption font-semibold text-ink">Phản hồi của quán</div>
              <p className="mt-1 text-caption leading-relaxed text-body">{review.replyText}</p>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
