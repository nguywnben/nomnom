-- One order may contain one restaurant review and one review for each purchased dish.
ALTER TABLE reviews ADD KEY idx_reviews_order (order_id);
ALTER TABLE reviews DROP INDEX order_id;
ALTER TABLE reviews DROP INDEX unique_order_item;

ALTER TABLE reviews
  ADD UNIQUE KEY uq_reviews_order_item (order_id, menu_item_id),
  ADD KEY idx_reviews_menu_visible_created (menu_item_id, is_hidden, created_at),
  ADD KEY idx_reviews_rest_visible_created (restaurant_id, menu_item_id, is_hidden, created_at);

-- Existing dump reviews predate dish-level reviews, so they remain restaurant reviews.
UPDATE restaurants r
SET rating_avg = COALESCE((
      SELECT AVG(rv.rating)
      FROM reviews rv
      WHERE rv.restaurant_id = r.id AND rv.menu_item_id IS NULL AND rv.is_hidden = 0
    ), 0),
    review_count = (
      SELECT COUNT(*)
      FROM reviews rv
      WHERE rv.restaurant_id = r.id AND rv.menu_item_id IS NULL AND rv.is_hidden = 0
    );

UPDATE menu_items mi
SET rating_avg = COALESCE((
  SELECT AVG(rv.rating)
  FROM reviews rv
  WHERE rv.menu_item_id = mi.id AND rv.is_hidden = 0
), 0);
