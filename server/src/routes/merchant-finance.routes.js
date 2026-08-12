import { Router } from 'express';
import pool from '../db/pool.js';
import { requireAuth } from '../middleware/auth.js';
import { maskBankAccount, validatePayoutRequest } from '../lib/payout.js';
import { createGhnClient, GhnProviderError } from '../lib/ghn.js';
import {
  serializeAddressChangeRequest,
  validateAddressChangePayload,
} from '../lib/restaurantAddressChanges.js';

const router = Router();
router.use(requireAuth);
router.use((req, res, next) => {
  if ((req.auth.roles || []).includes('merchant')) return next();
  return res.status(403).json({ error: 'Merchant access is required.' });
});

async function loadRestaurant(conn, userId, lock = false) {
  const [rows] = await conn.query(
    'SELECT * FROM restaurants WHERE owner_user_id = ? LIMIT 1' + (lock ? ' FOR UPDATE' : ''),
    [userId],
  );
  return rows[0] || null;
}

async function loadLatestAddressChangeRequest(conn, restaurantId) {
  const [rows] = await conn.query(
    `SELECT *
     FROM restaurant_address_change_requests
     WHERE restaurant_id = ?
     ORDER BY (status = 'pending') DESC, created_at DESC, id DESC
     LIMIT 1`,
    [restaurantId],
  );
  return rows[0] || null;
}

function getGhnClient() {
  return createGhnClient({
    token: process.env.GHN_TOKEN,
    shopId: process.env.GHN_SHOP_ID,
    baseUrl: process.env.GHN_API_BASE_URL ?? 'https://online-gateway.ghn.vn/shiip/public-api',
  });
}

function positiveInteger(value) {
  const number = Number(value);
  return Number.isInteger(number) && number > 0 ? number : null;
}

function respondGhnError(res, error) {
  if (error instanceof GhnProviderError || String(error?.code ?? '').startsWith('GHN_')) {
    return res.status(502).json({ error: error.message, code: error.code ?? 'GHN_PROVIDER_ERROR' });
  }
  throw error;
}

function invalidGhnAddressError() {
  const error = new Error('Địa bàn GHN không hợp lệ hoặc không thuộc cùng một tuyến địa chỉ.');
  error.status = 400;
  return error;
}

async function validateGhnAddressSelection(address) {
  const ghnClient = getGhnClient();
  const [provinces, districts, wards] = await Promise.all([
    ghnClient.getProvinces(),
    ghnClient.getDistricts(address.ghnProvinceId),
    ghnClient.getWards(address.ghnDistrictId),
  ]);
  const province = (provinces ?? []).find((item) => Number(item.ProvinceID) === address.ghnProvinceId);
  const district = (districts ?? []).find((item) => Number(item.DistrictID) === address.ghnDistrictId);
  const ward = (wards ?? []).find((item) => String(item.WardCode) === address.ghnWardCode);
  if (!province || !district || !ward || Number(district.ProvinceID) !== address.ghnProvinceId
    || Number(ward.DistrictID) !== address.ghnDistrictId) {
    throw invalidGhnAddressError();
  }
  return {
    ...address,
    city: province.ProvinceName,
    district: district.DistrictName,
    ward: ward.WardName,
  };
}

async function ensureMerchantWallet(conn, userId) {
  await conn.query(
    "INSERT INTO wallets (user_id, owner_type) VALUES (?, 'merchant') ON DUPLICATE KEY UPDATE id = LAST_INSERT_ID(id)",
    [userId],
  );
  const [rows] = await conn.query(
    "SELECT * FROM wallets WHERE user_id = ? AND owner_type = 'merchant' LIMIT 1 FOR UPDATE",
    [userId],
  );
  return rows[0];
}

function serializePayout(row) {
  return {
    id: Number(row.id),
    code: 'PYT-' + String(row.id).padStart(4, '0'),
    amount: Number(row.amount),
    status: row.status,
    bankName: row.bank_name,
    bankAccountMasked: maskBankAccount(row.bank_account_no),
    bankAccountHolder: row.bank_account_holder,
    requestedAt: row.requested_at,
    reviewedAt: row.reviewed_at,
    completedAt: row.completed_at,
    rejectReason: row.reject_reason,
    externalRef: row.external_ref,
  };
}

