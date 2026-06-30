-- Thêm thông tin ngân hàng cho nhà hàng (MER-01 banking step)
ALTER TABLE `restaurants`
  ADD COLUMN `bank_account_no` varchar(40) COLLATE utf8mb4_unicode_ci DEFAULT NULL AFTER `rejection_reason`,
  ADD COLUMN `bank_name` varchar(120) COLLATE utf8mb4_unicode_ci DEFAULT NULL AFTER `bank_account_no`,
  ADD COLUMN `bank_account_holder` varchar(120) COLLATE utf8mb4_unicode_ci DEFAULT NULL AFTER `bank_name`;
