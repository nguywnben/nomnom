import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import pool from '../db/pool.js';
import crypto from 'crypto';

const router = Router();

// Hàm sắp xếp object tham số của VNPay
function sortObject(obj) {
  const sorted = {};
  const str = [];
  let key;
  for (key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      str.push(encodeURIComponent(key));
    }
  }
  str.sort();
  for (key = 0; key < str.length; key++) {
    sorted[str[key]] = encodeURIComponent(obj[str[key]]).replace(/%20/g, '+');
  }
  return sorted;
}

// Hàm định dạng ngày GMT+7 YYYYMMDDHHmmss
function getVnpayDateFormat(date) {
  const tzOffset = 7 * 60; // GMT+7
  const localTime = date.getTime();
  const localOffset = date.getTimezoneOffset() * 60000;
  const utc = localTime + localOffset;
  const vnTime = new Date(utc + 3600000 * 7);

  const pad = (n) => String(n).padStart(2, '0');

  const yyyy = vnTime.getFullYear();
  const MM = pad(vnTime.getMonth() + 1);
  const DD = pad(vnTime.getDate());
  const hh = pad(vnTime.getHours());
  const mm = pad(vnTime.getMinutes());
  const ss = pad(vnTime.getSeconds());

  return `${yyyy}${MM}${DD}${hh}${mm}${ss}`;
}

// 1. POST /api/v1/payments/vnpay/create: Tạo URL thanh toán VNPay
router.post('/vnpay/create', requireAuth, async (req, res, next) => {
  try {
    const { userId } = req.auth;
    const { orderId } = req.body;

    if (!orderId) {
      return res.status(400).json({ error: 'Thiếu mã orderId' });
    }

    // Truy vấn đơn hàng
    const [orders] = await pool.query(
      'SELECT * FROM orders WHERE id = ? AND customer_id = ?',
      [orderId, userId]
    );
    const order = orders[0];

    if (!order) {
      return res.status(404).json({ error: 'Không tìm thấy đơn hàng' });
    }

    if (order.payment_method !== 'vnpay') {
      return res.status(400).json({ error: 'Phương thức thanh toán đơn hàng này không phải là VNPay' });
    }

    if (order.payment_status === 'paid') {
      return res.status(400).json({ error: 'Đơn hàng này đã được thanh toán' });
    }

    const ipAddr = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
    const tmnCode = process.env.VNPAY_TMN_CODE;
    const secretKey = process.env.VNPAY_HASH_SECRET;
    const vnpUrl = process.env.VNPAY_URL;
    const returnUrl = process.env.VNPAY_RETURN_URL;

    const createDate = getVnpayDateFormat(new Date());

    const vnp_Params = {
      vnp_Version: '2.1.0',
      vnp_Command: 'pay',
      vnp_TmnCode: tmnCode,
      vnp_Locale: 'vn',
      vnp_CurrCode: 'VND',
      vnp_TxnRef: order.order_code,
      vnp_OrderInfo: `Thanh toan don hang ${order.order_code}`,
      vnp_OrderType: 'other',
      vnp_Amount: Math.round(order.total_amount * 100),
      vnp_ReturnUrl: returnUrl,
      vnp_IpAddr: ipAddr,
      vnp_CreateDate: createDate,
    };

    const sortedParams = sortObject(vnp_Params);
    const signData = Object.keys(sortedParams)
      .map((key) => `${key}=${sortedParams[key]}`)
      .join('&');

    const hmac = crypto.createHmac('sha512', secretKey);
    const secureHash = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

    const paymentUrl = `${vnpUrl}?${signData}&vnp_SecureHash=${secureHash}`;

    res.json({ paymentUrl });
  } catch (err) {
    next(err);
  }
});

// Helper thực hiện nghiệp vụ cập nhật đơn hàng khi thanh toán thành công
async function confirmPaymentSuccess(orderCode, transactionNo, rawResponse) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // Lấy thông tin đơn hàng
    const [orders] = await connection.query(
      'SELECT * FROM orders WHERE order_code = ?',
      [orderCode]
    );
    const order = orders[0];

    if (!order) {
      await connection.rollback();
      return { success: false, code: '01', message: 'Order not found' };
    }

    // Nếu đã thanh toán rồi
    if (order.payment_status === 'paid') {
      await connection.rollback();
      return { success: true, code: '02', message: 'Order already processed', order };
    }

    // Cập nhật trạng thái đơn hàng
    const fromStatus = order.status;
    const toStatus = fromStatus === 'pending_payment' ? 'placed' : fromStatus;
    
    await connection.query(
      'UPDATE orders SET payment_status = ?, status = ? WHERE id = ?',
      ['paid', toStatus, order.id]
    );

    // Tạo bản ghi trong bảng payments
    await connection.query(
      `INSERT INTO payments (order_id, method, amount, currency, gateway, gateway_txn_id, status, paid_at, raw_response)
       VALUES (?, 'vnpay', ?, 'VND', 'vnpay', ?, 'succeeded', NOW(), ?)`,
      [order.id, order.total_amount, transactionNo, JSON.stringify(rawResponse)]
    );

    // Lưu log trạng thái nếu có chuyển trạng thái
    if (fromStatus !== toStatus) {
      await connection.query(
        `INSERT INTO order_status_logs (order_id, from_status, to_status, changed_by_role, note)
         VALUES (?, ?, ?, 'system', 'VNPay xác nhận thanh toán thành công')`,
        [order.id, fromStatus, toStatus]
      );
    }

    await connection.commit();
    return { success: true, code: '00', message: 'Confirm success', order };
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
}

