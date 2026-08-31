import { Router } from 'express';
import { requireAuth, ensureCustomer } from '../middleware/auth.js';
import pool from '../db/pool.js';
import { evaluateVoucher } from '../lib/voucher.js';
import { buildShippingQuote } from '../lib/shippingQuote.js';
import crypto from 'crypto';
import { normalizeReviewSubmission, refreshReviewStats } from '../lib/reviewSubmission.js';
import { creditMerchantForDeliveredOrder } from '../lib/merchantOrders.js';
import { validateCheckoutAvailability } from '../lib/checkoutValidation.js';
import {
  buildCheckoutRequestHash,
  normalizeIdempotencyKey,
} from '../lib/checkoutIdempotency.js';

const router = Router();
router.use(requireAuth);
router.use(ensureCustomer);


// Lấy danh sách cart active
async function getActiveCart(connection, customerId) {
  const [carts] = await connection.query(
    `SELECT * FROM carts WHERE customer_id = ? AND status = 'active' LIMIT 1 FOR UPDATE`,
    [customerId]
  );
  return carts[0];
}

// Hàm sinh mã đơn hàng
function generateOrderCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Không có 0, O, 1, I
  let code = '';
  for (let i = 0; i < 5; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `ORD-${code}`;
}

router.post('/', requireAuth, async (req, res, next) => {
  const connection = await pool.getConnection();
  try {
    const { userId: customerId } = req.auth;
    const { addressId, paymentMethod, customerNote, voucherCode } = req.body;
    const idempotencyKey = normalizeIdempotencyKey(req.get('Idempotency-Key'));
    const requestHash = buildCheckoutRequestHash({ addressId, paymentMethod, customerNote, voucherCode });

    if (!['cod', 'vnpay'].includes(paymentMethod)) {
      return res.status(400).json({ error: 'Phương thức thanh toán không hợp lệ' });
    }

    await connection.beginTransaction();

    await connection.query(
      `INSERT INTO order_checkout_idempotency (customer_id, idempotency_key, request_hash)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE id = LAST_INSERT_ID(id)`,
      [customerId, idempotencyKey, requestHash],
    );
    const [[checkoutAttempt]] = await connection.query(
      `SELECT request_hash, order_id
       FROM order_checkout_idempotency
       WHERE customer_id = ? AND idempotency_key = ?
       FOR UPDATE`,
      [customerId, idempotencyKey],
    );
    if (checkoutAttempt.request_hash !== requestHash) {
      await connection.rollback();
      return res.status(409).json({
        error: 'Khóa đặt hàng đã được dùng cho một yêu cầu khác.',
        code: 'IDEMPOTENCY_KEY_REUSED',
      });
    }
    if (checkoutAttempt.order_id) {
      const [[existingOrder]] = await connection.query(
        'SELECT * FROM orders WHERE id = ? AND customer_id = ? LIMIT 1',
        [checkoutAttempt.order_id, customerId],
      );
      await connection.commit();
      return res.status(200).json({ order: existingOrder, idempotent: true });
    }

    // 1. Đọc cart
    const cart = await getActiveCart(connection, customerId);
    if (!cart) {
      await connection.rollback();
      return res.status(400).json({ error: 'Giỏ hàng rỗng' });
    }

    // Lấy cart items + menu items info
    const [cartItems] = await connection.query(
      `SELECT ci.*, m.name as item_name, m.price, m.prep_time_min,
              m.restaurant_id AS menu_restaurant_id, m.status AS menu_status, m.in_stock
       FROM cart_items ci
       JOIN menu_items m ON ci.menu_item_id = m.id
       WHERE ci.cart_id = ?`,
      [cart.id]
    );

    if (cartItems.length === 0) {
      await connection.rollback();
      return res.status(400).json({ error: 'Giỏ hàng rỗng' });
    }

    // 2. Lấy thông tin address
    let deliveryAddress;
    if (addressId) {
      const [addrs] = await connection.query(
        `SELECT * FROM customer_addresses WHERE id = ? AND customer_id = ?`,
        [addressId, customerId]
      );
      deliveryAddress = addrs[0];
    } else {
      // Hardcode temp
      const [addrs] = await connection.query(
        `SELECT * FROM customer_addresses WHERE customer_id = ? ORDER BY is_default DESC LIMIT 1`,
        [customerId]
      );
      deliveryAddress = addrs[0];
    }

    if (!deliveryAddress) {
      await connection.rollback();
      return res.status(400).json({ error: 'Địa chỉ giao hàng không hợp lệ' });
    }

    // 3. Thông tin nhà hàng
    const [rests] = await connection.query(
      `SELECT * FROM restaurants WHERE id = ? FOR UPDATE`,
      [cart.restaurant_id]
    );
    const restaurant = rests[0];

    validateCheckoutAvailability(restaurant, cartItems);

    let shippingQuote;
    try {
      shippingQuote = await buildShippingQuote({
        restaurant,
        address: deliveryAddress,
      });
    } catch (error) {
      await connection.rollback();
      if (String(error?.code ?? '').startsWith('SHIPPING_')) return res.status(400).json({ error: error.message, code: error.code });
      throw error;
    }

    let voucher = null;
    let voucherDiscount = 0;
    const normalizedVoucherCode = String(voucherCode ?? '').trim().toUpperCase();
    if (normalizedVoucherCode) {
      const [voucherRows] = await connection.query(
        "SELECT * FROM vouchers WHERE code = ? AND (restaurant_id IS NULL OR restaurant_id = ?) LIMIT 1 FOR UPDATE",
        [normalizedVoucherCode, restaurant.id],
      );
      voucher = voucherRows[0] ?? null;
      if (!voucher) {
        await connection.rollback();
        return res.status(400).json({ error: 'Mã khuyến mãi không hợp lệ cho quán này.' });
      }
    }

    // 4. Tính toán tiền theo công thức đơn giản
    const subtotal = cartItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    const minOrderAmount = Number(restaurant.min_order_amount ?? 0);
    if (minOrderAmount > 0 && subtotal < minOrderAmount) {
      await connection.rollback();
      return res.status(400).json({
        error: `Đơn hàng tối thiểu của quán là ${minOrderAmount.toLocaleString('vi-VN')} ₫ (hiện tại: ${subtotal.toLocaleString('vi-VN')} ₫). Vui lòng chọn thêm món.`,
        code: 'MIN_ORDER_AMOUNT_NOT_MET',
      });
    }
    const delivery_fee = shippingQuote.total;
    if (voucher) {
      const [[voucherUsageRow]] = await connection.query(
        "SELECT COUNT(*) AS totalUsage, COALESCE(SUM(CASE WHEN customer_id = ? THEN 1 ELSE 0 END), 0) AS customerUsage FROM voucher_redemptions WHERE voucher_id = ? AND status IN ('reserved', 'redeemed')",
        [customerId, voucher.id],
      );
      const evaluation = evaluateVoucher(voucher, {
        subtotal,
        restaurantId: restaurant.id,
        totalUsage: Number(voucherUsageRow?.totalUsage ?? 0),
        customerUsage: Number(voucherUsageRow?.customerUsage ?? 0),
      });
      if (!evaluation.ok) {
        await connection.rollback();
        return res.status(400).json({
          error: 'Voucher cannot be applied.',
          reason: evaluation.reason,
        });
      }
      voucherDiscount = evaluation.discountAmount;
    }
    const discount_amount = voucherDiscount;
    const total_amount = Math.max(0, subtotal + delivery_fee - discount_amount);

    // HẠCH TOÁN DOANH THU & DÒNG TIỀN CHUẨN:
    // Nếu mã do Quán ăn tạo (voucher.restaurant_id !== null) -> Quán tự chịu phần giảm giá.
    // Nếu mã do Sàn tài trợ (voucher.restaurant_id === null) -> Sàn chi trả khuyến mãi, Quán hưởng trọn giá gốc món.
    const isMerchantVoucher = voucher && voucher.restaurant_id !== null;
    const merchantBillableSubtotal = isMerchantVoucher
      ? Math.max(0, subtotal - discount_amount)
      : subtotal;
    const platform_commission = Math.floor(merchantBillableSubtotal * Number(restaurant.commission_rate) / 100);
    const merchant_earning = merchantBillableSubtotal - platform_commission;
    // Phí dịch vụ nền tảng (hoa hồng sàn + phí giao hàng)
    const platform_fee = platform_commission + delivery_fee;

    // 5. Tính toán khoảng cách và thời gian giao hàng dự kiến
    let distance_km = shippingQuote.distanceKm;

    // Tìm thời gian chuẩn bị món lâu nhất
    const max_prep_time = cartItems.reduce((max, i) => Math.max(max, i.prep_time_min), 0);
    // Thời gian chuẩn bị dự kiến + mặc định 15 phút giao hàng
    const est_time_add = (restaurant.avg_prep_time_min || max_prep_time) + shippingQuote.durationMin;

    const placed_at = new Date();
    const estimated_delivery_at = new Date(placed_at.getTime() + est_time_add * 60000);

    const snapshotAddress = `${deliveryAddress.line1}, ${deliveryAddress.ward ? deliveryAddress.ward + ', ' : ''}${deliveryAddress.district ? deliveryAddress.district + ', ' : ''}${deliveryAddress.city}`;

    // 6. Gán trạng thái đơn hàng dựa trên phương thức thanh toán
    let status = 'placed';
    let payment_status = 'unpaid';
    if (paymentMethod === 'vnpay') {
      status = 'pending_payment';
    }

    const orderCode = generateOrderCode();

    const [orderResult] = await connection.query(
      `INSERT INTO orders (
        order_code, customer_id, restaurant_id, voucher_id, delivery_address_id, delivery_address_snapshot,
        delivery_lat, delivery_lng, pickup_lat, pickup_lng, distance_km,
        subtotal, delivery_fee, discount_amount, voucher_code_snapshot, total_amount,
        merchant_earning, platform_fee,
        status, payment_status, payment_method, customer_note, estimated_delivery_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        orderCode,
        customerId,
        restaurant.id,
        voucher ? voucher.id : null,
        deliveryAddress.id,
        snapshotAddress,
        Number(deliveryAddress.latitude),
        Number(deliveryAddress.longitude),
        Number(restaurant.latitude),
        Number(restaurant.longitude),
        distance_km,
        subtotal,
        delivery_fee,
        discount_amount,
        voucher ? voucher.code : null,
        total_amount,
        merchant_earning,
        platform_fee,
        status,
        payment_status,
        paymentMethod,
        customerNote || null,
        estimated_delivery_at,
      ]
    );

    const orderId = orderResult.insertId;

    await connection.query(
      `UPDATE order_checkout_idempotency
       SET order_id = ?
       WHERE customer_id = ? AND idempotency_key = ?`,
      [orderId, customerId, idempotencyKey],
    );

    // 7. Tạo order items
    for (const item of cartItems) {
      await connection.query(
        `INSERT INTO order_items (
          order_id, menu_item_id, item_name_snapshot, unit_price_snapshot, quantity, line_subtotal, note
        ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          orderId, item.menu_item_id, item.item_name, item.price, item.quantity,
          item.price * item.quantity, item.note || null
        ]
      );
    }

    if (voucher) {
      const redemptionStatus = paymentMethod === 'vnpay' ? 'reserved' : 'redeemed';
      await connection.query(
        "INSERT INTO voucher_redemptions (voucher_id, customer_id, order_id, discount_amount, status, redeemed_at) VALUES (?, ?, ?, ?, ?, ?)",
        [
          voucher.id,
          customerId,
          orderId,
          discount_amount,
          redemptionStatus,
          redemptionStatus === 'redeemed' ? new Date() : null,
        ],
      );
    }


    // Lưu bản ghi trạng thái (Status log)
    await connection.query(
      `INSERT INTO order_status_logs (order_id, to_status, changed_by_role, changed_by_user_id, note)
       VALUES (?, ?, 'customer', ?, 'Khách tạo đơn')`,
      [orderId, status, customerId]
    );

    if (paymentMethod === 'cod') {
      const [customerRows] = await connection.query(
        'SELECT full_name FROM users WHERE id = ? LIMIT 1',
        [customerId],
      );
      const customerName = customerRows[0]?.full_name ?? 'Khách hàng';
      const itemCount = cartItems.reduce((sum, item) => sum + Number(item.quantity), 0);

      await connection.query(
        `INSERT INTO notifications (user_id, type, title, body, link_url)
         VALUES (?, 'order_placed', ?, ?, '/merchant/orders')`,
        [
          restaurant.owner_user_id,
          'Đơn hàng mới',
          `${customerName} đặt đơn ${orderCode} với ${itemCount} món.`,
        ],
      );
    }

    // 8. Đổi giỏ hàng sang converted (Xóa cứng) - xóa giỏ hàng ngay khi đã tạo đơn hàng thành công
    await connection.query(
      `DELETE FROM carts WHERE id = ?`,
      [cart.id]
    );

    // Truy vấn lại thông tin đơn hàng vừa lưu
    const [orders] = await connection.query(
      `SELECT * FROM orders WHERE id = ?`,
      [orderId]
    );

    await connection.commit();
    res.status(201).json({ order: orders[0] });

  } catch (err) {
    await connection.rollback();
    next(err);
  } finally {
    connection.release();
  }
});

