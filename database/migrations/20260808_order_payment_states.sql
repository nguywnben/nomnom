-- Adds the order states used by VNPay retry and the 30-minute expiry worker.
-- Apply once to databases created before this migration.

ALTER TABLE orders
  MODIFY COLUMN status enum(
    'pending_payment',
    'payment_failed',
    'placed',
    'accepted',
    'preparing',
    'ready_for_pickup',
    'picked_up',
    'delivering',
    'delivered',
    'cancelled',
    'failed',
    'expired'
  ) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending_payment';
