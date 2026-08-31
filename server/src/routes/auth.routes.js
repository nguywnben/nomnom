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
  verifyPasswordResetToken,
} from '../lib/auth.js';
import {
  applyPasswordReset,
  createAndSendResetOtp,
  verifyResetOtpAndIssueToken,
} from '../lib/passwordReset.js';
import {
  createAndSendRegisterOtp,
  createUserFromPending,
  getValidRegisterOtp,
  loadPendingRegistration,
  savePendingRegistration,
} from '../lib/registration.js';
import { normalizeRoles } from '../lib/roles.js';
import { loadPartnerAccess } from '../lib/partnerAccess.js';

const router = Router();

async function loadRoles(userId) {
  const [rows] = await pool.query(
    'SELECT role FROM user_roles WHERE user_id = ? ORDER BY role',
    [userId],
  );
  return rows.map((r) => r.role);
}

async function restoreExpiredSuspension(user) {
  if (!user || user.status !== 'suspended' || !user.suspension_expires_at) {
    return user;
  }

  const expires = new Date(user.suspension_expires_at);
  if (expires > new Date()) {
    return user;
  }

  await pool.query('UPDATE users SET status = ?, suspension_expires_at = NULL WHERE id = ?', [
    'active',
    user.id,
  ]);
  user.status = 'active';
  user.suspension_expires_at = null;
  return user;
}

async function serializeUser(row, roles) {
  const partnerAccess = await loadPartnerAccess(pool, row.id, roles);
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

async function issueSession(userRow, roles, req, { remember = true } = {}) {
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
      refreshExpiresAt(remember),
    ],
  );

  await pool.query('UPDATE users SET last_login_at = NOW() WHERE id = ?', [userRow.id]);

  return {
    accessToken,
    refreshToken,
    expiresIn: accessExpiresInSeconds(),
    user: await serializeUser(userRow, roles),
  };
}

function parseRegisterBody(body) {
  const requestedRole = body?.role;
  if (requestedRole && requestedRole !== 'customer') {
    return { error: 'Đăng ký tại đây chỉ dành cho khách hàng. Đối tác quán ăn sẽ có hình thức đăng ký riêng.' };
  }

  const fullName = String(body?.fullName ?? '').trim();
  const email = String(body?.email ?? '')
    .trim()
    .toLowerCase();
  const password = String(body?.password ?? '');

  if (!fullName || !email || !password) {
    return { error: 'Họ tên, email và mật khẩu là bắt buộc.' };
  }
  if (password.length < 8) {
    return { error: 'Mật khẩu phải có ít nhất 8 ký tự.' };
  }

  return { fullName, email, password };
}

/**
 * POST /api/v1/auth/register/send-code
 * Lưu thông tin đăng ký tạm và gửi mã OTP qua email.
 */
