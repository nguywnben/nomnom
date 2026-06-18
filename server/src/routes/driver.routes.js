import { Router } from 'express';
import pool from '../db/pool.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.use(requireAuth);

function serializeProfile(row) {
  if (!row) return null;
  return {
    userId: Number(row.user_id),
    nationalId: row.national_id,
    driverLicenseNo: row.driver_license_no,
    vehicleType: row.vehicle_type,
    vehicleModel: row.vehicle_model,
    licensePlate: row.license_plate,
    idCardUrl: row.id_card_url,
    driverLicenseUrl: row.driver_license_url,
    portraitUrl: row.portrait_url,
    bankAccountNo: row.bank_account_no,
    bankName: row.bank_name,
    bankAccountHolder: row.bank_account_holder,
    ratingAvg: Number(row.rating_avg ?? 0),
    totalTrips: Number(row.total_trips ?? 0),
    approvalStatus: row.approval_status,
    approvedAt: row.approved_at ?? null,
    approvedByAdminId: row.approved_by_admin_id ?? null,
    isOnline: Boolean(row.is_online),
    currentLat: row.current_lat == null ? null : Number(row.current_lat),
    currentLng: row.current_lng == null ? null : Number(row.current_lng),
    lastLocationAt: row.last_location_at ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function loadDriverProfile(userId) {
  const [rows] = await pool.query(
    `SELECT user_id, national_id, driver_license_no, vehicle_type, vehicle_model, license_plate,
            id_card_url, driver_license_url, portrait_url, bank_account_no, bank_name,
            bank_account_holder, rating_avg, total_trips, approval_status, approved_at,
            approved_by_admin_id, is_online, current_lat, current_lng, last_location_at,
            created_at, updated_at
     FROM driver_profiles
     WHERE user_id = ?
     LIMIT 1`,
    [userId],
  );
  return rows[0] ?? null;
}

async function createOrUpdateNotification(conn, userId, title, body) {
  await conn.query(
    `INSERT INTO notifications (user_id, type, title, body, link_url, is_read, read_at)
     VALUES (?, 'kyc_status', ?, ?, '/driver/pending', 0, NULL)`,
    [userId, title, body],
  );
}

router.get('/me/profile', async (req, res, next) => {
  try {
    const profile = await loadDriverProfile(req.auth.userId);
    res.json({
      profile: serializeProfile(profile),
      approval_status: profile?.approval_status ?? null,
    });
  } catch (err) {
    next(err);
  }
});

router.post('/apply', async (req, res, next) => {
  const conn = await pool.getConnection();
  try {
    const userId = req.auth.userId;
    const {
      nationalId,
      driverLicenseNo,
      vehicleType,
      vehicleModel,
      licensePlate,
      idCardUrl,
      driverLicenseUrl,
      portraitUrl,
      bankAccountNo,
      bankName,
      bankAccountHolder,
    } = req.body ?? {};

    if (!nationalId || !driverLicenseNo || !vehicleType || !vehicleModel || !licensePlate || !idCardUrl || !driverLicenseUrl || !portraitUrl || !bankAccountNo || !bankName || !bankAccountHolder) {
      return res.status(400).json({ error: 'Thiếu thông tin bắt buộc để đăng ký tài xế.' });
    }

    const existing = await loadDriverProfile(userId);
    if (existing) {
      if (existing.approval_status === 'rejected') {
        return res.status(409).json({ error: 'Hồ sơ đã bị từ chối. Hãy dùng PATCH để sửa và nộp lại.' });
      }
      return res.status(409).json({ error: 'Bạn đã nộp hồ sơ tài xế rồi.' });
    }

    await conn.beginTransaction();

    await conn.query(
      `INSERT INTO driver_profiles (
        user_id, national_id, driver_license_no, vehicle_type, vehicle_model, license_plate,
        id_card_url, driver_license_url, portrait_url, bank_account_no, bank_name, bank_account_holder,
        rating_avg, total_trips, approval_status, approved_at, approved_by_admin_id, is_online,
        current_lat, current_lng, last_location_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0, 'pending', NULL, NULL, 0, NULL, NULL, NULL)` ,
      [
        userId,
        String(nationalId).trim(),
        String(driverLicenseNo ?? '').trim() || null,
        String(vehicleType).trim(),
        String(vehicleModel).trim(),
        String(licensePlate).trim(),
        String(idCardUrl).trim(),
        String(driverLicenseUrl ?? '').trim() || null,
        String(portraitUrl).trim(),
        String(bankAccountNo).trim(),
        String(bankName).trim(),
        String(bankAccountHolder).trim(),
      ],
    );

    await conn.query(
      `INSERT INTO user_roles (user_id, role)
       VALUES (?, 'driver')
       ON DUPLICATE KEY UPDATE granted_at = granted_at`,
      [userId],
    );

    await createOrUpdateNotification(
      conn,
      userId,
      'Hồ sơ tài xế đang chờ duyệt',
      'Hồ sơ của bạn đã được gửi thành công. NomNom sẽ xem xét trong thời gian sớm nhất.',
    );

    await conn.commit();

    const profile = await loadDriverProfile(userId);
    res.status(201).json({
      profile: serializeProfile(profile),
      approval_status: profile?.approval_status ?? 'pending',
    });
  } catch (err) {
    await conn.rollback();
    next(err);
  } finally {
    conn.release();
  }
});

router.patch('/me/profile', async (req, res, next) => {
  const conn = await pool.getConnection();
  try {
    const userId = req.auth.userId;
    const current = await loadDriverProfile(userId);
    if (!current) {
      return res.status(404).json({ error: 'Không tìm thấy hồ sơ tài xế.' });
    }
    if (current.approval_status !== 'rejected') {
      return res.status(409).json({ error: 'Chỉ có thể sửa lại hồ sơ khi trạng thái là rejected.' });
    }

    const updates = [];
    const values = [];
    const fieldMap = {
      nationalId: 'national_id',
      driverLicenseNo: 'driver_license_no',
      vehicleType: 'vehicle_type',
      vehicleModel: 'vehicle_model',
      licensePlate: 'license_plate',
      idCardUrl: 'id_card_url',
      driverLicenseUrl: 'driver_license_url',
      portraitUrl: 'portrait_url',
      bankAccountNo: 'bank_account_no',
      bankName: 'bank_name',
      bankAccountHolder: 'bank_account_holder',
    };

    for (const [key, column] of Object.entries(fieldMap)) {
      if (req.body?.[key] !== undefined) {
        updates.push(`${column} = ?`);
        values.push(String(req.body[key]).trim());
      }
    }

    if (!updates.length) {
      return res.status(400).json({ error: 'Không có dữ liệu hợp lệ để cập nhật.' });
    }

    updates.push("approval_status = 'pending'");
    updates.push('approved_at = NULL');
    updates.push('approved_by_admin_id = NULL');
    values.push(userId);

    await conn.beginTransaction();
    await conn.query(
      `UPDATE driver_profiles SET ${updates.join(', ')} WHERE user_id = ?`,
      values,
    );
    await createOrUpdateNotification(
      conn,
      userId,
      'Hồ sơ tài xế đã được gửi lại',
      'Chúng tôi đã nhận bản cập nhật hồ sơ của bạn và sẽ xét duyệt lại sớm.',
    );
    await conn.commit();

    const profile = await loadDriverProfile(userId);
    res.json({
      profile: serializeProfile(profile),
      approval_status: profile?.approval_status ?? 'pending',
    });
  } catch (err) {
    await conn.rollback();
    next(err);
  } finally {
    conn.release();
  }
});

export default router;