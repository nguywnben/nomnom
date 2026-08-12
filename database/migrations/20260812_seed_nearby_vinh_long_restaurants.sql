-- Demo data for testing nearby restaurant discovery around 10.2498312, 105.8677540.
-- Names and menu descriptions are fictional. Coordinates are intentionally near the supplied point.

START TRANSACTION;

INSERT INTO users (email, phone, password_hash, full_name, avatar_url, primary_role, status, email_verified_at)
VALUES
  ('seed.bep-song-que@nomnom.example', '+84910990001', '$2b$10$CJ7Jw5i.tGECVqMW/dpzreHp4n.oQPZzbZI9LY9N6uZPNG4vrIfEO', 'Chủ quán Bếp Sông Quê', 'https://api.dicebear.com/9.x/avataaars/svg?seed=BepSongQue&radius=50', 'merchant', 'active', NOW()),
  ('seed.ca-phe-bo-kenh@nomnom.example', '+84910990002', '$2b$10$CJ7Jw5i.tGECVqMW/dpzreHp4n.oQPZzbZI9LY9N6uZPNG4vrIfEO', 'Chủ quán Cà Phê Bờ Kênh', 'https://api.dicebear.com/9.x/avataaars/svg?seed=CaPheBoKenh&radius=50', 'merchant', 'active', NOW()),
  ('seed-an-vat-cho-chieu@nomnom.example', '+84910990003', '$2b$10$CJ7Jw5i.tGECVqMW/dpzreHp4n.oQPZzbZI9LY9N6uZPNG4vrIfEO', 'Chủ quán Ăn Vặt Chợ Chiều', 'https://api.dicebear.com/9.x/avataaars/svg?seed=AnVatChoChieu&radius=50', 'merchant', 'active', NOW())
ON DUPLICATE KEY UPDATE email = VALUES(email);

INSERT IGNORE INTO user_roles (user_id, role, granted_at)
SELECT id, 'merchant', NOW()
FROM users
WHERE email IN ('seed.bep-song-que@nomnom.example', 'seed.ca-phe-bo-kenh@nomnom.example', 'seed-an-vat-cho-chieu@nomnom.example');

INSERT INTO cuisines (name, slug, icon_url, sort_order, is_active)
VALUES ('Việt Nam', 'vietnamese', 'https://images.unsplash.com/photo-1559314809-0d155014e29e?auto=format&fit=crop&w=800&q=80', 8, 1)
ON DUPLICATE KEY UPDATE name = VALUES(name), icon_url = VALUES(icon_url), is_active = 1;

INSERT INTO restaurants (owner_user_id, cuisine_id, name, slug, tagline, description, phone, banner_url, logo_url, address_line, ward, district, city, latitude, longitude, min_order_amount, avg_prep_time_min, rating_avg, review_count, commission_rate, is_open_now, status, approved_at, approved_by_admin_id)
SELECT u.id, c.id, 'Bếp Sông Quê', 'bep-song-que-vi-tri-demo', 'Cơm nhà, canh nóng và món miền Tây mỗi ngày.', 'Bữa cơm miền Tây với món mặn, món canh và rau theo ngày.', '+84910990001', 'https://images.unsplash.com/photo-1559314809-0d155014e29e?auto=format&fit=crop&w=1400&q=80', 'https://api.dicebear.com/9.x/shapes/svg?seed=BepSongQue&backgroundColor=ffffff', 'Ấp Cái Tàu Hạ', 'Cái Tàu Hạ', 'Phú Hựu', 'Đồng Tháp', 10.2504000, 105.8682000, 30000, 18, 4.70, 86, 15.00, 1, 'active', NOW(), 1
FROM users u JOIN cuisines c ON c.slug = 'vietnamese'
WHERE u.email = 'seed.bep-song-que@nomnom.example'
  AND NOT EXISTS (SELECT 1 FROM restaurants WHERE slug = 'bep-song-que-vi-tri-demo');

INSERT INTO restaurants (owner_user_id, cuisine_id, name, slug, tagline, description, phone, banner_url, logo_url, address_line, ward, district, city, latitude, longitude, min_order_amount, avg_prep_time_min, rating_avg, review_count, commission_rate, is_open_now, status, approved_at, approved_by_admin_id)
SELECT u.id, c.id, 'Cà Phê Bờ Kênh', 'ca-phe-bo-kenh-vi-tri-demo', 'Cà phê pha máy, bánh ngọt và thức uống mát lạnh.', 'Cà phê pha máy, thức uống mát và bánh ngọt dùng trong ngày.', '+84910990002', 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=1400&q=80', 'https://api.dicebear.com/9.x/shapes/svg?seed=CaPheBoKenh&backgroundColor=ffffff', 'Ấp Cái Tàu Hạ', 'Cái Tàu Hạ', 'Phú Hựu', 'Đồng Tháp', 10.2547000, 105.8753000, 25000, 10, 4.60, 54, 12.00, 1, 'active', NOW(), 1
FROM users u JOIN cuisines c ON c.slug = 'coffee'
WHERE u.email = 'seed.ca-phe-bo-kenh@nomnom.example'
  AND NOT EXISTS (SELECT 1 FROM restaurants WHERE slug = 'ca-phe-bo-kenh-vi-tri-demo');

