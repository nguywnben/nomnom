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

    const minutesPassed = (Date.now() - new Date(order.created_at).getTime()) / 60000;
    if (minutesPassed > 30) {
      await connection.query(
        "UPDATE orders SET status = 'expired', payment_status = 'failed' WHERE id = ?",
        [order.id]
      );
      await connection.query(
        `INSERT INTO order_status_logs (order_id, from_status, to_status, changed_by_role, note)
         VALUES (?, ?, 'expired', 'system', 'Hết hạn thanh toán (quá 30 phút)')`,
        [order.id, order.status]
      );
      await connection.commit();
      return res.status(400).json({ error: 'Đơn hàng đã hết hạn thanh toán (quá 30 phút).' });
    }

    if (order.status !== 'pending_payment' && order.status !== 'payment_failed') {
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

    const orderExpiryTime = new Date(new Date(order.created_at).getTime() + 30 * 60 * 1000);
    const built = buildPaymentUrl({
      paymentUrl: config.paymentUrl,
      secret: config.secret,
      tmnCode: config.tmnCode,
      txnRef: gatewayReference,
      amount: order.total_amount,
      returnUrl: config.returnUrl,
      ipAddress: clientIp(req),
      orderInfo: 'Thanh toan don hang ' + order.order_code,
      expireAt: orderExpiryTime,
    });

    await connection.query(
      "UPDATE payments SET gateway_reference = ?, status = 'pending', raw_response = ? WHERE id = ?",
      [gatewayReference, JSON.stringify({ request: built.params }), paymentResult.insertId],
    );
    if (order.payment_status === 'failed') {
      await connection.query("UPDATE orders SET payment_status = 'unpaid' WHERE id = ?", [order.id]);
    }

    await connection.commit();
    const expiresInSeconds = Math.min(900, Math.max(0, Math.floor((orderExpiryTime.getTime() - Date.now()) / 1000)));
    return res.json({
      paymentUrl: built.paymentUrl,
      paymentId: paymentResult.insertId,
      expiresInSeconds,
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

async function processPaymentSuccess(connection, payment, params) {
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
      "INSERT INTO order_status_logs (order_id, from_status, to_status, changed_by_role, note) VALUES (?, ?, ?, 'system', 'VNPay payment confirmed')",
      [payment.order_id, payment.order_status, nextOrderStatus],
    );
  }

  // Xóa giỏ hàng active của khách hàng khi thanh toán thành công
  await connection.query(
    "DELETE FROM carts WHERE customer_id = ? AND restaurant_id = ?",
    [payment.customer_id, payment.restaurant_id]
  );

  // Gửi thông báo cho merchant
  const [[recipient]] = await connection.query(
    'SELECT r.owner_user_id, u.full_name AS customer_name FROM restaurants r JOIN users u ON u.id = ? WHERE r.id = ? LIMIT 1',
    [payment.customer_id, payment.restaurant_id],
  );
  if (recipient) {
    const [itemCountRows] = await connection.query(
      'SELECT SUM(quantity) as totalItems FROM order_items WHERE order_id = ?',
      [payment.order_id]
    );
    const itemCount = itemCountRows[0]?.totalItems || 1;
    await connection.query(
      "INSERT INTO notifications (user_id, type, title, body, link_url) VALUES (?, 'order_placed', ?, ?, '/merchant/orders')",
      [
        recipient.owner_user_id,
        'Đơn hàng mới đã thanh toán',
        `${recipient.customer_name || 'Khách hàng'} đã thanh toán đơn ${payment.order_code} với ${itemCount} món.`,
      ],
    );
  }
}

async function processPaymentFailure(connection, payment, params) {
  await connection.query(
    "UPDATE payments SET status = 'failed', failure_reason = ?, raw_response = ? WHERE id = ?",
    ['VNPay response ' + String(params.vnp_ResponseCode || 'unknown'), JSON.stringify(params), payment.id],
  );

  if (payment.order_payment_status !== 'paid') {
    await connection.query(
      "UPDATE orders SET payment_status = 'failed', status = 'payment_failed' WHERE id = ?",
      [payment.order_id],
    );
    await connection.query(
      "UPDATE voucher_redemptions SET status = 'released', released_at = NOW() WHERE order_id = ? AND status = 'reserved'",
      [payment.order_id],
    );
    await connection.query(
      "INSERT INTO order_status_logs (order_id, from_status, to_status, changed_by_role, note) VALUES (?, ?, 'payment_failed', 'system', 'VNPay payment failed')",
      [payment.order_id, payment.order_status],
    );
  }
}

async function returnHandler(req, res, next) {
  const { config, missing } = paymentConfig();
  if (missing.length) {
    return res.status(503).json({ success: false, reason: 'VNPay is not configured.' });
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const [rows] = await connection.query(
      `SELECT p.*, o.order_code, o.customer_id, o.restaurant_id, o.total_amount, 
              o.status AS order_status, o.payment_status AS order_payment_status 
       FROM payments p 
       JOIN orders o ON o.id = p.order_id 
       WHERE p.gateway_reference = ? 
       FOR UPDATE`,
      [req.query.vnp_TxnRef],
    );
    const payment = rows[0];

    if (!payment) {
      await connection.rollback();
      return res.status(404).json({ success: false, reason: 'Payment not found.' });
    }

    if (!verifyQuerySignature(req.query, config.secret) || !validMerchant(req.query, config.tmnCode)) {
      await connection.rollback();
      return res.status(400).json({ success: false, reason: 'Invalid signature or merchant.' });
    }

    if (Math.round(Number(payment.amount) * 100) !== Number(req.query.vnp_Amount)) {
      await connection.rollback();
      return res.status(400).json({ success: false, reason: 'Invalid amount.' });
    }

    const gatewaySuccess = req.query.vnp_ResponseCode === '00'
      && req.query.vnp_TransactionStatus === '00';

    if (gatewaySuccess) {
      if (payment.status !== 'succeeded') {
        await processPaymentSuccess(connection, payment, req.query);
      }
      await connection.commit();
      return res.json({
        success: true,
        orderCode: payment.order_code,
        paymentStatus: 'succeeded',
        reason: null,
      });
    } else {
      if (payment.status !== 'failed' && payment.status !== 'succeeded') {
        await processPaymentFailure(connection, payment, req.query);
      }
      await connection.commit();
      return res.json({
        success: false,
        orderCode: payment.order_code,
        paymentStatus: 'failed',
        reason: 'VNPay declined or cancelled the transaction.',
      });
    }
  } catch (error) {
    await connection.rollback();
    return next(error);
  } finally {
    connection.release();
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
      `SELECT p.*, o.order_code, o.customer_id, o.restaurant_id, o.total_amount, 
              o.status AS order_status, o.payment_status AS order_payment_status 
       FROM payments p 
       JOIN orders o ON o.id = p.order_id 
       WHERE p.gateway_reference = ? 
       FOR UPDATE`,
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

    const gatewaySuccess = params.vnp_ResponseCode === '00'
      && params.vnp_TransactionStatus === '00';

    if (gatewaySuccess) {
      if (payment.status === 'succeeded') {
        await connection.rollback();
        return res.json({ RspCode: '02', Message: 'Order already confirmed' });
      }
      await processPaymentSuccess(connection, payment, params);
      await connection.commit();
      return res.json({ RspCode: '00', Message: 'Confirm success' });
    } else {
      if (payment.status === 'failed') {
        await connection.rollback();
        return res.json({ RspCode: '02', Message: 'Order already confirmed' });
      }
      await processPaymentFailure(connection, payment, params);
      await connection.commit();
      return res.json({ RspCode: '00', Message: 'Confirm success' });
    }
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
