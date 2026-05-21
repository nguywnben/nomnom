import { Router } from 'express';
import bcrypt from 'bcrypt';
import pool from '../db/pool.js';
import { requireAuth } from '../middleware/auth.js';
import {
  accessExpiresInSeconds,
  createRefreshToken,
  hashToken,
  refreshExpiresAt,
  signAccessToken,
} from '../lib/auth.js';

const router = Router();

async function loadRoles(userId) {
  const [rows] = await pool.query(
    'SELECT role FROM user_roles WHERE user_id = ? ORDER BY role',
    [userId],
  );
  return rows.map((r) => r.role);
}

function serializeUser(row, roles) {
  return {
    id: row.id,
    email: row.email,
    phone: row.phone,
    fullName: row.full_name,
    avatarUrl: row.avatar_url,
    primaryRole: row.primary_role,
    status: row.status,
    roles,
  };
}

async function issueSession(userRow, roles, req) {
  const accessToken = signAccessToken(userRow, roles);
  const refreshToken = createRefreshToken();
  const tokenHash = hashToken(refreshToken);

  await pool.query(
    `INSERT INTO refresh_tokens (user_id, token_hash, user_agent, ip_address, expires_at)
     VALUES (?, ?, ?, ?, ?)`,
    [
      userRow.id,
      tokenHash,
      req.headers['user-agent']?.slice(0, 255) ?? null,
      req.ip ?? null,
      refreshExpiresAt(),
    ],
  );

  await pool.query('UPDATE users SET last_login_at = NOW() WHERE id = ?', [userRow.id]);

  return {
    accessToken,
    refreshToken,
    expiresIn: accessExpiresInSeconds(),
    user: serializeUser(userRow, roles),
  };
}

/**
 * POST /api/v1/auth/register
 * Đăng ký khách hàng (ứng dụng /app). Tài xế & chủ quán có luồng riêng sau.
 * Body: { fullName, email, phone?, password }
 */
router.post('/register', async (req, res, next) => {
  try {
    const requestedRole = req.body?.role;
    if (requestedRole && requestedRole !== 'customer') {
      return res.status(400).json({
        error:
          'Đăng ký tại đây chỉ dành cho khách hàng. Tài xế và nhà hàng sẽ có hình thức đăng ký riêng.',
      });
    }

    const fullName = String(req.body?.fullName ?? '').trim();
    const email = String(req.body?.email ?? '')
      .trim()
      .toLowerCase();
    const phone = String(req.body?.phone ?? '').trim() || null;
    const password = String(req.body?.password ?? '');

    if (!fullName || !email || !password) {
      return res.status(400).json({ error: 'Họ tên, email và mật khẩu là bắt buộc.' });
    }
    if (password.length < 8) {
      return res.status(400).json({ error: 'Mật khẩu phải có ít nhất 8 ký tự.' });
    }

    const [existingEmail] = await pool.query('SELECT id FROM users WHERE email = ? LIMIT 1', [email]);
    if (existingEmail.length) {
      return res.status(409).json({ error: 'Email này đã được sử dụng.' });
    }
    if (phone) {
      const [existingPhone] = await pool.query('SELECT id FROM users WHERE phone = ? LIMIT 1', [phone]);
      if (existingPhone.length) {
        return res.status(409).json({ error: 'Số điện thoại này đã được sử dụng.' });
      }
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const avatarUrl = `https://api.dicebear.com/9.x/avataaars/svg?seed=${encodeURIComponent(fullName)}&radius=50`;

    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      const [insertUser] = await conn.query(
        `INSERT INTO users (email, phone, password_hash, full_name, avatar_url, primary_role, status, email_verified_at)
         VALUES (?, ?, ?, ?, ?, 'customer', 'active', NOW())`,
        [email, phone, passwordHash, fullName, avatarUrl],
      );
      const userId = insertUser.insertId;

      await conn.query('INSERT INTO user_roles (user_id, role) VALUES (?, ?)', [userId, 'customer']);
      await conn.query('INSERT INTO customer_profiles (user_id) VALUES (?)', [userId]);

      await conn.commit();

      const userRow = {
        id: userId,
        email,
        phone,
        full_name: fullName,
        avatar_url: avatarUrl,
        primary_role: 'customer',
        status: 'active',
      };
      const session = await issueSession(userRow, ['customer'], req);
      res.status(201).json(session);
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Email hoặc số điện thoại đã tồn tại.' });
    }
    next(err);
  }
});

