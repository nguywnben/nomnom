-- Align the six synthetic nearby restaurants with the two locations used for
-- the graduation presentation. This migration is additive/idempotent and does
-- not alter historical orders or financial data.

START TRANSACTION;

UPDATE restaurants
SET address_line = 'Khu ẩm thực Hưng Phú', ward = 'Phường Hưng Phú',
    district = 'Quận Cái Răng', city = 'TP. Cần Thơ',
    latitude = 9.9862000, longitude = 105.7875000,
    updated_at = '2026-09-01 19:30:00.000'
WHERE id = 115 AND slug = 'bun-ca-hung-phu';

UPDATE restaurants
SET address_line = 'Đường Trương Vĩnh Nguyên', ward = 'Phường Hưng Phú',
    district = 'Quận Cái Răng', city = 'TP. Cần Thơ',
    latitude = 9.9881000, longitude = 105.7928000,
    updated_at = '2026-09-01 19:30:00.000'
WHERE id = 116 AND slug = 'com-ga-truong-vinh-nguyen';

UPDATE restaurants
SET address_line = 'Khu dân cư Hưng Phú', ward = 'Phường Hưng Phú',
    district = 'Quận Cái Răng', city = 'TP. Cần Thơ',
    latitude = 9.9799000, longitude = 105.7839000,
    updated_at = '2026-09-01 19:30:00.000'
WHERE id = 117 AND slug = 'tiem-tra-hung-phu';

UPDATE restaurants
SET address_line = 'Ấp Cái Tàu Hạ', ward = 'Cái Tàu Hạ',
    district = 'Phú Hựu', city = 'Đồng Tháp',
    latitude = 10.2504000, longitude = 105.8682000,
    updated_at = '2026-09-01 19:30:00.000'
WHERE id = 108 AND slug = 'bep-song-que';

UPDATE restaurants
SET address_line = 'Ấp Cái Tàu Hạ', ward = 'Cái Tàu Hạ',
    district = 'Phú Hựu', city = 'Đồng Tháp',
    latitude = 10.2547000, longitude = 105.8753000,
    updated_at = '2026-09-01 19:30:00.000'
WHERE id = 109 AND slug = 'ca-phe-bo-kenh';

UPDATE restaurants
SET address_line = 'Ấp Phú Thạnh', ward = 'Cái Tàu Hạ',
    district = 'Phú Hựu', city = 'Đồng Tháp',
    latitude = 10.2427000, longitude = 105.8598000,
    updated_at = '2026-09-01 19:30:00.000'
WHERE id = 110 AND slug = 'an-vat-cho-chieu';

INSERT INTO customer_addresses
  (customer_id, label, recipient_name, recipient_phone, line1, ward,
   district, city, latitude, longitude, delivery_note, is_default, created_at, updated_at)
SELECT 2, 'Điểm báo cáo', 'Nguyễn Minh Anh', '+84901000002',
   'Khu vực báo cáo NomNom', 'Phường Hưng Phú', 'Quận Cái Răng', 'TP. Cần Thơ',
   9.9845360, 105.7889760, 'Địa chỉ trình diễn ngày 03/09/2026', 0,
   '2026-09-01 19:30:00.000', '2026-09-01 19:30:00.000'
WHERE NOT EXISTS (
  SELECT 1 FROM customer_addresses WHERE customer_id = 2 AND label = 'Điểm báo cáo'
);

INSERT INTO customer_addresses
  (customer_id, label, recipient_name, recipient_phone, line1, ward,
   district, city, latitude, longitude, delivery_note, is_default, created_at, updated_at)
SELECT 2, 'Vị trí tiện dùng', 'Nguyễn Minh Anh', '+84901000002',
   'Khu vực Cái Tàu Hạ', 'Cái Tàu Hạ', 'Phú Hựu', 'Đồng Tháp',
   10.2499570, 105.8680370, 'Địa chỉ trình diễn bổ sung', 0,
   '2026-09-01 19:30:00.000', '2026-09-01 19:30:00.000'
WHERE NOT EXISTS (
  SELECT 1 FROM customer_addresses WHERE customer_id = 2 AND label = 'Vị trí tiện dùng'
);

UPDATE customer_addresses
SET line1 = 'Khu vực báo cáo NomNom', ward = 'Phường Hưng Phú',
    district = 'Quận Cái Răng', city = 'TP. Cần Thơ',
    latitude = 9.9845360, longitude = 105.7889760,
    delivery_note = 'Địa chỉ trình diễn ngày 03/09/2026',
    updated_at = '2026-09-01 19:30:00.000'
WHERE customer_id = 2 AND label = 'Điểm báo cáo';

UPDATE customer_addresses
SET line1 = 'Khu vực Cái Tàu Hạ', ward = 'Cái Tàu Hạ',
    district = 'Phú Hựu', city = 'Đồng Tháp',
    latitude = 10.2499570, longitude = 105.8680370,
    delivery_note = 'Địa chỉ trình diễn bổ sung',
    updated_at = '2026-09-01 19:30:00.000'
WHERE customer_id = 2 AND label = 'Vị trí tiện dùng';

COMMIT;
