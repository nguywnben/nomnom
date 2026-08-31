import { Router } from 'express';
import pool from '../db/pool.js';
import { requireAuth } from '../middleware/auth.js';
import { loadPartnerAccess, assertCanApplyMerchant } from '../lib/partnerAccess.js';
import { geocodeVietnamAddress } from '../lib/addressGeocoding.js';
import {
  parseOrderDate,
  resolveStatusAction,
  serializeMerchantOrder,
  customerNotificationForAction,
} from '../lib/merchantOrders.js';

const router = Router();

function ensureMerchant(req, res, next) {
  if ((req.auth.roles ?? []).includes('merchant')) {
    return next();
  }
  return res.status(403).json({ error: 'Bạn không có quyền truy cập khu vực đối tác quán ăn.' });
}

async function loadOwnedRestaurant(userId) {
  const [rows] = await pool.query(
    'SELECT id, name, status, owner_user_id FROM restaurants WHERE owner_user_id = ? LIMIT 1',
    [userId],
  );
  return rows[0] ?? null;
}

async function loadOrderForRestaurant(orderCode, restaurantId, db = pool, { forUpdate = false } = {}) {
  const [rows] = await db.query(
    `SELECT * FROM orders WHERE order_code = ? AND restaurant_id = ? LIMIT 1${forUpdate ? ' FOR UPDATE' : ''}`,
    [orderCode, restaurantId],
  );
  return rows[0] ?? null;
}

async function loadOrderItems(orderId) {
  const [items] = await pool.query(
    'SELECT * FROM order_items WHERE order_id = ? ORDER BY id ASC',
    [orderId],
  );
  return items;
}

async function loadCustomer(customerId) {
  const [rows] = await pool.query(
    'SELECT id, full_name, phone FROM users WHERE id = ? LIMIT 1',
    [customerId],
  );
  return rows[0] ?? null;
}

function normalizeVoucherCode(code) {
  return String(code ?? '').trim().toUpperCase();
}

function parseNullableNumber(value) {
  if (value === undefined || value === null || value === '') return null;
  const next = Number(value);
  return Number.isFinite(next) ? next : null;
}

function serializeVoucher(row) {
  return {
    id: Number(row.id),
    restaurantId: row.restaurant_id === null ? null : Number(row.restaurant_id),
    createdByUserId: Number(row.created_by_user_id),
    code: row.code,
    name: row.name,
    description: row.description ?? null,
    discountType: row.discount_type,
    discountValue: Number(row.discount_value),
    maxDiscountAmount: row.max_discount_amount === null ? null : Number(row.max_discount_amount),
    minOrderAmount: Number(row.min_order_amount ?? 0),
    usageLimit: row.usage_limit === null ? null : Number(row.usage_limit),
    perUserLimit: Number(row.per_user_limit ?? 1),
    isPublic: Boolean(row.is_public ?? 1),
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function validateVoucherPayload(body) {
  const code = normalizeVoucherCode(body?.code);
  const name = String(body?.name ?? '').trim();
  const description = String(body?.description ?? '').trim();
  const discountType = String(body?.discountType ?? '').trim().toLowerCase();
  const discountValue = Number(body?.discountValue);
  const maxDiscountAmount = parseNullableNumber(body?.maxDiscountAmount);
  const minOrderAmount = Number(body?.minOrderAmount ?? 0);
  const usageLimit = parseNullableNumber(body?.usageLimit);
  const perUserLimit = Number(body?.perUserLimit ?? 1);
  const isPublic = body?.isPublic === false || body?.isPublic === 0 || body?.isPublic === 'false' ? 0 : 1;
  const startsAt = String(body?.startsAt ?? '').trim();
  const endsAt = String(body?.endsAt ?? '').trim();
  const status = String(body?.status ?? 'draft').trim().toLowerCase();

  if (!code || code.length < 4 || code.length > 40) {
    const err = new Error('Mã voucher phải từ 4 đến 40 ký tự.');
    err.status = 400;
    throw err;
  }
  if (!name || name.length < 3 || name.length > 160) {
    const err = new Error('Tên voucher phải từ 3 đến 160 ký tự.');
    err.status = 400;
    throw err;
  }
  if (!['percent', 'fixed'].includes(discountType)) {
    const err = new Error('Loại giảm giá không hợp lệ.');
    err.status = 400;
    throw err;
  }
  if (!Number.isFinite(discountValue) || discountValue <= 0) {
    const err = new Error('Giá trị giảm giá phải lớn hơn 0.');
    err.status = 400;
    throw err;
  }
  if (maxDiscountAmount !== null && (!Number.isFinite(maxDiscountAmount) || maxDiscountAmount < 0)) {
    const err = new Error('Giới hạn giảm tối đa không hợp lệ.');
    err.status = 400;
    throw err;
  }
  if (!Number.isFinite(minOrderAmount) || minOrderAmount < 0) {
    const err = new Error('Giá trị đơn tối thiểu không hợp lệ.');
    err.status = 400;
    throw err;
  }
  if (usageLimit !== null && (!Number.isInteger(usageLimit) || usageLimit < 1)) {
    const err = new Error('Giới hạn lượt dùng không hợp lệ.');
    err.status = 400;
    throw err;
  }
  if (!Number.isInteger(perUserLimit) || perUserLimit < 1) {
    const err = new Error('Giới hạn mỗi khách không hợp lệ.');
    err.status = 400;
    throw err;
  }
  if (!startsAt || !endsAt) {
    const err = new Error('Vui lòng nhập thời gian bắt đầu và kết thúc.');
    err.status = 400;
    throw err;
  }
  if (!['draft', 'active', 'paused'].includes(status)) {
    const err = new Error('Trạng thái voucher không hợp lệ.');
    err.status = 400;
    throw err;
  }

  const startDate = new Date(startsAt);
  const endDate = new Date(endsAt);
  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime()) || endDate <= startDate) {
    const err = new Error('Thời gian voucher không hợp lệ.');
    err.status = 400;
    throw err;
  }

  return {
    code,
    name,
    description: description || null,
    discountType,
    discountValue: Math.round(discountValue),
    maxDiscountAmount,
    minOrderAmount: Math.round(minOrderAmount),
    usageLimit,
    perUserLimit: Math.round(perUserLimit),
    startsAt: startDate,
    endsAt: endDate,
    status,
  };
}

