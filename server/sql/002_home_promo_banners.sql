-- Chạy nếu DB đã import trước khi có bảng home_promo_banners.
-- mysql -u root -p nomnom < server/sql/002_home_promo_banners.sql

USE nomnom;

CREATE TABLE IF NOT EXISTS home_promo_banners (
  id         VARCHAR(40)  NOT NULL,
  tag        VARCHAR(80)  NOT NULL,
  title      VARCHAR(160) NOT NULL,
  subtitle   VARCHAR(255) NOT NULL,
  cta_label  VARCHAR(80)  NOT NULL,
  image_url  VARCHAR(500) NOT NULL,
  link_url   VARCHAR(500) NULL,
  sort_order SMALLINT     NOT NULL DEFAULT 0,
  is_active  TINYINT(1)   NOT NULL DEFAULT 1,
  created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_hpb_sort (sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

REPLACE INTO home_promo_banners (id, tag, title, subtitle, cta_label, image_url, link_url, sort_order) VALUES
  ('promo-nomnom15', 'Sử dụng NOMNOM15', 'Giảm 15% cho đơn hàng đầu tiên', 'Mỗi khách hàng một mã khuyến mãi · Giảm tối đa 250.000 ₫', 'Nhận ngay',    'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=1000&q=80', '/app/profile/promotions', 1),
  ('promo-lunch',    'Trưa · 11–2',      'Miễn phí giao hàng cho đơn từ 500.000 ₫', 'Tránh giờ cao điểm văn phòng · T2–T6',                 'Đặt bữa trưa', 'https://images.unsplash.com/photo-1551782450-a2132b4ba21d?auto=format&fit=crop&w=1000&q=80', '/app/search',             2),
  ('promo-new',      'Mới mở',           '5 bếp mới tuần này',                     'Thử ngay trước khi kín chỗ',                           'Khám phá',     'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=1000&q=80', '/app/search',             3);
