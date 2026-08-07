import { Router } from 'express';
import bcrypt from 'bcrypt';
import pool from '../db/pool.js';
import { requireAuth } from '../middleware/auth.js';
import { sendAdminResetPasswordEmail, sendAccountSuspensionEmail } from '../lib/mail.js';
import { buildRefundPayload, formatVnpayDate, verifyRefundResponse } from '../lib/vnpay.js';
import {
  ensureWallet,
  insertNotification,
  serializeDriverRow,
  serializeRestaurantRow,
} from '../lib/adminApprovals.js';

const router = Router();

function ensureAdmin(req, res, next) {
  if ((req.auth.roles ?? []).includes('admin')) {
    return next();
  }
  return res.status(403).json({ error: 'Forbidden' });
}

function serializeUser(row, roles) {
  return {
    id: row.id,
    email: row.email,
    fullName: row.full_name,
    avatarUrl: row.avatar_url,
    primaryRole: row.primary_role,
    status: row.status,
    suspensionExpiresAt: row.suspension_expires_at ?? null,
    suspensionReason: row.suspension_reason ?? null,
    roles,
    joinedAt: row.created_at,
  };
}

function generateRandomPassword() {
  return Array.from({ length: 12 }, () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%^&*()';
    return chars[Math.floor(Math.random() * chars.length)];
  }).join('');
}

router.use(requireAuth);
router.use(ensureAdmin);

const ORDER_METRICS_WHERE = "status NOT IN ('cancelled', 'failed', 'pending_payment')";

function parseOverviewRange(raw) {
  const range = ['today', 'week', 'month'].includes(raw) ? raw : 'month';
  if (range === 'today') {
    return {
      range,
      placedAtSql: 'placed_at >= CURDATE() AND placed_at < CURDATE() + INTERVAL 1 DAY',
    };
  }
  if (range === 'week') {
    return {
      range,
      placedAtSql: 'placed_at >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)',
    };
  }
  return {
    range,
    placedAtSql: 'placed_at >= DATE_SUB(CURDATE(), INTERVAL 29 DAY)',
  };
}

router.get('/overview', async (req, res, next) => {
  try {
    const { range, placedAtSql } = parseOverviewRange(String(req.query.range ?? 'month').toLowerCase());

    const [[userCountRow]] = await pool.query('SELECT COUNT(*) AS n FROM users');
    const [[customerCountRow]] = await pool.query(
      "SELECT COUNT(DISTINCT user_id) AS n FROM user_roles WHERE role = 'customer'",
    );
    const [[merchantCountRow]] = await pool.query(
      "SELECT COUNT(DISTINCT user_id) AS n FROM user_roles WHERE role = 'merchant'",
    );
    const [[driverCountRow]] = await pool.query(
      "SELECT COUNT(DISTINCT user_id) AS n FROM user_roles WHERE role = 'driver'",
    );
    const [[restaurantActiveRow]] = await pool.query(
      "SELECT COUNT(*) AS n FROM restaurants WHERE status = 'active'",
    );

    const [[orderMetrics]] = await pool.query(
      `SELECT
         COUNT(*) AS orderCount,
         COALESCE(SUM(total_amount), 0) AS gmv,
         COALESCE(SUM(platform_fee), 0) AS platformFee
       FROM orders
       WHERE ${placedAtSql} AND ${ORDER_METRICS_WHERE}`,
    );

    const [[refundRow]] = await pool.query(
      `SELECT COUNT(*) AS n
       FROM orders
       WHERE ${placedAtSql} AND payment_status = 'refunded'`,
    );

    const [[pendingRestaurantsRow]] = await pool.query(
      "SELECT COUNT(*) AS n FROM restaurants WHERE status = 'pending'",
    );
    const [[pendingDriversRow]] = await pool.query(
      "SELECT COUNT(*) AS n FROM driver_profiles WHERE approval_status = 'pending'",
    );

    const [recentSignupRows] = await pool.query(
      `SELECT id, full_name, email, primary_role, created_at
       FROM users
       ORDER BY created_at DESC
       LIMIT 10`,
    );

    const [chartRows] = await pool.query(
      `SELECT DATE(placed_at) AS day,
              COUNT(*) AS orders,
              COALESCE(SUM(total_amount), 0) AS gmv,
              COALESCE(SUM(platform_fee), 0) AS platformFee
       FROM orders
       WHERE ${placedAtSql} AND ${ORDER_METRICS_WHERE}
       GROUP BY DATE(placed_at)
       ORDER BY day ASC`,
    );

    res.json({
      range,
      totals: {
        userCount: Number(userCountRow?.n ?? 0),
        customerCount: Number(customerCountRow?.n ?? 0),
        merchantCount: Number(merchantCountRow?.n ?? 0),
        driverCount: Number(driverCountRow?.n ?? 0),
        restaurantActiveCount: Number(restaurantActiveRow?.n ?? 0),
        orderCount: Number(orderMetrics?.orderCount ?? 0),
        gmv: Number(orderMetrics?.gmv ?? 0),
        platformFee: Number(orderMetrics?.platformFee ?? 0),
        refundCount: Number(refundRow?.n ?? 0),
      },
      pendingApprovals: {
        restaurants: Number(pendingRestaurantsRow?.n ?? 0),
        drivers: Number(pendingDriversRow?.n ?? 0),
      },
      recentSignups: recentSignupRows.map((row) => ({
        id: row.id,
        fullName: row.full_name,
        email: row.email,
        primaryRole: row.primary_role,
        createdAt: row.created_at,
      })),
      chart: chartRows.map((row) => ({
        date: row.day instanceof Date ? row.day.toISOString().slice(0, 10) : String(row.day).slice(0, 10),
        orders: Number(row.orders),
        gmv: Number(row.gmv),
        platformFee: Number(row.platformFee),
      })),
    });
  } catch (err) {
    next(err);
  }
});

