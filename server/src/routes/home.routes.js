import { Router } from 'express';
import pool from '../db/pool.js';
import { verifyAccessToken } from '../lib/auth.js';
import { getDeliveryAvailability, parseCurrentLocation } from '../lib/deliveryAvailability.js';

const router = Router(); 

/**
 * GET /api/v1/home/categories
 * Carousel "Món nổi bật từ nhiều quán" — luân phiên quán theo ngày, rồi phân phối món cân bằng.
 */
router.get('/categories', async (req, res, next) => {
  try {
    const viewerSeed = resolveHomeViewerSeed(req);
    const currentLocation = parseCurrentLocation(req.query);
    const [rows] = await pool.query(
      `WITH ranked_menu_items AS (
         SELECT
           mi.id,
           mi.name,
           mi.description,
           mi.image_url AS imageUrl,
           mi.price,
           mi.prep_time_min AS prepTimeMin,
           mi.is_featured AS isFeatured,
           mi.total_sold AS totalSold,
           mi.sort_order AS sortOrder,
           c.slug AS cuisineSlug,
           mi.restaurant_id AS restaurantId,
           r.name AS restaurantName,
           r.logo_url AS restaurantLogo,
           r.latitude,
           r.longitude,
           r.avg_prep_time_min AS avgPrepTimeMin,
           r.is_open_now AS isOpenNow,
           ROW_NUMBER() OVER (
             PARTITION BY mi.restaurant_id
             ORDER BY mi.is_featured DESC, mi.total_sold DESC, mi.sort_order ASC, mi.id ASC
           ) AS restaurantRank
         FROM menu_items mi
         INNER JOIN restaurants r
           ON r.id = mi.restaurant_id
          AND r.status = 'active'
         LEFT JOIN cuisines c ON c.id = r.cuisine_id
         WHERE mi.status = 'active'
           AND mi.in_stock = 1
       ),
       restaurant_rotation AS (
         SELECT
           restaurantId,
           ROW_NUMBER() OVER (
             ORDER BY SHA2(CONCAT(?, ':', restaurantId), 256), restaurantId
           ) AS rotationPosition,
           COUNT(*) OVER () AS restaurantCount
         FROM (
           SELECT DISTINCT restaurantId
           FROM ranked_menu_items
         ) AS eligible_restaurants
       )
       SELECT
         mi.id, mi.name, mi.description, mi.imageUrl, mi.price, mi.prepTimeMin, mi.cuisineSlug,
         mi.restaurantId, mi.restaurantName, mi.restaurantLogo, mi.latitude, mi.longitude, mi.avgPrepTimeMin, mi.isOpenNow
       FROM ranked_menu_items mi
       INNER JOIN restaurant_rotation rr ON rr.restaurantId = mi.restaurantId
       ORDER BY
         mi.restaurantRank ASC,
         MOD(
           CAST(rr.rotationPosition AS SIGNED) - 1
             - CAST(MOD(TO_DAYS(CONVERT_TZ(UTC_TIMESTAMP(), '+00:00', '+07:00')) * 12, rr.restaurantCount) AS SIGNED)
             + CAST(rr.restaurantCount AS SIGNED),
           CAST(rr.restaurantCount AS SIGNED)
         ) ASC,
         mi.isFeatured DESC, mi.totalSold DESC, mi.sortOrder ASC, mi.id ASC
       LIMIT 12`,
      [viewerSeed],
    );

    res.json({ data: rows.map((row) => ({ ...row, ...getDeliveryAvailability(row, currentLocation) })) });
  } catch (err) {
    next(err);
  }
});

