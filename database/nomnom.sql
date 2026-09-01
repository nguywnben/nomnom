-- NomNom report-ready seed for 03/09/2026
-- Contains safe, synthetic Vietnamese personas; never replace them with real personal data.
SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS `audit_logs`;
CREATE TABLE `audit_logs` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `admin_id` bigint unsigned NOT NULL,
  `action` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `target_type` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `target_id` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `metadata` json DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_audit_logs_admin` (`admin_id`),
  CONSTRAINT `fk_audit_logs_admin` FOREIGN KEY (`admin_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=105 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
INSERT INTO `audit_logs` (`id`, `admin_id`, `action`, `target_type`, `target_id`, `metadata`, `created_at`) VALUES
(41, 1, 'sap_xep_banner_trang_chu', 'home_banner', 'all', '{\"ids\":[\"promo-lunch\",\"promo-nomnom15\",\"promo-new\"]}', '2026-08-13 00:10:36.000'),
(42, 1, 'sap_xep_banner_trang_chu', 'home_banner', 'all', '{\"ids\":[\"promo-nomnom15\",\"promo-lunch\",\"promo-new\"]}', '2026-08-13 00:10:36.000'),
(43, 1, 'cap_nhat_trang_chu_khach_hang', 'customer_home', '1', NULL, '2026-08-13 00:11:16.000'),
(44, 1, 'cap_nhat_trang_chu_khach_hang', 'customer_home', '1', NULL, '2026-08-13 00:11:32.000'),
(45, 1, 'cap_nhat_banner_trang_chu', 'home_banner', 'promo-lunch', '{\"title\":\"Miễn phí giao hàng cho đơn từ 500.000 ₫\"}', '2026-08-13 00:12:43.000'),
(46, 1, 'cap_nhat_trang_chu_khach_hang', 'customer_home', '1', NULL, '2026-08-13 00:12:45.000'),
(47, 1, 'cap_nhat_banner_trang_chu', 'home_banner', 'promo-lunch', '{\"title\":\"Miễn phí giao hàng cho đơn từ 500.000 ₫\"}', '2026-08-13 00:12:57.000'),
(48, 1, 'cap_nhat_trang_chu_khach_hang', 'customer_home', '1', NULL, '2026-08-13 00:12:58.000'),
(49, 1, 'cap_nhat_trang_chu_khach_hang', 'customer_home', '1', NULL, '2026-08-13 00:13:15.000'),
(50, 1, 'cap_nhat_trang_chu_khach_hang', 'customer_home', '1', NULL, '2026-08-13 00:13:27.000'),
(51, 1, 'cap_nhat_trang_chu_khach_hang', 'customer_home', '1', NULL, '2026-08-13 00:14:45.000'),
(52, 1, 'cap_nhat_trang_chu_khach_hang', 'customer_home', '1', NULL, '2026-08-13 00:14:56.000'),
(53, 1, 'cap_nhat_trang_chu_khach_hang', 'customer_home', '1', NULL, '2026-08-13 00:15:09.000'),
(54, 1, 'cap_nhat_trang_chu_khach_hang', 'customer_home', '1', NULL, '2026-08-13 00:15:16.000'),
(55, 1, 'cap_nhat_trang_chu_khach_hang', 'customer_home', '1', NULL, '2026-08-13 00:15:21.000'),
(56, 1, 'cap_nhat_trang_chu_khach_hang', 'customer_home', '1', NULL, '2026-08-13 00:15:25.000'),
(57, 1, 'sap_xep_loai_am_thuc', 'cuisine', 'all', '{\"thuTuIds\":[2,1,3,4,5,6,7,100]}', '2026-08-13 00:18:40.000'),
(58, 1, 'sap_xep_loai_am_thuc', 'cuisine', 'all', '{\"thuTuIds\":[1,2,3,4,5,6,7,100]}', '2026-08-13 00:18:40.000'),
(59, 1, 'cap_nhat_trang_chu_khach_hang', 'customer_home', '1', NULL, '2026-08-13 00:19:11.000'),
(60, 1, 'cap_nhat_trang_chu_khach_hang', 'customer_home', '1', NULL, '2026-08-13 00:19:16.000'),
(61, 1, 'cap_nhat_trang_chu_khach_hang', 'customer_home', '1', NULL, '2026-08-13 00:19:21.000'),
(102, 1, 'kiem_tra_du_lieu_bao_cao', 'system', 'report-20260903', '{\"roles\":[\"admin\",\"customer\",\"merchant\"],\"result\":\"passed\"}', '2026-09-01 19:35:00.000'),
(103, 1, 'doi_soat_hoan_tien', 'order', '4', '{\"status\":\"refunded\"}', '2026-08-30 14:26:00.000'),
(104, 1, 'cap_nhat_trang_chu_khach_hang', 'customer_home', '1', NULL, '2026-09-01 17:30:00.000');

DROP TABLE IF EXISTS `cart_items`;
CREATE TABLE `cart_items` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `cart_id` bigint unsigned NOT NULL,
  `menu_item_id` bigint unsigned NOT NULL,
  `quantity` smallint unsigned NOT NULL DEFAULT '1',
  `unit_price` bigint unsigned NOT NULL,
  `note` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_ci_cart` (`cart_id`),
  KEY `fk_ci_item` (`menu_item_id`),
  CONSTRAINT `fk_ci_cart` FOREIGN KEY (`cart_id`) REFERENCES `carts` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_ci_item` FOREIGN KEY (`menu_item_id`) REFERENCES `menu_items` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
INSERT INTO `cart_items` (`id`, `cart_id`, `menu_item_id`, `quantity`, `unit_price`, `note`, `created_at`, `updated_at`) VALUES
(6, 4, 109, 1, 35000, NULL, '2026-08-13 01:45:36.000', '2026-08-13 01:45:36.000');

