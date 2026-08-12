-- Nearby discovery data around 9.984536, 105.788976 in Phuong Hung Phu, Can Tho.
-- Restaurant names are fictional; displayed addresses are based on reverse-geocoded map data.

START TRANSACTION;

INSERT INTO users (email, phone, password_hash, full_name, avatar_url, primary_role, status, email_verified_at)
VALUES
  ('seed.bun-ca-hung-phu@nomnom.example', '+84910990101', '$2b$10$CJ7Jw5i.tGECVqMW/dpzreHp4n.oQPZzbZI9LY9N6uZPNG4vrIfEO', 'Chủ quán Bún Cá Hưng Phú', 'https://api.dicebear.com/9.x/avataaars/svg?seed=BunCaHungPhu&radius=50', 'merchant', 'active', NOW()),
  ('seed.com-ga-truong-vinh-nguyen@nomnom.example', '+84910990102', '$2b$10$CJ7Jw5i.tGECVqMW/dpzreHp4n.oQPZzbZI9LY9N6uZPNG4vrIfEO', 'Chủ quán Cơm Gà Trương Vĩnh Nguyên', 'https://api.dicebear.com/9.x/avataaars/svg?seed=ComGaTruongVinhNguyen&radius=50', 'merchant', 'active', NOW()),
  ('seed.tiem-tra-hung-phu@nomnom.example', '+84910990103', '$2b$10$CJ7Jw5i.tGECVqMW/dpzreHp4n.oQPZzbZI9LY9N6uZPNG4vrIfEO', 'Chủ quán Tiệm Trà Hưng Phú', 'https://api.dicebear.com/9.x/avataaars/svg?seed=TiemTraHungPhu&radius=50', 'merchant', 'active', NOW())
ON DUPLICATE KEY UPDATE email = VALUES(email);

INSERT IGNORE INTO user_roles (user_id, role, granted_at)
SELECT id, 'merchant', NOW()
FROM users
WHERE email IN (
  'seed.bun-ca-hung-phu@nomnom.example',
  'seed.com-ga-truong-vinh-nguyen@nomnom.example',
  'seed.tiem-tra-hung-phu@nomnom.example'
);

INSERT INTO restaurants (
  owner_user_id, cuisine_id, name, slug, tagline, description, phone,
  banner_url, logo_url, address_line, ward, district, city, latitude, longitude,
  min_order_amount, avg_prep_time_min, rating_avg, review_count, commission_rate,
  is_open_now, status, approved_at, approved_by_admin_id
)
SELECT u.id, c.id, 'Bún Cá Hưng Phú', 'bun-ca-hung-phu',
  'Bún cá miền Tây thanh vị, chuẩn bị nóng theo từng đơn.',
  'Bún cá, chả cá và các món nước mang hương vị miền Tây.', '+84910990101',
  'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=1400&q=80',
  'https://api.dicebear.com/9.x/shapes/svg?seed=BunCaHungPhu&backgroundColor=ffffff',
  'Phường Hưng Phú', 'Hưng Phú', NULL, 'Cần Thơ', 9.9845360, 105.7889760,
  30000, 16, 4.70, 78, 15.00, 1, 'active', NOW(), 1
FROM users u JOIN cuisines c ON c.slug = 'vietnamese'
WHERE u.email = 'seed.bun-ca-hung-phu@nomnom.example'
  AND NOT EXISTS (SELECT 1 FROM restaurants WHERE slug = 'bun-ca-hung-phu');

