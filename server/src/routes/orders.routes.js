import { Router } from 'express';
import { requireAuth, ensureCustomer } from '../middleware/auth.js';
import pool from '../db/pool.js';
import { calculateDistance } from '../lib/geo.js';
import { evaluateVoucher } from '../lib/voucher.js';
import { createGhnClient, GhnProviderError } from '../lib/ghn.js';
import { buildShippingQuote } from '../lib/shippingQuote.js';
import crypto from 'crypto';

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

function getGhnClient() {
  return createGhnClient({
    token: process.env.GHN_TOKEN,
    shopId: process.env.GHN_SHOP_ID,
    baseUrl: process.env.GHN_API_BASE_URL ?? 'https://online-gateway.ghn.vn/shiip/public-api',
  });
}

router.post('/', requireAuth, async (req, res, next) => {
  const connection = await pool.getConnection();
  try {
    const { userId: customerId } = req.auth;
    const { addressId, paymentMethod, customerNote, voucherCode } = req.body;

    if (!['cod', 'vnpay'].includes(paymentMethod)) {
      return res.status(400).json({ error: 'Phương thức thanh toán không hợp lệ' });
    }

    await connection.beginTransaction();

    // 1. Đọc cart
    const cart = await getActiveCart(connection, customerId);
    if (!cart) {
      await connection.rollback();
      return res.status(400).json({ error: 'Giỏ hàng rỗng' });
    }

    // Lấy cart items + menu items info
    const [cartItems] = await connection.query(
      `SELECT ci.*, m.name as item_name, m.price, m.prep_time_min
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
      `SELECT * FROM restaurants WHERE id = ?`,
      [cart.restaurant_id]
    );
    const restaurant = rests[0];

    let shippingQuote;
    try {
      shippingQuote = await buildShippingQuote({
        ghnClient: getGhnClient(),
        cart,
        restaurant,
        address: deliveryAddress,
      });
    } catch (error) {
      await connection.rollback();
      if (error?.code === 'GHN_ADDRESS_NOT_READY' || error?.code === 'GHN_CART_NOT_READY') {
        return res.status(400).json({ error: error.message, code: error.code });
      }
      if (error instanceof GhnProviderError || String(error?.code ?? '').startsWith('GHN_')) {
        return res.status(502).json({
          error: error.message,
          code: error.code ?? 'GHN_PROVIDER_ERROR',
        });
      }
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

    const driver_earning = Math.floor(delivery_fee * 0.8);
    const platform_commission = Math.floor(subtotal * Number(restaurant.commission_rate) / 100);
    const merchant_earning = subtotal - platform_commission;
    const platform_fee = platform_commission + Math.floor(delivery_fee * 0.2);

    // 5. Tính toán khoảng cách và thời gian giao hàng dự kiến
    let distance_km = 0;
    if (deliveryAddress.latitude && deliveryAddress.longitude && restaurant.latitude && restaurant.longitude) {
      distance_km = calculateDistance(
        Number(deliveryAddress.latitude), Number(deliveryAddress.longitude),
        Number(restaurant.latitude), Number(restaurant.longitude)
      );
    }

    // Tìm thời gian chuẩn bị món lâu nhất
    const max_prep_time = cartItems.reduce((max, i) => Math.max(max, i.prep_time_min), 0);
    // Thời gian chuẩn bị dự kiến + mặc định 15 phút giao hàng
    const est_time_add = (restaurant.avg_prep_time_min || max_prep_time) + 15;

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
        driver_earning, merchant_earning, platform_fee,
        status, payment_status, payment_method, customer_note, estimated_delivery_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        orderCode,
        customerId,
        restaurant.id,
        voucher ? voucher.id : null,
        deliveryAddress.id,
        snapshotAddress,
        deliveryAddress.latitude || 0,
        deliveryAddress.longitude || 0,
        restaurant.latitude || 0,
        restaurant.longitude || 0,
        distance_km,
        subtotal,
        delivery_fee,
        discount_amount,
        voucher ? voucher.code : null,
        total_amount,
        driver_earning,
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

    // 8. Đổi giỏ hàng sang converted (Xóa cứng) - chỉ xóa cho COD. Với VNPay sẽ xóa khi thanh toán thành công
    if (paymentMethod === 'cod') {
      await connection.query(
        `DELETE FROM carts WHERE id = ?`,
        [cart.id]
      );
    }

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

    let query = `SELECT o.*, (SELECT id FROM reviews WHERE order_id = o.id LIMIT 1) AS review_id
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

    const restaurantIds = [...new Set(orders.map(o => o.restaurant_id))];
    const [rests] = await pool.query(
      `SELECT id, name, address_line, banner_url, phone FROM restaurants WHERE id IN (?)`,
      [restaurantIds]
    );

    const restMap = {};
    rests.forEach(r => { restMap[r.id] = r; });

    const formattedOrders = orders.map(o => {
      return {
        ...o,
        restaurant: restMap[o.restaurant_id],
        items: items.filter(i => i.order_id === o.id),
        reviewId: o.review_id ? Number(o.review_id) : null,
        isReviewed: Boolean(o.review_id)
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

    let query = `SELECT o.*, (SELECT id FROM reviews WHERE order_id = o.id LIMIT 1) AS review_id FROM orders o WHERE o.customer_id = ? AND `;
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
    order.reviewId = order.review_id ? Number(order.review_id) : null;
    order.isReviewed = Boolean(order.review_id);

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

    // 3. Phân tách danh sách đánh giá món ăn từ request body
    let reviewsList = req.body?.reviews;
    if (!Array.isArray(reviewsList)) {
      // Fallback cho client cũ gửi đơn lẻ rating & comment
      const ratingVal = parseInt(req.body?.rating, 10);
      const commentVal = req.body?.comment ? String(req.body.comment).trim() : null;

      if (isNaN(ratingVal) || ratingVal < 1 || ratingVal > 5) {
        await connection.rollback();
        return res.status(400).json({ error: 'Đánh giá phải từ 1 đến 5 sao.' });
      }

      const [orderItems] = await connection.query(
        `SELECT menu_item_id FROM order_items WHERE order_id = ? LIMIT 1`,
        [order.id]
      );

      if (orderItems.length > 0) {
        reviewsList = [{
          menuItemId: orderItems[0].menu_item_id,
          rating: ratingVal,
          comment: commentVal,
        }];
      } else {
        await connection.rollback();
        return res.status(400).json({ error: 'Không thể xác định món ăn trong đơn hàng để đánh giá.' });
      }
    }

    // 4. Kiểm tra hợp lệ các đánh giá trong danh sách và kiểm tra trùng lặp (chống spam)
    for (const r of reviewsList) {
      const ratingVal = parseInt(r.rating, 10);
      if (isNaN(ratingVal) || ratingVal < 1 || ratingVal > 5) {
        await connection.rollback();
        return res.status(400).json({ error: 'Đánh giá phải từ 1 đến 5 sao.' });
      }

      if (!r.menuItemId) {
        await connection.rollback();
        return res.status(400).json({ error: 'Thiếu thông tin món ăn (menuItemId) cần đánh giá.' });
      }

      const [dup] = await connection.query(
        `SELECT id FROM reviews WHERE order_id = ? AND menu_item_id = ? LIMIT 1`,
        [order.id, r.menuItemId]
      );
      if (dup.length > 0) {
        await connection.rollback();
        return res.status(400).json({ error: 'Sản phẩm này trong đơn hàng đã được đánh giá rồi.' });
      }
    }

    // 5. Thêm các đánh giá mới vào cơ sở dữ liệu
    const insertedIds = [];
    for (const r of reviewsList) {
      const commentVal = r.comment ? String(r.comment).trim() : null;
      const [insertRes] = await connection.query(
        `INSERT INTO reviews (order_id, customer_id, restaurant_id, menu_item_id, rating, comment, is_edited) VALUES (?, ?, ?, ?, ?, ?, 0)`,
        [order.id, userId, order.restaurant_id, r.menuItemId, r.rating, commentVal]
      );
      insertedIds.push(insertRes.insertId);
    }

    // 6. Tính toán lại điểm trung bình cho từng món ăn (menu_items) có đánh giá
    for (const r of reviewsList) {
      const [itemStats] = await connection.query(
        `SELECT AVG(rating) AS avg_rating FROM reviews WHERE menu_item_id = ? AND is_hidden = 0 AND menu_item_id IS NOT NULL`,
        [r.menuItemId]
      );
      const nextItemAvg = Number(itemStats[0].avg_rating || 0).toFixed(2);
      await connection.query(
        `UPDATE menu_items SET rating_avg = ? WHERE id = ?`,
        [nextItemAvg, r.menuItemId]
      );
    }

    // 7. Tính toán lại điểm trung bình cho quán ăn trực tiếp từ bảng reviews (chống lệch trọng số)
    await connection.query(
      `UPDATE restaurants 
       SET rating_avg = COALESCE((SELECT AVG(rating) FROM reviews WHERE restaurant_id = ? AND is_hidden = 0 AND menu_item_id IS NOT NULL), 0),
           review_count = (SELECT COUNT(id) FROM reviews WHERE restaurant_id = ? AND is_hidden = 0 AND menu_item_id IS NOT NULL)
       WHERE id = ?`,
      [order.restaurant_id, order.restaurant_id, order.restaurant_id]
    );

    await connection.commit();

    // 8. Lấy thông tin các reviews vừa tạo để phản hồi
    const [inserted] = await pool.query(
      `SELECT id, order_id as orderId, customer_id as customerId, restaurant_id as restaurantId, menu_item_id as menuItemId, rating, comment, is_hidden as isHidden, reply_text as replyText, reply_at as replyAt, created_at as createdAt FROM reviews WHERE id IN (?)`,
      [insertedIds]
    );

    res.status(201).json({ reviews: inserted });

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

    // 6. Tính toán lại điểm trung bình cho món ăn liên quan (nếu có)
    if (review.menu_item_id) {
      const [itemStats] = await connection.query(
        `SELECT AVG(rating) AS avg_rating FROM reviews WHERE menu_item_id = ? AND is_hidden = 0 AND menu_item_id IS NOT NULL`,
        [review.menu_item_id]
      );
      const nextItemAvg = Number(itemStats[0].avg_rating || 0).toFixed(2);
      await connection.query(
        `UPDATE menu_items SET rating_avg = ? WHERE id = ?`,
        [nextItemAvg, review.menu_item_id]
      );
    }

    // 7. Tính toán lại điểm trung bình cho quán ăn trực tiếp từ bảng reviews (chống lệch trọng số)
    await connection.query(
      `UPDATE restaurants 
       SET rating_avg = COALESCE((SELECT AVG(rating) FROM reviews WHERE restaurant_id = ? AND is_hidden = 0 AND menu_item_id IS NOT NULL), 0),
           review_count = (SELECT COUNT(id) FROM reviews WHERE restaurant_id = ? AND is_hidden = 0 AND menu_item_id IS NOT NULL)
       WHERE id = ?`,
      [review.restaurant_id, review.restaurant_id, review.restaurant_id]
    );

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
