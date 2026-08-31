import { Router } from 'express';
import bcrypt from 'bcrypt';
import { requireAuth, ensureCustomer } from '../middleware/auth.js';
import db from '../db/pool.js';
import { normalizeRoles } from '../lib/roles.js';
import { loadPartnerAccess } from '../lib/partnerAccess.js';
import { geocodeVietnamAddress } from '../lib/addressGeocoding.js';
import { validateCustomerCancellation } from '../lib/customerCancellation.js';

const router = Router();
router.use(requireAuth);

async function loadRoles(userId) {
  const [rows] = await db.query('SELECT role FROM user_roles WHERE user_id = ? ORDER BY role', [userId]);
  return rows.map((r) => r.role);
}

async function serializeUser(row, roles) {
  const partnerAccess = await loadPartnerAccess(db, row.id, roles);
  return {
    id: row.id,
    email: row.email,
    phone: row.phone,
    fullName: row.full_name,
    avatarUrl: row.avatar_url,
    primaryRole: row.primary_role,
    status: row.status,
    suspensionExpiresAt: row.suspension_expires_at ?? null,
    roles,
    partnerAccess,
  };
}

router.get('/', async (req, res, next) => {
  try {
    const [rows] = await db.query(
      `SELECT id, email, phone, full_name, avatar_url, primary_role, status, suspension_expires_at
       FROM users WHERE id = ? LIMIT 1`,
      [req.auth.userId],
    );
    const user = rows[0];
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    if (user.status !== 'active') {
      return res.status(403).json({ error: 'Tài khoản chưa được kích hoạt hoặc đã bị khóa.' });
    }
    const roles = normalizeRoles(await loadRoles(user.id));
    res.json({ user: await serializeUser(user, roles) });
  } catch (err) {
    next(err);
  }
});

router.patch('/', async (req, res, next) => {
  try {
    const { userId } = req.auth;
    const fullName = req.body?.fullName === undefined ? undefined : String(req.body.fullName).trim();
    const phoneValue = req.body?.phone === undefined ? undefined : String(req.body.phone).trim();
    const avatarUrl = req.body?.avatarUrl === undefined ? undefined : String(req.body.avatarUrl).trim();

    const [currentRows] = await db.query(
      'SELECT id, full_name, phone, avatar_url FROM users WHERE id = ? LIMIT 1',
      [userId],
    );
    const current = currentRows[0];
    if (!current) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const nextFullName = fullName === undefined ? current.full_name : fullName;
    const nextPhone = phoneValue === undefined ? current.phone : phoneValue || null;
    const nextAvatarUrl = avatarUrl === undefined ? current.avatar_url : avatarUrl || null;

    if (!nextFullName) {
      return res.status(400).json({ error: 'Họ tên là bắt buộc.' });
    }

    if (nextPhone !== null) {
      const [phoneRows] = await db.query(
        'SELECT id FROM users WHERE phone = ? AND id <> ? LIMIT 1',
        [nextPhone, userId],
      );
      if (phoneRows.length) {
        return res.status(409).json({ error: 'Số điện thoại này đã được sử dụng.' });
      }
    }

    const updates = [];
    const values = [];
    if (nextFullName !== current.full_name) {
      updates.push('full_name = ?');
      values.push(nextFullName);
    }
    if (nextPhone !== current.phone) {
      updates.push('phone = ?');
      values.push(nextPhone);
    }
    if (nextAvatarUrl !== current.avatar_url) {
      updates.push('avatar_url = ?');
      values.push(nextAvatarUrl);
    }

    if (updates.length) {
      values.push(userId);
      await db.query(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, values);
    }

    const [updatedRows] = await db.query(
      `SELECT id, email, phone, full_name, avatar_url, primary_role, status, suspension_expires_at
       FROM users WHERE id = ? LIMIT 1`,
      [userId],
    );
    const roles = normalizeRoles(await loadRoles(userId));
    res.json({ user: await serializeUser(updatedRows[0], roles) });
  } catch (err) {
    if (err?.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Số điện thoại này đã được sử dụng.' });
    }
    next(err);
  }
});

