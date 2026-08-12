import bcrypt from 'bcrypt';
import pool from '../db/pool.js';
import { generateOtpCode, hashOtpCode, verifyOtpCode } from './otp.js';
import { sendRegisterOtpEmail } from './mail.js';

const OTP_TTL_MINUTES = 10;
const PENDING_TTL_MINUTES = 30;

let tableReady = false;

export async function ensureRegistrationPendingTable() {
  if (tableReady) return;
  await pool.query(`
    CREATE TABLE IF NOT EXISTS registration_pending (
      email         VARCHAR(160) NOT NULL,
      full_name     VARCHAR(120) NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      avatar_url    VARCHAR(500) NOT NULL,
      expires_at    DATETIME NOT NULL,
      created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (email)
    ) ENGINE=InnoDB
  `);
  tableReady = true;
}

export async function savePendingRegistration({ email, fullName, password }) {
  await ensureRegistrationPendingTable();
  const passwordHash = await bcrypt.hash(password, 10);
  const avatarUrl = `https://api.dicebear.com/9.x/avataaars/svg?seed=${encodeURIComponent(fullName)}&radius=50`;

  await pool.query(
    `INSERT INTO registration_pending (email, full_name, password_hash, avatar_url, expires_at)
     VALUES (?, ?, ?, ?, DATE_ADD(NOW(), INTERVAL ? MINUTE))
     ON DUPLICATE KEY UPDATE
       full_name = VALUES(full_name),
       password_hash = VALUES(password_hash),
       avatar_url = VALUES(avatar_url),
       expires_at = VALUES(expires_at),
       created_at = NOW()`,
    [email, fullName, passwordHash, avatarUrl, PENDING_TTL_MINUTES],
  );

  return { avatarUrl, passwordHash };
}

async function invalidateActiveRegisterOtps(email) {
  await pool.query(
    `UPDATE otp_codes SET consumed_at = NOW()
     WHERE destination = ? AND purpose = 'register' AND consumed_at IS NULL`,
    [email],
  );
}

export async function createAndSendRegisterOtp({ email, fullName }) {
  await invalidateActiveRegisterOtps(email);

  const code = generateOtpCode();
  const codeHash = await hashOtpCode(code);

  await pool.query(
    `INSERT INTO otp_codes (destination, channel, purpose, code_hash, expires_at)
     VALUES (?, 'email', 'register', ?, DATE_ADD(NOW(), INTERVAL ? MINUTE))`,
    [email, codeHash, OTP_TTL_MINUTES],
  );

  const mailResult = await sendRegisterOtpEmail({ to: email, code, fullName });
  return { expiresInMinutes: OTP_TTL_MINUTES, devOtpLogged: mailResult.dev === true };
}

export async function getValidRegisterOtp(email, code) {
  const [rows] = await pool.query(
    `SELECT id, code_hash, attempts, expires_at
     FROM otp_codes
     WHERE destination = ?
       AND purpose = 'register'
       AND channel = 'email'
       AND consumed_at IS NULL
       AND expires_at > NOW()
     ORDER BY id DESC
     LIMIT 1`,
    [email],
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

export async function loadPendingRegistration(email) {
  await ensureRegistrationPendingTable();
  const [rows] = await pool.query(
    `SELECT email, full_name, password_hash, avatar_url, expires_at
     FROM registration_pending WHERE email = ? LIMIT 1`,
    [email],
  );
  const row = rows[0];
  if (!row) return null;
  if (new Date(row.expires_at) < new Date()) {
    await pool.query('DELETE FROM registration_pending WHERE email = ?', [email]);
    return null;
  }
  return row;
}

export async function deletePendingRegistration(email) {
  await pool.query('DELETE FROM registration_pending WHERE email = ?', [email]);
}

export async function createUserFromPending(pending) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [insertUser] = await conn.query(
      `INSERT INTO users (email, phone, password_hash, full_name, avatar_url, primary_role, status, email_verified_at)
       VALUES (?, NULL, ?, ?, ?, 'customer', 'active', NOW())`,
      [pending.email, pending.password_hash, pending.full_name, pending.avatar_url],
    );
    const userId = insertUser.insertId;

    await conn.query('INSERT INTO user_roles (user_id, role) VALUES (?, ?)', [userId, 'customer']);
    await conn.query('DELETE FROM registration_pending WHERE email = ?', [pending.email]);

    await conn.commit();

    return {
      id: userId,
      email: pending.email,
      phone: null,
      full_name: pending.full_name,
      avatar_url: pending.avatar_url,
      primary_role: 'customer',
      status: 'active',
    };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}