async function loadVoucherForRestaurant(voucherId, restaurantId) {
  const [rows] = await pool.query(
    `SELECT *
       FROM vouchers
      WHERE id = ?
        AND restaurant_id = ?
      LIMIT 1`,
    [voucherId, restaurantId],
  );
  return rows[0] ?? null;
}

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
  const districtValue = district ? String(district).trim() : '';
  if (!city || !city.trim()) {
    return res.status(400).json({ error: 'Vui lòng nhập tỉnh/thành phố.' });
  }
  if (!ward || !ward.trim()) {
    return res.status(400).json({ error: 'Vui lòng chọn phường/xã.' });
  }
  const cuisineIdValue = Number(cuisineId);
  if (!Number.isInteger(cuisineIdValue) || cuisineIdValue < 1) {
    return res.status(400).json({ error: 'Loại hình ẩm thực không hợp lệ.' });
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
  let coordinates;
  try {
    coordinates = await geocodeVietnamAddress({
      line1: addressLine.trim(),
      ward: ward.trim(),
      district: districtValue,
      city: city.trim(),
    });
  } catch (err) {
    return next(err);
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [cuisineRows] = await conn.query('SELECT id FROM cuisines WHERE id = ? LIMIT 1', [cuisineIdValue]);
    if (cuisineRows.length === 0) {
      await conn.rollback();
      return res.status(400).json({ error: 'Loại hình ẩm thực không hợp lệ.' });
    }

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
        return res.status(400).json({ error: 'Bạn đã sở hữu một quán ăn đang hoạt động trên hệ thống.' });
      }
      if (rest.status === 'pending') {
        await conn.rollback();
        return res.status(400).json({ error: 'Yêu cầu đăng ký quán ăn của bạn đang chờ xét duyệt.' });
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
      return res.status(400).json({ error: 'Số điện thoại này đã được một quán ăn khác sử dụng.' });
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
          min_order_amount = ?, avg_prep_time_min = ?,
          bank_name = ?, bank_account_no = ?, bank_account_holder = ?,
          status = 'pending', rejection_reason = NULL, approved_at = NULL, approved_by_admin_id = NULL
         WHERE id = ?`,
        [
          cuisineIdValue,
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
          districtValue,
          city.trim(),
          coordinates.latitude,
          coordinates.longitude,
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
          min_order_amount, avg_prep_time_min,
          bank_name, bank_account_no, bank_account_holder, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
        [
          userId,
          cuisineIdValue,
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
          districtValue,
          city.trim(),
          coordinates.latitude,
          coordinates.longitude,
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
        `Quán ăn "${name.trim()}" vừa gửi yêu cầu duyệt hồ sơ đối tác.`,
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

/**
 * GET /api/v1/merchant/me/dashboard
 * Lấy thông tin KPI của nhà hàng
 */
router.get('/me/dashboard', requireAuth, async (req, res, next) => {
  try {
    const userId = req.user?.id || req.user?.userId || req.auth?.userId;
    const roles = req.user?.roles || req.auth?.roles || [];
    const primaryRole = req.user?.primaryRole || req.auth?.primaryRole;
    
    if (!roles.includes('merchant') && primaryRole !== 'merchant') {
      return res.status(403).json({ error: 'Forbidden. Merchant access only.' });
    }

    let restaurantId = req.user?.restaurantId || req.auth?.restaurantId;
    let ratingAvg = 0;

    if (!restaurantId && userId) {
      const [restRows] = await pool.query(
        'SELECT id, rating_avg FROM restaurants WHERE owner_user_id = ? LIMIT 1',
        [userId]
      );
      if (restRows.length > 0) {
        restaurantId = restRows[0].id;
        ratingAvg = Number(restRows[0].rating_avg ?? 0);
      }
    } else if (restaurantId) {
      const [restRows] = await pool.query(
        'SELECT rating_avg FROM restaurants WHERE id = ? LIMIT 1',
        [restaurantId]
      );
      if (restRows.length > 0) {
        ratingAvg = Number(restRows[0].rating_avg ?? 0);
      }
    }

    if (!restaurantId) {
      return res.status(404).json({ error: 'Không tìm thấy quán ăn của đối tác này.' });
    }

    const range = ['today', 'yesterday', 'week', 'month', '90d', 'all', 'custom'].includes(req.query.range) ? req.query.range : 'today';
    let { fromDate, toDate } = req.query;

    let dateConditionSql = 'placed_at >= CURDATE()';
    let chartDaysCount = 7;
    let chartEndDate = new Date();
    let chartDateConditionSql = 'placed_at >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)';

    if (fromDate && toDate) {
      const fromLiteral = pool.escape(`${fromDate} 00:00:00`);
      const toLiteral = pool.escape(`${toDate} 23:59:59`);
      dateConditionSql = `placed_at >= ${fromLiteral} AND placed_at <= ${toLiteral}`;
      
      const diffMs = Math.abs(new Date(toDate) - new Date(fromDate));
      chartDaysCount = Math.min(90, Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)) + 1));
      chartEndDate = new Date(toDate);
      chartDateConditionSql = `placed_at >= ${fromLiteral} AND placed_at <= ${toLiteral}`;
    } else if (range === 'all') {
      dateConditionSql = '1 = 1';
      chartDateConditionSql = '1 = 1';
    } else if (range === 'yesterday') {
      dateConditionSql = 'placed_at >= DATE_SUB(CURDATE(), INTERVAL 1 DAY) AND placed_at < CURDATE()';
      chartDaysCount = 7;
    } else if (range === 'week') {
      dateConditionSql = 'placed_at >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)';
      chartDaysCount = 7;
      chartDateConditionSql = 'placed_at >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)';
    } else if (range === 'month') {
      dateConditionSql = 'placed_at >= DATE_SUB(CURDATE(), INTERVAL 29 DAY)';
      chartDaysCount = 30;
      chartDateConditionSql = 'placed_at >= DATE_SUB(CURDATE(), INTERVAL 29 DAY)';
    } else if (range === '90d') {
      dateConditionSql = 'placed_at >= DATE_SUB(CURDATE(), INTERVAL 89 DAY)';
      chartDaysCount = 90;
      chartDateConditionSql = 'placed_at >= DATE_SUB(CURDATE(), INTERVAL 89 DAY)';
    }

    // 1. Summary
    const [[summaryRows]] = await pool.query(
      `SELECT 
         COUNT(CASE WHEN status = 'delivered' AND ${dateConditionSql} THEN 1 END) AS orderCount,
         COALESCE(SUM(CASE WHEN status = 'delivered' AND ${dateConditionSql} THEN total_amount END), 0) AS revenue,
         COUNT(CASE WHEN status = 'placed' THEN 1 END) AS newOrderCount
       FROM orders
       WHERE restaurant_id = ?`,
      [restaurantId]
    );

    const orderCount = Number(summaryRows.orderCount);
    const revenue = Number(summaryRows.revenue);
    const newOrderCount = Number(summaryRows.newOrderCount);
    const avgOrderValue = orderCount > 0 ? Math.round(revenue / orderCount) : 0;

    // 2. Top Items (Top 5 bán chạy từ đơn hàng 'delivered')
    const [topItems] = await pool.query(
      `SELECT 
         oi.menu_item_id AS menuItemId,
         oi.item_name_snapshot AS name,
         SUM(oi.quantity) AS totalSold,
         SUM(oi.line_subtotal) AS revenue
       FROM order_items oi
       INNER JOIN orders o ON o.id = oi.order_id
       WHERE o.restaurant_id = ? 
         AND o.status = 'delivered'
         AND ${dateConditionSql}
       GROUP BY oi.menu_item_id, oi.item_name_snapshot
       ORDER BY totalSold DESC, revenue DESC
       LIMIT 5`,
      [restaurantId]
    );

    const formattedTopItems = topItems.map(item => ({
      menuItemId: Number(item.menuItemId),
      name: item.name,
      totalSold: Number(item.totalSold),
      revenue: Number(item.revenue)
    }));

    // 3. Recent Orders (10 đơn hàng gần nhất)
    const [recentOrders] = await pool.query(
      `SELECT 
         o.order_code AS orderCode,
         u.full_name AS customerName,
         o.total_amount AS totalAmount,
         o.status,
         o.placed_at AS placedAt
       FROM orders o
       LEFT JOIN users u ON u.id = o.customer_id
       WHERE o.restaurant_id = ? AND o.status NOT IN ('pending_payment', 'payment_failed', 'expired')
       ORDER BY o.placed_at DESC
       LIMIT 10`,
      [restaurantId]
    );

    const formattedRecentOrders = recentOrders.map(o => ({
      orderCode: o.orderCode,
      customerName: o.customerName ?? 'Khách hàng',
      totalAmount: Number(o.totalAmount),
      status: o.status,
      placedAt: o.placedAt
    }));

    // 4. Chart
    let chartData = [];
    if (range === 'all') {
      const [chartRows] = await pool.query(
        `SELECT 
           DATE_FORMAT(placed_at, '%Y-%m-%d') AS dateStr,
           COUNT(*) AS orderCount,
           COALESCE(SUM(total_amount), 0) AS revenue
         FROM orders
         WHERE restaurant_id = ? 
           AND status = 'delivered'
         GROUP BY DATE_FORMAT(placed_at, '%Y-%m-%d')
         ORDER BY DATE_FORMAT(placed_at, '%Y-%m-%d') ASC`,
        [restaurantId]
      );
      chartData = chartRows.map(r => ({
        date: r.dateStr,
        orderCount: Number(r.orderCount),
        revenue: Number(r.revenue)
      }));
    } else {
      for (let i = chartDaysCount - 1; i >= 0; i--) {
        const d = new Date(chartEndDate.getTime());
        d.setDate(d.getDate() - i);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        const dateStr = `${year}-${month}-${day}`;
        chartData.push({
          date: dateStr,
          orderCount: 0,
          revenue: 0
        });
      }

      const [chartRows] = await pool.query(
        `SELECT 
           DATE_FORMAT(placed_at, '%Y-%m-%d') AS dateStr,
           COUNT(*) AS orderCount,
           COALESCE(SUM(total_amount), 0) AS revenue
         FROM orders
         WHERE restaurant_id = ? 
           AND status = 'delivered'
           AND ${chartDateConditionSql}
         GROUP BY DATE_FORMAT(placed_at, '%Y-%m-%d')
         ORDER BY DATE_FORMAT(placed_at, '%Y-%m-%d') ASC`,
        [restaurantId]
      );

      for (const row of chartRows) {
        const match = chartData.find(c => c.date === row.dateStr);
        if (match) {
          match.orderCount = Number(row.orderCount);
          match.revenue = Number(row.revenue);
        }
      }
    }

    res.json({
      summary: {
        orderCount,
        revenue,
        avgOrderValue,
        ratingAvg,
        newOrderCount
      },
      topItems: formattedTopItems,
      recentOrders: formattedRecentOrders,
      chart: chartData
    });
  } catch (err) {
    next(err);
  }
});

// Middleware phụ trợ để lấy ID nhà hàng và kiểm tra quyền sở hữu của merchant
async function getMerchantRestaurant(req, res, next) {
  try {
    const userId = req.auth.userId;
    const [rows] = await pool.query(
      'SELECT id, status FROM restaurants WHERE owner_user_id = ? LIMIT 1',
      [userId]
    );
    if (rows.length === 0) {
      return res.status(403).json({ error: 'Bạn không sở hữu quán ăn nào trên hệ thống.' });
    }
    req.restaurantId = rows[0].id;
    next();
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/v1/merchant/me/orders
 * Query: status (optional), date (YYYY-MM-DD, default today)
 */
router.get('/me/orders', requireAuth, ensureMerchant, async (req, res, next) => {
  try {
    const restaurant = await loadOwnedRestaurant(req.auth.userId);
    if (!restaurant) {
      return res.status(404).json({ error: 'Không tìm thấy quán ăn của bạn.' });
    }

    const { fromDate, toDate } = req.query;
    const status = req.query.status ? String(req.query.status).trim() : null;

    let dateSql = '';
    const params = [restaurant.id];

    if (fromDate && toDate) {
      dateSql = ' AND o.placed_at >= ? AND o.placed_at <= ?';
      params.push(`${fromDate} 00:00:00`, `${toDate} 23:59:59`);
    } else {
      const date = parseOrderDate(req.query.date);
      dateSql = ' AND DATE(o.placed_at) = ?';
      params.push(date);
    }

    let statusSql = '';
    if (status) {
      if (['pending_payment', 'payment_failed', 'expired'].includes(status)) {
        return res.json({ orders: [] });
      }
      statusSql = ' AND o.status = ?';
      params.push(status);
    } else {
      statusSql = " AND o.status NOT IN ('pending_payment', 'payment_failed', 'expired')";
    }

    const [orders] = await pool.query(
      `SELECT o.*, u.full_name AS customer_name, u.phone AS customer_phone
       FROM orders o
       JOIN users u ON u.id = o.customer_id
       WHERE o.restaurant_id = ?
         ${dateSql}
         ${statusSql}
       ORDER BY o.placed_at DESC`,
      params,
    );

    if (orders.length === 0) {
      return res.json({ orders: [] });
    }

    const orderIds = orders.map((o) => o.id);
    const [items] = await pool.query(
      'SELECT * FROM order_items WHERE order_id IN (?) ORDER BY id ASC',
      [orderIds],
    );

    const serialized = orders.map((row) => {
      const customer = { full_name: row.customer_name, phone: row.customer_phone };
      const orderItems = items.filter((item) => item.order_id === row.id);
      return serializeMerchantOrder(row, orderItems, customer);
    });

    res.json({ orders: serialized });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/merchant/me/menu
 * Lấy danh mục và món ăn của quán
 */
router.get('/me/menu', requireAuth, getMerchantRestaurant, async (req, res, next) => {
  try {
    const restaurantId = req.restaurantId;
    
    const [categories] = await pool.query(
      'SELECT * FROM menu_categories WHERE restaurant_id = ? ORDER BY sort_order ASC, id ASC',
      [restaurantId]
    );

    const [items] = await pool.query(
      'SELECT * FROM menu_items WHERE restaurant_id = ? ORDER BY sort_order ASC, id ASC',
      [restaurantId]
    );

    const result = categories.map(cat => ({
      id: cat.id,
      name: cat.name,
      sortOrder: cat.sort_order,
      isActive: Boolean(cat.is_active),
      items: items
        .filter(item => item.category_id === cat.id)
        .map(item => ({
          id: item.id,
          categoryId: item.category_id,
          name: item.name,
          description: item.description,
          imageUrl: item.image_url,
          price: Number(item.price),
          prepTimeMin: item.prep_time_min,
          inStock: Boolean(item.in_stock),
          isFeatured: Boolean(item.is_featured),
          sortOrder: item.sort_order,
          totalSold: item.total_sold,
          ratingAvg: Number(item.rating_avg),
          status: item.status
        }))
    }));

    res.json({ categories: result });
  } catch (err) {
    next(err);
  }
});

/**
 * PATCH /api/v1/merchant/me/orders/:orderCode/status
 * Body: { action, cancelReason? }
 */
router.patch('/me/orders/:orderCode/status', requireAuth, ensureMerchant, async (req, res, next) => {
  const conn = await pool.getConnection();
  try {
    const restaurant = await loadOwnedRestaurant(req.auth.userId);
    if (!restaurant) {
      return res.status(404).json({ error: 'Không tìm thấy quán ăn của bạn.' });
    }

    const orderCode = String(req.params.orderCode ?? '').trim();
    const action = String(req.body?.action ?? '').trim();
    if (!orderCode || !action) {
      return res.status(400).json({ error: 'Thiếu orderCode hoặc action.' });
    }

    await conn.beginTransaction();
    const order = await loadOrderForRestaurant(orderCode, restaurant.id, conn, { forUpdate: true });
    if (!order) {
      await conn.rollback();
      return res.status(404).json({ error: 'Không tìm thấy đơn hàng.' });
    }

    if (['pending_payment', 'payment_failed', 'expired'].includes(order.status)) {
      await conn.rollback();
      return res.status(400).json({ error: 'Không thể cập nhật trạng thái của đơn hàng chưa thanh toán hoặc đã hết hạn.' });
    }

    const transition = resolveStatusAction(action, order);
    const cancelReason = String(req.body?.cancelReason ?? '').trim()
      || 'Quán hủy đơn hàng.';

    if (transition.cancel && order.payment_status === 'paid') {
      await conn.rollback();
      return res.status(409).json({ error: 'Paid orders must be refunded and cancelled by an administrator.' });
    }

    const updates = ['status = ?', 'updated_at = NOW()'];
    const values = [transition.to];

    if (transition.setAcceptedAt) {
      updates.push('accepted_at = NOW()');
    }
    if (transition.setReadyAt) {
      updates.push('ready_at = NOW()');
    }
    if (transition.setDeliveringAt) {
      updates.push('delivering_at = NOW()');
    }
    if (transition.cancel) {
      updates.push('cancelled_at = NOW()', "cancelled_by_role = 'merchant'", 'cancel_reason = ?');
      values.push(cancelReason);
    }

    values.push(order.id);
    await conn.query(`UPDATE orders SET ${updates.join(', ')} WHERE id = ?`, values);

    if (transition.cancel) {
      await conn.query(
        "UPDATE voucher_redemptions SET status = 'released', released_at = NOW() WHERE order_id = ? AND status IN ('reserved', 'redeemed')",
        [order.id],
      );
    }

    const noteByAction = {
      accept: 'Quán xác nhận đơn',
      start_preparing: 'Bắt đầu chuẩn bị',
      ready: 'Sẵn sàng giao cho khách',
      start_delivery: 'Nhà hàng bắt đầu giao đơn',
      cancel: cancelReason,
    };

    await conn.query(
      `INSERT INTO order_status_logs (order_id, from_status, to_status, changed_by_role, changed_by_user_id, note)
       VALUES (?, ?, ?, 'merchant', ?, ?)`,
      [order.id, transition.from ?? order.status, transition.to, req.auth.userId, noteByAction[action] ?? null],
    );

    const notification = customerNotificationForAction(action, order.order_code, restaurant.name);
    if (notification) {
      await conn.query(
        `INSERT INTO notifications (user_id, type, title, body, link_url)
         VALUES (?, ?, ?, ?, ?)`,
        [
          order.customer_id,
          notification.type,
          notification.title,
          notification.body,
          notification.linkUrl,
        ],
      );
    }

    await conn.commit();

    const [updatedRows] = await pool.query('SELECT * FROM orders WHERE id = ? LIMIT 1', [order.id]);
    const customer = await loadCustomer(order.customer_id);
    const orderItems = await loadOrderItems(order.id);

    res.json({
      order: serializeMerchantOrder(updatedRows[0], orderItems, customer),
    });
  } catch (err) {
    await conn.rollback();
    next(err);
  } finally {
    conn.release();
  }
});

/**
 * POST /api/v1/merchant/me/categories
 * Tạo danh mục mới
 */
router.post('/me/categories', requireAuth, getMerchantRestaurant, async (req, res, next) => {
  try {
    const restaurantId = req.restaurantId;
    const { name, sortOrder = 0 } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Tên danh mục không được để trống.' });
    }

    const [result] = await pool.query(
      'INSERT INTO menu_categories (restaurant_id, name, sort_order) VALUES (?, ?, ?)',
      [restaurantId, name.trim(), Number(sortOrder)]
    );

    res.status(201).json({
      id: result.insertId,
      name: name.trim(),
      sortOrder: Number(sortOrder),
      isActive: true,
      items: []
    });
  } catch (err) {
    next(err);
  }
});

/**
 * PATCH /api/v1/merchant/me/categories/:id
 * Chỉnh sửa danh mục
 */
router.patch('/me/categories/:id', requireAuth, getMerchantRestaurant, async (req, res, next) => {
  try {
    const restaurantId = req.restaurantId;
    const categoryId = req.params.id;

    const [catRows] = await pool.query(
      'SELECT id FROM menu_categories WHERE id = ? AND restaurant_id = ? LIMIT 1',
      [categoryId, restaurantId]
    );
    if (catRows.length === 0) {
      return res.status(404).json({ error: 'Không tìm thấy danh mục hoặc danh mục không thuộc quán của bạn.' });
    }

    const { name, sortOrder, isActive } = req.body;
    const updates = [];
    const params = [];

    if (name !== undefined) {
      if (!name.trim()) {
        return res.status(400).json({ error: 'Tên danh mục không được để trống.' });
      }
      updates.push('name = ?');
      params.push(name.trim());
    }
    if (sortOrder !== undefined) {
      updates.push('sort_order = ?');
      params.push(Number(sortOrder));
    }
    if (isActive !== undefined) {
      updates.push('is_active = ?');
      params.push(isActive ? 1 : 0);
    }

    if (updates.length > 0) {
      params.push(categoryId);
      await pool.query(
        `UPDATE menu_categories SET ${updates.join(', ')} WHERE id = ?`,
        params
      );
    }

    res.json({ message: 'Cập nhật danh mục thành công.' });
  } catch (err) {
    next(err);
  }
});

/**
 * DELETE /api/v1/merchant/me/categories/:id
 * Xóa danh mục (chặn nếu còn món)
 */
router.delete('/me/categories/:id', requireAuth, getMerchantRestaurant, async (req, res, next) => {
  try {
    const restaurantId = req.restaurantId;
    const categoryId = req.params.id;

    const [catRows] = await pool.query(
      'SELECT id FROM menu_categories WHERE id = ? AND restaurant_id = ? LIMIT 1',
      [categoryId, restaurantId]
    );
    if (catRows.length === 0) {
      return res.status(404).json({ error: 'Không tìm thấy danh mục hoặc danh mục không thuộc quán của bạn.' });
    }

    const [itemRows] = await pool.query(
      'SELECT id FROM menu_items WHERE category_id = ? LIMIT 1',
      [categoryId]
    );
    if (itemRows.length > 0) {
      return res.status(400).json({ error: 'Không thể xóa danh mục vì vẫn còn món ăn trong danh mục này.' });
    }

    await pool.query('DELETE FROM menu_categories WHERE id = ?', [categoryId]);
    res.json({ message: 'Xóa danh mục thành công.' });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/v1/merchant/me/items
 * Tạo món ăn mới
 */
router.post('/me/items', requireAuth, getMerchantRestaurant, async (req, res, next) => {
  try {
    const restaurantId = req.restaurantId;
    const {
      categoryId,
      name,
      description = '',
      imageUrl = null,
      price,
      prepTimeMin = 15,
      isFeatured = false,
      sortOrder = 0
    } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Tên món ăn không được để trống.' });
    }
    if (price === undefined || isNaN(Number(price)) || Number(price) < 0) {
      return res.status(400).json({ error: 'Giá món ăn phải lớn hơn hoặc bằng 0.' });
    }
    if (!categoryId) {
      return res.status(400).json({ error: 'Vui lòng chọn danh mục món ăn.' });
    }

    const [catRows] = await pool.query(
      'SELECT id FROM menu_categories WHERE id = ? AND restaurant_id = ? LIMIT 1',
      [categoryId, restaurantId]
    );
    if (catRows.length === 0) {
      return res.status(400).json({ error: 'Danh mục không hợp lệ hoặc không thuộc quán của bạn.' });
    }

    if (isFeatured) {
      const [[countRow]] = await pool.query(
        'SELECT COUNT(*) as count FROM menu_items WHERE restaurant_id = ? AND is_featured = 1',
        [restaurantId]
      );
      if (countRow?.count >= 5) {
        return res.status(400).json({
          error: 'Mỗi quán chỉ được đặt tối đa 5 món nổi bật. Vui lòng bỏ ghim bớt món trước khi chọn thêm.',
        });
      }
    }

    const [result] = await pool.query(
      `INSERT INTO menu_items (
        restaurant_id, category_id, name, description, image_url, price, prep_time_min, is_featured, sort_order
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        restaurantId,
        categoryId,
        name.trim(),
        description,
        imageUrl,
        Number(price),
        Number(prepTimeMin),
        isFeatured ? 1 : 0,
        Number(sortOrder)
      ]
    );

    res.status(201).json({
      id: result.insertId,
      categoryId,
      name: name.trim(),
      description,
      imageUrl,
      price: Number(price),
      prepTimeMin: Number(prepTimeMin),
      inStock: true,
      isFeatured: Boolean(isFeatured),
      sortOrder: Number(sortOrder),
      totalSold: 0,
      ratingAvg: 0,
      status: 'active'
    });
  } catch (err) {
    next(err);
  }
});


