import mysql from 'mysql2/promise';

function buildPool() {
  const url = process.env.MYSQL_URL?.trim();

  if (url?.startsWith('mysql://')) {
    console.log('[DB] Kết nối qua MYSQL_URL');
    return mysql.createPool(url);
  }

  const host = process.env.DB_HOST?.trim();
  const database = process.env.DB_NAME?.trim();
  console.log(`[DB] Kết nối qua DB_* → host=${host ?? '(empty)'} database=${database ?? '(empty)'}`);

  return mysql.createPool({
    host,
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER?.trim(),
    password: process.env.DB_PASSWORD,
    database,
    waitForConnections: true,
    connectionLimit: 10,
    charset: 'utf8mb4',
  });
}

const pool = buildPool();

/** Gọi lúc khởi động — log rõ lỗi DB trên Railway. */
export async function verifyDbConnection() {
  await pool.query('SELECT 1');
  console.log('[DB] Kết nối MySQL OK');
}

export default pool;
