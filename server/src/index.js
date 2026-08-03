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

async function ensureVoucherSchema() {
  const [voucherTables] = await pool.query("SHOW TABLES LIKE 'vouchers'");
  if (!voucherTables.length) {
    console.log('[DB] Tạo bảng vouchers');
    await pool.query(`
      CREATE TABLE vouchers (
        id bigint UNSIGNED NOT NULL AUTO_INCREMENT,
        restaurant_id bigint UNSIGNED DEFAULT NULL,
        created_by_user_id bigint UNSIGNED NOT NULL,
        code varchar(40) COLLATE utf8mb4_unicode_ci NOT NULL,
        name varchar(160) COLLATE utf8mb4_unicode_ci NOT NULL,
        description varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
        discount_type enum('percent','fixed') COLLATE utf8mb4_unicode_ci NOT NULL,
        discount_value bigint UNSIGNED NOT NULL,
        max_discount_amount bigint UNSIGNED DEFAULT NULL,
        min_order_amount bigint UNSIGNED NOT NULL DEFAULT '0',
        usage_limit int UNSIGNED DEFAULT NULL,
        per_user_limit int UNSIGNED NOT NULL DEFAULT '1',
        starts_at datetime NOT NULL,
        ends_at datetime NOT NULL,
        status enum('draft','active','paused') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'draft',
        created_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        UNIQUE KEY uq_vouchers_code (code),
        KEY idx_vouchers_restaurant_status_window (restaurant_id, status, starts_at, ends_at),
        KEY idx_vouchers_created_by (created_by_user_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
  } else {
    const [restaurantIdRows] = await pool.query("SHOW COLUMNS FROM vouchers LIKE 'restaurant_id'");
    if (!restaurantIdRows.length) {
      console.log('[DB] Thêm cột restaurant_id vào bảng vouchers');
      await pool.query("ALTER TABLE vouchers ADD COLUMN restaurant_id bigint UNSIGNED DEFAULT NULL AFTER id");
    }
  }

  const [redemptionTables] = await pool.query("SHOW TABLES LIKE 'voucher_redemptions'");
  if (!redemptionTables.length) {
    console.log('[DB] Tạo bảng voucher_redemptions');
    await pool.query(`
      CREATE TABLE voucher_redemptions (
        id bigint UNSIGNED NOT NULL AUTO_INCREMENT,
        voucher_id bigint UNSIGNED NOT NULL,
        customer_id bigint UNSIGNED NOT NULL,
        order_id bigint UNSIGNED NOT NULL,
        discount_amount bigint UNSIGNED NOT NULL,
        status enum('reserved','redeemed','released') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'reserved',
        redeemed_at datetime DEFAULT NULL,
        released_at datetime DEFAULT NULL,
        created_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        UNIQUE KEY uq_voucher_redemptions_order (order_id),
        KEY idx_voucher_redemptions_usage (voucher_id, status),
        KEY idx_voucher_redemptions_customer (voucher_id, customer_id, status)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
  }

  const [voucherIdRows] = await pool.query("SHOW COLUMNS FROM orders LIKE 'voucher_id'");
  if (!voucherIdRows.length) {
    console.log('[DB] Thêm cột voucher_id vào bảng orders');
    await pool.query("ALTER TABLE orders ADD COLUMN voucher_id bigint UNSIGNED DEFAULT NULL AFTER restaurant_id");
  }

  const [voucherSnapshotRows] = await pool.query("SHOW COLUMNS FROM orders LIKE 'voucher_code_snapshot'");
  if (!voucherSnapshotRows.length) {
    console.log('[DB] Thêm cột voucher_code_snapshot vào bảng orders');
    await pool.query("ALTER TABLE orders ADD COLUMN voucher_code_snapshot varchar(40) COLLATE utf8mb4_unicode_ci DEFAULT NULL AFTER discount_amount");
  }
}

async function ensurePaymentSchema() {
  const [referenceRows] = await pool.query("SHOW COLUMNS FROM payments LIKE 'gateway_reference'");
  if (!referenceRows.length) {
    console.log('[DB] Add payment gateway reference');
    await pool.query(
      "ALTER TABLE payments ADD COLUMN gateway_reference varchar(120) COLLATE utf8mb4_unicode_ci DEFAULT NULL AFTER gateway, ADD UNIQUE KEY uq_payments_gateway_reference (gateway_reference)",
    );
  }

  const [createdAtRows] = await pool.query("SHOW COLUMNS FROM payments LIKE 'gateway_created_at'");
  if (!createdAtRows.length) {
    console.log('[DB] Add payment gateway creation timestamp');
    await pool.query("ALTER TABLE payments ADD COLUMN gateway_created_at datetime DEFAULT NULL AFTER gateway_txn_id");
  }

  const [refundTables] = await pool.query("SHOW TABLES LIKE 'payment_refunds'");
  if (!refundTables.length) {
    console.log('[DB] Create payment_refunds table');
    await pool.query([
      "CREATE TABLE payment_refunds (",
      "id bigint UNSIGNED NOT NULL AUTO_INCREMENT,",
      "payment_id bigint UNSIGNED NOT NULL,",
      "order_id bigint UNSIGNED NOT NULL,",
      "request_id varchar(120) COLLATE utf8mb4_unicode_ci NOT NULL,",
      "amount bigint UNSIGNED NOT NULL,",
      "status enum('initiated','succeeded','failed') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'initiated',",
      "gateway_txn_id varchar(120) COLLATE utf8mb4_unicode_ci DEFAULT NULL,",
      "failure_reason varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,",
      "raw_response json DEFAULT NULL,",
      "created_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,",
      "completed_at datetime DEFAULT NULL,",
      "PRIMARY KEY (id),",
      "UNIQUE KEY uq_payment_refunds_request (request_id),",
      "KEY idx_payment_refunds_payment (payment_id, status),",
      "KEY idx_payment_refunds_order (order_id, status),",
      "CONSTRAINT fk_payment_refunds_payment FOREIGN KEY (payment_id) REFERENCES payments (id) ON DELETE RESTRICT,",
      "CONSTRAINT fk_payment_refunds_order FOREIGN KEY (order_id) REFERENCES orders (id) ON DELETE RESTRICT",
      ") ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci",
    ].join(' '));
  }
}

async function ensureRestaurantBankColumns() {
  const [approvedAtRows] = await pool.query("SHOW COLUMNS FROM restaurants LIKE 'approved_at'");
  if (!approvedAtRows.length) {
    console.log('[DB] Thêm cột approved_at vào bảng restaurants');
    await pool.query("ALTER TABLE restaurants ADD COLUMN approved_at datetime DEFAULT NULL AFTER status");
  }

  const [approvedByRows] = await pool.query("SHOW COLUMNS FROM restaurants LIKE 'approved_by_admin_id'");
  if (!approvedByRows.length) {
    console.log('[DB] Thêm cột approved_by_admin_id vào bảng restaurants');
    await pool.query("ALTER TABLE restaurants ADD COLUMN approved_by_admin_id bigint UNSIGNED DEFAULT NULL AFTER approved_at");
  }

  const [rejectionRows] = await pool.query("SHOW COLUMNS FROM restaurants LIKE 'rejection_reason'");
  if (!rejectionRows.length) {
    console.log('[DB] Thêm cột rejection_reason vào bảng restaurants');
    await pool.query("ALTER TABLE restaurants ADD COLUMN rejection_reason varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL AFTER approved_by_admin_id");
  }

  const [bankNoRows] = await pool.query("SHOW COLUMNS FROM restaurants LIKE 'bank_account_no'");
  if (!bankNoRows.length) {
    console.log('[DB] Thêm cột bank_account_no vào bảng restaurants');
    await pool.query("ALTER TABLE restaurants ADD COLUMN bank_account_no varchar(40) COLLATE utf8mb4_unicode_ci DEFAULT NULL AFTER rejection_reason");
  }

  const [bankNameRows] = await pool.query("SHOW COLUMNS FROM restaurants LIKE 'bank_name'");
  if (!bankNameRows.length) {
    console.log('[DB] Thêm cột bank_name vào bảng restaurants');
    await pool.query("ALTER TABLE restaurants ADD COLUMN bank_name varchar(120) COLLATE utf8mb4_unicode_ci DEFAULT NULL AFTER bank_account_no");
  }

  const [bankHolderRows] = await pool.query("SHOW COLUMNS FROM restaurants LIKE 'bank_account_holder'");
  if (!bankHolderRows.length) {
    console.log('[DB] Thêm cột bank_account_holder vào bảng restaurants');
    await pool.query("ALTER TABLE restaurants ADD COLUMN bank_account_holder varchar(120) COLLATE utf8mb4_unicode_ci DEFAULT NULL AFTER bank_name");
  }
}

async function start() {
  try {
    await verifyDbConnection();
    await ensureSuspensionColumn();
    await ensureSuspensionReasonColumn();
    await ensureVoucherSchema();
    await ensurePaymentSchema();
    await ensureRestaurantBankColumns();
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