/**
 * PATCH /api/v1/merchant/me/items/:id
 * Chỉnh sửa món ăn
 */
router.patch('/me/items/:id', requireAuth, getMerchantRestaurant, async (req, res, next) => {
  try {
    const restaurantId = req.restaurantId;
    const itemId = req.params.id;

    const [itemRows] = await pool.query(
      'SELECT id FROM menu_items WHERE id = ? AND restaurant_id = ? LIMIT 1',
      [itemId, restaurantId]
    );
    if (itemRows.length === 0) {
      return res.status(404).json({ error: 'Không tìm thấy món ăn hoặc món ăn không thuộc quán của bạn.' });
    }

    const {
      categoryId,
      name,
      description,
      imageUrl,
      price,
      prepTimeMin,
      isFeatured,
      sortOrder,
      inStock,
      status
    } = req.body;

    const updates = [];
    const params = [];

    if (categoryId !== undefined) {
      const [catRows] = await pool.query(
        'SELECT id FROM menu_categories WHERE id = ? AND restaurant_id = ? LIMIT 1',
        [categoryId, restaurantId]
      );
      if (catRows.length === 0) {
        return res.status(400).json({ error: 'Danh mục không hợp lệ hoặc không thuộc quán của bạn.' });
      }
      updates.push('category_id = ?');
      params.push(categoryId);
    }
    if (name !== undefined) {
      if (!name.trim()) {
        return res.status(400).json({ error: 'Tên món ăn không được để trống.' });
      }
      updates.push('name = ?');
      params.push(name.trim());
    }
    if (description !== undefined) {
      updates.push('description = ?');
      params.push(description);
    }
    if (imageUrl !== undefined) {
      updates.push('image_url = ?');
      params.push(imageUrl);
    }
    if (price !== undefined) {
      if (isNaN(Number(price)) || Number(price) < 0) {
        return res.status(400).json({ error: 'Giá món ăn phải lớn hơn hoặc bằng 0.' });
      }
      updates.push('price = ?');
      params.push(Number(price));
    }
    if (prepTimeMin !== undefined) {
      updates.push('prep_time_min = ?');
      params.push(Number(prepTimeMin));
    }
    if (isFeatured !== undefined) {
      if (isFeatured) {
        const [[itemRow]] = await pool.query(
          'SELECT is_featured FROM menu_items WHERE id = ?',
          [itemId]
        );
        if (!itemRow?.is_featured) {
          const [[countRow]] = await pool.query(
            'SELECT COUNT(*) as count FROM menu_items WHERE restaurant_id = ? AND is_featured = 1',
            [restaurantId]
          );
          if (countRow?.count >= 5) {
            return res.status(400).json({
              error: 'Mỗi quán chỉ được đặt tối đa 5 món nổi bật. Vui lòng bỏ ghim bớt món trước khi chọn thêm.',
            });
          }
        }
      }
      updates.push('is_featured = ?');
      params.push(isFeatured ? 1 : 0);
    }
    if (sortOrder !== undefined) {
      updates.push('sort_order = ?');
      params.push(Number(sortOrder));
    }
    if (inStock !== undefined) {
      updates.push('in_stock = ?');
      params.push(inStock ? 1 : 0);
    }
    if (status !== undefined) {
      if (status !== 'active' && status !== 'hidden') {
        return res.status(400).json({ error: 'Trạng thái món ăn không hợp lệ.' });
      }
      updates.push('status = ?');
      params.push(status);
    }

    if (updates.length > 0) {
      params.push(itemId);
      await pool.query(
        `UPDATE menu_items SET ${updates.join(', ')} WHERE id = ?`,
        params
      );
    }

    res.json({ message: 'Cập nhật món ăn thành công.' });
  } catch (err) {
    next(err);
  }
});

