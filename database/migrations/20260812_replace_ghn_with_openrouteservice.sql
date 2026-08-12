-- NomNom now derives delivery fees from route distance instead of GHN area codes.
ALTER TABLE customer_addresses
  DROP COLUMN ghn_province_id,
  DROP COLUMN ghn_district_id,
  DROP COLUMN ghn_ward_code;

ALTER TABLE restaurants
  DROP COLUMN ghn_province_id,
  DROP COLUMN ghn_district_id,
  DROP COLUMN ghn_ward_code,
  DROP COLUMN base_delivery_fee;

ALTER TABLE restaurant_address_change_requests
  DROP COLUMN current_ghn_province_id,
  DROP COLUMN current_ghn_district_id,
  DROP COLUMN current_ghn_ward_code,
  DROP COLUMN proposed_ghn_province_id,
  DROP COLUMN proposed_ghn_district_id,
  DROP COLUMN proposed_ghn_ward_code,
  ADD COLUMN current_latitude DECIMAL(10,7) NULL AFTER current_city,
  ADD COLUMN current_longitude DECIMAL(10,7) NULL AFTER current_latitude,
  ADD COLUMN proposed_latitude DECIMAL(10,7) NULL AFTER proposed_city,
  ADD COLUMN proposed_longitude DECIMAL(10,7) NULL AFTER proposed_latitude;
