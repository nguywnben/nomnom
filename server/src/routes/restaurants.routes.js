import { Router } from 'express';
import pool from '../db/pool.js';

const router = Router();

router.get('/', async (req, res, next) => {
  try {
    const { q, cuisine, open, sort, page, limit } = req.query;

    const limitVal = Math.min(parseInt(limit, 10) || 20, 50);
    const pageVal = Math.max(parseInt(page, 10) || 1, 1);
    const offset = (pageVal - 1) * limitVal;

    let whereSql = `r.status = 'active'`;
    const params = [];

    if (q) {
      whereSql += ` AND (r.name LIKE ? OR r.tagline LIKE ?)`;
      const searchStr = `%${q}%`;
      params.push(searchStr, searchStr);
    }

    if (cuisine) {
      const slugs = cuisine.split(',').map((s) => s.trim()).filter(Boolean);
      if (slugs.length > 0) {
        whereSql += ` AND c.slug IN (${slugs.map(() => '?').join(',')})`;
        params.push(...slugs);
      }
    }

    if (open === 'true' || open === '1') {
      whereSql += ` AND r.is_open_now = 1`;
    }

    let orderSql = `r.rating_avg DESC`;
    if (sort === 'fee') orderSql = `r.base_delivery_fee ASC`;
    else if (sort === 'new') orderSql = `r.created_at DESC`;

    const countSql = `
      SELECT COUNT(*) as total
      FROM restaurants r
      LEFT JOIN cuisines c ON r.cuisine_id = c.id
      WHERE ${whereSql}
    `;

    const [[{ total }]] = await pool.query(countSql, params);

    const dataSql = `
      SELECT 
        r.id, r.name, r.slug, r.tagline, r.banner_url as bannerUrl, r.logo_url as logoUrl,
        c.slug as cuisineSlug, c.name as cuisineName,
        r.rating_avg as ratingAvg, r.review_count as reviewCount, 
        r.base_delivery_fee as baseDeliveryFee, r.avg_prep_time_min as avgPrepTimeMin, 
        r.is_open_now as isOpenNow,
        r.address_line as addressLine, r.district, r.city
      FROM restaurants r
      LEFT JOIN cuisines c ON r.cuisine_id = c.id
      WHERE ${whereSql}
      ORDER BY ${orderSql}
      LIMIT ? OFFSET ?
    `;

    const [rows] = await pool.query(dataSql, [...params, limitVal, offset]);

    const data = rows.map((row) => ({
      ...row,
      isOpenNow: Boolean(row.isOpenNow),
    }));

    res.json({
      data,
      pagination: {
        page: pageVal,
        limit: limitVal,
        total,
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
