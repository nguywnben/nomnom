import { Router } from 'express';
import pool from '../db/pool.js';
import { requireAuth, ensureCustomer } from '../middleware/auth.js';
import {
  buildPaymentUrl,
  verifyQuerySignature,
} from '../lib/vnpay.js';
import { evaluateVoucher } from '../lib/voucher.js';

const router = Router();

function clientIp(req) {
  const forwarded = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim();
  return (forwarded || req.socket.remoteAddress || '127.0.0.1').replace(/^::ffff:/, '');
}

function paymentConfig() {
  const config = {
    tmnCode: process.env.VNPAY_TMN_CODE,
    secret: process.env.VNPAY_HASH_SECRET,
    paymentUrl: process.env.VNPAY_URL,
    returnUrl: process.env.VNPAY_RETURN_URL,
  };
  const missing = Object.entries(config)
    .filter(([, value]) => !value)
    .map(([key]) => key);
  return { config, missing };
}

function validMerchant(params, tmnCode) {
  return Boolean(params.vnp_TmnCode) && params.vnp_TmnCode === tmnCode;
}

async function createVnpayPayment(req, res, next) {
  const { config, missing } = paymentConfig();
  if (missing.length) {
    return res.status(503).json({
      error: 'VNPay is not configured.',
      missing,
    });
  }

  const orderId = Number(req.body?.orderId);
  if (!Number.isInteger(orderId) || orderId <= 0) {
    return res.status(400).json({ error: 'A valid orderId is required.' });
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [orders] = await connection.query(
      'SELECT * FROM orders WHERE id = ? AND customer_id = ? FOR UPDATE',
      [orderId, req.auth.userId],
    );
    const order = orders[0];

    if (!order) {
      await connection.rollback();
      return res.status(404).json({ error: 'Order not found.' });
    }
    if (order.payment_method !== 'vnpay') {
      await connection.rollback();
      return res.status(400).json({ error: 'This order does not use VNPay.' });
    }
    if (order.payment_status === 'paid' || order.payment_status === 'refunded') {
      await connection.rollback();
      return res.status(409).json({ error: 'This order has already been paid.' });
    }
    if (order.status !== 'pending_payment') {
      await connection.rollback();
      return res.status(409).json({ error: 'This order can no longer be paid.' });
    }

    if (order.voucher_id) {
      const [voucherRows] = await connection.query(
        'SELECT * FROM vouchers WHERE id = ? FOR UPDATE',
        [order.voucher_id],
      );
      const [redemptionRows] = await connection.query(
        'SELECT * FROM voucher_redemptions WHERE order_id = ? FOR UPDATE',
        [order.id],
      );
      const voucher = voucherRows[0];
      const redemption = redemptionRows[0];

      if (!voucher || !redemption) {
        await connection.rollback();
        return res.status(409).json({ error: 'The order voucher reservation is missing.' });
      }

      if (redemption.status === 'released') {
        const [[usage]] = await connection.query(
          "SELECT COUNT(*) AS totalUsage, COALESCE(SUM(CASE WHEN customer_id = ? THEN 1 ELSE 0 END), 0) AS customerUsage FROM voucher_redemptions WHERE voucher_id = ? AND status IN ('reserved', 'redeemed')",
          [order.customer_id, voucher.id],
        );
        const evaluation = evaluateVoucher(voucher, {
          subtotal: Number(order.subtotal),
          restaurantId: order.restaurant_id,
          totalUsage: Number(usage?.totalUsage ?? 0),
          customerUsage: Number(usage?.customerUsage ?? 0),
        });
        if (!evaluation.ok || Number(redemption.discount_amount) !== evaluation.discountAmount) {
          await connection.rollback();
          return res.status(409).json({
            error: 'The voucher is no longer available for payment retry.',
            reason: evaluation.reason || 'discount_changed',
          });
        }
        await connection.query(
          "UPDATE voucher_redemptions SET status = 'reserved', released_at = NULL, redeemed_at = NULL WHERE id = ?",
          [redemption.id],
        );
      }
    }

    await connection.query(
      "UPDATE payments SET status = 'cancelled', failure_reason = 'Superseded by a newer payment attempt' WHERE order_id = ? AND method = 'vnpay' AND status IN ('initiated', 'pending')",
      [order.id],
    );

    const [paymentResult] = await connection.query(
      "INSERT INTO payments (order_id, method, amount, currency, gateway, status, gateway_created_at) VALUES (?, 'vnpay', ?, 'VND', 'vnpay', 'initiated', NOW())",
      [order.id, order.total_amount],
    );
    const gatewayReference = order.order_code + '-' + paymentResult.insertId;

    const built = buildPaymentUrl({
      paymentUrl: config.paymentUrl,
      secret: config.secret,
      tmnCode: config.tmnCode,
      txnRef: gatewayReference,
      amount: order.total_amount,
      returnUrl: config.returnUrl,
      ipAddress: clientIp(req),
      orderInfo: 'Thanh toan don hang ' + order.order_code,
    });

    await connection.query(
      "UPDATE payments SET gateway_reference = ?, status = 'pending', raw_response = ? WHERE id = ?",
      [gatewayReference, JSON.stringify({ request: built.params }), paymentResult.insertId],
    );
    if (order.payment_status === 'failed') {
      await connection.query("UPDATE orders SET payment_status = 'unpaid' WHERE id = ?", [order.id]);
    }

    await connection.commit();
    return res.json({
      paymentUrl: built.paymentUrl,
      paymentId: paymentResult.insertId,
      expiresInSeconds: 900,
    });
  } catch (error) {
    await connection.rollback();
    return next(error);
  } finally {
    connection.release();
  }
}