DROP TABLE IF EXISTS `carts`;
CREATE TABLE `carts` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `customer_id` bigint unsigned NOT NULL,
  `restaurant_id` bigint unsigned NOT NULL,
  `status` enum('active','converted','abandoned') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'active',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_cart_active` (`customer_id`,`restaurant_id`,`status`),
  KEY `fk_cart_rest` (`restaurant_id`),
  CONSTRAINT `fk_cart_cust` FOREIGN KEY (`customer_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_cart_rest` FOREIGN KEY (`restaurant_id`) REFERENCES `restaurants` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
INSERT INTO `carts` (`id`, `customer_id`, `restaurant_id`, `status`, `created_at`, `updated_at`) VALUES
(4, 108, 110, 'active', '2026-08-13 01:45:36.000', '2026-08-13 01:45:36.000');

DROP TABLE IF EXISTS `chat_messages`;
CREATE TABLE `chat_messages` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `conversation_id` bigint unsigned NOT NULL,
  `sender_user_id` bigint unsigned NOT NULL,
  `body` varchar(2000) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `read_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_chat_messages_conversation` (`conversation_id`,`id`),
  KEY `idx_chat_messages_unread` (`conversation_id`,`read_at`,`sender_user_id`),
  KEY `fk_chat_message_sender` (`sender_user_id`),
  CONSTRAINT `fk_chat_message_conversation` FOREIGN KEY (`conversation_id`) REFERENCES `conversations` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_chat_message_sender` FOREIGN KEY (`sender_user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `conversations`;
CREATE TABLE `conversations` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `order_id` bigint unsigned NOT NULL,
  `restaurant_id` bigint unsigned NOT NULL,
  `participant_one_user_id` bigint unsigned NOT NULL,
  `participant_one_role` enum('customer','merchant','admin') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `participant_two_user_id` bigint unsigned NOT NULL,
  `participant_two_role` enum('customer','merchant','admin') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `subject` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `last_message_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_conversation_order_pair` (`order_id`,`participant_one_user_id`,`participant_two_user_id`),
  KEY `idx_conversation_participant_one` (`participant_one_user_id`,`last_message_at`),
  KEY `idx_conversation_participant_two` (`participant_two_user_id`,`last_message_at`),
  KEY `fk_conversation_restaurant` (`restaurant_id`),
  CONSTRAINT `fk_conversation_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_conversation_participant_one` FOREIGN KEY (`participant_one_user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_conversation_participant_two` FOREIGN KEY (`participant_two_user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_conversation_restaurant` FOREIGN KEY (`restaurant_id`) REFERENCES `restaurants` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `cuisines`;
CREATE TABLE `cuisines` (
  `id` smallint unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(80) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `slug` varchar(80) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `icon_url` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `sort_order` smallint NOT NULL DEFAULT '0',
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`),
  UNIQUE KEY `slug` (`slug`)
) ENGINE=InnoDB AUTO_INCREMENT=101 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
INSERT INTO `cuisines` (`id`, `name`, `slug`, `icon_url`, `sort_order`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'Ý', 'italian', 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?auto=format&fit=crop&w=800&q=80', 1, 1, '2026-05-21 21:42:10.000', '2026-08-13 00:18:40.000'),
(2, 'Mỹ', 'american', 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80', 2, 1, '2026-05-21 21:42:10.000', '2026-08-13 00:18:40.000'),
(3, 'Nhật', 'japanese', 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&w=800&q=80', 3, 1, '2026-05-21 21:42:10.000', '2026-08-12 13:18:41.000'),
(4, 'Lành mạnh', 'healthy', 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=800&q=80', 4, 1, '2026-05-21 21:42:10.000', '2026-08-12 13:18:41.000'),
(5, 'Mexico', 'mexican', 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?auto=format&fit=crop&w=800&q=80', 5, 1, '2026-05-21 21:42:10.000', '2026-08-12 13:18:41.000'),
(6, 'Cà phê', 'coffee', 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=800&q=80', 6, 1, '2026-05-21 21:42:10.000', '2026-08-12 13:18:41.000'),
(7, 'Tiệm bánh', 'bakery', 'https://images.unsplash.com/photo-1551024601-bec78aea704b?auto=format&fit=crop&w=800&q=80', 7, 1, '2026-05-21 21:42:10.000', '2026-08-12 13:18:41.000'),
(100, 'Việt Nam', 'vietnamese', 'https://images.unsplash.com/photo-1559314809-0d155014e29e?auto=format&fit=crop&w=800&q=80', 8, 1, '2026-08-12 22:54:00.000', '2026-08-12 22:54:00.000');

DROP TABLE IF EXISTS `customer_addresses`;
CREATE TABLE `customer_addresses` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `customer_id` bigint unsigned NOT NULL,
  `label` varchar(40) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `recipient_name` varchar(120) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `recipient_phone` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `line1` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `ward` varchar(120) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `district` varchar(120) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `city` varchar(120) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `ghn_province_id` int unsigned DEFAULT NULL,
  `ghn_district_id` int unsigned DEFAULT NULL,
  `ghn_ward_code` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `latitude` decimal(10,7) DEFAULT NULL,
  `longitude` decimal(10,7) DEFAULT NULL,
  `delivery_note` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_default` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_addr_customer` (`customer_id`),
  KEY `idx_customer_addresses_ghn_route` (`ghn_district_id`,`ghn_ward_code`),
  CONSTRAINT `fk_addr_customer` FOREIGN KEY (`customer_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=120 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
INSERT INTO `customer_addresses` (`id`, `customer_id`, `label`, `recipient_name`, `recipient_phone`, `line1`, `ward`, `district`, `city`, `ghn_province_id`, `ghn_district_id`, `ghn_ward_code`, `latitude`, `longitude`, `delivery_note`, `is_default`, `created_at`, `updated_at`) VALUES
(1, 2, 'Nhà', 'Nguyễn Minh Anh', '+84901000002', '12 Nguyễn Việt Hồng', 'Phường An Phú', 'Quận Ninh Kiều', 'TP. Cần Thơ', NULL, NULL, NULL, '10.0302000', '105.7791000', 'Bấm chuông căn hộ 3B', 1, '2026-05-21 21:42:10.000', '2026-08-31 18:38:29.000'),
(2, 2, 'Văn phòng', 'Nguyễn Minh Anh', '+84901000002', '89 đường 30 Tháng 4', 'Phường Xuân Khánh', 'Quận Ninh Kiều', 'TP. Cần Thơ', NULL, NULL, NULL, '10.0235000', '105.7707000', 'Để tại quầy lễ tân nếu vắng', 0, '2026-05-21 21:42:10.000', '2026-08-31 18:38:29.000'),
(3, 15, 'Nhà', 'Nguyễn Khánh Linh', '+84901000015', '24 Mậu Thân', 'Phường An Hòa', 'Quận Ninh Kiều', 'TP. Cần Thơ', NULL, NULL, NULL, '10.0376000', '105.7698000', NULL, 1, '2026-05-21 21:42:10.000', '2026-08-31 18:38:29.000'),
(4, 16, 'Nhà', 'Trần Minh Quân', '+84901000016', '65 Trần Hưng Đạo', 'Phường An Nghiệp', 'Quận Ninh Kiều', 'TP. Cần Thơ', NULL, NULL, NULL, '10.0401000', '105.7821000', NULL, 1, '2026-05-21 21:42:10.000', '2026-08-31 18:38:29.000'),
(5, 17, 'Nhà', 'Lê Thảo Vy', '+84901000017', '18 Nguyễn Văn Cừ', 'Phường An Khánh', 'Quận Ninh Kiều', 'TP. Cần Thơ', NULL, NULL, NULL, '10.0297000', '105.7589000', NULL, 1, '2026-05-21 21:42:10.000', '2026-08-31 18:38:29.000'),
(6, 18, 'Nhà', 'Phạm Gia Bảo', '+84901000018', '102 Cách Mạng Tháng Tám', 'Phường Cái Khế', 'Quận Ninh Kiều', 'TP. Cần Thơ', NULL, NULL, NULL, '10.0511000', '105.7859000', NULL, 1, '2026-05-21 21:42:10.000', '2026-08-31 18:38:29.000'),
(7, 19, 'Nhà', 'Võ Ngọc Hân', '+84901000019', '33 Lý Tự Trọng', 'Phường An Cư', 'Quận Ninh Kiều', 'TP. Cần Thơ', NULL, NULL, NULL, '10.0341000', '105.7810000', NULL, 1, '2026-05-21 21:42:10.000', '2026-08-31 18:38:29.000'),
(8, 20, 'Nhà', 'Đặng Anh Khoa', '+84901000020', '77 Nguyễn Trãi', 'Phường Cái Khế', 'Quận Ninh Kiều', 'TP. Cần Thơ', NULL, NULL, NULL, '10.0485000', '105.7846000', NULL, 1, '2026-05-21 21:42:10.000', '2026-08-31 18:38:29.000'),
(9, 21, 'Nhà', 'Bùi Thanh Trúc', '+84901000021', '46 Hòa Bình', 'Phường Tân An', 'Quận Ninh Kiều', 'TP. Cần Thơ', NULL, NULL, NULL, '10.0320000', '105.7871000', NULL, 1, '2026-05-21 21:42:10.000', '2026-08-31 18:38:29.000'),
(10, 22, 'Nhà', 'Hồ Minh Nhật', '+84901000022', '91 Trần Văn Khéo', 'Phường Cái Khế', 'Quận Ninh Kiều', 'TP. Cần Thơ', NULL, NULL, NULL, '10.0457000', '105.7836000', NULL, 1, '2026-05-21 21:42:10.000', '2026-08-31 18:38:29.000');

DROP TABLE IF EXISTS `customer_dismissed_vouchers`;
CREATE TABLE `customer_dismissed_vouchers` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `customer_id` bigint unsigned NOT NULL,
  `voucher_id` bigint unsigned NOT NULL,
  `dismissed_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_customer_dismissed` (`customer_id`,`voucher_id`),
  KEY `idx_customer` (`customer_id`),
  KEY `idx_voucher` (`voucher_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `customer_profiles`;
CREATE TABLE `customer_profiles` (
  `user_id` bigint unsigned NOT NULL,
  `default_address_id` bigint unsigned DEFAULT NULL,
  `preferred_language` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'vi',
  `marketing_opt_in` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`user_id`),
  KEY `fk_cust_default_addr` (`default_address_id`),
  CONSTRAINT `fk_cust_default_addr` FOREIGN KEY (`default_address_id`) REFERENCES `customer_addresses` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_cust_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
INSERT INTO `customer_profiles` (`user_id`, `default_address_id`, `preferred_language`, `marketing_opt_in`, `created_at`, `updated_at`) VALUES
(2, 1, 'vi', 1, '2026-05-21 21:42:10.000', '2026-05-21 21:42:10.000'),
(3, NULL, 'vi', 1, '2026-05-21 21:42:10.000', '2026-05-21 21:42:10.000'),
(4, NULL, 'vi', 1, '2026-05-21 21:42:10.000', '2026-05-21 21:42:10.000'),
(6, NULL, 'vi', 1, '2026-05-21 21:42:10.000', '2026-05-21 21:42:10.000'),
(7, NULL, 'vi', 0, '2026-05-21 21:42:10.000', '2026-05-21 21:42:10.000'),
(8, NULL, 'vi', 0, '2026-05-21 21:42:10.000', '2026-05-21 21:42:10.000'),
(15, 3, 'vi', 1, '2026-05-21 21:42:10.000', '2026-05-21 21:42:10.000'),
(16, 4, 'vi', 1, '2026-05-21 21:42:10.000', '2026-05-21 21:42:10.000'),
(17, 5, 'vi', 1, '2026-05-21 21:42:10.000', '2026-05-21 21:42:10.000'),
(18, 6, 'vi', 1, '2026-05-21 21:42:10.000', '2026-05-21 21:42:10.000'),
(19, 7, 'vi', 0, '2026-05-21 21:42:10.000', '2026-05-21 21:42:10.000'),
(20, 8, 'vi', 1, '2026-05-21 21:42:10.000', '2026-05-21 21:42:10.000'),
(21, 9, 'vi', 1, '2026-05-21 21:42:10.000', '2026-05-21 21:42:10.000'),
(22, 10, 'vi', 1, '2026-05-21 21:42:10.000', '2026-05-21 21:42:10.000'),
(100, NULL, 'vi', 1, '2026-05-21 21:55:26.000', '2026-05-21 21:55:26.000'),
(102, NULL, 'vi', 1, '2026-05-21 22:31:26.000', '2026-05-21 22:31:26.000'),
(103, NULL, 'vi', 1, '2026-05-22 20:41:26.000', '2026-05-22 20:41:26.000');

DROP TABLE IF EXISTS `customer_saved_vouchers`;
CREATE TABLE `customer_saved_vouchers` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `customer_id` bigint unsigned NOT NULL,
  `voucher_id` bigint unsigned NOT NULL,
  `saved_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_customer_voucher` (`customer_id`,`voucher_id`),
  KEY `idx_customer` (`customer_id`),
  KEY `idx_voucher` (`voucher_id`),
  CONSTRAINT `fk_saved_vouchers_customer` FOREIGN KEY (`customer_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_saved_vouchers_voucher` FOREIGN KEY (`voucher_id`) REFERENCES `vouchers` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `driver_assignments`;
CREATE TABLE `driver_assignments` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `order_id` bigint unsigned NOT NULL,
  `driver_id` bigint unsigned NOT NULL,
  `assigned_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `arrived_pickup_at` datetime DEFAULT NULL,
  `picked_up_at` datetime DEFAULT NULL,
  `arrived_dropoff_at` datetime DEFAULT NULL,
  `delivered_at` datetime DEFAULT NULL,
  `status` enum('assigned','en_route_pickup','at_pickup','picked_up','en_route_dropoff','at_dropoff','delivered','cancelled') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'assigned',
  `distance_km` decimal(6,2) NOT NULL DEFAULT '0.00',
  `earning_amount` bigint unsigned NOT NULL DEFAULT '0',
  `proof_photo_url` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `order_id` (`order_id`),
  KEY `idx_da_driver` (`driver_id`,`status`),
  CONSTRAINT `fk_da_driver` FOREIGN KEY (`driver_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_da_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=100 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `driver_profiles`;
CREATE TABLE `driver_profiles` (
  `user_id` bigint unsigned NOT NULL,
  `national_id` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `driver_license_no` varchar(40) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `vehicle_type` enum('motorbike','bicycle','car') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'motorbike',
  `vehicle_model` varchar(120) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `license_plate` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `id_card_url` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `driver_license_url` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `portrait_url` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `bank_account_no` varchar(40) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `bank_name` varchar(120) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `bank_account_holder` varchar(120) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `rating_avg` decimal(3,2) NOT NULL DEFAULT '0.00',
  `total_trips` int unsigned NOT NULL DEFAULT '0',
  `approval_status` enum('pending','approved','rejected','suspended') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending',
  `approved_at` datetime DEFAULT NULL,
  `approved_by_admin_id` bigint unsigned DEFAULT NULL,
  `is_online` tinyint(1) NOT NULL DEFAULT '0',
  `current_lat` decimal(10,7) DEFAULT NULL,
  `current_lng` decimal(10,7) DEFAULT NULL,
  `last_location_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`user_id`),
  UNIQUE KEY `national_id` (`national_id`),
  KEY `idx_drv_online` (`is_online`),
  KEY `idx_drv_status` (`approval_status`),
  KEY `fk_drv_approver` (`approved_by_admin_id`),
  CONSTRAINT `fk_drv_approver` FOREIGN KEY (`approved_by_admin_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_drv_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `home_page_settings`;
CREATE TABLE `home_page_settings` (
  `id` tinyint unsigned NOT NULL,
  `config_json` json NOT NULL,
  `updated_by_admin_id` bigint unsigned DEFAULT NULL,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
INSERT INTO `home_page_settings` (`id`, `config_json`, `updated_by_admin_id`, `updated_at`) VALUES
(1, '{\"hero\":{\"title\":\"Đói bụng? Đặt món ngay.\",\"imageUrl\":\"https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1800&q=80\",\"subtitle\":\"Khám phá món ngon giao siêu tốc từ các quán ăn hàng đầu quanh bạn.\"},\"moods\":[{\"id\":\"comfort\",\"label\":\"Món ăn quen thuộc\",\"linkUrl\":\"/app/search?cuisine=american\",\"imageUrl\":\"https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80\",\"subtitle\":\"Burger, mì Ý, mì ramen\",\"isVisible\":true,\"sortOrder\":1},{\"id\":\"healthy\",\"label\":\"Món ăn tốt cho sức khỏe\",\"linkUrl\":\"/app/search?cuisine=healthy\",\"imageUrl\":\"https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=800&q=80\",\"subtitle\":\"Rau xanh, ngũ cốc, protein\",\"isVisible\":true,\"sortOrder\":2},{\"id\":\"sweet\",\"label\":\"Món ngọt\",\"linkUrl\":\"/app/search?cuisine=bakery\",\"imageUrl\":\"https://images.unsplash.com/photo-1551024601-bec78aea704b?auto=format&fit=crop&w=800&q=80\",\"subtitle\":\"Bánh ngọt, bánh donut, kem\",\"isVisible\":true,\"sortOrder\":3},{\"id\":\"fast\",\"label\":\"Ăn nhẹ\",\"linkUrl\":\"/app/search?cuisine=mexican\",\"imageUrl\":\"https://images.unsplash.com/photo-1565299585323-38d6b0865b47?auto=format&fit=crop&w=800&q=80\",\"subtitle\":\"Sẵn sàng dưới 25 phút\",\"isVisible\":true,\"sortOrder\":4}],\"sections\":[{\"id\":\"cuisines\",\"label\":\"Loại hình ẩm thực\",\"isVisible\":true,\"sortOrder\":1},{\"id\":\"featured-dishes\",\"label\":\"Món nổi bật từ nhiều quán\",\"isVisible\":true,\"sortOrder\":2},{\"id\":\"nearby-dishes\",\"label\":\"Các món gần bạn\",\"isVisible\":true,\"sortOrder\":3},{\"id\":\"promos\",\"label\":\"Banner chiến dịch\",\"isVisible\":true,\"sortOrder\":4},{\"id\":\"trending\",\"label\":\"Thịnh hành\",\"isVisible\":true,\"sortOrder\":5},{\"id\":\"order-again\",\"label\":\"Đặt lại món\",\"isVisible\":true,\"sortOrder\":6},{\"id\":\"featured-restaurants\",\"label\":\"Quán ăn nổi bật\",\"isVisible\":true,\"sortOrder\":7},{\"id\":\"moods\",\"label\":\"Theo tâm trạng\",\"isVisible\":true,\"sortOrder\":8},{\"id\":\"partner\",\"label\":\"Hợp tác với NomNom\",\"isVisible\":true,\"sortOrder\":9}]}', 1, '2026-08-13 00:19:21.000');

DROP TABLE IF EXISTS `home_promo_banners`;
CREATE TABLE `home_promo_banners` (
  `id` varchar(40) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `tag` varchar(80) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `title` varchar(160) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `subtitle` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `cta_label` varchar(80) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `image_url` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `link_url` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `sort_order` smallint NOT NULL DEFAULT '0',
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_hpb_sort` (`sort_order`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
INSERT INTO `home_promo_banners` (`id`, `tag`, `title`, `subtitle`, `cta_label`, `image_url`, `link_url`, `sort_order`, `is_active`, `created_at`) VALUES
('promo-lunch', 'Trưa · 11–2', 'Miễn phí giao hàng cho đơn từ 500.000 ₫', 'Tránh giờ cao điểm văn phòng · T2–T6', 'Đặt bữa trưa', 'https://images.unsplash.com/photo-1551782450-a2132b4ba21d?auto=format&fit=crop&w=1000&q=80', '/app/search', 2, 1, '2026-05-21 21:42:10.000'),
('promo-new', 'Mới mở', '5 bếp mới tuần này', 'Thử ngay trước khi kín chỗ', 'Khám phá', 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=1000&q=80', '/app/search', 3, 1, '2026-05-21 21:42:10.000'),
('promo-nomnom15', 'Sử dụng NOMNOM15', 'Giảm 15% cho đơn hàng đầu tiên', 'Mỗi khách hàng một mã khuyến mãi · Giảm tối đa 250.000 ₫', 'Nhận ngay', 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=1000&q=80', '/app/profile/promotions', 1, 1, '2026-05-21 21:42:10.000');

DROP TABLE IF EXISTS `menu_categories`;
CREATE TABLE `menu_categories` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `restaurant_id` bigint unsigned NOT NULL,
  `name` varchar(120) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `sort_order` smallint NOT NULL DEFAULT '0',
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_mcat_rest` (`restaurant_id`),
  CONSTRAINT `fk_mcat_rest` FOREIGN KEY (`restaurant_id`) REFERENCES `restaurants` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=114 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
INSERT INTO `menu_categories` (`id`, `restaurant_id`, `name`, `description`, `sort_order`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 1, 'Cổ điển', NULL, 1, 1, '2026-05-21 21:42:10.000', '2026-05-21 21:42:10.000'),
(2, 1, 'Đặc sản', NULL, 2, 1, '2026-05-21 21:42:10.000', '2026-05-21 21:42:10.000'),
(3, 1, 'Món phụ', NULL, 3, 1, '2026-05-21 21:42:10.000', '2026-05-21 21:42:10.000'),
(4, 1, 'Tráng miệng', NULL, 4, 1, '2026-05-21 21:42:10.000', '2026-05-21 21:42:10.000'),
(5, 2, 'Hamburger', NULL, 1, 1, '2026-05-21 21:42:10.000', '2026-05-21 21:42:10.000'),
(6, 2, 'Bánh mì kẹp', NULL, 2, 1, '2026-05-21 21:42:10.000', '2026-05-21 21:42:10.000'),
(7, 2, 'Món phụ', NULL, 3, 1, '2026-05-21 21:42:10.000', '2026-05-21 21:42:10.000'),
(8, 2, 'Đồ uống', NULL, 4, 1, '2026-05-21 21:42:10.000', '2026-05-21 21:42:10.000'),
(9, 3, 'Nigiri', NULL, 1, 1, '2026-05-21 21:42:10.000', '2026-05-21 21:42:10.000'),
(10, 3, 'Tô trộn', NULL, 2, 1, '2026-05-21 21:42:10.000', '2026-05-21 21:42:10.000'),
(11, 3, 'Cuộn', NULL, 3, 1, '2026-05-21 21:42:10.000', '2026-05-21 21:42:10.000'),
(12, 3, 'Món phụ', NULL, 4, 1, '2026-05-21 21:42:10.000', '2026-05-21 21:42:10.000'),
(13, 4, 'Tô trộn', NULL, 1, 1, '2026-05-21 21:42:10.000', '2026-05-21 21:42:10.000'),
(14, 4, 'Đồ uống', NULL, 2, 1, '2026-05-21 21:42:10.000', '2026-05-21 21:42:10.000'),
(15, 5, 'Ramen', NULL, 1, 1, '2026-05-21 21:42:10.000', '2026-05-21 21:42:10.000'),
(16, 5, 'Món phụ', NULL, 2, 1, '2026-05-21 21:42:10.000', '2026-05-21 21:42:10.000'),
(17, 6, 'Tacos', NULL, 1, 1, '2026-05-21 21:42:10.000', '2026-05-21 21:42:10.000'),
(18, 6, 'Burritos', NULL, 2, 1, '2026-05-21 21:42:10.000', '2026-05-21 21:42:10.000'),
(19, 6, 'Món phụ', NULL, 3, 1, '2026-05-21 21:42:10.000', '2026-05-21 21:42:10.000'),
(20, 6, 'Đồ uống', NULL, 4, 1, '2026-05-21 21:42:10.000', '2026-05-21 21:42:10.000'),
(21, 7, 'Cà phê', NULL, 1, 1, '2026-05-21 21:42:10.000', '2026-05-21 21:42:10.000'),
(22, 7, 'Bánh ngọt', NULL, 2, 1, '2026-05-21 21:42:10.000', '2026-05-21 21:42:10.000'),
(23, 7, 'Brunch', NULL, 3, 1, '2026-05-21 21:42:10.000', '2026-05-21 21:42:10.000'),
(24, 8, 'Donuts', NULL, 1, 1, '2026-05-21 21:42:10.000', '2026-05-21 21:42:10.000'),
(100, 108, 'Cơm phần', NULL, 1, 1, '2026-08-12 22:54:00.000', '2026-08-12 22:54:00.000'),
(101, 108, 'Món nước', NULL, 2, 1, '2026-08-12 22:54:00.000', '2026-08-12 22:54:00.000'),
(102, 109, 'Cà phê', NULL, 1, 1, '2026-08-12 22:54:00.000', '2026-08-12 22:54:00.000'),
(103, 109, 'Bánh ngọt', NULL, 2, 1, '2026-08-12 22:54:00.000', '2026-08-12 22:54:00.000'),
(104, 110, 'Ăn vặt', NULL, 1, 1, '2026-08-12 22:54:00.000', '2026-08-12 22:54:00.000'),
(105, 110, 'Nước uống', NULL, 2, 1, '2026-08-12 22:54:00.000', '2026-08-12 22:54:00.000'),
(107, 115, 'Món nước', NULL, 1, 1, '2026-08-13 00:47:38.000', '2026-08-13 00:47:38.000'),
(108, 115, 'Món thêm', NULL, 2, 1, '2026-08-13 00:47:38.000', '2026-08-13 00:47:38.000'),
(109, 116, 'Cơm gà', NULL, 1, 1, '2026-08-13 00:47:38.000', '2026-08-13 00:47:38.000'),
(110, 116, 'Món kèm', NULL, 2, 1, '2026-08-13 00:47:38.000', '2026-08-13 00:47:38.000'),
(111, 117, 'Trà trái cây', NULL, 1, 1, '2026-08-13 00:47:38.000', '2026-08-13 00:47:38.000'),
(112, 117, 'Cà phê và bánh', NULL, 2, 1, '2026-08-13 00:47:38.000', '2026-08-13 00:47:38.000');

DROP TABLE IF EXISTS `menu_items`;
CREATE TABLE `menu_items` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `restaurant_id` bigint unsigned NOT NULL,
  `category_id` bigint unsigned NOT NULL,
  `name` varchar(160) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `image_url` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `price` bigint unsigned NOT NULL,
  `prep_time_min` smallint unsigned NOT NULL DEFAULT '15',
  `in_stock` tinyint(1) NOT NULL DEFAULT '1',
  `is_featured` tinyint(1) NOT NULL DEFAULT '0',
  `sort_order` smallint NOT NULL DEFAULT '0',
  `total_sold` int unsigned NOT NULL DEFAULT '0',
  `rating_avg` decimal(3,2) NOT NULL DEFAULT '0.00',
  `status` enum('active','hidden') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'active',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_item_rest` (`restaurant_id`),
  KEY `idx_item_category` (`category_id`),
  KEY `idx_item_status` (`status`),
  CONSTRAINT `fk_item_cat` FOREIGN KEY (`category_id`) REFERENCES `menu_categories` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_item_rest` FOREIGN KEY (`restaurant_id`) REFERENCES `restaurants` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=130 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
INSERT INTO `menu_items` (`id`, `restaurant_id`, `category_id`, `name`, `description`, `image_url`, `price`, `prep_time_min`, `in_stock`, `is_featured`, `sort_order`, `total_sold`, `rating_avg`, `status`, `created_at`, `updated_at`) VALUES
(1, 1, 1, 'Margherita', 'Cà chua San Marzano, phô mai tươi, húng quế.', 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?auto=format&fit=crop&w=800&q=80', 89000, 18, 1, 1, 1, 184, '5.00', 'active', '2026-05-21 21:42:10.000', '2026-08-31 18:38:29.000'),
(2, 1, 1, 'Funghi', 'Nấm Crimini, phô mai taleggio, cỏ xạ hương, dầu truffle.', 'https://images.unsplash.com/photo-1593504049359-74330189a345?auto=format&fit=crop&w=800&q=80', 115000, 20, 1, 0, 2, 96, '0.00', 'active', '2026-05-21 21:42:10.000', '2026-08-13 01:11:43.000'),
(3, 1, 2, 'Salsiccia', 'Xúc xích thì là, phô mai mozzarella xông khói, ớt.', 'https://images.unsplash.com/photo-1571997478779-2adcbbe9ab2f?auto=format&fit=crop&w=800&q=80', 125000, 22, 1, 1, 1, 71, '5.00', 'active', '2026-05-21 21:42:10.000', '2026-08-31 18:38:29.000'),
(4, 1, 3, 'Burrata Salad', 'Cà chua gia truyền, dầu húng quế, muối biển.', 'https://images.unsplash.com/photo-1551248429-40975aa4de74?auto=format&fit=crop&w=800&q=80', 95000, 10, 1, 0, 1, 58, '0.00', 'active', '2026-05-21 21:42:10.000', '2026-08-13 01:11:43.000'),
(5, 1, 4, 'Tiramisu', 'Phô mai Mascarpone, espresso, ca cao.', 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?auto=format&fit=crop&w=800&q=80', 59000, 5, 0, 0, 1, 42, '0.00', 'active', '2026-05-21 21:42:10.000', '2026-09-01 17:45:00.000'),
(6, 2, 5, 'Cổ điển', 'Thịt bò đập dập gấp đôi, phô mai Mỹ, sốt bí mật.', 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80', 99000, 14, 1, 1, 1, 228, '5.00', 'active', '2026-05-21 21:42:10.000', '2026-08-13 01:47:48.000'),
(7, 2, 5, 'Cheddar Bacon', 'Phô mai Cheddar ủ, thịt xông khói ngào đường, dưa chuột muối.', 'https://images.unsplash.com/photo-1572802419224-296b0aeee0d9?auto=format&fit=crop&w=800&q=80', 115000, 16, 1, 0, 2, 146, '0.00', 'active', '2026-05-21 21:42:10.000', '2026-08-13 01:47:48.000'),
(8, 2, 6, 'Gà giòn', 'Gà chiên sữa bơ, salad bắp cải, mật ong cay.', 'https://images.unsplash.com/photo-1606755962773-d324e0a13086?auto=format&fit=crop&w=800&q=80', 105000, 18, 1, 0, 1, 94, '0.00', 'active', '2026-05-21 21:42:10.000', '2026-08-13 01:47:48.000'),
(9, 2, 7, 'Khoai tây chiên', 'Cắt tay, muối biển, thảo mộc.', 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&w=800&q=80', 35000, 8, 1, 0, 1, 322, '0.00', 'active', '2026-05-21 21:42:10.000', '2026-08-13 01:47:48.000'),
(10, 2, 8, 'Vanilla Shake', 'Vani Madagascar, kem tươi.', 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?auto=format&fit=crop&w=800&q=80', 49000, 5, 1, 0, 1, 90, '0.00', 'active', '2026-05-21 21:42:10.000', '2026-08-13 01:47:48.000'),
(11, 3, 9, 'Set Nigiri (8 miếng)', 'Cá ngừ, cá hồi, cá đuôi vàng, tôm.', 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&w=800&q=80', 249000, 30, 1, 1, 1, 152, '5.00', 'active', '2026-05-21 21:42:10.000', '2026-08-13 01:47:48.000'),
(12, 3, 10, 'Cơm bát cá hồi', 'Cơm sushi, cá hồi, bơ, đậu nành Nhật.', 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fit=crop&w=800&q=80', 159000, 25, 1, 0, 1, 94, '0.00', 'active', '2026-05-21 21:42:10.000', '2026-08-13 01:47:48.000'),
(13, 3, 11, 'Spicy Tuna Roll', 'Cá ngừ vây vàng, dầu ớt, hành lá.', 'https://images.unsplash.com/photo-1617196034796-73dfa7b1fd56?auto=format&fit=crop&w=800&q=80', 139000, 20, 1, 0, 1, 70, '0.00', 'active', '2026-05-21 21:42:10.000', '2026-08-13 01:47:48.000'),
(14, 3, 12, 'Súp Miso', 'Miso trắng, đậu phụ, hành lá.', 'https://images.unsplash.com/photo-1607301405390-d831c242f59b?auto=format&fit=crop&w=800&q=80', 35000, 8, 1, 0, 1, 112, '0.00', 'active', '2026-05-21 21:42:10.000', '2026-08-13 01:47:48.000'),
(15, 4, 13, 'Tô mùa vụ', 'Diêm mạch, cải xoăn, bí đỏ, sốt mè.', 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=800&q=80', 89000, 12, 1, 1, 1, 64, '0.00', 'active', '2026-05-21 21:42:10.000', '2026-08-13 01:11:43.000'),
(16, 4, 13, 'Buddha Bowl', 'Cơm lứt, đậu phụ, đậu nành Nhật, gừng.', 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80', 95000, 14, 1, 0, 2, 52, '0.00', 'active', '2026-05-21 21:42:10.000', '2026-08-13 01:11:43.000'),
(17, 4, 14, 'Sinh tố xanh', 'Cải xoăn, chuối, hạnh nhân, hạt gai dầu.', 'https://images.unsplash.com/photo-1610970881699-44a5587cabec?auto=format&fit=crop&w=800&q=80', 55000, 5, 1, 0, 1, 38, '0.00', 'active', '2026-05-21 21:42:10.000', '2026-08-13 01:11:43.000'),
(18, 5, 15, 'Tonkotsu Ramen', 'Nước dùng xương heo, xá xíu, trứng ngâm tương.', 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=800&q=80', 119000, 18, 1, 1, 1, 276, '5.00', 'active', '2026-05-21 21:42:10.000', '2026-08-13 01:47:48.000'),
(19, 5, 15, 'Miso Ramen', 'Miso đỏ, thịt heo xay, ngô.', 'https://images.unsplash.com/photo-1591814468924-caf88d1232e1?auto=format&fit=crop&w=800&q=80', 109000, 18, 1, 0, 2, 176, '0.00', 'active', '2026-05-21 21:42:10.000', '2026-08-13 01:47:48.000'),
(20, 5, 16, 'Gyoza (6 miếng)', 'Sủi cảo heo, sốt ponzu.', 'https://images.unsplash.com/photo-1496116218417-1a781b1c416c?auto=format&fit=crop&w=800&q=80', 59000, 8, 1, 0, 1, 222, '0.00', 'active', '2026-05-21 21:42:10.000', '2026-08-13 01:47:48.000'),
(21, 6, 17, 'Tacos al Pastor (3 chiếc)', 'Dứa, ngò rí, hành tây.', 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?auto=format&fit=crop&w=800&q=80', 99000, 12, 1, 1, 1, 184, '0.00', 'active', '2026-05-21 21:42:10.000', '2026-08-13 01:11:43.000'),
(22, 6, 18, 'Burrito Carnitas', 'Thịt heo ninh nhừ, cơm, đậu, sốt salsa xanh.', 'https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?auto=format&fit=crop&w=800&q=80', 119000, 15, 1, 0, 1, 96, '0.00', 'active', '2026-05-21 21:42:10.000', '2026-08-13 01:11:43.000'),
(23, 6, 19, 'Elote', 'Ngô nướng cháy cạnh, chanh, phô mai cotija.', 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=800&q=80', 39000, 8, 1, 0, 1, 70, '0.00', 'active', '2026-05-21 21:42:10.000', '2026-08-13 01:11:43.000'),
(24, 6, 20, 'Horchata', 'Sữa gạo, quế, vani.', 'https://images.unsplash.com/photo-1541658016709-82535e94bc69?auto=format&fit=crop&w=800&q=80', 35000, 4, 1, 0, 1, 52, '0.00', 'active', '2026-05-21 21:42:10.000', '2026-08-13 01:11:43.000'),
(25, 7, 21, 'Flat White', 'Cà phê espresso kép, bọt sữa mịn.', 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=800&q=80', 49000, 5, 1, 1, 1, 418, '4.00', 'active', '2026-05-21 21:42:10.000', '2026-08-13 01:47:48.000'),
(26, 7, 22, 'Bánh sừng bò hạnh nhân', 'Kem frangipane, hạnh nhân nướng.', 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=800&q=80', 45000, 3, 1, 0, 1, 222, '0.00', 'active', '2026-05-21 21:42:10.000', '2026-08-13 01:47:48.000'),
(27, 7, 23, 'Bánh mì bơ', 'Bánh mì men tự nhiên, ớt, chanh, muối biển.', 'https://plus.unsplash.com/premium_photo-1675604221056-91821ac2df07?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D', 59000, 10, 1, 0, 1, 156, '0.00', 'active', '2026-05-21 21:42:10.000', '2026-08-13 01:47:48.000'),
(28, 8, 24, 'Donut phủ đường cổ điển', 'Lớp phủ vani, bánh donut men.', 'https://images.unsplash.com/photo-1551024601-bec78aea704b?auto=format&fit=crop&w=800&q=80', 30000, 4, 1, 1, 1, 88, '0.00', 'active', '2026-05-21 21:42:10.000', '2026-08-13 01:11:43.000'),
(29, 8, 24, 'Maple Bacon', 'Lớp phủ phong, thịt xông khói ngào đường.', 'https://images.unsplash.com/photo-1527515637462-cff94eecc1ac?auto=format&fit=crop&w=800&q=80', 39000, 5, 1, 0, 2, 46, '0.00', 'hidden', '2026-05-21 21:42:10.000', '2026-09-01 17:45:00.000'),
(100, 108, 100, 'Cơm sườn nướng', 'Sườn nướng, trứng ốp la, đồ chua và canh trong ngày.', 'https://images.unsplash.com/photo-1559314809-0d155014e29e?auto=format&fit=crop&w=800&q=80', 48000, 15, 1, 1, 1, 140, '5.00', 'active', '2026-08-12 22:54:00.000', '2026-08-13 01:47:48.000'),
(101, 108, 100, 'Cơm gà xối mỡ', 'Gà chiên giòn, cơm trắng, dưa chua và nước chấm.', 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?auto=format&fit=crop&w=800&q=80', 52000, 18, 1, 1, 2, 96, '0.00', 'active', '2026-08-12 22:54:00.000', '2026-08-13 01:47:48.000'),
(102, 108, 101, 'Canh chua cá', 'Canh chua thanh vị, dùng kèm cơm trắng.', 'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=800&q=80', 35000, 12, 1, 0, 1, 53, '0.00', 'active', '2026-08-12 22:54:00.000', '2026-08-13 01:47:48.000'),
(103, 108, 101, 'Trà tắc mật ong', 'Trà tắc mát lạnh, ít ngọt.', 'https://images.unsplash.com/photo-1712056407267-1a38c7024a8f?auto=format&fit=crop&w=800&q=80', 18000, 4, 1, 0, 2, 69, '0.00', 'active', '2026-08-12 22:54:00.000', '2026-08-13 01:47:48.000'),
(104, 109, 102, 'Cà phê sữa đá', 'Cà phê rang đậm, sữa đặc và đá viên.', 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=800&q=80', 22000, 5, 1, 1, 1, 194, '4.00', 'active', '2026-08-12 22:54:00.000', '2026-08-13 01:47:48.000'),
(105, 109, 102, 'Bạc xỉu', 'Sữa tươi, cà phê và đá mát lạnh.', 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=800&q=80', 28000, 5, 1, 1, 2, 120, '0.00', 'active', '2026-08-12 22:54:00.000', '2026-08-13 01:47:48.000'),
(106, 109, 103, 'Bánh croissant bơ', 'Croissant nướng nóng, thơm bơ.', 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=800&q=80', 30000, 6, 1, 0, 1, 76, '0.00', 'active', '2026-08-12 22:54:00.000', '2026-08-13 01:47:48.000'),
(107, 109, 103, 'Tiramisu ly', 'Kem mascarpone, cacao và cà phê.', 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?auto=format&fit=crop&w=800&q=80', 42000, 5, 1, 0, 2, 45, '0.00', 'active', '2026-08-12 22:54:00.000', '2026-08-13 01:47:48.000'),
(108, 110, 104, 'Bánh tráng trộn', 'Bánh tráng, xoài, trứng cút và sốt me.', 'https://images.unsplash.com/photo-1626804475297-41608ea09aeb?auto=format&fit=crop&w=800&q=80', 25000, 7, 1, 1, 1, 157, '5.00', 'active', '2026-08-12 22:54:00.000', '2026-08-13 01:47:48.000'),
(109, 110, 104, 'Xiên que thập cẩm', 'Năm xiên chiên nóng, kèm tương ớt.', 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80', 35000, 10, 1, 1, 2, 90, '0.00', 'active', '2026-08-12 22:54:00.000', '2026-08-13 01:47:48.000'),
(110, 110, 105, 'Trà đào cam sả', 'Trà đào thơm, lát cam và sả tươi.', 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?auto=format&fit=crop&w=800&q=80', 30000, 5, 1, 0, 1, 104, '0.00', 'active', '2026-08-12 22:54:00.000', '2026-08-13 01:47:48.000'),
(111, 110, 105, 'Nước mơ ngâm', 'Nước mơ ngâm, chua ngọt vừa phải.', 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=800&q=80', 22000, 4, 1, 0, 2, 61, '0.00', 'active', '2026-08-12 22:54:00.000', '2026-08-13 01:47:48.000'),
(115, 115, 107, 'Bún cá đặc biệt', 'Bún cá, chả cá, rau sống và nước dùng thanh ngọt.', 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=800&q=80', 48000, 16, 1, 1, 1, 134, '5.00', 'active', '2026-08-13 00:47:38.000', '2026-08-13 01:47:48.000'),
(116, 115, 107, 'Bún chả cá', 'Chả cá dai mềm, bún tươi và rau ăn kèm.', 'https://images.unsplash.com/photo-1591814468924-caf88d1232e1?auto=format&fit=crop&w=800&q=80', 42000, 14, 1, 1, 2, 90, '0.00', 'active', '2026-08-13 00:47:38.000', '2026-08-13 01:47:48.000'),
(117, 115, 108, 'Chả cá chiên', 'Chả cá chiên vàng, dùng kèm rau và nước chấm.', 'https://images.unsplash.com/photo-1496116218417-1a781b1c416c?auto=format&fit=crop&w=800&q=80', 30000, 10, 1, 0, 1, 59, '0.00', 'active', '2026-08-13 00:47:38.000', '2026-08-13 01:47:48.000'),
(118, 115, 108, 'Trà sâm mát', 'Trà thảo mộc thanh nhẹ, giảm ngọt.', 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?auto=format&fit=crop&w=800&q=80', 18000, 4, 1, 0, 2, 51, '0.00', 'active', '2026-08-13 00:47:38.000', '2026-08-13 01:47:48.000'),
(119, 116, 109, 'Cơm gà xối mỡ', 'Gà giòn bên ngoài, mềm bên trong, dùng cùng cơm và đồ chua.', 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?auto=format&fit=crop&w=800&q=80', 52000, 18, 1, 1, 1, 150, '5.00', 'active', '2026-08-13 00:47:38.000', '2026-08-13 01:47:48.000'),
(120, 116, 109, 'Cơm gà quay', 'Đùi gà quay đậm vị, cơm nóng và rau ăn kèm.', 'https://images.unsplash.com/photo-1606755962773-d324e0a13086?auto=format&fit=crop&w=800&q=80', 55000, 18, 1, 1, 2, 99, '0.00', 'active', '2026-08-13 00:47:38.000', '2026-08-13 01:47:48.000'),
(121, 116, 110, 'Gà giòn không xương', 'Gà chiên giòn vừa miếng, kèm sốt riêng.', 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80', 45000, 14, 1, 0, 1, 75, '0.00', 'active', '2026-08-13 00:47:38.000', '2026-08-13 01:47:48.000'),
(122, 116, 110, 'Canh rong biển', 'Canh rong biển nhẹ vị dùng kèm cơm gà.', 'https://images.unsplash.com/photo-1607301405390-d831c242f59b?auto=format&fit=crop&w=800&q=80', 18000, 7, 1, 0, 2, 40, '0.00', 'active', '2026-08-13 00:47:38.000', '2026-08-13 01:47:48.000'),
(123, 117, 111, 'Trà đào cam sả', 'Trà đào, cam tươi và sả thơm, điều chỉnh độ ngọt.', 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?auto=format&fit=crop&w=800&q=80', 32000, 6, 1, 1, 1, 127, '4.00', 'active', '2026-08-13 00:47:38.000', '2026-08-13 01:47:48.000'),
(124, 117, 111, 'Trà chanh mật ong', 'Trà chanh, mật ong và bạc hà tươi.', 'https://images.unsplash.com/photo-1712056407267-1a38c7024a8f?auto=format&fit=crop&w=800&q=80', 30000, 5, 1, 1, 2, 93, '0.00', 'active', '2026-08-13 00:47:38.000', '2026-08-13 01:47:48.000'),
(125, 117, 112, 'Cà phê sữa đá', 'Cà phê rang đậm pha cùng sữa đặc.', 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=800&q=80', 25000, 5, 1, 0, 1, 136, '0.00', 'active', '2026-08-13 00:47:38.000', '2026-08-13 01:47:48.000'),
(126, 117, 112, 'Bánh croissant bơ', 'Croissant nướng nóng, lớp vỏ giòn nhẹ.', 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=800&q=80', 30000, 7, 1, 0, 2, 64, '0.00', 'active', '2026-08-13 00:47:38.000', '2026-08-13 01:47:48.000');

DROP TABLE IF EXISTS `notifications`;
CREATE TABLE `notifications` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint unsigned NOT NULL,
  `type` enum('order_placed','order_accepted','order_ready','order_picked_up','order_delivered','order_cancelled','payment_succeeded','payment_failed','payout_status','kyc_status','system') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `title` varchar(160) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `body` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `link_url` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_read` tinyint(1) NOT NULL DEFAULT '0',
  `read_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_notif_user` (`user_id`,`is_read`,`created_at`),
  CONSTRAINT `fk_notif_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=8010 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
INSERT INTO `notifications` (`id`, `user_id`, `type`, `title`, `body`, `link_url`, `is_read`, `read_at`, `created_at`) VALUES
(8001, 2, 'order_delivered', 'Đơn hàng đã giao', 'Đơn NNM-260830-2010 đã hoàn tất. Bạn có thể đánh giá món ăn và nhà hàng.', '/app/orders', 0, NULL, '2026-08-30 18:35:00.000'),
(8002, 2, 'order_accepted', 'Nhà hàng đã xác nhận', 'Đơn NNM-260901-2011 đã được nhà hàng xác nhận và đang xử lý.', '/app/orders', 0, NULL, '2026-09-01 18:33:00.000'),
(8003, 2, 'payment_failed', 'Thanh toán chưa thành công', 'Giao dịch cho đơn NNM-260830-0003 chưa thành công. Bạn có thể thử lại.', '/app/orders', 1, '2026-08-30 09:05:00.000', '2026-08-30 09:02:00.000'),
(8004, 2, 'system', 'Ưu đãi tháng 9', 'Mã NOMNOM15 đang có hiệu lực cho đơn hàng phù hợp.', '/app/profile/promotions', 0, NULL, '2026-09-01 08:00:00.000'),
(8005, 7, 'order_placed', 'Có đơn hàng mới', 'Đơn NNM-260901-0006 đang chờ nhà hàng xác nhận.', '/merchant/orders', 0, NULL, '2026-09-01 19:00:00.000'),
(8006, 7, 'order_delivered', 'Đơn hàng đã hoàn tất', 'Đơn NNM-260901-2016 đã hoàn tất và doanh thu đã được ghi nhận.', '/merchant/orders', 1, '2026-09-01 12:40:00.000', '2026-09-01 12:35:00.000'),
(8007, 7, 'payout_status', 'Đối soát đã cập nhật', 'Số dư khả dụng đã được cập nhật sau phiên đối soát gần nhất.', '/merchant/wallet', 0, NULL, '2026-09-01 17:00:00.000'),
(8008, 1, 'system', 'Dữ liệu vận hành đã cập nhật', 'Dashboard đã có dữ liệu đơn hàng và doanh thu đến ngày 01/09/2026.', '/admin', 0, NULL, '2026-09-01 19:30:00.000'),
(8009, 1, 'order_cancelled', 'Có đơn hàng được hoàn tiền', 'Đơn NNM-260830-0004 đã hủy và hoàn tiền thành công.', '/admin/orders', 0, NULL, '2026-08-30 14:26:00.000');

DROP TABLE IF EXISTS `order_checkout_idempotency`;
CREATE TABLE `order_checkout_idempotency` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `customer_id` bigint unsigned NOT NULL,
  `idempotency_key` varchar(128) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  `request_hash` char(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  `order_id` bigint unsigned DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_checkout_customer_key` (`customer_id`,`idempotency_key`),
  KEY `idx_checkout_order` (`order_id`),
  CONSTRAINT `fk_checkout_customer` FOREIGN KEY (`customer_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_checkout_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `order_items`;
CREATE TABLE `order_items` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `order_id` bigint unsigned NOT NULL,
  `menu_item_id` bigint unsigned NOT NULL,
  `item_name_snapshot` varchar(160) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `unit_price_snapshot` bigint unsigned NOT NULL,
  `quantity` smallint unsigned NOT NULL,
  `line_subtotal` bigint unsigned NOT NULL,
  `note` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_oi_order` (`order_id`),
  KEY `fk_oi_item` (`menu_item_id`),
  CONSTRAINT `fk_oi_item` FOREIGN KEY (`menu_item_id`) REFERENCES `menu_items` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_oi_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3036 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
INSERT INTO `order_items` (`id`, `order_id`, `menu_item_id`, `item_name_snapshot`, `unit_price_snapshot`, `quantity`, `line_subtotal`, `note`, `created_at`) VALUES
(1, 1, 18, 'Tonkotsu Ramen', 400000, 1, 400000, NULL, '2026-08-05 11:20:00.000'),
(2, 1, 20, 'Gyoza (6 miếng)', 188000, 1, 188000, NULL, '2026-08-05 11:20:00.000'),
(3, 2, 6, 'Cổ điển', 288000, 2, 576000, NULL, '2026-08-08 18:10:00.000'),
(4, 2, 9, 'Khoai tây chiên', 113000, 1, 113000, NULL, '2026-08-08 18:10:00.000'),
(5, 3, 1, 'Margherita', 338000, 1, 338000, NULL, '2026-08-30 09:00:00.000'),
(6, 3, 4, 'Burrata Salad', 300000, 1, 300000, NULL, '2026-08-30 09:00:00.000'),
(7, 4, 2, 'Funghi', 400000, 2, 800000, NULL, '2026-08-30 14:00:00.000'),
(8, 5, 3, 'Salsiccia', 438000, 1, 438000, NULL, '2026-08-31 09:00:00.000'),
(9, 5, 1, 'Margherita', 338000, 1, 338000, NULL, '2026-08-31 09:00:00.000'),
(10, 6, 1, 'Margherita', 338000, 1, 338000, NULL, '2026-09-01 19:00:00.000'),
(11, 6, 5, 'Tiramisu', 188000, 1, 188000, NULL, '2026-09-01 19:00:00.000'),
(12, 7, 2, 'Funghi', 400000, 1, 400000, NULL, '2026-08-12 12:15:00.000'),
(13, 8, 1, 'Margherita', 338000, 3, 1014000, 'Đế không gluten', '2026-08-15 18:20:00.000'),
(14, 9, 3, 'Salsiccia', 438000, 1, 438000, NULL, '2026-08-18 11:40:00.000'),
(15, 10, 1, 'Margherita', 338000, 1, 338000, NULL, '2026-08-20 12:05:00.000'),
(16, 11, 4, 'Burrata Salad', 300000, 1, 300000, NULL, '2026-08-22 18:30:00.000'),
(3001, 2001, 6, 'Cổ điển', 99000, 1, 99000, NULL, '2026-08-24 11:30:00.000'),
(3002, 2001, 9, 'Khoai tây chiên', 35000, 1, 35000, NULL, '2026-08-24 11:30:00.000'),
(3003, 2002, 11, 'Set Nigiri (8 miếng)', 249000, 1, 249000, NULL, '2026-08-25 18:00:00.000'),
(3004, 2002, 14, 'Súp Miso', 35000, 1, 35000, NULL, '2026-08-25 18:00:00.000'),
(3005, 2003, 18, 'Tonkotsu Ramen', 119000, 1, 119000, NULL, '2026-08-26 11:00:00.000'),
(3006, 2003, 20, 'Gyoza (6 miếng)', 59000, 1, 59000, NULL, '2026-08-26 11:00:00.000'),
(3007, 2004, 25, 'Flat White', 49000, 1, 49000, NULL, '2026-08-27 08:00:00.000'),
(3008, 2004, 26, 'Bánh sừng bò hạnh nhân', 45000, 1, 45000, NULL, '2026-08-27 08:00:00.000'),
(3009, 2005, 100, 'Cơm sườn nướng', 48000, 1, 48000, NULL, '2026-08-28 11:00:00.000'),
(3010, 2005, 102, 'Canh chua cá', 35000, 2, 70000, NULL, '2026-08-28 11:00:00.000'),
(3011, 2006, 104, 'Cà phê sữa đá', 22000, 2, 44000, 'Ít đá', '2026-08-28 18:00:00.000'),
(3012, 2006, 105, 'Bạc xỉu', 28000, 1, 28000, NULL, '2026-08-28 18:00:00.000'),
(3013, 2007, 108, 'Bánh tráng trộn', 25000, 1, 25000, NULL, '2026-08-29 10:00:00.000'),
(3014, 2007, 109, 'Xiên que thập cẩm', 35000, 1, 35000, NULL, '2026-08-29 10:00:00.000'),
(3015, 2007, 110, 'Trà đào cam sả', 30000, 1, 30000, NULL, '2026-08-29 10:00:00.000'),
(3016, 2008, 115, 'Bún cá đặc biệt', 48000, 1, 48000, NULL, '2026-08-29 19:00:00.000'),
(3017, 2008, 117, 'Chả cá chiên', 30000, 2, 60000, NULL, '2026-08-29 19:00:00.000'),
(3018, 2009, 119, 'Cơm gà xối mỡ', 52000, 1, 52000, NULL, '2026-08-30 11:00:00.000'),
(3019, 2009, 120, 'Cơm gà quay', 55000, 1, 55000, NULL, '2026-08-30 11:00:00.000'),
(3020, 2009, 122, 'Canh rong biển', 18000, 1, 18000, NULL, '2026-08-30 11:00:00.000'),
(3021, 2010, 123, 'Trà đào cam sả', 32000, 1, 32000, '50% đường', '2026-08-30 18:00:00.000'),
(3022, 2010, 125, 'Cà phê sữa đá', 25000, 1, 25000, NULL, '2026-08-30 18:00:00.000'),
(3023, 2010, 126, 'Bánh croissant bơ', 30000, 1, 30000, NULL, '2026-08-30 18:00:00.000'),
(3024, 2011, 1, 'Margherita', 89000, 1, 89000, NULL, '2026-09-01 18:30:00.000'),
(3025, 2011, 2, 'Funghi', 115000, 1, 115000, NULL, '2026-09-01 18:30:00.000'),
(3026, 2012, 7, 'Cheddar Bacon', 115000, 1, 115000, NULL, '2026-09-01 18:45:00.000'),
(3027, 2012, 9, 'Khoai tây chiên', 35000, 1, 35000, NULL, '2026-09-01 18:45:00.000'),
(3028, 2013, 19, 'Miso Ramen', 109000, 1, 109000, NULL, '2026-09-01 19:00:00.000'),
(3029, 2013, 20, 'Gyoza (6 miếng)', 59000, 1, 59000, NULL, '2026-09-01 19:00:00.000'),
(3030, 2014, 100, 'Cơm sườn nướng', 48000, 1, 48000, NULL, '2026-09-01 19:15:00.000'),
(3031, 2014, 101, 'Cơm gà xối mỡ', 52000, 1, 52000, NULL, '2026-09-01 19:15:00.000'),
(3032, 2015, 1, 'Margherita', 89000, 1, 89000, NULL, '2026-08-31 12:00:00.000'),
(3033, 2015, 2, 'Funghi', 115000, 1, 115000, NULL, '2026-08-31 12:00:00.000'),
(3034, 2016, 3, 'Salsiccia', 125000, 1, 125000, NULL, '2026-09-01 12:00:00.000'),
(3035, 2016, 5, 'Tiramisu', 59000, 1, 59000, NULL, '2026-09-01 12:00:00.000');

DROP TABLE IF EXISTS `order_status_logs`;
CREATE TABLE `order_status_logs` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `order_id` bigint unsigned NOT NULL,
  `from_status` varchar(40) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `to_status` varchar(40) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `changed_by_role` enum('customer','merchant','driver','admin','system') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `changed_by_user_id` bigint unsigned DEFAULT NULL,
  `note` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_osl_order` (`order_id`,`created_at`),
  KEY `fk_osl_user` (`changed_by_user_id`),
  CONSTRAINT `fk_osl_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_osl_user` FOREIGN KEY (`changed_by_user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=5017 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
DROP TABLE IF EXISTS `orders`;
CREATE TABLE `orders` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `order_code` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `customer_id` bigint unsigned NOT NULL,
  `restaurant_id` bigint unsigned NOT NULL,
  `voucher_id` bigint unsigned DEFAULT NULL,
  `driver_id` bigint unsigned DEFAULT NULL,
  `delivery_address_id` bigint unsigned NOT NULL,
  `delivery_address_snapshot` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `delivery_lat` decimal(10,7) NOT NULL,
  `delivery_lng` decimal(10,7) NOT NULL,
  `pickup_lat` decimal(10,7) NOT NULL,
  `pickup_lng` decimal(10,7) NOT NULL,
  `distance_km` decimal(6,2) NOT NULL DEFAULT '0.00',
  `subtotal` bigint unsigned NOT NULL,
  `delivery_fee` bigint unsigned NOT NULL DEFAULT '0',
  `discount_amount` bigint unsigned NOT NULL DEFAULT '0',
  `voucher_code_snapshot` varchar(40) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `total_amount` bigint unsigned NOT NULL,
  `driver_earning` bigint unsigned NOT NULL DEFAULT '0',
  `merchant_earning` bigint unsigned NOT NULL DEFAULT '0',
  `platform_fee` bigint unsigned NOT NULL DEFAULT '0',
  `status` enum('pending_payment','payment_failed','placed','accepted','preparing','ready_for_pickup','picked_up','delivering','delivered','cancelled','failed','expired') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending_payment',
  `payment_status` enum('unpaid','paid','failed','refunded') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'unpaid',
  `payment_method` enum('cod','vnpay') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `customer_note` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `estimated_delivery_at` datetime DEFAULT NULL,
  `placed_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `accepted_at` datetime DEFAULT NULL,
  `ready_at` datetime DEFAULT NULL,
  `picked_up_at` datetime DEFAULT NULL,
  `delivered_at` datetime DEFAULT NULL,
  `cancelled_at` datetime DEFAULT NULL,
  `cancelled_by_role` enum('customer','merchant','driver','admin','system') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `cancel_reason` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `order_code` (`order_code`),
  KEY `idx_ord_customer` (`customer_id`,`placed_at`),
  KEY `idx_ord_rest` (`restaurant_id`,`status`),
  KEY `idx_ord_driver` (`driver_id`,`status`),
  KEY `idx_ord_status` (`status`),
  KEY `fk_ord_address` (`delivery_address_id`),
  KEY `idx_orders_voucher` (`voucher_id`),
  CONSTRAINT `fk_ord_address` FOREIGN KEY (`delivery_address_id`) REFERENCES `customer_addresses` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_ord_customer` FOREIGN KEY (`customer_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_ord_driver` FOREIGN KEY (`driver_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_ord_rest` FOREIGN KEY (`restaurant_id`) REFERENCES `restaurants` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_orders_voucher` FOREIGN KEY (`voucher_id`) REFERENCES `vouchers` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=2017 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
INSERT INTO `orders` (`id`, `order_code`, `customer_id`, `restaurant_id`, `voucher_id`, `driver_id`, `delivery_address_id`, `delivery_address_snapshot`, `delivery_lat`, `delivery_lng`, `pickup_lat`, `pickup_lng`, `distance_km`, `subtotal`, `delivery_fee`, `discount_amount`, `voucher_code_snapshot`, `total_amount`, `driver_earning`, `merchant_earning`, `platform_fee`, `status`, `payment_status`, `payment_method`, `customer_note`, `estimated_delivery_at`, `placed_at`, `accepted_at`, `ready_at`, `picked_up_at`, `delivered_at`, `cancelled_at`, `cancelled_by_role`, `cancel_reason`, `created_at`, `updated_at`) VALUES
(1, 'NNM-260805-0001', 2, 5, NULL, NULL, 1, '12 Nguyễn Việt Hồng, Phường An Phú, Quận Ninh Kiều, TP. Cần Thơ', '10.0302000', '105.7791000', '10.0250000', '105.7650000', '3.40', 588000, 62000, 0, NULL, 650000, 0, 499800, 150200, 'delivered', 'paid', 'vnpay', NULL, NULL, '2026-08-05 11:20:00.000', '2026-08-05 11:23:00.000', '2026-08-05 11:38:00.000', '2026-08-05 11:42:00.000', '2026-08-05 11:55:00.000', NULL, NULL, NULL, '2026-08-05 11:20:00.000', '2026-08-31 18:38:29.000'),
(2, 'NNM-260808-0002', 2, 2, NULL, NULL, 1, '12 Nguyễn Việt Hồng, Phường An Phú, Quận Ninh Kiều, TP. Cần Thơ', '10.0302000', '105.7791000', '10.0220000', '105.7620000', '1.80', 689000, 50000, 89000, NULL, 650000, 0, 585650, 153350, 'delivered', 'paid', 'vnpay', NULL, NULL, '2026-08-08 18:10:00.000', '2026-08-08 18:13:00.000', '2026-08-08 18:28:00.000', '2026-08-08 18:32:00.000', '2026-08-08 18:45:00.000', NULL, NULL, NULL, '2026-08-08 18:10:00.000', '2026-08-31 18:38:29.000'),
(3, 'NNM-260830-0003', 2, 1, NULL, NULL, 1, '12 Nguyễn Việt Hồng, Phường An Phú, Quận Ninh Kiều, TP. Cần Thơ', '10.0302000', '105.7791000', '10.0210000', '105.7610000', '0.50', 638000, 62000, 0, NULL, 700000, 0, 542300, 157700, 'payment_failed', 'failed', 'vnpay', 'Làm ơn không lấy húng quế', NULL, '2026-08-30 09:00:00.000', NULL, NULL, NULL, NULL, NULL, NULL, 'Giao dịch VNPay không được ngân hàng chấp thuận.', '2026-08-30 09:00:00.000', '2026-08-31 18:38:29.000'),
(4, 'NNM-260830-0004', 15, 1, NULL, NULL, 3, '24 Mậu Thân, Phường An Hòa, Quận Ninh Kiều, TP. Cần Thơ', '10.0376000', '105.7698000', '10.0210000', '105.7610000', '1.20', 800000, 62000, 0, NULL, 862000, 0, 680000, 182000, 'cancelled', 'refunded', 'vnpay', NULL, NULL, '2026-08-30 14:00:00.000', NULL, NULL, NULL, NULL, '2026-08-30 14:06:00.000', 'customer', 'Khách hàng thay đổi kế hoạch trước khi quán xác nhận.', '2026-08-30 14:00:00.000', '2026-08-31 18:38:29.000'),
(5, 'NNM-260831-0005', 16, 1, NULL, NULL, 4, '65 Trần Hưng Đạo, Phường An Nghiệp, Quận Ninh Kiều, TP. Cần Thơ', '10.0401000', '105.7821000', '10.0210000', '105.7610000', '2.80', 776000, 62000, 0, NULL, 838000, 0, 659600, 178400, 'expired', 'unpaid', 'cod', 'Thêm dầu ớt', NULL, '2026-08-31 09:00:00.000', NULL, NULL, NULL, NULL, NULL, NULL, 'Đơn hết thời gian chờ nhà hàng xác nhận.', '2026-08-31 09:00:00.000', '2026-08-31 18:38:29.000'),
(6, 'NNM-260901-0006', 17, 1, NULL, NULL, 5, '18 Nguyễn Văn Cừ, Phường An Khánh, Quận Ninh Kiều, TP. Cần Thơ', '10.0297000', '105.7589000', '10.0210000', '105.7610000', '3.30', 526000, 62000, 0, NULL, 588000, 0, 447100, 140900, 'placed', 'unpaid', 'cod', NULL, '2026-09-01 19:35:00.000', '2026-09-01 19:00:00.000', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-09-01 19:00:00.000', '2026-08-31 18:38:29.000'),
(7, 'NNM-260812-0007', 18, 1, NULL, NULL, 6, '102 Cách Mạng Tháng Tám, Phường Cái Khế, Quận Ninh Kiều, TP. Cần Thơ', '10.0511000', '105.7859000', '10.0210000', '105.7610000', '2.10', 400000, 62000, 0, NULL, 462000, 0, 340000, 122000, 'delivered', 'paid', 'cod', NULL, NULL, '2026-08-12 12:15:00.000', '2026-08-12 12:18:00.000', '2026-08-12 12:33:00.000', '2026-08-12 12:37:00.000', '2026-08-12 12:50:00.000', NULL, NULL, NULL, '2026-08-12 12:15:00.000', '2026-08-31 18:38:29.000'),
(8, 'NNM-260815-0008', 19, 1, NULL, NULL, 7, '33 Lý Tự Trọng, Phường An Cư, Quận Ninh Kiều, TP. Cần Thơ', '10.0341000', '105.7810000', '10.0210000', '105.7610000', '1.40', 1014000, 62000, 0, NULL, 1076000, 0, 861900, 214100, 'delivered', 'paid', 'vnpay', 'Không gluten — đế không gluten', NULL, '2026-08-15 18:20:00.000', '2026-08-15 18:23:00.000', '2026-08-15 18:38:00.000', '2026-08-15 18:42:00.000', '2026-08-15 18:55:00.000', NULL, NULL, NULL, '2026-08-15 18:20:00.000', '2026-08-31 18:38:29.000'),
(9, 'NNM-260818-0009', 20, 1, NULL, NULL, 8, '77 Nguyễn Trãi, Phường Cái Khế, Quận Ninh Kiều, TP. Cần Thơ', '10.0485000', '105.7846000', '10.0210000', '105.7610000', '5.40', 438000, 62000, 0, NULL, 500000, 0, 372300, 127700, 'delivered', 'paid', 'vnpay', NULL, NULL, '2026-08-18 11:40:00.000', '2026-08-18 11:43:00.000', '2026-08-18 11:58:00.000', '2026-08-18 12:02:00.000', '2026-08-18 12:15:00.000', NULL, NULL, NULL, '2026-08-18 11:40:00.000', '2026-08-31 18:38:29.000'),
(10, 'NNM-260820-0010', 21, 1, NULL, NULL, 9, '46 Hòa Bình, Phường Tân An, Quận Ninh Kiều, TP. Cần Thơ', '10.0320000', '105.7871000', '10.0210000', '105.7610000', '6.80', 338000, 62000, 0, NULL, 400000, 0, 287300, 112700, 'delivered', 'paid', 'vnpay', 'Giao chậm một chút cũng được', NULL, '2026-08-20 12:05:00.000', '2026-08-20 12:08:00.000', '2026-08-20 12:23:00.000', '2026-08-20 12:27:00.000', '2026-08-20 12:40:00.000', NULL, NULL, NULL, '2026-08-20 12:05:00.000', '2026-08-31 18:38:29.000'),
(11, 'NNM-260822-0011', 22, 1, NULL, NULL, 10, '91 Trần Văn Khéo, Phường Cái Khế, Quận Ninh Kiều, TP. Cần Thơ', '10.0457000', '105.7836000', '10.0210000', '105.7610000', '3.10', 300000, 62000, 0, NULL, 362000, 0, 255000, 107000, 'delivered', 'paid', 'cod', NULL, NULL, '2026-08-22 18:30:00.000', '2026-08-22 18:33:00.000', '2026-08-22 18:48:00.000', '2026-08-22 18:52:00.000', '2026-08-22 19:05:00.000', NULL, NULL, NULL, '2026-08-22 18:30:00.000', '2026-08-31 18:38:29.000'),
(2001, 'NNM-260824-2001', 2, 2, NULL, NULL, 1, '12 Nguyễn Việt Hồng, Phường An Phú, Quận Ninh Kiều, TP. Cần Thơ', '10.0302000', '105.7791000', '10.0220000', '105.7620000', '2.80', 134000, 18000, 0, NULL, 152000, 0, 113900, 38100, 'delivered', 'paid', 'cod', 'Ít tương ớt', NULL, '2026-08-24 11:30:00.000', '2026-08-24 11:33:00.000', '2026-08-24 11:48:00.000', '2026-08-24 11:52:00.000', '2026-08-24 12:05:00.000', NULL, NULL, NULL, '2026-08-24 11:30:00.000', '2026-08-31 18:38:29.000'),
(2002, 'NNM-260825-2002', 15, 3, NULL, NULL, 3, '24 Mậu Thân, Phường An Hòa, Quận Ninh Kiều, TP. Cần Thơ', '10.0376000', '105.7698000', '10.0230000', '105.7630000', '3.40', 284000, 22000, 0, NULL, 306000, 0, 232880, 73120, 'delivered', 'paid', 'vnpay', NULL, NULL, '2026-08-25 18:00:00.000', '2026-08-25 18:03:00.000', '2026-08-25 18:18:00.000', '2026-08-25 18:22:00.000', '2026-08-25 18:35:00.000', NULL, NULL, NULL, '2026-08-25 18:00:00.000', '2026-08-31 18:38:29.000'),
(2003, 'NNM-260826-2003', 16, 5, NULL, NULL, 4, '65 Trần Hưng Đạo, Phường An Nghiệp, Quận Ninh Kiều, TP. Cần Thơ', '10.0401000', '105.7821000', '10.0250000', '105.7650000', '4.10', 178000, 25000, 0, NULL, 203000, 0, 151300, 51700, 'delivered', 'paid', 'cod', 'Không lấy đũa', NULL, '2026-08-26 11:00:00.000', '2026-08-26 11:03:00.000', '2026-08-26 11:18:00.000', '2026-08-26 11:22:00.000', '2026-08-26 11:35:00.000', NULL, NULL, NULL, '2026-08-26 11:00:00.000', '2026-08-31 18:38:29.000'),
(2004, 'NNM-260827-2004', 17, 7, NULL, NULL, 5, '18 Nguyễn Văn Cừ, Phường An Khánh, Quận Ninh Kiều, TP. Cần Thơ', '10.0297000', '105.7589000', '10.0270000', '105.7670000', '2.20', 94000, 16000, 0, NULL, 110000, 0, 82720, 27280, 'delivered', 'paid', 'vnpay', NULL, NULL, '2026-08-27 08:00:00.000', '2026-08-27 08:03:00.000', '2026-08-27 08:18:00.000', '2026-08-27 08:22:00.000', '2026-08-27 08:35:00.000', NULL, NULL, NULL, '2026-08-27 08:00:00.000', '2026-08-31 18:38:29.000'),
(2005, 'NNM-260828-2005', 18, 108, NULL, NULL, 6, '102 Cách Mạng Tháng Tám, Phường Cái Khế, Quận Ninh Kiều, TP. Cần Thơ', '10.0511000', '105.7859000', '10.0280000', '105.7680000', '3.00', 118000, 19000, 0, NULL, 137000, 0, 100300, 36700, 'delivered', 'paid', 'cod', 'Giao tại lễ tân', NULL, '2026-08-28 11:00:00.000', '2026-08-28 11:03:00.000', '2026-08-28 11:18:00.000', '2026-08-28 11:22:00.000', '2026-08-28 11:35:00.000', NULL, NULL, NULL, '2026-08-28 11:00:00.000', '2026-08-31 18:38:29.000'),
(2006, 'NNM-260828-2006', 19, 109, NULL, NULL, 7, '33 Lý Tự Trọng, Phường An Cư, Quận Ninh Kiều, TP. Cần Thơ', '10.0341000', '105.7810000', '10.0290000', '105.7690000', '1.90', 72000, 15000, 0, NULL, 87000, 0, 63360, 23640, 'delivered', 'paid', 'vnpay', 'Ít đá', NULL, '2026-08-28 18:00:00.000', '2026-08-28 18:03:00.000', '2026-08-28 18:18:00.000', '2026-08-28 18:22:00.000', '2026-08-28 18:35:00.000', NULL, NULL, NULL, '2026-08-28 18:00:00.000', '2026-08-31 18:38:29.000'),
(2007, 'NNM-260829-2007', 20, 110, NULL, NULL, 8, '77 Nguyễn Trãi, Phường Cái Khế, Quận Ninh Kiều, TP. Cần Thơ', '10.0485000', '105.7846000', '10.0300000', '105.7700000', '2.50', 90000, 17000, 0, NULL, 107000, 0, 79200, 27800, 'delivered', 'paid', 'cod', 'Không cay', NULL, '2026-08-29 10:00:00.000', '2026-08-29 10:03:00.000', '2026-08-29 10:18:00.000', '2026-08-29 10:22:00.000', '2026-08-29 10:35:00.000', NULL, NULL, NULL, '2026-08-29 10:00:00.000', '2026-08-31 18:38:29.000'),
(2008, 'NNM-260829-2008', 21, 115, NULL, NULL, 9, '46 Hòa Bình, Phường Tân An, Quận Ninh Kiều, TP. Cần Thơ', '10.0320000', '105.7871000', '10.0350000', '105.7750000', '3.70', 108000, 23000, 0, NULL, 131000, 0, 91800, 39200, 'delivered', 'paid', 'vnpay', NULL, NULL, '2026-08-29 19:00:00.000', '2026-08-29 19:03:00.000', '2026-08-29 19:18:00.000', '2026-08-29 19:22:00.000', '2026-08-29 19:35:00.000', NULL, NULL, NULL, '2026-08-29 19:00:00.000', '2026-08-31 18:38:29.000'),
(2009, 'NNM-260830-2009', 22, 116, NULL, NULL, 10, '91 Trần Văn Khéo, Phường Cái Khế, Quận Ninh Kiều, TP. Cần Thơ', '10.0457000', '105.7836000', '10.0360000', '105.7760000', '4.40', 125000, 26000, 0, NULL, 151000, 0, 106250, 44750, 'delivered', 'paid', 'cod', 'Thêm nước tương', NULL, '2026-08-30 11:00:00.000', '2026-08-30 11:03:00.000', '2026-08-30 11:18:00.000', '2026-08-30 11:22:00.000', '2026-08-30 11:35:00.000', NULL, NULL, NULL, '2026-08-30 11:00:00.000', '2026-08-31 18:38:29.000'),
(2010, 'NNM-260830-2010', 2, 117, NULL, NULL, 1, '12 Nguyễn Việt Hồng, Phường An Phú, Quận Ninh Kiều, TP. Cần Thơ', '10.0302000', '105.7791000', '10.0370000', '105.7770000', '2.60', 87000, 18000, 0, NULL, 105000, 0, 76560, 28440, 'delivered', 'paid', 'vnpay', '50% đường', NULL, '2026-08-30 18:00:00.000', '2026-08-30 18:03:00.000', '2026-08-30 18:18:00.000', '2026-08-30 18:22:00.000', '2026-08-30 18:35:00.000', NULL, NULL, NULL, '2026-08-30 18:00:00.000', '2026-08-31 18:38:29.000'),
(2011, 'NNM-260901-2011', 2, 1, NULL, NULL, 1, '12 Nguyễn Việt Hồng, Phường An Phú, Quận Ninh Kiều, TP. Cần Thơ', '10.0302000', '105.7791000', '10.0210000', '105.7610000', '2.10', 204000, 17000, 0, NULL, 221000, 0, 173400, 47600, 'accepted', 'paid', 'vnpay', 'Gọi khi đến nơi', '2026-09-01 19:05:00.000', '2026-09-01 18:30:00.000', '2026-09-01 18:33:00.000', NULL, NULL, NULL, NULL, NULL, NULL, '2026-09-01 18:30:00.000', '2026-08-31 18:38:29.000'),
(2012, 'NNM-260901-2012', 15, 2, NULL, NULL, 3, '24 Mậu Thân, Phường An Hòa, Quận Ninh Kiều, TP. Cần Thơ', '10.0376000', '105.7698000', '10.0220000', '105.7620000', '2.90', 150000, 19000, 0, NULL, 169000, 0, 127500, 41500, 'preparing', 'paid', 'vnpay', 'Không hành', '2026-09-01 19:20:00.000', '2026-09-01 18:45:00.000', '2026-09-01 18:48:00.000', NULL, NULL, NULL, NULL, NULL, NULL, '2026-09-01 18:45:00.000', '2026-08-31 18:38:29.000'),
(2013, 'NNM-260901-2013', 16, 5, NULL, NULL, 4, '65 Trần Hưng Đạo, Phường An Nghiệp, Quận Ninh Kiều, TP. Cần Thơ', '10.0401000', '105.7821000', '10.0250000', '105.7650000', '3.50', 168000, 22000, 0, NULL, 190000, 0, 142800, 47200, 'ready_for_pickup', 'unpaid', 'cod', NULL, '2026-09-01 19:35:00.000', '2026-09-01 19:00:00.000', '2026-09-01 19:03:00.000', '2026-09-01 19:18:00.000', NULL, NULL, NULL, NULL, NULL, '2026-09-01 19:00:00.000', '2026-08-31 18:38:29.000'),
(2014, 'NNM-260901-2014', 17, 108, NULL, NULL, 5, '18 Nguyễn Văn Cừ, Phường An Khánh, Quận Ninh Kiều, TP. Cần Thơ', '10.0297000', '105.7589000', '10.0280000', '105.7680000', '2.40', 100000, 17000, 0, NULL, 117000, 0, 85000, 32000, 'delivering', 'paid', 'vnpay', 'Xin thêm canh', '2026-09-01 19:50:00.000', '2026-09-01 19:15:00.000', '2026-09-01 19:18:00.000', '2026-09-01 19:33:00.000', '2026-09-01 19:37:00.000', NULL, NULL, NULL, NULL, '2026-09-01 19:15:00.000', '2026-08-31 18:38:29.000'),
(2015, 'NNM-260831-2015', 18, 1, NULL, NULL, 6, '102 Cách Mạng Tháng Tám, Phường Cái Khế, Quận Ninh Kiều, TP. Cần Thơ', '10.0511000', '105.7859000', '10.0210000', '105.7610000', '2.30', 204000, 17000, 0, NULL, 221000, 0, 173400, 47600, 'delivered', 'paid', 'cod', 'Cắt pizza giúp mình', NULL, '2026-08-31 12:00:00.000', '2026-08-31 12:03:00.000', '2026-08-31 12:18:00.000', '2026-08-31 12:22:00.000', '2026-08-31 12:35:00.000', NULL, NULL, NULL, '2026-08-31 12:00:00.000', '2026-08-31 18:38:29.000'),
(2016, 'NNM-260901-2016', 19, 1, NULL, NULL, 7, '33 Lý Tự Trọng, Phường An Cư, Quận Ninh Kiều, TP. Cần Thơ', '10.0341000', '105.7810000', '10.0210000', '105.7610000', '3.10', 184000, 20000, 0, NULL, 204000, 0, 156400, 47600, 'delivered', 'paid', 'vnpay', NULL, NULL, '2026-09-01 12:00:00.000', '2026-09-01 12:03:00.000', '2026-09-01 12:18:00.000', '2026-09-01 12:22:00.000', '2026-09-01 12:35:00.000', NULL, NULL, NULL, '2026-09-01 12:00:00.000', '2026-08-31 18:38:29.000');

DROP TABLE IF EXISTS `otp_codes`;
CREATE TABLE `otp_codes` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint unsigned DEFAULT NULL,
  `destination` varchar(160) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `channel` enum('email','sms') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `purpose` enum('register','login','reset_password') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `code_hash` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `attempts` tinyint unsigned NOT NULL DEFAULT '0',
  `expires_at` datetime NOT NULL,
  `consumed_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_otp_destination` (`destination`),
  KEY `fk_otp_user` (`user_id`),
  CONSTRAINT `fk_otp_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=18 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `payment_refunds`;
CREATE TABLE `payment_refunds` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `payment_id` bigint unsigned NOT NULL,
  `order_id` bigint unsigned NOT NULL,
  `request_id` varchar(120) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `amount` bigint unsigned NOT NULL,
  `status` enum('initiated','succeeded','failed') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'initiated',
  `gateway_txn_id` varchar(120) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `failure_reason` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `raw_response` json DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `completed_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_payment_refunds_request` (`request_id`),
  KEY `idx_payment_refunds_payment` (`payment_id`,`status`),
  KEY `idx_payment_refunds_order` (`order_id`,`status`),
  CONSTRAINT `fk_payment_refunds_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_payment_refunds_payment` FOREIGN KEY (`payment_id`) REFERENCES `payments` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
INSERT INTO `payment_refunds` (`id`, `payment_id`, `order_id`, `request_id`, `amount`, `status`, `gateway_txn_id`, `failure_reason`, `raw_response`, `created_at`, `completed_at`) VALUES
(1, 4, 4, 'RF-NNM-260830-0004', 862000, 'succeeded', 'VNP-RF-000004', NULL, NULL, '2026-08-30 14:08:00.000', '2026-08-30 14:26:00.000');

DROP TABLE IF EXISTS `payments`;
CREATE TABLE `payments` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `order_id` bigint unsigned NOT NULL,
  `method` enum('cod','vnpay') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `amount` bigint unsigned NOT NULL,
  `currency` char(3) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'VND',
  `gateway` varchar(40) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `gateway_reference` varchar(120) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `gateway_txn_id` varchar(120) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `gateway_created_at` datetime DEFAULT NULL,
  `status` enum('initiated','pending','succeeded','failed','cancelled') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'initiated',
  `failure_reason` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `paid_at` datetime DEFAULT NULL,
  `raw_response` json DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_payments_gateway_reference` (`gateway_reference`),
  KEY `idx_pay_order` (`order_id`),
  KEY `idx_pay_status` (`status`),
  CONSTRAINT `fk_pay_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB AUTO_INCREMENT=4017 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
INSERT INTO `payments` (`id`, `order_id`, `method`, `amount`, `currency`, `gateway`, `gateway_reference`, `gateway_txn_id`, `gateway_created_at`, `status`, `failure_reason`, `paid_at`, `raw_response`, `created_at`, `updated_at`) VALUES
(1, 1, 'vnpay', 650000, 'VND', 'vnpay', 'VNP-NNM-260805-0001', 'VNP-TXN-000001', '2026-08-05 11:20:00.000', 'succeeded', NULL, '2026-08-05 11:21:00.000', NULL, '2026-08-05 11:20:00.000', '2026-08-31 18:38:29.000'),
(2, 2, 'vnpay', 650000, 'VND', 'vnpay', 'VNP-NNM-260808-0002', 'VNP-TXN-000002', '2026-08-08 18:10:00.000', 'succeeded', NULL, '2026-08-08 18:11:00.000', NULL, '2026-08-08 18:10:00.000', '2026-08-31 18:38:29.000'),
(3, 3, 'vnpay', 700000, 'VND', 'vnpay', 'VNP-NNM-260830-0003', NULL, '2026-08-30 09:00:00.000', 'failed', 'Ngân hàng từ chối giao dịch.', NULL, NULL, '2026-08-30 09:00:00.000', '2026-08-31 18:38:29.000'),
(4, 4, 'vnpay', 862000, 'VND', 'vnpay', 'VNP-NNM-260830-0004', 'VNP-TXN-000004', '2026-08-30 14:00:00.000', 'succeeded', NULL, '2026-08-30 14:01:00.000', NULL, '2026-08-30 14:00:00.000', '2026-08-31 18:38:29.000'),
(5, 5, 'cod', 838000, 'VND', NULL, NULL, NULL, NULL, 'cancelled', NULL, NULL, NULL, '2026-08-31 09:00:00.000', '2026-08-31 18:38:29.000'),
(6, 6, 'cod', 588000, 'VND', NULL, NULL, NULL, NULL, 'pending', NULL, NULL, NULL, '2026-09-01 19:00:00.000', '2026-08-31 18:38:29.000'),
(7, 7, 'cod', 462000, 'VND', NULL, NULL, NULL, NULL, 'succeeded', NULL, '2026-08-12 12:50:00.000', NULL, '2026-08-12 12:15:00.000', '2026-08-31 18:38:29.000'),
(8, 8, 'vnpay', 1076000, 'VND', 'vnpay', 'VNP-NNM-260815-0008', 'VNP-TXN-000008', '2026-08-15 18:20:00.000', 'succeeded', NULL, '2026-08-15 18:21:00.000', NULL, '2026-08-15 18:20:00.000', '2026-08-31 18:38:29.000'),
(9, 9, 'vnpay', 500000, 'VND', 'vnpay', 'VNP-NNM-260818-0009', 'VNP-TXN-000009', '2026-08-18 11:40:00.000', 'succeeded', NULL, '2026-08-18 11:41:00.000', NULL, '2026-08-18 11:40:00.000', '2026-08-31 18:38:29.000'),
(10, 10, 'vnpay', 400000, 'VND', 'vnpay', 'VNP-NNM-260820-0010', 'VNP-TXN-000010', '2026-08-20 12:05:00.000', 'succeeded', NULL, '2026-08-20 12:06:00.000', NULL, '2026-08-20 12:05:00.000', '2026-08-31 18:38:29.000'),
(11, 11, 'cod', 362000, 'VND', NULL, NULL, NULL, NULL, 'succeeded', NULL, '2026-08-22 19:05:00.000', NULL, '2026-08-22 18:30:00.000', '2026-08-31 18:38:29.000'),
(4001, 2001, 'cod', 152000, 'VND', NULL, NULL, NULL, NULL, 'succeeded', NULL, '2026-08-24 12:05:00.000', NULL, '2026-08-24 11:30:00.000', '2026-08-31 18:38:29.000'),
(4002, 2002, 'vnpay', 306000, 'VND', 'vnpay', 'VNP-NNM-260825-2002', 'VNP-TXN-002002', '2026-08-25 18:00:00.000', 'succeeded', NULL, '2026-08-25 18:01:00.000', NULL, '2026-08-25 18:00:00.000', '2026-08-31 18:38:29.000'),
(4003, 2003, 'cod', 203000, 'VND', NULL, NULL, NULL, NULL, 'succeeded', NULL, '2026-08-26 11:35:00.000', NULL, '2026-08-26 11:00:00.000', '2026-08-31 18:38:29.000'),
(4004, 2004, 'vnpay', 110000, 'VND', 'vnpay', 'VNP-NNM-260827-2004', 'VNP-TXN-002004', '2026-08-27 08:00:00.000', 'succeeded', NULL, '2026-08-27 08:01:00.000', NULL, '2026-08-27 08:00:00.000', '2026-08-31 18:38:29.000'),
(4005, 2005, 'cod', 137000, 'VND', NULL, NULL, NULL, NULL, 'succeeded', NULL, '2026-08-28 11:35:00.000', NULL, '2026-08-28 11:00:00.000', '2026-08-31 18:38:29.000'),
(4006, 2006, 'vnpay', 87000, 'VND', 'vnpay', 'VNP-NNM-260828-2006', 'VNP-TXN-002006', '2026-08-28 18:00:00.000', 'succeeded', NULL, '2026-08-28 18:01:00.000', NULL, '2026-08-28 18:00:00.000', '2026-08-31 18:38:29.000'),
(4007, 2007, 'cod', 107000, 'VND', NULL, NULL, NULL, NULL, 'succeeded', NULL, '2026-08-29 10:35:00.000', NULL, '2026-08-29 10:00:00.000', '2026-08-31 18:38:29.000'),
(4008, 2008, 'vnpay', 131000, 'VND', 'vnpay', 'VNP-NNM-260829-2008', 'VNP-TXN-002008', '2026-08-29 19:00:00.000', 'succeeded', NULL, '2026-08-29 19:01:00.000', NULL, '2026-08-29 19:00:00.000', '2026-08-31 18:38:29.000'),
(4009, 2009, 'cod', 151000, 'VND', NULL, NULL, NULL, NULL, 'succeeded', NULL, '2026-08-30 11:35:00.000', NULL, '2026-08-30 11:00:00.000', '2026-08-31 18:38:29.000'),
(4010, 2010, 'vnpay', 105000, 'VND', 'vnpay', 'VNP-NNM-260830-2010', 'VNP-TXN-002010', '2026-08-30 18:00:00.000', 'succeeded', NULL, '2026-08-30 18:01:00.000', NULL, '2026-08-30 18:00:00.000', '2026-08-31 18:38:29.000'),
(4011, 2011, 'vnpay', 221000, 'VND', 'vnpay', 'VNP-NNM-260901-2011', 'VNP-TXN-002011', '2026-09-01 18:30:00.000', 'succeeded', NULL, '2026-09-01 18:31:00.000', NULL, '2026-09-01 18:30:00.000', '2026-08-31 18:38:29.000'),
(4012, 2012, 'vnpay', 169000, 'VND', 'vnpay', 'VNP-NNM-260901-2012', 'VNP-TXN-002012', '2026-09-01 18:45:00.000', 'succeeded', NULL, '2026-09-01 18:46:00.000', NULL, '2026-09-01 18:45:00.000', '2026-08-31 18:38:29.000'),
(4013, 2013, 'cod', 190000, 'VND', NULL, NULL, NULL, NULL, 'pending', NULL, NULL, NULL, '2026-09-01 19:00:00.000', '2026-08-31 18:38:29.000'),
(4014, 2014, 'vnpay', 117000, 'VND', 'vnpay', 'VNP-NNM-260901-2014', 'VNP-TXN-002014', '2026-09-01 19:15:00.000', 'succeeded', NULL, '2026-09-01 19:16:00.000', NULL, '2026-09-01 19:15:00.000', '2026-08-31 18:38:29.000'),
(4015, 2015, 'cod', 221000, 'VND', NULL, NULL, NULL, NULL, 'succeeded', NULL, '2026-08-31 12:35:00.000', NULL, '2026-08-31 12:00:00.000', '2026-08-31 18:38:29.000'),
(4016, 2016, 'vnpay', 204000, 'VND', 'vnpay', 'VNP-NNM-260901-2016', 'VNP-TXN-002016', '2026-09-01 12:00:00.000', 'succeeded', NULL, '2026-09-01 12:01:00.000', NULL, '2026-09-01 12:00:00.000', '2026-08-31 18:38:29.000');

DROP TABLE IF EXISTS `payout_requests`;
CREATE TABLE `payout_requests` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `wallet_id` bigint unsigned NOT NULL,
  `user_id` bigint unsigned NOT NULL,
  `amount` bigint unsigned NOT NULL,
  `bank_account_no` varchar(40) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `bank_name` varchar(120) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `bank_account_holder` varchar(120) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` enum('pending','approved','completed','rejected') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending',
  `reviewed_by_admin_id` bigint unsigned DEFAULT NULL,
  `reviewed_at` datetime DEFAULT NULL,
  `reject_reason` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `external_ref` varchar(120) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `requested_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `completed_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_payout_user` (`user_id`),
  KEY `idx_payout_status` (`status`),
  KEY `fk_payout_wallet` (`wallet_id`),
  KEY `fk_payout_admin` (`reviewed_by_admin_id`),
  CONSTRAINT `fk_payout_admin` FOREIGN KEY (`reviewed_by_admin_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_payout_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_payout_wallet` FOREIGN KEY (`wallet_id`) REFERENCES `wallets` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB AUTO_INCREMENT=100 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
INSERT INTO `payout_requests` (`id`, `wallet_id`, `user_id`, `amount`, `bank_account_no`, `bank_name`, `bank_account_holder`, `status`, `reviewed_by_admin_id`, `reviewed_at`, `reject_reason`, `external_ref`, `requested_at`, `completed_at`) VALUES
(2, 5, 8, 1500000, '060011223344', 'BIDV', 'TRẦN QUỐC HUY', 'pending', NULL, NULL, NULL, NULL, '2026-05-21 15:42:10.000', NULL),
(4, 4, 7, 2000000, '037000118822', 'Vietcombank', 'NGUYỄN THANH PHONG', 'completed', 1, '2026-05-17 21:42:10.000', NULL, 'VCB20260518-7723', '2026-05-16 21:42:10.000', '2026-05-17 21:42:10.000');

DROP TABLE IF EXISTS `platform_config`;
CREATE TABLE `platform_config` (
  `config_key` varchar(80) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `config_value` varchar(1000) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `data_type` enum('string','int','decimal','boolean','json') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'string',
  `description` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `updated_by_admin_id` bigint unsigned DEFAULT NULL,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`config_key`),
  KEY `fk_cfg_admin` (`updated_by_admin_id`),
  CONSTRAINT `fk_cfg_admin` FOREIGN KEY (`updated_by_admin_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
INSERT INTO `platform_config` (`config_key`, `config_value`, `data_type`, `description`, `updated_by_admin_id`, `updated_at`) VALUES
('default_commission_rate', '15', 'decimal', 'Hoa hồng nền tảng (%) mặc định cho nhà hàng', NULL, '2026-05-21 21:42:10.000'),
('max_search_radius_km', '8', 'decimal', 'Bán kính tìm kiếm tối đa (km)', NULL, '2026-05-21 21:42:10.000'),
('min_payout_amount', '100000', 'int', 'Số tiền tối thiểu mỗi lần rút (VND)', NULL, '2026-05-21 21:42:10.000'),
('order_auto_cancel_minutes', '5', 'int', 'Số phút huỷ tự động nếu nhà hàng không xác nhận', NULL, '2026-05-21 21:42:10.000');

DROP TABLE IF EXISTS `refresh_tokens`;
CREATE TABLE `refresh_tokens` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint unsigned NOT NULL,
  `token_hash` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_agent` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ip_address` varchar(45) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `expires_at` datetime NOT NULL,
  `revoked_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `token_hash` (`token_hash`),
  KEY `idx_refresh_user` (`user_id`),
  CONSTRAINT `fk_refresh_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=55 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `registration_pending`;
CREATE TABLE `registration_pending` (
  `email` varchar(160) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `full_name` varchar(120) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `password_hash` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `avatar_url` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `expires_at` datetime NOT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `restaurant_address_change_requests`;
CREATE TABLE `restaurant_address_change_requests` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `restaurant_id` bigint unsigned NOT NULL,
  `requested_by_user_id` bigint unsigned NOT NULL,
  `current_address_line` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `current_ward` varchar(160) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `current_district` varchar(160) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `current_city` varchar(160) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `current_ghn_province_id` int unsigned DEFAULT NULL,
  `current_ghn_district_id` int unsigned DEFAULT NULL,
  `current_ghn_ward_code` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `proposed_address_line` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `proposed_ward` varchar(160) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `proposed_district` varchar(160) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `proposed_city` varchar(160) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `proposed_ghn_province_id` int unsigned DEFAULT NULL,
  `proposed_ghn_district_id` int unsigned DEFAULT NULL,
  `proposed_ghn_ward_code` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` enum('pending','approved','rejected','cancelled') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending',
  `reviewed_by_admin_id` bigint unsigned DEFAULT NULL,
  `reviewed_at` datetime DEFAULT NULL,
  `rejection_reason` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `pending_restaurant_id` bigint unsigned GENERATED ALWAYS AS ((case when (`status` = _utf8mb4'pending') then `restaurant_id` else NULL end)) STORED,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_racr_one_pending` (`pending_restaurant_id`),
  KEY `idx_racr_restaurant_status` (`restaurant_id`,`status`),
  KEY `idx_racr_status_created` (`status`,`created_at`),
  KEY `fk_racr_requester` (`requested_by_user_id`),
  KEY `fk_racr_reviewer` (`reviewed_by_admin_id`),
  CONSTRAINT `fk_racr_requester` FOREIGN KEY (`requested_by_user_id`) REFERENCES `users` (`id`),
  CONSTRAINT `fk_racr_restaurant` FOREIGN KEY (`restaurant_id`) REFERENCES `restaurants` (`id`),
  CONSTRAINT `fk_racr_reviewer` FOREIGN KEY (`reviewed_by_admin_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `restaurants`;
CREATE TABLE `restaurants` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `owner_user_id` bigint unsigned NOT NULL,
  `cuisine_id` smallint unsigned DEFAULT NULL,
  `name` varchar(160) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `slug` varchar(180) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `tagline` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `phone` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `banner_url` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `logo_url` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `business_license_url` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `food_safety_cert_url` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `address_line` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `ward` varchar(120) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `district` varchar(120) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `city` varchar(120) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `ghn_province_id` int unsigned DEFAULT NULL,
  `ghn_district_id` int unsigned DEFAULT NULL,
  `ghn_ward_code` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `latitude` decimal(10,7) DEFAULT NULL,
  `longitude` decimal(10,7) DEFAULT NULL,
  `base_delivery_fee` bigint unsigned NOT NULL DEFAULT '0',
  `min_order_amount` bigint unsigned NOT NULL DEFAULT '0',
  `avg_prep_time_min` smallint unsigned NOT NULL DEFAULT '20',
  `rating_avg` decimal(3,2) NOT NULL DEFAULT '0.00',
  `review_count` int unsigned NOT NULL DEFAULT '0',
  `commission_rate` decimal(5,2) NOT NULL DEFAULT '15.00',
  `is_open_now` tinyint(1) NOT NULL DEFAULT '1',
  `status` enum('pending','active','suspended','closed') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending',
  `approved_at` datetime DEFAULT NULL,
  `approved_by_admin_id` bigint unsigned DEFAULT NULL,
  `rejection_reason` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `bank_account_no` varchar(40) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `bank_name` varchar(120) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `bank_account_holder` varchar(120) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `slug` (`slug`),
  KEY `idx_rest_owner` (`owner_user_id`),
  KEY `idx_rest_status` (`status`),
  KEY `idx_rest_city` (`city`),
  KEY `fk_rest_cuisine` (`cuisine_id`),
  KEY `fk_rest_approver` (`approved_by_admin_id`),
  KEY `idx_restaurants_ghn_route` (`ghn_district_id`,`ghn_ward_code`),
  CONSTRAINT `fk_rest_approver` FOREIGN KEY (`approved_by_admin_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_rest_cuisine` FOREIGN KEY (`cuisine_id`) REFERENCES `cuisines` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_rest_owner` FOREIGN KEY (`owner_user_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB AUTO_INCREMENT=126 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
INSERT INTO `restaurants` (`id`, `owner_user_id`, `cuisine_id`, `name`, `slug`, `tagline`, `description`, `phone`, `banner_url`, `logo_url`, `business_license_url`, `food_safety_cert_url`, `address_line`, `ward`, `district`, `city`, `ghn_province_id`, `ghn_district_id`, `ghn_ward_code`, `latitude`, `longitude`, `base_delivery_fee`, `min_order_amount`, `avg_prep_time_min`, `rating_avg`, `review_count`, `commission_rate`, `is_open_now`, `status`, `approved_at`, `approved_by_admin_id`, `rejection_reason`, `bank_account_no`, `bank_name`, `bank_account_holder`, `created_at`, `updated_at`) VALUES
(1, 7, 1, 'Pizza Bếp Gạch', 'pizza-bep-gach', 'Món ngon được chuẩn bị mỗi ngày tại Cần Thơ.', 'Không gian thân thiện, nguyên liệu chọn lọc và quy trình chuẩn bị rõ ràng tại Pizza Bếp Gạch.', '+84292370001', 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=1400&q=80', 'https://api.dicebear.com/9.x/shapes/svg?seed=Cinque&backgroundColor=171717&shape1Color=ffffff&shape2Color=cfe7ff&shape3Color=a8c8e8', NULL, NULL, '88 Nguyễn Văn Linh', 'Phường Tân An', 'Quận Ninh Kiều', 'TP. Cần Thơ', NULL, NULL, NULL, '10.0210000', '105.7610000', 62000, 80000, 25, '4.60', 5, '15.00', 1, 'active', '2026-05-21 21:42:10.000', 1, NULL, NULL, NULL, 'NGUYỄN THANH PHONG', '2026-05-21 21:42:10.000', '2026-08-31 18:38:29.000'),
(2, 8, 2, 'Burger Bến Ninh Kiều', 'burger-ben-ninh-kieu', 'Món ngon được chuẩn bị mỗi ngày tại Cần Thơ.', 'Không gian thân thiện, nguyên liệu chọn lọc và quy trình chuẩn bị rõ ràng tại Burger Bến Ninh Kiều.', '+84292370002', 'https://images.unsplash.com/photo-1551782450-a2132b4ba21d?auto=format&fit=crop&w=1400&q=80', 'https://api.dicebear.com/9.x/shapes/svg?seed=Junebug&backgroundColor=171717&shape1Color=ffffff&shape2Color=cfe7ff&shape3Color=a8c8e8', NULL, NULL, '32 Hai Bà Trưng', 'Phường Cái Khế', 'Quận Ninh Kiều', 'TP. Cần Thơ', NULL, NULL, NULL, '10.0220000', '105.7620000', 50000, 60000, 20, '5.00', 1, '15.00', 1, 'active', '2026-05-21 21:42:10.000', 1, NULL, NULL, NULL, 'TRẦN QUỐC HUY', '2026-05-21 21:42:10.000', '2026-08-31 18:38:29.000'),
(3, 9, 3, 'Sushi Sông Hậu', 'sushi-song-hau', 'Món ngon được chuẩn bị mỗi ngày tại Cần Thơ.', 'Không gian thân thiện, nguyên liệu chọn lọc và quy trình chuẩn bị rõ ràng tại Sushi Sông Hậu.', '+84292370003', 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&w=1400&q=80', 'https://api.dicebear.com/9.x/shapes/svg?seed=Kaiseki&backgroundColor=171717&shape1Color=ffffff&shape2Color=cfe7ff&shape3Color=a8c8e8', NULL, NULL, '115 Trần Văn Khéo', 'Phường An Cư', 'Quận Ninh Kiều', 'TP. Cần Thơ', NULL, NULL, NULL, '10.0230000', '105.7630000', 100000, 200000, 35, '5.00', 1, '18.00', 1, 'active', '2026-05-21 21:42:10.000', 1, NULL, NULL, NULL, 'LÊ MINH KHANG', '2026-05-21 21:42:10.000', '2026-08-31 18:38:29.000'),
(4, 10, 4, 'Bếp Xanh An Bình', 'bep-xanh-an-binh', 'Món ngon được chuẩn bị mỗi ngày tại Cần Thơ.', 'Không gian thân thiện, nguyên liệu chọn lọc và quy trình chuẩn bị rõ ràng tại Bếp Xanh An Bình.', '+84292370004', 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=1400&q=80', 'https://api.dicebear.com/9.x/shapes/svg?seed=Verdant&backgroundColor=171717&shape1Color=ffffff&shape2Color=cfe7ff&shape3Color=a8c8e8', NULL, NULL, '21 Nguyễn Văn Cừ', 'Phường Xuân Khánh', 'Quận Ninh Kiều', 'TP. Cần Thơ', NULL, NULL, NULL, '10.0240000', '105.7640000', 50000, 60000, 18, '0.00', 0, '15.00', 0, 'pending', NULL, NULL, NULL, NULL, NULL, 'PHẠM THU HÀ', '2026-05-21 21:42:10.000', '2026-08-31 18:38:29.000'),
(5, 11, 3, 'Ramen Hẻm Nhỏ', 'ramen-hem-nho', 'Món ngon được chuẩn bị mỗi ngày tại Cần Thơ.', 'Không gian thân thiện, nguyên liệu chọn lọc và quy trình chuẩn bị rõ ràng tại Ramen Hẻm Nhỏ.', '+84292370005', 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=1400&q=80', 'https://api.dicebear.com/9.x/shapes/svg?seed=Hachi&backgroundColor=171717&shape1Color=ffffff&shape2Color=cfe7ff&shape3Color=a8c8e8', NULL, NULL, '67 Mậu Thân', 'Phường Hưng Lợi', 'Quận Ninh Kiều', 'TP. Cần Thơ', NULL, NULL, NULL, '10.0250000', '105.7650000', 62000, 80000, 22, '4.00', 1, '15.00', 1, 'active', '2026-05-21 21:42:10.000', 1, NULL, NULL, NULL, 'VÕ THÀNH ĐẠT', '2026-05-21 21:42:10.000', '2026-08-31 18:38:29.000'),
(6, 12, 5, 'Taco Cái Khế', 'taco-cai-khe', 'Món ngon được chuẩn bị mỗi ngày tại Cần Thơ.', 'Không gian thân thiện, nguyên liệu chọn lọc và quy trình chuẩn bị rõ ràng tại Taco Cái Khế.', '+84292370006', 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?auto=format&fit=crop&w=1400&q=80', 'https://api.dicebear.com/9.x/shapes/svg?seed=LaCarreta&backgroundColor=171717&shape1Color=ffffff&shape2Color=cfe7ff&shape3Color=a8c8e8', NULL, NULL, '40 Trần Hoàng Na', 'Phường An Hòa', 'Quận Ninh Kiều', 'TP. Cần Thơ', NULL, NULL, NULL, '10.0260000', '105.7660000', 37000, 50000, 20, '0.00', 0, '16.00', 0, 'suspended', '2026-05-21 21:42:10.000', 1, NULL, NULL, NULL, 'ĐẶNG KIM NGÂN', '2026-05-21 21:42:10.000', '2026-08-31 18:38:29.000'),
(7, 13, 6, 'Cà Phê Bờ Hồ', 'ca-phe-bo-ho', 'Món ngon được chuẩn bị mỗi ngày tại Cần Thơ.', 'Không gian thân thiện, nguyên liệu chọn lọc và quy trình chuẩn bị rõ ràng tại Cà Phê Bờ Hồ.', '+84292370007', 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=1400&q=80', 'https://api.dicebear.com/9.x/shapes/svg?seed=Buena&backgroundColor=171717&shape1Color=ffffff&shape2Color=cfe7ff&shape3Color=a8c8e8', NULL, NULL, '93 đường 30 Tháng 4', 'Phường Tân An', 'Quận Ninh Kiều', 'TP. Cần Thơ', NULL, NULL, NULL, '10.0270000', '105.7670000', 37000, 40000, 15, '5.00', 1, '12.00', 1, 'active', '2026-05-21 21:42:10.000', 1, NULL, NULL, NULL, 'BÙI ANH TUẤN', '2026-05-21 21:42:10.000', '2026-08-31 18:38:29.000'),
(8, 14, 7, 'Tiệm Bánh Mây', 'tiem-banh-may', 'Món ngon được chuẩn bị mỗi ngày tại Cần Thơ.', 'Không gian thân thiện, nguyên liệu chọn lọc và quy trình chuẩn bị rõ ràng tại Tiệm Bánh Mây.', '+84292370008', 'https://images.unsplash.com/photo-1551024601-bec78aea704b?auto=format&fit=crop&w=1400&q=80', 'https://api.dicebear.com/9.x/shapes/svg?seed=Dough&backgroundColor=171717&shape1Color=ffffff&shape2Color=cfe7ff&shape3Color=a8c8e8', NULL, NULL, '15 Lý Tự Trọng', 'Phường Cái Khế', 'Quận Ninh Kiều', 'TP. Cần Thơ', NULL, NULL, NULL, '10.0280000', '105.7680000', 37000, 40000, 15, '0.00', 0, '12.00', 0, 'closed', '2026-05-21 21:42:10.000', 1, NULL, NULL, NULL, 'HỒ NGỌC TRÂM', '2026-05-21 21:42:10.000', '2026-08-31 18:38:29.000'),
(108, 121, 100, 'Bếp Sông Quê', 'bep-song-que', 'Món ngon được chuẩn bị mỗi ngày tại Cần Thơ.', 'Không gian thân thiện, nguyên liệu chọn lọc và quy trình chuẩn bị rõ ràng tại Bếp Sông Quê.', '+84292370108', 'https://images.unsplash.com/photo-1559314809-0d155014e29e?auto=format&fit=crop&w=1400&q=80', 'https://api.dicebear.com/9.x/shapes/svg?seed=BepSongQue&backgroundColor=ffffff', NULL, NULL, '126 Võ Văn Kiệt', 'Phường An Hòa', 'Quận Ninh Kiều', 'TP. Cần Thơ', NULL, NULL, NULL, '10.0280000', '105.7680000', 0, 30000, 18, '5.00', 1, '15.00', 1, 'active', '2026-08-12 22:54:00.000', 1, NULL, NULL, NULL, 'NGUYỄN VĂN SANG', '2026-08-12 22:54:00.000', '2026-08-31 18:38:29.000'),
(109, 122, 6, 'Cà Phê Bờ Kênh', 'ca-phe-bo-kenh', 'Món ngon được chuẩn bị mỗi ngày tại Cần Thơ.', 'Không gian thân thiện, nguyên liệu chọn lọc và quy trình chuẩn bị rõ ràng tại Cà Phê Bờ Kênh.', '+84292370109', 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=1400&q=80', 'https://api.dicebear.com/9.x/shapes/svg?seed=CaPheBoKenh&backgroundColor=ffffff', NULL, NULL, '52 Nguyễn Việt Hồng', 'Phường Tân An', 'Quận Ninh Kiều', 'TP. Cần Thơ', NULL, NULL, NULL, '10.0290000', '105.7690000', 0, 25000, 10, '4.00', 1, '12.00', 1, 'active', '2026-08-12 22:54:00.000', 1, NULL, NULL, NULL, 'TRẦN THỊ THU', '2026-08-12 22:54:00.000', '2026-08-31 18:38:29.000'),
(110, 123, 100, 'Ăn Vặt Chợ Chiều', 'an-vat-cho-chieu', 'Món ngon được chuẩn bị mỗi ngày tại Cần Thơ.', 'Không gian thân thiện, nguyên liệu chọn lọc và quy trình chuẩn bị rõ ràng tại Ăn Vặt Chợ Chiều.', '+84292370110', 'https://images.unsplash.com/photo-1626804475297-41608ea09aeb?auto=format&fit=crop&w=1400&q=80', 'https://api.dicebear.com/9.x/shapes/svg?seed=AnVatChoChieu&backgroundColor=ffffff', NULL, NULL, '18 Đề Thám', 'Phường Cái Khế', 'Quận Ninh Kiều', 'TP. Cần Thơ', NULL, NULL, NULL, '10.0300000', '105.7700000', 0, 20000, 12, '5.00', 1, '12.00', 1, 'active', '2026-08-12 22:54:00.000', 1, NULL, NULL, NULL, 'LÊ QUỐC VIỆT', '2026-08-12 22:54:00.000', '2026-08-31 18:38:29.000'),
(115, 132, 100, 'Bún Cá Hưng Phú', 'bun-ca-hung-phu', 'Món ngon được chuẩn bị mỗi ngày tại Cần Thơ.', 'Không gian thân thiện, nguyên liệu chọn lọc và quy trình chuẩn bị rõ ràng tại Bún Cá Hưng Phú.', '+84292370115', 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=1400&q=80', 'https://api.dicebear.com/9.x/shapes/svg?seed=BunCaHungPhu&backgroundColor=ffffff', NULL, NULL, '205 Nguyễn Văn Linh', 'Phường Tân An', 'Quận Ninh Kiều', 'TP. Cần Thơ', NULL, NULL, NULL, '10.0350000', '105.7750000', 0, 30000, 16, '5.00', 1, '15.00', 1, 'active', '2026-08-13 00:47:38.000', 1, NULL, NULL, NULL, 'PHẠM MINH TÂM', '2026-08-13 00:47:38.000', '2026-08-31 18:38:29.000'),
(116, 133, 100, 'Cơm Gà Trương Vĩnh Nguyên', 'com-ga-truong-vinh-nguyen', 'Món ngon được chuẩn bị mỗi ngày tại Cần Thơ.', 'Không gian thân thiện, nguyên liệu chọn lọc và quy trình chuẩn bị rõ ràng tại Cơm Gà Trương Vĩnh Nguyên.', '+84292370116', 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?auto=format&fit=crop&w=1400&q=80', 'https://api.dicebear.com/9.x/shapes/svg?seed=ComGaTruongVinhNguyen&backgroundColor=ffffff', NULL, NULL, '74 Trương Định', 'Phường Cái Khế', 'Quận Ninh Kiều', 'TP. Cần Thơ', NULL, NULL, NULL, '10.0360000', '105.7760000', 0, 35000, 18, '4.00', 1, '15.00', 1, 'active', '2026-08-13 00:47:38.000', 1, NULL, NULL, NULL, 'VÕ THANH BÌNH', '2026-08-13 00:47:38.000', '2026-08-31 18:38:29.000'),
(117, 134, 6, 'Tiệm Trà Hưng Phú', 'tiem-tra-hung-phu', 'Món ngon được chuẩn bị mỗi ngày tại Cần Thơ.', 'Không gian thân thiện, nguyên liệu chọn lọc và quy trình chuẩn bị rõ ràng tại Tiệm Trà Hưng Phú.', '+84292370117', 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?auto=format&fit=crop&w=1400&q=80', 'https://api.dicebear.com/9.x/shapes/svg?seed=TiemTraHungPhu&backgroundColor=ffffff', NULL, NULL, '39 Trần Văn Hoài', 'Phường An Cư', 'Quận Ninh Kiều', 'TP. Cần Thơ', NULL, NULL, NULL, '10.0370000', '105.7770000', 0, 25000, 8, '5.00', 1, '12.00', 1, 'active', '2026-08-13 00:47:38.000', 1, NULL, NULL, NULL, 'ĐẶNG NGỌC LAN', '2026-08-13 00:47:38.000', '2026-08-31 18:38:29.000');

DROP TABLE IF EXISTS `reviews`;
CREATE TABLE `reviews` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `order_id` bigint unsigned NOT NULL,
  `customer_id` bigint unsigned NOT NULL,
  `restaurant_id` bigint unsigned NOT NULL,
  `rating` tinyint unsigned NOT NULL,
  `comment` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `is_hidden` tinyint(1) NOT NULL DEFAULT '0',
  `reply_text` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `reply_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `menu_item_id` bigint unsigned DEFAULT NULL,
  `is_edited` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_order_item` (`customer_id`,`order_id`,`menu_item_id`),
  UNIQUE KEY `uq_reviews_order_item` (`order_id`,`menu_item_id`),
  KEY `idx_rev_rest` (`restaurant_id`),
  KEY `idx_rev_cust` (`customer_id`),
  KEY `idx_reviews_order` (`order_id`),
  KEY `idx_reviews_menu_visible_created` (`menu_item_id`,`is_hidden`,`created_at`),
  KEY `idx_reviews_rest_visible_created` (`restaurant_id`,`menu_item_id`,`is_hidden`,`created_at`),
  CONSTRAINT `fk_rev_cust` FOREIGN KEY (`customer_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_rev_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_rev_rest` FOREIGN KEY (`restaurant_id`) REFERENCES `restaurants` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_reviews_menu_item` FOREIGN KEY (`menu_item_id`) REFERENCES `menu_items` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=6025 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
INSERT INTO `reviews` (`id`, `order_id`, `customer_id`, `restaurant_id`, `rating`, `comment`, `is_hidden`, `reply_text`, `reply_at`, `created_at`, `updated_at`, `menu_item_id`, `is_edited`) VALUES
(1, 9, 20, 1, 5, 'Đế bánh được nướng cháy cạnh hoàn hảo. Salsiccia là chiếc pizza ngon nhất tôi từng ăn trong năm nay.', 0, 'Cảm ơn bạn rất nhiều — hẹn gặp lại nhé!', '2026-08-19 12:15:00.000', '2026-08-18 13:15:00.000', '2026-08-18 13:15:00.000', NULL, 0),
(2, 10, 21, 1, 4, 'Giao hàng hơi chậm một chút nhưng đồ ăn đã bù đắp lại tất cả.', 0, NULL, NULL, '2026-08-20 13:40:00.000', '2026-08-20 13:40:00.000', NULL, 0),
(3, 11, 22, 1, 5, 'Salad Burrata thật tuyệt vời. Sẽ đặt lại vào tuần tới.', 0, 'Cảm ơn bạn! Sẽ chuẩn bị thêm burrata tươi cho lần sau.', '2026-08-23 19:05:00.000', '2026-08-22 20:05:00.000', '2026-08-22 20:05:00.000', NULL, 0),
(6001, 2001, 2, 2, 5, 'Đóng gói cẩn thận, món đến vẫn còn nóng.', 0, NULL, NULL, '2026-08-24 13:05:00.000', '2026-08-24 13:05:00.000', NULL, 0),
(6002, 2001, 2, 2, 5, 'Burger đậm vị và phần ăn vừa đủ.', 0, NULL, NULL, '2026-08-24 13:05:00.000', '2026-08-24 13:05:00.000', 6, 0),
(6003, 2002, 15, 3, 5, 'Nguyên liệu tươi, trình bày đẹp.', 0, NULL, NULL, '2026-08-25 19:35:00.000', '2026-08-25 19:35:00.000', NULL, 0),
(6004, 2002, 15, 3, 5, 'Cá tươi và cơm nắm vừa miệng.', 0, NULL, NULL, '2026-08-25 19:35:00.000', '2026-08-25 19:35:00.000', 11, 0),
(6005, 2003, 16, 5, 4, 'Quán chuẩn bị nhanh, đóng gói chắc chắn.', 0, NULL, NULL, '2026-08-26 12:35:00.000', '2026-08-26 12:35:00.000', NULL, 0),
(6006, 2003, 16, 5, 5, 'Nước dùng thơm và béo vừa phải.', 0, NULL, NULL, '2026-08-26 12:35:00.000', '2026-08-26 12:35:00.000', 18, 0),
(6007, 2004, 17, 7, 5, 'Cà phê ngon, giao đúng giờ.', 0, NULL, NULL, '2026-08-27 09:35:00.000', '2026-08-27 09:35:00.000', NULL, 0),
(6008, 2004, 17, 7, 4, 'Vị cà phê cân bằng, sữa mịn.', 0, NULL, NULL, '2026-08-27 09:35:00.000', '2026-08-27 09:35:00.000', 25, 0),
(6009, 2005, 18, 108, 5, 'Món nhà làm dễ ăn, khẩu phần hợp lý.', 0, NULL, NULL, '2026-08-28 12:35:00.000', '2026-08-28 12:35:00.000', NULL, 0),
(6010, 2005, 18, 108, 5, 'Sườn mềm và ướp rất vừa vị.', 0, NULL, NULL, '2026-08-28 12:35:00.000', '2026-08-28 12:35:00.000', 100, 0),
(6011, 2006, 19, 109, 4, 'Quán phục vụ nhanh và thân thiện.', 0, NULL, NULL, '2026-08-28 19:35:00.000', '2026-08-28 19:35:00.000', NULL, 0),
(6012, 2006, 19, 109, 4, 'Cà phê thơm, đúng yêu cầu ít đá.', 0, NULL, NULL, '2026-08-28 19:35:00.000', '2026-08-28 19:35:00.000', 104, 0),
(6013, 2007, 20, 110, 5, 'Đồ ăn vặt đa dạng, đóng gói sạch.', 0, NULL, NULL, '2026-08-29 11:35:00.000', '2026-08-29 11:35:00.000', NULL, 0),
(6014, 2007, 20, 110, 5, 'Bánh tráng trộn đậm đà nhưng không quá cay.', 0, NULL, NULL, '2026-08-29 11:35:00.000', '2026-08-29 11:35:00.000', 108, 0),
(6015, 2008, 21, 115, 5, 'Nước dùng trong và quán chuẩn bị rất nhanh.', 0, NULL, NULL, '2026-08-29 20:35:00.000', '2026-08-29 20:35:00.000', NULL, 0),
(6016, 2008, 21, 115, 5, 'Bún cá nhiều topping, cá không tanh.', 0, NULL, NULL, '2026-08-29 20:35:00.000', '2026-08-29 20:35:00.000', 115, 0),
(6017, 2009, 22, 116, 4, 'Cơm ngon, phần ăn đầy đặn.', 0, NULL, NULL, '2026-08-30 12:35:00.000', '2026-08-30 12:35:00.000', NULL, 0),
(6018, 2009, 22, 116, 5, 'Da gà giòn, thịt vẫn mềm.', 0, NULL, NULL, '2026-08-30 12:35:00.000', '2026-08-30 12:35:00.000', 119, 0),
(6019, 2010, 2, 117, 5, 'Đồ uống đóng gói đẹp và không bị đổ.', 0, NULL, NULL, '2026-08-30 19:35:00.000', '2026-08-30 19:35:00.000', NULL, 0),
(6020, 2010, 2, 117, 4, 'Trà thơm, mức đường đúng yêu cầu.', 0, NULL, NULL, '2026-08-30 19:35:00.000', '2026-08-30 19:35:00.000', 123, 0),
(6021, 2015, 18, 1, 5, 'Pizza nóng, đế giòn và giao rất đúng giờ.', 0, NULL, NULL, '2026-08-31 13:35:00.000', '2026-08-31 13:35:00.000', NULL, 0),
(6022, 2015, 18, 1, 5, 'Margherita thơm mùi húng quế, phô mai vừa đủ.', 0, NULL, NULL, '2026-08-31 13:35:00.000', '2026-08-31 13:35:00.000', 1, 0),
(6023, 2016, 19, 1, 4, 'Quán đóng gói đẹp và món ăn đúng mô tả.', 0, NULL, NULL, '2026-09-01 13:35:00.000', '2026-09-01 13:35:00.000', NULL, 0),
(6024, 2016, 19, 1, 5, 'Xúc xích đậm vị, phần bánh đủ cho một người.', 0, NULL, NULL, '2026-09-01 13:35:00.000', '2026-09-01 13:35:00.000', 3, 0);

DROP TABLE IF EXISTS `uploaded_assets`;
CREATE TABLE `uploaded_assets` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `owner_user_id` bigint unsigned NOT NULL,
  `public_id` varchar(255) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  `secure_url` varchar(1000) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `folder` varchar(40) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_uploaded_assets_public_id` (`public_id`),
  KEY `idx_uploaded_assets_owner` (`owner_user_id`,`deleted_at`),
  CONSTRAINT `fk_uploaded_assets_owner` FOREIGN KEY (`owner_user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `user_roles`;
CREATE TABLE `user_roles` (
  `user_id` bigint unsigned NOT NULL,
  `role` enum('customer','merchant','driver','admin') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `granted_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`user_id`,`role`),
  CONSTRAINT `fk_user_roles_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
INSERT INTO `user_roles` (`user_id`, `role`, `granted_at`) VALUES
(1, 'admin', '2026-05-21 21:42:10.000'),
(2, 'customer', '2026-05-21 21:42:10.000'),
(3, 'customer', '2026-05-21 21:42:10.000'),
(4, 'customer', '2026-05-21 21:42:10.000'),
(5, 'customer', '2026-08-01 08:00:00.000'),
(6, 'customer', '2026-05-21 21:42:10.000'),
(7, 'customer', '2026-05-21 21:42:10.000'),
(7, 'merchant', '2026-05-21 21:42:10.000'),
(8, 'customer', '2026-05-21 21:42:10.000'),
(8, 'merchant', '2026-05-21 21:42:10.000'),
(9, 'merchant', '2026-05-21 21:42:10.000'),
(10, 'merchant', '2026-05-21 21:42:10.000'),
(11, 'merchant', '2026-05-21 21:42:10.000'),
(12, 'merchant', '2026-05-21 21:42:10.000'),
(13, 'merchant', '2026-05-21 21:42:10.000'),
(14, 'merchant', '2026-05-21 21:42:10.000'),
(15, 'customer', '2026-05-21 21:42:10.000'),
(16, 'customer', '2026-05-21 21:42:10.000'),
(17, 'customer', '2026-05-21 21:42:10.000'),
(18, 'customer', '2026-05-21 21:42:10.000'),
(19, 'customer', '2026-05-21 21:42:10.000'),
(20, 'customer', '2026-05-21 21:42:10.000'),
(21, 'customer', '2026-05-21 21:42:10.000'),
(22, 'customer', '2026-05-21 21:42:10.000'),
(100, 'customer', '2026-05-21 21:55:26.000'),
(102, 'admin', '2026-05-21 22:31:26.000'),
(103, 'customer', '2026-05-22 20:41:26.000'),
(108, 'customer', '2026-08-12 21:13:53.000'),
(121, 'merchant', '2026-08-12 22:54:00.000'),
(122, 'merchant', '2026-08-12 22:54:00.000'),
(123, 'merchant', '2026-08-12 22:54:00.000'),
(132, 'merchant', '2026-08-13 00:47:38.000'),
(133, 'merchant', '2026-08-13 00:47:38.000'),
(134, 'merchant', '2026-08-13 00:47:38.000');

DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `email` varchar(160) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `phone` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `password_hash` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `full_name` varchar(120) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `avatar_url` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `primary_role` enum('customer','merchant','driver','admin') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'customer',
  `status` enum('pending','active','suspended','banned') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'active',
  `email_verified_at` datetime DEFAULT NULL,
  `phone_verified_at` datetime DEFAULT NULL,
  `last_login_at` datetime DEFAULT NULL,
  `token_version` int unsigned NOT NULL DEFAULT '0',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `suspension_expires_at` datetime DEFAULT NULL,
  `suspension_reason` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`),
  UNIQUE KEY `phone` (`phone`),
  KEY `idx_users_role` (`primary_role`),
  KEY `idx_users_status` (`status`)
) ENGINE=InnoDB AUTO_INCREMENT=154 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
INSERT INTO `users` (`id`, `email`, `phone`, `password_hash`, `full_name`, `avatar_url`, `primary_role`, `status`, `email_verified_at`, `phone_verified_at`, `last_login_at`, `token_version`, `created_at`, `updated_at`, `suspension_expires_at`, `suspension_reason`) VALUES
(1, 'admin@nomnom.local', '+84901000001', '$2b$10$CJ7Jw5i.tGECVqMW/dpzreHp4n.oQPZzbZI9LY9N6uZPNG4vrIfEO', 'Quản trị viên NomNom', 'https://api.dicebear.com/9.x/avataaars/svg?seed=Quản%20trị%20viên%20NomNom&radius=50', 'admin', 'active', '2026-05-21 21:42:10.000', '2026-05-21 21:42:10.000', '2026-09-01 18:00:00.000', 1, '2026-05-21 21:42:10.000', '2026-08-31 18:38:29.000', NULL, NULL),
(2, 'khachhang@nomnom.local', '+84901000002', '$2b$10$CJ7Jw5i.tGECVqMW/dpzreHp4n.oQPZzbZI9LY9N6uZPNG4vrIfEO', 'Nguyễn Minh Anh', 'https://api.dicebear.com/9.x/avataaars/svg?seed=Nguyễn%20Minh%20Anh&radius=50', 'customer', 'active', '2026-05-21 21:42:10.000', '2026-05-21 21:42:10.000', '2026-09-01 18:00:00.000', 1, '2026-05-21 21:42:10.000', '2026-08-31 18:38:29.000', NULL, NULL),
(3, 'giahan@nomnom.local', '+84901000003', '$2b$10$3V8rUS3qgDfkMXpCOifG4.R/XmYcV36la/0mMZHHrHAPeOdYVtvEm', 'Trần Gia Hân', 'https://api.dicebear.com/9.x/avataaars/svg?seed=Trần%20Gia%20Hân&radius=50', 'customer', 'active', '2026-05-21 21:42:10.000', '2026-05-21 21:42:10.000', NULL, 1, '2026-05-21 21:42:10.000', '2026-08-31 18:38:29.000', NULL, NULL),
(4, 'quocbao@nomnom.local', '+84901000004', '$2b$10$3V8rUS3qgDfkMXpCOifG4.R/XmYcV36la/0mMZHHrHAPeOdYVtvEm', 'Lê Quốc Bảo', 'https://api.dicebear.com/9.x/avataaars/svg?seed=Lê%20Quốc%20Bảo&radius=50', 'customer', 'active', '2026-05-21 21:42:10.000', '2026-05-21 21:42:10.000', NULL, 1, '2026-05-21 21:42:10.000', '2026-08-31 18:38:29.000', NULL, NULL),
(5, 'ngocmai@nomnom.local', '+84901000005', '$2b$10$3V8rUS3qgDfkMXpCOifG4.R/XmYcV36la/0mMZHHrHAPeOdYVtvEm', 'Phạm Ngọc Mai', 'https://api.dicebear.com/9.x/avataaars/svg?seed=Phạm%20Ngọc%20Mai&radius=50', 'customer', 'active', NULL, NULL, NULL, 1, '2026-05-21 21:42:10.000', '2026-08-31 18:38:29.000', NULL, NULL),
(6, 'hoangnam@nomnom.local', '+84901000006', '$2b$10$3V8rUS3qgDfkMXpCOifG4.R/XmYcV36la/0mMZHHrHAPeOdYVtvEm', 'Võ Hoàng Nam', 'https://api.dicebear.com/9.x/avataaars/svg?seed=Võ%20Hoàng%20Nam&radius=50', 'customer', 'active', '2026-05-21 21:42:10.000', '2026-05-21 21:42:10.000', NULL, 1, '2026-05-21 21:42:10.000', '2026-08-31 18:38:29.000', NULL, NULL),
(7, 'nhahang@nomnom.local', '+84901000007', '$2b$10$CJ7Jw5i.tGECVqMW/dpzreHp4n.oQPZzbZI9LY9N6uZPNG4vrIfEO', 'Nguyễn Thanh Phong', 'https://api.dicebear.com/9.x/avataaars/svg?seed=Nguyễn%20Thanh%20Phong&radius=50', 'merchant', 'active', '2026-05-21 21:42:10.000', '2026-05-21 21:42:10.000', '2026-09-01 18:00:00.000', 1, '2026-05-21 21:42:10.000', '2026-08-31 18:38:29.000', NULL, NULL),
(8, 'merchant.burger@nomnom.local', '+84901000008', '$2b$10$3V8rUS3qgDfkMXpCOifG4.R/XmYcV36la/0mMZHHrHAPeOdYVtvEm', 'Trần Quốc Huy', 'https://api.dicebear.com/9.x/avataaars/svg?seed=Trần%20Quốc%20Huy&radius=50', 'merchant', 'active', '2026-05-21 21:42:10.000', '2026-05-21 21:42:10.000', NULL, 1, '2026-05-21 21:42:10.000', '2026-08-31 18:38:29.000', NULL, NULL),
(9, 'merchant.sushi@nomnom.local', '+84901000009', '$2b$10$3V8rUS3qgDfkMXpCOifG4.R/XmYcV36la/0mMZHHrHAPeOdYVtvEm', 'Lê Minh Khang', 'https://api.dicebear.com/9.x/avataaars/svg?seed=Lê%20Minh%20Khang&radius=50', 'merchant', 'active', '2026-05-21 21:42:10.000', '2026-05-21 21:42:10.000', NULL, 1, '2026-05-21 21:42:10.000', '2026-08-31 18:38:29.000', NULL, NULL),
(10, 'merchant.bepxanh@nomnom.local', '+84901000010', '$2b$10$3V8rUS3qgDfkMXpCOifG4.R/XmYcV36la/0mMZHHrHAPeOdYVtvEm', 'Phạm Thu Hà', 'https://api.dicebear.com/9.x/avataaars/svg?seed=Phạm%20Thu%20Hà&radius=50', 'merchant', 'pending', NULL, NULL, NULL, 1, '2026-05-21 21:42:10.000', '2026-08-31 18:38:29.000', NULL, NULL),
(11, 'merchant.ramen@nomnom.local', '+84901000011', '$2b$10$3V8rUS3qgDfkMXpCOifG4.R/XmYcV36la/0mMZHHrHAPeOdYVtvEm', 'Võ Thành Đạt', 'https://api.dicebear.com/9.x/avataaars/svg?seed=Võ%20Thành%20Đạt&radius=50', 'merchant', 'active', '2026-05-21 21:42:10.000', '2026-05-21 21:42:10.000', NULL, 1, '2026-05-21 21:42:10.000', '2026-08-31 18:38:29.000', NULL, NULL),
(12, 'merchant.taco@nomnom.local', '+84901000012', '$2b$10$3V8rUS3qgDfkMXpCOifG4.R/XmYcV36la/0mMZHHrHAPeOdYVtvEm', 'Đặng Kim Ngân', 'https://api.dicebear.com/9.x/avataaars/svg?seed=Đặng%20Kim%20Ngân&radius=50', 'merchant', 'suspended', '2026-05-21 21:42:10.000', '2026-05-21 21:42:10.000', NULL, 1, '2026-05-21 21:42:10.000', '2026-08-31 18:38:29.000', NULL, NULL),
(13, 'merchant.caphe@nomnom.local', '+84901000013', '$2b$10$3V8rUS3qgDfkMXpCOifG4.R/XmYcV36la/0mMZHHrHAPeOdYVtvEm', 'Bùi Anh Tuấn', 'https://api.dicebear.com/9.x/avataaars/svg?seed=Bùi%20Anh%20Tuấn&radius=50', 'merchant', 'active', '2026-05-21 21:42:10.000', '2026-05-21 21:42:10.000', NULL, 1, '2026-05-21 21:42:10.000', '2026-08-31 18:38:29.000', NULL, NULL),
(14, 'merchant.tiembanh@nomnom.local', '+84901000014', '$2b$10$3V8rUS3qgDfkMXpCOifG4.R/XmYcV36la/0mMZHHrHAPeOdYVtvEm', 'Hồ Ngọc Trâm', 'https://api.dicebear.com/9.x/avataaars/svg?seed=Hồ%20Ngọc%20Trâm&radius=50', 'merchant', 'active', '2026-05-21 21:42:10.000', '2026-05-21 21:42:10.000', NULL, 1, '2026-05-21 21:42:10.000', '2026-08-31 18:38:29.000', NULL, NULL),
(15, 'khanhlinh@nomnom.local', '+84901000015', '$2b$10$3V8rUS3qgDfkMXpCOifG4.R/XmYcV36la/0mMZHHrHAPeOdYVtvEm', 'Nguyễn Khánh Linh', 'https://api.dicebear.com/9.x/avataaars/svg?seed=Nguyễn%20Khánh%20Linh&radius=50', 'customer', 'active', '2026-05-21 21:42:10.000', '2026-05-21 21:42:10.000', NULL, 1, '2026-05-21 21:42:10.000', '2026-08-31 18:38:29.000', NULL, NULL),
(16, 'minhquan@nomnom.local', '+84901000016', '$2b$10$3V8rUS3qgDfkMXpCOifG4.R/XmYcV36la/0mMZHHrHAPeOdYVtvEm', 'Trần Minh Quân', 'https://api.dicebear.com/9.x/avataaars/svg?seed=Trần%20Minh%20Quân&radius=50', 'customer', 'active', '2026-05-21 21:42:10.000', '2026-05-21 21:42:10.000', NULL, 1, '2026-05-21 21:42:10.000', '2026-08-31 18:38:29.000', NULL, NULL),
(17, 'thaovy@nomnom.local', '+84901000017', '$2b$10$3V8rUS3qgDfkMXpCOifG4.R/XmYcV36la/0mMZHHrHAPeOdYVtvEm', 'Lê Thảo Vy', 'https://api.dicebear.com/9.x/avataaars/svg?seed=Lê%20Thảo%20Vy&radius=50', 'customer', 'active', '2026-05-21 21:42:10.000', '2026-05-21 21:42:10.000', NULL, 1, '2026-05-21 21:42:10.000', '2026-08-31 18:38:29.000', NULL, NULL),
(18, 'giabao@nomnom.local', '+84901000018', '$2b$10$3V8rUS3qgDfkMXpCOifG4.R/XmYcV36la/0mMZHHrHAPeOdYVtvEm', 'Phạm Gia Bảo', 'https://api.dicebear.com/9.x/avataaars/svg?seed=Phạm%20Gia%20Bảo&radius=50', 'customer', 'active', '2026-05-21 21:42:10.000', '2026-05-21 21:42:10.000', NULL, 1, '2026-05-21 21:42:10.000', '2026-08-31 18:38:29.000', NULL, NULL),
(19, 'ngochan@nomnom.local', '+84901000019', '$2b$10$3V8rUS3qgDfkMXpCOifG4.R/XmYcV36la/0mMZHHrHAPeOdYVtvEm', 'Võ Ngọc Hân', 'https://api.dicebear.com/9.x/avataaars/svg?seed=Võ%20Ngọc%20Hân&radius=50', 'customer', 'active', '2026-05-21 21:42:10.000', '2026-05-21 21:42:10.000', NULL, 1, '2026-05-21 21:42:10.000', '2026-08-31 18:38:29.000', NULL, NULL),
(20, 'anhkhoa@nomnom.local', '+84901000020', '$2b$10$3V8rUS3qgDfkMXpCOifG4.R/XmYcV36la/0mMZHHrHAPeOdYVtvEm', 'Đặng Anh Khoa', 'https://api.dicebear.com/9.x/avataaars/svg?seed=Đặng%20Anh%20Khoa&radius=50', 'customer', 'active', '2026-05-21 21:42:10.000', '2026-05-21 21:42:10.000', NULL, 1, '2026-05-21 21:42:10.000', '2026-08-31 18:38:29.000', NULL, NULL),
(21, 'thanhtruc@nomnom.local', '+84901000021', '$2b$10$3V8rUS3qgDfkMXpCOifG4.R/XmYcV36la/0mMZHHrHAPeOdYVtvEm', 'Bùi Thanh Trúc', 'https://api.dicebear.com/9.x/avataaars/svg?seed=Bùi%20Thanh%20Trúc&radius=50', 'customer', 'active', '2026-05-21 21:42:10.000', '2026-05-21 21:42:10.000', NULL, 1, '2026-05-21 21:42:10.000', '2026-08-31 18:38:29.000', NULL, NULL),
(22, 'minhnhat@nomnom.local', '+84901000022', '$2b$10$3V8rUS3qgDfkMXpCOifG4.R/XmYcV36la/0mMZHHrHAPeOdYVtvEm', 'Hồ Minh Nhật', 'https://api.dicebear.com/9.x/avataaars/svg?seed=Hồ%20Minh%20Nhật&radius=50', 'customer', 'active', '2026-05-21 21:42:10.000', '2026-05-21 21:42:10.000', NULL, 1, '2026-05-21 21:42:10.000', '2026-08-31 18:38:29.000', NULL, NULL),
(100, 'haiyen@nomnom.local', NULL, '$2b$10$3V8rUS3qgDfkMXpCOifG4.R/XmYcV36la/0mMZHHrHAPeOdYVtvEm', 'Nguyễn Hải Yến', 'https://api.dicebear.com/9.x/avataaars/svg?seed=Nguyễn%20Hải%20Yến&radius=50', 'customer', 'active', '2026-05-21 21:55:26.000', NULL, NULL, 1, '2026-05-21 21:55:26.000', '2026-08-31 18:38:29.000', NULL, NULL),
(102, 'vanhanh@nomnom.local', '+84901000102', '$2b$10$3V8rUS3qgDfkMXpCOifG4.R/XmYcV36la/0mMZHHrHAPeOdYVtvEm', 'Điều hành NomNom', 'https://api.dicebear.com/9.x/avataaars/svg?seed=Điều%20hành%20NomNom&radius=50', 'admin', 'active', '2026-05-21 22:31:26.000', NULL, NULL, 1, '2026-05-21 22:31:26.000', '2026-08-31 18:38:29.000', NULL, NULL),
(103, 'ducanh@nomnom.local', NULL, '$2b$10$3V8rUS3qgDfkMXpCOifG4.R/XmYcV36la/0mMZHHrHAPeOdYVtvEm', 'Trần Đức Anh', 'https://api.dicebear.com/9.x/avataaars/svg?seed=Trần%20Đức%20Anh&radius=50', 'customer', 'active', '2026-05-22 20:41:26.000', NULL, NULL, 1, '2026-05-22 20:41:26.000', '2026-08-31 18:38:29.000', NULL, NULL),
(108, 'ngocdiep@nomnom.local', NULL, '$2b$10$3V8rUS3qgDfkMXpCOifG4.R/XmYcV36la/0mMZHHrHAPeOdYVtvEm', 'Lê Ngọc Diệp', 'https://api.dicebear.com/9.x/avataaars/svg?seed=Lê%20Ngọc%20Diệp&radius=50', 'customer', 'active', '2026-08-12 21:13:53.000', NULL, NULL, 1, '2026-08-12 21:13:53.000', '2026-08-31 18:38:29.000', NULL, NULL),
(121, 'bep.songque@nomnom.local', '+84910990001', '$2b$10$3V8rUS3qgDfkMXpCOifG4.R/XmYcV36la/0mMZHHrHAPeOdYVtvEm', 'Nguyễn Văn Sang', 'https://api.dicebear.com/9.x/avataaars/svg?seed=Nguyễn%20Văn%20Sang&radius=50', 'merchant', 'active', '2026-08-12 22:54:00.000', NULL, NULL, 1, '2026-08-12 22:54:00.000', '2026-08-31 18:38:29.000', NULL, NULL),
(122, 'caphe.bokenh@nomnom.local', '+84910990002', '$2b$10$3V8rUS3qgDfkMXpCOifG4.R/XmYcV36la/0mMZHHrHAPeOdYVtvEm', 'Trần Thị Thu', 'https://api.dicebear.com/9.x/avataaars/svg?seed=Trần%20Thị%20Thu&radius=50', 'merchant', 'active', '2026-08-12 22:54:00.000', NULL, NULL, 1, '2026-08-12 22:54:00.000', '2026-08-31 18:38:29.000', NULL, NULL),
(123, 'anvat.chonoi@nomnom.local', '+84910990003', '$2b$10$3V8rUS3qgDfkMXpCOifG4.R/XmYcV36la/0mMZHHrHAPeOdYVtvEm', 'Lê Quốc Việt', 'https://api.dicebear.com/9.x/avataaars/svg?seed=Lê%20Quốc%20Việt&radius=50', 'merchant', 'active', '2026-08-12 22:54:00.000', NULL, NULL, 1, '2026-08-12 22:54:00.000', '2026-08-31 18:38:29.000', NULL, NULL),
(132, 'bunca.hungphu@nomnom.local', '+84910990101', '$2b$10$3V8rUS3qgDfkMXpCOifG4.R/XmYcV36la/0mMZHHrHAPeOdYVtvEm', 'Phạm Minh Tâm', 'https://api.dicebear.com/9.x/avataaars/svg?seed=Phạm%20Minh%20Tâm&radius=50', 'merchant', 'active', '2026-08-13 00:47:38.000', NULL, NULL, 1, '2026-08-13 00:47:38.000', '2026-08-31 18:38:29.000', NULL, NULL),
(133, 'comga.truongvinhnguyen@nomnom.local', '+84910990102', '$2b$10$3V8rUS3qgDfkMXpCOifG4.R/XmYcV36la/0mMZHHrHAPeOdYVtvEm', 'Võ Thanh Bình', 'https://api.dicebear.com/9.x/avataaars/svg?seed=Võ%20Thanh%20Bình&radius=50', 'merchant', 'active', '2026-08-13 00:47:38.000', NULL, NULL, 1, '2026-08-13 00:47:38.000', '2026-08-31 18:38:29.000', NULL, NULL),
(134, 'tiemtra.hungphu@nomnom.local', '+84910990103', '$2b$10$3V8rUS3qgDfkMXpCOifG4.R/XmYcV36la/0mMZHHrHAPeOdYVtvEm', 'Đặng Ngọc Lan', 'https://api.dicebear.com/9.x/avataaars/svg?seed=Đặng%20Ngọc%20Lan&radius=50', 'merchant', 'active', '2026-08-13 00:47:38.000', NULL, NULL, 1, '2026-08-13 00:47:38.000', '2026-08-31 18:38:29.000', NULL, NULL);

DROP TABLE IF EXISTS `voucher_redemptions`;
CREATE TABLE `voucher_redemptions` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `voucher_id` bigint unsigned NOT NULL,
  `customer_id` bigint unsigned NOT NULL,
  `order_id` bigint unsigned NOT NULL,
  `discount_amount` bigint unsigned NOT NULL,
  `status` enum('reserved','redeemed','released') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'reserved',
  `redeemed_at` datetime DEFAULT NULL,
  `released_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_voucher_redemptions_order` (`order_id`),
  KEY `idx_voucher_redemptions_usage` (`voucher_id`,`status`),
  KEY `idx_voucher_redemptions_customer` (`voucher_id`,`customer_id`,`status`),
  KEY `fk_voucher_redemptions_customer` (`customer_id`),
  CONSTRAINT `fk_voucher_redemptions_customer` FOREIGN KEY (`customer_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_voucher_redemptions_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_voucher_redemptions_voucher` FOREIGN KEY (`voucher_id`) REFERENCES `vouchers` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `vouchers`;
CREATE TABLE `vouchers` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `restaurant_id` bigint unsigned DEFAULT NULL,
  `created_by_user_id` bigint unsigned NOT NULL,
  `code` varchar(40) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(160) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `discount_type` enum('percent','fixed') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `discount_value` bigint unsigned NOT NULL,
  `max_discount_amount` bigint unsigned DEFAULT NULL,
  `min_order_amount` bigint unsigned NOT NULL DEFAULT '0',
  `usage_limit` int unsigned DEFAULT NULL,
  `per_user_limit` int unsigned NOT NULL DEFAULT '1',
  `starts_at` datetime NOT NULL,
  `ends_at` datetime NOT NULL,
  `status` enum('draft','active','paused') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'draft',
  `is_public` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_vouchers_code` (`code`),
  KEY `idx_vouchers_restaurant_status_window` (`restaurant_id`,`status`,`starts_at`,`ends_at`),
  KEY `idx_vouchers_created_by` (`created_by_user_id`),
  CONSTRAINT `fk_vouchers_created_by` FOREIGN KEY (`created_by_user_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_vouchers_restaurant` FOREIGN KEY (`restaurant_id`) REFERENCES `restaurants` (`id`) ON DELETE CASCADE,
  CONSTRAINT `chk_vouchers_per_user_limit` CHECK ((`per_user_limit` > 0)),
  CONSTRAINT `chk_vouchers_value` CHECK ((`discount_value` > 0)),
  CONSTRAINT `chk_vouchers_window` CHECK ((`ends_at` > `starts_at`))
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
INSERT INTO `vouchers` (`id`, `restaurant_id`, `created_by_user_id`, `code`, `name`, `description`, `discount_type`, `discount_value`, `max_discount_amount`, `min_order_amount`, `usage_limit`, `per_user_limit`, `starts_at`, `ends_at`, `status`, `is_public`, `created_at`, `updated_at`) VALUES
(1, NULL, 1, 'NOMNOM15', 'NOMNOM15', 'Giảm 15% cho đơn hàng trên NomNom.', 'percent', 15, 250000, 0, NULL, 1, '2026-01-01 00:00:00.000', '2027-12-31 23:59:59.000', 'active', 1, '2026-08-12 13:18:47.000', '2026-08-12 13:18:47.000'),
(2, NULL, 1, 'NEW50K', 'NEW50K', 'Giảm 50.000 đ cho đơn hàng đầu tiên.', 'fixed', 50000, NULL, 200000, NULL, 1, '2026-01-01 00:00:00.000', '2027-12-31 23:59:59.000', 'active', 1, '2026-08-12 13:18:47.000', '2026-08-12 13:18:47.000');

DROP TABLE IF EXISTS `wallet_transactions`;
CREATE TABLE `wallet_transactions` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `wallet_id` bigint unsigned NOT NULL,
  `direction` enum('credit','debit') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `amount` bigint unsigned NOT NULL,
  `balance_after` bigint NOT NULL,
  `tx_type` enum('order_earning','commission','order_payment','withdrawal','adjustment') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `reference_type` enum('order','payout','manual') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `reference_id` bigint unsigned DEFAULT NULL,
  `description` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `performed_by_user_id` bigint unsigned DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_wt_wallet` (`wallet_id`,`created_at`),
  KEY `idx_wt_ref` (`reference_type`,`reference_id`),
  KEY `fk_wt_admin` (`performed_by_user_id`),
  CONSTRAINT `fk_wt_admin` FOREIGN KEY (`performed_by_user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_wt_wallet` FOREIGN KEY (`wallet_id`) REFERENCES `wallets` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB AUTO_INCREMENT=100 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
INSERT INTO `wallet_transactions` (`id`, `wallet_id`, `direction`, `amount`, `balance_after`, `tx_type`, `reference_type`, `reference_id`, `description`, `performed_by_user_id`, `created_at`) VALUES
(1, 4, 'credit', 340000, 340000, 'order_earning', 'order', 7, 'Doanh thu đơn NNM-260812-0007', NULL, '2026-08-12 12:50:00.000'),
(2, 4, 'credit', 861900, 1201900, 'order_earning', 'order', 8, 'Doanh thu đơn NNM-260815-0008', NULL, '2026-08-15 18:55:00.000'),
(3, 4, 'credit', 372300, 1574200, 'order_earning', 'order', 9, 'Doanh thu đơn NNM-260818-0009', NULL, '2026-08-18 12:15:00.000'),
(4, 4, 'credit', 287300, 1861500, 'order_earning', 'order', 10, 'Doanh thu đơn NNM-260820-0010', NULL, '2026-08-20 12:40:00.000'),
(5, 4, 'credit', 255000, 2116500, 'order_earning', 'order', 11, 'Doanh thu đơn NNM-260822-0011', NULL, '2026-08-22 19:05:00.000'),
(6, 4, 'debit', 616500, 1500000, 'withdrawal', 'payout', 4, 'Rút tiền PYT-004 đã hoàn tất', 1, '2026-05-21 21:42:10.000');

DROP TABLE IF EXISTS `wallets`;
CREATE TABLE `wallets` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint unsigned NOT NULL,
  `owner_type` enum('driver','merchant') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `balance` bigint NOT NULL DEFAULT '0',
  `pending_balance` bigint NOT NULL DEFAULT '0',
  `total_earned` bigint NOT NULL DEFAULT '0',
  `total_withdrawn` bigint NOT NULL DEFAULT '0',
  `is_locked` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_wallet_owner` (`user_id`,`owner_type`),
  CONSTRAINT `fk_wallet_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=107 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
INSERT INTO `wallets` (`id`, `user_id`, `owner_type`, `balance`, `pending_balance`, `total_earned`, `total_withdrawn`, `is_locked`, `created_at`, `updated_at`) VALUES
(4, 7, 'merchant', 1500000, 0, 2116500, 616500, 0, '2026-05-21 21:42:10.000', '2026-05-21 21:42:10.000'),
(5, 8, 'merchant', 4300000, 0, 9850000, 5550000, 0, '2026-05-21 21:42:10.000', '2026-05-21 21:42:10.000'),
(6, 9, 'merchant', 3200000, 0, 7340000, 4140000, 0, '2026-05-21 21:42:10.000', '2026-05-21 21:42:10.000'),
(7, 11, 'merchant', 6800000, 0, 14120000, 7320000, 0, '2026-05-21 21:42:10.000', '2026-05-21 21:42:10.000'),
(8, 13, 'merchant', 1100000, 0, 2450000, 1350000, 0, '2026-05-21 21:42:10.000', '2026-05-21 21:42:10.000'),
(100, 121, 'merchant', 350000, 0, 850000, 500000, 0, '2026-08-13 01:47:48.000', '2026-08-13 01:47:48.000'),
(101, 122, 'merchant', 350000, 0, 850000, 500000, 0, '2026-08-13 01:47:48.000', '2026-08-13 01:47:48.000'),
(102, 123, 'merchant', 350000, 0, 850000, 500000, 0, '2026-08-13 01:47:48.000', '2026-08-13 01:47:48.000'),
(103, 132, 'merchant', 350000, 0, 850000, 500000, 0, '2026-08-13 01:47:48.000', '2026-08-13 01:47:48.000'),
(104, 133, 'merchant', 350000, 0, 850000, 500000, 0, '2026-08-13 01:47:48.000', '2026-08-13 01:47:48.000'),
(105, 134, 'merchant', 350000, 0, 850000, 500000, 0, '2026-08-13 01:47:48.000', '2026-08-13 01:47:48.000');

-- Rebuild status history after all referenced tables exist. Delivery is operated
-- by the platform, so no event or visible copy depends on a driver actor.
UPDATE `orders`
SET `updated_at` = CASE
  WHEN `status` = 'delivered' THEN `delivered_at`
  WHEN `status` = 'cancelled' THEN `cancelled_at`
  WHEN `status` IN ('payment_failed','expired') THEN DATE_ADD(`placed_at`, INTERVAL 5 MINUTE)
  WHEN `status` = 'delivering' THEN `picked_up_at`
  WHEN `status` = 'ready_for_pickup' THEN `ready_at`
  WHEN `status` = 'preparing' THEN DATE_ADD(`accepted_at`, INTERVAL 1 MINUTE)
  WHEN `status` = 'accepted' THEN `accepted_at`
  ELSE `placed_at` END;

INSERT INTO `order_status_logs`
  (`id`,`order_id`,`from_status`,`to_status`,`changed_by_role`,`changed_by_user_id`,`note`,`created_at`)
SELECT o.id * 10 + 1, o.id, NULL,
       CASE WHEN o.status = 'payment_failed' THEN 'payment_failed' ELSE 'placed' END,
       CASE WHEN o.status = 'payment_failed' THEN 'system' ELSE 'customer' END,
       CASE WHEN o.status = 'payment_failed' THEN NULL ELSE o.customer_id END,
       CASE WHEN o.status = 'payment_failed' THEN 'Thanh toán không thành công.' ELSE 'Khách hàng đã tạo đơn.' END,
       CASE WHEN o.status = 'payment_failed' THEN DATE_ADD(o.placed_at, INTERVAL 1 MINUTE) ELSE o.placed_at END
FROM `orders` o;

INSERT INTO `order_status_logs`
  (`id`,`order_id`,`from_status`,`to_status`,`changed_by_role`,`changed_by_user_id`,`note`,`created_at`)
SELECT o.id * 10 + 2, o.id, 'placed', 'accepted', 'merchant', r.owner_user_id, 'Nhà hàng đã xác nhận đơn.', o.accepted_at
FROM `orders` o JOIN `restaurants` r ON r.id = o.restaurant_id
WHERE o.status IN ('accepted','preparing','ready_for_pickup','picked_up','delivering','delivered');

INSERT INTO `order_status_logs`
  (`id`,`order_id`,`from_status`,`to_status`,`changed_by_role`,`changed_by_user_id`,`note`,`created_at`)
SELECT o.id * 10 + 3, o.id, 'accepted', 'preparing', 'merchant', r.owner_user_id, 'Nhà hàng bắt đầu chuẩn bị món.', DATE_ADD(o.accepted_at, INTERVAL 1 MINUTE)
FROM `orders` o JOIN `restaurants` r ON r.id = o.restaurant_id
WHERE o.status IN ('preparing','ready_for_pickup','picked_up','delivering','delivered');

INSERT INTO `order_status_logs`
  (`id`,`order_id`,`from_status`,`to_status`,`changed_by_role`,`changed_by_user_id`,`note`,`created_at`)
SELECT o.id * 10 + 4, o.id, 'preparing', 'ready_for_pickup', 'merchant', r.owner_user_id, 'Nhà hàng đã hoàn tất món.', o.ready_at
FROM `orders` o JOIN `restaurants` r ON r.id = o.restaurant_id
WHERE o.status IN ('ready_for_pickup','picked_up','delivering','delivered');

INSERT INTO `order_status_logs`
  (`id`,`order_id`,`from_status`,`to_status`,`changed_by_role`,`changed_by_user_id`,`note`,`created_at`)
SELECT o.id * 10 + 5, o.id, 'ready_for_pickup', 'delivering', 'system', NULL, 'Đơn hàng đang được vận chuyển.', o.picked_up_at
FROM `orders` o
WHERE o.status IN ('delivering','delivered');

INSERT INTO `order_status_logs`
  (`id`,`order_id`,`from_status`,`to_status`,`changed_by_role`,`changed_by_user_id`,`note`,`created_at`)
SELECT o.id * 10 + 6, o.id, 'delivering', 'delivered', 'system', NULL, 'Đơn hàng đã giao thành công.', o.delivered_at
FROM `orders` o
WHERE o.status = 'delivered';

INSERT INTO `order_status_logs`
  (`id`,`order_id`,`from_status`,`to_status`,`changed_by_role`,`changed_by_user_id`,`note`,`created_at`)
SELECT o.id * 10 + 7, o.id, 'placed', o.status,
       CASE WHEN o.status = 'cancelled' THEN 'customer' ELSE 'system' END,
       CASE WHEN o.status = 'cancelled' THEN o.customer_id ELSE NULL END,
       CASE WHEN o.status = 'cancelled' THEN 'Khách hàng đã hủy đơn trước khi nhà hàng xác nhận.' ELSE 'Đơn hết thời gian chờ xác nhận.' END,
       CASE WHEN o.status = 'cancelled' THEN o.cancelled_at ELSE o.updated_at END
FROM `orders` o
WHERE o.status IN ('cancelled','expired');

-- Presentation location coverage (03/09/2026): keep three active restaurants
-- near each saved presentation address without changing historical orders.
UPDATE `restaurants` SET `address_line` = 'Khu ẩm thực Hưng Phú', `ward` = 'Phường Hưng Phú', `district` = 'Quận Cái Răng', `city` = 'TP. Cần Thơ', `latitude` = 9.9862000, `longitude` = 105.7875000, `updated_at` = '2026-09-01 19:30:00.000' WHERE `id` = 115 AND `slug` = 'bun-ca-hung-phu';
UPDATE `restaurants` SET `address_line` = 'Đường Trương Vĩnh Nguyên', `ward` = 'Phường Hưng Phú', `district` = 'Quận Cái Răng', `city` = 'TP. Cần Thơ', `latitude` = 9.9881000, `longitude` = 105.7928000, `updated_at` = '2026-09-01 19:30:00.000' WHERE `id` = 116 AND `slug` = 'com-ga-truong-vinh-nguyen';
UPDATE `restaurants` SET `address_line` = 'Khu dân cư Hưng Phú', `ward` = 'Phường Hưng Phú', `district` = 'Quận Cái Răng', `city` = 'TP. Cần Thơ', `latitude` = 9.9799000, `longitude` = 105.7839000, `updated_at` = '2026-09-01 19:30:00.000' WHERE `id` = 117 AND `slug` = 'tiem-tra-hung-phu';
UPDATE `restaurants` SET `address_line` = 'Ấp Cái Tàu Hạ', `ward` = 'Cái Tàu Hạ', `district` = 'Phú Hựu', `city` = 'Đồng Tháp', `latitude` = 10.2504000, `longitude` = 105.8682000, `updated_at` = '2026-09-01 19:30:00.000' WHERE `id` = 108 AND `slug` = 'bep-song-que';
UPDATE `restaurants` SET `address_line` = 'Ấp Cái Tàu Hạ', `ward` = 'Cái Tàu Hạ', `district` = 'Phú Hựu', `city` = 'Đồng Tháp', `latitude` = 10.2547000, `longitude` = 105.8753000, `updated_at` = '2026-09-01 19:30:00.000' WHERE `id` = 109 AND `slug` = 'ca-phe-bo-kenh';
UPDATE `restaurants` SET `address_line` = 'Ấp Phú Thạnh', `ward` = 'Cái Tàu Hạ', `district` = 'Phú Hựu', `city` = 'Đồng Tháp', `latitude` = 10.2427000, `longitude` = 105.8598000, `updated_at` = '2026-09-01 19:30:00.000' WHERE `id` = 110 AND `slug` = 'an-vat-cho-chieu';

INSERT INTO `customer_addresses`
  (`id`, `customer_id`, `label`, `recipient_name`, `recipient_phone`, `line1`, `ward`, `district`, `city`, `latitude`, `longitude`, `delivery_note`, `is_default`, `created_at`, `updated_at`)
VALUES
  (1001, 2, 'Điểm báo cáo', 'Nguyễn Minh Anh', '+84901000002', 'Khu vực báo cáo NomNom', 'Phường Hưng Phú', 'Quận Cái Răng', 'TP. Cần Thơ', 9.9845360, 105.7889760, 'Địa chỉ trình diễn ngày 03/09/2026', 0, '2026-09-01 19:30:00.000', '2026-09-01 19:30:00.000'),
  (1002, 2, 'Vị trí tiện dùng', 'Nguyễn Minh Anh', '+84901000002', 'Khu vực Cái Tàu Hạ', 'Cái Tàu Hạ', 'Phú Hựu', 'Đồng Tháp', 10.2499570, 105.8680370, 'Địa chỉ trình diễn bổ sung', 0, '2026-09-01 19:30:00.000', '2026-09-01 19:30:00.000');

SET FOREIGN_KEY_CHECKS = 1;
