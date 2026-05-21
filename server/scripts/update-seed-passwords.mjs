import 'dotenv/config';
import bcrypt from 'bcrypt';
import pool from '../src/db/pool.js';

const PASSWORD = 'password123';
const hash = await bcrypt.hash(PASSWORD, 10);

const [result] = await pool.query('UPDATE users SET password_hash = ? WHERE id <= 22', [hash]);
console.log(`Updated ${result.affectedRows} users. Hash: ${hash}`);
await pool.end();
