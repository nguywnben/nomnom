-- Migration: Voucher Wallet and Public/Private Scope
-- Date: 2026-08-29

-- 1. Bo sung cot is_public vao bang vouchers (1 = Cong khai treo thuc don, 0 = Rieng tu/Bi mat)
ALTER TABLE `vouchers` 
ADD COLUMN IF NOT EXISTS `is_public` TINYINT(1) NOT NULL DEFAULT 1 AFTER `status`;

-- 2. Tao bang vi voucher ca nhan cua khach hang (customer_saved_vouchers)
CREATE TABLE IF NOT EXISTS `customer_saved_vouchers` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `customer_id` BIGINT UNSIGNED NOT NULL,
  `voucher_id` BIGINT UNSIGNED NOT NULL,
  `saved_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_customer_voucher` (`customer_id`, `voucher_id`),
  KEY `idx_customer` (`customer_id`),
  KEY `idx_voucher` (`voucher_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
