import { Router } from 'express';
import pool from '../db/pool.js';

const router = Router();

router.get('/', async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      `SELECT id, name, slug, icon_url AS iconUrl, sort_order AS sortOrder
       FROM cuisines
       WHERE is_active = 1
       ORDER BY sort_order ASC, id ASC`,
    );
    res.json(rows);
  } catch (error) {
    next(error);
  }
});

export default router;
