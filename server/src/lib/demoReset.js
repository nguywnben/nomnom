import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import mysql from 'mysql2/promise';
import { ensureWave5Schema } from './wave5Schema.js';

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const backupDirectory = path.join(repositoryRoot, 'backups');
const fallbackSqlPath = path.join(repositoryRoot, 'database', 'nomnom.sql');

let lastResetTimestamp = null;
let isResetting = false;

export function getDirectConnectionConfig() {
  const url = process.env.MYSQL_URL?.trim();
  if (url?.startsWith('mysql://')) {
    const parsed = new URL(url);
    let ssl;
    const sslParam = parsed.searchParams.get('ssl');
    if (sslParam) {
      try {
        ssl = JSON.parse(sslParam);
      } catch {
        ssl = sslParam === 'true' ? {} : undefined;
      }
    } else if (parsed.hostname.includes('tidbcloud.com')) {
      ssl = { minVersion: 'TLSv1.2', rejectUnauthorized: true };
    }

    return {
      host: parsed.hostname,
      port: Number(parsed.port || 3306),
      user: decodeURIComponent(parsed.username),
      password: decodeURIComponent(parsed.password),
      database: parsed.pathname.replace(/^\//, ''),
      ssl,
    };
  }

  return {
    host: process.env.MYSQLHOST?.trim() || process.env.DB_HOST?.trim() || 'localhost',
    port: Number(process.env.MYSQLPORT || process.env.DB_PORT || 3306),
    user: process.env.MYSQLUSER?.trim() || process.env.DB_USER?.trim() || 'root',
    password: process.env.MYSQLPASSWORD ?? process.env.DB_PASSWORD ?? '',
    database: process.env.MYSQLDATABASE?.trim() || process.env.DB_NAME?.trim() || 'nomnom',
  };
}

export function resolveGoldenSeedPath() {
  if (fs.existsSync(backupDirectory)) {
    const backups = fs.readdirSync(backupDirectory)
      .filter((name) => /^nomnom-\d{8}T\d{6}Z\.sql$/.test(name))
      .sort();
    if (backups.length > 0) {
      return path.join(backupDirectory, backups.at(-1));
    }
  }

  if (fs.existsSync(fallbackSqlPath)) {
    return fallbackSqlPath;
  }

  throw new Error('Không tìm thấy file backup hoặc seed SQL để khôi phục dữ liệu mẫu.');
}

export function getDemoResetStatus() {
  return {
    isResetting,
    lastResetAt: lastResetTimestamp,
    seedFile: path.basename(resolveGoldenSeedPath()),
  };
}

export async function resetDemoDatabase() {
  if (isResetting) {
    const error = new Error('Quá trình khôi phục dữ liệu đang diễn ra. Vui lòng thử lại sau giây lát.');
    error.status = 429;
    throw error;
  }

  isResetting = true;
  const seedPath = resolveGoldenSeedPath();
  const sql = fs.readFileSync(seedPath, 'utf8');

  const connection = await mysql.createConnection({
    ...getDirectConnectionConfig(),
    charset: 'utf8mb4',
    multipleStatements: true,
  });

  try {
    console.log(`[Demo] Bắt đầu nạp lại dữ liệu mẫu từ ${path.basename(seedPath)}...`);
    await connection.query(sql);
    await ensureWave5Schema();
    lastResetTimestamp = new Date().toISOString();
    console.log(`[Demo] Khôi phục dữ liệu mẫu hoàn tất lúc ${lastResetTimestamp}.`);
    return {
      success: true,
      restoredAt: lastResetTimestamp,
      seedFile: path.basename(seedPath),
    };
  } finally {
    await connection.end();
    isResetting = false;
  }
}
