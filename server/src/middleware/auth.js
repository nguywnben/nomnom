import { verifyAccessToken } from '../lib/auth.js';
import { normalizeRoles } from '../lib/roles.js';
import pool from '../db/pool.js';

export async function requireAuth(req, res, next) {
  const hdr = req.headers.authorization;
  if (!hdr?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  try {
    const payload = verifyAccessToken(hdr.slice(7));
    const userId = Number(payload.sub);
    const [roleRows] = await pool.query(
      'SELECT role FROM user_roles WHERE user_id = ? ORDER BY role',
      [userId],
    );
    req.auth = {
      userId,
      primaryRole: payload.primaryRole,
      // Quyền có thể thay đổi khi admin duyệt quán, nên không dùng quyền đã
      // được đóng băng trong access token lúc người dùng đăng nhập.
      roles: normalizeRoles(roleRows.map((row) => row.role)),
    };
    next();
  } catch (error) {
    if (error?.code) return next(error);
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

export function ensureCustomer(req, res, next) {
  if ((req.auth.roles ?? []).includes('customer')) {
    return next();
  }
  return res.status(403).json({ error: 'Quyền truy cập bị từ chối. Chỉ dành cho khách hàng.' });
}

