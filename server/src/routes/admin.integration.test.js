import 'dotenv/config';
import test from 'node:test';
import assert from 'node:assert/strict';
import pool from '../db/pool.js';
import { ensureWave5Schema } from '../lib/wave5Schema.js';
import { logAudit } from '../lib/audit.js';

test('Kiểm thử tích hợp các tác vụ Admin - Duyệt, Từ chối, Hủy đơn, Khóa tài khoản và Ghi nhật ký đối soát', async () => {
  // Khởi tạo cấu trúc bảng trước khi chạy test
  await ensureWave5Schema(pool);

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // 1. Tạo tài khoản Admin mẫu
    const [adminResult] = await connection.query(
      `INSERT INTO users (email, password_hash, full_name, primary_role, status)
       VALUES (?, 'hash_mat_khau', 'Quản trị viên mẫu', 'admin', 'active')`,
      [`admin_kiem_thu_${Date.now()}@example.com`]
    );
    const adminId = adminResult.insertId;

    // Đảm bảo admin có phân quyền 'admin' trong bảng user_roles
    await connection.query(
      "INSERT INTO user_roles (user_id, role) VALUES (?, 'admin')",
      [adminId]
    );

    // 2. Tạo tài khoản đối tác mẫu (Merchant)
    const [merchantResult] = await connection.query(
      `INSERT INTO users (email, password_hash, full_name, primary_role, status)
       VALUES (?, 'hash_mat_khau', 'Đối tác mẫu', 'customer', 'active')`,
      [`merchant_kiem_thu_${Date.now()}@example.com`]
    );
    const merchantId = merchantResult.insertId;

    // 3. Tạo nhà hàng mẫu ở trạng thái chờ duyệt (pending)
    const [restaurantResult] = await connection.query(
      `INSERT INTO restaurants (owner_user_id, name, slug, phone, city, district, address_line, status)
       VALUES (?, 'Nhà hàng Kiểm thử', 'nha-hang-kiem-thu', '0901000999', 'Hồ Chí Minh', 'Q.1', '123 Đường Kiểm thử', 'pending')`,
      [merchantId]
    );
    const restaurantId = restaurantResult.insertId;

    // Tạo địa chỉ giao hàng mẫu
    const [addressResult] = await connection.query(
      `INSERT INTO customer_addresses (customer_id, label, recipient_name, recipient_phone, line1, city, is_default)
       VALUES (?, 'Nhà', 'Người nhận mẫu', '0901234567', '123 Đường Kiểm thử', 'Hồ Chí Minh', 1)`,
      [merchantId]
    );
    const addressId = addressResult.insertId;

    // 4. Tạo đơn hàng mẫu ở trạng thái mới đặt (placed)
    const [orderResult] = await connection.query(
      `INSERT INTO orders (
        order_code, customer_id, restaurant_id, delivery_address_id, delivery_address_snapshot,
        delivery_lat, delivery_lng, pickup_lat, pickup_lng, distance_km,
        subtotal, delivery_fee, discount_amount, total_amount,
        driver_earning, merchant_earning, platform_fee,
        status, payment_method, estimated_delivery_at
      ) VALUES ('ORD-TEST-99', ?, ?, ?, '123 Đường Kiểm thử', 10.779, 106.699, 10.779, 106.699, 1.5,
        100000, 15000, 0, 115000,
        12000, 80000, 23000,
        'placed', 'cod', NOW() + INTERVAL 30 MINUTE)`,
      [merchantId, restaurantId, addressId]
    );
    const orderId = orderResult.insertId;

    // -------------------------------------------------------------
    // Thao tác A: Duyệt nhà hàng
    // -------------------------------------------------------------
    await connection.query(
      `UPDATE restaurants
       SET status = 'active', approved_at = NOW(), approved_by_admin_id = ?, rejection_reason = NULL
       WHERE id = ?`,
      [adminId, restaurantId]
    );

    await connection.query(
      `UPDATE users
       SET status = 'active', primary_role = 'merchant'
       WHERE id = ?`,
      [merchantId]
    );

    const [existingRole] = await connection.query(
      'SELECT 1 FROM user_roles WHERE user_id = ? AND role = ? LIMIT 1',
      [merchantId, 'merchant']
    );
    if (existingRole.length === 0) {
      await connection.query(
        'INSERT INTO user_roles (user_id, role) VALUES (?, ?)',
        [merchantId, 'merchant']
      );
    }

    await logAudit(connection, {
      adminId,
      action: 'duyet_nha_hang',
      targetType: 'restaurant',
      targetId: restaurantId,
      metadata: { tenNhaHang: 'Nhà hàng Kiểm thử', chuSoHuuId: merchantId }
    });

    // Xác nhận kết quả Thao tác A
    const [[updatedRestaurant]] = await connection.query(
      'SELECT status, approved_by_admin_id FROM restaurants WHERE id = ?',
      [restaurantId]
    );
    assert.equal(updatedRestaurant.status, 'active');
    assert.equal(updatedRestaurant.approved_by_admin_id, adminId);

    const [[updatedMerchant]] = await connection.query(
      'SELECT primary_role, status FROM users WHERE id = ?',
      [merchantId]
    );
    assert.equal(updatedMerchant.primary_role, 'merchant');
    assert.equal(updatedMerchant.status, 'active');

    const [[approveAudit]] = await connection.query(
      "SELECT * FROM audit_logs WHERE admin_id = ? AND action = 'duyet_nha_hang' AND target_id = ?",
      [adminId, String(restaurantId)]
    );
    assert.ok(approveAudit);
    assert.equal(approveAudit.target_type, 'restaurant');

    // -------------------------------------------------------------
    // Thao tác B: Từ chối nhà hàng
    // -------------------------------------------------------------
    await connection.query("UPDATE restaurants SET status = 'pending' WHERE id = ?", [restaurantId]);

    const lyDoTuChoi = 'Hồ sơ doanh nghiệp không chính xác';
    await connection.query(
      `UPDATE restaurants
       SET status = 'suspended', rejection_reason = ?, approved_at = NULL, approved_by_admin_id = NULL
       WHERE id = ?`,
      [lyDoTuChoi, restaurantId]
    );

    await logAudit(connection, {
      adminId,
      action: 'tu_choi_nha_hang',
      targetType: 'restaurant',
      targetId: restaurantId,
      metadata: { tenNhaHang: 'Nhà hàng Kiểm thử', chuSoHuuId: merchantId, lyDo: lyDoTuChoi }
    });

    // Xác nhận kết quả Thao tác B
    const [[rejectedRestaurant]] = await connection.query(
      'SELECT status, rejection_reason FROM restaurants WHERE id = ?',
      [restaurantId]
    );
    assert.equal(rejectedRestaurant.status, 'suspended');
    assert.equal(rejectedRestaurant.rejection_reason, lyDoTuChoi);

    const [[rejectAudit]] = await connection.query(
      "SELECT * FROM audit_logs WHERE admin_id = ? AND action = 'tu_choi_nha_hang' AND target_id = ?",
      [adminId, String(restaurantId)]
    );
    assert.ok(rejectAudit);
    const logTuChoiMeta = typeof rejectAudit.metadata === 'string' ? JSON.parse(rejectAudit.metadata) : rejectAudit.metadata;
    assert.equal(logTuChoiMeta.lyDo, lyDoTuChoi);

    // -------------------------------------------------------------
    // Thao tác C: Hủy đơn hàng
    // -------------------------------------------------------------
    const lyDoHuy = 'Quán hết nguyên liệu nấu món';
    await connection.query(
      "UPDATE orders SET status = 'cancelled', cancelled_by_role = 'admin', cancel_reason = ?, cancelled_at = NOW() WHERE id = ?",
      [lyDoHuy, orderId]
    );

    await logAudit(connection, {
      adminId,
      action: 'huy_don_hang',
      targetType: 'order',
      targetId: orderId,
      metadata: { maDonHang: 'ORD-TEST-99', lyDo: lyDoHuy }
    });

    // Xác nhận kết quả Thao tác C
    const [[cancelledOrder]] = await connection.query(
      'SELECT status, cancel_reason FROM orders WHERE id = ?',
      [orderId]
    );
    assert.equal(cancelledOrder.status, 'cancelled');
    assert.equal(cancelledOrder.cancel_reason, lyDoHuy);

    const [[cancelAudit]] = await connection.query(
      "SELECT * FROM audit_logs WHERE admin_id = ? AND action = 'huy_don_hang' AND target_id = ?",
      [adminId, String(orderId)]
    );
    assert.ok(cancelAudit);
    const logHuyMeta = typeof cancelAudit.metadata === 'string' ? JSON.parse(cancelAudit.metadata) : cancelAudit.metadata;
    assert.equal(logHuyMeta.lyDo, lyDoHuy);

    // -------------------------------------------------------------
    // Thao tác D: Khóa tài khoản
    // -------------------------------------------------------------
    const lyDoKhoa = 'Phát hiện hành vi gian lận';
    await connection.query(
      'UPDATE users SET status = ?, suspension_expires_at = ?, suspension_reason = ? WHERE id = ?',
      ['suspended', new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), lyDoKhoa, merchantId]
    );

    await logAudit(connection, {
      adminId,
      action: 'doi_trang_thai_tai_khoan',
      targetType: 'user',
      targetId: merchantId,
      metadata: { trangThaiMoi: 'suspended', lyDo: lyDoKhoa }
    });

    // Xác nhận kết quả Thao tác D
    const [[suspendedUser]] = await connection.query(
      'SELECT status, suspension_reason FROM users WHERE id = ?',
      [merchantId]
    );
    assert.equal(suspendedUser.status, 'suspended');
    assert.equal(suspendedUser.suspension_reason, lyDoKhoa);

    const [[suspensionAudit]] = await connection.query(
      "SELECT * FROM audit_logs WHERE admin_id = ? AND action = 'doi_trang_thai_tai_khoan' AND target_id = ?",
      [adminId, String(merchantId)]
    );
    assert.ok(suspensionAudit);
    const logKhoaMeta = typeof suspensionAudit.metadata === 'string' ? JSON.parse(suspensionAudit.metadata) : suspensionAudit.metadata;
    assert.equal(logKhoaMeta.lyDo, lyDoKhoa);

    // Rollback để dọn dẹp sạch sẽ cơ sở dữ liệu sau kiểm thử
    await connection.rollback();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
    await pool.end();
  }
});