INSERT INTO restaurants (
  owner_user_id, cuisine_id, name, slug, tagline, description, phone,
  banner_url, logo_url, address_line, ward, district, city, latitude, longitude,
  min_order_amount, avg_prep_time_min, rating_avg, review_count, commission_rate,
  is_open_now, status, approved_at, approved_by_admin_id
)
SELECT u.id, c.id, 'Cơm Gà Trương Vĩnh Nguyên', 'com-ga-truong-vinh-nguyen',
  'Cơm gà nóng, phần ăn vừa vị cho bữa trưa và bữa tối.',
  'Cơm gà quay, gà xối mỡ và món ăn kèm được chuẩn bị trong ngày.', '+84910990102',
  'https://images.unsplash.com/photo-1603133872878-684f208fb84b?auto=format&fit=crop&w=1400&q=80',
  'https://api.dicebear.com/9.x/shapes/svg?seed=ComGaTruongVinhNguyen&backgroundColor=ffffff',
  'Đường Trương Vĩnh Nguyên', 'Hưng Phú', NULL, 'Cần Thơ', 9.9881000, 105.7928000,
  35000, 18, 4.60, 64, 15.00, 1, 'active', NOW(), 1
FROM users u JOIN cuisines c ON c.slug = 'vietnamese'
WHERE u.email = 'seed.com-ga-truong-vinh-nguyen@nomnom.example'
  AND NOT EXISTS (SELECT 1 FROM restaurants WHERE slug = 'com-ga-truong-vinh-nguyen');

INSERT INTO restaurants (
  owner_user_id, cuisine_id, name, slug, tagline, description, phone,
  banner_url, logo_url, address_line, ward, district, city, latitude, longitude,
  min_order_amount, avg_prep_time_min, rating_avg, review_count, commission_rate,
  is_open_now, status, approved_at, approved_by_admin_id
)
SELECT u.id, c.id, 'Tiệm Trà Hưng Phú', 'tiem-tra-hung-phu',
  'Trà trái cây và cà phê pha mới mỗi ngày.',
  'Thức uống ít ngọt, trà trái cây và bánh dùng kèm cho buổi xế.', '+84910990103',
  'https://images.unsplash.com/photo-1556679343-c7306c1976bc?auto=format&fit=crop&w=1400&q=80',
  'https://api.dicebear.com/9.x/shapes/svg?seed=TiemTraHungPhu&backgroundColor=ffffff',
  'Phường Hưng Phú', 'Hưng Phú', NULL, 'Cần Thơ', 9.9799000, 105.7839000,
  25000, 8, 4.50, 42, 12.00, 1, 'active', NOW(), 1
FROM users u JOIN cuisines c ON c.slug = 'coffee'
WHERE u.email = 'seed.tiem-tra-hung-phu@nomnom.example'
  AND NOT EXISTS (SELECT 1 FROM restaurants WHERE slug = 'tiem-tra-hung-phu');

INSERT INTO menu_categories (restaurant_id, name, description, sort_order, is_active)
SELECT r.id, v.name, NULL, v.sort_order, 1
FROM restaurants r
JOIN (
  SELECT 'bun-ca-hung-phu' AS slug, 'Món nước' AS name, 1 AS sort_order
  UNION ALL SELECT 'bun-ca-hung-phu', 'Món thêm', 2
  UNION ALL SELECT 'com-ga-truong-vinh-nguyen', 'Cơm gà', 1
  UNION ALL SELECT 'com-ga-truong-vinh-nguyen', 'Món kèm', 2
  UNION ALL SELECT 'tiem-tra-hung-phu', 'Trà trái cây', 1
  UNION ALL SELECT 'tiem-tra-hung-phu', 'Cà phê và bánh', 2
) v ON v.slug = r.slug
WHERE NOT EXISTS (
  SELECT 1 FROM menu_categories mc WHERE mc.restaurant_id = r.id AND mc.name = v.name
);

INSERT INTO menu_items (
  restaurant_id, category_id, name, description, image_url, price, prep_time_min,
  in_stock, is_featured, sort_order, total_sold, rating_avg, status
)
SELECT r.id, mc.id, v.name, v.description, v.image_url, v.price, v.prep_time_min,
  1, v.is_featured, v.sort_order, v.total_sold, v.rating_avg, 'active'
