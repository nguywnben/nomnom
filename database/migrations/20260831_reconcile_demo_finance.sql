-- Scope: report/demo rows only. User-created and legacy-driver orders are untouched.
UPDATE orders o
JOIN restaurants r ON r.id = o.restaurant_id
LEFT JOIN vouchers v ON v.id = o.voucher_id
SET
  o.merchant_earning =
    (CASE
      WHEN v.restaurant_id IS NOT NULL THEN GREATEST(0, o.subtotal - o.discount_amount)
      ELSE o.subtotal
    END)
    - FLOOR(
      (CASE
        WHEN v.restaurant_id IS NOT NULL THEN GREATEST(0, o.subtotal - o.discount_amount)
        ELSE o.subtotal
      END) * r.commission_rate / 100
    ),
  o.platform_fee =
    FLOOR(
      (CASE
        WHEN v.restaurant_id IS NOT NULL THEN GREATEST(0, o.subtotal - o.discount_amount)
        ELSE o.subtotal
      END) * r.commission_rate / 100
    ) + o.delivery_fee
WHERE o.order_code LIKE 'DEMO-%'
  AND o.driver_id IS NULL
  AND COALESCE(o.driver_earning, 0) = 0;
