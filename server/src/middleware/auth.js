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

export function ensureCustomer(req, res, next) {
  if ((req.auth.roles ?? []).includes('customer')) {
    return next();
  }
  return res.status(403).json({ error: 'Quyền truy cập bị từ chối. Chỉ dành cho khách hàng.' });
}

