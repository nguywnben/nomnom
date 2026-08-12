-- NomNom report-ready demo data.
-- Idempotent: explicit IDs and DEMO-* codes make this safe to import more than once.

SET NAMES utf8mb4;

-- Delivered orders spread across active restaurants so customer history, merchant KPI,
-- admin analytics, reviews, payments, and trending dishes all have meaningful data.
INSERT IGNORE INTO orders
  (id, order_code, customer_id, restaurant_id, delivery_address_id, delivery_address_snapshot,
   delivery_lat, delivery_lng, pickup_lat, pickup_lng, distance_km, subtotal, delivery_fee,
   discount_amount, total_amount, merchant_earning, platform_fee, status, payment_status,
   payment_method, customer_note, estimated_delivery_at, placed_at, accepted_at, ready_at,
   picked_up_at, delivered_at, created_at, updated_at)
SELECT seed.id, seed.order_code, seed.customer_id, seed.restaurant_id, seed.address_id,
       CONCAT(a.line1, ', ', COALESCE(a.ward, ''), ', ', a.city), a.latitude, a.longitude,
       r.latitude, r.longitude, seed.distance_km, seed.subtotal, seed.delivery_fee, 0,
       seed.subtotal + seed.delivery_fee, ROUND(seed.subtotal * (100 - r.commission_rate) / 100),
       seed.subtotal - ROUND(seed.subtotal * (100 - r.commission_rate) / 100),
       'delivered', 'paid', seed.payment_method, seed.note,
       seed.placed_at + INTERVAL 35 MINUTE, seed.placed_at, seed.placed_at + INTERVAL 3 MINUTE,
       seed.placed_at + INTERVAL 18 MINUTE, seed.placed_at + INTERVAL 21 MINUTE,
       seed.placed_at + INTERVAL 32 MINUTE, seed.placed_at, seed.placed_at + INTERVAL 32 MINUTE
FROM (
  SELECT 2001 id, 'DEMO-2608-001' order_code, 2 customer_id, 2 restaurant_id, 1 address_id, 2.8 distance_km, 134000 subtotal, 18000 delivery_fee, 'cod' payment_method, 'Ít tương ớt' note, CURRENT_DATE - INTERVAL 1 DAY + INTERVAL 12 HOUR placed_at
  UNION ALL SELECT 2002, 'DEMO-2608-002', 15, 3, 3, 3.4, 284000, 22000, 'vnpay', NULL, CURRENT_DATE - INTERVAL 2 DAY + INTERVAL 18 HOUR
  UNION ALL SELECT 2003, 'DEMO-2608-003', 16, 5, 4, 4.1, 178000, 25000, 'cod', 'Không lấy đũa', CURRENT_DATE - INTERVAL 3 DAY + INTERVAL 11 HOUR
  UNION ALL SELECT 2004, 'DEMO-2608-004', 17, 7, 5, 2.2, 94000, 16000, 'vnpay', NULL, CURRENT_DATE - INTERVAL 5 DAY + INTERVAL 8 HOUR
  UNION ALL SELECT 2005, 'DEMO-2608-005', 18, 108, 6, 3.0, 118000, 19000, 'cod', 'Giao tại lễ tân', CURRENT_DATE - INTERVAL 7 DAY + INTERVAL 12 HOUR
  UNION ALL SELECT 2006, 'DEMO-2608-006', 19, 109, 7, 1.9, 72000, 15000, 'vnpay', 'Ít đá', CURRENT_DATE - INTERVAL 9 DAY + INTERVAL 15 HOUR
  UNION ALL SELECT 2007, 'DEMO-2608-007', 20, 110, 8, 2.5, 90000, 17000, 'cod', 'Không cay', CURRENT_DATE - INTERVAL 12 DAY + INTERVAL 16 HOUR
  UNION ALL SELECT 2008, 'DEMO-2608-008', 21, 115, 9, 3.7, 108000, 23000, 'vnpay', NULL, CURRENT_DATE - INTERVAL 16 DAY + INTERVAL 7 HOUR
  UNION ALL SELECT 2009, 'DEMO-2608-009', 22, 116, 10, 4.4, 125000, 26000, 'cod', 'Thêm nước tương', CURRENT_DATE - INTERVAL 21 DAY + INTERVAL 12 HOUR
  UNION ALL SELECT 2010, 'DEMO-2608-010', 2, 117, 1, 2.6, 87000, 18000, 'vnpay', '50% đường', CURRENT_DATE - INTERVAL 27 DAY + INTERVAL 14 HOUR
) seed
JOIN restaurants r ON r.id = seed.restaurant_id
JOIN customer_addresses a ON a.id = seed.address_id;

