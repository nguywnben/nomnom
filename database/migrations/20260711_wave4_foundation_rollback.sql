-- Roll back database/migrations/20260711_wave4_foundation.sql.

ALTER TABLE `orders`
  DROP FOREIGN KEY `fk_orders_voucher`,
  DROP INDEX `idx_orders_voucher`,
  DROP COLUMN `voucher_code_snapshot`,
  DROP COLUMN `voucher_id`;

DROP TABLE IF EXISTS `voucher_redemptions`;
DROP TABLE IF EXISTS `vouchers`;
