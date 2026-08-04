import { Router } from 'express';
import pool from '../db/pool.js';
import { requireAuth } from '../middleware/auth.js';
import { maskBankAccount, validatePayoutRequest } from '../lib/payout.js';

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
    return res.json({ restaurant: serializeSettings(restaurant) });
  } catch (error) {
    return next(error);
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