-- Current orders provide useful merchant Kanban states during the live report.
INSERT IGNORE INTO orders
  (id, order_code, customer_id, restaurant_id, delivery_address_id, delivery_address_snapshot,
   delivery_lat, delivery_lng, pickup_lat, pickup_lng, distance_km, subtotal, delivery_fee,
   discount_amount, total_amount, merchant_earning, platform_fee, status, payment_status,
   payment_method, customer_note, estimated_delivery_at, placed_at, accepted_at, ready_at,
   created_at, updated_at)
SELECT seed.id, seed.order_code, seed.customer_id, seed.restaurant_id, seed.address_id,
       CONCAT(a.line1, ', ', COALESCE(a.ward, ''), ', ', a.city), a.latitude, a.longitude,
       r.latitude, r.longitude, seed.distance_km, seed.subtotal, seed.delivery_fee, 0,
       seed.subtotal + seed.delivery_fee, ROUND(seed.subtotal * (100 - r.commission_rate) / 100),
       seed.subtotal - ROUND(seed.subtotal * (100 - r.commission_rate) / 100),
       seed.status, 'paid', seed.payment_method, seed.note, NOW() + INTERVAL 30 MINUTE,
       NOW() - INTERVAL seed.minutes_ago MINUTE,
       CASE WHEN seed.status IN ('accepted','preparing','ready_for_pickup') THEN NOW() - INTERVAL (seed.minutes_ago - 3) MINUTE END,
       CASE WHEN seed.status = 'ready_for_pickup' THEN NOW() - INTERVAL 2 MINUTE END,
       NOW() - INTERVAL seed.minutes_ago MINUTE, NOW()
FROM (
  SELECT 2011 id, 'DEMO-LIVE-001' order_code, 2 customer_id, 1 restaurant_id, 1 address_id, 2.1 distance_km, 204000 subtotal, 17000 delivery_fee, 'placed' status, 'cod' payment_method, 'Gọi khi đến nơi' note, 4 minutes_ago
  UNION ALL SELECT 2012, 'DEMO-LIVE-002', 15, 2, 3, 2.9, 150000, 19000, 'preparing', 'vnpay', 'Không hành', 12
  UNION ALL SELECT 2013, 'DEMO-LIVE-003', 16, 5, 4, 3.5, 168000, 22000, 'accepted', 'cod', NULL, 7
  UNION ALL SELECT 2014, 'DEMO-LIVE-004', 17, 108, 5, 2.4, 100000, 17000, 'ready_for_pickup', 'vnpay', 'Xin thêm canh', 24
) seed
JOIN restaurants r ON r.id = seed.restaurant_id
JOIN customer_addresses a ON a.id = seed.address_id;

INSERT IGNORE INTO order_items
  (id, order_id, menu_item_id, item_name_snapshot, unit_price_snapshot, quantity, line_subtotal, note, created_at)
