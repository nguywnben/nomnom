import { verifyAccessToken } from '../lib/auth.js';
import { normalizeRoles } from '../lib/roles.js';

export function requireAuth(req, res, next) {
  const hdr = req.headers.authorization;
  if (!hdr?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  try {
    const payload = verifyAccessToken(hdr.slice(7));
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
