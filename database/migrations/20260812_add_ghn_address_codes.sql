ALTER TABLE customer_addresses
  ADD COLUMN ghn_province_id INT UNSIGNED NULL AFTER city,
  ADD COLUMN ghn_district_id INT UNSIGNED NULL AFTER ghn_province_id,
  ADD COLUMN ghn_ward_code VARCHAR(20) NULL AFTER ghn_district_id,
  ADD KEY idx_customer_addresses_ghn_route (ghn_district_id, ghn_ward_code);