router.get('/usersQuery', async (req, res, next) => {
  try {
    const role = String(req.query.role ?? 'all').trim().toLowerCase();
    const status = String(req.query.status ?? 'all').trim().toLowerCase();
    const q = String(req.query.q ?? '').trim().toLowerCase();
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
    const offset = (page - 1) * limit;

    const filters = ['1 = 1'];
    const params = [];

    if (role && role !== 'all') {
      filters.push(
        `(u.primary_role = ? OR EXISTS (SELECT 1 FROM user_roles ur WHERE ur.user_id = u.id AND ur.role = ?))`,
      );
      params.push(role, role);
    }

    if (status && status !== 'all') {
      filters.push('u.status = ?');
      params.push(status);
    }

    if (q) {
      filters.push('(LOWER(u.full_name) LIKE ? OR LOWER(u.email) LIKE ?)');
      params.push(`%${q}%`, `%${q}%`);
    }

    const whereClause = filters.join(' AND ');

    const [countRows] = await pool.query(
      `SELECT COUNT(DISTINCT u.id) AS total
       FROM users u
       WHERE ${whereClause}`,
      params,
    );

    const [rows] = await pool.query(
      `SELECT u.id, u.email, u.full_name, u.avatar_url, u.primary_role, u.status, u.suspension_expires_at, u.suspension_reason, u.created_at,
              GROUP_CONCAT(DISTINCT ur.role) AS roles
       FROM users u
       LEFT JOIN user_roles ur ON ur.user_id = u.id
       WHERE ${whereClause}
       GROUP BY u.id
       ORDER BY u.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset],
    );

    const items = rows.map((row) => serializeUser(row, row.roles ? row.roles.split(',') : []));
    res.json({ items, total: Number(countRows[0]?.total ?? 0), page, limit });
  } catch (err) {
    next(err);
  }
});

router.patch('/users/:id/status', async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const status = String(req.body?.status ?? '').trim().toLowerCase();
    const suspensionDays = req.body?.suspensionDays;
    const suspensionReason = String(req.body?.suspensionReason ?? '').trim();

    if (!id || !['active', 'suspended', 'banned'].includes(status)) {
      return res.status(400).json({ error: 'Status không hợp lệ.' });
    }

    if (id === req.auth.userId && status !== 'active') {
      return res.status(400).json({ error: 'Bạn không thể tự đình chỉ hoặc khóa tài khoản của chính mình.' });
    }

    const [rows] = await pool.query(
      'SELECT id, email, full_name FROM users WHERE id = ? LIMIT 1',
      [id],
    );
    const user = rows[0];
    if (!user) {
      return res.status(404).json({ error: 'Người dùng không tồn tại.' });
    }

    let expiresAt = null;
    let reasonValue = null;
    if (status === 'suspended') {
      const days = Number(suspensionDays ?? 0);
      if (!Number.isInteger(days) || days < 1 || days > 365) {
        return res.status(400).json({ error: 'Số ngày đình chỉ phải là số nguyên từ 1 đến 365.' });
      }
      if (!suspensionReason) {
        return res.status(400).json({ error: 'Lý do đình chỉ là bắt buộc.' });
      }
      expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
      reasonValue = suspensionReason;
    }

    await pool.query(
      'UPDATE users SET status = ?, suspension_expires_at = ?, suspension_reason = ? WHERE id = ?',
      [status, expiresAt, reasonValue, id],
    );

    if (status === 'suspended' && user.email) {
      await sendAccountSuspensionEmail({
        to: user.email,
        fullName: user.full_name,
        reason: reasonValue,
        expiresAt,
      });
    }

    res.json({ ok: true, status, suspensionExpiresAt: expiresAt ? expiresAt.toISOString() : null, suspensionReason: reasonValue });
  } catch (err) {
    next(err);
  }
});

router.post('/users/:id/reset-password', async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!id) {
      return res.status(400).json({ error: 'ID người dùng không hợp lệ.' });
    }

    const rawPassword = String(req.body?.newPassword ?? '').trim();
    const [rows] = await pool.query(
      'SELECT id, email, full_name FROM users WHERE id = ? LIMIT 1',
      [id],
    );
    const user = rows[0];
    if (!user) {
      return res.status(404).json({ error: 'Người dùng không tồn tại.' });
    }

    const newPassword = rawPassword || generateRandomPassword();
    if (newPassword.length < 8) {
      return res.status(400).json({ error: 'Mật khẩu phải có ít nhất 8 ký tự.' });
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await pool.query('UPDATE users SET password_hash = ? WHERE id = ?', [passwordHash, user.id]);

    let emailed = false;
    if (!rawPassword) {
      await sendAdminResetPasswordEmail({
        to: user.email,
        fullName: user.full_name,
        newPassword,
      });
      emailed = true;
    }

    res.json({ ok: true, newPassword, emailed });
  } catch (err) {
    next(err);
  }
});

router.get('/restaurants/pending', async (_req, res, next) => {
  try {
    const [rows] = await pool.query(
      `SELECT r.*, u.full_name AS owner_name, u.email AS owner_email, c.name AS cuisine_name
       FROM restaurants r
       JOIN users u ON u.id = r.owner_user_id
       LEFT JOIN cuisines c ON c.id = r.cuisine_id
       WHERE r.status = 'pending'
       ORDER BY r.created_at ASC`,
    );
    res.json({ items: rows.map(serializeRestaurantRow) });
  } catch (err) {
    next(err);
  }
});

router.post('/restaurants/:id/approve', async (req, res, next) => {
  const restaurantId = Number(req.params.id);
  const adminId = req.auth.userId;

  if (!restaurantId) {
    return res.status(400).json({ error: 'ID nhà hàng không hợp lệ.' });
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [rows] = await conn.query(
      `SELECT r.*, u.full_name AS owner_name, u.email AS owner_email
       FROM restaurants r
       JOIN users u ON u.id = r.owner_user_id
       WHERE r.id = ? LIMIT 1`,
      [restaurantId],
    );
    const restaurant = rows[0];
    if (!restaurant) {
      await conn.rollback();
      return res.status(404).json({ error: 'Nhà hàng không tồn tại.' });
    }
    if (restaurant.status !== 'pending') {
      await conn.rollback();
      return res.status(400).json({ error: 'Chỉ có thể duyệt nhà hàng đang chờ xét duyệt.' });
    }

    await conn.query(
      `UPDATE restaurants
       SET status = 'active', approved_at = NOW(), approved_by_admin_id = ?, rejection_reason = NULL
       WHERE id = ?`,
      [adminId, restaurantId],
    );

    await ensureWallet(conn, restaurant.owner_user_id, 'merchant');

    const title = 'Hồ sơ quán đã được duyệt';
    const body = `Quán "${restaurant.name}" đã được phê duyệt. Bạn có thể truy cập portal merchant ngay bây giờ.`;
    await insertNotification(conn, {
      userId: restaurant.owner_user_id,
      title,
      body,
      linkUrl: '/merchant',
    });

    await conn.commit();

    await sendKycApprovedEmailSafe({
      to: restaurant.owner_email,
      fullName: restaurant.owner_name,
      subjectKind: 'quán ăn',
      portalPath: '/merchant',
    });

    const [updated] = await pool.query(
      `SELECT r.*, u.full_name AS owner_name, u.email AS owner_email, c.name AS cuisine_name
       FROM restaurants r
       JOIN users u ON u.id = r.owner_user_id
       LEFT JOIN cuisines c ON c.id = r.cuisine_id
       WHERE r.id = ? LIMIT 1`,
      [restaurantId],
    );

    res.json({ ok: true, restaurant: serializeRestaurantRow(updated[0]) });
  } catch (err) {
    await conn.rollback();
    next(err);
  } finally {
    conn.release();
  }
});

router.post('/restaurants/:id/reject', async (req, res, next) => {
  const restaurantId = Number(req.params.id);
  const reason = String(req.body?.reason ?? '').trim();

  if (!restaurantId) {
    return res.status(400).json({ error: 'ID nhà hàng không hợp lệ.' });
  }
  if (!reason) {
    return res.status(400).json({ error: 'Vui lòng nhập lý do từ chối.' });
  }
  if (reason.length > 500) {
    return res.status(400).json({ error: 'Lý do từ chối không được vượt quá 500 ký tự.' });
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [rows] = await conn.query(
      `SELECT r.*, u.full_name AS owner_name, u.email AS owner_email
       FROM restaurants r
       JOIN users u ON u.id = r.owner_user_id
       WHERE r.id = ? LIMIT 1`,
      [restaurantId],
    );
    const restaurant = rows[0];
    if (!restaurant) {
      await conn.rollback();
      return res.status(404).json({ error: 'Nhà hàng không tồn tại.' });
    }
    if (restaurant.status !== 'pending') {
      await conn.rollback();
      return res.status(400).json({ error: 'Chỉ có thể từ chối nhà hàng đang chờ xét duyệt.' });
    }

    await conn.query(
      `UPDATE restaurants
       SET status = 'suspended', rejection_reason = ?, approved_at = NULL, approved_by_admin_id = NULL
       WHERE id = ?`,
      [reason, restaurantId],
    );

    const title = 'Hồ sơ quán chưa được chấp nhận';
    const body = `Hồ sơ quán "${restaurant.name}" chưa được chấp nhận. Lý do: ${reason}`;
    await insertNotification(conn, {
      userId: restaurant.owner_user_id,
      title,
      body,
      linkUrl: '/merchant/pending',
    });

    await conn.commit();

    await sendKycRejectedEmailSafe({
      to: restaurant.owner_email,
      fullName: restaurant.owner_name,
      subjectKind: 'quán ăn',
      reason,
      portalPath: '/merchant/onboarding',
    });

    const [updated] = await pool.query(
      `SELECT r.*, u.full_name AS owner_name, u.email AS owner_email, c.name AS cuisine_name
       FROM restaurants r
       JOIN users u ON u.id = r.owner_user_id
       LEFT JOIN cuisines c ON c.id = r.cuisine_id
       WHERE r.id = ? LIMIT 1`,
      [restaurantId],
    );

    res.json({ ok: true, restaurant: serializeRestaurantRow(updated[0]) });
  } catch (err) {
    await conn.rollback();
    next(err);
  } finally {
    conn.release();
  }
});

router.get('/drivers/pending', async (_req, res, next) => {
  try {
    const [rows] = await pool.query(
      `SELECT dp.*, u.full_name, u.email, u.phone AS user_phone
       FROM driver_profiles dp
       JOIN users u ON u.id = dp.user_id
       WHERE dp.approval_status = 'pending'
       ORDER BY dp.created_at ASC`,
    );
    res.json({ items: rows.map(serializeDriverRow) });
  } catch (err) {
    next(err);
  }
});

router.post('/drivers/:userId/approve', async (req, res, next) => {
  const userId = Number(req.params.userId);
  const adminId = req.auth.userId;

  if (!userId) {
    return res.status(400).json({ error: 'ID tài xế không hợp lệ.' });
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [rows] = await conn.query(
      `SELECT dp.*, u.full_name, u.email, u.phone AS user_phone
       FROM driver_profiles dp
       JOIN users u ON u.id = dp.user_id
       WHERE dp.user_id = ? LIMIT 1`,
      [userId],
    );
    const profile = rows[0];
    if (!profile) {
      await conn.rollback();
      return res.status(404).json({ error: 'Hồ sơ tài xế không tồn tại.' });
    }
    if (profile.approval_status !== 'pending') {
      await conn.rollback();
      return res.status(400).json({ error: 'Chỉ có thể duyệt hồ sơ tài xế đang chờ xét duyệt.' });
    }

    await conn.query(
      `UPDATE driver_profiles
       SET approval_status = 'approved', approved_at = NOW(), approved_by_admin_id = ?
       WHERE user_id = ?`,
      [adminId, userId],
    );

    await ensureWallet(conn, userId, 'driver');

    const title = 'Hồ sơ tài xế đã được duyệt';
    const body = 'Hồ sơ tài xế của bạn đã được phê duyệt. Bạn có thể bắt đầu nhận đơn trên portal tài xế.';
    await insertNotification(conn, {
      userId,
      title,
      body,
      linkUrl: '/driver',
    });

    await conn.commit();

    await sendKycApprovedEmailSafe({
      to: profile.email,
      fullName: profile.full_name,
      subjectKind: 'tài xế',
      portalPath: '/driver',
    });

    const [updated] = await pool.query(
      `SELECT dp.*, u.full_name, u.email, u.phone AS user_phone
       FROM driver_profiles dp
       JOIN users u ON u.id = dp.user_id
       WHERE dp.user_id = ? LIMIT 1`,
      [userId],
    );

    res.json({ ok: true, driver: serializeDriverRow(updated[0]) });
  } catch (err) {
    await conn.rollback();
    next(err);
  } finally {
    conn.release();
  }
});

router.post('/drivers/:userId/reject', async (req, res, next) => {
  const userId = Number(req.params.userId);
  const reason = String(req.body?.reason ?? '').trim();

  if (!userId) {
    return res.status(400).json({ error: 'ID tài xế không hợp lệ.' });
  }
  if (!reason) {
    return res.status(400).json({ error: 'Vui lòng nhập lý do từ chối.' });
  }
  if (reason.length > 500) {
    return res.status(400).json({ error: 'Lý do từ chối không được vượt quá 500 ký tự.' });
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [rows] = await conn.query(
      `SELECT dp.*, u.full_name, u.email, u.phone AS user_phone
       FROM driver_profiles dp
       JOIN users u ON u.id = dp.user_id
       WHERE dp.user_id = ? LIMIT 1`,
      [userId],
    );
    const profile = rows[0];
    if (!profile) {
      await conn.rollback();
      return res.status(404).json({ error: 'Hồ sơ tài xế không tồn tại.' });
    }
    if (profile.approval_status !== 'pending') {
      await conn.rollback();
      return res.status(400).json({ error: 'Chỉ có thể từ chối hồ sơ tài xế đang chờ xét duyệt.' });
    }

    await conn.query(
      `UPDATE driver_profiles
       SET approval_status = 'rejected', approved_at = NULL, approved_by_admin_id = NULL
       WHERE user_id = ?`,
      [userId],
    );

    const title = 'Hồ sơ tài xế chưa được chấp nhận';
    const body = `Hồ sơ tài xế của bạn chưa được chấp nhận. Lý do: ${reason}`;
    await insertNotification(conn, {
      userId,
      title,
      body,
      linkUrl: '/driver/pending',
    });

    await conn.commit();

    await sendKycRejectedEmailSafe({
      to: profile.email,
      fullName: profile.full_name,
      subjectKind: 'tài xế',
      reason,
      portalPath: '/driver/onboarding',
    });

    const [updated] = await pool.query(
      `SELECT dp.*, u.full_name, u.email, u.phone AS user_phone
       FROM driver_profiles dp
       JOIN users u ON u.id = dp.user_id
       WHERE dp.user_id = ? LIMIT 1`,
      [userId],
    );

    res.json({ ok: true, driver: serializeDriverRow(updated[0]) });
  } catch (err) {
    await conn.rollback();
    next(err);
  } finally {
    conn.release();
  }
});

async function sendKycApprovedEmailSafe(payload) {
  try {
    const { sendKycApprovedEmail } = await import('../lib/mail.js');
    await sendKycApprovedEmail(payload);
  } catch (err) {
    console.error('[mail] approve notification failed:', err.message);
  }
}

async function sendKycRejectedEmailSafe(payload) {
  try {
    const { sendKycRejectedEmail } = await import('../lib/mail.js');
    await sendKycRejectedEmail(payload);
  } catch (err) {
    console.error('[mail] reject notification failed:', err.message);
  }
}

// --- QUẢN LÝ ĐƠN HÀNG TOÀN HỆ THỐNG ---

router.get('/orders', async (req, res, next) => {
  try {
    const status = req.query.status;
    const paymentMethod = req.query.paymentMethod;
    const paymentStatus = req.query.paymentStatus;
    const q = req.query.q;
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = 10;
    const offset = (page - 1) * limit;

    const filters = ['1 = 1'];
    const params = [];

    if (status && status !== 'all') {
      filters.push('o.status = ?');
      params.push(status);
    }

    if (paymentMethod && paymentMethod !== 'all') {
      filters.push('o.payment_method = ?');
      params.push(paymentMethod);
    }

    if (paymentStatus && paymentStatus !== 'all') {
      filters.push('o.payment_status = ?');
      params.push(paymentStatus);
    }

    if (q) {
      filters.push('(o.order_code LIKE ? OR u.email LIKE ?)');
      params.push(`%${q}%`, `%${q}%`);
    }

    const whereClause = filters.join(' AND ');

    const [countRows] = await pool.query(
      `SELECT COUNT(*) AS total 
       FROM orders o
       LEFT JOIN users u ON o.customer_id = u.id
       WHERE ${whereClause}`,
      params
    );
    const total = countRows[0]?.total ?? 0;

    const [rows] = await pool.query(
      `SELECT o.*, u.full_name AS customer_name, u.email AS customer_email, r.name AS restaurant_name
       FROM orders o
       LEFT JOIN users u ON o.customer_id = u.id
       LEFT JOIN restaurants r ON o.restaurant_id = r.id
       WHERE ${whereClause}
       ORDER BY o.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    res.json({
      items: rows,
      pagination: {
        page,
        limit,
        total
      }
    });
  } catch (err) {
    next(err);
  }
});

router.get('/orders/:id', async (req, res, next) => {
  try {
    const orderId = Number(req.params.id);
    if (!Number.isInteger(orderId) || orderId <= 0) {
      return res.status(400).json({ error: 'Invalid order ID.' });
    }

    const [orderRows] = await pool.query(
      'SELECT o.*, u.full_name AS customer_name, u.email AS customer_email, r.name AS restaurant_name FROM orders o LEFT JOIN users u ON u.id = o.customer_id LEFT JOIN restaurants r ON r.id = o.restaurant_id WHERE o.id = ? LIMIT 1',
      [orderId],
    );
    if (!orderRows.length) return res.status(404).json({ error: 'Order not found.' });

    const [itemsResult, logsResult, paymentsResult, refundsResult] = await Promise.all([
      pool.query('SELECT * FROM order_items WHERE order_id = ? ORDER BY id ASC', [orderId]),
      pool.query('SELECT * FROM order_status_logs WHERE order_id = ? ORDER BY created_at ASC, id ASC', [orderId]),
      pool.query('SELECT * FROM payments WHERE order_id = ? ORDER BY created_at DESC, id DESC', [orderId]),
      pool.query('SELECT * FROM payment_refunds WHERE order_id = ? ORDER BY created_at DESC, id DESC', [orderId]),
    ]);

    return res.json({
      order: {
        ...orderRows[0],
        items: itemsResult[0],
        statusLogs: logsResult[0],
        payments: paymentsResult[0],
        refunds: refundsResult[0],
      },
    });
  } catch (error) {
    return next(error);
  }
});

router.post('/orders/:id/cancel', async (req, res, next) => {
  const orderId = Number(req.params.id);
  const reason = String(req.body?.reason ?? '').trim().slice(0, 500)
    || 'Cancelled by an administrator.';
  if (!Number.isInteger(orderId) || orderId <= 0) {
    return res.status(400).json({ error: 'Invalid order ID.' });
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [orders] = await connection.query(
      'SELECT * FROM orders WHERE id = ? FOR UPDATE',
      [orderId],
    );
    const order = orders[0];
    if (!order) {
      await connection.rollback();
      return res.status(404).json({ error: 'Order not found.' });
    }
    if (['cancelled', 'delivered', 'failed', 'picked_up', 'delivering'].includes(order.status)) {
      await connection.rollback();
      return res.status(409).json({ error: 'This order cannot be cancelled in its current state.' });
    }

    let paymentStatus = order.payment_status;
    let refundResponse = null;
    if (order.payment_status === 'paid') {
      if (order.payment_method !== 'vnpay') {
        await connection.rollback();
        return res.status(409).json({ error: 'Paid non-VNPay orders require a manual refund workflow.' });
      }

      const refundConfig = {
        tmnCode: process.env.VNPAY_TMN_CODE,
        secret: process.env.VNPAY_HASH_SECRET,
        apiUrl: process.env.VNPAY_API_URL,
      };
      const missing = Object.entries(refundConfig)
        .filter(([, value]) => !value)
        .map(([key]) => key);
      if (missing.length) {
        await connection.rollback();
        return res.status(503).json({ error: 'VNPay refund is not configured.', missing });
      }

      const [paymentRows] = await connection.query(
        "SELECT * FROM payments WHERE order_id = ? AND method = 'vnpay' AND status = 'succeeded' ORDER BY paid_at DESC, id DESC LIMIT 1 FOR UPDATE",
        [order.id],
      );
      const payment = paymentRows[0];
      if (!payment) {
        await connection.rollback();
        return res.status(409).json({ error: 'No successful VNPay payment was found for this order.' });
      }

      const [activeRefundRows] = await connection.query(
        "SELECT * FROM payment_refunds WHERE payment_id = ? AND status IN ('initiated', 'succeeded') ORDER BY id DESC LIMIT 1 FOR UPDATE",
        [payment.id],
      );
      if (activeRefundRows.length) {
        await connection.rollback();
        return res.status(409).json({
          error: activeRefundRows[0].status === 'succeeded'
            ? 'This payment has already been refunded.'
            : 'A refund is already in progress.',
        });
      }

      const requestId = ('RF-' + order.order_code + '-' + Date.now()).slice(0, 120);
      const [refundResult] = await connection.query(
        "INSERT INTO payment_refunds (payment_id, order_id, request_id, amount, status) VALUES (?, ?, ?, ?, 'initiated')",
        [payment.id, order.id, requestId, order.total_amount],
      );
      const payload = buildRefundPayload({
        secret: refundConfig.secret,
        tmnCode: refundConfig.tmnCode,
        requestId,
        txnRef: payment.gateway_reference || order.order_code,
        amount: order.total_amount,
        transactionNo: payment.gateway_txn_id,
        transactionDate: formatVnpayDate(new Date(payment.gateway_created_at || payment.paid_at || payment.created_at)),
        createBy: req.auth.userId,
        ipAddress: String(req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1')
          .split(',')[0].trim().replace(/^::ffff:/, ''),
        orderInfo: 'Hoan tien don hang ' + order.order_code,
      });

      let refundFailure = null;
      try {
        const gatewayResult = await fetch(refundConfig.apiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          signal: AbortSignal.timeout(10000),
        });
        const rawText = await gatewayResult.text();
        try {
          refundResponse = JSON.parse(rawText);
        } catch {
          refundResponse = { rawText: rawText.slice(0, 2000) };
        }
        const signatureValid = verifyRefundResponse(refundResponse, refundConfig.secret);
        const gatewaySucceeded = gatewayResult.ok
          && signatureValid
          && refundResponse.vnp_ResponseCode === '00'
          && refundResponse.vnp_TransactionStatus === '00';
        if (!gatewaySucceeded) {
          refundFailure = signatureValid
            ? String(refundResponse.vnp_Message || refundResponse.vnp_ResponseCode || 'VNPay rejected the refund.')
            : 'Invalid VNPay refund response signature.';
        }
      } catch (error) {
        refundFailure = error.name === 'TimeoutError'
          ? 'VNPay refund request timed out.'
          : 'VNPay refund request failed: ' + error.message;
        refundResponse = { error: refundFailure };
      }

      if (refundFailure) {
        await connection.query(
          "UPDATE payment_refunds SET status = 'failed', failure_reason = ?, raw_response = ?, completed_at = NOW() WHERE id = ?",
          [refundFailure.slice(0, 500), JSON.stringify(refundResponse), refundResult.insertId],
        );
        await connection.commit();
        return res.status(502).json({
          error: 'The gateway did not confirm the refund. The order was not cancelled.',
          reason: refundFailure,
        });
      }

      await connection.query(
        "UPDATE payment_refunds SET status = 'succeeded', gateway_txn_id = ?, raw_response = ?, completed_at = NOW() WHERE id = ?",
        [refundResponse.vnp_TransactionNo || null, JSON.stringify(refundResponse), refundResult.insertId],
      );
      paymentStatus = 'refunded';
    }

    await connection.query(
      "UPDATE orders SET status = 'cancelled', cancelled_by_role = 'admin', cancel_reason = ?, cancelled_at = NOW(), payment_status = ? WHERE id = ?",
      [reason, paymentStatus, order.id],
    );
    await connection.query(
      "UPDATE payments SET status = 'cancelled', failure_reason = 'Order cancelled by admin' WHERE order_id = ? AND status IN ('initiated', 'pending')",
      [order.id],
    );
    await connection.query(
      "UPDATE voucher_redemptions SET status = 'released', released_at = NOW() WHERE order_id = ? AND status IN ('reserved', 'redeemed')",
      [order.id],
    );
    await connection.query(
      "INSERT INTO order_status_logs (order_id, from_status, to_status, changed_by_role, changed_by_user_id, note) VALUES (?, ?, 'cancelled', 'admin', ?, ?)",
      [order.id, order.status, req.auth.userId, reason],
    );
    await connection.query(
      "INSERT INTO notifications (user_id, type, title, body, link_url) VALUES (?, 'order_cancelled', ?, ?, '/app/orders')",
      [
        order.customer_id,
        'Don hang ' + order.order_code + ' da bi huy',
        'Don hang ' + order.order_code + ' da bi quan tri vien huy. Ly do: ' + reason,
      ],
    );

    await connection.commit();
    const [updatedOrders] = await pool.query(
      'SELECT * FROM orders WHERE id = ? LIMIT 1',
      [order.id],
    );
    return res.json({
      ok: true,
      order: updatedOrders[0],
      refund: refundResponse
        ? { status: 'succeeded', transactionNo: refundResponse.vnp_TransactionNo || null }
        : null,
    });
  } catch (error) {
    await connection.rollback();
    return next(error);
  } finally {
    connection.release();
  }
});

// --- KIEM DUYET DANH GIA ---

router.get('/reviews', async (req, res, next) => {
  try {
    const { hidden, page, q } = req.query;
    const ratingMax = req.query.ratingMax === undefined ? null : Number(req.query.ratingMax);
    const pageVal = Math.max(1, parseInt(page, 10) || 1);
    const limit = 10;
    const offset = (pageVal - 1) * limit;

    let whereSql = '1 = 1';
    const params = [];

    if (hidden === 'true' || hidden === '1') {
      whereSql += ' AND rv.is_hidden = 1';
    } else if (hidden === 'false' || hidden === '0') {
      whereSql += ' AND rv.is_hidden = 0';
    }

    if (ratingMax !== null) {
      if (!Number.isInteger(ratingMax) || ratingMax < 1 || ratingMax > 5) {
        return res.status(400).json({ error: 'ratingMax must be an integer from 1 to 5.' });
      }
      whereSql += ' AND rv.rating <= ?';
      params.push(ratingMax);
    }
    const search = String(q ?? '').trim();
    if (search) {
      whereSql += ' AND (rv.comment LIKE ? OR u.full_name LIKE ? OR r.name LIKE ? OR o.order_code LIKE ?)';
      const needle = '%' + search + '%';
      params.push(needle, needle, needle, needle);
    }

    const [countRows] = await pool.query(
      `SELECT COUNT(*) as total
       FROM reviews rv
       LEFT JOIN users u ON rv.customer_id = u.id
       LEFT JOIN restaurants r ON rv.restaurant_id = r.id
       LEFT JOIN orders o ON rv.order_id = o.id
       WHERE ${whereSql}`,
      params
    );
    const total = countRows[0]?.total ?? 0;

    const [rows] = await pool.query(
      `SELECT rv.*, u.full_name AS customer_name, u.avatar_url AS customer_avatar, r.name AS restaurant_name, o.order_code
       FROM reviews rv
       LEFT JOIN users u ON rv.customer_id = u.id
       LEFT JOIN restaurants r ON rv.restaurant_id = r.id
       LEFT JOIN orders o ON rv.order_id = o.id
       WHERE ${whereSql}
       ORDER BY rv.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    res.json({
      items: rows,
      pagination: {
        page: pageVal,
        limit,
        total
      }
    });
  } catch (err) {
    next(err);
  }
});

router.patch('/reviews/:id', async (req, res, next) => {
  const connection = await pool.getConnection();
  try {
    const id = Number(req.params.id);
    const { isHidden } = req.body;

    if (isNaN(id)) {
      return res.status(400).json({ error: 'ID đánh giá không hợp lệ' });
    }

    if (isHidden === undefined) {
      return res.status(400).json({ error: 'Thiếu trường isHidden' });
    }

    await connection.beginTransaction();

    const [reviews] = await connection.query(
      'SELECT restaurant_id FROM reviews WHERE id = ? FOR UPDATE',
      [id]
    );

    if (reviews.length === 0) {
      await connection.rollback();
      return res.status(404).json({ error: 'Không tìm thấy đánh giá' });
    }

    const { restaurant_id } = reviews[0];

    await connection.query(
      'UPDATE reviews SET is_hidden = ? WHERE id = ?',
      [isHidden ? 1 : 0, id]
    );

    const [stats] = await connection.query(
      `SELECT AVG(rating) AS avg_rating, COUNT(id) AS cnt FROM reviews WHERE restaurant_id = ? AND is_hidden = 0`,
      [restaurant_id]
    );
    
    const nextAvg = Number(stats[0].avg_rating || 0).toFixed(2);
    const nextCount = stats[0].cnt || 0;

    await connection.query(
      `UPDATE restaurants SET rating_avg = ?, review_count = ? WHERE id = ?`,
      [nextAvg, nextCount, restaurant_id]
    );

    await connection.commit();
    res.json({ ok: true, isHidden: Boolean(isHidden) });
  } catch (err) {
    await connection.rollback();
    next(err);
  } finally {
    connection.release();
  }
});

export default router;
