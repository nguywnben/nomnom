import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import 'dotenv/config';
import bcrypt from 'bcrypt';
import mysql from 'mysql2/promise';

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const seedPath = path.join(repositoryRoot, 'database', 'nomnom.sql');
const defenseAt = '2026-09-03 08:00:00';
const latestAllowedAt = '2026-09-01 23:59:59';

function quoteIdentifier(value) {
  return `\`${String(value).replace(/`/g, '``')}\``;
}

function connectionConfig() {
  const databaseUrl = process.env.MYSQL_URL?.trim();
  if (databaseUrl?.startsWith('mysql://')) {
    const parsed = new URL(databaseUrl);
    return {
      host: parsed.hostname,
      port: Number(parsed.port || 3306),
      user: decodeURIComponent(parsed.username),
      password: decodeURIComponent(parsed.password),
      ssl: parsed.searchParams.get('ssl') === 'true' ? {} : undefined,
    };
  }

  return {
    host: process.env.MYSQLHOST?.trim() || process.env.DB_HOST?.trim(),
    port: Number(process.env.MYSQLPORT || process.env.DB_PORT || 3306),
    user: process.env.MYSQLUSER?.trim() || process.env.DB_USER?.trim(),
    password: process.env.MYSQLPASSWORD ?? process.env.DB_PASSWORD,
  };
}

const sql = fs.readFileSync(seedPath, 'utf8');
const temporaryDatabase = `nomnom_report_verify_${crypto.randomBytes(6).toString('hex')}`;
const connection = await mysql.createConnection({
  ...connectionConfig(),
  charset: 'utf8mb4',
  multipleStatements: true,
});
const failures = [];
let temporaryDatabaseCreated = false;

async function scalar(query, parameters = []) {
  const [[row]] = await connection.query(query, parameters);
  return Number(Object.values(row)[0]);
}

function requireCondition(condition, message) {
  if (!condition) failures.push(message);
}

