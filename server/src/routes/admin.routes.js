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
