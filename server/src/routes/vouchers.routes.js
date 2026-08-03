import { Router } from 'express';
import pool from '../db/pool.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// Helper to validate a voucher
export async function validateVoucher(code, subtotal) {
  if (!code) {
    return { ok: false, reason: 'missing_code' };
  }

  const [rows] = await pool.query(
    'SELECT * FROM vouchers WHERE code = ? LIMIT 1',
    [code.trim()]
  );
  
  if (rows.length === 0) {
    return { ok: false, reason: 'not_found' };
  }

  const voucher = rows[0];

  if (!voucher.is_active) {
    return { ok: false, reason: 'inactive' };
  }

  const now = new Date();
  const validFrom = new Date(voucher.valid_from);
  const validTo = new Date(voucher.valid_to);

  if (now < validFrom || now > validTo) {
    return { ok: false, reason: 'expired' };
  }

  if (voucher.usage_limit !== null && voucher.usage_count >= voucher.usage_limit) {
    return { ok: false, reason: 'usage_limit_reached' };
  }

  if (BigInt(subtotal) < BigInt(voucher.min_order)) {
    return { ok: false, reason: 'min_order_not_met', minOrder: Number(voucher.min_order) };
  }

  let discount = 0n;
  const subtotalBig = BigInt(subtotal);
  const amountBig = BigInt(voucher.amount);

  if (voucher.kind === 'percent') {
    discount = (subtotalBig * amountBig) / 100n;
    if (voucher.max_discount !== null) {
      const maxDiscountBig = BigInt(voucher.max_discount);
      if (discount > maxDiscountBig) {
        discount = maxDiscountBig;
      }
    }
  } else if (voucher.kind === 'flat') {
    discount = amountBig;
  }

  if (discount > subtotalBig) {
    discount = subtotalBig;
  }

  return {
    ok: true,
    discount: Number(discount),
    voucher: {
      id: voucher.id,
      code: voucher.code,
      kind: voucher.kind,
      amount: Number(voucher.amount),
      min_order: Number(voucher.min_order),
      max_discount: voucher.max_discount !== null ? Number(voucher.max_discount) : null,
      valid_from: voucher.valid_from,
      valid_to: voucher.valid_to,
      usage_limit: voucher.usage_limit,
      usage_count: voucher.usage_count,
      is_active: Boolean(voucher.is_active),
    }
  };
}

router.post('/validate', requireAuth, async (req, res, next) => {
  try {
    const { code, subtotal } = req.body;
    if (subtotal === undefined || isNaN(Number(subtotal))) {
      return res.status(400).json({ error: 'subtotal là bắt buộc và phải là số.' });
    }

    const result = await validateVoucher(code, subtotal);
    if (!result.ok) {
      let message = 'Mã giảm giá không hợp lệ.';
      if (result.reason === 'not_found') message = 'Mã giảm giá không tồn tại.';
      else if (result.reason === 'inactive') message = 'Mã giảm giá không còn hoạt động.';
      else if (result.reason === 'expired') message = 'Mã giảm giá đã hết hạn.';
      else if (result.reason === 'usage_limit_reached') message = 'Mã giảm giá đã hết lượt sử dụng.';
      else if (result.reason === 'min_order_not_met') message = `Mã này chỉ áp dụng cho đơn hàng từ ${Number(result.minOrder).toLocaleString('vi-VN')} ₫.`;

      return res.json({ ok: false, reason: result.reason, message });
    }

    return res.json(result);
  } catch (err) {
    next(err);
  }
});

export default router;
