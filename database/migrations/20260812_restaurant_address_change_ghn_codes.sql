ALTER TABLE restaurant_address_change_requests
  ADD COLUMN current_ghn_province_id INT UNSIGNED NULL AFTER current_city,
  ADD COLUMN current_ghn_district_id INT UNSIGNED NULL AFTER current_ghn_province_id,
  ADD COLUMN current_ghn_ward_code VARCHAR(20) NULL AFTER current_ghn_district_id,
  ADD COLUMN proposed_ghn_province_id INT UNSIGNED NULL AFTER proposed_city,
  ADD COLUMN proposed_ghn_district_id INT UNSIGNED NULL AFTER proposed_ghn_province_id,
  ADD COLUMN proposed_ghn_ward_code VARCHAR(20) NULL AFTER proposed_ghn_district_id;
