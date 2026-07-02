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
      const slugs = cuisine
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
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

function buildRestaurantWhereClause(idOrSlug) {
  if (/^\d+$/.test(idOrSlug)) {
    return { clause: 'r.id = ?', value: Number(idOrSlug) };
  }

  return { clause: 'r.slug = ?', value: idOrSlug };
}

function serializeRestaurantRow(row) {
  return {
    id: Number(row.id),
    name: row.name,
    slug: row.slug,
    tagline: row.tagline,
    description: row.description,
    bannerUrl: row.bannerUrl,
    logoUrl: row.logoUrl,
    cuisineName: row.cuisineName,
    cuisineSlug: row.cuisineSlug,
    addressLine: row.addressLine,
    ward: row.ward,
    district: row.district,
    city: row.city,
    latitude: row.latitude === null ? null : Number(row.latitude),
    longitude: row.longitude === null ? null : Number(row.longitude),
    baseDeliveryFee: Number(row.baseDeliveryFee ?? 0),
    minOrderAmount: Number(row.minOrderAmount ?? 0),
    avgPrepTimeMin: Number(row.avgPrepTimeMin ?? 0),
    ratingAvg: Number(row.ratingAvg ?? 0),
    reviewCount: Number(row.reviewCount ?? 0),
    isOpenNow: Boolean(row.isOpenNow),
    phone: row.phone,
  };
}

async function findActiveRestaurant(idOrSlug) {
  const { clause, value } = buildRestaurantWhereClause(idOrSlug);
  const [rows] = await pool.query(
    `SELECT
       r.id,
       r.name,
       r.slug,
       r.tagline,
       r.description,
       r.banner_url AS bannerUrl,
       r.logo_url AS logoUrl,
       COALESCE(c.name, '') AS cuisineName,
       COALESCE(c.slug, '') AS cuisineSlug,
       r.address_line AS addressLine,
       r.ward,
       r.district,
       r.city,
       r.latitude,
       r.longitude,
       r.base_delivery_fee AS baseDeliveryFee,
       r.min_order_amount AS minOrderAmount,
       r.avg_prep_time_min AS avgPrepTimeMin,
       r.rating_avg AS ratingAvg,
       r.review_count AS reviewCount,
       r.is_open_now AS isOpenNow,
       r.phone
     FROM restaurants r
     LEFT JOIN cuisines c ON c.id = r.cuisine_id
     WHERE r.status = 'active'
       AND ${clause}
     LIMIT 1`,
    [value],
  );

  const row = rows[0];
  return row ? serializeRestaurantRow(row) : null;
}

router.get('/:id', async (req, res, next) => {
  try {
    const restaurant = await findActiveRestaurant(req.params.id);
    if (!restaurant) {
      return res.status(404).json({ error: 'Không tìm thấy quán ăn' });
    }

    res.json(restaurant);
  } catch (err) {
    next(err);
  }
});

router.get('/:id/menu', async (req, res, next) => {
  try {
    const restaurant = await findActiveRestaurant(req.params.id);
    if (!restaurant) {
      return res.status(404).json({ error: 'Không tìm thấy quán ăn' });
    }

    const [rows] = await pool.query(
      `SELECT
         mc.id AS categoryId,
         mc.name AS categoryName,
         mc.sort_order AS categorySortOrder,
         mi.id AS itemId,
         mi.name AS itemName,
         mi.description AS itemDescription,
         mi.image_url AS imageUrl,
         mi.price,
         mi.prep_time_min AS prepTimeMin,
         mi.is_featured AS isFeatured,
         mi.in_stock AS inStock,
         mi.total_sold AS totalSold,
         mi.rating_avg AS ratingAvg
       FROM menu_categories mc
       INNER JOIN menu_items mi
         ON mi.category_id = mc.id
        AND mi.restaurant_id = mc.restaurant_id
        AND mi.status = 'active'
       WHERE mc.restaurant_id = ?
         AND mc.is_active = 1
       ORDER BY mc.sort_order ASC, mc.id ASC, mi.is_featured DESC, mi.total_sold DESC, mi.sort_order ASC, mi.id ASC`,
      [restaurant.id],
    );

    const categoryMap = new Map();
    for (const row of rows) {
      const categoryId = Number(row.categoryId);
      if (!categoryMap.has(categoryId)) {
        categoryMap.set(categoryId, {
          id: categoryId,
          name: row.categoryName,
          sortOrder: Number(row.categorySortOrder ?? 0),
          items: [],
        });
      }

      categoryMap.get(categoryId).items.push({
        id: Number(row.itemId),
        name: row.itemName,
        description: row.itemDescription,
        imageUrl: row.imageUrl,
        price: Number(row.price ?? 0),
        prepTimeMin: Number(row.prepTimeMin ?? 0),
        isFeatured: Boolean(row.isFeatured),
        inStock: Boolean(row.inStock),
        totalSold: Number(row.totalSold ?? 0),
        ratingAvg: Number(row.ratingAvg ?? 0),
      });
    }

    res.json({
      categories: Array.from(categoryMap.values()).map((category) => ({
        ...category,
        items: category.items,
      })),
    });
  } catch (err) {
    next(err);
  }
});

router.get('/:id/reviews', async (req, res, next) => {
  try {
    const restaurant = await findActiveRestaurant(req.params.id);
    if (!restaurant) {
      return res.status(404).json({ error: 'Không tìm thấy quán ăn' });
    }

    const [rows] = await pool.query(
      `SELECT
         rv.id,
         rv.rating,
         rv.comment,
         rv.created_at AS createdAt,
         u.full_name AS authorName,
         u.avatar_url AS avatarUrl
       FROM reviews rv
       INNER JOIN users u ON u.id = rv.customer_id
       WHERE rv.restaurant_id = ?
         AND rv.is_hidden = 0
       ORDER BY rv.created_at DESC, rv.id DESC
       LIMIT 6`,
      [restaurant.id],
    );

    res.json({
      reviews: rows.map((row) => ({
        id: Number(row.id),
        rating: Number(row.rating ?? 0),
        comment: row.comment ?? '',
        createdAt: row.createdAt,
        authorName: row.authorName,
        avatarUrl: row.avatarUrl,
      })),
    });
  } catch (err) {
    next(err);
  }
});

export default router;