async function findVerifiedPayment(params, config) {
  if (!verifyQuerySignature(params, config.secret)) {
    return { error: 'Invalid signature.', rspCode: '97' };
  }
  if (!validMerchant(params, config.tmnCode)) {
    return { error: 'Invalid merchant.', rspCode: '97' };
  }

  const [rows] = await pool.query(
    'SELECT p.*, o.order_code, o.payment_status AS order_payment_status, o.total_amount, o.status AS order_status FROM payments p JOIN orders o ON o.id = p.order_id WHERE p.gateway_reference = ? LIMIT 1',
    [params.vnp_TxnRef],
  );
  const payment = rows[0];
  if (!payment) return { error: 'Payment not found.', rspCode: '01' };

  if (Math.round(Number(payment.amount) * 100) !== Number(params.vnp_Amount)) {
    return { error: 'Invalid amount.', rspCode: '04' };
  }
  return { payment };
}

router.post('/vnpay', requireAuth, ensureCustomer, createVnpayPayment);
router.post('/vnpay/create', requireAuth, ensureCustomer, createVnpayPayment);

async function returnHandler(req, res, next) {
  const { config, missing } = paymentConfig();
  if (missing.length) {
    return res.status(503).json({ success: false, reason: 'VNPay is not configured.' });
  }

  try {
    const result = await findVerifiedPayment({ ...req.query }, config);
    if (result.error) {
      return res.status(400).json({ success: false, reason: result.error });
    }

    const { payment } = result;
    const gatewaySuccess = req.query.vnp_ResponseCode === '00'
      && req.query.vnp_TransactionStatus === '00';
    const succeeded = gatewaySuccess
      && payment.status === 'succeeded'
      && payment.order_payment_status === 'paid';

    return res.json({
      success: succeeded,
      pending: gatewaySuccess && payment.status === 'pending',
      orderCode: payment.order_code,
      paymentStatus: payment.status,
      reason: succeeded
        ? null
        : gatewaySuccess
          ? 'Payment confirmation is still being processed.'
          : 'VNPay declined or cancelled the transaction.',
    });
  } catch (error) {
    return next(error);
  }
}

router.get('/vnpay/return', returnHandler);
router.get('/vnpay/verify', returnHandler);