try {
  await connection.query(`CREATE DATABASE ${quoteIdentifier(temporaryDatabase)} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
  temporaryDatabaseCreated = true;
  await connection.query(`USE ${quoteIdentifier(temporaryDatabase)}`);
  await connection.query(sql);

  const tableCount = await scalar("SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = DATABASE() AND table_type = 'BASE TABLE'");
  requireCondition(tableCount === 38, `Schema phải có 38 bảng, thực tế có ${tableCount}.`);
  requireCondition(await scalar("SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'customer_dismissed_vouchers'") === 1, 'Thiếu bảng customer_dismissed_vouchers.');

  const driverRows = {
    users: await scalar("SELECT COUNT(*) FROM users WHERE primary_role = 'driver'"),
    roles: await scalar("SELECT COUNT(*) FROM user_roles WHERE role = 'driver'"),
    profiles: await scalar('SELECT COUNT(*) FROM driver_profiles'),
    assignments: await scalar('SELECT COUNT(*) FROM driver_assignments'),
    wallets: await scalar("SELECT COUNT(*) FROM wallets WHERE owner_type = 'driver'"),
    statusLogs: await scalar("SELECT COUNT(*) FROM order_status_logs WHERE changed_by_role = 'driver'"),
  };
  requireCondition(Object.values(driverRows).every((count) => count === 0), `Còn dữ liệu tài xế: ${JSON.stringify(driverRows)}.`);

  const unsafeSessionRows = await scalar('SELECT (SELECT COUNT(*) FROM refresh_tokens) + (SELECT COUNT(*) FROM otp_codes) + (SELECT COUNT(*) FROM registration_pending)');
  requireCondition(unsafeSessionRows === 0, `Seed còn ${unsafeSessionRows} phiên/OTP/đăng ký tạm.`);

  const visibleSeedMarkers = await scalar(`
    SELECT
      (SELECT COUNT(*) FROM users WHERE email REGEXP '(^|[.@])(test|seed|example)|emalupe')
      + (SELECT COUNT(*) FROM orders WHERE order_code LIKE 'DEMO-%')
      + (SELECT COUNT(*) FROM payments WHERE COALESCE(gateway_reference, '') LIKE 'DEMO-%')
      + (SELECT COUNT(*) FROM restaurants WHERE COALESCE(slug, '') LIKE '%demo%' OR COALESCE(business_license_url, '') LIKE '%placehold.co%' OR COALESCE(food_safety_cert_url, '') LIKE '%placehold.co%')
      + (SELECT COUNT(*) FROM notifications WHERE CONCAT(title, ' ', body, ' ', COALESCE(link_url, '')) REGEXP 'tài xế|driver|DEMO')
      + (SELECT COUNT(*) FROM wallet_transactions WHERE COALESCE(description, '') REGEXP 'tài xế|tiền chuyến|thu hộ')
      + (SELECT COUNT(*) FROM order_status_logs WHERE CONCAT(COALESCE(note, ''), ' ', changed_by_role) REGEXP 'tài xế|driver|DEMO|minh họa')
  `);
  requireCondition(visibleSeedMarkers === 0, `Còn ${visibleSeedMarkers} dấu vết test/demo/tài xế hiển thị.`);

  const requiredAccounts = await scalar(`
    SELECT COUNT(*) FROM users
    WHERE (email = 'admin@nomnom.local' AND primary_role = 'admin')
       OR (email = 'khachhang@nomnom.local' AND primary_role = 'customer')
       OR (email = 'nhahang@nomnom.local' AND primary_role = 'merchant')
  `);
  requireCondition(requiredAccounts === 3, `Thiếu tài khoản trình diễn ba vai trò (${requiredAccounts}/3).`);
  const [presentationAccounts] = await connection.query(`
    SELECT email, password_hash FROM users
    WHERE email IN ('admin@nomnom.local','khachhang@nomnom.local','nhahang@nomnom.local')
  `);
  const invalidPresentationPasswords = (await Promise.all(
    presentationAccounts.map(async (account) => ({
      email: account.email,
      valid: await bcrypt.compare('password123', account.password_hash),
    })),
  )).filter((account) => !account.valid);
  requireCondition(invalidPresentationPasswords.length === 0, `Mật khẩu tài khoản trình diễn không hợp lệ: ${invalidPresentationPasswords.map((account) => account.email).join(', ')}.`);

  const recentOrders = await scalar("SELECT COUNT(*) FROM orders WHERE placed_at >= '2026-08-20 00:00:00' AND placed_at <= ?", [latestAllowedAt]);
  const futureOrders = await scalar('SELECT COUNT(*) FROM orders WHERE placed_at > ?', [latestAllowedAt]);
  requireCondition(recentOrders >= 15, `Chỉ có ${recentOrders} đơn từ 20/08 đến 01/09.`);
  requireCondition(futureOrders === 0, `Có ${futureOrders} đơn mang thời gian tương lai.`);

  const [orderStatusRows] = await connection.query('SELECT status, COUNT(*) AS count FROM orders GROUP BY status');
  const orderStatuses = Object.fromEntries(orderStatusRows.map((row) => [row.status, Number(row.count)]));
  for (const status of ['placed', 'accepted', 'preparing', 'ready_for_pickup', 'delivering', 'delivered', 'cancelled', 'payment_failed', 'expired']) {
    requireCondition((orderStatuses[status] || 0) > 0, `Thiếu trạng thái đơn ${status}.`);
  }

  const [paymentStatusRows] = await connection.query('SELECT payment_status, COUNT(*) AS count FROM orders GROUP BY payment_status');
  const paymentStatuses = Object.fromEntries(paymentStatusRows.map((row) => [row.payment_status, Number(row.count)]));
  for (const status of ['unpaid', 'paid', 'failed', 'refunded']) {
    requireCondition((paymentStatuses[status] || 0) > 0, `Thiếu trạng thái thanh toán ${status}.`);
  }

  const invalidCodPaid = await scalar("SELECT COUNT(*) FROM orders WHERE payment_method = 'cod' AND status <> 'delivered' AND payment_status = 'paid'");
  requireCondition(invalidCodPaid === 0, `Có ${invalidCodPaid} đơn COD chưa giao nhưng đã ghi nhận paid.`);

  const invalidFinance = await scalar(`
    SELECT COUNT(*)
    FROM orders o
    JOIN restaurants r ON r.id = o.restaurant_id
    LEFT JOIN vouchers v ON v.id = o.voucher_id
    WHERE o.driver_id IS NOT NULL
       OR o.driver_earning <> 0
       OR o.merchant_earning <>
          (CASE WHEN v.restaurant_id IS NOT NULL THEN GREATEST(0, o.subtotal - o.discount_amount) ELSE o.subtotal END)
          - FLOOR((CASE WHEN v.restaurant_id IS NOT NULL THEN GREATEST(0, o.subtotal - o.discount_amount) ELSE o.subtotal END) * r.commission_rate / 100)
       OR o.platform_fee <>
          FLOOR((CASE WHEN v.restaurant_id IS NOT NULL THEN GREATEST(0, o.subtotal - o.discount_amount) ELSE o.subtotal END) * r.commission_rate / 100)
          + o.delivery_fee
  `);
  requireCondition(invalidFinance === 0, `Có ${invalidFinance} đơn đối soát sai theo mô hình ba vai trò.`);

  const invalidReviews = await scalar(`
    SELECT COUNT(*)
    FROM reviews r
    JOIN orders o ON o.id = r.order_id
    WHERE o.status <> 'delivered' OR o.delivered_at IS NULL OR r.created_at < o.delivered_at
  `);
  requireCondition(invalidReviews === 0, `Có ${invalidReviews} đánh giá không hợp lệ theo vòng đời đơn.`);

  const orphanRows = await scalar(`
    SELECT
      (SELECT COUNT(*) FROM orders o LEFT JOIN users u ON u.id = o.customer_id LEFT JOIN restaurants r ON r.id = o.restaurant_id LEFT JOIN customer_addresses a ON a.id = o.delivery_address_id WHERE u.id IS NULL OR r.id IS NULL OR a.id IS NULL)
      + (SELECT COUNT(*) FROM order_items oi LEFT JOIN orders o ON o.id = oi.order_id LEFT JOIN menu_items mi ON mi.id = oi.menu_item_id WHERE o.id IS NULL OR mi.id IS NULL)
      + (SELECT COUNT(*) FROM payments p LEFT JOIN orders o ON o.id = p.order_id WHERE o.id IS NULL)
      + (SELECT COUNT(*) FROM reviews rv LEFT JOIN orders o ON o.id = rv.order_id LEFT JOIN users u ON u.id = rv.customer_id LEFT JOIN restaurants r ON r.id = rv.restaurant_id WHERE o.id IS NULL OR u.id IS NULL OR r.id IS NULL)
      + (SELECT COUNT(*) FROM restaurants r LEFT JOIN users u ON u.id = r.owner_user_id WHERE u.id IS NULL)
      + (SELECT COUNT(*) FROM wallets w LEFT JOIN users u ON u.id = w.user_id WHERE u.id IS NULL)
      + (SELECT COUNT(*) FROM wallet_transactions wt LEFT JOIN wallets w ON w.id = wt.wallet_id WHERE w.id IS NULL)
      + (SELECT COUNT(*) FROM order_status_logs osl LEFT JOIN orders o ON o.id = osl.order_id LEFT JOIN users u ON u.id = osl.changed_by_user_id WHERE o.id IS NULL OR (osl.changed_by_user_id IS NOT NULL AND u.id IS NULL))
  `);
  requireCondition(orphanRows === 0, `Có ${orphanRows} bản ghi mồ côi sau khi restore seed.`);

  const [ordersWithoutFinalHistoryRows] = await connection.query(`
    SELECT o.id, o.status, o.updated_at FROM orders o
    WHERE NOT EXISTS (
      SELECT 1 FROM order_status_logs osl
      WHERE osl.order_id = o.id AND osl.to_status = o.status AND osl.created_at <= o.updated_at
    )
  `);
  requireCondition(ordersWithoutFinalHistoryRows.length === 0, `Các đơn thiếu lịch sử trạng thái cuối: ${ordersWithoutFinalHistoryRows.map((row) => `${row.id}:${row.status}`).join(', ')}.`);

  const validVouchers = await scalar("SELECT COUNT(*) FROM vouchers WHERE status = 'active' AND starts_at <= ? AND ends_at >= ?", [defenseAt, defenseAt]);
  requireCondition(validVouchers >= 2, `Chỉ có ${validVouchers} voucher hợp lệ ngày 03/09.`);
  requireCondition(await scalar('SELECT COUNT(*) FROM menu_items WHERE in_stock = 0') >= 1, 'Thiếu món tạm hết hàng để trình diễn nghiệp vụ.');
  requireCondition(await scalar("SELECT COUNT(*) FROM menu_items WHERE status = 'hidden'") >= 1, 'Thiếu món tạm ẩn để trình diễn quản trị menu.');

  const summary = {
    seedPath,
    tables: tableCount,
    users: await scalar('SELECT COUNT(*) FROM users'),
    restaurants: await scalar('SELECT COUNT(*) FROM restaurants'),
    menuItems: await scalar('SELECT COUNT(*) FROM menu_items'),
    orders: await scalar('SELECT COUNT(*) FROM orders'),
    recentOrders,
    latestOrderAt: (await connection.query('SELECT MAX(placed_at) AS value FROM orders'))[0][0].value,
    reviews: await scalar('SELECT COUNT(*) FROM reviews'),
    orderStatuses,
    paymentStatuses,
  };

  if (failures.length) {
    throw new Error(`Report seed chưa đạt:\n- ${failures.join('\n- ')}`);
  }

  console.log(JSON.stringify({ ...summary, reportReady: true }, null, 2));
} finally {
  if (temporaryDatabaseCreated) {
    await connection.query('USE information_schema');
    await connection.query(`DROP DATABASE ${quoteIdentifier(temporaryDatabase)}`);
  }
  await connection.end();
}