/**
 * DELETE /api/v1/merchant/me/items/:id
 * Xóa món ăn
 */
router.delete('/me/items/:id', requireAuth, getMerchantRestaurant, async (req, res, next) => {
  try {
    const restaurantId = req.restaurantId;
    const itemId = req.params.id;

    const [itemRows] = await pool.query(
      'SELECT id FROM menu_items WHERE id = ? AND restaurant_id = ? LIMIT 1',
      [itemId, restaurantId]
    );
    if (itemRows.length === 0) {
      return res.status(404).json({ error: 'Không tìm thấy món ăn hoặc món ăn không thuộc quán của bạn.' });
    }

    await pool.query('DELETE FROM menu_items WHERE id = ?', [itemId]);
    res.json({ message: 'Xóa món ăn thành công.' });
  } catch (err) {
    next(err);
  }
});

router.get('/me/vouchers', requireAuth, ensureMerchant, async (req, res, next) => {
  try {
    const restaurant = await loadOwnedRestaurant(req.auth.userId);
    if (!restaurant) {
      return res.status(404).json({ error: 'Không tìm thấy quán ăn của bạn.' });
    }

    const [rows] = await pool.query(
      `SELECT *
         FROM vouchers
        WHERE restaurant_id = ?
        ORDER BY created_at DESC, id DESC`,
      [restaurant.id],
    );

    res.json({ vouchers: rows.map(serializeVoucher) });
  } catch (err) {
    next(err);
  }
});

