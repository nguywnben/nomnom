import cors from 'cors';
import express from 'express';
import 'dotenv/config';
import homeRoutes from './routes/home.routes.js';
import authRoutes from './routes/auth.routes.js';
import merchantRoutes from './routes/merchant.routes.js';
import meRoutes from './routes/me.routes.js';
import restaurantRoutes from './routes/restaurants.routes.js';
import cartRoutes from './routes/cart.routes.js';
import cuisinesRoutes from './routes/cuisines.routes.js';
import adminRoutes from './routes/admin.routes.js';
import driverRoutes from './routes/driver.routes.js';
import uploadsRoutes from './routes/uploads.routes.js';
import ordersRoutes from './routes/orders.routes.js';
import paymentsRoutes from './routes/payments.routes.js';
import vouchersRoutes from './routes/vouchers.routes.js';
import pool, { verifyDbConnection } from './db/pool.js';

const app = express();
const port = Number(process.env.PORT ?? 3001);

app.use(
  cors({
    origin: process.env.CORS_ORIGIN ?? 'http://localhost:5173',
    credentials: true,
  }),
);
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'nomnom-api' });
});

app.use('/api/v1/home', homeRoutes);
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/merchant', merchantRoutes);
app.use('/api/v1/me', meRoutes);
app.use('/api/v1/restaurants', restaurantRoutes);
app.use('/api/v1/cart', cartRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/driver', driverRoutes);
app.use('/api/v1/cuisines', cuisinesRoutes);
app.use('/api/v1/uploads', uploadsRoutes);
app.use('/api/v1/orders', ordersRoutes);
app.use('/api/v1/payments', paymentsRoutes);
app.use('/api/v1/vouchers', vouchersRoutes);

app.use((err, _req, res, _next) => {
  console.error(err);
  const status =
    err.status ??
    (err.code === 'LIMIT_FILE_SIZE' ? 413 : err.code === 'LIMIT_UNEXPECTED_FILE' ? 400 : 500);
  const message =
    err.message ??
    (err.code === 'LIMIT_FILE_SIZE'
      ? 'File vượt quá dung lượng tối đa 5MB.'
      : err.code === 'LIMIT_UNEXPECTED_FILE'
        ? 'Chỉ được upload một file với field "file".'
        : 'Internal Server Error');
  res.status(status).json({
    error: status === 500 ? 'Internal Server Error' : message,
    ...(process.env.NODE_ENV !== 'production' && err.code ? { code: err.code } : {}),
  });
});

async function ensureSuspensionColumn() {
  const [rows] = await pool.query("SHOW COLUMNS FROM users LIKE 'suspension_expires_at'");
  if (!rows.length) {
    console.log('[DB] Thêm cột suspension_expires_at vào bảng users');
    await pool.query("ALTER TABLE users ADD COLUMN suspension_expires_at datetime DEFAULT NULL");
  }
}

async function ensureSuspensionReasonColumn() {
  const [rows] = await pool.query("SHOW COLUMNS FROM users LIKE 'suspension_reason'");
  if (!rows.length) {
    console.log('[DB] Thêm cột suspension_reason vào bảng users');
    await pool.query("ALTER TABLE users ADD COLUMN suspension_reason text DEFAULT NULL");
  }
}

async function ensureVouchersTable() {
  await pool.query(
    "CREATE TABLE IF NOT EXISTS `vouchers` (" +
    "  `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT," +
    "  `code` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL," +
    "  `kind` enum('percent','flat') COLLATE utf8mb4_unicode_ci NOT NULL," +
    "  `amount` bigint UNSIGNED NOT NULL," +
    "  `min_order` bigint UNSIGNED NOT NULL DEFAULT '0'," +
    "  `max_discount` bigint UNSIGNED DEFAULT NULL," +
    "  `valid_from` datetime NOT NULL," +
    "  `valid_to` datetime NOT NULL," +
    "  `usage_limit` int DEFAULT NULL," +
    "  `usage_count` int NOT NULL DEFAULT '0'," +
    "  `is_active` tinyint(1) NOT NULL DEFAULT '1'," +
    "  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP," +
    "  PRIMARY KEY (`id`)," +
    "  UNIQUE KEY `uq_vouchers_code` (`code`)" +
    ") ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;"
  );

  const [rows] = await pool.query("SELECT COUNT(*) as count FROM `vouchers` WHERE `code` IN ('NOMNOM15', 'NEW50K')");
  if (rows[0].count === 0) {
    console.log('[DB] Seeding default vouchers...');
    await pool.query(
      "INSERT INTO `vouchers` (`code`, `kind`, `amount`, `min_order`, `max_discount`, `valid_from`, `valid_to`, `usage_limit`, `usage_count`, `is_active`)" +
      "VALUES " +
      "  ('NOMNOM15', 'percent', 15, 0, 250000, '2026-01-01 00:00:00', '2027-12-31 23:59:59', 1000, 0, 1)," +
      "  ('NEW50K', 'flat', 50000, 200000, NULL, '2026-01-01 00:00:00', '2027-12-31 23:59:59', 1000, 0, 1);"
    );
  }
}

async function start() {
  try {
    await verifyDbConnection();
    await ensureSuspensionColumn();
    await ensureSuspensionReasonColumn();
  } catch (err) {
    console.error('[DB] Kết nối MySQL THẤT BẠI:', err.message);
    console.error(
      '[DB] Railway: service nomnom → Variables → MYSQL_URL = ${{MySQL.MYSQL_URL}} (internal). Xóa DB_PASSWORD copy tay.',
    );
    process.exit(1);
  }

  app.listen(port, () => {
    console.log(`NomNom API http://localhost:${port}`);
  });
}

start();