function serializeSettings(row) {
  return {
    id: Number(row.id),
    name: row.name,
    slug: row.slug,
    phone: row.phone || '',
    tagline: row.tagline || '',
    description: row.description || '',
    addressLine: row.address_line,
    ward: row.ward || '',
    district: row.district || '',
    city: row.city,
    ghnProvinceId: row.ghn_province_id === null ? null : Number(row.ghn_province_id),
    ghnDistrictId: row.ghn_district_id === null ? null : Number(row.ghn_district_id),
    ghnWardCode: row.ghn_ward_code ?? null,
    baseDeliveryFee: Number(row.base_delivery_fee),
    minOrderAmount: Number(row.min_order_amount),
    avgPrepTimeMin: Number(row.avg_prep_time_min),
    commissionRate: Number(row.commission_rate),
    isOpenNow: Boolean(row.is_open_now),
    bankAccountNo: row.bank_account_no || '',
    bankName: row.bank_name || '',
    bankAccountHolder: row.bank_account_holder || '',
  };
}

router.get('/wallet', async (req, res, next) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const restaurant = await loadRestaurant(connection, req.auth.userId);
    if (!restaurant) {
      await connection.rollback();
      return res.status(404).json({ error: 'Merchant restaurant not found.' });
    }
    const wallet = await ensureMerchantWallet(connection, req.auth.userId);
    const [[reservedRow]] = await connection.query(
      "SELECT COALESCE(SUM(amount), 0) AS reserved FROM payout_requests WHERE wallet_id = ? AND status IN ('pending', 'approved')",
      [wallet.id],
    );
    const reserved = Number(reservedRow.reserved);
    if (Number(wallet.pending_balance) !== reserved) {
      await connection.query('UPDATE wallets SET pending_balance = ? WHERE id = ?', [reserved, wallet.id]);
      wallet.pending_balance = reserved;
    }
    const [transactions] = await connection.query(
      'SELECT * FROM wallet_transactions WHERE wallet_id = ? ORDER BY created_at DESC, id DESC LIMIT 50',
      [wallet.id],
    );
    const [payouts] = await connection.query(
      'SELECT * FROM payout_requests WHERE wallet_id = ? ORDER BY requested_at DESC, id DESC LIMIT 50',
      [wallet.id],
    );
    const [[today]] = await connection.query(
      "SELECT COUNT(*) AS deliveredOrders, COALESCE(SUM(merchant_earning), 0) AS merchantRevenue FROM orders WHERE restaurant_id = ? AND status = 'delivered' AND delivered_at >= CURDATE()",
      [restaurant.id],
    );
    const [[month]] = await connection.query(
      "SELECT COUNT(*) AS payoutCount, COALESCE(SUM(amount), 0) AS withdrawn FROM payout_requests WHERE wallet_id = ? AND status = 'completed' AND completed_at >= DATE_FORMAT(CURDATE(), '%Y-%m-01')",
      [wallet.id],
    );
    const [[config]] = await connection.query(
      "SELECT config_value FROM platform_config WHERE config_key = 'min_payout_amount' LIMIT 1",
    );
    await connection.commit();
    return res.json({
      wallet: {
        id: Number(wallet.id),
        balance: Number(wallet.balance),
        pendingBalance: reserved,
        availableBalance: Math.max(0, Number(wallet.balance) - reserved),
        totalEarned: Number(wallet.total_earned),
        totalWithdrawn: Number(wallet.total_withdrawn),
        isLocked: Boolean(wallet.is_locked),
      },
      settings: {
        commissionRate: Number(restaurant.commission_rate),
        minPayoutAmount: Number(config?.config_value || 100000),
        bankName: restaurant.bank_name || null,
        bankAccountMasked: maskBankAccount(restaurant.bank_account_no),
        bankConfigured: Boolean(restaurant.bank_account_no && restaurant.bank_name && restaurant.bank_account_holder),
      },
      stats: {
        todayRevenue: Number(today.merchantRevenue),
        deliveredOrdersToday: Number(today.deliveredOrders),
        withdrawnThisMonth: Number(month.withdrawn),
        payoutCountThisMonth: Number(month.payoutCount),
      },
      transactions: transactions.map((row) => ({
        id: Number(row.id),
        direction: row.direction,
        amount: Number(row.amount),
        balanceAfter: Number(row.balance_after),
        type: row.tx_type,
        referenceType: row.reference_type,
        referenceId: row.reference_id === null ? null : Number(row.reference_id),
        description: row.description,
        createdAt: row.created_at,
      })),
      payouts: payouts.map(serializePayout),
    });
  } catch (error) {
    await connection.rollback();
    return next(error);
  } finally {
    connection.release();
  }
});