// 2. GET /api/v1/payments/vnpay/verify: Xác thực giao dịch và cập nhật DB (gọi từ VnpayReturn Frontend)
router.get('/vnpay/verify', async (req, res, next) => {
  try {
    const vnp_Params = { ...req.query };
    const secureHash = vnp_Params['vnp_SecureHash'];

    delete vnp_Params['vnp_SecureHash'];
    delete vnp_Params['vnp_SecureHashType'];

    const secretKey = process.env.VNPAY_HASH_SECRET;
    const sortedParams = sortObject(vnp_Params);
    
    const signData = Object.keys(sortedParams)
      .map((key) => `${key}=${sortedParams[key]}`)
      .join('&');

    const hmac = crypto.createHmac('sha512', secretKey);
    const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

    if (secureHash !== signed) {
      return res.status(400).json({ success: false, reason: 'Chữ ký bảo mật không khớp' });
    }

    const orderCode = vnp_Params['vnp_TxnRef'];
    const responseCode = vnp_Params['vnp_ResponseCode'];
    const transactionNo = vnp_Params['vnp_TransactionNo'];

    if (responseCode === '00') {
      const result = await confirmPaymentSuccess(orderCode, transactionNo, req.query);
      if (result.success) {
        return res.json({ success: true, orderCode });
      } else {
        return res.status(400).json({ success: false, reason: result.message });
      }
    } else {
      return res.json({ success: false, reason: `Giao dịch thất bại với mã phản hồi: ${responseCode}` });
    }
  } catch (err) {
    next(err);
  }
});

// 3. POST /api/v1/payments/vnpay/ipn: Nhận thông báo IPN từ server VNPay (Server-to-Server)
router.post('/vnpay/ipn', async (req, res, next) => {
  try {
    const vnp_Params = { ...req.body };
    const secureHash = vnp_Params['vnp_SecureHash'];

    delete vnp_Params['vnp_SecureHash'];
    delete vnp_Params['vnp_SecureHashType'];

    const secretKey = process.env.VNPAY_HASH_SECRET;
    const sortedParams = sortObject(vnp_Params);
    
    const signData = Object.keys(sortedParams)
      .map((key) => `${key}=${sortedParams[key]}`)
      .join('&');

    const hmac = crypto.createHmac('sha512', secretKey);
    const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

    if (secureHash !== signed) {
      return res.json({ RspCode: '97', Message: 'Invalid signature' });
    }

    const orderCode = vnp_Params['vnp_TxnRef'];
    const responseCode = vnp_Params['vnp_ResponseCode'];
    const transactionNo = vnp_Params['vnp_TransactionNo'];
    const amount = Number(vnp_Params['vnp_Amount']);

    // Tìm đơn hàng để đối soát số tiền
    const [orders] = await pool.query('SELECT * FROM orders WHERE order_code = ?', [orderCode]);
    const order = orders[0];

    if (!order) {
      return res.json({ RspCode: '01', Message: 'Order not found' });
    }

    if (Math.round(order.total_amount * 100) !== amount) {
      return res.json({ RspCode: '04', Message: 'Invalid amount' });
    }

    if (order.payment_status === 'paid') {
      return res.json({ RspCode: '02', Message: 'Order already confirmed' });
    }

    if (responseCode === '00') {
      await confirmPaymentSuccess(orderCode, transactionNo, req.body);
      return res.json({ RspCode: '00', Message: 'Confirm success' });
    } else {
      // Cập nhật payment_status thành thất bại
      await pool.query('UPDATE orders SET payment_status = ? WHERE id = ?', ['failed', order.id]);
      return res.json({ RspCode: '00', Message: 'Confirm success' });
    }
  } catch (err) {
    next(err);
  }
});

export default router;
