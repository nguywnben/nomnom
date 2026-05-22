import bcrypt from 'bcrypt';
import pool from '../db/pool.js';
import { signPasswordResetToken } from './auth.js';
import { generateOtpCode, hashOtpCode, verifyOtpCode } from './otp.js';
import { sendPasswordResetOtpEmail } from './mail.js';

const OTP_TTL_MINUTES = 10;
const PURPOSE = 'reset_password';

async function invalidateActiveResetOtps(email) {
  await pool.query(
    `UPDATE otp_codes SET consumed_at = NOW()
     WHERE destination = ? AND purpose = ? AND consumed_at IS NULL`,
    [email, PURPOSE],
  );
}

export async function getValidResetOtp(email, code) {
  const [rows] = await pool.query(
    `SELECT id, code_hash, attempts, expires_at
     FROM otp_codes
     WHERE destination = ?
       AND purpose = ?
       AND channel = 'email'
       AND consumed_at IS NULL
       AND expires_at > NOW()
     ORDER BY id DESC
     LIMIT 1`,
    [email, PURPOSE],
  );
  const row = rows[0];
  if (!row) return { ok: false, reason: 'invalid' };

  if (row.attempts >= 5) {
    return { ok: false, reason: 'locked' };
  }

  const match = await verifyOtpCode(code, row.code_hash);
  if (!match) {
    await pool.query('UPDATE otp_codes SET attempts = attempts + 1 WHERE id = ?', [row.id]);
    return { ok: false, reason: 'invalid' };
  }

  await pool.query('UPDATE otp_codes SET consumed_at = NOW() WHERE id = ?', [row.id]);
  return { ok: true };
}

export async function findActiveUserByEmail(email) {
  const [rows] = await pool.query(
    `SELECT id, email, full_name, status FROM users WHERE email = ? LIMIT 1`,
    [email],
  );
  const user = rows[0];
  if (!user || user.status !== 'active') return null;
  return user;
}

/** Gửi OTP — luôn trả ok (không tiết lộ email có tồn tại hay không). */
export async function createAndSendResetOtp(email) {
  const user = await findActiveUserByEmail(email);
  if (!user) {
    return { expiresInMinutes: OTP_TTL_MINUTES, devOtpLogged: false, sent: false };
  }

  await invalidateActiveResetOtps(email);

  const code = generateOtpCode();
  const codeHash = await hashOtpCode(code);

  await pool.query(
    `INSERT INTO otp_codes (user_id, destination, channel, purpose, code_hash, expires_at)
     VALUES (?, ?, 'email', ?, ?, DATE_ADD(NOW(), INTERVAL ? MINUTE))`,
    [user.id, email, PURPOSE, codeHash, OTP_TTL_MINUTES],
  );

  const mailResult = await sendPasswordResetOtpEmail({
    to: email,
    code,
    fullName: user.full_name,
  });

  return {
    expiresInMinutes: OTP_TTL_MINUTES,
    devOtpLogged: mailResult.dev === true,
    sent: true,
  };
}

export async function verifyResetOtpAndIssueToken(email, code) {
  const otp = await getValidResetOtp(email, code);
  if (!otp.ok) return otp;

  const user = await findActiveUserByEmail(email);
  if (!user) return { ok: false, reason: 'invalid' };

  const resetToken = signPasswordResetToken(user.id, email);
  return { ok: true, resetToken };
}

export async function applyPasswordReset(userId, email, newPassword) {
  const passwordHash = await bcrypt.hash(newPassword, 10);
  const [result] = await pool.query(
    'UPDATE users SET password_hash = ? WHERE id = ? AND email = ? AND status = ?',
    [passwordHash, userId, email, 'active'],
  );
  if (result.affectedRows === 0) {
    const err = new Error('User not found');
    err.status = 404;
    throw err;
  }
  await pool.query(
    'UPDATE refresh_tokens SET revoked_at = NOW() WHERE user_id = ? AND revoked_at IS NULL',
    [userId],
  );
}
