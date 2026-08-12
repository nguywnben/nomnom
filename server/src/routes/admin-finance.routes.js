import { Router } from 'express';
import pool from '../db/pool.js';
import { requireAuth } from '../middleware/auth.js';
import { maskBankAccount, resolvePayoutTransition } from '../lib/payout.js';
import { PLATFORM_CONFIG_RULES, validatePlatformConfig } from '../lib/platformConfig.js';
import { logAudit } from '../lib/audit.js';

const router = Router();
router.use(requireAuth);
router.use((req, res, next) => {
  if ((req.auth.roles || []).includes('admin')) return next();
  return res.status(403).json({ error: 'Administrator access is required.' });
});

function serializePayout(row, { includeBankAccountNo = false } = {}) {
  return {
    id: Number(row.id),
    code: 'PYT-' + String(row.id).padStart(4, '0'),
    userId: Number(row.user_id),
    userName: row.restaurant_name || row.full_name,
    ownerType: row.owner_type,
    amount: Number(row.amount),
    bankName: row.bank_name,
    bankAccountMasked: maskBankAccount(row.bank_account_no),
    ...(includeBankAccountNo ? { bankAccountNo: row.bank_account_no } : {}),
    bankAccountHolder: row.bank_account_holder,
    status: row.status,
    requestedAt: row.requested_at,
    reviewedAt: row.reviewed_at,
    completedAt: row.completed_at,
    rejectReason: row.reject_reason,
    externalRef: row.external_ref,
  };
}

const PAYOUT_SELECT = "SELECT pr.*, w.owner_type, u.full_name, r.name AS restaurant_name FROM payout_requests pr JOIN wallets w ON w.id = pr.wallet_id JOIN users u ON u.id = pr.user_id LEFT JOIN restaurants r ON r.owner_user_id = pr.user_id";

router.get('/payouts', async (req, res, next) => {
  try {
    const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, Number.parseInt(req.query.limit, 10) || 20));
    const offset = (page - 1) * limit;
    const filters = ['w.owner_type = ?'];
    const params = ['merchant'];
    if (req.query.status && req.query.status !== 'all') {
      filters.push('pr.status = ?');
      params.push(String(req.query.status));
    }
    if (req.query.q) {
      filters.push('(u.full_name LIKE ? OR r.name LIKE ? OR pr.bank_name LIKE ?)');
      const needle = '%' + String(req.query.q).trim() + '%';
      params.push(needle, needle, needle);
    }
    const where = filters.join(' AND ');
    const [[count]] = await pool.query(
      'SELECT COUNT(*) AS total FROM payout_requests pr JOIN wallets w ON w.id = pr.wallet_id JOIN users u ON u.id = pr.user_id LEFT JOIN restaurants r ON r.owner_user_id = pr.user_id WHERE ' + where,
      params,
    );
    const [rows] = await pool.query(
      PAYOUT_SELECT + ' WHERE ' + where + ' ORDER BY pr.requested_at DESC, pr.id DESC LIMIT ? OFFSET ?',
      [...params, limit, offset],
    );
    return res.json({
      data: rows.map(serializePayout),
      pagination: { page, limit, total: Number(count.total), totalPages: Math.ceil(Number(count.total) / limit) },
    });
  } catch (error) {
    return next(error);
  }
});

router.get('/payouts/:id', async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      PAYOUT_SELECT + " WHERE pr.id = ? AND w.owner_type = 'merchant' LIMIT 1",
      [req.params.id],
    );
    if (!rows.length) return res.status(404).json({ error: 'Payout request not found.' });
    return res.json({ payout: serializePayout(rows[0], { includeBankAccountNo: true }) });
  } catch (error) {
    return next(error);
  }
});