INSERT INTO restaurants (owner_user_id, cuisine_id, name, slug, tagline, description, phone, banner_url, logo_url, address_line, ward, district, city, latitude, longitude, min_order_amount, avg_prep_time_min, rating_avg, review_count, commission_rate, is_open_now, status, approved_at, approved_by_admin_id)
SELECT u.id, c.id, 'Ăn Vặt Chợ Chiều', 'an-vat-cho-chieu-vi-tri-demo', 'Món ăn vặt nóng hổi cho buổi xế.', 'Các món ăn vặt quen thuộc, được chuẩn bị nóng khi nhận đơn.', '+84910990003', 'https://images.unsplash.com/photo-1626804475297-41608ea09aeb?auto=format&fit=crop&w=1400&q=80', 'https://api.dicebear.com/9.x/shapes/svg?seed=AnVatChoChieu&backgroundColor=ffffff', 'Ấp Phú Thạnh', 'Cái Tàu Hạ', 'Phú Hựu', 'Đồng Tháp', 10.2427000, 105.8598000, 20000, 12, 4.50, 39, 12.00, 1, 'active', NOW(), 1
FROM users u JOIN cuisines c ON c.slug = 'vietnamese'
WHERE u.email = 'seed-an-vat-cho-chieu@nomnom.example'
  AND NOT EXISTS (SELECT 1 FROM restaurants WHERE slug = 'an-vat-cho-chieu-vi-tri-demo');

-- Keep previously seeded rows aligned with the reverse-geocoded coordinates.
UPDATE restaurants
SET description = 'Bữa cơm miền Tây với món mặn, món canh và rau theo ngày.',
    address_line = 'Ấp Cái Tàu Hạ', ward = 'Cái Tàu Hạ', district = 'Phú Hựu', city = 'Đồng Tháp'
WHERE slug = 'bep-song-que-vi-tri-demo';

UPDATE restaurants
SET description = 'Cà phê pha máy, thức uống mát và bánh ngọt dùng trong ngày.',
    address_line = 'Ấp Cái Tàu Hạ', ward = 'Cái Tàu Hạ', district = 'Phú Hựu', city = 'Đồng Tháp'
WHERE slug = 'ca-phe-bo-kenh-vi-tri-demo';

UPDATE restaurants
SET description = 'Các món ăn vặt quen thuộc, được chuẩn bị nóng khi nhận đơn.',
    address_line = 'Ấp Phú Thạnh', ward = 'Cái Tàu Hạ', district = 'Phú Hựu', city = 'Đồng Tháp'
WHERE slug = 'an-vat-cho-chieu-vi-tri-demo';

INSERT INTO menu_categories (restaurant_id, name, description, sort_order, is_active)
SELECT r.id, v.name, NULL, v.sort_order, 1
FROM restaurants r
JOIN (SELECT 'bep-song-que-vi-tri-demo' AS slug, 'Cơm phần' AS name, 1 AS sort_order UNION ALL SELECT 'bep-song-que-vi-tri-demo', 'Món nước', 2 UNION ALL SELECT 'ca-phe-bo-kenh-vi-tri-demo', 'Cà phê', 1 UNION ALL SELECT 'ca-phe-bo-kenh-vi-tri-demo', 'Bánh ngọt', 2 UNION ALL SELECT 'an-vat-cho-chieu-vi-tri-demo', 'Ăn vặt', 1 UNION ALL SELECT 'an-vat-cho-chieu-vi-tri-demo', 'Nước uống', 2) v ON v.slug = r.slug
WHERE NOT EXISTS (SELECT 1 FROM menu_categories mc WHERE mc.restaurant_id = r.id AND mc.name = v.name);