router.get('/vnpay/ipn', async (req, res) => {
  const { config, missing } = paymentConfig();
  if (missing.length) {
    return res.json({ RspCode: '99', Message: 'VNPay is not configured' });
  }

  const params = { ...req.query };
  if (!verifyQuerySignature(params, config.secret) || !validMerchant(params, config.tmnCode)) {
    return res.json({ RspCode: '97', Message: 'Invalid signature' });
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [rows] = await connection.query(
      'SELECT p.*, o.order_code, o.customer_id, o.restaurant_id, o.total_amount, o.status AS order_status, o.payment_status AS order_payment_status FROM payments p JOIN orders o ON o.id = p.order_id WHERE p.gateway_reference = ? FOR UPDATE',
      [params.vnp_TxnRef],
    );
    const payment = rows[0];

    if (!payment) {
      await connection.rollback();
      return res.json({ RspCode: '01', Message: 'Order not found' });
    }
    if (Math.round(Number(payment.amount) * 100) !== Number(params.vnp_Amount)) {
      await connection.rollback();
      return res.json({ RspCode: '04', Message: 'Invalid amount' });
    }
    if (payment.status === 'succeeded') {
      await connection.rollback();
      return res.json({ RspCode: '02', Message: 'Order already confirmed' });
    }

    const gatewaySuccess = params.vnp_ResponseCode === '00'
      && params.vnp_TransactionStatus === '00';

    if (!gatewaySuccess) {
      await connection.query(
        "UPDATE payments SET status = 'failed', failure_reason = ?, raw_response = ? WHERE id = ?",
        ['VNPay response ' + String(params.vnp_ResponseCode || 'unknown'), JSON.stringify(params), payment.id],
      );
      if (payment.order_payment_status !== 'paid') {
        await connection.query(
          "UPDATE orders SET payment_status = 'failed' WHERE id = ?",
          [payment.order_id],
        );
        await connection.query(
          "UPDATE voucher_redemptions SET status = 'released', released_at = NOW() WHERE order_id = ? AND status = 'reserved'",
          [payment.order_id],
        );
      }
      await connection.commit();
      return res.json({ RspCode: '00', Message: 'Confirm success' });
    }

    if (payment.order_payment_status === 'paid') {
      await connection.query(
        "UPDATE payments SET status = 'cancelled', failure_reason = 'Order was paid by another attempt', raw_response = ? WHERE id = ?",
        [JSON.stringify(params), payment.id],
      );
      await connection.commit();
      return res.json({ RspCode: '02', Message: 'Order already confirmed' });
    }

    const nextOrderStatus = payment.order_status === 'pending_payment'
      ? 'placed'
      : payment.order_status;
    await connection.query(
      "UPDATE payments SET status = 'succeeded', gateway_txn_id = ?, paid_at = NOW(), raw_response = ? WHERE id = ?",
      [params.vnp_TransactionNo || null, JSON.stringify(params), payment.id],
    );
    await connection.query(
      "UPDATE orders SET payment_status = 'paid', status = ? WHERE id = ?",
      [nextOrderStatus, payment.order_id],
    );
    await connection.query(
      "UPDATE voucher_redemptions SET status = 'redeemed', redeemed_at = NOW(), released_at = NULL WHERE order_id = ? AND status = 'reserved'",
      [payment.order_id],
    );

    if (nextOrderStatus !== payment.order_status) {
      await connection.query(
        "INSERT INTO order_status_logs (order_id, from_status, to_status, changed_by_role, note) VALUES (?, ?, ?, 'system', 'VNPay payment confirmed by IPN')",
        [payment.order_id, payment.order_status, nextOrderStatus],
      );
    }

    const [[recipient]] = await connection.query(
      'SELECT r.owner_user_id, u.full_name AS customer_name FROM restaurants r JOIN users u ON u.id = ? WHERE r.id = ? LIMIT 1',
      [payment.customer_id, payment.restaurant_id],
    );
    if (recipient) {
      await connection.query(
        "INSERT INTO notifications (user_id, type, title, body, link_url) VALUES (?, 'order_placed', ?, ?, '/merchant/orders')",
        [
          recipient.owner_user_id,
          'Don hang moi da thanh toan',
          (recipient.customer_name || 'Khach hang') + ' da thanh toan don ' + payment.order_code + '.',
        ],
      );
    }

    await connection.commit();
    return res.json({ RspCode: '00', Message: 'Confirm success' });
  } catch (error) {
    await connection.rollback();
    console.error('[VNPay IPN]', error);
    return res.json({ RspCode: '99', Message: 'Unknown error' });
  } finally {
    connection.release();
  }
});

router.post('/vnpay/ipn', (_req, res) => {
  res.status(405).json({ RspCode: '99', Message: 'Use GET for VNPay IPN' });
});

export default router;
