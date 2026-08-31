import { Router } from 'express';
import bcrypt from 'bcrypt';
import pool from '../db/pool.js';
import { requireAuth } from '../middleware/auth.js';
import { sendAdminResetPasswordEmail, sendAccountSuspensionEmail } from '../lib/mail.js';
import { buildRefundPayload, formatVnpayDate, verifyRefundResponse } from '../lib/vnpay.js';
import { logAudit } from '../lib/audit.js';
import { hasValidCoordinates } from '../lib/geo.js';
import { serializeAddressChangeRequest } from '../lib/restaurantAddressChanges.js';
import { DEFAULT_HOME_PAGE_CONFIG, normalizeHomePageConfig, parseHomePageConfig } from '../lib/homePageConfig.js';
import { refreshReviewStats } from '../lib/reviewSubmission.js';
import {
  ensureWallet,
  insertNotification,
  serializeRestaurantRow,
} from '../lib/adminApprovals.js';

const router = Router();

function ensureAdmin(req, res, next) {
  if ((req.auth.roles ?? []).includes('admin')) {
    return next();
  }
  return res.status(403).json({ error: 'Forbidden' });
}

function serializeUser(row, roles) {
  return {
    id: row.id,
    email: row.email,
    fullName: row.full_name,
    avatarUrl: row.avatar_url,
    primaryRole: row.primary_role,
    status: row.status,
    suspensionExpiresAt: row.suspension_expires_at ?? null,
    suspensionReason: row.suspension_reason ?? null,
    roles,
    joinedAt: row.created_at,
  };
}

function generateRandomPassword() {
  return Array.from({ length: 12 }, () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%^&*()';
    return chars[Math.floor(Math.random() * chars.length)];
  }).join('');
}

function cuisineSlug(value) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'd')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function normalizeCuisineInput(body, { partial = false } = {}) {
  const has = (key) => Object.prototype.hasOwnProperty.call(body ?? {}, key);
  const input = body ?? {};
  const result = {};

  if (!partial || has('name')) {
    const name = String(input.name ?? '').trim();
    if (!name || name.length > 80) return { error: 'Tên loại ẩm thực phải có từ 1 đến 80 ký tự.' };
    result.name = name;
  }
  if (!partial || has('slug')) {
    const slug = cuisineSlug(input.slug ?? result.name);
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) || slug.length > 80) return { error: 'Slug chỉ gồm chữ cái không dấu, số và dấu gạch nối.' };
    result.slug = slug;
  }
  if (has('iconUrl')) {
    const iconUrl = String(input.iconUrl ?? '').trim();
    if (iconUrl.length > 500) return { error: 'Đường dẫn biểu tượng không được vượt quá 500 ký tự.' };
    if (iconUrl) {
      try {
        const url = new URL(iconUrl);
        if (!['http:', 'https:'].includes(url.protocol)) throw new Error('Invalid protocol');
      } catch {
        return { error: 'Đường dẫn biểu tượng phải là URL http hoặc https hợp lệ.' };
      }
    }
    result.iconUrl = iconUrl || null;
  } else if (!partial) result.iconUrl = null;
  if (has('sortOrder')) {
    const sortOrder = Number(input.sortOrder);
    if (!Number.isInteger(sortOrder) || sortOrder < 0 || sortOrder > 32767) return { error: 'Thứ tự hiển thị phải là số nguyên từ 0 đến 32767.' };
    result.sortOrder = sortOrder;
  } else if (!partial) result.sortOrder = 0;
  if (has('isActive')) {
    if (typeof input.isActive !== 'boolean') return { error: 'Trạng thái hoạt động không hợp lệ.' };
    result.isActive = input.isActive;
  } else if (!partial) result.isActive = true;
  return { value: result };
}

function serializeCuisine(row) {
  return {
    id: row.id, name: row.name, slug: row.slug, iconUrl: row.icon_url,
    sortOrder: row.sort_order, isActive: Boolean(row.is_active),
    restaurantCount: Number(row.restaurant_count ?? 0), createdAt: row.created_at, updatedAt: row.updated_at,
  };
}

function serializeHomeBanner(row) {
  return {
    id: row.id, tag: row.tag, title: row.title, subtitle: row.subtitle,
    ctaLabel: row.cta_label, imageUrl: row.image_url, linkUrl: row.link_url,
    sortOrder: Number(row.sort_order), isActive: Boolean(row.is_active),
  };
}

function normalizeHomeBannerInput(body, { partial = false } = {}) {
  const input = body ?? {};
  const has = (key) => Object.prototype.hasOwnProperty.call(input, key);
  const result = {};
  const text = (key, max, label) => {
    if (partial && !has(key)) return null;
    const value = String(input[key] ?? '').trim();
    if (!value || value.length > max) return `${label} phải có từ 1 đến ${max} ký tự.`;
    result[key] = value;
    return null;
  };
  for (const [key, max, label] of [['tag', 80, 'Nhãn'], ['title', 160, 'Tiêu đề'], ['subtitle', 255, 'Mô tả'], ['ctaLabel', 80, 'Nhãn nút'], ['imageUrl', 500, 'Ảnh']]) {
    const error = text(key, max, label);
    if (error) return { error };
  }
  if (!partial || has('linkUrl')) {
    const linkUrl = String(input.linkUrl ?? '').trim();
    if (!linkUrl.startsWith('/')) return { error: 'Liên kết phải là đường dẫn nội bộ, ví dụ /app/search.' };
    result.linkUrl = linkUrl;
  }
  if (!partial || has('isActive')) {
    if (typeof input.isActive !== 'boolean') return { error: 'Trạng thái hiển thị không hợp lệ.' };
    result.isActive = input.isActive;
  }
  return { value: result };
}

router.use(requireAuth);
router.use(ensureAdmin);

router.get('/customer-home', async (_req, res, next) => {
  try {
    const [[row]] = await pool.query('SELECT config_json FROM home_page_settings WHERE id = 1');
    return res.json({ config: row?.config_json ? parseHomePageConfig(row.config_json) : DEFAULT_HOME_PAGE_CONFIG });
  } catch (err) { return next(err); }
});

router.patch('/customer-home', async (req, res, next) => {
  const config = normalizeHomePageConfig(req.body?.config);
  if (!config) return res.status(400).json({ error: 'Cấu hình trang chủ không hợp lệ.' });
  try {
    await pool.query('UPDATE home_page_settings SET config_json = ?, updated_by_admin_id = ? WHERE id = 1', [JSON.stringify(config), req.auth.userId]);
    await logAudit(pool, { adminId: req.auth.userId, action: 'cap_nhat_trang_chu_khach_hang', targetType: 'customer_home', targetId: '1' });
    return res.json({ config });
  } catch (err) { return next(err); }
});

router.get('/home-banners', async (_req, res, next) => {
  try {
    const [rows] = await pool.query('SELECT * FROM home_promo_banners ORDER BY sort_order ASC, id ASC');
    return res.json({ data: rows.map(serializeHomeBanner) });
  } catch (err) { return next(err); }
});

router.post('/home-banners', async (req, res, next) => {
  const parsed = normalizeHomeBannerInput(req.body);
  if (parsed.error) return res.status(400).json({ error: parsed.error });
  try {
    const { tag, title, subtitle, ctaLabel, imageUrl, linkUrl, isActive } = parsed.value;
    const [count] = await pool.query('SELECT COUNT(*) AS total FROM home_promo_banners');
    if (Number(count[0].total) >= 6) return res.status(409).json({ error: 'Chỉ được tạo tối đa 6 banner chiến dịch.' });
    const id = `banner-${Date.now().toString(36)}`;
    await pool.query('INSERT INTO home_promo_banners (id, tag, title, subtitle, cta_label, image_url, link_url, sort_order, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', [id, tag, title, subtitle, ctaLabel, imageUrl, linkUrl, Number(count[0].total) + 1, isActive ? 1 : 0]);
    const [[row]] = await pool.query('SELECT * FROM home_promo_banners WHERE id = ?', [id]);
    await logAudit(pool, { adminId: req.auth.userId, action: 'tao_banner_trang_chu', targetType: 'home_banner', targetId: id, metadata: { title } });
    return res.status(201).json({ banner: serializeHomeBanner(row) });
  } catch (err) { return next(err); }
});

router.patch('/home-banners/reorder', async (req, res, next) => {
  const ids = Array.isArray(req.body?.ids) ? req.body.ids.map(String) : [];
  if (!ids.length || new Set(ids).size !== ids.length) return res.status(400).json({ error: 'Thứ tự banner không hợp lệ.' });
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [rows] = await connection.query('SELECT id FROM home_promo_banners WHERE id IN (?) FOR UPDATE', [ids]);
    if (rows.length !== ids.length) { await connection.rollback(); return res.status(400).json({ error: 'Có banner không còn tồn tại.' }); }
    for (const [index, id] of ids.entries()) await connection.query('UPDATE home_promo_banners SET sort_order = ? WHERE id = ?', [index + 1, id]);
    await logAudit(connection, { adminId: req.auth.userId, action: 'sap_xep_banner_trang_chu', targetType: 'home_banner', targetId: 'all', metadata: { ids } });
    await connection.commit();
    return res.json({ ok: true });
  } catch (err) { await connection.rollback(); return next(err); } finally { connection.release(); }
});

router.patch('/home-banners/:id', async (req, res, next) => {
  const parsed = normalizeHomeBannerInput(req.body, { partial: true });
  if (parsed.error) return res.status(400).json({ error: parsed.error });
  const columns = { tag: 'tag', title: 'title', subtitle: 'subtitle', ctaLabel: 'cta_label', imageUrl: 'image_url', linkUrl: 'link_url', isActive: 'is_active' };
  const updates = Object.keys(parsed.value).map((key) => `${columns[key]} = ?`);
  if (!updates.length) return res.status(400).json({ error: 'Không có thông tin cần cập nhật.' });
  try {
    const values = Object.entries(parsed.value).map(([key, value]) => key === 'isActive' ? (value ? 1 : 0) : value);
    const [result] = await pool.query(`UPDATE home_promo_banners SET ${updates.join(', ')} WHERE id = ?`, [...values, req.params.id]);
    if (!result.affectedRows) return res.status(404).json({ error: 'Không tìm thấy banner.' });
    const [[row]] = await pool.query('SELECT * FROM home_promo_banners WHERE id = ?', [req.params.id]);
    await logAudit(pool, { adminId: req.auth.userId, action: 'cap_nhat_banner_trang_chu', targetType: 'home_banner', targetId: req.params.id, metadata: { title: row.title } });
    return res.json({ banner: serializeHomeBanner(row) });
  } catch (err) { return next(err); }
});

