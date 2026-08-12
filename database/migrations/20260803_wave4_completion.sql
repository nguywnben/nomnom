-- Wave 4 completion: payment attempt references and auditable VNPay refunds.
-- Apply once after 20260711_wave4_foundation.sql.

ALTER TABLE payments
  ADD COLUMN gateway_reference varchar(120) COLLATE utf8mb4_unicode_ci DEFAULT NULL AFTER gateway,
  ADD COLUMN gateway_created_at datetime DEFAULT NULL AFTER gateway_txn_id,
  ADD UNIQUE KEY uq_payments_gateway_reference (gateway_reference);

CREATE TABLE payment_refunds (
  id bigint UNSIGNED NOT NULL AUTO_INCREMENT,
  payment_id bigint UNSIGNED NOT NULL,
  order_id bigint UNSIGNED NOT NULL,
  request_id varchar(120) COLLATE utf8mb4_unicode_ci NOT NULL,
  amount bigint UNSIGNED NOT NULL,
  status enum('initiated','succeeded','failed') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'initiated',
  gateway_txn_id varchar(120) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  failure_reason varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  raw_response json DEFAULT NULL,
  created_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  completed_at datetime DEFAULT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_payment_refunds_request (request_id),
  KEY idx_payment_refunds_payment (payment_id, status),
  KEY idx_payment_refunds_order (order_id, status),
  CONSTRAINT fk_payment_refunds_payment FOREIGN KEY (payment_id) REFERENCES payments (id) ON DELETE RESTRICT,
  CONSTRAINT fk_payment_refunds_order FOREIGN KEY (order_id) REFERENCES orders (id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