router.post('/change-password', async (req, res, next) => {
  try {
    const { userId } = req.auth;
    const currentPassword = String(req.body?.currentPassword ?? '');
    const newPassword = String(req.body?.newPassword ?? '');

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Mật khẩu hiện tại và mật khẩu mới là bắt buộc.' });
    }
    if (newPassword.length < 8) {
      return res.status(400).json({ error: 'Mật khẩu mới phải có ít nhất 8 ký tự.' });
    }

    const [rows] = await db.query('SELECT password_hash FROM users WHERE id = ? LIMIT 1', [userId]);
    const user = rows[0];
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const ok = await bcrypt.compare(currentPassword, user.password_hash);
    if (!ok) {
      return res.status(400).json({ error: 'Mật khẩu hiện tại không đúng.' });
    }

    const nextHash = await bcrypt.hash(newPassword, 10);
    await db.query('UPDATE users SET password_hash = ? WHERE id = ?', [nextHash, userId]);
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

router.get('/addresses', ensureCustomer, async (req, res, next) => {
  try {
    const { userId } = req.auth;
    const [rows] = await db.query(
      `SELECT id, label, recipient_name AS recipientName, recipient_phone AS recipientPhone, 
              line1, ward, district, city,
              latitude, longitude, delivery_note AS deliveryNote, is_default AS isDefault
       FROM customer_addresses 
       WHERE customer_id = ?
       ORDER BY is_default DESC, created_at DESC`,
      [userId]
    );

    const formattedRows = rows.map((r) => ({
      ...r,
      isDefault: Boolean(r.isDefault),
      latitude: r.latitude ? Number(r.latitude) : null,
      longitude: r.longitude ? Number(r.longitude) : null,
    }));
    res.json(formattedRows);
  } catch (err) {
    next(err);
  }
});

router.post('/addresses', ensureCustomer, async (req, res, next) => {
  const connection = await db.getConnection();
  try {
    const { userId } = req.auth;
    let { 
      label, recipientName, recipientPhone, line1, 
      ward, district, city, latitude, longitude, 
      deliveryNote, isDefault 
    } = req.body;
    if (!Number.isFinite(Number(latitude)) || !Number.isFinite(Number(longitude))) {
      ({ latitude, longitude } = await geocodeVietnamAddress({ line1, ward, district, city }));
    }
    await connection.beginTransaction();

    // Check if this is the first address
    const [existing] = await connection.query(
      'SELECT COUNT(*) as cnt FROM customer_addresses WHERE customer_id = ?',
      [userId]
    );
    if (existing[0].cnt === 0) {
      isDefault = true;
    }

    if (isDefault) {
      await connection.query(
        'UPDATE customer_addresses SET is_default = 0 WHERE customer_id = ?',
        [userId]
      );
    }

    const [result] = await connection.query(
      `INSERT INTO customer_addresses 
        (customer_id, label, recipient_name, recipient_phone, line1, ward, district, city, latitude, longitude, delivery_note, is_default)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId, label || '', recipientName || '', recipientPhone || '', line1 || '',
        ward || null, district || null, city || '', latitude || null, longitude || null,
        deliveryNote || null, isDefault ? 1 : 0
      ]
    );

    const newId = result.insertId;

    await connection.commit();
    
    // Return the newly created address
    const [newAddr] = await connection.query(
      `SELECT id, label, recipient_name AS recipientName, recipient_phone AS recipientPhone, 
              line1, ward, district, city,
              latitude, longitude, delivery_note AS deliveryNote, is_default AS isDefault
       FROM customer_addresses WHERE id = ?`,
      [newId]
    );
    res.status(201).json({
      ...newAddr[0],
      isDefault: Boolean(newAddr[0].isDefault),
      latitude: newAddr[0].latitude ? Number(newAddr[0].latitude) : null,
      longitude: newAddr[0].longitude ? Number(newAddr[0].longitude) : null,
    });
  } catch (err) {
    await connection.rollback();
    next(err);
  } finally {
    connection.release();
  }
});

router.patch('/addresses/:id', ensureCustomer, async (req, res, next) => {
  const connection = await db.getConnection();
  try {
    const { userId } = req.auth;
    const { id } = req.params;
    const data = req.body;
    await connection.beginTransaction();

    const [addrList] = await connection.query(
      'SELECT id, line1, ward, district, city FROM customer_addresses WHERE id = ? AND customer_id = ?',
      [id, userId]
    );
    if (addrList.length === 0) {
      await connection.rollback();
      return res.status(404).json({ error: 'Address not found' });
    }

    if (['line1', 'ward', 'district', 'city'].some((key) => data[key] !== undefined)
      && (!Number.isFinite(Number(data.latitude)) || !Number.isFinite(Number(data.longitude)))) {
      const current = addrList[0];
      const coords = await geocodeVietnamAddress({
        line1: data.line1 ?? current.line1,
        ward: data.ward ?? current.ward,
        district: data.district ?? current.district,
        city: data.city ?? current.city,
      });
      data.latitude = coords.latitude;
      data.longitude = coords.longitude;
    }

    if (data.isDefault) {
      await connection.query(
        'UPDATE customer_addresses SET is_default = 0 WHERE customer_id = ?',
        [userId]
      );
    }

    const fields = [];
    const values = [];

    const fieldMap = {
      label: 'label',
      recipientName: 'recipient_name',
      recipientPhone: 'recipient_phone',
      line1: 'line1',
      ward: 'ward',
      district: 'district',
      city: 'city',
      latitude: 'latitude',
      longitude: 'longitude',
      deliveryNote: 'delivery_note',
      isDefault: 'is_default'
    };

    for (const [key, dbField] of Object.entries(fieldMap)) {
      if (data[key] !== undefined) {
        fields.push(`${dbField} = ?`);
        values.push(key === 'isDefault' ? (data[key] ? 1 : 0) : data[key]);
      }
    }

    if (fields.length > 0) {
      values.push(id);
      values.push(userId);
      await connection.query(
        `UPDATE customer_addresses SET ${fields.join(', ')} WHERE id = ? AND customer_id = ?`,
        values
      );
    }
    
    await connection.commit();

    const [updatedRow] = await connection.query(
      `SELECT id, label, recipient_name AS recipientName, recipient_phone AS recipientPhone, 
              line1, ward, district, city,
              latitude, longitude, delivery_note AS deliveryNote, is_default AS isDefault
       FROM customer_addresses WHERE id = ?`,
      [id]
    );
    res.json({
      ...updatedRow[0],
      isDefault: Boolean(updatedRow[0].isDefault),
      latitude: updatedRow[0].latitude ? Number(updatedRow[0].latitude) : null,
      longitude: updatedRow[0].longitude ? Number(updatedRow[0].longitude) : null,
    });
  } catch (err) {
    await connection.rollback();
    next(err);
  } finally {
    connection.release();
  }
});

router.delete('/addresses/:id', ensureCustomer, async (req, res, next) => {
  const connection = await db.getConnection();
  try {
    const { userId } = req.auth;
    const { id } = req.params;
    
    await connection.beginTransaction();

    const [addrList] = await connection.query(
      'SELECT is_default FROM customer_addresses WHERE id = ? AND customer_id = ?',
      [id, userId]
    );
    if (addrList.length === 0) {
      await connection.rollback();
      return res.status(404).json({ error: 'Address not found' });
    }

    // Always allow delete based on requirement
    await connection.query('DELETE FROM customer_addresses WHERE id = ? AND customer_id = ?', [id, userId]);

    await connection.commit();
    res.json({ success: true });
  } catch (err) {
    await connection.rollback();
    next(err);
  } finally {
    connection.release();
  }
});

router.post('/addresses/:id/default', ensureCustomer, async (req, res, next) => {
  const connection = await db.getConnection();
  try {
    const { userId } = req.auth;
    const { id } = req.params;

    await connection.beginTransaction();

    const [addrList] = await connection.query(
      'SELECT id FROM customer_addresses WHERE id = ? AND customer_id = ?',
      [id, userId]
    );
    if (addrList.length === 0) {
      await connection.rollback();
      return res.status(404).json({ error: 'Address not found' });
    }

    await connection.query('UPDATE customer_addresses SET is_default = 0 WHERE customer_id = ?', [userId]);
    await connection.query('UPDATE customer_addresses SET is_default = 1 WHERE id = ?', [id]);
    
    await connection.commit();
    res.json({ success: true });
  } catch (err) {
    await connection.rollback();
    next(err);
  } finally {
    connection.release();
  }
});

router.get('/orders', ensureCustomer, async (req, res, next) => {
  try {
    const { userId } = req.auth;
    const status = req.query.status || 'all';
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.max(1, parseInt(req.query.limit, 10) || 10);
    const offset = (page - 1) * limit;

    let queryConds = ['o.customer_id = ?'];
    let queryParams = [userId];

    if (status === 'pending' || status === 'unpaid') {
      queryConds.push("o.status IN ('pending_payment', 'payment_failed')");
    } else if (status === 'active') {
      queryConds.push("o.status IN ('placed', 'accepted', 'preparing', 'ready_for_pickup', 'picked_up', 'delivering')");
    } else if (status === 'delivered') {
      queryConds.push("o.status = 'delivered'");
    } else if (status === 'cancelled') {
      queryConds.push("o.status IN ('cancelled', 'failed', 'expired')");
    }

    const whereClause = 'WHERE ' + queryConds.join(' AND ');

    // Count query
    const [countRows] = await db.query(
      `SELECT COUNT(*) as total FROM orders o ${whereClause}`,
      queryParams
    );
    const total = countRows[0]?.total || 0;
    const totalPages = Math.ceil(total / limit);

    // Data query
    const [orders] = await db.query(
      `SELECT o.*, r.name as restaurant_name, r.logo_url as restaurant_logo, r.banner_url as restaurant_banner
       FROM orders o
       LEFT JOIN restaurants r ON o.restaurant_id = r.id
       ${whereClause}
       ORDER BY o.created_at DESC
       LIMIT ? OFFSET ?`,
      [...queryParams, limit, offset]
    );

    if (orders.length === 0) {
      return res.json({
        data: [],
        pagination: { total, page, limit, totalPages }
      });
    }

    const orderIds = orders.map(o => o.id);
    const [items] = await db.query(
      `SELECT * FROM order_items WHERE order_id IN (?)`,
      [orderIds]
    );

    const formattedOrders = orders.map(o => {
      const orderItems = items.filter(i => i.order_id === o.id).map(i => ({
        menuItemId: i.menu_item_id,
        name: i.item_name_snapshot,
        quantity: i.quantity,
        unitPrice: Number(i.unit_price_snapshot)
      }));

      const itemCount = orderItems.reduce((acc, i) => acc + i.quantity, 0);

      return {
        id: o.id,
        orderCode: o.order_code,
        status: o.status,
        paymentStatus: o.payment_status,
        paymentMethod: o.payment_method,
        totalAmount: Number(o.total_amount),
        restaurantId: o.restaurant_id,
        restaurantName: o.restaurant_name,
        restaurantLogo: o.restaurant_logo,
        restaurantBanner: o.restaurant_banner,
        placedAt: o.placed_at || o.created_at,
        deliveredAt: o.delivered_at,
        items: orderItems,
        itemCount
      };
    });

    res.json({
      data: formattedOrders,
      pagination: { total, page, limit, totalPages }
    });
  } catch (err) {
    next(err);
  }
});

router.post('/orders/:id/cancel', ensureCustomer, async (req, res, next) => {
  const orderId = Number(req.params.id);
  if (!Number.isInteger(orderId) || orderId <= 0) {
    return res.status(400).json({ error: 'Mã đơn hàng không hợp lệ.' });
  }

  const reason = String(req.body?.reason ?? '').trim().slice(0, 500)
    || 'Khách hàng chủ động hủy trước khi quán xử lý.';
  const connection = await db.getConnection();
  try {
    const { userId } = req.auth;
    await connection.beginTransaction();
    const [orders] = await connection.query(
      'SELECT * FROM orders WHERE id = ? AND customer_id = ? FOR UPDATE',
      [orderId, userId],
    );

    if (orders.length === 0) {
      await connection.rollback();
      return res.status(404).json({ error: 'Không tìm thấy đơn hàng' });
    }

    const order = orders[0];
    validateCustomerCancellation(order);

    await connection.query(
      `UPDATE orders
       SET status = 'cancelled', cancelled_at = NOW(), cancelled_by_role = 'customer', cancel_reason = ?
       WHERE id = ?`,
      [reason, order.id],
    );
    await connection.query(
      "UPDATE payments SET status = 'cancelled', failure_reason = 'Order cancelled by customer' WHERE order_id = ? AND status IN ('initiated', 'pending')",
      [order.id],
    );
    await connection.query(
      "UPDATE voucher_redemptions SET status = 'released', released_at = NOW() WHERE order_id = ? AND status = 'reserved'",
      [order.id],
    );
    await connection.query(
      "INSERT INTO order_status_logs (order_id, from_status, to_status, changed_by_role, changed_by_user_id, note) VALUES (?, ?, 'cancelled', 'customer', ?, ?)",
      [order.id, order.status, userId, reason],
    );
    await connection.query(
      `INSERT INTO notifications (user_id, type, title, body, link_url)
       SELECT r.owner_user_id, 'order_cancelled', ?, ?, '/merchant/orders'
       FROM restaurants r WHERE r.id = ? AND r.owner_user_id IS NOT NULL`,
      [
        `Đơn hàng ${order.order_code} đã bị hủy`,
        `Khách hàng đã hủy đơn ${order.order_code} trước khi quán xử lý.`,
        order.restaurant_id,
      ],
    );

    await connection.commit();

    res.json({ success: true, message: 'Hủy đơn hàng thành công' });
  } catch (err) {
    await connection.rollback();
    next(err);
  } finally {
    connection.release();
  }
});

router.get('/vouchers', ensureCustomer, async (req, res, next) => {
  try {
    const customerId = req.auth.userId;
    const [rows] = await db.query(
      `SELECT v.id, v.restaurant_id, r.name AS restaurant_name, v.code, v.name, v.description,
              v.discount_type AS kind,
              v.discount_value AS amount,
              v.min_order_amount AS min_order,
              v.max_discount_amount AS max_discount,
              v.starts_at AS valid_from,
              v.ends_at AS valid_to,
              v.usage_limit,
              v.per_user_limit,
              v.status,
              v.is_public,
              v.created_at,
              (csv.id IS NOT NULL) AS is_saved,
              COALESCE((
                SELECT COUNT(*)
                FROM voucher_redemptions vr
                WHERE vr.voucher_id = v.id AND vr.status IN ('reserved', 'redeemed')
              ), 0) AS used_count,
              COALESCE((
                SELECT COUNT(*)
                FROM voucher_redemptions vr
                WHERE vr.voucher_id = v.id AND vr.customer_id = ? AND vr.status IN ('reserved', 'redeemed')
              ), 0) AS customer_used_count
       FROM vouchers v
       LEFT JOIN restaurants r ON r.id = v.restaurant_id
       LEFT JOIN customer_saved_vouchers csv ON csv.voucher_id = v.id AND csv.customer_id = ?
       LEFT JOIN customer_dismissed_vouchers cdv ON cdv.voucher_id = v.id AND cdv.customer_id = ?
       WHERE v.status = 'active'
         AND cdv.id IS NULL
         AND (
           (v.is_public = 1 AND v.restaurant_id IS NULL)
           OR csv.id IS NOT NULL
         )
       ORDER BY v.created_at DESC`,
      [customerId, customerId, customerId]
    );

    const now = new Date();
    const formattedVouchers = rows.map((v) => {
      const isExpired = new Date(v.valid_to) < now || new Date(v.valid_from) > now;
      const isOutOfQuota = v.usage_limit !== null && Number(v.used_count) >= Number(v.usage_limit);
      const isCustomerLimitReached = Number(v.customer_used_count) >= Number(v.per_user_limit || 1);

      return {
        id: v.id,
        restaurantId: v.restaurant_id,
        restaurantName: v.restaurant_name ?? null,
        code: v.code,
        name: v.name,
        description: v.description,
        kind: v.kind,
        amount: Number(v.amount),
        min_order: Number(v.min_order),
        max_discount: v.max_discount !== null ? Number(v.max_discount) : null,
        valid_from: v.valid_from,
        valid_to: v.valid_to,
        usage_limit: v.usage_limit !== null ? Number(v.usage_limit) : null,
        used_count: Number(v.used_count || 0),
        customer_used_count: Number(v.customer_used_count || 0),
        per_user_limit: Number(v.per_user_limit || 1),
        is_saved: Boolean(v.is_saved),
        is_public: Boolean(v.is_public ?? 1),
        is_expired: isExpired,
        is_out_of_quota: isOutOfQuota,
        is_limit_reached: isCustomerLimitReached,
        is_usable: !isExpired && !isOutOfQuota && !isCustomerLimitReached,
        created_at: v.created_at,
      };
    });

    res.json(formattedVouchers);
  } catch (err) {
    next(err);
  }
});

router.post('/vouchers/save', ensureCustomer, async (req, res, next) => {
  try {
    const customerId = req.auth.userId;
    const { code, voucherId } = req.body || {};

    let query = 'SELECT * FROM vouchers WHERE ';
    let params = [];

    if (code) {
      query += 'BINARY UPPER(code) = UPPER(?) LIMIT 1';
      params.push(String(code).trim());
    } else if (voucherId) {
      query += 'id = ? LIMIT 1';
      params.push(Number(voucherId));
    } else {
      return res.status(400).json({ error: 'Mã voucher hoặc ID voucher là bắt buộc.' });
    }

    const [voucherRows] = await db.query(query, params);
    const voucher = voucherRows[0];

    if (!voucher || voucher.status !== 'active') {
      return res.status(404).json({ error: 'Mã giảm giá không tồn tại hoặc chưa được kích hoạt.' });
    }

    const now = new Date();
    if (new Date(voucher.starts_at) > now) {
      return res.status(400).json({ error: 'Mã giảm giá này chưa đến thời gian áp dụng.' });
    }
    if (new Date(voucher.ends_at) < now) {
      return res.status(400).json({ error: 'Mã giảm giá này đã hết hạn sử dụng.' });
    }

    // Check usage limits
    const [[usageRow]] = await db.query(
      "SELECT COUNT(*) AS totalUsage FROM voucher_redemptions WHERE voucher_id = ? AND status IN ('reserved', 'redeemed')",
      [voucher.id]
    );
    if (voucher.usage_limit !== null && Number(usageRow.totalUsage) >= Number(voucher.usage_limit)) {
      return res.status(400).json({ error: 'Mã giảm giá đã hết lượt sử dụng sớm.' });
    }

    // Re-enable if dismissed
    await db.query(
      'DELETE FROM customer_dismissed_vouchers WHERE customer_id = ? AND voucher_id = ?',
      [customerId, voucher.id]
    );

    // Check if already saved
    const [savedRows] = await db.query(
      'SELECT id FROM customer_saved_vouchers WHERE customer_id = ? AND voucher_id = ? LIMIT 1',
      [customerId, voucher.id]
    );
    if (savedRows.length > 0) {
      return res.json({ success: true, message: 'Mã này đã có sẵn trong kho của bạn.', voucherId: voucher.id, alreadySaved: true });
    }

    await db.query(
      'INSERT INTO customer_saved_vouchers (customer_id, voucher_id, saved_at) VALUES (?, ?, NOW())',
      [customerId, voucher.id]
    );

    res.json({ success: true, message: `Đã lưu mã ${voucher.code} vào kho voucher của bạn!`, voucherId: voucher.id });
  } catch (err) {
    next(err);
  }
});

router.delete('/vouchers/expired', ensureCustomer, async (req, res, next) => {
  try {
    const customerId = req.auth.userId;
    // 1) Xóa khỏi customer_saved_vouchers
    const [result] = await db.query(
      `DELETE csv FROM customer_saved_vouchers csv
       JOIN vouchers v ON v.id = csv.voucher_id
       WHERE csv.customer_id = ?
         AND (
           v.ends_at < NOW()
           OR (v.usage_limit IS NOT NULL AND (
             SELECT COUNT(*) FROM voucher_redemptions vr WHERE vr.voucher_id = v.id AND vr.status IN ('reserved', 'redeemed')
           ) >= v.usage_limit)
           OR (
             (SELECT COUNT(*) FROM voucher_redemptions vr WHERE vr.voucher_id = v.id AND vr.customer_id = ? AND vr.status IN ('reserved', 'redeemed')) >= COALESCE(v.per_user_limit, 1)
           )
         )`,
      [customerId, customerId]
    );

    // 2) Đưa tất cả các voucher hết hiệu lực (kể cả voucher toàn sàn) vào danh sách ẩn của user
    const [expiredVouchers] = await db.query(
      `SELECT v.id
       FROM vouchers v
       WHERE v.status = 'active'
         AND (
           v.ends_at < NOW()
           OR (v.usage_limit IS NOT NULL AND (
             SELECT COUNT(*) FROM voucher_redemptions vr WHERE vr.voucher_id = v.id AND vr.status IN ('reserved', 'redeemed')
           ) >= v.usage_limit)
           OR (
             (SELECT COUNT(*) FROM voucher_redemptions vr WHERE vr.voucher_id = v.id AND vr.customer_id = ? AND vr.status IN ('reserved', 'redeemed')) >= COALESCE(v.per_user_limit, 1)
           )
         )`,
      [customerId]
    );

    for (const v of expiredVouchers) {
      await db.query(
        `INSERT INTO customer_dismissed_vouchers (customer_id, voucher_id, dismissed_at)
         VALUES (?, ?, NOW())
         ON DUPLICATE KEY UPDATE dismissed_at = NOW()`,
        [customerId, v.id]
      );
    }

    res.json({ success: true, message: 'Đã dọn dẹp các mã voucher hết hiệu lực.', deletedCount: result.affectedRows });
  } catch (err) {
    next(err);
  }
});

router.delete('/vouchers/:voucherId', ensureCustomer, async (req, res, next) => {
  try {
    const customerId = req.auth.userId;
    const { voucherId } = req.params;

    await db.query(
      'DELETE FROM customer_saved_vouchers WHERE customer_id = ? AND voucher_id = ?',
      [customerId, Number(voucherId)]
    );

    await db.query(
      `INSERT INTO customer_dismissed_vouchers (customer_id, voucher_id, dismissed_at)
       VALUES (?, ?, NOW())
       ON DUPLICATE KEY UPDATE dismissed_at = NOW()`,
      [customerId, Number(voucherId)]
    );

    res.json({ success: true, message: 'Đã xóa mã voucher khỏi kho của bạn.' });
  } catch (err) {
    next(err);
  }
});

export default router;
