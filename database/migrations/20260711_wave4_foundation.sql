-- Wave 4 shared foundation: vouchers and immutable order discount snapshots.
-- Apply once after database/nomnom.sql.

CREATE TABLE `vouchers` (
  `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT,
  `restaurant_id` bigint UNSIGNED DEFAULT NULL,
  `created_by_user_id` bigint UNSIGNED NOT NULL,
  `code` varchar(40) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(160) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `discount_type` enum('percent','fixed') COLLATE utf8mb4_unicode_ci NOT NULL,
  `discount_value` bigint UNSIGNED NOT NULL,
  `max_discount_amount` bigint UNSIGNED DEFAULT NULL,
  `min_order_amount` bigint UNSIGNED NOT NULL DEFAULT '0',
  `usage_limit` int UNSIGNED DEFAULT NULL,
  `per_user_limit` int UNSIGNED NOT NULL DEFAULT '1',
  `starts_at` datetime NOT NULL,
  `ends_at` datetime NOT NULL,
  `status` enum('draft','active','paused') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'draft',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_vouchers_code` (`code`),
  KEY `idx_vouchers_restaurant_status_window` (`restaurant_id`, `status`, `starts_at`, `ends_at`),
  KEY `idx_vouchers_created_by` (`created_by_user_id`),
  CONSTRAINT `fk_vouchers_restaurant` FOREIGN KEY (`restaurant_id`) REFERENCES `restaurants` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_vouchers_created_by` FOREIGN KEY (`created_by_user_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `chk_vouchers_window` CHECK (`ends_at` > `starts_at`),
  CONSTRAINT `chk_vouchers_value` CHECK (`discount_value` > 0),
  CONSTRAINT `chk_vouchers_per_user_limit` CHECK (`per_user_limit` > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `voucher_redemptions` (
  `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT,
  `voucher_id` bigint UNSIGNED NOT NULL,
  `customer_id` bigint UNSIGNED NOT NULL,
  `order_id` bigint UNSIGNED NOT NULL,
  `discount_amount` bigint UNSIGNED NOT NULL,
  `status` enum('reserved','redeemed','released') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'reserved',
  `redeemed_at` datetime DEFAULT NULL,
  `released_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_voucher_redemptions_order` (`order_id`),
  KEY `idx_voucher_redemptions_usage` (`voucher_id`, `status`),
  KEY `idx_voucher_redemptions_customer` (`voucher_id`, `customer_id`, `status`),
  CONSTRAINT `fk_voucher_redemptions_voucher` FOREIGN KEY (`voucher_id`) REFERENCES `vouchers` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_voucher_redemptions_customer` FOREIGN KEY (`customer_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_voucher_redemptions_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE `orders`
  ADD COLUMN `voucher_id` bigint UNSIGNED DEFAULT NULL AFTER `restaurant_id`,
  ADD COLUMN `voucher_code_snapshot` varchar(40) COLLATE utf8mb4_unicode_ci DEFAULT NULL AFTER `discount_amount`,
  ADD KEY `idx_orders_voucher` (`voucher_id`),
  ADD CONSTRAINT `fk_orders_voucher` FOREIGN KEY (`voucher_id`) REFERENCES `vouchers` (`id`) ON DELETE SET NULL;