VALUES
  (3001,2001,6,'Cổ điển',99000,1,99000,NULL,CURRENT_DATE - INTERVAL 1 DAY),
  (3002,2001,9,'Khoai tây chiên',35000,1,35000,NULL,CURRENT_DATE - INTERVAL 1 DAY),
  (3003,2002,11,'Set Nigiri (8 miếng)',249000,1,249000,NULL,CURRENT_DATE - INTERVAL 2 DAY),
  (3004,2002,14,'Súp Miso',35000,1,35000,NULL,CURRENT_DATE - INTERVAL 2 DAY),
  (3005,2003,18,'Tonkotsu Ramen',119000,1,119000,NULL,CURRENT_DATE - INTERVAL 3 DAY),
  (3006,2003,20,'Gyoza (6 miếng)',59000,1,59000,NULL,CURRENT_DATE - INTERVAL 3 DAY),
  (3007,2004,25,'Flat White',49000,1,49000,NULL,CURRENT_DATE - INTERVAL 5 DAY),
  (3008,2004,26,'Bánh sừng bò hạnh nhân',45000,1,45000,NULL,CURRENT_DATE - INTERVAL 5 DAY),
  (3009,2005,100,'Cơm sườn nướng',48000,1,48000,NULL,CURRENT_DATE - INTERVAL 7 DAY),
  (3010,2005,102,'Canh chua cá',35000,2,70000,NULL,CURRENT_DATE - INTERVAL 7 DAY),
  (3011,2006,104,'Cà phê sữa đá',22000,2,44000,'Ít đá',CURRENT_DATE - INTERVAL 9 DAY),
  (3012,2006,105,'Bạc xỉu',28000,1,28000,NULL,CURRENT_DATE - INTERVAL 9 DAY),
  (3013,2007,108,'Bánh tráng trộn',25000,1,25000,NULL,CURRENT_DATE - INTERVAL 12 DAY),
  (3014,2007,109,'Xiên que thập cẩm',35000,1,35000,NULL,CURRENT_DATE - INTERVAL 12 DAY),
  (3015,2007,110,'Trà đào cam sả',30000,1,30000,NULL,CURRENT_DATE - INTERVAL 12 DAY),
  (3016,2008,115,'Bún cá đặc biệt',48000,1,48000,NULL,CURRENT_DATE - INTERVAL 16 DAY),
  (3017,2008,117,'Chả cá chiên',30000,2,60000,NULL,CURRENT_DATE - INTERVAL 16 DAY),
  (3018,2009,119,'Cơm gà xối mỡ',52000,1,52000,NULL,CURRENT_DATE - INTERVAL 21 DAY),
  (3019,2009,120,'Cơm gà quay',55000,1,55000,NULL,CURRENT_DATE - INTERVAL 21 DAY),
  (3020,2009,122,'Canh rong biển',18000,1,18000,NULL,CURRENT_DATE - INTERVAL 21 DAY),
  (3021,2010,123,'Trà đào cam sả',32000,1,32000,'50% đường',CURRENT_DATE - INTERVAL 27 DAY),
  (3022,2010,125,'Cà phê sữa đá',25000,1,25000,NULL,CURRENT_DATE - INTERVAL 27 DAY),
  (3023,2010,126,'Bánh croissant bơ',30000,1,30000,NULL,CURRENT_DATE - INTERVAL 27 DAY),
  (3024,2011,1,'Margherita',89000,1,89000,NULL,NOW()),
  (3025,2011,2,'Funghi',115000,1,115000,NULL,NOW()),
  (3026,2012,7,'Cheddar Bacon',115000,1,115000,NULL,NOW()),
  (3027,2012,9,'Khoai tây chiên',35000,1,35000,NULL,NOW()),
  (3028,2013,19,'Miso Ramen',109000,1,109000,NULL,NOW()),
  (3029,2013,20,'Gyoza (6 miếng)',59000,1,59000,NULL,NOW()),
  (3030,2014,100,'Cơm sườn nướng',48000,1,48000,NULL,NOW()),
  (3031,2014,101,'Cơm gà xối mỡ',52000,1,52000,NULL,NOW());

INSERT IGNORE INTO payments
  (id, order_id, method, amount, currency, gateway, gateway_reference, status, paid_at, created_at, updated_at)
SELECT 4000 + (o.id - 2000), o.id, o.payment_method, o.total_amount, 'VND',
       CASE WHEN o.payment_method='vnpay' THEN 'vnpay' ELSE NULL END,
       CONCAT('DEMO-PAY-', o.id), 'succeeded', o.placed_at, o.placed_at, o.updated_at
FROM orders o WHERE o.id BETWEEN 2001 AND 2014;

INSERT IGNORE INTO order_status_logs
  (id, order_id, from_status, to_status, changed_by_role, changed_by_user_id, note, created_at)
SELECT 5000 + (o.id - 2000), o.id, NULL, o.status, 'system', NULL,
       'Dữ liệu minh họa phục vụ báo cáo tiến độ.', o.updated_at
FROM orders o WHERE o.id BETWEEN 2001 AND 2014;

-- One restaurant review and one dish review for each completed order.
INSERT IGNORE INTO reviews
  (id, order_id, customer_id, restaurant_id, menu_item_id, rating, comment, is_hidden, created_at, updated_at)
