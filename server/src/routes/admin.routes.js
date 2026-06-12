import { Router } from 'express';
import bcrypt from 'bcrypt';
import pool from '../db/pool.js';
import { requireAuth } from '../middleware/auth.js';
import { sendAdminResetPasswordEmail } from '../lib/mail.js';

const router = Router();

function ensureAdmin(req, res, next) {
  if (req.auth.primaryRole === 'admin' || (req.auth.roles ?? []).includes('admin')) {
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
      `SELECT u.id, u.email, u.full_name, u.avatar_url, u.primary_role, u.status, u.suspension_expires_at, u.created_at,
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

    if (!id || !['active', 'suspended', 'banned'].includes(status)) {
      return res.status(400).json({ error: 'Status không hợp lệ.' });
    }

    const [rows] = await pool.query('SELECT id FROM users WHERE id = ? LIMIT 1', [id]);
    if (!rows.length) {
      return res.status(404).json({ error: 'Người dùng không tồn tại.' });
    }

    let expiresAt = null;
    if (status === 'suspended') {
      const days = Number(suspensionDays ?? 0);
      if (!Number.isInteger(days) || days < 1 || days > 365) {
        return res.status(400).json({ error: 'Số ngày đình chỉ phải là số nguyên từ 1 đến 365.' });
      }
      expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
    }

    await pool.query(
      'UPDATE users SET status = ?, suspension_expires_at = ? WHERE id = ?',
      [status, expiresAt, id],
    );

    res.json({ ok: true, status, suspensionExpiresAt: expiresAt ? expiresAt.toISOString() : null });
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

export default router;
