-- Roll back Wave 4 payment completion schema.

DROP TABLE IF EXISTS payment_refunds;

ALTER TABLE payments
  DROP INDEX uq_payments_gateway_reference,
  DROP COLUMN gateway_created_at,
  DROP COLUMN gateway_reference;
