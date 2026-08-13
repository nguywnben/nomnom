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
import uploadsRoutes from './routes/uploads.routes.js';
import ordersRoutes from './routes/orders.routes.js';
import paymentsRoutes from './routes/payments.routes.js';
import vouchersRoutes from './routes/vouchers.routes.js';
import menuItemsRoutes from './routes/menuItems.routes.js';
import notificationsRoutes from './routes/notifications.routes.js';
import merchantFinanceRoutes from './routes/merchant-finance.routes.js';
import adminFinanceRoutes from './routes/admin-finance.routes.js';
import chatRoutes from './routes/chat.routes.js';
import shippingRoutes from './routes/shipping.routes.js';
import locationsRoutes from './routes/locations.routes.js';
import { ensureWave5Schema } from './lib/wave5Schema.js';
import { DEFAULT_HOME_PAGE_CONFIG } from './lib/homePageConfig.js';
import pool, { verifyDbConnection } from './db/pool.js';

const app = express();
const port = Number(process.env.PORT ?? 3000);

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
app.use('/api/v1/me/notifications', notificationsRoutes);
  app.use('/api/v1/admin', adminFinanceRoutes);
  app.use('/api/v1/chat', chatRoutes);
  app.use('/api/v1/auth', authRoutes);
  app.use('/api/v1/merchant', merchantRoutes);
  app.use('/api/v1/merchant/me', merchantFinanceRoutes);