router.delete('/home-banners/:id', async (req, res, next) => {
  try {
    const [result] = await pool.query('DELETE FROM home_promo_banners WHERE id = ?', [req.params.id]);
    if (!result.affectedRows) return res.status(404).json({ error: 'Không tìm thấy banner.' });
    await logAudit(pool, { adminId: req.auth.userId, action: 'xoa_banner_trang_chu', targetType: 'home_banner', targetId: req.params.id });
    return res.status(204).send();
  } catch (err) { return next(err); }
});

router.get('/cuisines', async (_req, res, next) => {
  try {
    const [rows] = await pool.query(`SELECT c.*, COUNT(r.id) AS restaurant_count FROM cuisines c LEFT JOIN restaurants r ON r.cuisine_id = c.id GROUP BY c.id ORDER BY c.sort_order ASC, c.id ASC`);
    return res.json({ data: rows.map(serializeCuisine) });
  } catch (err) { return next(err); }
});

router.post('/cuisines', async (req, res, next) => {
  const parsed = normalizeCuisineInput(req.body);
  if (parsed.error) return res.status(400).json({ error: parsed.error });
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const { name, slug, iconUrl, sortOrder, isActive } = parsed.value;
    const [result] = await connection.query('INSERT INTO cuisines (name, slug, icon_url, sort_order, is_active) VALUES (?, ?, ?, ?, ?)', [name, slug, iconUrl, sortOrder, isActive ? 1 : 0]);
    const [[row]] = await connection.query('SELECT * FROM cuisines WHERE id = ?', [result.insertId]);
    await logAudit(connection, { adminId: req.auth.userId, action: 'tao_loai_am_thuc', targetType: 'cuisine', targetId: result.insertId, metadata: { tenLoai: name, slug } });
    await connection.commit();
    return res.status(201).json({ cuisine: serializeCuisine(row) });
  } catch (err) {
    await connection.rollback();
    if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'Tên hoặc slug loại ẩm thực đã tồn tại.' });
    return next(err);
  } finally { connection.release(); }
});

router.patch('/cuisines/reorder', async (req, res, next) => {
  const ids = Array.isArray(req.body?.ids) ? req.body.ids.map(Number) : [];
  if (!ids.length || ids.some((id) => !Number.isInteger(id) || id <= 0) || new Set(ids).size !== ids.length) {
    return res.status(400).json({ error: 'Danh sách thứ tự loại ẩm thực không hợp lệ.' });
  }
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [existing] = await connection.query('SELECT id FROM cuisines WHERE id IN (?) FOR UPDATE', [ids]);
    if (existing.length !== ids.length) {
      await connection.rollback();
      return res.status(400).json({ error: 'Có loại ẩm thực không còn tồn tại.' });
    }
    for (const [index, id] of ids.entries()) {
      await connection.query('UPDATE cuisines SET sort_order = ? WHERE id = ?', [index + 1, id]);
    }
    await logAudit(connection, { adminId: req.auth.userId, action: 'sap_xep_loai_am_thuc', targetType: 'cuisine', targetId: 'all', metadata: { thuTuIds: ids } });
    await connection.commit();
    return res.json({ ok: true });
  } catch (err) {
    await connection.rollback();
    return next(err);
  } finally { connection.release(); }
});

router.patch('/cuisines/:id', async (req, res, next) => {
  const id = Number(req.params.id);
  const parsed = normalizeCuisineInput(req.body, { partial: true });
  if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ error: 'ID loại ẩm thực không hợp lệ.' });
  if (parsed.error) return res.status(400).json({ error: parsed.error });
  if (!Object.keys(parsed.value).length) return res.status(400).json({ error: 'Không có thông tin cần cập nhật.' });
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [[previous]] = await connection.query('SELECT * FROM cuisines WHERE id = ? FOR UPDATE', [id]);
    if (!previous) { await connection.rollback(); return res.status(404).json({ error: 'Loại ẩm thực không tồn tại.' }); }
    const updates = [];
    const values = [];
    const columnMap = { name: 'name', slug: 'slug', iconUrl: 'icon_url', sortOrder: 'sort_order', isActive: 'is_active' };
    for (const [key, column] of Object.entries(columnMap)) {
      if (Object.prototype.hasOwnProperty.call(parsed.value, key)) {
        updates.push(`${column} = ?`);
        values.push(key === 'isActive' ? (parsed.value[key] ? 1 : 0) : parsed.value[key]);
      }
    }
    await connection.query(`UPDATE cuisines SET ${updates.join(', ')} WHERE id = ?`, [...values, id]);
    const [[row]] = await connection.query(`SELECT c.*, COUNT(r.id) AS restaurant_count FROM cuisines c LEFT JOIN restaurants r ON r.cuisine_id = c.id WHERE c.id = ? GROUP BY c.id`, [id]);
    await logAudit(connection, { adminId: req.auth.userId, action: parsed.value.isActive === false ? 'an_loai_am_thuc' : 'cap_nhat_loai_am_thuc', targetType: 'cuisine', targetId: id, metadata: { tenLoai: row.name, thayDoi: parsed.value } });
    await connection.commit();
    return res.json({ cuisine: serializeCuisine(row) });
  } catch (err) {
    await connection.rollback();
    if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'Tên hoặc slug loại ẩm thực đã tồn tại.' });
    return next(err);
  } finally { connection.release(); }
});

router.delete('/cuisines/:id', async (req, res, next) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ error: 'ID loại ẩm thực không hợp lệ.' });
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [[cuisine]] = await connection.query('SELECT id, name FROM cuisines WHERE id = ? FOR UPDATE', [id]);
    if (!cuisine) { await connection.rollback(); return res.status(404).json({ error: 'Loại ẩm thực không tồn tại.' }); }
    const [[usage]] = await connection.query('SELECT COUNT(*) AS total FROM restaurants WHERE cuisine_id = ?', [id]);
    if (Number(usage.total) > 0) { await connection.rollback(); return res.status(409).json({ error: 'Loại ẩm thực này đang được sử dụng. Hãy ẩn thay vì xóa.' }); }
    await connection.query('DELETE FROM cuisines WHERE id = ?', [id]);
    await logAudit(connection, { adminId: req.auth.userId, action: 'xoa_loai_am_thuc', targetType: 'cuisine', targetId: id, metadata: { tenLoai: cuisine.name } });
    await connection.commit();
    return res.status(204).send();
  } catch (err) { await connection.rollback(); return next(err); } finally { connection.release(); }
});

const ORDER_METRICS_WHERE = "status NOT IN ('cancelled', 'failed', 'pending_payment')";

function parseOverviewRange(raw, fromDate, toDate) {
  if (fromDate && toDate) {
    return {
      range: 'custom',
      fromDate,
      toDate,
      placedAtSql: 'placed_at >= ? AND placed_at < DATE_ADD(?, INTERVAL 1 DAY)',
      sqlParams: [fromDate, toDate],
    };
  }
  const range = ['today', 'week', '7d', 'month', '30d', '90d', 'quarter'].includes(raw) ? raw : 'month';
  if (range === 'today') {
    return {
      range: 'today',
      placedAtSql: 'placed_at >= CURDATE() AND placed_at < CURDATE() + INTERVAL 1 DAY',
      sqlParams: [],
    };
  }
  if (range === 'week' || range === '7d') {
    return {
      range: 'week',
      placedAtSql: 'placed_at >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)',
      sqlParams: [],
    };
  }
  if (range === '90d' || range === 'quarter') {
    return {
      range: '90d',
      placedAtSql: 'placed_at >= DATE_SUB(CURDATE(), INTERVAL 89 DAY)',
      sqlParams: [],
    };
  }
  return {
    range: 'month',
    placedAtSql: 'placed_at >= DATE_SUB(CURDATE(), INTERVAL 29 DAY)',
    sqlParams: [],
  };
}

router.get('/overview', async (req, res, next) => {
  try {
    const fromDate = req.query.fromDate ? String(req.query.fromDate).trim() : null;
    const toDate = req.query.toDate ? String(req.query.toDate).trim() : null;
    const { range, placedAtSql, sqlParams } = parseOverviewRange(
      String(req.query.range ?? 'month').toLowerCase(),
      fromDate,
      toDate,
    );

    const [[userCountRow]] = await pool.query('SELECT COUNT(*) AS n FROM users');
    const [[customerCountRow]] = await pool.query(
      "SELECT COUNT(DISTINCT user_id) AS n FROM user_roles WHERE role = 'customer'",
    );
    const [[merchantCountRow]] = await pool.query(
      "SELECT COUNT(DISTINCT user_id) AS n FROM user_roles WHERE role = 'merchant'",
    );
    const [[restaurantActiveRow]] = await pool.query(
      "SELECT COUNT(*) AS n FROM restaurants WHERE status = 'active'",
    );

    const [[orderMetrics]] = await pool.query(
      `SELECT
         COUNT(*) AS orderCount,
         COALESCE(SUM(total_amount), 0) AS gmv,
         COALESCE(SUM(platform_fee), 0) AS platformFee
       FROM orders
       WHERE ${placedAtSql} AND ${ORDER_METRICS_WHERE}`,
      sqlParams,
    );

    const [[refundRow]] = await pool.query(
      `SELECT COUNT(*) AS n
       FROM orders
       WHERE ${placedAtSql} AND payment_status = 'refunded'`,
      sqlParams,
    );

    const [[pendingRestaurantsRow]] = await pool.query(
      "SELECT COUNT(*) AS n FROM restaurants WHERE status = 'pending'",
    );

    const [recentSignupRows] = await pool.query(
      `SELECT id, full_name, email, primary_role, created_at
       FROM users
       ORDER BY created_at DESC
       LIMIT 10`,
    );

    const [chartRows] = await pool.query(
      `SELECT DATE(placed_at) AS day,
              COUNT(*) AS orders,
              COALESCE(SUM(total_amount), 0) AS gmv,
              COALESCE(SUM(platform_fee), 0) AS platformFee
       FROM orders
       WHERE ${placedAtSql} AND ${ORDER_METRICS_WHERE}
       GROUP BY DATE(placed_at)
       ORDER BY day ASC`,
      sqlParams,
    );

    res.json({
      range,
      totals: {
        userCount: Number(userCountRow?.n ?? 0),
        customerCount: Number(customerCountRow?.n ?? 0),
        merchantCount: Number(merchantCountRow?.n ?? 0),
        restaurantActiveCount: Number(restaurantActiveRow?.n ?? 0),
        orderCount: Number(orderMetrics?.orderCount ?? 0),
        gmv: Number(orderMetrics?.gmv ?? 0),
        platformFee: Number(orderMetrics?.platformFee ?? 0),
        refundCount: Number(refundRow?.n ?? 0),
      },
      pendingApprovals: {
        restaurants: Number(pendingRestaurantsRow?.n ?? 0),
      },
      recentSignups: recentSignupRows.map((row) => ({
        id: row.id,
        fullName: row.full_name,
        email: row.email,
        primaryRole: row.primary_role,
        createdAt: row.created_at,
      })),
      chart: chartRows.map((row) => ({
        date: row.day instanceof Date ? row.day.toISOString().slice(0, 10) : String(row.day).slice(0, 10),
        orders: Number(row.orders),
        gmv: Number(row.gmv),
        platformFee: Number(row.platformFee),
      })),
    });
  } catch (err) {
    next(err);
  }
});

