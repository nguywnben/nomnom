import crypto from 'crypto';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET ?? 'dev-nomnom-change-me';
const ACCESS_TTL = process.env.JWT_ACCESS_TTL ?? '15m';
const REFRESH_DAYS = Number(process.env.JWT_REFRESH_DAYS ?? 30);

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

export function refreshExpiresAt() {
  const d = new Date();
  d.setDate(d.getDate() + REFRESH_DAYS);
  return d;
}

export function accessExpiresInSeconds() {
  const match = /^(\d+)([smhd])$/.exec(ACCESS_TTL);
  if (!match) return 900;
  const n = Number(match[1]);
  const unit = match[2];
  const mult = { s: 1, m: 60, h: 3600, d: 86400 }[unit] ?? 60;
  return n * mult;
}