INSERT INTO menu_items (restaurant_id, category_id, name, description, image_url, price, prep_time_min, in_stock, is_featured, sort_order, total_sold, rating_avg, status)
SELECT r.id, mc.id, v.name, v.description, v.image_url, v.price, v.prep_time_min, 1, v.is_featured, v.sort_order, v.total_sold, v.rating_avg, 'active'
FROM restaurants r
JOIN menu_categories mc ON mc.restaurant_id = r.id
JOIN (
  SELECT 'bep-song-que-vi-tri-demo' AS restaurant_slug, 'Cơm phần' AS category_name, 'Cơm sườn nướng' AS name, 'Sườn nướng, trứng ốp la, đồ chua và canh trong ngày.' AS description, 'https://images.unsplash.com/photo-1559314809-0d155014e29e?auto=format&fit=crop&w=800&q=80' AS image_url, 48000 AS price, 15 AS prep_time_min, 1 AS is_featured, 1 AS sort_order, 132 AS total_sold, 4.80 AS rating_avg
  UNION ALL SELECT 'bep-song-que-vi-tri-demo', 'Cơm phần', 'Cơm gà xối mỡ', 'Gà chiên giòn, cơm trắng, dưa chua và nước chấm.', 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?auto=format&fit=crop&w=800&q=80', 52000, 18, 1, 2, 94, 4.70
  UNION ALL SELECT 'bep-song-que-vi-tri-demo', 'Món nước', 'Canh chua cá', 'Canh chua thanh vị, dùng kèm cơm trắng.', 'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=800&q=80', 35000, 12, 0, 1, 51, 4.60
  UNION ALL SELECT 'bep-song-que-vi-tri-demo', 'Món nước', 'Trà tắc mật ong', 'Trà tắc mát lạnh, ít ngọt.', 'https://images.unsplash.com/photo-1712056407267-1a38c7024a8f?auto=format&fit=crop&w=800&q=80', 18000, 4, 0, 2, 67, 4.50
  UNION ALL SELECT 'ca-phe-bo-kenh-vi-tri-demo', 'Cà phê', 'Cà phê sữa đá', 'Cà phê rang đậm, sữa đặc và đá viên.', 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=800&q=80', 22000, 5, 1, 1, 186, 4.70
  UNION ALL SELECT 'ca-phe-bo-kenh-vi-tri-demo', 'Cà phê', 'Bạc xỉu', 'Sữa tươi, cà phê và đá mát lạnh.', 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=800&q=80', 28000, 5, 1, 2, 118, 4.60
  UNION ALL SELECT 'ca-phe-bo-kenh-vi-tri-demo', 'Bánh ngọt', 'Bánh croissant bơ', 'Croissant nướng nóng, thơm bơ.', 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=800&q=80', 30000, 6, 0, 1, 74, 4.60
  UNION ALL SELECT 'ca-phe-bo-kenh-vi-tri-demo', 'Bánh ngọt', 'Tiramisu ly', 'Kem mascarpone, cacao và cà phê.', 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?auto=format&fit=crop&w=800&q=80', 42000, 5, 0, 2, 43, 4.50
  UNION ALL SELECT 'an-vat-cho-chieu-vi-tri-demo', 'Ăn vặt', 'Bánh tráng trộn', 'Bánh tráng, xoài, trứng cút và sốt me.', 'https://images.unsplash.com/photo-1626804475297-41608ea09aeb?auto=format&fit=crop&w=800&q=80', 25000, 7, 1, 1, 149, 4.70
  UNION ALL SELECT 'an-vat-cho-chieu-vi-tri-demo', 'Ăn vặt', 'Xiên que thập cẩm', 'Năm xiên chiên nóng, kèm tương ớt.', 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80', 35000, 10, 1, 2, 88, 4.50
  UNION ALL SELECT 'an-vat-cho-chieu-vi-tri-demo', 'Nước uống', 'Trà đào cam sả', 'Trà đào thơm, lát cam và sả tươi.', 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?auto=format&fit=crop&w=800&q=80', 30000, 5, 0, 1, 102, 4.60
  UNION ALL SELECT 'an-vat-cho-chieu-vi-tri-demo', 'Nước uống', 'Nước mơ ngâm', 'Nước mơ ngâm, chua ngọt vừa phải.', 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=800&q=80', 22000, 4, 0, 2, 59, 4.40
) v ON v.restaurant_slug = r.slug AND v.category_name = mc.name
WHERE NOT EXISTS (SELECT 1 FROM menu_items mi WHERE mi.restaurant_id = r.id AND mi.name = v.name);

UPDATE menu_items mi
INNER JOIN restaurants r ON r.id = mi.restaurant_id
SET mi.image_url = 'https://images.unsplash.com/photo-1712056407267-1a38c7024a8f?auto=format&fit=crop&w=800&q=80'
WHERE r.slug = 'bep-song-que-vi-tri-demo' AND mi.name = 'Trà tắc mật ong';

COMMIT;
