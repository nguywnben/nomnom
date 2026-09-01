START TRANSACTION;

DELETE FROM customer_addresses
WHERE customer_id = 2
  AND label IN ('Điểm báo cáo', 'Vị trí tiện dùng')
  AND delivery_note IN ('Địa chỉ trình diễn ngày 03/09/2026', 'Địa chỉ trình diễn bổ sung');

UPDATE restaurants
SET address_line = '205 Nguyễn Văn Linh', ward = 'Phường Tân An',
    district = 'Quận Ninh Kiều', city = 'TP. Cần Thơ',
    latitude = 10.0350000, longitude = 105.7750000,
    updated_at = '2026-08-31 18:38:29.000'
WHERE id = 115 AND slug = 'bun-ca-hung-phu';

UPDATE restaurants
SET address_line = '74 Trương Định', ward = 'Phường Cái Khế',
    district = 'Quận Ninh Kiều', city = 'TP. Cần Thơ',
    latitude = 10.0360000, longitude = 105.7760000,
    updated_at = '2026-08-31 18:38:29.000'
WHERE id = 116 AND slug = 'com-ga-truong-vinh-nguyen';

UPDATE restaurants
SET address_line = '39 Trần Văn Hoài', ward = 'Phường An Cư',
    district = 'Quận Ninh Kiều', city = 'TP. Cần Thơ',
    latitude = 10.0370000, longitude = 105.7770000,
    updated_at = '2026-08-31 18:38:29.000'
WHERE id = 117 AND slug = 'tiem-tra-hung-phu';

UPDATE restaurants
SET address_line = '126 Võ Văn Kiệt', ward = 'Phường An Hòa',
    district = 'Quận Ninh Kiều', city = 'TP. Cần Thơ',
    latitude = 10.0280000, longitude = 105.7680000,
    updated_at = '2026-08-31 18:38:29.000'
WHERE id = 108 AND slug = 'bep-song-que';

UPDATE restaurants
SET address_line = '52 Nguyễn Việt Hồng', ward = 'Phường Tân An',
    district = 'Quận Ninh Kiều', city = 'TP. Cần Thơ',
    latitude = 10.0290000, longitude = 105.7690000,
    updated_at = '2026-08-31 18:38:29.000'
WHERE id = 109 AND slug = 'ca-phe-bo-kenh';

UPDATE restaurants
SET address_line = '18 Đề Thám', ward = 'Phường Cái Khế',
    district = 'Quận Ninh Kiều', city = 'TP. Cần Thơ',
    latitude = 10.0300000, longitude = 105.7700000,
    updated_at = '2026-08-31 18:38:29.000'
WHERE id = 110 AND slug = 'an-vat-cho-chieu';

COMMIT;