VALUES
  (6001,2001,2,2,NULL,5,'Đóng gói cẩn thận, món đến vẫn còn nóng.',0,CURRENT_DATE - INTERVAL 1 DAY,CURRENT_DATE - INTERVAL 1 DAY),
  (6002,2001,2,2,6,5,'Burger đậm vị và phần ăn vừa đủ.',0,CURRENT_DATE - INTERVAL 1 DAY,CURRENT_DATE - INTERVAL 1 DAY),
  (6003,2002,15,3,NULL,5,'Nguyên liệu tươi, trình bày đẹp.',0,CURRENT_DATE - INTERVAL 2 DAY,CURRENT_DATE - INTERVAL 2 DAY),
  (6004,2002,15,3,11,5,'Cá tươi và cơm nắm vừa miệng.',0,CURRENT_DATE - INTERVAL 2 DAY,CURRENT_DATE - INTERVAL 2 DAY),
  (6005,2003,16,5,NULL,4,'Quán chuẩn bị nhanh, đóng gói chắc chắn.',0,CURRENT_DATE - INTERVAL 3 DAY,CURRENT_DATE - INTERVAL 3 DAY),
  (6006,2003,16,5,18,5,'Nước dùng thơm và béo vừa phải.',0,CURRENT_DATE - INTERVAL 3 DAY,CURRENT_DATE - INTERVAL 3 DAY),
  (6007,2004,17,7,NULL,5,'Cà phê ngon, giao đúng giờ.',0,CURRENT_DATE - INTERVAL 5 DAY,CURRENT_DATE - INTERVAL 5 DAY),
  (6008,2004,17,7,25,4,'Vị cà phê cân bằng, sữa mịn.',0,CURRENT_DATE - INTERVAL 5 DAY,CURRENT_DATE - INTERVAL 5 DAY),
  (6009,2005,18,108,NULL,5,'Món nhà làm dễ ăn, khẩu phần hợp lý.',0,CURRENT_DATE - INTERVAL 7 DAY,CURRENT_DATE - INTERVAL 7 DAY),
  (6010,2005,18,108,100,5,'Sườn mềm và ướp rất vừa vị.',0,CURRENT_DATE - INTERVAL 7 DAY,CURRENT_DATE - INTERVAL 7 DAY),
  (6011,2006,19,109,NULL,4,'Quán phục vụ nhanh và thân thiện.',0,CURRENT_DATE - INTERVAL 9 DAY,CURRENT_DATE - INTERVAL 9 DAY),
  (6012,2006,19,109,104,4,'Cà phê thơm, đúng yêu cầu ít đá.',0,CURRENT_DATE - INTERVAL 9 DAY,CURRENT_DATE - INTERVAL 9 DAY),
  (6013,2007,20,110,NULL,5,'Đồ ăn vặt đa dạng, đóng gói sạch.',0,CURRENT_DATE - INTERVAL 12 DAY,CURRENT_DATE - INTERVAL 12 DAY),
  (6014,2007,20,110,108,5,'Bánh tráng trộn đậm đà nhưng không quá cay.',0,CURRENT_DATE - INTERVAL 12 DAY,CURRENT_DATE - INTERVAL 12 DAY),
  (6015,2008,21,115,NULL,5,'Nước dùng trong và quán chuẩn bị rất nhanh.',0,CURRENT_DATE - INTERVAL 16 DAY,CURRENT_DATE - INTERVAL 16 DAY),
  (6016,2008,21,115,115,5,'Bún cá nhiều topping, cá không tanh.',0,CURRENT_DATE - INTERVAL 16 DAY,CURRENT_DATE - INTERVAL 16 DAY),
  (6017,2009,22,116,NULL,4,'Cơm ngon, phần ăn đầy đặn.',0,CURRENT_DATE - INTERVAL 21 DAY,CURRENT_DATE - INTERVAL 21 DAY),
  (6018,2009,22,116,119,5,'Da gà giòn, thịt vẫn mềm.',0,CURRENT_DATE - INTERVAL 21 DAY,CURRENT_DATE - INTERVAL 21 DAY),
  (6019,2010,2,117,NULL,5,'Đồ uống đóng gói đẹp và không bị đổ.',0,CURRENT_DATE - INTERVAL 27 DAY,CURRENT_DATE - INTERVAL 27 DAY),
  (6020,2010,2,117,123,4,'Trà thơm, mức đường đúng yêu cầu.',0,CURRENT_DATE - INTERVAL 27 DAY,CURRENT_DATE - INTERVAL 27 DAY);

