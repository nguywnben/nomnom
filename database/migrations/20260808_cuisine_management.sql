-- Allow administrators to manage cuisine types without breaking restaurants
-- that already reference a cuisine.

ALTER TABLE cuisines
  ADD COLUMN is_active tinyint(1) NOT NULL DEFAULT 1 AFTER sort_order,
  ADD COLUMN updated_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER created_at;
