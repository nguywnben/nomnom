import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeReviewSubmission } from './reviewSubmission.js';

test('accepts an optional restaurant review with an empty comment', () => {
  const result = normalizeReviewSubmission(
    { restaurantReview: { rating: 5, comment: '   ' }, dishReviews: [] },
    [11, 12],
  );

  assert.deepEqual(result, {
    restaurantReview: { rating: 5, comment: null },
    dishReviews: [],
  });
});

test('accepts reviews for only some dishes in the order', () => {
  const result = normalizeReviewSubmission(
    { dishReviews: [{ menuItemId: 12, rating: 4, comment: 'Ngon' }] },
    [11, 12],
  );

  assert.equal(result.restaurantReview, null);
  assert.deepEqual(result.dishReviews, [{ menuItemId: 12, rating: 4, comment: 'Ngon' }]);
});

test('rejects a submission without any selected rating', () => {
  assert.throws(
    () => normalizeReviewSubmission({ restaurantReview: null, dishReviews: [] }, [11]),
    /ít nhất một đánh giá/i,
  );
});

test('rejects dish reviews for an item outside the order', () => {
  assert.throws(
    () => normalizeReviewSubmission({ dishReviews: [{ menuItemId: 99, rating: 5 }] }, [11]),
    /không thuộc đơn hàng/i,
  );
});

test('rejects duplicate dish reviews and ratings outside one to five', () => {
  assert.throws(
    () => normalizeReviewSubmission({ dishReviews: [{ menuItemId: 11, rating: 0 }] }, [11]),
    /từ 1 đến 5 sao/i,
  );
  assert.throws(
    () => normalizeReviewSubmission({ dishReviews: [{ menuItemId: 11, rating: 5 }, { menuItemId: 11, rating: 4 }] }, [11]),
    /bị lặp lại/i,
  );
});