router.post('/me/vouchers', requireAuth, ensureMerchant, async (req, res, next) => {
  try {
    const restaurant = await loadOwnedRestaurant(req.auth.userId);
    if (!restaurant) {
      return res.status(404).json({ error: 'Không tìm thấy quán ăn của bạn.' });
    }

    const payload = validateVoucherPayload(req.body);
    const [duplicateRows] = await pool.query(
      'SELECT id FROM vouchers WHERE code = ? LIMIT 1',
      [payload.code],
    );
    if (duplicateRows.length > 0) {
      return res.status(409).json({ error: 'Mã voucher đã tồn tại trên hệ thống.' });
    }

    const [result] = await pool.query(
      `INSERT INTO vouchers (
        restaurant_id, created_by_user_id, code, name, description,
        discount_type, discount_value, max_discount_amount, min_order_amount,
        usage_limit, per_user_limit, is_public, starts_at, ends_at, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)` ,
      [
        restaurant.id,
        req.auth.userId,
        payload.code,
        payload.name,
        payload.description,
        payload.discountType,
        payload.discountValue,
        payload.maxDiscountAmount,
        payload.minOrderAmount,
        payload.usageLimit,
        payload.perUserLimit,
        payload.isPublic,
        payload.startsAt,
        payload.endsAt,
        payload.status,
      ],
    );

    const [rows] = await pool.query('SELECT * FROM vouchers WHERE id = ? LIMIT 1', [result.insertId]);
    res.status(201).json({ voucher: serializeVoucher(rows[0]) });
  } catch (err) {
    next(err);
  }
});