router.patch('/payouts/:id', async (req, res, next) => {
  const connection = await pool.getConnection();
  try {
    const action = String(req.body?.action || '');
    const reason = String(req.body?.reason || '').trim();
    const externalRef = String(req.body?.externalRef || '').trim();
    await connection.beginTransaction();
    const [rows] = await connection.query(
      'SELECT pr.*, w.balance, w.pending_balance, w.owner_type, w.id AS locked_wallet_id FROM payout_requests pr JOIN wallets w ON w.id = pr.wallet_id WHERE pr.id = ? FOR UPDATE',
      [req.params.id],
    );
    const payout = rows[0];
    if (!payout || payout.owner_type !== 'merchant') {
      await connection.rollback();
      return res.status(404).json({ error: 'Merchant payout request not found.' });
    }
    const transition = resolvePayoutTransition(payout.status, action);
    if (!transition.ok) {
      await connection.rollback();
      return res.status(409).json({ error: 'Payout transition is not allowed.', reason: transition.reason });
    }
    if (transition.idempotent) {
      const [existing] = await connection.query(PAYOUT_SELECT + ' WHERE pr.id = ?', [payout.id]);
      await connection.commit();
      return res.json({ payout: serializePayout(existing[0]), idempotent: true });
    }
    if (action === 'reject' && reason.length < 3) {
      await connection.rollback();
      return res.status(400).json({ error: 'A rejection reason of at least 3 characters is required.' });
    }
    if (action === 'complete' && externalRef.length < 3) {
      await connection.rollback();
      return res.status(400).json({ error: 'A bank transfer reference is required to complete a payout.' });
    }
    const [openPayouts] = await connection.query(
      "SELECT id, amount FROM payout_requests WHERE wallet_id = ? AND status IN ('pending', 'approved') FOR UPDATE",
      [payout.wallet_id],
    );
    const reserved = openPayouts.reduce((sum, item) => sum + Number(item.amount), 0);
    if (Number(payout.pending_balance) !== reserved) {
      await connection.query('UPDATE wallets SET pending_balance = ? WHERE id = ?', [reserved, payout.wallet_id]);
    }
    if (action === 'approve') {
      await connection.query(
        "UPDATE payout_requests SET status = 'approved', reviewed_by_admin_id = ?, reviewed_at = NOW(), reject_reason = NULL WHERE id = ?",
        [req.auth.userId, payout.id],
      );
    } else if (action === 'reject') {
      await connection.query(
        "UPDATE payout_requests SET status = 'rejected', reviewed_by_admin_id = ?, reviewed_at = NOW(), reject_reason = ? WHERE id = ?",
        [req.auth.userId, reason.slice(0, 500), payout.id],
      );
      await connection.query(
        'UPDATE wallets SET pending_balance = GREATEST(0, pending_balance - ?) WHERE id = ?',
        [payout.amount, payout.wallet_id],
      );
    } else if (action === 'complete') {
      if (Number(payout.balance) < Number(payout.amount)) {
        await connection.rollback();
        return res.status(409).json({ error: 'Wallet balance is insufficient to complete this payout.' });
      }
      const balanceAfter = Number(payout.balance) - Number(payout.amount);
      await connection.query(
        "UPDATE payout_requests SET status = 'completed', reviewed_by_admin_id = COALESCE(reviewed_by_admin_id, ?), reviewed_at = COALESCE(reviewed_at, NOW()), external_ref = ?, completed_at = NOW() WHERE id = ?",
        [req.auth.userId, externalRef.slice(0, 120), payout.id],
      );
      await connection.query(
        'UPDATE wallets SET balance = ?, pending_balance = GREATEST(0, pending_balance - ?), total_withdrawn = total_withdrawn + ? WHERE id = ?',
        [balanceAfter, payout.amount, payout.amount, payout.wallet_id],
      );
      await connection.query(
        "INSERT INTO wallet_transactions (wallet_id, direction, amount, balance_after, tx_type, reference_type, reference_id, description, performed_by_user_id) VALUES (?, 'debit', ?, ?, 'withdrawal', 'payout', ?, ?, ?)",
        [payout.wallet_id, payout.amount, balanceAfter, payout.id, 'Payout PYT-' + String(payout.id).padStart(4, '0') + ' completed', req.auth.userId],
      );
    }
    const title = action === 'approve' ? 'Payout request approved' : action === 'reject' ? 'Payout request rejected' : 'Payout completed';
    const body = action === 'reject'
      ? 'Your payout request was rejected: ' + reason.slice(0, 300)
      : action === 'approve'
        ? 'Your payout request has been approved and is waiting for transfer.'
        : 'Your payout was transferred with reference ' + externalRef.slice(0, 120) + '.';
    await connection.query(
      "INSERT INTO notifications (user_id, type, title, body, link_url) VALUES (?, 'payout_status', ?, ?, '/merchant/wallet')",
      [payout.user_id, title, body],
    );
    const [updated] = await connection.query(PAYOUT_SELECT + ' WHERE pr.id = ?', [payout.id]);

    let hanhDong = 'duyet_rut_tien';
    if (action === 'reject') hanhDong = 'tu_choi_rut_tien';
    if (action === 'complete') hanhDong = 'hoan_tat_rut_tien';

    await logAudit(connection, {
      adminId: req.auth.userId,
      action: hanhDong,
      targetType: 'payout',
      targetId: payout.id,
      metadata: {
        soTien: Number(payout.amount),
        tenNganHang: payout.bank_name,
        lyDoTuChoi: action === 'reject' ? reason : undefined,
        maGiaoDichNgoai: action === 'complete' ? externalRef : undefined,
      },
    });

    await connection.commit();
    return res.json({ payout: serializePayout(updated[0]), idempotent: false });
  } catch (error) {
    await connection.rollback();
    return next(error);
  } finally {
    connection.release();
  }
});

function financialRange(raw) {
  if (raw === 'today') return { range: 'today', where: 'o.delivered_at >= CURDATE()', days: 1 };
  if (raw === 'week') return { range: 'week', where: 'o.delivered_at >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)', days: 7 };
  return { range: 'month', where: 'o.delivered_at >= DATE_SUB(CURDATE(), INTERVAL 29 DAY)', days: 30 };
}