UPDATE restaurants r
LEFT JOIN (
  SELECT restaurant_id, ROUND(AVG(rating),2) rating_avg, COUNT(*) review_count
  FROM reviews WHERE menu_item_id IS NULL AND is_hidden=0 GROUP BY restaurant_id
) x ON x.restaurant_id=r.id
SET r.rating_avg=COALESCE(x.rating_avg,0), r.review_count=COALESCE(x.review_count,0)
WHERE r.id IN (2,3,5,7,108,109,110,115,116,117);

UPDATE menu_items mi
LEFT JOIN (
  SELECT menu_item_id, ROUND(AVG(rating),2) rating_avg
  FROM reviews WHERE menu_item_id IS NOT NULL AND is_hidden=0 GROUP BY menu_item_id
) x ON x.menu_item_id=mi.id
SET mi.rating_avg=COALESCE(x.rating_avg,mi.rating_avg),
    mi.total_sold=GREATEST(mi.total_sold, CASE WHEN mi.id IN (6,11,18,25,100,104,108,115,119,123) THEN 24 ELSE 8 END)
WHERE mi.restaurant_id IN (2,3,5,7,108,109,110,115,116,117);

-- Merchant wallets for seeded restaurants that did not previously have one.
INSERT INTO wallets (user_id, owner_type, balance, pending_balance, total_earned, total_withdrawn, is_locked)
SELECT r.owner_user_id, 'merchant', 350000, 0, 850000, 500000, 0
FROM restaurants r
WHERE r.status='active'
  AND NOT EXISTS (SELECT 1 FROM wallets w WHERE w.user_id=r.owner_user_id AND w.owner_type='merchant');

INSERT IGNORE INTO notifications
  (id, user_id, type, title, body, link_url, is_read, read_at, created_at)
VALUES
  (7001,2,'order_delivered','Đơn hàng đã được giao','Đơn DEMO-2608-001 đã giao thành công. Bạn có thể đánh giá trải nghiệm.','/app/orders',0,NULL,NOW() - INTERVAL 1 DAY),
  (7002,7,'order_placed','Bạn có đơn hàng mới','Đơn DEMO-LIVE-001 đang chờ quán xác nhận.','/merchant/orders',0,NULL,NOW() - INTERVAL 4 MINUTE),
  (7003,8,'order_accepted','Đơn hàng đang được chuẩn bị','Đơn DEMO-LIVE-002 đang ở bước chuẩn bị món.','/merchant/orders',0,NULL,NOW() - INTERVAL 9 MINUTE),
  (7004,11,'order_accepted','Đơn hàng mới đã xác nhận','Đơn DEMO-LIVE-003 đang chờ quán chuẩn bị.','/merchant/orders',0,NULL,NOW() - INTERVAL 4 MINUTE),
  (7005,121,'order_ready','Đơn hàng đã sẵn sàng','Đơn DEMO-LIVE-004 đã sẵn sàng để bàn giao.','/merchant/orders',0,NULL,NOW() - INTERVAL 2 MINUTE),
  (7006,1,'system','Dữ liệu báo cáo đã sẵn sàng','Hệ thống đã có dữ liệu đơn hàng, doanh thu và đánh giá trong 30 ngày gần nhất.','/admin',0,NULL,NOW());

-- Same-day completed orders keep the primary merchant demo account populated.
INSERT IGNORE INTO orders
  (id, order_code, customer_id, restaurant_id, delivery_address_id, delivery_address_snapshot,
   delivery_lat, delivery_lng, pickup_lat, pickup_lng, distance_km, subtotal, delivery_fee,
   discount_amount, total_amount, merchant_earning, platform_fee, status, payment_status,
   payment_method, customer_note, estimated_delivery_at, placed_at, accepted_at, ready_at,
   picked_up_at, delivered_at, created_at, updated_at)
SELECT seed.id, seed.order_code, seed.customer_id, 1, seed.address_id,
       CONCAT(a.line1, ', ', COALESCE(a.ward, ''), ', ', a.city), a.latitude, a.longitude,
       r.latitude, r.longitude, seed.distance_km, seed.subtotal, seed.delivery_fee, 0,
       seed.subtotal + seed.delivery_fee, ROUND(seed.subtotal * (100 - r.commission_rate) / 100),
       seed.subtotal - ROUND(seed.subtotal * (100 - r.commission_rate) / 100),
       'delivered', 'paid', seed.payment_method, seed.note,
       seed.placed_at + INTERVAL 38 MINUTE, seed.placed_at, seed.placed_at + INTERVAL 3 MINUTE,
       seed.placed_at + INTERVAL 20 MINUTE, seed.placed_at + INTERVAL 24 MINUTE,
       seed.placed_at + INTERVAL 36 MINUTE, seed.placed_at, seed.placed_at + INTERVAL 36 MINUTE
