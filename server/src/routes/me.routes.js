import { Router } from 'express';
import bcrypt from 'bcrypt';
import { requireAuth, ensureCustomer } from '../middleware/auth.js';
import db from '../db/pool.js';
import { normalizeRoles } from '../lib/roles.js';
import { loadPartnerAccess } from '../lib/partnerAccess.js';
import { geocodeVietnamAddress } from '../lib/addressGeocoding.js';

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

    if (status === 'active') {
      queryConds.push("o.status IN ('pending_payment', 'payment_failed', 'placed', 'accepted', 'preparing', 'ready_for_pickup', 'picked_up', 'delivering')");
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
  try {
    const { userId } = req.auth;
    const { id } = req.params;

    // Get order and check ownership
    const [orders] = await db.query(
      'SELECT * FROM orders WHERE id = ? AND customer_id = ?',
      [id, userId]
    );

    if (orders.length === 0) {
      return res.status(404).json({ error: 'Không tìm thấy đơn hàng' });
    }

    const order = orders[0];

    // Check cancellation constraints
    if (order.status !== 'pending_payment' && order.status !== 'placed') {
      return res.status(400).json({
        error: 'Đơn hàng đang chuẩn bị hoặc đã vận chuyển, không thể hủy'
      });
    }

    // Update status to cancelled
    await db.query(
      "UPDATE orders SET status = 'cancelled' WHERE id = ?",
      [id]
    );

    res.json({ success: true, message: 'Hủy đơn hàng thành công' });
  } catch (err) {
    next(err);
  }
});

router.get('/vouchers', ensureCustomer, async (req, res, next) => {
  try {
    const now = new Date();
    const [rows] = await db.query(
      `SELECT id, code, kind, amount, min_order, max_discount, valid_from, valid_to, usage_limit, usage_count, is_active, created_at
       FROM vouchers
       WHERE is_active = 1 AND valid_from <= ? AND valid_to >= ? AND (usage_limit IS NULL OR usage_count < usage_limit)
       ORDER BY created_at DESC`,
      [now, now]
    );

    const formattedVouchers = rows.map((v) => ({
      id: v.id,
      code: v.code,
      kind: v.kind,
      amount: Number(v.amount),
      min_order: Number(v.min_order),
      max_discount: v.max_discount !== null ? Number(v.max_discount) : null,
      valid_from: v.valid_from,
      valid_to: v.valid_to,
      usage_limit: v.usage_limit,
      usage_count: v.usage_count,
      is_active: Boolean(v.is_active),
      created_at: v.created_at,
    }));

    res.json(formattedVouchers);
  } catch (err) {
    next(err);
  }
});

export default router;
