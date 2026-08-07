import pool from '../db/pool.js';

/**
 * Ghi nhận hành động quản lý của Admin vào cơ sở dữ liệu.
 * @param {object} connOrPool Kết nối database hoặc pool để chạy trong transaction.
 * @param {object} dữ_liệu_log Thuộc tính nhật ký hoạt động.
 * @param {number} dữ_liệu_log.adminId ID của quản trị viên thực hiện.
 * @param {string} dữ_liệu_log.action Tên hành động hoạt động (ví dụ: 'duyet_nha_hang', 'khoa_tai_khoan').
 * @param {string} dữ_liệu_log.targetType Loại đối tượng bị tác động ('restaurant', 'user', 'order', 'payout', 'config').
 * @param {string|number} dữ_liệu_log.targetId ID hoặc khóa định danh của đối tượng bị tác động.
 * @param {object} [dữ_liệu_log.metadata] Thông tin chi tiết đi kèm bằng tiếng Việt (ví dụ: lý do từ chối, giá trị cũ/mới).
 */
export async function logAudit(connOrPool, { adminId, action, targetType, targetId, metadata }) {
  try {
    const db = connOrPool || pool;
    const metaStr = metadata ? JSON.stringify(metadata) : null;
    await db.query(
      `INSERT INTO audit_logs (admin_id, action, target_type, target_id, metadata)
       VALUES (?, ?, ?, ?, ?)`,
      [adminId, action, targetType, String(targetId), metaStr]
    );
    console.log(`[AUDIT] Quản trị viên ${adminId} đã thực hiện '${action}' trên đối tượng '${targetType}' ID '${targetId}'`);
  } catch (err) {
    console.error('[AUDIT] Gặp lỗi khi ghi nhật ký hoạt động của Admin:', err.message);
  }
}
