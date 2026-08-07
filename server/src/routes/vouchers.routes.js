import { Router } from 'express';
import pool from '../db/pool.js';
import { requireAuth } from '../middleware/auth.js';
import { evaluateVoucher } from '../lib/voucher.js';

const router = Router();

const REASON_MESSAGES = {
  not_found: 'Voucher not found.',
  inactive: 'This voucher is not active.',
  wrong_restaurant: 'This voucher does not apply to this restaurant.',
  expired: 'This voucher is outside its validity period.',
  usage_limit_reached: 'This voucher has reached its usage limit.',
  per_user_limit_reached: 'You have reached the usage limit for this voucher.',
  min_order_not_met: 'The cart does not meet the minimum order amount.',
  invalid_discount_type: 'This voucher has an invalid discount type.',
};

function serializeVoucher(row) {
  return {
    id: Number(row.id),
    restaurantId: row.restaurant_id === null ? null : Number(row.restaurant_id),
    code: row.code,
    name: row.name,
    description: row.description ?? null,
    discountType: row.discount_type,
    discountValue: Number(row.discount_value),
    maxDiscountAmount: row.max_discount_amount === null ? null : Number(row.max_discount_amount),
    minOrderAmount: Number(row.min_order_amount ?? 0),
    usageLimit: row.usage_limit === null ? null : Number(row.usage_limit),
    perUserLimit: Number(row.per_user_limit ?? 1),
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    status: row.status,
  };
}

router.get('/', async (req, res, next) => {
  try {
    const restaurantId = Number(req.query.restaurantId);
    if (!Number.isInteger(restaurantId) || restaurantId <= 0) {
      return res.status(400).json({ error: 'A valid restaurantId is required.' });
    }

    const [rows] = await pool.query(
      "SELECT v.* FROM vouchers v WHERE v.status = 'active' AND v.starts_at <= NOW() AND v.ends_at >= NOW() AND (v.restaurant_id IS NULL OR v.restaurant_id = ?) AND (v.usage_limit IS NULL OR (SELECT COUNT(*) FROM voucher_redemptions vr WHERE vr.voucher_id = v.id AND vr.status IN ('reserved', 'redeemed')) < v.usage_limit) ORDER BY v.ends_at ASC, v.created_at DESC",
      [restaurantId],
    );
    const data = rows.map(serializeVoucher);
    return res.json({ data, items: data });
  } catch (error) {
    return next(error);
  }
});

router.post('/validate', requireAuth, async (req, res, next) => {
  try {
    const code = String(req.body?.code ?? '').trim().toUpperCase();
    if (!code) {
      return res.status(400).json({ ok: false, reason: 'missing_code', message: 'A voucher code is required.' });
    }

    const [[cart]] = await pool.query(
      "SELECT c.id, c.restaurant_id, COALESCE(SUM(mi.price * ci.quantity), 0) AS subtotal FROM carts c JOIN cart_items ci ON ci.cart_id = c.id JOIN menu_items mi ON mi.id = ci.menu_item_id WHERE c.customer_id = ? AND c.status = 'active' GROUP BY c.id, c.restaurant_id LIMIT 1",
      [req.auth.userId],
    );
    if (!cart || Number(cart.subtotal) <= 0) {
      return res.status(400).json({ ok: false, reason: 'empty_cart', message: 'Your cart is empty.' });
    }

    const [voucherRows] = await pool.query(
      'SELECT * FROM vouchers WHERE code = ? LIMIT 1',
      [code],
    );
    const voucher = voucherRows[0] ?? null;

    let totalUsage = 0;
    let customerUsage = 0;
    if (voucher) {
      const [[usage]] = await pool.query(
        "SELECT COUNT(*) AS totalUsage, COALESCE(SUM(CASE WHEN customer_id = ? THEN 1 ELSE 0 END), 0) AS customerUsage FROM voucher_redemptions WHERE voucher_id = ? AND status IN ('reserved', 'redeemed')",
        [req.auth.userId, voucher.id],
      );
      totalUsage = Number(usage?.totalUsage ?? 0);
      customerUsage = Number(usage?.customerUsage ?? 0);
    }

    const result = evaluateVoucher(voucher, {
      subtotal: Number(cart.subtotal),
      restaurantId: Number(cart.restaurant_id),
      totalUsage,
      customerUsage,
    });
    if (!result.ok) {
      return res.json({
        ...result,
        message: REASON_MESSAGES[result.reason] || 'Voucher is not valid.',
      });
    }

    const serialized = serializeVoucher(voucher);
    return res.json({
      ok: true,
      discountAmount: result.discountAmount,
      voucher: {
        ...serialized,
        kind: serialized.discountType,
        amount: serialized.discountValue,
        max_discount: serialized.maxDiscountAmount,
      },
    });
  } catch (error) {
    return next(error);
  }
});

export default router;