router.get('/', requireAuth, async (req, res, next) => {
  try {
    const { userId } = req.auth;
    const { restaurantId } = req.query;

    let query = `SELECT o.*
                 FROM orders o
                 WHERE o.customer_id = ? `;
    const params = [userId];

    if (restaurantId) {
      query += ` AND o.restaurant_id = ? `;
      params.push(restaurantId);
    }

    query += ` ORDER BY o.created_at DESC`;

    const [orders] = await pool.query(query, params);

    if (orders.length === 0) {
      return res.json([]);
    }

    const orderIds = orders.map(o => o.id);
    const [items] = await pool.query(
      `SELECT * FROM order_items WHERE order_id IN (?)`,
      [orderIds]
    );
    const [reviewRows] = await pool.query(
      'SELECT id, order_id, menu_item_id FROM reviews WHERE order_id IN (?)',
      [orderIds],
    );

    const restaurantIds = [...new Set(orders.map(o => o.restaurant_id))];
    const [rests] = await pool.query(
      `SELECT id, name, address_line, banner_url, phone FROM restaurants WHERE id IN (?)`,
      [restaurantIds]
    );

    const restMap = {};
    rests.forEach(r => { restMap[r.id] = r; });

    const formattedOrders = orders.map(o => {
      const orderItems = items.filter(i => i.order_id === o.id);
      const orderReviews = reviewRows.filter((review) => Number(review.order_id) === Number(o.id));
      const reviewedMenuItemIds = orderReviews
        .filter((review) => review.menu_item_id !== null)
        .map((review) => Number(review.menu_item_id));
      const restaurantReview = orderReviews.find((review) => review.menu_item_id === null);
      const uniqueOrderItemIds = [...new Set(orderItems.map((item) => Number(item.menu_item_id)))];
      return {
        ...o,
        restaurant: restMap[o.restaurant_id],
        items: orderItems,
        reviewId: restaurantReview ? Number(restaurantReview.id) : null,
        restaurantReviewed: Boolean(restaurantReview),
        reviewedMenuItemIds,
        isReviewed: Boolean(restaurantReview) && uniqueOrderItemIds.every((itemId) => reviewedMenuItemIds.includes(itemId)),
      };
    });

    res.json(formattedOrders);
  } catch (err) {
    next(err);
  }
});