FROM (
  SELECT 2015 id, 'DEMO-TODAY-001' order_code, 18 customer_id, 6 address_id, 2.3 distance_km,
         204000 subtotal, 17000 delivery_fee, 'cod' payment_method, 'Cắt pizza giúp mình' note,
         CURRENT_DATE + INTERVAL 8 HOUR placed_at
  UNION ALL
  SELECT 2016, 'DEMO-TODAY-002', 19, 7, 3.1, 184000, 20000, 'vnpay', NULL,
         CURRENT_DATE + INTERVAL 11 HOUR
) seed
JOIN restaurants r ON r.id=1
JOIN customer_addresses a ON a.id=seed.address_id;

INSERT IGNORE INTO order_items
  (id, order_id, menu_item_id, item_name_snapshot, unit_price_snapshot, quantity, line_subtotal, note, created_at)
VALUES
  (3032,2015,1,'Margherita',89000,1,89000,NULL,CURRENT_DATE + INTERVAL 8 HOUR),
  (3033,2015,2,'Funghi',115000,1,115000,NULL,CURRENT_DATE + INTERVAL 8 HOUR),
  (3034,2016,3,'Salsiccia',125000,1,125000,NULL,CURRENT_DATE + INTERVAL 11 HOUR),
  (3035,2016,5,'Tiramisu',59000,1,59000,NULL,CURRENT_DATE + INTERVAL 11 HOUR);

INSERT IGNORE INTO payments
  (id, order_id, method, amount, currency, gateway, gateway_reference, status, paid_at, created_at, updated_at)
SELECT 4000 + (o.id - 2000), o.id, o.payment_method, o.total_amount, 'VND',
       CASE WHEN o.payment_method='vnpay' THEN 'vnpay' ELSE NULL END,
       CONCAT('DEMO-PAY-',o.id), 'succeeded', o.placed_at, o.placed_at, o.updated_at
FROM orders o WHERE o.id IN (2015,2016);

INSERT IGNORE INTO order_status_logs
  (id, order_id, from_status, to_status, changed_by_role, changed_by_user_id, note, created_at)
SELECT 5000 + (o.id - 2000), o.id, NULL, 'delivered', 'system', NULL,
       'Dữ liệu minh họa phục vụ báo cáo tiến độ.', o.delivered_at
FROM orders o WHERE o.id IN (2015,2016);

INSERT IGNORE INTO reviews
  (id, order_id, customer_id, restaurant_id, menu_item_id, rating, comment, is_hidden, created_at, updated_at)
VALUES
  (6021,2015,18,1,NULL,5,'Pizza nóng, đế giòn và giao rất đúng giờ.',0,CURRENT_DATE + INTERVAL 9 HOUR,CURRENT_DATE + INTERVAL 9 HOUR),
  (6022,2015,18,1,1,5,'Margherita thơm mùi húng quế, phô mai vừa đủ.',0,CURRENT_DATE + INTERVAL 9 HOUR,CURRENT_DATE + INTERVAL 9 HOUR),
  (6023,2016,19,1,NULL,4,'Quán đóng gói đẹp và món ăn đúng mô tả.',0,CURRENT_DATE + INTERVAL 12 HOUR,CURRENT_DATE + INTERVAL 12 HOUR),
  (6024,2016,19,1,3,5,'Xúc xích đậm vị, phần bánh đủ cho một người.',0,CURRENT_DATE + INTERVAL 12 HOUR,CURRENT_DATE + INTERVAL 12 HOUR);

UPDATE restaurants r
JOIN (
  SELECT restaurant_id, ROUND(AVG(rating),2) rating_avg, COUNT(*) review_count
  FROM reviews WHERE restaurant_id=1 AND menu_item_id IS NULL AND is_hidden=0 GROUP BY restaurant_id
) x ON x.restaurant_id=r.id
SET r.rating_avg=x.rating_avg, r.review_count=x.review_count;
