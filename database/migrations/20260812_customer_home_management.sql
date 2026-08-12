-- Quản trị phần body trang /app: Hero và thứ tự/trạng thái các section.
CREATE TABLE IF NOT EXISTS `home_page_settings` (
  `id` tinyint unsigned NOT NULL,
  `config_json` json NOT NULL,
  `updated_by_admin_id` bigint unsigned DEFAULT NULL,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO `home_page_settings` (`id`, `config_json`) VALUES (
  1,
  JSON_OBJECT(
    'hero', JSON_OBJECT(
      'title', 'Đói bụng? Đặt món ngay.',
      'subtitle', 'Khám phá món ngon giao siêu tốc từ các quán ăn hàng đầu quanh bạn.',
      'imageUrl', 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1800&q=80'
    ),
    'sections', JSON_ARRAY(
      JSON_OBJECT('id', 'cuisines', 'label', 'Loại hình ẩm thực', 'isVisible', TRUE, 'sortOrder', 1),
      JSON_OBJECT('id', 'featured-dishes', 'label', 'Món nổi bật từ nhiều quán', 'isVisible', TRUE, 'sortOrder', 2),
      JSON_OBJECT('id', 'nearby-dishes', 'label', 'Các món gần bạn', 'isVisible', TRUE, 'sortOrder', 3),
      JSON_OBJECT('id', 'promos', 'label', 'Banner chiến dịch', 'isVisible', TRUE, 'sortOrder', 4),
      JSON_OBJECT('id', 'trending', 'label', 'Thịnh hành', 'isVisible', TRUE, 'sortOrder', 5),
      JSON_OBJECT('id', 'order-again', 'label', 'Đặt lại món', 'isVisible', TRUE, 'sortOrder', 6),
      JSON_OBJECT('id', 'featured-restaurants', 'label', 'Quán ăn nổi bật', 'isVisible', TRUE, 'sortOrder', 7),
      JSON_OBJECT('id', 'moods', 'label', 'Theo tâm trạng', 'isVisible', TRUE, 'sortOrder', 8),
      JSON_OBJECT('id', 'partner', 'label', 'Hợp tác với NomNom', 'isVisible', TRUE, 'sortOrder', 9)
    )
  )
);