router.get('/:idOrCode', requireAuth, async (req, res, next) => {
  try {
    const { userId } = req.auth;
    const { idOrCode } = req.params;

    let query = `SELECT o.* FROM orders o WHERE o.customer_id = ? AND `;
    let params = [userId];

    if (idOrCode.startsWith('ORD-')) {
      query += `o.order_code = ?`;
      params.push(idOrCode);
    } else {
      query += `o.id = ?`;
      params.push(idOrCode);
    }

    const [orders] = await pool.query(query, params);

    if (orders.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const order = orders[0];
    // Lấy thông tin order items
    const [items] = await pool.query(
      `SELECT
         oi.id,
         oi.menu_item_id AS menuItemId,
         oi.item_name_snapshot AS name,
         oi.unit_price_snapshot AS unitPrice,
         oi.quantity,
         oi.line_subtotal AS lineSubtotal,
         oi.note,
         m.image_url AS imageUrl
       FROM order_items oi
       LEFT JOIN menu_items m ON oi.menu_item_id = m.id
       WHERE oi.order_id = ?`,
      [order.id]
    );
    order.items = items;

    const [orderReviews] = await pool.query(
      'SELECT id, menu_item_id FROM reviews WHERE order_id = ?',
      [order.id],
    );
    const restaurantReview = orderReviews.find((review) => review.menu_item_id === null);
    order.reviewId = restaurantReview ? Number(restaurantReview.id) : null;
    order.restaurantReviewed = Boolean(restaurantReview);
    order.reviewedMenuItemIds = orderReviews
      .filter((review) => review.menu_item_id !== null)
      .map((review) => Number(review.menu_item_id));
    const uniqueOrderItemIds = [...new Set(items.map((item) => Number(item.menuItemId)))];
    order.isReviewed = Boolean(restaurantReview)
      && uniqueOrderItemIds.every((itemId) => order.reviewedMenuItemIds.includes(itemId));

    // Lấy thông tin nhà hàng liên quan
    const [rests] = await pool.query(
      `SELECT id, name, address_line, banner_url, phone FROM restaurants WHERE id = ?`,
      [order.restaurant_id]
    );
    order.restaurant = rests[0];

    res.json(order);
  } catch (err) {
    next(err);
  }
});

router.post('/:idOrCode/confirm-delivery', requireAuth, ensureCustomer, async (req, res, next) => {
  const { userId } = req.auth;
  const idOrCode = String(req.params.idOrCode ?? '');
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const isCode = idOrCode.startsWith('ORD-');
    const [rows] = await connection.query(
      `SELECT * FROM orders WHERE customer_id = ? AND ${isCode ? 'order_code' : 'id'} = ? FOR UPDATE`,
      [userId, idOrCode],
    );
    const order = rows[0];
    if (!order) {
      await connection.rollback();
      return res.status(404).json({ error: 'Không tìm thấy đơn hàng.' });
    }
    if (order.status !== 'delivering') {
      await connection.rollback();
      return res.status(409).json({ error: 'Chỉ có thể xác nhận khi đơn hàng đang giao.' });
    }
    await connection.query(
      "UPDATE orders SET status = 'delivered', delivered_at = NOW(), updated_at = NOW() WHERE id = ?",
      [order.id],
    );
    await connection.query(
      `INSERT INTO order_status_logs (order_id, from_status, to_status, changed_by_role, changed_by_user_id, note)
       VALUES (?, 'delivering', 'delivered', 'customer', ?, 'Khách hàng xác nhận đã nhận hàng.')`,
      [order.id, userId],
    );
    await creditMerchantForDeliveredOrder(connection, order);
    const [restaurantRows] = await connection.query('SELECT owner_user_id, name FROM restaurants WHERE id = ? LIMIT 1', [order.restaurant_id]);
    if (restaurantRows[0]) {
      await connection.query(
        `INSERT INTO notifications (user_id, type, title, body, link_url)
         VALUES (?, 'order_delivered', 'Khách đã nhận hàng', ?, '/merchant/orders')`,
        [restaurantRows[0].owner_user_id, 'Khách hàng đã xác nhận nhận đơn ' + order.order_code + '.',],
      );
    }
    await connection.commit();
    return res.json({ ok: true, status: 'delivered' });
  } catch (error) {
    await connection.rollback();
    return next(error);
  } finally {
    connection.release();
  }
});

