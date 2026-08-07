import { Router } from 'express';
import pool from '../db/pool.js';

const router = Router();

/**
 * GET /api/v1/menu-items/search
 * Tìm kiếm kết hợp nhà hàng & món ăn với bộ lọc nâng cao.
 */
router.get('/search', async (req, res, next) => {
  try {
    const {
      q,
      cuisine,
      minPrice,
      maxPrice,
      rating,
      open,
      sort,
      page,
      limit,
    } = req.query;

    const limitVal = Math.min(parseInt(limit, 10) || 20, 50);
    const pageVal = Math.max(parseInt(page, 10) || 1, 1);
    const offset = (pageVal - 1) * limitVal;

    const searchKeyword = q ? String(q).trim() : '';

    // Filter conditions for restaurants
    let restWhere = ["r.status = 'active'"];
    const restParams = [];

    if (searchKeyword) {
      restWhere.push('(r.name LIKE ? OR r.tagline LIKE ? OR r.description LIKE ?)');
      const searchPattern = `%${searchKeyword}%`;
      restParams.push(searchPattern, searchPattern, searchPattern);
    }

    if (cuisine) {
      const slugs = String(cuisine)
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      if (slugs.length > 0) {
        restWhere.push(`c.slug IN (${slugs.map(() => '?').join(',')})`);
        restParams.push(...slugs);
      }
    }

    if (open === 'true' || open === '1') {
      restWhere.push('r.is_open_now = 1');
    }

    if (rating && !isNaN(Number(rating))) {
      restWhere.push('r.rating_avg >= ?');
      restParams.push(Number(rating));
    }

    let restOrder = 'r.rating_avg DESC';
    if (sort === 'fee') restOrder = 'r.base_delivery_fee ASC';
    else if (sort === 'new') restOrder = 'r.created_at DESC';

    const restCountSql = `
      SELECT COUNT(DISTINCT r.id) as total
      FROM restaurants r
      LEFT JOIN cuisines c ON r.cuisine_id = c.id
      WHERE ${restWhere.join(' AND ')}
    `;

    const [[{ total: totalRestaurants }]] = await pool.query(restCountSql, restParams);

    const restDataSql = `
      SELECT
        r.id, r.name, r.slug, r.tagline, r.banner_url as bannerUrl, r.logo_url as logoUrl,
        c.slug as cuisineSlug, c.name as cuisineName,
        r.rating_avg as ratingAvg, r.review_count as reviewCount,
        r.base_delivery_fee as baseDeliveryFee, r.avg_prep_time_min as avgPrepTimeMin,
        r.is_open_now as isOpenNow,
        r.address_line as addressLine, r.district, r.city
      FROM restaurants r
      LEFT JOIN cuisines c ON r.cuisine_id = c.id
      WHERE ${restWhere.join(' AND ')}
      ORDER BY ${restOrder}
      LIMIT ? OFFSET ?
    `;

    const [restaurantRows] = await pool.query(restDataSql, [...restParams, limitVal, offset]);

    const formattedRestaurants = restaurantRows.map((r) => ({
      ...r,
      ratingAvg: Number(r.ratingAvg ?? 0),
      reviewCount: Number(r.reviewCount ?? 0),
      baseDeliveryFee: Number(r.baseDeliveryFee ?? 0),
      avgPrepTimeMin: Number(r.avgPrepTimeMin ?? 0),
      isOpenNow: Boolean(r.isOpenNow),
    }));

    // Filter conditions for menu items
    let itemWhere = ["mi.status = 'active'", "r.status = 'active'"];
    const itemParams = [];

    if (searchKeyword) {
      itemWhere.push('(mi.name LIKE ? OR mi.description LIKE ?)');
      const searchPattern = `%${searchKeyword}%`;
      itemParams.push(searchPattern, searchPattern);
    }

    if (cuisine) {
      const slugs = String(cuisine)
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      if (slugs.length > 0) {
        itemWhere.push(`c.slug IN (${slugs.map(() => '?').join(',')})`);
        itemParams.push(...slugs);
      }
    }

    if (open === 'true' || open === '1') {
      itemWhere.push('r.is_open_now = 1');
    }

    if (minPrice && !isNaN(Number(minPrice))) {
      itemWhere.push('mi.price >= ?');
      itemParams.push(Number(minPrice));
    }

    if (maxPrice && !isNaN(Number(maxPrice))) {
      itemWhere.push('mi.price <= ?');
      itemParams.push(Number(maxPrice));
    }

    if (rating && !isNaN(Number(rating))) {
      itemWhere.push('mi.rating_avg >= ?');
      itemParams.push(Number(rating));
    }

    let itemOrder = 'mi.total_sold DESC, mi.rating_avg DESC';
    if (sort === 'price_asc') itemOrder = 'mi.price ASC';
    else if (sort === 'price_desc') itemOrder = 'mi.price DESC';
    else if (sort === 'rating') itemOrder = 'mi.rating_avg DESC';

    const itemCountSql = `
      SELECT COUNT(DISTINCT mi.id) as total
      FROM menu_items mi
      INNER JOIN restaurants r ON r.id = mi.restaurant_id
      LEFT JOIN cuisines c ON r.cuisine_id = c.id
      WHERE ${itemWhere.join(' AND ')}
    `;

    const [[{ total: totalMenuItems }]] = await pool.query(itemCountSql, itemParams);

    const itemDataSql = `
      SELECT
        mi.id,
        mi.name,
        mi.description,
        mi.image_url AS imageUrl,
        mi.price,
        mi.prep_time_min AS prepTimeMin,
        mi.in_stock AS inStock,
        mi.total_sold AS totalSold,
        mi.rating_avg AS ratingAvg,
        mi.status,
        r.id AS restaurantId,
        r.name AS restaurantName,
        r.logo_url AS restaurantLogo,
        r.base_delivery_fee AS baseDeliveryFee,
        r.avg_prep_time_min AS avgPrepTimeMin,
        r.is_open_now AS isOpenNow
      FROM menu_items mi
      INNER JOIN restaurants r ON r.id = mi.restaurant_id
      LEFT JOIN cuisines c ON r.cuisine_id = c.id
      WHERE ${itemWhere.join(' AND ')}
      ORDER BY ${itemOrder}
      LIMIT ? OFFSET ?
    `;

    const [itemRows] = await pool.query(itemDataSql, [...itemParams, limitVal, offset]);

    const formattedMenuItems = itemRows.map((mi) => ({
      id: Number(mi.id),
      name: mi.name,
      description: mi.description,
      imageUrl: mi.imageUrl,
      price: Number(mi.price ?? 0),
      prepTimeMin: Number(mi.prepTimeMin ?? 0),
      inStock: Boolean(mi.inStock),
      totalSold: Number(mi.totalSold ?? 0),
      ratingAvg: Number(mi.ratingAvg ?? 0),
      status: mi.status,
      restaurantId: Number(mi.restaurantId),
      restaurantName: mi.restaurantName,
      restaurantLogo: mi.restaurantLogo,
      baseDeliveryFee: Number(mi.baseDeliveryFee ?? 0),
      avgPrepTimeMin: Number(mi.avgPrepTimeMin ?? 0),
      isOpenNow: Boolean(mi.isOpenNow),
      isAvailable: Boolean(mi.inStock) && mi.status === 'active' && Boolean(mi.isOpenNow),
    }));

    res.json({
      restaurants: formattedRestaurants,
      menuItems: formattedMenuItems,
      pagination: {
        page: pageVal,
        limit: limitVal,
        totalRestaurants,
        totalMenuItems,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/menu-items/:id
 * Lấy chi tiết món ăn theo ID kèm thông tin nhà hàng sở hữu.
 */
router.get('/:id', async (req, res, next) => {
  try {
    const itemId = Number(req.params.id);
    if (!itemId || !Number.isFinite(itemId)) {
      return res.status(400).json({ error: 'ID món ăn không hợp lệ.' });
    }

    const [rows] = await pool.query(
      `SELECT
         mi.id,
         mi.name,
         mi.description,
         mi.image_url AS imageUrl,
         mi.price,
         mi.prep_time_min AS prepTimeMin,
         mi.is_featured AS isFeatured,
         mi.in_stock AS inStock,
         mi.total_sold AS totalSold,
         mi.rating_avg AS itemRatingAvg,
         mi.status AS itemStatus,
         r.id AS restaurantId,
         r.name AS restaurantName,
         r.slug AS restaurantSlug,
         r.tagline AS restaurantTagline,
         r.logo_url AS restaurantLogo,
         r.banner_url AS restaurantBanner,
         r.address_line AS addressLine,
         r.district,
         r.city,
         r.phone AS restaurantPhone,
         r.rating_avg AS restaurantRatingAvg,
         r.review_count AS restaurantReviewCount,
         r.base_delivery_fee AS baseDeliveryFee,
         r.min_order_amount AS minOrderAmount,
         r.avg_prep_time_min AS avgPrepTimeMin,
         r.is_open_now AS isOpenNow,
         r.status AS restaurantStatus
       FROM menu_items mi
       INNER JOIN restaurants r ON r.id = mi.restaurant_id
       WHERE mi.id = ?
       LIMIT 1`,
      [itemId],
    );

    const item = rows[0];
    if (!item) {
      return res.status(404).json({ error: 'Món ăn không tồn tại.' });
    }

    const isAvailable =
      Boolean(item.inStock) &&
      item.itemStatus === 'active' &&
      item.restaurantStatus === 'active';

    let unavailableReason = null;
    if (item.restaurantStatus !== 'active') {
      unavailableReason = 'Nhà hàng hiện tạm thời ngưng hoạt động.';
    } else if (!Boolean(item.isOpenNow)) {
      unavailableReason = 'Nhà hàng hiện đang đóng cửa.';
    } else if (item.itemStatus !== 'active' || !Boolean(item.inStock)) {
      unavailableReason = 'Món ăn hiện tại đã hết hàng.';
    }

    res.json({
      item: {
        id: Number(item.id),
        name: item.name,
        description: item.description,
        imageUrl: item.imageUrl,
        price: Number(item.price ?? 0),
        prepTimeMin: Number(item.prepTimeMin ?? 0),
        isFeatured: Boolean(item.isFeatured),
        inStock: Boolean(item.inStock),
        totalSold: Number(item.totalSold ?? 0),
        ratingAvg: Number(item.itemRatingAvg ?? 0),
        status: item.itemStatus,
        isAvailable,
        canOrder: isAvailable && Boolean(item.isOpenNow),
        unavailableReason,
      },
      restaurant: {
        id: Number(item.restaurantId),
        name: item.restaurantName,
        slug: item.restaurantSlug,
        tagline: item.restaurantTagline,
        logoUrl: item.restaurantLogo,
        bannerUrl: item.restaurantBanner,
        addressLine: item.addressLine,
        district: item.district,
        city: item.city,
        phone: item.restaurantPhone,
        ratingAvg: Number(item.restaurantRatingAvg ?? 0),
        reviewCount: Number(item.restaurantReviewCount ?? 0),
        baseDeliveryFee: Number(item.baseDeliveryFee ?? 0),
        minOrderAmount: Number(item.minOrderAmount ?? 0),
        avgPrepTimeMin: Number(item.avgPrepTimeMin ?? 0),
        isOpenNow: Boolean(item.isOpenNow),
        status: item.restaurantStatus,
      },
    });
  } catch (err) {
    next(err);
  }
});

export default router;
