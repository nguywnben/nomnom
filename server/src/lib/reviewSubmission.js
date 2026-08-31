const MAX_COMMENT_LENGTH = 500;

function normalizeRating(value) {
  const rating = Number(value);
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    throw new Error('Đánh giá phải từ 1 đến 5 sao.');
  }
  return rating;
}

function normalizeComment(value) {
  const comment = String(value ?? '').trim();
  if (comment.length > MAX_COMMENT_LENGTH) {
    throw new Error(`Nội dung nhận xét không được vượt quá ${MAX_COMMENT_LENGTH} ký tự.`);
  }
  return comment || null;
}

export function normalizeReviewSubmission(payload, orderMenuItemIds) {
  const allowedItemIds = new Set(orderMenuItemIds.map(Number));
  const rawRestaurantReview = payload?.restaurantReview;
  const hasRestaurantRating = rawRestaurantReview?.rating !== undefined
    && rawRestaurantReview?.rating !== null
    && rawRestaurantReview?.rating !== '';
  const restaurantReview = hasRestaurantRating
    ? {
        rating: normalizeRating(rawRestaurantReview.rating),
        comment: normalizeComment(rawRestaurantReview.comment),
      }
    : null;

  const rawDishReviews = Array.isArray(payload?.dishReviews) ? payload.dishReviews : [];
  const seenItemIds = new Set();
  const dishReviews = rawDishReviews
    .filter((review) => review?.rating !== undefined && review?.rating !== null && review?.rating !== '')
    .map((review) => {
      const menuItemId = Number(review.menuItemId);
      if (!allowedItemIds.has(menuItemId)) {
        throw new Error('Món ăn được đánh giá không thuộc đơn hàng này.');
      }
      if (seenItemIds.has(menuItemId)) {
        throw new Error('Món ăn bị lặp lại trong danh sách đánh giá.');
      }
      seenItemIds.add(menuItemId);
      return {
        menuItemId,
        rating: normalizeRating(review.rating),
        comment: normalizeComment(review.comment),
      };
    });

  if (!restaurantReview && dishReviews.length === 0) {
    throw new Error('Vui lòng chọn ít nhất một đánh giá.');
  }

  return { restaurantReview, dishReviews };
}

export async function refreshReviewStats(connection, { restaurantId, menuItemIds = [] }) {
  for (const menuItemId of [...new Set(menuItemIds.map(Number))]) {
    await connection.query(
      `UPDATE menu_items
       SET rating_avg = COALESCE((
         SELECT AVG(rv.rating) FROM reviews rv
         WHERE rv.menu_item_id = ? AND rv.is_hidden = 0
       ), 0)
       WHERE id = ?`,
      [menuItemId, menuItemId],
    );
  }

  await connection.query(
    `UPDATE restaurants
     SET rating_avg = COALESCE((
           SELECT AVG(rv.rating) FROM reviews rv
           WHERE rv.restaurant_id = ? AND rv.menu_item_id IS NULL AND rv.is_hidden = 0
         ), 0),
         review_count = (
           SELECT COUNT(*) FROM reviews rv
           WHERE rv.restaurant_id = ? AND rv.menu_item_id IS NULL AND rv.is_hidden = 0
         )
     WHERE id = ?`,
    [restaurantId, restaurantId, restaurantId],
  );
}
