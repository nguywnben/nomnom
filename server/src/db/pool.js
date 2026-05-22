import mysql from 'mysql2/promise';

function resolveConfig() {
  const url = process.env.MYSQL_URL?.trim();
  if (url?.startsWith('mysql://')) {
    return { mode: 'MYSQL_URL', poolConfig: url };
  }

  // Reference từ service MySQL Railway: MYSQLHOST, MYSQLPASSWORD, ...
  const host = process.env.MYSQLHOST?.trim() || process.env.DB_HOST?.trim();
  const port = Number(process.env.MYSQLPORT || process.env.DB_PORT || 3306);
  const user = process.env.MYSQLUSER?.trim() || process.env.DB_USER?.trim();
  const password = process.env.MYSQLPASSWORD ?? process.env.DB_PASSWORD;
  const database =
    process.env.MYSQLDATABASE?.trim() || process.env.DB_NAME?.trim();

  const mode = process.env.MYSQLHOST ? 'MYSQL* (Railway reference)' : 'DB_*';

  return {
    mode,
    poolConfig: {
      host,
      port,
      user,
      password,
      database,
      waitForConnections: true,
      connectionLimit: 10,
      charset: 'utf8mb4',
    },
    user,
    host,
    database,
  };
}

function buildPool() {
  const cfg = resolveConfig();

  if (cfg.mode === 'MYSQL_URL') {
    console.log('[DB] Kết nối qua MYSQL_URL');
    return mysql.createPool(cfg.poolConfig);
  }

  console.log(
    `[DB] Kết nối qua ${cfg.mode} → host=${cfg.host ?? '(empty)'} database=${cfg.database ?? '(empty)'} user=${cfg.user ?? '(empty)'}`,
  );

  return mysql.createPool(cfg.poolConfig);
}

const pool = buildPool();

export async function verifyDbConnection() {
  await pool.query('SELECT 1');
  console.log('[DB] Kết nối MySQL OK');
}

export default pool;