app.use('/api/v1/me', meRoutes);
app.use('/api/v1/restaurants', restaurantRoutes);
app.use('/api/v1/cart', cartRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/cuisines', cuisinesRoutes);
app.use('/api/v1/uploads', uploadsRoutes);
app.use('/api/v1/orders', ordersRoutes);
app.use('/api/v1/payments', paymentsRoutes);
app.use('/api/v1/vouchers', vouchersRoutes);
app.use('/api/v1/menu-items', menuItemsRoutes);
app.use('/api/v1/shipping', shippingRoutes);
app.use('/api/v1/locations', locationsRoutes);

app.use((err, _req, res, _next) => {
  if (err?.message === 'Request aborted' || err?.code === 'ECONNRESET' || err?.code === 'ECONNABORTED') {
    return;
  }

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
        : 'Hệ thống đang gặp sự cố. Vui lòng thử lại sau.');
  res.status(status).json({
    error: status === 500 ? 'Hệ thống đang gặp sự cố. Vui lòng thử lại sau.' : message,
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

async function ensureHomePageSettings() {
  await pool.query(`CREATE TABLE IF NOT EXISTS home_page_settings (
    id tinyint UNSIGNED NOT NULL PRIMARY KEY,
    config_json json NOT NULL,
    updated_by_admin_id bigint UNSIGNED DEFAULT NULL,
    updated_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);
  await pool.query('INSERT IGNORE INTO home_page_settings (id, config_json) VALUES (1, ?)', [JSON.stringify(DEFAULT_HOME_PAGE_CONFIG)]);
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

    // Seed default vouchers
    try {
      console.log('[DB] Seeding default vouchers...');
      await pool.query(`
        INSERT INTO vouchers (code, name, description, discount_type, discount_value, min_order_amount, max_discount_amount, starts_at, ends_at, status, created_by_user_id)
        VALUES 
          ('NOMNOM15', 'NOMNOM15', 'Giảm 15%', 'percent', 15, 0, 250000, '2026-01-01 00:00:00', '2027-12-31 23:59:59', 'active', 1),
          ('NEW50K', 'NEW50K', 'Giảm 50K', 'fixed', 50000, 200000, NULL, '2026-01-01 00:00:00', '2027-12-31 23:59:59', 'active', 1)
      `);
    } catch (e) {
      console.log('[DB] Seeding default vouchers failed (user ID 1 might not exist):', e.message);
    }
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

async function startOrderExpiryWorker() {
  console.log('[Expiry Worker] Khởi tạo worker tự động hủy đơn hết hạn thanh toán (30 phút)');
  setInterval(async () => {
    try {
      const connection = await pool.getConnection();
      try {
        await connection.beginTransaction();

        // Tìm các đơn hàng pending_payment hoặc payment_failed quá 30 phút
        const [expiredOrders] = await connection.query(
          `SELECT id, status FROM orders 
           WHERE status IN ('pending_payment', 'payment_failed') 
             AND created_at < DATE_SUB(NOW(), INTERVAL 30 MINUTE)
           FOR UPDATE`
        );

          for (const order of expiredOrders) {
          console.log(`[Expiry Worker] Đơn hàng ID ${order.id} hết hạn (trạng thái hiện tại: ${order.status})`);
          
          // Cập nhật trạng thái đơn sang expired, payment_status sang failed
          await connection.query(
            "UPDATE orders SET status = 'expired', payment_status = 'failed' WHERE id = ?",
            [order.id]
          );

          // Cập nhật các giao dịch thanh toán pending/initiated sang failed
          await connection.query(
            "UPDATE payments SET status = 'failed', failure_reason = 'Order expired after 30 minutes' WHERE order_id = ? AND status IN ('initiated', 'pending')",
            [order.id]
          );

          // Nhả voucher nếu có
          await connection.query(
            "UPDATE voucher_redemptions SET status = 'released', released_at = NOW() WHERE order_id = ? AND status = 'reserved'",
            [order.id]
          );

          // Lưu status log
          await connection.query(
            `INSERT INTO order_status_logs (order_id, from_status, to_status, changed_by_role, note)
             VALUES (?, ?, 'expired', 'system', 'Tự động hủy do hết hạn thanh toán (quá 30 phút)')`,
            [order.id, order.status]
          );
          }

          const [deliveringOrders] = await connection.query(
            `SELECT id, order_code, customer_id, restaurant_id
             FROM orders
             WHERE status = 'delivering'
               AND delivering_at < DATE_SUB(NOW(), INTERVAL 2 HOUR)
             FOR UPDATE`,
          );
          for (const order of deliveringOrders) {
            await connection.query(
              "UPDATE orders SET status = 'delivered', delivered_at = NOW(), updated_at = NOW() WHERE id = ?",
              [order.id],
            );
            await connection.query(
              `INSERT INTO order_status_logs (order_id, from_status, to_status, changed_by_role, note)
               VALUES (?, 'delivering', 'delivered', 'system', 'Hệ thống tự động hoàn tất sau 2 giờ đang giao.')`,
              [order.id],
            );
            await connection.query(
              `INSERT INTO notifications (user_id, type, title, body, link_url)
               VALUES (?, 'order_delivered', 'Đơn hàng đã hoàn tất', ?, ?)`,
              [order.customer_id, 'Đơn ' + order.order_code + ' đã được hệ thống tự động hoàn tất sau 2 giờ đang giao.', '/app/track/' + order.order_code],
            );
          }

        await connection.commit();
      } catch (err) {
        await connection.rollback();
        console.error('[Expiry Worker Error]', err);
      } finally {
        connection.release();
      }
    } catch (err) {
      console.error('[Expiry Worker Connection Error]', err);
    }
  }, 60000); // Chạy mỗi 60 giây
}

async function ensureOrderPaymentStates() {
  const [statusRows] = await pool.query("SHOW COLUMNS FROM orders LIKE 'status'");
  const statusType = String(statusRows[0]?.Type ?? '');

  if (statusType.includes("'payment_failed'") && statusType.includes("'expired'")) {
    return;
  }

  console.log('[DB] Bổ sung trạng thái payment_failed và expired cho orders');
  await pool.query(`ALTER TABLE orders MODIFY COLUMN status enum(
    'pending_payment',
    'payment_failed',
    'placed',
    'accepted',
    'preparing',
    'ready_for_pickup',
    'picked_up',
    'delivering',
    'delivered',
    'cancelled',
    'failed',
    'expired'
  ) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending_payment'`);
}

async function ensureOrderDeliveryTimestamp() {
  const [columns] = await pool.query("SHOW COLUMNS FROM orders LIKE 'delivering_at'");
  if (!columns.length) {
    await pool.query('ALTER TABLE orders ADD COLUMN delivering_at DATETIME NULL AFTER picked_up_at');
    console.log('[DB] Bổ sung cột delivering_at cho orders');
  }
}

async function ensureDeliveryNotificationType() {
  const [columns] = await pool.query("SHOW COLUMNS FROM notifications LIKE 'type'");
  const type = String(columns[0]?.Type ?? '');
  if (!type.includes("'order_delivering'")) {
    await pool.query(`ALTER TABLE notifications MODIFY COLUMN type ENUM(
      'order_placed', 'order_accepted', 'order_ready', 'order_picked_up', 'order_delivering',
      'order_delivered', 'order_cancelled', 'payment_succeeded', 'payment_failed',
      'payout_status', 'kyc_status', 'system'
    ) NOT NULL`);
    console.log('[DB] Bổ sung loại thông báo order_delivering');
  }
}

async function start() {
  try {
    await verifyDbConnection();
    await ensureOrderDeliveryTimestamp();
    await ensureDeliveryNotificationType();
    await ensureSuspensionColumn();
    await ensureSuspensionReasonColumn();
    await ensureVoucherSchema();
    await ensurePaymentSchema();
    await ensureOrderPaymentStates();
    await ensureRestaurantBankColumns();
    await ensureWave5Schema(pool);
    await ensureHomePageSettings();
  } catch (err) {
    console.error('[DB] Kết nối MySQL THẤT BẠI:', err.message);
    console.error(
      '[DB] Railway: service nomnom → Variables → MYSQL_URL = ${{MySQL.MYSQL_URL}} (internal). Xóa DB_PASSWORD copy tay.',
    );
    process.exit(1);
  }

  app.listen(port, () => {
    console.log(`NomNom API http://localhost:${port}`);
    startOrderExpiryWorker();
  });
}

start();