router.patch('/me/vouchers/:id', requireAuth, ensureMerchant, async (req, res, next) => {
  try {
    const restaurant = await loadOwnedRestaurant(req.auth.userId);
    if (!restaurant) {
      return res.status(404).json({ error: 'Không tìm thấy quán ăn của bạn.' });
    }

    const voucherId = Number(req.params.id);
    if (!voucherId) {
      return res.status(400).json({ error: 'ID voucher không hợp lệ.' });
    }

    const current = await loadVoucherForRestaurant(voucherId, restaurant.id);
    if (!current) {
      return res.status(404).json({ error: 'Không tìm thấy voucher của quán.' });
    }

    const payload = validateVoucherPayload({
      code: current.code,
      name: current.name,
      description: current.description,
      discountType: current.discount_type,
      discountValue: current.discount_value,
      maxDiscountAmount: current.max_discount_amount,
      minOrderAmount: current.min_order_amount,
      usageLimit: current.usage_limit,
      perUserLimit: current.per_user_limit,
      isPublic: current.is_public,
      startsAt: current.starts_at,
      endsAt: current.ends_at,
      status: current.status,
      ...req.body,
    });

    if (payload.code !== current.code) {
      const [duplicateRows] = await pool.query(
        'SELECT id FROM vouchers WHERE code = ? AND id <> ? LIMIT 1',
        [payload.code, voucherId],
      );
      if (duplicateRows.length > 0) {
        return res.status(409).json({ error: 'Mã voucher đã tồn tại trên hệ thống.' });
      }
    }

    await pool.query(
      `UPDATE vouchers SET
        code = ?, name = ?, description = ?, discount_type = ?, discount_value = ?,
        max_discount_amount = ?, min_order_amount = ?, usage_limit = ?, per_user_limit = ?,
        is_public = ?, starts_at = ?, ends_at = ?, status = ?
       WHERE id = ? AND restaurant_id = ?`,
      [
        payload.code,
        payload.name,
        payload.description,
        payload.discountType,
        payload.discountValue,
        payload.maxDiscountAmount,
        payload.minOrderAmount,
        payload.usageLimit,
        payload.perUserLimit,
        payload.isPublic,
        payload.startsAt,
        payload.endsAt,
        payload.status,
        voucherId,
        restaurant.id,
      ],
    );

    const [rows] = await pool.query('SELECT * FROM vouchers WHERE id = ? LIMIT 1', [voucherId]);
    res.json({ voucher: serializeVoucher(rows[0]) });
  } catch (err) {
    next(err);
  }
});