router.get('/usersQuery', async (req, res, next) => {
  try {
    const role = String(req.query.role ?? 'all').trim().toLowerCase();
    const status = String(req.query.status ?? 'all').trim().toLowerCase();
    const q = String(req.query.q ?? '').trim().toLowerCase();
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
    const offset = (page - 1) * limit;

    const filters = [
      "u.status <> 'pending'",
    ];
    const params = [];

    if (role && role !== 'all') {
      filters.push('EXISTS (SELECT 1 FROM user_roles role_filter WHERE role_filter.user_id = u.id AND role_filter.role = ?)');
      params.push(role);
    }

    if (status && status !== 'all') {
      filters.push('u.status = ?');
      params.push(status);
    }

    if (q) {
      filters.push('(LOWER(u.full_name) LIKE ? OR LOWER(u.email) LIKE ?)');
      params.push(`%${q}%`, `%${q}%`);
    }

    const whereClause = filters.join(' AND ');

    const [countRows] = await pool.query(
      `SELECT COUNT(DISTINCT u.id) AS total
       FROM users u
       WHERE ${whereClause}`,
      params,
    );

    const [rows] = await pool.query(
      `SELECT u.id, u.email, u.full_name, u.avatar_url, u.primary_role, u.status, u.suspension_expires_at, u.suspension_reason, u.created_at,
              GROUP_CONCAT(DISTINCT ur.role) AS roles
       FROM users u
       LEFT JOIN user_roles ur ON ur.user_id = u.id
       WHERE ${whereClause}
       GROUP BY u.id
       ORDER BY u.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset],
    );

    const items = rows.map((row) => serializeUser(row, row.roles ? row.roles.split(',') : []));
    res.json({ items, total: Number(countRows[0]?.total ?? 0), page, limit });
  } catch (err) {
    next(err);
  }
});

router.get('/users/:id', async (req, res, next) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ error: 'ID người dùng không hợp lệ.' });
  try {
    const [user, roleRows, customerSummary, addressRows, restaurantRows, wallet] = await Promise.all([
      pool.query(`SELECT id, email, phone, full_name, avatar_url, primary_role, status, suspension_expires_at, suspension_reason, email_verified_at, phone_verified_at, last_login_at, created_at, updated_at FROM users WHERE id = ?`, [id]).then(([rows]) => rows[0]),
      pool.query('SELECT role FROM user_roles WHERE user_id = ? ORDER BY role', [id]).then(([rows]) => rows),
      pool.query(`SELECT COUNT(*) AS order_count, COALESCE(SUM(total_amount), 0) AS total_spent FROM orders WHERE customer_id = ? AND status NOT IN ('cancelled', 'failed', 'expired')`, [id]).then(([rows]) => rows[0]),
      pool.query(`SELECT label, line1, ward, district, city FROM customer_addresses WHERE customer_id = ? AND is_default = 1 LIMIT 1`, [id]).then(([rows]) => rows),
      pool.query(`SELECT r.id, r.name, r.status, r.rating_avg, r.review_count, r.is_open_now, c.name AS cuisine_name FROM restaurants r LEFT JOIN cuisines c ON c.id = r.cuisine_id WHERE r.owner_user_id = ? ORDER BY r.created_at DESC`, [id]).then(([rows]) => rows),
      pool.query(`SELECT balance, pending_balance, total_earned, total_withdrawn, is_locked FROM wallets WHERE user_id = ? AND owner_type = 'merchant' LIMIT 1`, [id]).then(([rows]) => rows[0]),
    ]);
    if (!user || user.status === 'pending') return res.status(404).json({ error: 'Không tìm thấy tài khoản.' });
    return res.json({
      account: {
        ...serializeUser(user, roleRows.map((row) => row.role)),
        phone: user.phone,
        emailVerifiedAt: user.email_verified_at,
        phoneVerifiedAt: user.phone_verified_at,
        lastLoginAt: user.last_login_at,
        updatedAt: user.updated_at,
        customerSummary: { orderCount: Number(customerSummary.order_count), totalSpent: Number(customerSummary.total_spent), defaultAddress: addressRows[0] || null },
        restaurants: restaurantRows.map((row) => ({ id: row.id, name: row.name, status: row.status, cuisineName: row.cuisine_name, ratingAvg: Number(row.rating_avg), reviewCount: Number(row.review_count), isOpenNow: Boolean(row.is_open_now) })),
        wallet: wallet ? { balance: Number(wallet.balance), pendingBalance: Number(wallet.pending_balance), totalEarned: Number(wallet.total_earned), totalWithdrawn: Number(wallet.total_withdrawn), isLocked: Boolean(wallet.is_locked) } : null,
      },
    });
  } catch (err) { return next(err); }
});

router.patch('/users/:id/status', async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const status = String(req.body?.status ?? '').trim().toLowerCase();
    const suspensionDays = req.body?.suspensionDays;
    const suspensionReason = String(req.body?.suspensionReason ?? '').trim();

    if (!id || !['active', 'suspended', 'banned'].includes(status)) {
      return res.status(400).json({ error: 'Status không hợp lệ.' });
    }

    if (id === req.auth.userId && status !== 'active') {
      return res.status(400).json({ error: 'Bạn không thể tự đình chỉ hoặc khóa tài khoản của chính mình.' });
    }

    let expiresAt = null;
    let reasonValue = null;
    if (status === 'suspended') {
      const days = Number(suspensionDays ?? 0);
      if (!Number.isInteger(days) || days < 1 || days > 365) {
        return res.status(400).json({ error: 'Số ngày đình chỉ phải là số nguyên từ 1 đến 365.' });
      }
      if (!suspensionReason) {
        return res.status(400).json({ error: 'Lý do đình chỉ là bắt buộc.' });
      }
      expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
      reasonValue = suspensionReason;
    }

    const connection = await pool.getConnection();
    let user;
    try {
      await connection.beginTransaction();
      const [rows] = await connection.query(
        'SELECT id, email, full_name, status FROM users WHERE id = ? LIMIT 1',
        [id],
      );
      user = rows[0];
      if (!user) {
        await connection.rollback();
        return res.status(404).json({ error: 'Người dùng không tồn tại.' });
      }

      const [targetRoles] = await connection.query('SELECT role FROM user_roles WHERE user_id = ?', [id]);
      if (['suspended', 'banned'].includes(status) && targetRoles.some((row) => row.role === 'admin')) {
        await connection.rollback();
        return res.status(403).json({ error: 'Không thể đình chỉ hoặc khóa tài khoản quản trị viên.' });
      }

      await connection.query(
        'UPDATE users SET status = ?, suspension_expires_at = ?, suspension_reason = ? WHERE id = ?',
        [status, expiresAt, reasonValue, id],
      );

      await logAudit(connection, {
        adminId: req.auth.userId,
        action: 'doi_trang_thai_tai_khoan',
        targetType: 'user',
        targetId: id,
        metadata: {
          trangThaiCu: user.status,
          trangThaiMoi: status,
          lyDo: reasonValue || suspensionReason || 'Thay đổi trạng thái tài khoản',
        },
      });
      await connection.commit();
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }

    if (status === 'suspended' && user.email) {
      await sendAccountSuspensionEmail({
        to: user.email,
        fullName: user.full_name,
        reason: reasonValue,
        expiresAt,
      });
    }

    res.json({ ok: true, status, suspensionExpiresAt: expiresAt ? expiresAt.toISOString() : null, suspensionReason: reasonValue });
  } catch (err) {
    next(err);
  }
});

router.post('/users/:id/reset-password', async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!id) {
      return res.status(400).json({ error: 'ID người dùng không hợp lệ.' });
    }

    const rawPassword = String(req.body?.newPassword ?? '').trim();
    const [rows] = await pool.query(
      'SELECT id, email, full_name FROM users WHERE id = ? LIMIT 1',
      [id],
    );
    const user = rows[0];
    if (!user) {
      return res.status(404).json({ error: 'Người dùng không tồn tại.' });
    }

    const newPassword = rawPassword || generateRandomPassword();
    if (newPassword.length < 8) {
      return res.status(400).json({ error: 'Mật khẩu phải có ít nhất 8 ký tự.' });
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await pool.query('UPDATE users SET password_hash = ? WHERE id = ?', [passwordHash, user.id]);

    let emailed = false;
    if (!rawPassword) {
      await sendAdminResetPasswordEmail({
        to: user.email,
        fullName: user.full_name,
        newPassword,
      });
      emailed = true;
    }

    res.json({ ok: true, newPassword, emailed });
  } catch (err) {
    next(err);
  }
});

router.get('/restaurants', async (req, res, next) => {
  try {
    const { q, status, cuisineId, city } = req.query;
    let whereConditions = ['1=1'];
    let params = [];

    if (q) {
      whereConditions.push('(r.name LIKE ? OR u.full_name LIKE ? OR u.email LIKE ? OR r.phone LIKE ? OR r.city LIKE ?)');
      const pattern = `%${q.trim()}%`;
      params.push(pattern, pattern, pattern, pattern, pattern);
    }

    if (status && status !== 'all') {
      whereConditions.push('r.status = ?');
      params.push(status);
    }

    if (cuisineId && cuisineId !== 'all') {
      whereConditions.push('r.cuisine_id = ?');
      params.push(Number(cuisineId));
    }

    if (city && city !== 'all') {
      whereConditions.push('r.city = ?');
      params.push(city);
    }

    const where = whereConditions.join(' AND ');
    const [rows] = await pool.query(
      `SELECT r.*, u.full_name AS owner_name, u.email AS owner_email, c.name AS cuisine_name
       FROM restaurants r
       JOIN users u ON u.id = r.owner_user_id
       LEFT JOIN cuisines c ON c.id = r.cuisine_id
       WHERE ${where}
       ORDER BY r.created_at DESC, r.id DESC`,
      params,
    );

    const [statsRows] = await pool.query(
      `SELECT
         COUNT(*) AS total,
         COUNT(CASE WHEN status = 'pending' THEN 1 END) AS pending,
         COUNT(CASE WHEN status = 'active' THEN 1 END) AS active,
         COUNT(CASE WHEN status = 'suspended' THEN 1 END) AS suspended,
         COUNT(CASE WHEN status = 'closed' THEN 1 END) AS closed
       FROM restaurants`,
    );

    const [[addressChangeStats]] = await pool.query(
      "SELECT COUNT(*) AS total FROM restaurant_address_change_requests WHERE status = 'pending'",
    );

    const summary = {
      total: Number(statsRows[0]?.total ?? 0),
      pending: Number(statsRows[0]?.pending ?? 0),
      active: Number(statsRows[0]?.active ?? 0),
      suspended: Number(statsRows[0]?.suspended ?? 0),
      closed: Number(statsRows[0]?.closed ?? 0),
      pendingAddresses: Number(addressChangeStats?.total ?? 0),
    };

    res.json({
      items: rows.map(serializeRestaurantRow),
      summary,
    });
  } catch (err) {
    next(err);
  }
});

router.get('/restaurants/pending', async (_req, res, next) => {
  try {
    const [rows] = await pool.query(
      `SELECT r.*, u.full_name AS owner_name, u.email AS owner_email, c.name AS cuisine_name
       FROM restaurants r
       JOIN users u ON u.id = r.owner_user_id
       LEFT JOIN cuisines c ON c.id = r.cuisine_id
       WHERE r.status = 'pending'
       ORDER BY r.created_at ASC`,
    );
    res.json({ items: rows.map(serializeRestaurantRow) });
  } catch (err) {
    next(err);
  }
});

router.get('/restaurant-address-change-requests', async (req, res, next) => {
  const status = String(req.query.status ?? 'pending').trim();
  const allowedStatuses = ['pending', 'approved', 'rejected', 'cancelled'];
  if (!allowedStatuses.includes(status)) {
    return res.status(400).json({ error: 'Trạng thái yêu cầu không hợp lệ.' });
  }

  try {
    const [rows] = await pool.query(
      `SELECT acr.*, r.name AS restaurant_name, u.full_name AS owner_name
       FROM restaurant_address_change_requests acr
       JOIN restaurants r ON r.id = acr.restaurant_id
       JOIN users u ON u.id = r.owner_user_id
       WHERE acr.status = ?
       ORDER BY acr.created_at ASC, acr.id ASC`,
      [status],
    );
    return res.json({ items: rows.map(serializeAddressChangeRequest) });
  } catch (error) {
    return next(error);
  }
});

router.post('/restaurant-address-change-requests/:id/approve', async (req, res, next) => {
  const requestId = Number(req.params.id);
  if (!Number.isInteger(requestId) || requestId <= 0) {
    return res.status(400).json({ error: 'ID yêu cầu không hợp lệ.' });
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [rows] = await connection.query(
      `SELECT acr.*, r.name AS restaurant_name, r.owner_user_id, u.full_name AS owner_name
       FROM restaurant_address_change_requests acr
       JOIN restaurants r ON r.id = acr.restaurant_id
       JOIN users u ON u.id = r.owner_user_id
       WHERE acr.id = ?
       LIMIT 1 FOR UPDATE`,
      [requestId],
    );
    const request = rows[0];
    if (!request) {
      await connection.rollback();
      return res.status(404).json({ error: 'Không tìm thấy yêu cầu đổi địa chỉ.' });
    }
    if (request.status !== 'pending') {
      await connection.rollback();
      return res.status(409).json({ error: 'Yêu cầu này không còn ở trạng thái chờ duyệt.' });
    }

    await connection.query(
      `UPDATE restaurants
       SET address_line = ?, ward = ?, district = ?, city = ?,
           latitude = ?, longitude = ?
       WHERE id = ?`,
      [
        request.proposed_address_line,
        request.proposed_ward,
        request.proposed_district,
        request.proposed_city,
        request.proposed_latitude,
        request.proposed_longitude,
        request.restaurant_id,
      ],
    );
    await connection.query(
      `UPDATE restaurant_address_change_requests
       SET status = 'approved', reviewed_by_admin_id = ?, reviewed_at = NOW(), rejection_reason = NULL
       WHERE id = ?`,
      [req.auth.userId, request.id],
    );
    await logAudit(connection, {
      adminId: req.auth.userId,
      action: 'duyet_doi_dia_chi_quan',
      targetType: 'restaurant_address_change_request',
      targetId: request.id,
      metadata: {
        quanId: request.restaurant_id,
        tenQuan: request.restaurant_name,
        diaChiCu: {
          diaChi: request.current_address_line,
          phuongXa: request.current_ward,
          quanHuyen: request.current_district,
          tinhThanh: request.current_city,
        },
        diaChiMoi: {
          diaChi: request.proposed_address_line,
          phuongXa: request.proposed_ward,
          quanHuyen: request.proposed_district,
          tinhThanh: request.proposed_city,
        },
      },
    });
    await insertNotification(connection, {
      userId: request.owner_user_id,
      title: 'Yêu cầu đổi địa chỉ đã được duyệt',
      body: `Địa chỉ của quán "${request.restaurant_name}" đã được cập nhật theo yêu cầu của bạn.`,
      linkUrl: '/merchant/settings',
    });
    const [updatedRows] = await connection.query(
      `SELECT acr.*, r.name AS restaurant_name, u.full_name AS owner_name
       FROM restaurant_address_change_requests acr
       JOIN restaurants r ON r.id = acr.restaurant_id
       JOIN users u ON u.id = r.owner_user_id
       WHERE acr.id = ? LIMIT 1`,
      [request.id],
    );
    await connection.commit();
    return res.json({ request: serializeAddressChangeRequest(updatedRows[0]) });
  } catch (error) {
    await connection.rollback();
    return next(error);
  } finally {
    connection.release();
  }
});

router.post('/restaurant-address-change-requests/:id/reject', async (req, res, next) => {
  const requestId = Number(req.params.id);
  const reason = String(req.body?.reason ?? '').trim();
  if (!Number.isInteger(requestId) || requestId <= 0) {
    return res.status(400).json({ error: 'ID yêu cầu không hợp lệ.' });
  }
  if (!reason) {
    return res.status(400).json({ error: 'Vui lòng nhập lý do từ chối.' });
  }
  if (reason.length > 500) {
    return res.status(400).json({ error: 'Lý do từ chối không được vượt quá 500 ký tự.' });
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [rows] = await connection.query(
      `SELECT acr.*, r.name AS restaurant_name, r.owner_user_id, u.full_name AS owner_name
       FROM restaurant_address_change_requests acr
       JOIN restaurants r ON r.id = acr.restaurant_id
       JOIN users u ON u.id = r.owner_user_id
       WHERE acr.id = ?
       LIMIT 1 FOR UPDATE`,
      [requestId],
    );
    const request = rows[0];
    if (!request) {
      await connection.rollback();
      return res.status(404).json({ error: 'Không tìm thấy yêu cầu đổi địa chỉ.' });
    }
    if (request.status !== 'pending') {
      await connection.rollback();
      return res.status(409).json({ error: 'Yêu cầu này không còn ở trạng thái chờ duyệt.' });
    }

    await connection.query(
      `UPDATE restaurant_address_change_requests
       SET status = 'rejected', reviewed_by_admin_id = ?, reviewed_at = NOW(), rejection_reason = ?
       WHERE id = ?`,
      [req.auth.userId, reason, request.id],
    );
    await logAudit(connection, {
      adminId: req.auth.userId,
      action: 'tu_choi_doi_dia_chi_quan',
      targetType: 'restaurant_address_change_request',
      targetId: request.id,
      metadata: { quanId: request.restaurant_id, tenQuan: request.restaurant_name, lyDo: reason },
    });
    await insertNotification(connection, {
      userId: request.owner_user_id,
      title: 'Yêu cầu đổi địa chỉ chưa được duyệt',
      body: `Yêu cầu đổi địa chỉ của quán "${request.restaurant_name}" chưa được duyệt. Lý do: ${reason}`,
      linkUrl: '/merchant/settings',
    });
    const [updatedRows] = await connection.query(
      `SELECT acr.*, r.name AS restaurant_name, u.full_name AS owner_name
       FROM restaurant_address_change_requests acr
       JOIN restaurants r ON r.id = acr.restaurant_id
       JOIN users u ON u.id = r.owner_user_id
       WHERE acr.id = ? LIMIT 1`,
      [request.id],
    );
    await connection.commit();
    return res.json({ request: serializeAddressChangeRequest(updatedRows[0]) });
  } catch (error) {
    await connection.rollback();
    return next(error);
  } finally {
    connection.release();
  }
});

router.get('/restaurants/:id', async (req, res, next) => {
  const restaurantId = Number(req.params.id);
  if (!Number.isInteger(restaurantId) || restaurantId <= 0) {
    return res.status(400).json({ error: 'ID nhà hàng không hợp lệ.' });
  }
  try {
    const [rows] = await pool.query(
      `SELECT r.*, u.full_name AS owner_name, u.email AS owner_email, c.name AS cuisine_name
       FROM restaurants r
       JOIN users u ON u.id = r.owner_user_id
       LEFT JOIN cuisines c ON c.id = r.cuisine_id
       WHERE r.id = ?
       LIMIT 1`,
      [restaurantId],
    );
    if (!rows.length) return res.status(404).json({ error: 'Không tìm thấy hồ sơ quán ăn.' });
    return res.json({ restaurant: serializeRestaurantRow(rows[0], { includeBankAccountNo: true }) });
  } catch (error) {
    return next(error);
  }
});

router.post('/restaurants/:id/approve', async (req, res, next) => {
  const restaurantId = Number(req.params.id);
  const adminId = req.auth.userId;

  if (!restaurantId) {
    return res.status(400).json({ error: 'ID nhà hàng không hợp lệ.' });
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [rows] = await conn.query(
      `SELECT r.*, u.full_name AS owner_name, u.email AS owner_email
       FROM restaurants r
       JOIN users u ON u.id = r.owner_user_id
       WHERE r.id = ? LIMIT 1`,
      [restaurantId],
    );
    const restaurant = rows[0];
    if (!restaurant) {
      await conn.rollback();
      return res.status(404).json({ error: 'Nhà hàng không tồn tại.' });
    }
    if (restaurant.status !== 'pending') {
      await conn.rollback();
      return res.status(400).json({ error: 'Chỉ có thể duyệt nhà hàng đang chờ xét duyệt.' });
    }
    if (!hasValidCoordinates(restaurant)) {
      await conn.rollback();
      return res.status(400).json({ error: 'Không thể duyệt quán khi địa chỉ chưa xác định được tọa độ hợp lệ.' });
    }

    await conn.query(
      `UPDATE restaurants
       SET status = 'active', approved_at = NOW(), approved_by_admin_id = ?, rejection_reason = NULL
       WHERE id = ?`,
      [adminId, restaurantId],
    );

    await conn.query(
      `UPDATE users
       SET status = 'active', primary_role = 'merchant'
       WHERE id = ?`,
      [restaurant.owner_user_id],
    );

    const [existingRole] = await conn.query(
      'SELECT 1 FROM user_roles WHERE user_id = ? AND role = ? LIMIT 1',
      [restaurant.owner_user_id, 'merchant'],
    );
    if (existingRole.length === 0) {
      await conn.query(
        'INSERT INTO user_roles (user_id, role) VALUES (?, ?)',
        [restaurant.owner_user_id, 'merchant'],
      );
    }

    await ensureWallet(conn, restaurant.owner_user_id, 'merchant');

    await logAudit(conn, {
      adminId,
      action: 'duyet_nha_hang',
      targetType: 'restaurant',
      targetId: restaurantId,
      metadata: {
        tenNhaHang: restaurant.name,
        chuSoHuuId: restaurant.owner_user_id,
      },
    });

    const title = 'Hồ sơ quán đã được duyệt';
    const body = `Quán "${restaurant.name}" đã được phê duyệt. Bạn có thể truy cập portal merchant ngay bây giờ.`;
    await insertNotification(conn, {
      userId: restaurant.owner_user_id,
      title,
      body,
      linkUrl: '/merchant',
    });

    await conn.commit();

    await sendKycApprovedEmailSafe({
      to: restaurant.owner_email,
      fullName: restaurant.owner_name,
      subjectKind: 'quán ăn',
      portalPath: '/merchant',
    });

    const [updated] = await pool.query(
      `SELECT r.*, u.full_name AS owner_name, u.email AS owner_email, c.name AS cuisine_name
       FROM restaurants r
       JOIN users u ON u.id = r.owner_user_id
       LEFT JOIN cuisines c ON c.id = r.cuisine_id
       WHERE r.id = ? LIMIT 1`,
      [restaurantId],
    );

    res.json({ ok: true, restaurant: serializeRestaurantRow(updated[0]) });
  } catch (err) {
    await conn.rollback();
    next(err);
  } finally {
    conn.release();
  }
});

router.post('/restaurants/:id/reject', async (req, res, next) => {
  const restaurantId = Number(req.params.id);
  const reason = String(req.body?.reason ?? '').trim();

  if (!restaurantId) {
    return res.status(400).json({ error: 'ID nhà hàng không hợp lệ.' });
  }
  if (!reason) {
    return res.status(400).json({ error: 'Vui lòng nhập lý do từ chối.' });
  }
  if (reason.length > 500) {
    return res.status(400).json({ error: 'Lý do từ chối không được vượt quá 500 ký tự.' });
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [rows] = await conn.query(
      `SELECT r.*, u.full_name AS owner_name, u.email AS owner_email
       FROM restaurants r
       JOIN users u ON u.id = r.owner_user_id
       WHERE r.id = ? LIMIT 1`,
      [restaurantId],
    );
    const restaurant = rows[0];
    if (!restaurant) {
      await conn.rollback();
      return res.status(404).json({ error: 'Nhà hàng không tồn tại.' });
    }
    if (restaurant.status !== 'pending') {
      await conn.rollback();
      return res.status(400).json({ error: 'Chỉ có thể từ chối nhà hàng đang chờ xét duyệt.' });
    }

    await conn.query(
      `UPDATE restaurants
       SET status = 'suspended', rejection_reason = ?, approved_at = NULL, approved_by_admin_id = NULL
       WHERE id = ?`,
      [reason, restaurantId],
    );

    await logAudit(conn, {
      adminId: req.auth.userId,
      action: 'tu_choi_nha_hang',
      targetType: 'restaurant',
      targetId: restaurantId,
      metadata: {
        tenNhaHang: restaurant.name,
        chuSoHuuId: restaurant.owner_user_id,
        lyDo: reason,
      },
    });

    const title = 'Hồ sơ quán chưa được chấp nhận';
    const body = `Hồ sơ quán "${restaurant.name}" chưa được chấp nhận. Lý do: ${reason}`;
    await insertNotification(conn, {
      userId: restaurant.owner_user_id,
      title,
      body,
      linkUrl: '/merchant/pending',
    });

    await conn.commit();

    await sendKycRejectedEmailSafe({
      to: restaurant.owner_email,
      fullName: restaurant.owner_name,
      subjectKind: 'quán ăn',
      reason,
      portalPath: '/merchant/onboarding',
    });

    const [updated] = await pool.query(
      `SELECT r.*, u.full_name AS owner_name, u.email AS owner_email, c.name AS cuisine_name
       FROM restaurants r
       JOIN users u ON u.id = r.owner_user_id
       LEFT JOIN cuisines c ON c.id = r.cuisine_id
       WHERE r.id = ? LIMIT 1`,
      [restaurantId],
    );

    res.json({ ok: true, restaurant: serializeRestaurantRow(updated[0]) });
  } catch (err) {
    await conn.rollback();
    next(err);
  } finally {
    conn.release();
  }
});

router.patch('/restaurants/:id/status', async (req, res, next) => {
  const restaurantId = Number(req.params.id);
  const { status, reason } = req.body || {};
  const adminId = req.auth.userId;

  if (!restaurantId || !['active', 'suspended'].includes(status)) {
    return res.status(400).json({ error: 'Trạng thái hoặc ID quán không hợp lệ.' });
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [rows] = await conn.query(
      `SELECT r.*, u.full_name AS owner_name, u.email AS owner_email
       FROM restaurants r
       JOIN users u ON u.id = r.owner_user_id
       WHERE r.id = ? LIMIT 1`,
      [restaurantId],
    );
    const restaurant = rows[0];
    if (!restaurant) {
      await conn.rollback();
      return res.status(404).json({ error: 'Không tìm thấy quán ăn.' });
    }

    if (status === 'suspended') {
      await conn.query(
        'UPDATE restaurants SET status = ?, rejection_reason = ? WHERE id = ?',
        ['suspended', reason?.trim() || 'Tạm khóa do vi phạm quy định', restaurantId],
      );
      await insertNotification(conn, {
        userId: restaurant.owner_user_id,
        title: 'Quán ăn đã bị tạm khóa',
        body: `Quán "${restaurant.name}" đã bị tạm khóa. Lý do: ${reason?.trim() || 'Vi phạm chính sách vận hành của nền tảng.'}`,
        linkUrl: '/merchant',
      });
      await logAudit(conn, {
        adminId,
        action: 'khoa_quan_an',
        targetType: 'restaurant',
        targetId: restaurantId,
        metadata: { tenNhaHang: restaurant.name, lyDo: reason },
      });
    } else if (status === 'active') {
      await conn.query(
        'UPDATE restaurants SET status = ?, rejection_reason = NULL WHERE id = ?',
        ['active', restaurantId],
      );
      await insertNotification(conn, {
        userId: restaurant.owner_user_id,
        title: 'Quán ăn đã được kích hoạt lại',
        body: `Quán "${restaurant.name}" đã được mở khóa và có thể tiếp tục nhận đơn hàng.`,
        linkUrl: '/merchant',
      });
      await logAudit(conn, {
        adminId,
        action: 'mo_khoa_quan_an',
        targetType: 'restaurant',
        targetId: restaurantId,
        metadata: { tenNhaHang: restaurant.name },
      });
    }

    await conn.commit();

    const [updated] = await pool.query(
      `SELECT r.*, u.full_name AS owner_name, u.email AS owner_email, c.name AS cuisine_name
       FROM restaurants r
       JOIN users u ON u.id = r.owner_user_id
       LEFT JOIN cuisines c ON c.id = r.cuisine_id
       WHERE r.id = ? LIMIT 1`,
      [restaurantId],
    );

    res.json({ ok: true, restaurant: serializeRestaurantRow(updated[0]) });
  } catch (err) {
    await conn.rollback();
    next(err);
  } finally {
    conn.release();
  }
});

async function sendKycApprovedEmailSafe(payload) {
  try {
    const { sendKycApprovedEmail } = await import('../lib/mail.js');
    await sendKycApprovedEmail(payload);
  } catch (err) {
    console.error('[mail] approve notification failed:', err.message);
  }
}

async function sendKycRejectedEmailSafe(payload) {
  try {
    const { sendKycRejectedEmail } = await import('../lib/mail.js');
    await sendKycRejectedEmail(payload);
  } catch (err) {
    console.error('[mail] reject notification failed:', err.message);
  }
}

// --- QUẢN LÝ ĐƠN HÀNG TOÀN HỆ THỐNG ---

router.get('/orders', async (req, res, next) => {
  try {
    const status = req.query.status;
    const paymentMethod = req.query.paymentMethod;
    const paymentStatus = req.query.paymentStatus;
    const q = req.query.q;
    const fromDate = req.query.fromDate ? String(req.query.fromDate).trim() : null;
    const toDate = req.query.toDate ? String(req.query.toDate).trim() : null;
    const date = req.query.date ? String(req.query.date).trim() : null;
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = req.query.limit ? Math.min(10000, Math.max(1, parseInt(req.query.limit, 10) || 10)) : 10;
    const offset = (page - 1) * limit;

    const filters = ['1 = 1'];
    const params = [];

    if (status && status !== 'all') {
      filters.push('o.status = ?');
      params.push(status);
    }

    if (paymentMethod && paymentMethod !== 'all') {
      filters.push('o.payment_method = ?');
      params.push(paymentMethod);
    }

    if (paymentStatus && paymentStatus !== 'all') {
      filters.push('o.payment_status = ?');
      params.push(paymentStatus);
    }

    if (fromDate) {
      filters.push('o.created_at >= ?');
      params.push(`${fromDate} 00:00:00`);
    }

    if (toDate) {
      filters.push('o.created_at <= ?');
      params.push(`${toDate} 23:59:59`);
    }

    if (date && !fromDate && !toDate) {
      filters.push('DATE(o.created_at) = ?');
      params.push(date);
    }

    if (q) {
      filters.push('(o.order_code LIKE ? OR u.email LIKE ? OR u.full_name LIKE ? OR r.name LIKE ?)');
      params.push(`%${q}%`, `%${q}%`, `%${q}%`, `%${q}%`);
    }

    const whereClause = filters.join(' AND ');

    const [countRows] = await pool.query(
      `SELECT COUNT(*) AS total 
       FROM orders o
       LEFT JOIN users u ON o.customer_id = u.id
       WHERE ${whereClause}`,
      params
    );
    const total = countRows[0]?.total ?? 0;

    const [rows] = await pool.query(
      `SELECT o.*, u.full_name AS customer_name, u.email AS customer_email, r.name AS restaurant_name
       FROM orders o
       LEFT JOIN users u ON o.customer_id = u.id
       LEFT JOIN restaurants r ON o.restaurant_id = r.id
       WHERE ${whereClause}
       ORDER BY o.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    res.json({
      items: rows,
      pagination: {
        page,
        limit,
        total
      }
    });
  } catch (err) {
    next(err);
  }
});

router.get('/orders/:id', async (req, res, next) => {
  try {
    const orderId = Number(req.params.id);
    if (!Number.isInteger(orderId) || orderId <= 0) {
      return res.status(400).json({ error: 'Invalid order ID.' });
    }

    const [orderRows] = await pool.query(
      'SELECT o.*, u.full_name AS customer_name, u.email AS customer_email, u.phone AS customer_phone, r.name AS restaurant_name FROM orders o LEFT JOIN users u ON u.id = o.customer_id LEFT JOIN restaurants r ON r.id = o.restaurant_id WHERE o.id = ? LIMIT 1',
      [orderId],
    );
    if (!orderRows.length) return res.status(404).json({ error: 'Order not found.' });

    const [itemsResult, logsResult, paymentsResult, refundsResult] = await Promise.all([
      pool.query('SELECT * FROM order_items WHERE order_id = ? ORDER BY id ASC', [orderId]),
      pool.query('SELECT * FROM order_status_logs WHERE order_id = ? ORDER BY created_at ASC, id ASC', [orderId]),
      pool.query('SELECT * FROM payments WHERE order_id = ? ORDER BY created_at DESC, id DESC', [orderId]),
      pool.query('SELECT * FROM payment_refunds WHERE order_id = ? ORDER BY created_at DESC, id DESC', [orderId]),
    ]);

    return res.json({
      order: {
        ...orderRows[0],
        items: itemsResult[0],
        statusLogs: logsResult[0],
        payments: paymentsResult[0],
        refunds: refundsResult[0],
      },
    });
  } catch (error) {
    return next(error);
  }
});

router.post('/orders/:id/shipping-status', async (req, res, next) => {
  const orderId = Number(req.params.id);
  const action = String(req.body?.action ?? '').trim();
  const transitions = {
    picked_up: { from: 'ready_for_pickup', note: 'Quản trị viên xác nhận tài xế đã lấy hàng.' },
    delivering: { from: 'picked_up', note: 'Quản trị viên cập nhật đơn đang giao.' },
  };
  const transition = transitions[action];

  if (!Number.isInteger(orderId) || orderId <= 0 || !transition) {
    return res.status(400).json({ error: 'Trạng thái giao hàng không hợp lệ.' });
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [rows] = await connection.query('SELECT * FROM orders WHERE id = ? FOR UPDATE', [orderId]);
    const order = rows[0];
    if (!order) {
      await connection.rollback();
      return res.status(404).json({ error: 'Không tìm thấy đơn hàng.' });
    }
    if (order.status !== transition.from) {
      await connection.rollback();
      return res.status(409).json({ error: 'Đơn hàng chưa ở trạng thái phù hợp để cập nhật bước giao vận này.' });
    }

    const timestampColumn = action === 'picked_up' ? 'picked_up_at' : 'delivering_at';
    await connection.query(
      `UPDATE orders SET status = ?, ${timestampColumn} = NOW(), updated_at = NOW() WHERE id = ?`,
      [action, order.id],
    );
    await connection.query(
      `INSERT INTO order_status_logs (order_id, from_status, to_status, changed_by_role, changed_by_user_id, note)
       VALUES (?, ?, ?, 'admin', ?, ?)`,
      [order.id, order.status, action, req.auth.userId, transition.note],
    );
    const message = action === 'picked_up'
      ? 'Tài xế đã lấy đơn ' + order.order_code + ' và sẽ giao đến bạn sớm.'
      : 'Đơn ' + order.order_code + ' đang được giao đến bạn.';
    await connection.query(
      `INSERT INTO notifications (user_id, type, title, body, link_url)
       VALUES (?, ?, ?, ?, ?)`,
      [order.customer_id, action === 'picked_up' ? 'order_picked_up' : 'order_delivering', action === 'picked_up' ? 'Tài xế đã lấy hàng' : 'Đơn hàng đang giao', message, '/app/track/' + order.order_code],
    );
    await logAudit(connection, {
      adminId: req.auth.userId,
      action: action === 'picked_up' ? 'xac_nhan_lay_hang' : 'cap_nhat_dang_giao',
      targetType: 'order',
      targetId: order.id,
      metadata: { maDonHang: order.order_code, tuTrangThai: order.status, denTrangThai: action },
    });
    await connection.commit();
    return res.json({ ok: true, status: action });
  } catch (error) {
    await connection.rollback();
    return next(error);
  } finally {
    connection.release();
  }
});

router.post('/orders/:id/cancel', async (req, res, next) => {
  const orderId = Number(req.params.id);
  const reason = String(req.body?.reason ?? '').trim().slice(0, 500)
    || 'Cancelled by an administrator.';
  if (!Number.isInteger(orderId) || orderId <= 0) {
    return res.status(400).json({ error: 'Invalid order ID.' });
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [orders] = await connection.query(
      'SELECT * FROM orders WHERE id = ? FOR UPDATE',
      [orderId],
    );
    const order = orders[0];
    if (!order) {
      await connection.rollback();
      return res.status(404).json({ error: 'Order not found.' });
    }
    if (!['placed', 'accepted', 'preparing', 'ready_for_pickup'].includes(order.status)) {
      await connection.rollback();
      return res.status(409).json({ error: 'Chỉ có thể hủy đơn đang chờ quán xử lý hoặc đang chuẩn bị.' });
    }

    let paymentStatus = order.payment_status;
    let refundResponse = null;
    if (order.payment_status === 'paid') {
      if (order.payment_method !== 'vnpay') {
        await connection.rollback();
        return res.status(409).json({ error: 'Đơn hàng thanh toán ngoài VNPay cần quy trình hoàn tiền thủ công.' });
      }

      const refundConfig = {
        tmnCode: process.env.VNPAY_TMN_CODE,
        secret: process.env.VNPAY_HASH_SECRET,
        apiUrl: process.env.VNPAY_API_URL,
      };
      const missing = Object.entries(refundConfig)
        .filter(([, value]) => !value)
        .map(([key]) => key);
      if (missing.length) {
        await connection.rollback();
        return res.status(503).json({ error: 'Hệ thống chưa cấu hình cổng hoàn tiền VNPay.', missing });
      }

      const [paymentRows] = await connection.query(
        "SELECT * FROM payments WHERE order_id = ? AND method = 'vnpay' AND status = 'succeeded' ORDER BY paid_at DESC, id DESC LIMIT 1 FOR UPDATE",
        [order.id],
      );
      const payment = paymentRows[0];
      if (!payment) {
        await connection.rollback();
        return res.status(409).json({ error: 'Không tìm thấy giao dịch VNPay thành công cho đơn hàng này.' });
      }

      const [activeRefundRows] = await connection.query(
        "SELECT * FROM payment_refunds WHERE payment_id = ? AND status IN ('initiated', 'succeeded') ORDER BY id DESC LIMIT 1 FOR UPDATE",
        [payment.id],
      );
      if (activeRefundRows.length) {
        await connection.rollback();
        return res.status(409).json({
          error: activeRefundRows[0].status === 'succeeded'
            ? 'Giao dịch này đã được hoàn tiền trước đó.'
            : 'Yêu cầu hoàn tiền đang được xử lý.',
        });
      }

      const requestId = ('RF-' + order.order_code + '-' + Date.now()).slice(0, 120);
      const [refundResult] = await connection.query(
        "INSERT INTO payment_refunds (payment_id, order_id, request_id, amount, status) VALUES (?, ?, ?, ?, 'initiated')",
        [payment.id, order.id, requestId, order.total_amount],
      );
      const payload = buildRefundPayload({
        secret: refundConfig.secret,
        tmnCode: refundConfig.tmnCode,
        requestId,
        txnRef: payment.gateway_reference || order.order_code,
        amount: order.total_amount,
        transactionNo: payment.gateway_txn_id,
        transactionDate: formatVnpayDate(new Date(payment.gateway_created_at || payment.paid_at || payment.created_at)),
        createBy: req.auth.userId,
        ipAddress: String(req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1')
          .split(',')[0].trim().replace(/^::ffff:/, ''),
        orderInfo: 'Hoan tien don hang ' + order.order_code,
      });

      let refundFailure = null;
      try {
        const gatewayResult = await fetch(refundConfig.apiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          signal: AbortSignal.timeout(10000),
        });
        const rawText = await gatewayResult.text();
        try {
          refundResponse = JSON.parse(rawText);
        } catch {
          refundResponse = { rawText: rawText.slice(0, 2000) };
        }
        const signatureValid = verifyRefundResponse(refundResponse, refundConfig.secret);
        const gatewaySucceeded = gatewayResult.ok
          && signatureValid
          && refundResponse.vnp_ResponseCode === '00'
          && refundResponse.vnp_TransactionStatus === '00';
        if (!gatewaySucceeded) {
          refundFailure = signatureValid
            ? String(refundResponse.vnp_Message || refundResponse.vnp_ResponseCode || 'Cổng VNPay từ chối yêu cầu hoàn tiền.')
            : 'Chữ ký phản hồi từ VNPay không hợp lệ.';
        }
      } catch (error) {
        refundFailure = error.name === 'TimeoutError'
          ? 'Yêu cầu hoàn tiền VNPay đã hết thời gian chờ (timeout).'
          : 'Yêu cầu hoàn tiền VNPay thất bại: ' + error.message;
        refundResponse = { error: refundFailure };
      }

      if (refundFailure) {
        await connection.query(
          "UPDATE payment_refunds SET status = 'failed', failure_reason = ?, raw_response = ?, completed_at = NOW() WHERE id = ?",
          [refundFailure.slice(0, 500), JSON.stringify(refundResponse), refundResult.insertId],
        );
        await connection.commit();
        return res.status(502).json({
          error: 'Cổng thanh toán không xác nhận hoàn tiền. Đơn hàng chưa bị hủy.',
          reason: refundFailure,
        });
      }

      await connection.query(
        "UPDATE payment_refunds SET status = 'succeeded', gateway_txn_id = ?, raw_response = ?, completed_at = NOW() WHERE id = ?",
        [refundResponse.vnp_TransactionNo || null, JSON.stringify(refundResponse), refundResult.insertId],
      );
      paymentStatus = 'refunded';
    }

    await connection.query(
      "UPDATE orders SET status = 'cancelled', cancelled_by_role = 'admin', cancel_reason = ?, cancelled_at = NOW(), payment_status = ? WHERE id = ?",
      [reason, paymentStatus, order.id],
    );
    await connection.query(
      "UPDATE payments SET status = 'cancelled', failure_reason = 'Order cancelled by admin' WHERE order_id = ? AND status IN ('initiated', 'pending')",
      [order.id],
    );
    await connection.query(
      "UPDATE voucher_redemptions SET status = 'released', released_at = NOW() WHERE order_id = ? AND status IN ('reserved', 'redeemed')",
      [order.id],
    );
    await connection.query(
      "INSERT INTO order_status_logs (order_id, from_status, to_status, changed_by_role, changed_by_user_id, note) VALUES (?, ?, 'cancelled', 'admin', ?, ?)",
      [order.id, order.status, req.auth.userId, reason],
    );
    await connection.query(
      "INSERT INTO notifications (user_id, type, title, body, link_url) VALUES (?, 'order_cancelled', ?, ?, '/app/orders')",
      [
        order.customer_id,
        `Đơn hàng ${order.order_code} đã bị hủy`,
        `Đơn hàng ${order.order_code} đã bị quản trị viên hủy. Lý do: ${reason}`,
      ],
    );

    const [restaurantRows] = await connection.query(
      'SELECT owner_user_id, name FROM restaurants WHERE id = ? LIMIT 1',
      [order.restaurant_id],
    );
    if (restaurantRows[0]?.owner_user_id) {
      await connection.query(
        "INSERT INTO notifications (user_id, type, title, body, link_url) VALUES (?, 'order_cancelled', ?, ?, '/merchant/orders')",
        [
          restaurantRows[0].owner_user_id,
          `Đơn hàng ${order.order_code} đã bị hủy`,
          `Đơn hàng ${order.order_code} đã bị quản trị viên hủy. Lý do: ${reason}`,
        ],
      );
    }

    await logAudit(connection, {
      adminId: req.auth.userId,
      action: 'huy_don_hang',
      targetType: 'order',
      targetId: order.id,
      metadata: {
        maDonHang: order.order_code,
        lyDo: reason,
        khachHangId: order.customer_id,
        nhaHangId: order.restaurant_id,
        tongTien: Number(order.total_amount),
      },
    });

    await connection.commit();
    const [updatedOrders] = await pool.query(
      'SELECT * FROM orders WHERE id = ? LIMIT 1',
      [order.id],
    );
    return res.json({
      ok: true,
      order: updatedOrders[0],
      refund: refundResponse
        ? { status: 'succeeded', transactionNo: refundResponse.vnp_TransactionNo || null }
        : null,
    });
  } catch (error) {
    await connection.rollback();
    return next(error);
  } finally {
    connection.release();
  }
});

// --- KIEM DUYET DANH GIA ---

router.get('/reviews', async (req, res, next) => {
  try {
    const { hidden, page, q } = req.query;
    const ratingMax = req.query.ratingMax === undefined ? null : Number(req.query.ratingMax);
    const pageVal = Math.max(1, parseInt(page, 10) || 1);
    const limit = 10;
    const offset = (pageVal - 1) * limit;

    let whereSql = '1 = 1';
    const params = [];

    if (hidden === 'true' || hidden === '1') {
      whereSql += ' AND rv.is_hidden = 1';
    } else if (hidden === 'false' || hidden === '0') {
      whereSql += ' AND rv.is_hidden = 0';
    }

    if (ratingMax !== null) {
      if (!Number.isInteger(ratingMax) || ratingMax < 1 || ratingMax > 5) {
        return res.status(400).json({ error: 'ratingMax must be an integer from 1 to 5.' });
      }
      whereSql += ' AND rv.rating <= ?';
      params.push(ratingMax);
    }
    const search = String(q ?? '').trim();
    if (search) {
      whereSql += ' AND (rv.comment LIKE ? OR u.full_name LIKE ? OR r.name LIKE ? OR o.order_code LIKE ?)';
      const needle = '%' + search + '%';
      params.push(needle, needle, needle, needle);
    }

    const [countRows] = await pool.query(
      `SELECT COUNT(*) as total
       FROM reviews rv
       LEFT JOIN users u ON rv.customer_id = u.id
       LEFT JOIN restaurants r ON rv.restaurant_id = r.id
       LEFT JOIN orders o ON rv.order_id = o.id
       WHERE ${whereSql}`,
      params
    );
    const total = countRows[0]?.total ?? 0;

    const [rows] = await pool.query(
      `SELECT rv.*, u.full_name AS customer_name, u.avatar_url AS customer_avatar, r.name AS restaurant_name, o.order_code
       FROM reviews rv
       LEFT JOIN users u ON rv.customer_id = u.id
       LEFT JOIN restaurants r ON rv.restaurant_id = r.id
       LEFT JOIN orders o ON rv.order_id = o.id
       WHERE ${whereSql}
       ORDER BY rv.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    res.json({
      items: rows,
      pagination: {
        page: pageVal,
        limit,
        total
      }
    });
  } catch (err) {
    next(err);
  }
});

router.patch('/reviews/:id', async (req, res, next) => {
  const connection = await pool.getConnection();
  try {
    const id = Number(req.params.id);
    const { isHidden } = req.body;

    if (isNaN(id)) {
      return res.status(400).json({ error: 'ID đánh giá không hợp lệ' });
    }

    if (isHidden === undefined) {
      return res.status(400).json({ error: 'Thiếu trường isHidden' });
    }

    await connection.beginTransaction();

    const [reviews] = await connection.query(
      'SELECT restaurant_id, menu_item_id FROM reviews WHERE id = ? FOR UPDATE',
      [id]
    );

    if (reviews.length === 0) {
      await connection.rollback();
      return res.status(404).json({ error: 'Không tìm thấy đánh giá' });
    }

    const { restaurant_id, menu_item_id } = reviews[0];

    await connection.query(
      'UPDATE reviews SET is_hidden = ? WHERE id = ?',
      [isHidden ? 1 : 0, id]
    );

    await refreshReviewStats(connection, {
      restaurantId: restaurant_id,
      menuItemIds: menu_item_id ? [menu_item_id] : [],
    });

    await connection.commit();
    res.json({ ok: true, isHidden: Boolean(isHidden) });
  } catch (err) {
    await connection.rollback();
    next(err);
  } finally {
    connection.release();
  }
});

router.get('/audit-logs', async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const offset = (page - 1) * limit;

    const filters = ['1 = 1'];
    const params = [];

    if (req.query.action && req.query.action !== 'all') {
      filters.push('al.action = ?');
      params.push(String(req.query.action));
    }
    if (req.query.targetType && req.query.targetType !== 'all') {
      filters.push('al.target_type = ?');
      params.push(String(req.query.targetType));
    }
    if (req.query.q) {
      filters.push('(u.full_name LIKE ? OR al.action LIKE ? OR al.target_type LIKE ? OR al.target_id LIKE ?)');
      const needle = `%${req.query.q}%`;
      params.push(needle, needle, needle, needle);
    }

    const where = filters.join(' AND ');

    const [[count]] = await pool.query(
      `SELECT COUNT(*) AS total
       FROM audit_logs al
       LEFT JOIN users u ON u.id = al.admin_id
       WHERE ${where}`,
      params
    );

    const [rows] = await pool.query(
      `SELECT al.*, u.full_name AS admin_name, u.email AS admin_email
       FROM audit_logs al
       LEFT JOIN users u ON u.id = al.admin_id
       WHERE ${where}
       ORDER BY al.created_at DESC, al.id DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    res.json({
      items: rows.map((row) => ({
        id: Number(row.id),
        adminId: Number(row.admin_id),
        adminName: row.admin_name || 'Hệ thống',
        adminEmail: row.admin_email || '',
        action: row.action,
        targetType: row.target_type,
        targetId: row.target_id,
        metadata: row.metadata,
        createdAt: row.created_at,
      })),
      pagination: {
        page,
        limit,
        total: Number(count.total),
        totalPages: Math.ceil(Number(count.total) / limit),
      }
    });
  } catch (err) {
    next(err);
  }
});

// --- QUAN LY VOUCHER / KHUYEN MAI CHO ADMIN ---

router.get('/vouchers', async (req, res, next) => {
  try {
    const { q, status, scope, discountType, isPublic, sortBy } = req.query;
    let whereConditions = ['1=1'];
    let params = [];

    if (q) {
      whereConditions.push('(v.code LIKE ? OR v.name LIKE ? OR r.name LIKE ?)');
      const pattern = `%${q.trim()}%`;
      params.push(pattern, pattern, pattern);
    }
    if (status && status !== 'all') {
      if (status === 'expired') {
        whereConditions.push('v.ends_at < NOW()');
      } else {
        whereConditions.push('v.status = ?');
        params.push(status);
      }
    }
    if (discountType && discountType !== 'all') {
      whereConditions.push('v.discount_type = ?');
      params.push(discountType);
    }
    if (isPublic && isPublic !== 'all') {
      whereConditions.push('v.is_public = ?');
      params.push(isPublic === 'public' ? 1 : 0);
    }
    if (scope === 'platform') {
      whereConditions.push('v.restaurant_id IS NULL');
    } else if (scope === 'merchant') {
      whereConditions.push('v.restaurant_id IS NOT NULL');
    }

    let orderClause = 'v.created_at DESC, v.id DESC';
    if (sortBy === 'expiring_soon') {
      orderClause = 'v.ends_at ASC, v.id DESC';
    } else if (sortBy === 'discount_high') {
      orderClause = "(CASE WHEN v.discount_type = 'percent' THEN v.discount_value * 1000 ELSE v.discount_value END) DESC, v.id DESC";
    } else if (sortBy === 'min_order_low') {
      orderClause = 'v.min_order_amount ASC, v.id DESC';
    }

    const where = whereConditions.join(' AND ');
    const [rows] = await pool.query(
      `SELECT v.*, r.name AS restaurant_name, u.full_name AS creator_name,
              COALESCE((
                SELECT COUNT(*)
                FROM voucher_redemptions vr
                WHERE vr.voucher_id = v.id AND vr.status IN ('reserved', 'redeemed')
              ), 0) AS used_count
       FROM vouchers v
       LEFT JOIN restaurants r ON r.id = v.restaurant_id
       LEFT JOIN users u ON u.id = v.created_by_user_id
       WHERE ${where}
       ORDER BY ${orderClause}`,
      params
    );

    const now = new Date();
    res.json({
      vouchers: rows.map((v) => ({
        id: Number(v.id),
        restaurantId: v.restaurant_id === null ? null : Number(v.restaurant_id),
        restaurantName: v.restaurant_name ?? null,
        createdByUserId: Number(v.created_by_user_id),
        creatorName: v.creator_name ?? null,
        code: v.code,
        name: v.name,
        description: v.description ?? null,
        discountType: v.discount_type,
        discountValue: Number(v.discount_value),
        maxDiscountAmount: v.max_discount_amount === null ? null : Number(v.max_discount_amount),
        minOrderAmount: Number(v.min_order_amount ?? 0),
        usageLimit: v.usage_limit === null ? null : Number(v.usage_limit),
        usedCount: Number(v.used_count || 0),
        perUserLimit: Number(v.per_user_limit ?? 1),
        isPublic: Boolean(v.is_public ?? 1),
        startsAt: v.starts_at,
        endsAt: v.ends_at,
        status: v.status,
        isExpired: new Date(v.ends_at) < now,
        createdAt: v.created_at,
        updatedAt: v.updated_at,
      })),
    });
  } catch (err) {
    next(err);
  }
});

router.post('/vouchers', async (req, res, next) => {
  try {
    const {
      code,
      name,
      description,
      discountType,
      discountValue,
      maxDiscountAmount,
      minOrderAmount,
      usageLimit,
      perUserLimit,
      isPublic,
      restaurantId,
      startsAt,
      endsAt,
      status,
    } = req.body || {};

    const normalizedCode = String(code ?? '').trim().toUpperCase();
    if (!normalizedCode || normalizedCode.length < 3 || normalizedCode.length > 40) {
      return res.status(400).json({ error: 'Mã voucher phải từ 3 đến 40 ký tự.' });
    }
    if (!name || String(name).trim().length < 3) {
      return res.status(400).json({ error: 'Tên voucher phải từ 3 ký tự trở lên.' });
    }

    const [duplicateRows] = await pool.query(
      'SELECT id FROM vouchers WHERE code = ? LIMIT 1',
      [normalizedCode]
    );
    if (duplicateRows.length > 0) {
      return res.status(409).json({ error: 'Mã voucher đã tồn tại trên hệ thống.' });
    }

    const [result] = await pool.query(
      `INSERT INTO vouchers (
        restaurant_id, created_by_user_id, code, name, description,
        discount_type, discount_value, max_discount_amount, min_order_amount,
        usage_limit, per_user_limit, is_public, starts_at, ends_at, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        null, // Admin chỉ tạo voucher toàn sàn (restaurant_id = NULL)
        req.auth.userId,
        normalizedCode,
        String(name).trim(),
        description ? String(description).trim() : null,
        discountType === 'fixed' ? 'fixed' : 'percent',
        Number(discountValue) || 0,
        maxDiscountAmount ? Number(maxDiscountAmount) : null,
        Number(minOrderAmount) || 0,
        usageLimit ? Number(usageLimit) : null,
        Number(perUserLimit) || 1,
        isPublic === false || isPublic === 0 ? 0 : 1,
        startsAt ? new Date(startsAt) : new Date(),
        endsAt ? new Date(endsAt) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        status || 'active',
      ]
    );

    const [rows] = await pool.query('SELECT * FROM vouchers WHERE id = ? LIMIT 1', [result.insertId]);
    res.status(201).json({ voucher: rows[0] });
  } catch (err) {
    next(err);
  }
});

router.patch('/vouchers/:id', async (req, res, next) => {
  try {
    const voucherId = Number(req.params.id);
    if (!voucherId) return res.status(400).json({ error: 'ID voucher không hợp lệ.' });

    const [existingRows] = await pool.query('SELECT * FROM vouchers WHERE id = ? LIMIT 1', [voucherId]);
    const current = existingRows[0];
    if (!current) return res.status(404).json({ error: 'Không tìm thấy voucher.' });

    const {
      code,
      name,
      description,
      discountType,
      discountValue,
      maxDiscountAmount,
      minOrderAmount,
      usageLimit,
      perUserLimit,
      isPublic,
      restaurantId,
      startsAt,
      endsAt,
      status,
    } = req.body || {};

    const nextCode = code ? String(code).trim().toUpperCase() : current.code;
    if (nextCode !== current.code) {
      const [duplicateRows] = await pool.query(
        'SELECT id FROM vouchers WHERE code = ? AND id <> ? LIMIT 1',
        [nextCode, voucherId]
      );
      if (duplicateRows.length > 0) {
        return res.status(409).json({ error: 'Mã voucher đã tồn tại.' });
      }
    }

    await pool.query(
      `UPDATE vouchers SET
        code = ?, name = ?, description = ?, discount_type = ?, discount_value = ?,
        max_discount_amount = ?, min_order_amount = ?, usage_limit = ?, per_user_limit = ?,
        is_public = ?, restaurant_id = ?, starts_at = ?, ends_at = ?, status = ?
       WHERE id = ?`,
      [
        nextCode,
        name !== undefined ? String(name).trim() : current.name,
        description !== undefined ? (description ? String(description).trim() : null) : current.description,
        discountType !== undefined ? discountType : current.discount_type,
        discountValue !== undefined ? Number(discountValue) : current.discount_value,
        maxDiscountAmount !== undefined ? (maxDiscountAmount ? Number(maxDiscountAmount) : null) : current.max_discount_amount,
        minOrderAmount !== undefined ? Number(minOrderAmount) : current.min_order_amount,
        usageLimit !== undefined ? (usageLimit ? Number(usageLimit) : null) : current.usage_limit,
        perUserLimit !== undefined ? Number(perUserLimit) : current.per_user_limit,
        isPublic !== undefined ? (isPublic === false || isPublic === 0 ? 0 : 1) : current.is_public,
        current.restaurant_id,
        startsAt ? new Date(startsAt) : current.starts_at,
        endsAt ? new Date(endsAt) : current.ends_at,
        status !== undefined ? status : current.status,
        voucherId,
      ]
    );

    const [rows] = await pool.query('SELECT * FROM vouchers WHERE id = ? LIMIT 1', [voucherId]);
    res.json({ voucher: rows[0] });
  } catch (err) {
    next(err);
  }
});

router.delete('/vouchers/:id', async (req, res, next) => {
  try {
    const voucherId = Number(req.params.id);
    if (!voucherId) return res.status(400).json({ error: 'ID voucher không hợp lệ.' });

    const [[redemptionCount]] = await pool.query(
      'SELECT COUNT(*) AS total FROM voucher_redemptions WHERE voucher_id = ?',
      [voucherId]
    );

    if (Number(redemptionCount?.total) > 0) {
      // Đã có đơn hàng sử dụng -> Tạm dừng thay vì xóa cứng để bảo toàn báo cáo
      await pool.query("UPDATE vouchers SET status = 'paused' WHERE id = ?", [voucherId]);
      return res.json({ success: true, message: 'Voucher đã được chuyển sang trạng thái Tạm dừng do đã phát sinh đơn hàng.' });
    }

    await pool.query('DELETE FROM customer_saved_vouchers WHERE voucher_id = ?', [voucherId]);
    await pool.query('DELETE FROM vouchers WHERE id = ?', [voucherId]);
    res.json({ success: true, message: 'Đã xóa voucher thành công.' });
  } catch (err) {
    next(err);
  }
});

export default router;