router.get('/financial', async (req, res, next) => {
  try {
    const selected = financialRange(req.query.range);
    const [[metrics]] = await pool.query(
      "SELECT COUNT(*) AS deliveredOrders, COALESCE(SUM(o.total_amount), 0) AS gmv, COALESCE(SUM(o.platform_fee), 0) AS platformFee, COALESCE(SUM(o.merchant_earning), 0) AS merchantNet, COALESCE(AVG(o.total_amount), 0) AS averageOrder FROM orders o WHERE o.status = 'delivered' AND " + selected.where,
    );
    const [[payouts]] = await pool.query(
      "SELECT COALESCE(SUM(status = 'pending'), 0) AS pendingCount, COALESCE(SUM(status = 'approved'), 0) AS approvedCount, COALESCE(SUM(CASE WHEN status = 'completed' THEN amount ELSE 0 END), 0) AS completedAmount FROM payout_requests pr JOIN wallets w ON w.id = pr.wallet_id WHERE w.owner_type = 'merchant'",
    );
    const [[refunds]] = await pool.query(
      "SELECT COUNT(*) AS refundCount, COALESCE(SUM(amount), 0) AS refundAmount FROM payment_refunds WHERE status = 'succeeded' AND completed_at >= DATE_SUB(CURDATE(), INTERVAL ? DAY)",
      [selected.days - 1],
    );
    const [series] = await pool.query(
      "SELECT DATE_FORMAT(o.delivered_at, '%Y-%m-%d') AS date, COUNT(*) AS orderCount, COALESCE(SUM(o.total_amount), 0) AS gmv, COALESCE(SUM(o.platform_fee), 0) AS platformFee FROM orders o WHERE o.status = 'delivered' AND " + selected.where + " GROUP BY DATE_FORMAT(o.delivered_at, '%Y-%m-%d') ORDER BY date ASC",
    );
    return res.json({
      range: selected.range,
      metrics: {
        deliveredOrders: Number(metrics.deliveredOrders), gmv: Number(metrics.gmv), platformFee: Number(metrics.platformFee),
        merchantNet: Number(metrics.merchantNet), averageOrder: Math.round(Number(metrics.averageOrder)),
        refundCount: Number(refunds.refundCount), refundAmount: Number(refunds.refundAmount),
      },
      payouts: { pendingCount: Number(payouts.pendingCount), approvedCount: Number(payouts.approvedCount), completedAmount: Number(payouts.completedAmount) },
      series: series.map((row) => ({ date: row.date, orderCount: Number(row.orderCount), gmv: Number(row.gmv), platformFee: Number(row.platformFee) })),
    });
  } catch (error) {
    return next(error);
  }
});

router.get('/config', async (_req, res, next) => {
  try {
    const keys = Object.keys(PLATFORM_CONFIG_RULES);
    const [rows] = await pool.query(
      'SELECT * FROM platform_config WHERE config_key IN (?) ORDER BY config_key ASC',
      [keys],
    );
    return res.json({ data: rows.map((row) => ({ key: row.config_key, value: row.config_value, dataType: row.data_type, description: row.description, updatedAt: row.updated_at, updatedByAdminId: row.updated_by_admin_id })) });
  } catch (error) {
    return next(error);
  }
});

router.patch('/config/:key', async (req, res, next) => {
  const connection = await pool.getConnection();
  try {
    const key = String(req.params.key);
    const validation = validatePlatformConfig(key, req.body?.value);
    if (!validation.ok) {
      return res.status(400).json({ error: 'Configuration value is not valid.', reason: validation.reason, min: validation.min, max: validation.max });
    }
    await connection.beginTransaction();
    const [rows] = await connection.query('SELECT * FROM platform_config WHERE config_key = ? FOR UPDATE', [key]);
    if (!rows.length) {
      await connection.rollback();
      return res.status(404).json({ error: 'Configuration key not found.' });
    }
    const previous = rows[0];
    await connection.query(
      'UPDATE platform_config SET config_value = ?, data_type = ?, updated_by_admin_id = ? WHERE config_key = ?',
      [validation.value, validation.dataType, req.auth.userId, key],
    );
    let affectedRestaurants = 0;
    if (key === 'default_commission_rate') {
      const [result] = await connection.query(
        'UPDATE restaurants SET commission_rate = ? WHERE commission_rate = ?',
        [validation.numeric, Number(previous.config_value)],
      );
      affectedRestaurants = Number(result.affectedRows);
    }
    const [updated] = await connection.query('SELECT * FROM platform_config WHERE config_key = ?', [key]);

    await logAudit(connection, {
      adminId: req.auth.userId,
      action: 'cap_nhat_cau_hinh',
      targetType: 'config',
      targetId: key,
      metadata: {
        giaTriCu: previous.config_value,
        giaTriMoi: validation.value,
        soNhaHangAnhHuong: affectedRestaurants,
      },
    });

    await connection.commit();
    const row = updated[0];
    return res.json({ config: { key: row.config_key, value: row.config_value, dataType: row.data_type, description: row.description, updatedAt: row.updated_at, updatedByAdminId: row.updated_by_admin_id }, affectedRestaurants });
  } catch (error) {
    await connection.rollback();
    return next(error);
  } finally {
    connection.release();
  }
});

export default router;
