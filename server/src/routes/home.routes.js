import { Router } from 'express';
import pool from '../db/pool.js';

const router = Router(); 

/**
 * GET /api/v1/home/categories
 * Carousel "Khám phá theo món ăn" — món nổi bật từ menu_items (quán đang active/mở).
 */
router.get('/categories', async (_req, res, next) => {
  try {
    const [rows] = await pool.query(
      `SELECT
         mi.id,
         mi.name,
         mi.image_url AS imageUrl,
         c.slug AS cuisineSlug,
         mi.restaurant_id AS restaurantId,
         r.name AS restaurantName
       FROM menu_items mi
       INNER JOIN restaurants r
         ON r.id = mi.restaurant_id
        AND r.status = 'active'
       LEFT JOIN cuisines c ON c.id = r.cuisine_id
       WHERE mi.status = 'active'
         AND mi.in_stock = 1
       ORDER BY mi.is_featured DESC, mi.total_sold DESC, mi.sort_order ASC, mi.id ASC
       LIMIT 12`,
    );

    res.json({ data: rows });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/home/promos
 * 3 banner khuyến mãi trên trang /app (home_promo_banners).
 */
router.get('/promos', async (_req, res, next) => {
  try {
    const [rows] = await pool.query(
      `SELECT
         id,
         tag,
         title,
         subtitle,
         cta_label AS ctaLabel,
         image_url AS imageUrl,
         link_url AS linkUrl,
         sort_order AS sortOrder
       FROM home_promo_banners
       WHERE is_active = 1
       ORDER BY sort_order ASC, id ASC`,
    );

    res.json({ data: rows });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/home/cuisines
 * Danh sách toàn bộ loại hình ẩm thực từ bảng cuisines.
 */
router.get('/cuisines', async (_req, res, next) => {
  try {
    const [rows] = await pool.query(
      `SELECT id, name, slug, icon_url AS iconUrl, sort_order AS sortOrder
       FROM cuisines
       ORDER BY sort_order ASC, id ASC`,
    );
    res.json({ data: rows });
  } catch (err) {
    next(err);
  }
});

export default router;