router.post('/register/send-code', async (req, res, next) => {
  try {
    const parsed = parseRegisterBody(req.body);
    if (parsed.error) {
      return res.status(400).json({ error: parsed.error });
    }
    const { fullName, email, password } = parsed;

    const [existingEmail] = await pool.query('SELECT id FROM users WHERE email = ? LIMIT 1', [email]);
    if (existingEmail.length) {
      return res.status(409).json({ error: 'Email này đã được sử dụng.' });
    }

    await savePendingRegistration({ email, fullName, password });
    const meta = await createAndSendRegisterOtp({ email, fullName });

    res.json({
      ok: true,
      email,
      message: 'Đã gửi mã xác minh đến email của bạn.',
      expiresInMinutes: meta.expiresInMinutes,
      ...(meta.devOtpLogged ? { devHint: 'SMTP chưa cấu hình — xem mã OTP trong log server.' } : {}),
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/v1/auth/register/resend-code
 * Body: { email }
 */
router.post('/register/resend-code', async (req, res, next) => {
  try {
    const email = String(req.body?.email ?? '')
      .trim()
      .toLowerCase();
    if (!email) {
      return res.status(400).json({ error: 'Email là bắt buộc.' });
    }

    const pending = await loadPendingRegistration(email);
    if (!pending) {
      return res.status(400).json({
        error: 'Phiên đăng ký đã hết hạn. Vui lòng điền lại form đăng ký.',
      });
    }

    const meta = await createAndSendRegisterOtp({ email, fullName: pending.full_name });
    res.json({
      ok: true,
      email,
      expiresInMinutes: meta.expiresInMinutes,
      ...(meta.devOtpLogged ? { devHint: 'SMTP chưa cấu hình — xem mã OTP trong log server.' } : {}),
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/v1/auth/register/verify
 * Body: { email, code } — hoàn tất đăng ký sau khi nhập OTP.
 */
router.post('/register/verify', async (req, res, next) => {
  try {
    const email = String(req.body?.email ?? '')
      .trim()
      .toLowerCase();
    const code = String(req.body?.code ?? '').trim();

    if (!email || !code) {
      return res.status(400).json({ error: 'Email và mã xác minh là bắt buộc.' });
    }
    if (!/^\d{6}$/.test(code)) {
      return res.status(400).json({ error: 'Mã xác minh phải gồm 6 chữ số.' });
    }

    const otp = await getValidRegisterOtp(email, code);
    if (!otp.ok) {
      if (otp.reason === 'locked') {
        return res.status(429).json({ error: 'Đã nhập sai quá nhiều lần. Hãy gửi lại mã mới.' });
      }
      return res.status(400).json({ error: 'Mã xác minh không đúng hoặc đã hết hạn.' });
    }

    const pending = await loadPendingRegistration(email);
    if (!pending) {
      return res.status(400).json({
        error: 'Phiên đăng ký đã hết hạn. Vui lòng đăng ký lại từ đầu.',
      });
    }

    const [existingEmail] = await pool.query('SELECT id FROM users WHERE email = ? LIMIT 1', [email]);
    if (existingEmail.length) {
      return res.status(409).json({ error: 'Email này đã được sử dụng.' });
    }

    const userRow = await createUserFromPending(pending);
    const session = await issueSession(userRow, ['customer'], req);
    res.status(201).json(session);
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Email này đã được sử dụng.' });
    }
    next(err);
  }
});

/**
 * POST /api/v1/auth/forgot-password/send-code
 * Body: { email }
 */
router.post('/forgot-password/send-code', async (req, res, next) => {
  try {
    const email = String(req.body?.email ?? '')
      .trim()
      .toLowerCase();
    if (!email) {
      return res.status(400).json({ error: 'Email là bắt buộc.' });
    }

    const meta = await createAndSendResetOtp(email);
    res.json({
      ok: true,
      email,
      message:
        'Nếu email đã đăng ký trong NomNom, bạn sẽ nhận mã 6 chữ số trong hộp thư (kể cả thư rác).',
      expiresInMinutes: meta.expiresInMinutes,
      ...(meta.devOtpLogged ? { devHint: 'SMTP chưa cấu hình — xem mã OTP trong log server.' } : {}),
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/v1/auth/forgot-password/resend-code
 * Body: { email }
 */
router.post('/forgot-password/resend-code', async (req, res, next) => {
  try {
    const email = String(req.body?.email ?? '')
      .trim()
      .toLowerCase();
    if (!email) {
      return res.status(400).json({ error: 'Email là bắt buộc.' });
    }

    const meta = await createAndSendResetOtp(email);
    res.json({
      ok: true,
      email,
      expiresInMinutes: meta.expiresInMinutes,
      ...(meta.devOtpLogged ? { devHint: 'SMTP chưa cấu hình — xem mã OTP trong log server.' } : {}),
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/v1/auth/forgot-password/verify
 * Body: { email, code }
 */
router.post('/forgot-password/verify', async (req, res, next) => {
  try {
    const email = String(req.body?.email ?? '')
      .trim()
      .toLowerCase();
    const code = String(req.body?.code ?? '').trim();

    if (!email || !code) {
      return res.status(400).json({ error: 'Email và mã xác minh là bắt buộc.' });
    }
    if (!/^\d{6}$/.test(code)) {
      return res.status(400).json({ error: 'Mã xác minh phải gồm 6 chữ số.' });
    }

    const result = await verifyResetOtpAndIssueToken(email, code);
    if (!result.ok) {
      if (result.reason === 'locked') {
        return res.status(429).json({ error: 'Đã nhập sai quá nhiều lần. Hãy gửi lại mã mới.' });
      }
      return res.status(400).json({ error: 'Mã xác minh không đúng hoặc đã hết hạn.' });
    }

    res.json({ ok: true, resetToken: result.resetToken });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/v1/auth/forgot-password/reset
 * Body: { resetToken, password }
 */
router.post('/forgot-password/reset', async (req, res, next) => {
  try {
    const resetToken = String(req.body?.resetToken ?? '').trim();
    const password = String(req.body?.password ?? '');

    if (!resetToken || !password) {
      return res.status(400).json({ error: 'Token và mật khẩu mới là bắt buộc.' });
    }
    if (password.length < 8) {
      return res.status(400).json({ error: 'Mật khẩu phải có ít nhất 8 ký tự.' });
    }

    let payload;
    try {
      payload = verifyPasswordResetToken(resetToken);
    } catch {
      return res.status(400).json({ error: 'Liên kết đặt lại mật khẩu không hợp lệ hoặc đã hết hạn.' });
    }

    await applyPasswordReset(payload.userId, payload.email, password);
    res.json({ ok: true, message: 'Đã đặt lại mật khẩu. Hãy đăng nhập bằng mật khẩu mới.' });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/v1/auth/login
 * Body: { email, password, rememberMe?: boolean }
 */
router.post('/login', async (req, res, next) => {
  try {
    const email = String(req.body?.email ?? '')
      .trim()
      .toLowerCase();
    const password = String(req.body?.password ?? '');
    const remember = req.body?.rememberMe !== false;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email và mật khẩu là bắt buộc.' });
    }

    const [rows] = await pool.query(
      `SELECT id, email, phone, password_hash, full_name, avatar_url, primary_role, status, suspension_expires_at
       FROM users WHERE email = ? LIMIT 1`,
      [email],
    );
    let user = rows[0];
    if (!user) {
      return res.status(401).json({ error: 'Email hoặc mật khẩu không đúng.' });
    }
    user = await restoreExpiredSuspension(user);
    if (user.status !== 'active') {
      return res.status(403).json({ error: 'Tài khoản chưa được kích hoạt hoặc đã bị khóa.' });
    }

    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) {
      return res.status(401).json({ error: 'Email hoặc mật khẩu không đúng.' });
    }

    const roles = normalizeRoles(await loadRoles(user.id));

    const session = await issueSession(user, roles, req, { remember });
    res.json({ ...session, rememberMe: remember });
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
      `SELECT id, email, phone, full_name, avatar_url, primary_role, status, suspension_expires_at
       FROM users WHERE id = ? LIMIT 1`,
      [req.auth.userId],
    );
    let user = rows[0];
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    user = await restoreExpiredSuspension(user);
    if (user.status !== 'active') {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const roles = normalizeRoles(await loadRoles(user.id));
    res.json({ user: await serializeUser(user, roles) });
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
              u.primary_role, u.status, u.suspension_expires_at
       FROM refresh_tokens rt
       INNER JOIN users u ON u.id = rt.user_id
       WHERE rt.token_hash = ?
         AND rt.revoked_at IS NULL
         AND rt.expires_at > NOW()
       LIMIT 1`,
      [tokenHash],
    );
    let row = rows[0];
    if (!row) {
      return res.status(401).json({ error: 'Invalid refresh token' });
    }
    row = await restoreExpiredSuspension(row);
    if (row.status !== 'active') {
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
    const roles = normalizeRoles(await loadRoles(row.user_id));
    const session = await issueSession(userRow, roles, req);
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

/**
 * POST /api/v1/auth/logout-all
 * Thu hồi mọi refresh token của user hiện tại (đăng xuất tất cả thiết bị).
 */
router.post('/logout-all', requireAuth, async (req, res, next) => {
  try {
    await pool.query(
      'UPDATE refresh_tokens SET revoked_at = NOW() WHERE user_id = ? AND revoked_at IS NULL',
      [req.auth.userId],
    );
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

export default router;
