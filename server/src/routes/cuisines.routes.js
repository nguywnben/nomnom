import { Router } from 'express';
import pool from '../db/pool.js';

const router = Router();

router.get('/', async (req, res, next) => {
  try {
    const [rows] = await pool.query('SELECT id, name, slug FROM cuisines ORDER BY sort_order ASC');
    res.json(rows);
  } catch (error) {
    next(error);
  }
});

export default router;