router.delete('/me/vouchers/:id', requireAuth, ensureMerchant, async (req, res, next) => {
  const connection = await pool.getConnection();
  try {
    const restaurant = await loadOwnedRestaurant(req.auth.userId);
    if (!restaurant) {
      return res.status(404).json({ error: 'Restaurant not found.' });
    }

    const voucherId = Number(req.params.id);
    if (!Number.isInteger(voucherId) || voucherId <= 0) {
      return res.status(400).json({ error: 'Invalid voucher ID.' });
    }

    await connection.beginTransaction();
    const [voucherRows] = await connection.query(
      'SELECT id FROM vouchers WHERE id = ? AND restaurant_id = ? FOR UPDATE',
      [voucherId, restaurant.id],
    );
    if (!voucherRows.length) {
      await connection.rollback();
      return res.status(404).json({ error: 'Voucher not found.' });
    }

    const [[usage]] = await connection.query(
      'SELECT COUNT(*) AS total FROM voucher_redemptions WHERE voucher_id = ?',
      [voucherId],
    );
    const archived = Number(usage?.total ?? 0) > 0;
    if (archived) {
      await connection.query(
        "UPDATE vouchers SET status = 'paused' WHERE id = ?",
        [voucherId],
      );
    } else {
      await connection.query('DELETE FROM vouchers WHERE id = ?', [voucherId]);
    }

    await connection.commit();
    return res.json({ ok: true, archived });
  } catch (error) {
    await connection.rollback();
    return next(error);
  } finally {
    connection.release();
  }
});

