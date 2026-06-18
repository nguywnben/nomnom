import crypto from 'crypto';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET ?? 'dev-nomnom-change-me';
const ACCESS_TTL = process.env.JWT_ACCESS_TTL ?? '15m';
const REFRESH_DAYS = Number(process.env.JWT_REFRESH_DAYS ?? 30);
const REFRESH_SESSION_DAYS = Number(process.env.JWT_REFRESH_SESSION_DAYS ?? 1);

export function signAccessToken(user, roles) {
  return jwt.sign(
    {
      sub: user.id,
      primaryRole: user.primary_role,
      roles,
    },
    JWT_SECRET,
    { expiresIn: ACCESS_TTL },
  );
}

export function verifyAccessToken(token) {
  return jwt.verify(token, JWT_SECRET);
}

export function createRefreshToken() {
  return crypto.randomBytes(48).toString('hex');
}

export function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/** @param {boolean} [remember=true] — false: phiên ngắn (không “ghi nhớ”) */
export function refreshExpiresAt(remember = true) {
  const d = new Date();
  d.setDate(d.getDate() + (remember ? REFRESH_DAYS : REFRESH_SESSION_DAYS));
  return d;
}

export function signPasswordResetToken(userId, email) {
  return jwt.sign(
    { sub: userId, email, purpose: 'password_reset' },
    JWT_SECRET,
    { expiresIn: '15m' },
  );
}

export function verifyPasswordResetToken(token) {
  const payload = jwt.verify(token, JWT_SECRET);
  if (payload.purpose !== 'password_reset') {
    const err = new Error('Invalid reset token');
    err.status = 401;
    throw err;
  }
  return { userId: payload.sub, email: payload.email };
}

export function accessExpiresInSeconds() {
  const match = /^(\d+)([smhd])$/.exec(ACCESS_TTL);
  if (!match) return 900;
  const n = Number(match[1]);
  const unit = match[2];
  const mult = { s: 1, m: 60, h: 3600, d: 86400 }[unit] ?? 60;
  return n * mult;
}