router.post('/:idOrCode/review', requireAuth, async (req, res, next) => {
  const connection = await pool.getConnection();
  try {
    const { userId } = req.auth;
    const { idOrCode } = req.params;

    await connection.beginTransaction();

    // 1. Tìm đơn hàng
    let query = `SELECT * FROM orders WHERE customer_id = ? AND `;
    let params = [userId];

    if (idOrCode.startsWith('ORD-')) {
      query += `order_code = ?`;
      params.push(idOrCode);
    } else {
      query += `id = ?`;
      params.push(idOrCode);
    }

    const [orders] = await connection.query(query, params);

    if (orders.length === 0) {
      await connection.rollback();
      return res.status(404).json({ error: 'Không tìm thấy đơn hàng' });
    }

    const order = orders[0];

    // 2. Ràng buộc: Chỉ cho phép đánh giá khi đơn hàng đã được giao thành công
    if (order.status !== 'delivered') {
      await connection.rollback();
      return res.status(403).json({ error: 'Chỉ đơn hàng đã giao thành công mới được đánh giá.' });
    }

    const [orderItemRows] = await connection.query(
      'SELECT DISTINCT menu_item_id FROM order_items WHERE order_id = ?',
      [order.id],
    );

    let submission;
    try {
      submission = normalizeReviewSubmission(
        req.body,
        orderItemRows.map((item) => item.menu_item_id),
      );
    } catch (validationError) {
      await connection.rollback();
      return res.status(400).json({ error: validationError.message });
    }

    const [existingReviews] = await connection.query(
      'SELECT menu_item_id FROM reviews WHERE order_id = ? FOR UPDATE',
      [order.id],
    );
    const hasExistingRestaurantReview = existingReviews.some((review) => review.menu_item_id === null);
    const existingDishIds = new Set(existingReviews.filter((review) => review.menu_item_id !== null).map((review) => Number(review.menu_item_id)));
    if (
      (submission.restaurantReview && hasExistingRestaurantReview)
      || submission.dishReviews.some((review) => existingDishIds.has(review.menuItemId))
    ) {
      await connection.rollback();
      return res.status(409).json({ error: 'Một nội dung trong đơn hàng này đã được đánh giá trước đó.' });
    }

    const insertedIds = [];
    if (submission.restaurantReview) {
      const [insertRes] = await connection.query(
        `INSERT INTO reviews (order_id, customer_id, restaurant_id, menu_item_id, rating, comment, is_edited)
         VALUES (?, ?, ?, NULL, ?, ?, 0)`,
        [order.id, userId, order.restaurant_id, submission.restaurantReview.rating, submission.restaurantReview.comment],
      );
      insertedIds.push(insertRes.insertId);
    }

    for (const review of submission.dishReviews) {
      const [insertRes] = await connection.query(
        `INSERT INTO reviews (order_id, customer_id, restaurant_id, menu_item_id, rating, comment, is_edited)
         VALUES (?, ?, ?, ?, ?, ?, 0)`,
        [order.id, userId, order.restaurant_id, review.menuItemId, review.rating, review.comment],
      );
      insertedIds.push(insertRes.insertId);
    }

    await refreshReviewStats(connection, {
      restaurantId: order.restaurant_id,
      menuItemIds: submission.dishReviews.map((review) => review.menuItemId),
    });

    const [restaurantOwner] = await connection.query(
      'SELECT owner_user_id FROM restaurants WHERE id = ? LIMIT 1',
      [order.restaurant_id],
    );
    if (restaurantOwner[0]?.owner_user_id) {
      await connection.query(
        `INSERT INTO notifications (user_id, type, title, body, link_url)
         VALUES (?, 'system', 'Đánh giá mới từ khách hàng', ?, '/merchant/reviews')`,
        [
          restaurantOwner[0].owner_user_id,
          `Khách hàng vừa gửi đánh giá cho đơn hàng ${order.order_code}.`,
        ],
      );
    }

    await connection.commit();

    const [inserted] = await pool.query(
      `SELECT id, order_id as orderId, customer_id as customerId, restaurant_id as restaurantId, menu_item_id as menuItemId, rating, comment, is_hidden as isHidden, reply_text as replyText, reply_at as replyAt, created_at as createdAt FROM reviews WHERE id IN (?)`,
      [insertedIds]
    );

    res.status(201).json({
      restaurantReview: inserted.find((review) => review.menuItemId === null) ?? null,
      dishReviews: inserted.filter((review) => review.menuItemId !== null),
    });

  } catch (err) {
    await connection.rollback();
    next(err);
  } finally {
    connection.release();
  }
});

