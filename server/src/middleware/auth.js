import pool from '../db/pool.js';
import { verifyAccessToken } from '../lib/auth.js';
import { normalizeRoles } from '../lib/roles.js';

export async function requireAuth(req, res, next) {
  const hdr = req.headers.authorization;
  if (!hdr?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  try {
    const payload = verifyAccessToken(hdr.slice(7));
    const [rows] = await pool.query('SELECT token_version FROM users WHERE id = ? LIMIT 1', [Number(payload.sub)]);
    const row = rows[0];
    if (!row || Number(row.token_version ?? 0) !== Number(payload.tokenVersion ?? 0)) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }
    req.auth = {
      userId: Number(payload.sub),
      primaryRole: payload.primaryRole,
      roles: normalizeRoles(payload.roles ?? []),
    };
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}