router.post('/payouts', async (req, res, next) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const restaurant = await loadRestaurant(connection, req.auth.userId, true);
    if (!restaurant) {
      await connection.rollback();
      return res.status(404).json({ error: 'Merchant restaurant not found.' });
    }
    if (!restaurant.bank_account_no || !restaurant.bank_name || !restaurant.bank_account_holder) {
      await connection.rollback();
      return res.status(409).json({ error: 'Configure a complete payout bank account before requesting a payout.' });
    }
    const wallet = await ensureMerchantWallet(connection, req.auth.userId);
    const [openPayouts] = await connection.query(
      "SELECT id, amount FROM payout_requests WHERE wallet_id = ? AND status IN ('pending', 'approved') FOR UPDATE",
      [wallet.id],
    );
    const reserved = openPayouts.reduce((total, payout) => total + Number(payout.amount), 0);
    if (Number(wallet.pending_balance) !== reserved) {
      await connection.query('UPDATE wallets SET pending_balance = ? WHERE id = ?', [reserved, wallet.id]);
    }
    const [[config]] = await connection.query(
      "SELECT config_value FROM platform_config WHERE config_key = 'min_payout_amount' LIMIT 1 FOR UPDATE",
    );
    const validation = validatePayoutRequest({
      amount: req.body?.amount,
      balance: Number(wallet.balance),
      pendingBalance: reserved,
      minAmount: Number(config?.config_value || 100000),
      isLocked: Boolean(wallet.is_locked),
    });
    if (!validation.ok) {
      await connection.rollback();
      return res.status(400).json({ error: 'Payout request is not valid.', reason: validation.reason, minAmount: validation.minAmount, availableBalance: validation.availableBalance });
    }
    const [result] = await connection.query(
      "INSERT INTO payout_requests (wallet_id, user_id, amount, bank_account_no, bank_name, bank_account_holder, status) VALUES (?, ?, ?, ?, ?, ?, 'pending')",
      [wallet.id, req.auth.userId, validation.amount, restaurant.bank_account_no, restaurant.bank_name, restaurant.bank_account_holder],
    );
    await connection.query('UPDATE wallets SET pending_balance = pending_balance + ? WHERE id = ?', [validation.amount, wallet.id]);
    await connection.query(
      "INSERT INTO notifications (user_id, type, title, body, link_url) VALUES (?, 'payout_status', 'Payout request received', ?, '/merchant/wallet')",
      [req.auth.userId, 'Your payout request for ' + validation.amount + ' VND is waiting for review.'],
    );
    const [rows] = await connection.query('SELECT * FROM payout_requests WHERE id = ?', [result.insertId]);
    await connection.commit();
    return res.status(201).json({ payout: serializePayout(rows[0]) });
  } catch (error) {
    await connection.rollback();
    return next(error);
  } finally {
    connection.release();
  }
});

router.get('/settings', async (req, res, next) => {
  try {
    const restaurant = await loadRestaurant(pool, req.auth.userId);
    if (!restaurant) return res.status(404).json({ error: 'Merchant restaurant not found.' });
    const addressChangeRequest = await loadLatestAddressChangeRequest(pool, restaurant.id);
    return res.json({
      restaurant: serializeSettings(restaurant),
      addressChangeRequest: serializeAddressChangeRequest(addressChangeRequest),
    });
  } catch (error) {
    return next(error);
  }
});

router.get('/ghn/provinces', async (_req, res, next) => {
  try {
    const rows = await getGhnClient().getProvinces();
    return res.json((rows ?? []).map((item) => ({ id: item.ProvinceID, name: item.ProvinceName })));
  } catch (error) {
    try { return respondGhnError(res, error); } catch (unexpected) { return next(unexpected); }
  }
});

router.get('/ghn/districts', async (req, res, next) => {
  const provinceId = positiveInteger(req.query.provinceId);
  if (!provinceId) return res.status(400).json({ error: 'provinceId phải là số dương.' });
  try {
    const rows = await getGhnClient().getDistricts(provinceId);
    return res.json((rows ?? []).map((item) => ({ id: item.DistrictID, name: item.DistrictName, provinceId: item.ProvinceID })));
  } catch (error) {
    try { return respondGhnError(res, error); } catch (unexpected) { return next(unexpected); }
  }
});