router.get('/me/reviews', requireAuth, ensureMerchant, async (req, res, next) => {
  try {
    const restaurant = await loadOwnedRestaurant(req.auth.userId);
    if (!restaurant) return res.status(404).json({ error: 'Restaurant not found.' });

    const limit = Math.min(Math.max(Number(req.query.limit) || 50, 1), 200);
    const page = Math.max(Number(req.query.page) || 1, 1);
    const offset = (page - 1) * limit;
    const rating = req.query.rating === undefined ? null : Number(req.query.rating);
    const replied = String(req.query.replied ?? 'all');
    const target = String(req.query.target ?? 'all');
    if (rating !== null && (!Number.isInteger(rating) || rating < 1 || rating > 5)) {
      return res.status(400).json({ error: 'rating must be an integer from 1 to 5.' });
    }
    if (!['all', 'true', 'false'].includes(replied)) {
      return res.status(400).json({ error: 'replied must be all, true, or false.' });
    }
    if (!['all', 'restaurant', 'dish'].includes(target)) {
      return res.status(400).json({ error: 'target must be all, restaurant, or dish.' });
    }

    const filters = ['rv.restaurant_id = ?'];
    const params = [restaurant.id];
    if (rating !== null) {
      filters.push('rv.rating = ?');
      params.push(rating);
    }
    if (replied === 'true') filters.push('rv.reply_text IS NOT NULL');
    if (replied === 'false') filters.push('rv.reply_text IS NULL');
    if (target === 'restaurant') filters.push('rv.menu_item_id IS NULL');
    if (target === 'dish') filters.push('rv.menu_item_id IS NOT NULL');
    const where = filters.join(' AND ');

    const [[countRow]] = await pool.query(
      'SELECT COUNT(*) AS total FROM reviews rv WHERE ' + where,
      params,
    );
    const [[statsRow]] = await pool.query(
      'SELECT COUNT(*) AS total, SUM(CASE WHEN rv.menu_item_id IS NULL THEN 1 ELSE 0 END) AS restaurant_count, SUM(CASE WHEN rv.menu_item_id IS NOT NULL THEN 1 ELSE 0 END) AS dish_count FROM reviews rv WHERE rv.restaurant_id = ?',
      [restaurant.id],
    );
    const [rows] = await pool.query(
      'SELECT rv.id, rv.order_id, rv.rating, rv.comment, rv.reply_text, rv.reply_at, rv.created_at, rv.menu_item_id, u.full_name AS customer_name, u.avatar_url AS customer_avatar, o.order_code, mi.name AS menu_item_name, mi.image_url AS menu_item_image FROM reviews rv INNER JOIN users u ON u.id = rv.customer_id INNER JOIN orders o ON o.id = rv.order_id LEFT JOIN menu_items mi ON mi.id = rv.menu_item_id WHERE ' + where + ' ORDER BY rv.created_at DESC, rv.id DESC LIMIT ? OFFSET ?',
      [...params, limit, offset],
    );

    return res.json({
      items: rows.map((row) => ({
        id: Number(row.id),
        orderId: Number(row.order_id),
        orderCode: row.order_code,
        rating: Number(row.rating),
        comment: row.comment ?? '',
        replyText: row.reply_text ?? null,
        replyAt: row.reply_at ?? null,
        createdAt: row.created_at,
        customerName: row.customer_name,
        customerAvatar: row.customer_avatar,
        menuItemId: row.menu_item_id ? Number(row.menu_item_id) : null,
        menuItemName: row.menu_item_name ?? null,
        menuItemImage: row.menu_item_image ?? null,
      })),
      total: Number(countRow?.total ?? 0),
      summary: {
        total: Number(statsRow?.total ?? 0),
        restaurantCount: Number(statsRow?.restaurant_count ?? 0),
        dishCount: Number(statsRow?.dish_count ?? 0),
      },
      page,
      limit,
    });
  } catch (error) {
    return next(error);
  }
});

router.patch('/me/reviews/:reviewId/reply', requireAuth, ensureMerchant, async (req, res, next) => {
  try {
    const restaurant = await loadOwnedRestaurant(req.auth.userId);
    if (!restaurant) {
      return res.status(404).json({ error: 'Không tìm thấy quán ăn của bạn.' });
    }

    const reviewId = Number(req.params.reviewId);
    const replyText = String(req.body?.replyText ?? '').trim();
    if (!reviewId) {
      return res.status(400).json({ error: 'ID review không hợp lệ.' });
    }
    if (!replyText) {
      return res.status(400).json({ error: 'Nội dung phản hồi không được để trống.' });
    }

    const [rows] = await pool.query(
      'SELECT id FROM reviews WHERE id = ? AND restaurant_id = ? LIMIT 1',
      [reviewId, restaurant.id],
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Không tìm thấy review của quán.' });
    }

    await pool.query(
      'UPDATE reviews SET reply_text = ?, reply_at = NOW() WHERE id = ?',
      [replyText, reviewId],
    );

    const [updatedRows] = await pool.query(
      `SELECT rv.id, rv.order_id, rv.customer_id, rv.rating, rv.comment, rv.reply_text, rv.reply_at, rv.created_at,
              u.full_name AS customer_name, u.avatar_url AS customer_avatar, o.order_code
         FROM reviews rv
         INNER JOIN users u ON u.id = rv.customer_id
         INNER JOIN orders o ON o.id = rv.order_id
        WHERE rv.id = ?
        LIMIT 1`,
      [reviewId],
    );

    const row = updatedRows[0];
    if (row?.customer_id) {
      await pool.query(
        `INSERT INTO notifications (user_id, type, title, body, link_url)
         VALUES (?, 'system', 'Quán đã phản hồi đánh giá của bạn', ?, ?)`,
        [
          row.customer_id,
          `Quán "${restaurant.name}" vừa phản hồi nhận xét của bạn về đơn ${row.order_code}.`,
          `/app/reviews/${restaurant.id}`,
        ],
      );
    }

    res.json({
      review: {
        id: Number(row.id),
        orderId: Number(row.order_id),
        orderCode: row.order_code,
        rating: Number(row.rating),
        comment: row.comment ?? '',
        replyText: row.reply_text ?? null,
        replyAt: row.reply_at ?? null,
        createdAt: row.created_at,
        customerName: row.customer_name,
        customerAvatar: row.customer_avatar,
      },
    });
  } catch (err) {
    next(err);
  }
});

export default router;
