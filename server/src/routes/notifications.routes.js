import { Router } from 'express';
import pool from '../db/pool.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);

function serializeNotification(row) {
  return {
    id: Number(row.id),
    type: row.type,
    title: row.title,
    body: row.body,
    link: row.link_url,
    isRead: Boolean(row.is_read),
    readAt: row.read_at,
    createdAt: row.created_at,
  };
}

router.get('/', async (req, res, next) => {
  try {
    const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, Number.parseInt(req.query.limit, 10) || 30));
    const offset = (page - 1) * limit;
    const filters = ['user_id = ?'];
    const params = [req.auth.userId];
    if (req.query.unread === 'true') filters.push('is_read = 0');
    if (req.query.type && req.query.type !== 'all') {
      filters.push('type = ?');
      params.push(String(req.query.type));
    }
    const where = filters.join(' AND ');
    const [[countRow]] = await pool.query(
      'SELECT COUNT(*) AS total, COALESCE(SUM(is_read = 0), 0) AS unread FROM notifications WHERE ' + where,
      params,
    );
    const [rows] = await pool.query(
      'SELECT * FROM notifications WHERE ' + where + ' ORDER BY created_at DESC, id DESC LIMIT ? OFFSET ?',
      [...params, limit, offset],
    );
    return res.json({
      data: rows.map(serializeNotification),
      pagination: { page, limit, total: Number(countRow.total), totalPages: Math.ceil(Number(countRow.total) / limit) },
      unreadCount: Number(countRow.unread),
    });
  } catch (error) {
    return next(error);
  }
});

router.patch('/:id/read', async (req, res, next) => {
  try {
    const [result] = await pool.query(
      'UPDATE notifications SET is_read = 1, read_at = COALESCE(read_at, NOW()) WHERE id = ? AND user_id = ?',
      [req.params.id, req.auth.userId],
    );
    if (!result.affectedRows) return res.status(404).json({ error: 'Notification not found.' });
    return res.json({ ok: true });
  } catch (error) {
    return next(error);
  }
});

router.post('/read-all', async (req, res, next) => {
  try {
    const [result] = await pool.query(
      'UPDATE notifications SET is_read = 1, read_at = COALESCE(read_at, NOW()) WHERE user_id = ? AND is_read = 0',
      [req.auth.userId],
    );
    return res.json({ ok: true, updated: Number(result.affectedRows) });
  } catch (error) {
    return next(error);
  }
});

export default router;