router.patch('/reviews/:id', requireAuth, async (req, res, next) => {
  const connection = await pool.getConnection();
  try {
    const { userId } = req.auth;
    const reviewId = Number(req.params.id);
    const rating = parseInt(req.body?.rating, 10);
    const comment = req.body?.comment ? String(req.body.comment).trim() : null;

    if (isNaN(reviewId)) {
      return res.status(400).json({ error: 'ID đánh giá không hợp lệ.' });
    }

    if (isNaN(rating) || rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Đánh giá phải từ 1 đến 5 sao.' });
    }

    if (comment && comment.length > 500) {
      return res.status(400).json({ error: 'Nội dung nhận xét không được vượt quá 500 ký tự.' });
    }

    await connection.beginTransaction();

    // 1. Lấy thông tin đánh giá
    const [reviews] = await connection.query(
      `SELECT * FROM reviews WHERE id = ? FOR UPDATE`,
      [reviewId]
    );

    if (reviews.length === 0) {
      await connection.rollback();
      return res.status(404).json({ error: 'Không tìm thấy đánh giá.' });
    }

    const review = reviews[0];

    // 2. Kiểm tra quyền sở hữu
    if (review.customer_id !== userId) {
      await connection.rollback();
      return res.status(403).json({ error: 'Bạn không có quyền chỉnh sửa đánh giá này.' });
    }

    // 3. Ràng buộc sửa 1 lần
    if (review.is_edited) {
      await connection.rollback();
      return res.status(403).json({ error: 'Đánh giá này đã được chỉnh sửa trước đó và chỉ có thể sửa tối đa 1 lần.' });
    }

    // 4. Ràng buộc thời gian (7 ngày)
    const reviewAgeInMs = Date.now() - new Date(review.created_at).getTime();
    const sevenDaysInMs = 7 * 24 * 60 * 60 * 1000;
    if (reviewAgeInMs > sevenDaysInMs) {
      await connection.rollback();
      return res.status(403).json({ error: 'Đã quá hạn 7 ngày để chỉnh sửa đánh giá này.' });
    }

    // 5. Tiến hành cập nhật đánh giá
    await connection.query(
      `UPDATE reviews SET rating = ?, comment = ?, is_edited = 1 WHERE id = ?`,
      [rating, comment, reviewId]
    );

    await refreshReviewStats(connection, {
      restaurantId: review.restaurant_id,
      menuItemIds: review.menu_item_id ? [review.menu_item_id] : [],
    });

    await connection.commit();

    // Lấy thông tin review sau cập nhật
    const [updated] = await pool.query(
      `SELECT id, order_id as orderId, customer_id as customerId, restaurant_id as restaurantId, menu_item_id as menuItemId, rating, comment, is_hidden as isHidden, reply_text as replyText, reply_at as replyAt, created_at as createdAt, is_edited as isEdited FROM reviews WHERE id = ?`,
      [reviewId]
    );

    res.json({ ok: true, review: updated[0] });

  } catch (err) {
    await connection.rollback();
    next(err);
  } finally {
    connection.release();
  }
});

export default router;
