import mysql from 'mysql2/promise';

/** Railway: gán MYSQL_URL = ${{MySQL.MYSQL_URL}} để tránh copy sai mật khẩu. */
const pool = process.env.MYSQL_URL
  ? mysql.createPool(process.env.MYSQL_URL)
  : mysql.createPool({
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT || 3306),
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      waitForConnections: true,
      connectionLimit: 10,
      charset: 'utf8mb4',
    });

export default pool;