router.get('/ghn/wards', async (req, res, next) => {
  const districtId = positiveInteger(req.query.districtId);
  if (!districtId) return res.status(400).json({ error: 'districtId phải là số dương.' });
  try {
    const rows = await getGhnClient().getWards(districtId);
    return res.json((rows ?? []).map((item) => ({ code: item.WardCode, name: item.WardName, districtId: item.DistrictID })));
  } catch (error) {
    try { return respondGhnError(res, error); } catch (unexpected) { return next(unexpected); }
  }
});

router.post('/address-change-requests', async (req, res, next) => {
  const connection = await pool.getConnection();
  try {
    const proposedAddress = await validateGhnAddressSelection(validateAddressChangePayload(req.body));
    await connection.beginTransaction();
    const restaurant = await loadRestaurant(connection, req.auth.userId, true);
    if (!restaurant) {
      await connection.rollback();
      return res.status(404).json({ error: 'Không tìm thấy quán của bạn.' });
    }

    const currentAddress = {
      addressLine: restaurant.address_line,
      ward: restaurant.ward || '',
      district: restaurant.district || '',
      city: restaurant.city,
      ghnProvinceId: restaurant.ghn_province_id === null ? null : Number(restaurant.ghn_province_id),
      ghnDistrictId: restaurant.ghn_district_id === null ? null : Number(restaurant.ghn_district_id),
      ghnWardCode: restaurant.ghn_ward_code ?? null,
    };
    const unchanged = Object.keys(proposedAddress).every(
      (key) => proposedAddress[key] === currentAddress[key],
    );
    if (unchanged) {
      await connection.rollback();
      return res.status(400).json({ error: 'Địa chỉ đề xuất phải khác địa chỉ quán đang áp dụng.' });
    }

    const [pendingRows] = await connection.query(
      `SELECT id FROM restaurant_address_change_requests
       WHERE restaurant_id = ? AND status = 'pending'
       LIMIT 1 FOR UPDATE`,
      [restaurant.id],
    );
    if (pendingRows.length) {
      await connection.rollback();
      return res.status(409).json({ error: 'Bạn đang có một yêu cầu đổi địa chỉ chờ admin duyệt.' });
    }

    const [result] = await connection.query(
      `INSERT INTO restaurant_address_change_requests (
        restaurant_id, requested_by_user_id,
        current_address_line, current_ward, current_district, current_city,
        current_ghn_province_id, current_ghn_district_id, current_ghn_ward_code,
        proposed_address_line, proposed_ward, proposed_district, proposed_city,
        proposed_ghn_province_id, proposed_ghn_district_id, proposed_ghn_ward_code
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        restaurant.id, req.auth.userId,
        currentAddress.addressLine, currentAddress.ward, currentAddress.district, currentAddress.city,
        currentAddress.ghnProvinceId, currentAddress.ghnDistrictId, currentAddress.ghnWardCode,
        proposedAddress.addressLine, proposedAddress.ward, proposedAddress.district, proposedAddress.city,
        proposedAddress.ghnProvinceId, proposedAddress.ghnDistrictId, proposedAddress.ghnWardCode,
      ],
    );
    const [rows] = await connection.query(
      'SELECT * FROM restaurant_address_change_requests WHERE id = ? LIMIT 1',
      [result.insertId],
    );
    await connection.commit();
    return res.status(201).json({ request: serializeAddressChangeRequest(rows[0]) });
  } catch (error) {
    await connection.rollback();
    if (error?.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Bạn đang có một yêu cầu đổi địa chỉ chờ admin duyệt.' });
    }
    return next(error);
  } finally {
    connection.release();
  }
});

router.post('/address-change-requests/:id/cancel', async (req, res, next) => {
  const requestId = Number(req.params.id);
  if (!Number.isInteger(requestId) || requestId <= 0) {
    return res.status(400).json({ error: 'ID yêu cầu không hợp lệ.' });
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const restaurant = await loadRestaurant(connection, req.auth.userId, true);
    if (!restaurant) {
      await connection.rollback();
      return res.status(404).json({ error: 'Không tìm thấy quán của bạn.' });
    }
    const [rows] = await connection.query(
      `SELECT * FROM restaurant_address_change_requests
       WHERE id = ? AND restaurant_id = ?
       LIMIT 1 FOR UPDATE`,
      [requestId, restaurant.id],
    );
    const request = rows[0];
    if (!request) {
      await connection.rollback();
      return res.status(404).json({ error: 'Không tìm thấy yêu cầu đổi địa chỉ.' });
    }
    if (request.status !== 'pending') {
      await connection.rollback();
      return res.status(409).json({ error: 'Chỉ có thể hủy yêu cầu đang chờ duyệt.' });
    }
    await connection.query(
      `UPDATE restaurant_address_change_requests
       SET status = 'cancelled', reviewed_at = NOW()
       WHERE id = ?`,
      [request.id],
    );
    const [updatedRows] = await connection.query(
      'SELECT * FROM restaurant_address_change_requests WHERE id = ? LIMIT 1',
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

router.patch('/settings', async (req, res, next) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const restaurant = await loadRestaurant(connection, req.auth.userId, true);
    if (!restaurant) {
      await connection.rollback();
      return res.status(404).json({ error: 'Merchant restaurant not found.' });
    }
    const body = req.body || {};
    const protectedAddressFields = ['addressLine', 'ward', 'district', 'city'];
    if (protectedAddressFields.some((key) => body[key] !== undefined)) {
      await connection.rollback();
      return res.status(400).json({
        error: 'Địa chỉ quán chỉ được thay đổi bằng yêu cầu chờ admin duyệt.',
      });
    }
    const textRules = {
      name: ['name', 2, 160], phone: ['phone', 0, 20], tagline: ['tagline', 0, 255],
      description: ['description', 0, 5000], bankAccountNo: ['bank_account_no', 0, 40],
      bankName: ['bank_name', 0, 120], bankAccountHolder: ['bank_account_holder', 0, 120],
    };
    const numberRules = {
      baseDeliveryFee: ['base_delivery_fee', 0, 10000000],
      minOrderAmount: ['min_order_amount', 0, 100000000],
      avgPrepTimeMin: ['avg_prep_time_min', 1, 300],
    };
    const updates = [];
    const values = [];
    for (const [key, rule] of Object.entries(textRules)) {
      if (body[key] === undefined) continue;
      let value = String(body[key] || '').trim();
      if (value.length < rule[1] || value.length > rule[2]) {
        await connection.rollback();
        return res.status(400).json({ error: key + ' has an invalid length.' });
      }
      if (key === 'bankAccountNo' && value) {
        value = value.replace(/\s+/g, '');
        if (!/^[0-9]{6,40}$/.test(value)) {
          await connection.rollback();
          return res.status(400).json({ error: 'Bank account number must contain 6 to 40 digits.' });
        }
      }
      updates.push(rule[0] + ' = ?');
      values.push(value || null);
    }
    for (const [key, rule] of Object.entries(numberRules)) {
      if (body[key] === undefined) continue;
      const value = Number(body[key]);
      if (!Number.isSafeInteger(value) || value < rule[1] || value > rule[2]) {
        await connection.rollback();
        return res.status(400).json({ error: key + ' is outside the allowed range.' });
      }
      updates.push(rule[0] + ' = ?');
      values.push(value);
    }
    if (body.isOpenNow !== undefined) {
      updates.push('is_open_now = ?');
      values.push(body.isOpenNow ? 1 : 0);
    }
    if (!updates.length) {
      await connection.rollback();
      return res.status(400).json({ error: 'No supported settings were supplied.' });
    }
    const bank = {
      account: body.bankAccountNo === undefined ? restaurant.bank_account_no : String(body.bankAccountNo || '').trim(),
      name: body.bankName === undefined ? restaurant.bank_name : String(body.bankName || '').trim(),
      holder: body.bankAccountHolder === undefined ? restaurant.bank_account_holder : String(body.bankAccountHolder || '').trim(),
    };
    const configuredBankFields = [bank.account, bank.name, bank.holder].filter(Boolean).length;
    if (configuredBankFields > 0 && configuredBankFields < 3) {
      await connection.rollback();
      return res.status(400).json({ error: 'Bank name, account number, and account holder must be configured together.' });
    }
    values.push(restaurant.id);
    await connection.query('UPDATE restaurants SET ' + updates.join(', ') + ' WHERE id = ?', values);
    const [rows] = await connection.query('SELECT * FROM restaurants WHERE id = ?', [restaurant.id]);
    await connection.commit();
    return res.json({ restaurant: serializeSettings(rows[0]) });
  } catch (error) {
    await connection.rollback();
    return next(error);
  } finally {
    connection.release();
  }
});

export default router;