FROM restaurants r
JOIN menu_categories mc ON mc.restaurant_id = r.id
JOIN (
  SELECT 'bun-ca-hung-phu' AS restaurant_slug, 'Món nước' AS category_name, 'Bún cá đặc biệt' AS name, 'Bún cá, chả cá, rau sống và nước dùng thanh ngọt.' AS description, 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=800&q=80' AS image_url, 48000 AS price, 16 AS prep_time_min, 1 AS is_featured, 1 AS sort_order, 126 AS total_sold, 4.80 AS rating_avg
  UNION ALL SELECT 'bun-ca-hung-phu', 'Món nước', 'Bún chả cá', 'Chả cá dai mềm, bún tươi và rau ăn kèm.', 'https://images.unsplash.com/photo-1591814468924-caf88d1232e1?auto=format&fit=crop&w=800&q=80', 42000, 14, 1, 2, 88, 4.70
  UNION ALL SELECT 'bun-ca-hung-phu', 'Món thêm', 'Chả cá chiên', 'Chả cá chiên vàng, dùng kèm rau và nước chấm.', 'https://images.unsplash.com/photo-1496116218417-1a781b1c416c?auto=format&fit=crop&w=800&q=80', 30000, 10, 0, 1, 57, 4.60
  UNION ALL SELECT 'bun-ca-hung-phu', 'Món thêm', 'Trà sâm mát', 'Trà thảo mộc thanh nhẹ, giảm ngọt.', 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?auto=format&fit=crop&w=800&q=80', 18000, 4, 0, 2, 49, 4.50
  UNION ALL SELECT 'com-ga-truong-vinh-nguyen', 'Cơm gà', 'Cơm gà xối mỡ', 'Gà giòn bên ngoài, mềm bên trong, dùng cùng cơm và đồ chua.', 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?auto=format&fit=crop&w=800&q=80', 52000, 18, 1, 1, 142, 4.70
  UNION ALL SELECT 'com-ga-truong-vinh-nguyen', 'Cơm gà', 'Cơm gà quay', 'Đùi gà quay đậm vị, cơm nóng và rau ăn kèm.', 'https://images.unsplash.com/photo-1606755962773-d324e0a13086?auto=format&fit=crop&w=800&q=80', 55000, 18, 1, 2, 97, 4.60
  UNION ALL SELECT 'com-ga-truong-vinh-nguyen', 'Món kèm', 'Gà giòn không xương', 'Gà chiên giòn vừa miếng, kèm sốt riêng.', 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80', 45000, 14, 0, 1, 73, 4.50
  UNION ALL SELECT 'com-ga-truong-vinh-nguyen', 'Món kèm', 'Canh rong biển', 'Canh rong biển nhẹ vị dùng kèm cơm gà.', 'https://images.unsplash.com/photo-1607301405390-d831c242f59b?auto=format&fit=crop&w=800&q=80', 18000, 7, 0, 2, 38, 4.40
  UNION ALL SELECT 'tiem-tra-hung-phu', 'Trà trái cây', 'Trà đào cam sả', 'Trà đào, cam tươi và sả thơm, điều chỉnh độ ngọt.', 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?auto=format&fit=crop&w=800&q=80', 32000, 6, 1, 1, 119, 4.70
  UNION ALL SELECT 'tiem-tra-hung-phu', 'Trà trái cây', 'Trà chanh mật ong', 'Trà chanh, mật ong và bạc hà tươi.', 'https://images.unsplash.com/photo-1712056407267-1a38c7024a8f?auto=format&fit=crop&w=800&q=80', 30000, 5, 1, 2, 91, 4.60
  UNION ALL SELECT 'tiem-tra-hung-phu', 'Cà phê và bánh', 'Cà phê sữa đá', 'Cà phê rang đậm pha cùng sữa đặc.', 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=800&q=80', 25000, 5, 0, 1, 134, 4.60
  UNION ALL SELECT 'tiem-tra-hung-phu', 'Cà phê và bánh', 'Bánh croissant bơ', 'Croissant nướng nóng, lớp vỏ giòn nhẹ.', 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=800&q=80', 30000, 7, 0, 2, 62, 4.50
) v ON v.restaurant_slug = r.slug AND v.category_name = mc.name
WHERE NOT EXISTS (
  SELECT 1 FROM menu_items mi WHERE mi.restaurant_id = r.id AND mi.name = v.name
);

COMMIT;