function resolveHomeViewerSeed(req) {
  const authorization = req.headers.authorization;
  if (authorization?.startsWith('Bearer ')) {
    try {
      const payload = verifyAccessToken(authorization.slice(7));
      if (payload?.sub) return `user:${payload.sub}`;
    } catch {
      // Guests and expired sessions use the browser-specific viewer identifier below.
    }
  }

  const viewer = String(req.query.viewer ?? '');
  return /^[a-zA-Z0-9_-]{8,80}$/.test(viewer) ? `guest:${viewer}` : 'guest:anonymous';
}

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
       WHERE is_active = 1
       ORDER BY sort_order ASC, id ASC`,
    );
    res.json({ data: rows });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/home/featured-restaurants
 * Quán nổi bật luân phiên: chỉ chọn nhóm quán chất lượng, sau đó xoay theo ngày và người xem.
 */
router.get('/featured-restaurants', async (req, res, next) => {
  try {
    const currentLocation = parseCurrentLocation(req.query);
    const viewerSeed = resolveHomeViewerSeed(req);
    const [rows] = await pool.query(
      `WITH quality_candidates AS (
         SELECT
           r.id, r.name, r.slug, r.tagline, r.banner_url AS bannerUrl, r.logo_url AS logoUrl,
           c.slug AS cuisineSlug, c.name AS cuisineName,
           r.rating_avg AS ratingAvg, r.review_count AS reviewCount,
           r.avg_prep_time_min AS avgPrepTimeMin,
           r.is_open_now AS isOpenNow, r.latitude, r.longitude,
           r.address_line AS addressLine, r.district, r.city,
           ROW_NUMBER() OVER (
             ORDER BY r.is_open_now DESC, r.rating_avg DESC, r.review_count DESC, r.id ASC
           ) AS qualityRank
         FROM restaurants r
         LEFT JOIN cuisines c ON r.cuisine_id = c.id
         WHERE r.status = 'active'
       )
       SELECT *
       FROM quality_candidates
       WHERE qualityRank <= 24
       ORDER BY SHA2(CONCAT(?, ':', TO_DAYS(CONVERT_TZ(UTC_TIMESTAMP(), '+00:00', '+07:00')), ':', id), 256)
       LIMIT 6`,
      [viewerSeed],
    );

    const data = rows.map((row) => ({
      ...row,
      ratingAvg: Number(row.ratingAvg ?? 0),
      reviewCount: Number(row.reviewCount ?? 0),
      avgPrepTimeMin: Number(row.avgPrepTimeMin ?? 0),
      isOpenNow: Boolean(row.isOpenNow),
      ...getDeliveryAvailability(row, currentLocation),
    }));

    res.json({ data });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/home/nearby-dishes
 * Món còn bán của quán đang mở, ưu tiên khoảng cách từ vị trí trình duyệt.
 */
router.get('/nearby-dishes', async (req, res, next) => {
  try {
    const currentLocation = parseCurrentLocation(req.query);
    const requestedSeed = String(req.query.seed ?? 'nearby').trim();
    const seed = /^[a-zA-Z0-9_-]{1,80}$/.test(requestedSeed) ? requestedSeed : 'nearby';
    if (!currentLocation) {
      return res.json({ data: [], locationRequired: true });
    }

    const [rows] = await pool.query(
      `WITH closest_candidates AS (
         SELECT
           mi.id, mi.name, mi.description, mi.image_url AS image, mi.price,
           mi.prep_time_min AS prepTimeMin, mi.total_sold AS totalSold,
           mi.rating_avg AS itemRating, r.id AS restaurantId, r.name AS restaurantName,
           r.logo_url AS restaurantLogo, r.avg_prep_time_min AS eta,
           r.is_open_now AS isOpenNow, r.latitude, r.longitude,
           r.rating_avg AS restaurantRating,
           (6371 * ACOS(LEAST(1.0,
             COS(RADIANS(?)) * COS(RADIANS(r.latitude)) * COS(RADIANS(r.longitude) - RADIANS(?))
             + SIN(RADIANS(?)) * SIN(RADIANS(r.latitude))
           ))) AS directDistanceKm
         FROM menu_items mi
         INNER JOIN restaurants r ON r.id = mi.restaurant_id
         WHERE mi.status = 'active'
           AND mi.in_stock = 1
           AND r.status = 'active'
           AND r.is_open_now = 1
           AND r.latitude IS NOT NULL
           AND r.longitude IS NOT NULL
         ORDER BY directDistanceKm ASC, mi.rating_avg DESC, mi.total_sold DESC, mi.id ASC
         LIMIT 48
       ),
       ranked_candidates AS (
         SELECT
           closest_candidates.*,
           SHA2(CONCAT(?, ':', id), 256) AS randomSort,
           ROW_NUMBER() OVER (
             PARTITION BY restaurantId
             ORDER BY SHA2(CONCAT(?, ':', id), 256)
           ) AS restaurantRank
         FROM closest_candidates
       )
       SELECT *
       FROM ranked_candidates
       ORDER BY restaurantRank ASC, randomSort ASC
       LIMIT 36`,
      [currentLocation.latitude, currentLocation.longitude, currentLocation.latitude, seed, seed],
    );

    const data = rows
      .map((row) => ({
        id: Number(row.id),
        name: row.name,
        description: row.description,
        image: row.image,
        price: Number(row.price ?? 0),
        prepTimeMin: Number(row.prepTimeMin ?? 0),
        totalSold: Number(row.totalSold ?? 0),
        itemRating: Number(row.itemRating ?? 0),
        restaurantId: Number(row.restaurantId),
        restaurantName: row.restaurantName,
        restaurantLogo: row.restaurantLogo,
        eta: `${Number(row.eta ?? 20)}p`,
        isOpenNow: Boolean(row.isOpenNow),
        restaurantRating: Number(row.restaurantRating ?? 0),
        ...getDeliveryAvailability(row, currentLocation),
      }))
      .filter((item) => item.isWithinDeliveryRange)
      .slice(0, 12);

    res.json({ data, locationRequired: false });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/home/trending-dishes
 * Món được giao nhiều nhất hôm nay, tính theo thời điểm hoàn tất đơn ở GMT+7.
 */
router.get('/trending-dishes', async (req, res, next) => {
  try {
    const currentLocation = parseCurrentLocation(req.query);
    let [rows] = await pool.query(
      `SELECT
         mi.id,
         mi.name,
         mi.description,
         mi.image_url AS image,
         mi.price,
         mi.prep_time_min AS prepTimeMin,
         SUM(oi.quantity) AS soldToday,
         mi.rating_avg AS itemRating,
         r.id AS restaurantId,
         r.name AS restaurantName,
         r.logo_url AS restaurantLogo,
         r.avg_prep_time_min AS eta,
         r.is_open_now AS isOpenNow, r.latitude, r.longitude,
         r.rating_avg AS restaurantRating
       FROM order_items oi
       INNER JOIN orders o
         ON o.id = oi.order_id
        AND o.status = 'delivered'
        AND DATE(o.delivered_at) = DATE(CONVERT_TZ(UTC_TIMESTAMP(), '+00:00', '+07:00'))
       INNER JOIN menu_items mi ON mi.id = oi.menu_item_id
       INNER JOIN restaurants r ON r.id = mi.restaurant_id AND r.status = 'active'
       WHERE mi.status = 'active' AND mi.in_stock = 1
       GROUP BY mi.id
       ORDER BY soldToday DESC, mi.rating_avg DESC, mi.id ASC
      LIMIT 10`,
    );

    let source = 'today';
    if (!rows.length) {
      source = 'all_time';
      [rows] = await pool.query(
        `SELECT
           mi.id, mi.name, mi.description, mi.image_url AS image, mi.price,
           mi.prep_time_min AS prepTimeMin, mi.total_sold AS soldToday,
           mi.rating_avg AS itemRating, r.id AS restaurantId, r.name AS restaurantName,
           r.logo_url AS restaurantLogo, r.avg_prep_time_min AS eta,
           r.is_open_now AS isOpenNow, r.latitude, r.longitude,
           r.rating_avg AS restaurantRating
         FROM menu_items mi
         INNER JOIN restaurants r ON r.id = mi.restaurant_id AND r.status = 'active'
         WHERE mi.status = 'active' AND mi.in_stock = 1
         ORDER BY mi.total_sold DESC, mi.rating_avg DESC, mi.id ASC
         LIMIT 10`,
      );
    }

    const data = rows.map((row) => ({
      id: Number(row.id),
      name: row.name,
      description: row.description,
      image: row.image,
      price: Number(row.price ?? 0),
      prepTimeMin: Number(row.prepTimeMin ?? 0),
      soldToday: Number(row.soldToday ?? 0),
      itemRating: Number(row.itemRating ?? 0),
      restaurantId: Number(row.restaurantId),
      restaurantName: row.restaurantName,
      restaurantLogo: row.restaurantLogo,
      eta: `${Number(row.eta ?? 20)}p`,
      isOpenNow: Boolean(row.isOpenNow),
      restaurantRating: Number(row.restaurantRating ?? 0),
      ...getDeliveryAvailability(row, currentLocation),
    }));

    res.json({ data, source });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/home/order-again
 * Các nhà hàng gần đây khách hàng từng đặt đơn.
 */
router.get('/order-again', async (req, res, next) => {
  try {
    const hdr = req.headers.authorization;
    if (!hdr?.startsWith('Bearer ')) {
      return res.json({ data: [] });
    }

    let userId;
    try {
      const { verifyAccessToken } = await import('../lib/auth.js');
      const payload = verifyAccessToken(hdr.slice(7));
      userId = Number(payload.sub);
    } catch {
      return res.json({ data: [] });
    }

    if (!userId) {
      return res.json({ data: [] });
    }

    const [rows] = await pool.query(
      `SELECT DISTINCT
         r.id, r.name, r.logo_url AS logo, r.avg_prep_time_min AS eta, r.is_open_now AS isOpenNow,
         r.rating_avg AS ratingAvg, MAX(o.placed_at) AS lastOrderedAt
       FROM orders o
       INNER JOIN restaurants r ON r.id = o.restaurant_id AND r.status = 'active'
       WHERE o.customer_id = ?
       GROUP BY r.id, r.name, r.logo_url, r.avg_prep_time_min, r.is_open_now, r.rating_avg
       ORDER BY lastOrderedAt DESC
       LIMIT 6`,
      [userId],
    );

    const data = rows.map((r) => ({
      id: Number(r.id),
      name: r.name,
      logo: r.logo,
      eta: `${Number(r.eta ?? 20)}p`,
      isOpenNow: Boolean(r.isOpenNow),
      ratingAvg: Number(r.ratingAvg ?? 0),
    }));

    res.json({ data });
  } catch (err) {
    next(err);
  }
});

export default router;

