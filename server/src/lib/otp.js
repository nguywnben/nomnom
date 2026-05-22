import bcrypt from 'bcrypt';
import crypto from 'crypto';

export function generateOtpCode() {
  return String(crypto.randomInt(100000, 1000000));
}

export async function hashOtpCode(code) {
  return bcrypt.hash(code, 10);
}

export async function verifyOtpCode(code, codeHash) {
  return bcrypt.compare(code, codeHash);
}