/**
 * POST /api/v1/auth/login
 * Body: { email, password }
 */
router.post('/login', async (req, res, next) => {
  try {
    const email = String(req.body?.email ?? '')
      .trim()
      .toLowerCase();
    const password = String(req.body?.password ?? '');

    if (!email || !password) {
      return res.status(400).json({ error: 'Email và mật khẩu là bắt buộc.' });
    }

    const [rows] = await pool.query(
      `SELECT id, email, phone, password_hash, full_name, avatar_url, primary_role, status
       FROM users WHERE email = ? LIMIT 1`,
      [email],
    );
    const user = rows[0];
    if (!user) {
      return res.status(401).json({ error: 'Email hoặc mật khẩu không đúng.' });
    }
    if (user.status !== 'active') {
      return res.status(403).json({ error: 'Tài khoản chưa được kích hoạt hoặc đã bị khóa.' });
    }

    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) {
      return res.status(401).json({ error: 'Email hoặc mật khẩu không đúng.' });
    }

    const roles = await loadRoles(user.id);
    if (!roles.length) {
      roles.push(user.primary_role);
    }

    const session = await issueSession(user, roles, req);
    res.json(session);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/auth/me
 */
router.get('/me', requireAuth, async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      `SELECT id, email, phone, full_name, avatar_url, primary_role, status
       FROM users WHERE id = ? LIMIT 1`,
      [req.auth.userId],
    );
    const user = rows[0];
    if (!user || user.status !== 'active') {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const roles = await loadRoles(user.id);
    res.json({ user: serializeUser(user, roles.length ? roles : [user.primary_role]) });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/v1/auth/refresh
 * Body: { refreshToken }
 */
router.post('/refresh', async (req, res, next) => {
  try {
    const raw = String(req.body?.refreshToken ?? '');
    if (!raw) {
      return res.status(400).json({ error: 'Refresh token required' });
    }

    const tokenHash = hashToken(raw);
    const [rows] = await pool.query(
      `SELECT rt.id AS token_id, rt.user_id, u.email, u.phone, u.full_name, u.avatar_url,
              u.primary_role, u.status
       FROM refresh_tokens rt
       INNER JOIN users u ON u.id = rt.user_id
       WHERE rt.token_hash = ?
         AND rt.revoked_at IS NULL
         AND rt.expires_at > NOW()
       LIMIT 1`,
      [tokenHash],
    );
    const row = rows[0];
    if (!row || row.status !== 'active') {
      return res.status(401).json({ error: 'Invalid refresh token' });
    }

    await pool.query('UPDATE refresh_tokens SET revoked_at = NOW() WHERE id = ?', [row.token_id]);

    const userRow = {
      id: row.user_id,
      email: row.email,
      phone: row.phone,
      full_name: row.full_name,
      avatar_url: row.avatar_url,
      primary_role: row.primary_role,
      status: row.status,
    };
    const roles = await loadRoles(row.user_id);
    const session = await issueSession(userRow, roles.length ? roles : [row.primary_role], req);
    res.json(session);
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/v1/auth/logout
 * Body: { refreshToken } (optional — revokes that session)
 */
router.post('/logout', async (req, res, next) => {
  try {
    const raw = String(req.body?.refreshToken ?? '');
    if (raw) {
      const tokenHash = hashToken(raw);
      await pool.query(
        'UPDATE refresh_tokens SET revoked_at = NOW() WHERE token_hash = ? AND revoked_at IS NULL',
        [tokenHash],
      );
    }
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

export default router;
