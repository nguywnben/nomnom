import { Router } from 'express';
import pool from '../db/pool.js';
import { requireAuth } from '../middleware/auth.js';
import { loadPartnerAccess, assertCanApplyMerchant } from '../lib/partnerAccess.js';

const router = Router();

// Hàm chuẩn hóa tạo slug từ tiếng Việt
function slugify(text) {
  if (!text) return '';
  return text.toString().toLowerCase().trim()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // loại bỏ dấu tiếng Việt
    .replace(/đ/g, 'd').replace(/Đ/g, 'd')
    .replace(/\s+/g, '-')           // thay khoảng trắng bằng dấu -
    .replace(/[^\w\-]+/g, '')       // loại bỏ các ký tự đặc biệt
    .replace(/\-\-+/g, '-')         // loại bỏ dấu - lặp lại
    .replace(/^-+/, '')             // cắt dấu - ở đầu
    .replace(/-+$/, '');            // cắt dấu - ở cuối
}

/**
 * POST /api/v1/merchant/apply
 * Tạo yêu cầu đăng ký quán ăn mới
 */
router.post('/apply', requireAuth, async (req, res, next) => {
  const userId = req.auth.userId;

  try {
    const access = await loadPartnerAccess(pool, userId, req.auth.roles);
    assertCanApplyMerchant(access);
  } catch (err) {
    return next(err);
  }

  const {
    name,
    cuisineId,
    tagline = '',
    description = '',
    phone,
    addressLine,
    ward = '',
    district,
    city,
    latitude = null,
    longitude = null,
    baseDeliveryFee,
    minOrderAmount,
    avgPrepTimeMin = 20,
    bannerUrl,
    logoUrl,
    businessLicenseUrl,
    foodSafetyCertUrl = null,
    bankName,
    bankAccountNo,
    bankAccountHolder,
  } = req.body;

  // 1. Validate empty / required fields
  if (!name || name.trim().length < 3 || name.trim().length > 160) {
    return res.status(400).json({ error: 'Tên quán ăn phải từ 3 đến 160 ký tự.' });
  }
  if (!cuisineId) {
    return res.status(400).json({ error: 'Vui lòng chọn loại hình ẩm thực phù hợp.' });
  }
  if (!phone || !/^\d{9,11}$/.test(phone.trim())) {
    return res.status(400).json({ error: 'Số điện thoại quán ăn không hợp lệ (yêu cầu từ 9 đến 11 chữ số).' });
  }
  if (!addressLine || !addressLine.trim()) {
    return res.status(400).json({ error: 'Vui lòng nhập địa chỉ cụ thể.' });
  }
  if (!district || !district.trim()) {
    return res.status(400).json({ error: 'Vui lòng nhập quận/huyện.' });
  }
  if (!city || !city.trim()) {
    return res.status(400).json({ error: 'Vui lòng nhập tỉnh/thành phố.' });
  }
  if (baseDeliveryFee === undefined || isNaN(Number(baseDeliveryFee)) || Number(baseDeliveryFee) < 0) {
    return res.status(400).json({ error: 'Phí giao hàng cơ bản phải lớn hơn hoặc bằng 0.' });
  }
  if (minOrderAmount === undefined || isNaN(Number(minOrderAmount)) || Number(minOrderAmount) < 0) {
    return res.status(400).json({ error: 'Đơn hàng tối thiểu phải lớn hơn hoặc bằng 0.' });
  }
  if (avgPrepTimeMin === undefined || isNaN(Number(avgPrepTimeMin)) || Number(avgPrepTimeMin) <= 0) {
    return res.status(400).json({ error: 'Thời gian chuẩn bị trung bình phải lớn hơn 0 phút.' });
  }
  if (!logoUrl) {
    return res.status(400).json({ error: 'Vui lòng tải lên ảnh đại diện (logo) của quán.' });
  }
  if (!bannerUrl) {
    return res.status(400).json({ error: 'Vui lòng tải lên ảnh bìa (banner) của quán.' });
  }
  if (!businessLicenseUrl) {
    return res.status(400).json({ error: 'Vui lòng tải lên ảnh chụp giấy phép kinh doanh.' });
  }
  if (!bankName || !String(bankName).trim()) {
    return res.status(400).json({ error: 'Vui lòng chọn ngân hàng thụ hưởng.' });
  }
  if (!bankAccountNo || !String(bankAccountNo).trim()) {
    return res.status(400).json({ error: 'Vui lòng nhập số tài khoản ngân hàng.' });
  }
  if (!bankAccountHolder || !/^[A-Z\s]+$/.test(String(bankAccountHolder).trim())) {
    return res.status(400).json({ error: 'Tên chủ tài khoản phải viết hoa không dấu.' });
  }

  const bankNameValue = String(bankName).trim();
  const bankAccountNoValue = String(bankAccountNo).trim();
  const bankAccountHolderValue = String(bankAccountHolder).trim().toUpperCase();

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // 2. Kiểm tra trùng lặp chủ sở hữu
    const [existingOwner] = await conn.query(
      'SELECT id, status FROM restaurants WHERE owner_user_id = ? LIMIT 1',
      [userId]
    );

    let restaurantId = null;
    let isUpdate = false;

    if (existingOwner.length > 0) {
      const rest = existingOwner[0];
      if (rest.status === 'active') {
        await conn.rollback();
        return res.status(400).json({ error: 'Bạn đã sở hữu một nhà hàng đang hoạt động trên hệ thống.' });
      }
      if (rest.status === 'pending') {
        await conn.rollback();
        return res.status(400).json({ error: 'Yêu cầu đăng ký nhà hàng của bạn đang chờ xét duyệt.' });
      }
      // Nếu status là suspended hoặc closed, cho phép cập nhật lại thông tin để nộp lại đơn
      restaurantId = rest.id;
      isUpdate = true;
    }

    // 3. Kiểm tra trùng lặp số điện thoại
    const [existingPhone] = await conn.query(
      'SELECT id FROM restaurants WHERE phone = ? AND owner_user_id != ? LIMIT 1',
      [phone.trim(), userId]
    );
    if (existingPhone.length > 0) {
      await conn.rollback();
      return res.status(400).json({ error: 'Số điện thoại này đã được một nhà hàng khác sử dụng.' });
    }

    // 4. Sinh unique slug từ name
    let baseSlug = slugify(name);
    if (!baseSlug) baseSlug = 'nha-hang';
    let slug = baseSlug;
    let isSlugUnique = false;
    let suffix = 1;

    while (!isSlugUnique) {
      const [existingSlug] = await conn.query(
        'SELECT id FROM restaurants WHERE slug = ? AND owner_user_id != ? LIMIT 1',
        [slug, userId]
      );
      if (existingSlug.length === 0) {
        isSlugUnique = true;
      } else {
        slug = `${baseSlug}-${suffix}`;
        suffix++;
      }
    }

    if (isUpdate) {
      // Cập nhật lại thông tin quán cũ, reset lý do từ chối và đưa về trạng thái chờ duyệt
      await conn.query(
        `UPDATE restaurants SET
          cuisine_id = ?, name = ?, slug = ?, tagline = ?, description = ?, phone = ?,
          banner_url = ?, logo_url = ?, business_license_url = ?, food_safety_cert_url = ?,
          address_line = ?, ward = ?, district = ?, city = ?, latitude = ?, longitude = ?,
          base_delivery_fee = ?, min_order_amount = ?, avg_prep_time_min = ?,
          bank_name = ?, bank_account_no = ?, bank_account_holder = ?,
          status = 'pending', rejection_reason = NULL, approved_at = NULL, approved_by_admin_id = NULL
         WHERE id = ?`,
        [
          Number(cuisineId),
          name.trim(),
          slug,
          tagline.trim(),
          description.trim(),
          phone.trim(),
          bannerUrl,
          logoUrl,
          businessLicenseUrl,
          foodSafetyCertUrl,
          addressLine.trim(),
          ward.trim(),
          district.trim(),
          city.trim(),
          latitude ? Number(latitude) : null,
          longitude ? Number(longitude) : null,
          Number(baseDeliveryFee),
          Number(minOrderAmount),
          Number(avgPrepTimeMin),
          bankNameValue,
          bankAccountNoValue,
          bankAccountHolderValue,
          restaurantId
        ]
      );
    } else {
      // 5. Lưu thông tin quán ăn mới (status='pending')
      const [insertResult] = await conn.query(
        `INSERT INTO restaurants (
          owner_user_id, cuisine_id, name, slug, tagline, description, phone,
          banner_url, logo_url, business_license_url, food_safety_cert_url,
          address_line, ward, district, city, latitude, longitude,
          base_delivery_fee, min_order_amount, avg_prep_time_min,
          bank_name, bank_account_no, bank_account_holder, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
        [
          userId,
          Number(cuisineId),
          name.trim(),
          slug,
          tagline.trim(),
          description.trim(),
          phone.trim(),
          bannerUrl,
          logoUrl,
          businessLicenseUrl,
          foodSafetyCertUrl,
          addressLine.trim(),
          ward.trim(),
          district.trim(),
          city.trim(),
          latitude ? Number(latitude) : null,
          longitude ? Number(longitude) : null,
          Number(baseDeliveryFee),
          Number(minOrderAmount),
          Number(avgPrepTimeMin),
          bankNameValue,
          bankAccountNoValue,
          bankAccountHolderValue,
        ]
      );
      restaurantId = insertResult.insertId;
    }

    // 6. Gán quyền merchant trong bảng user_roles (nếu chưa có)
    const [existingRole] = await conn.query(
      'SELECT 1 FROM user_roles WHERE user_id = ? AND role = ? LIMIT 1',
      [userId, 'merchant']
    );
    if (existingRole.length === 0) {
      await conn.query(
        'INSERT INTO user_roles (user_id, role) VALUES (?, ?)',
        [userId, 'merchant']
      );
    }

    // 7. Gửi thông báo đến tài khoản admin (tìm admin đầu tiên)
    const [admins] = await conn.query(
      "SELECT id FROM users WHERE primary_role = 'admin' LIMIT 1"
    );
    const adminId = admins[0]?.id || 1; // Fallback về user_id=1 (Avery Park) nếu không tìm thấy

    await conn.query(
      `INSERT INTO notifications (user_id, type, title, body, link_url)
       VALUES (?, 'kyc_status', ?, ?, ?)`,
      [
        adminId,
        'Yêu cầu đăng ký quán ăn mới',
        `Nhà hàng "${name.trim()}" vừa gửi yêu cầu duyệt hồ sơ đối tác.`,
        '/admin/restaurants'
      ]
    );

    await conn.commit();

    // Lấy lại thông tin nhà hàng vừa tạo/cập nhật
    const [createdRows] = await pool.query(
      'SELECT * FROM restaurants WHERE id = ?',
      [restaurantId]
    );

    res.status(201).json({ restaurant: createdRows[0] });
  } catch (err) {
    await conn.rollback();
    next(err);
  } finally {
    conn.release();
  }
});

/**
 * GET /api/v1/merchant/me/restaurant
 * Lấy thông tin quán ăn của user hiện tại
 */
router.get('/me/restaurant', requireAuth, async (req, res, next) => {
  try {
    const userId = req.auth.userId;
    const [rows] = await pool.query(
      'SELECT * FROM restaurants WHERE owner_user_id = ? LIMIT 1',
      [userId]
    );
    if (rows.length === 0) {
      return res.json({ restaurant: null });
    }
    res.json({ restaurant: rows[0] });
  } catch (err) {
    next(err);
  }
});

export default router;
