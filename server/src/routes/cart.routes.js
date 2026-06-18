import { Router } from 'express';
import pool from '../db/pool.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.use(requireAuth);

function toNumber(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function serializeCartRow(cartRow, itemRows) {
  const items = itemRows.map((row) => ({
    id: Number(row.itemId),
    menuItemId: Number(row.menuItemId),
    name: row.name,
    imageUrl: row.imageUrl,
    price: toNumber(row.price),
    quantity: Number(row.quantity),
    note: row.note ?? null,
    lineSubtotal: toNumber(row.price) * Number(row.quantity),
  }));

  return {
    id: Number(cartRow.id),
    restaurantId: Number(cartRow.restaurantId),
    restaurantName: cartRow.restaurantName,
    restaurantLogo: cartRow.restaurantLogo,
    baseDeliveryFee: toNumber(cartRow.baseDeliveryFee),
    items,
    subtotal: items.reduce((sum, item) => sum + item.lineSubtotal, 0),
  };
}

async function loadActiveCart(customerId) {
  const [cartRows] = await pool.query(
    `SELECT c.id, c.restaurant_id AS restaurantId, r.name AS restaurantName, r.logo_url AS restaurantLogo,
            r.base_delivery_fee AS baseDeliveryFee
     FROM carts c
     INNER JOIN restaurants r ON r.id = c.restaurant_id
     WHERE c.customer_id = ? AND c.status = 'active'
     LIMIT 1`,
    [customerId],
  );
  const cartRow = cartRows[0];
  if (!cartRow) return null;

  const [itemRows] = await pool.query(
    `SELECT
       ci.id AS itemId,
       ci.menu_item_id AS menuItemId,
       mi.name,
       mi.image_url AS imageUrl,
       ci.unit_price AS price,
       ci.quantity,
       ci.note
     FROM cart_items ci
     INNER JOIN menu_items mi ON mi.id = ci.menu_item_id
     WHERE ci.cart_id = ?
     ORDER BY ci.id ASC`,
    [cartRow.id],
  );

  if (!itemRows.length) {
    await pool.query('DELETE FROM carts WHERE id = ?', [cartRow.id]);
    return null;
  }

  return serializeCartRow(cartRow, itemRows);
}

async function loadCartForRestaurant(customerId, restaurantId) {
  const [cartRows] = await pool.query(
    `SELECT c.id, c.restaurant_id AS restaurantId, r.name AS restaurantName, r.logo_url AS restaurantLogo,
            r.base_delivery_fee AS baseDeliveryFee
     FROM carts c
     INNER JOIN restaurants r ON r.id = c.restaurant_id
     WHERE c.customer_id = ? AND c.restaurant_id = ? AND c.status = 'active'
     LIMIT 1`,
    [customerId, restaurantId],
  );
  const cartRow = cartRows[0];
  if (!cartRow) return null;

  const [itemRows] = await pool.query(
    `SELECT
       ci.id AS itemId,
       ci.menu_item_id AS menuItemId,
       mi.name,
       mi.image_url AS imageUrl,
       ci.unit_price AS price,
       ci.quantity,
       ci.note
     FROM cart_items ci
     INNER JOIN menu_items mi ON mi.id = ci.menu_item_id
     WHERE ci.cart_id = ?
     ORDER BY ci.id ASC`,
    [cartRow.id],
  );

  if (!itemRows.length) {
    await pool.query('DELETE FROM carts WHERE id = ?', [cartRow.id]);
    return null;
  }

  return serializeCartRow(cartRow, itemRows);
}

async function clearOtherActiveCarts(connection, customerId, keepRestaurantId = null) {
  const params = [customerId];
  let sql = 'DELETE FROM carts WHERE customer_id = ? AND status = \'active\'';
  if (keepRestaurantId !== null) {
    sql += ' AND restaurant_id <> ?';
    params.push(keepRestaurantId);
  }
  await connection.query(sql, params);
}

router.get('/', async (req, res, next) => {
  try {
    const cart = await loadActiveCart(req.auth.userId);
    res.json({ cart });
  } catch (err) {
    next(err);
  }
});

router.post('/items', async (req, res, next) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const customerId = req.auth.userId;
    const menuItemId = Number(req.body?.menuItemId);
    const quantity = Math.max(1, Math.trunc(Number(req.body?.quantity ?? 1)));
    const noteRaw = String(req.body?.note ?? '').trim();
    const note = noteRaw ? noteRaw.slice(0, 500) : null;

    if (!menuItemId || !Number.isFinite(quantity) || quantity < 1) {
      await connection.rollback();
      return res.status(400).json({ error: 'menuItemId và quantity hợp lệ là bắt buộc.' });
    }

    const [menuRows] = await connection.query(
      `SELECT mi.id, mi.restaurant_id AS restaurantId, mi.name, mi.image_url AS imageUrl, mi.price,
              mi.status, mi.in_stock, r.name AS restaurantName, r.logo_url AS restaurantLogo, r.status AS restaurantStatus
       FROM menu_items mi
       INNER JOIN restaurants r ON r.id = mi.restaurant_id
       WHERE mi.id = ?
       LIMIT 1`,
      [menuItemId],
    );
    const menuItem = menuRows[0];
    if (!menuItem || menuItem.status !== 'active' || !menuItem.in_stock || menuItem.restaurantStatus !== 'active') {
      await connection.rollback();
      return res.status(404).json({ error: 'Món ăn không tồn tại.' });
    }

    const [activeCartRows] = await connection.query(
      `SELECT id, restaurant_id AS restaurantId
       FROM carts
       WHERE customer_id = ? AND status = 'active'
       LIMIT 1
       FOR UPDATE`,
      [customerId],
    );
    const activeCart = activeCartRows[0];

    let cartId = activeCart?.id ?? null;
    let sameRestaurant = activeCart && Number(activeCart.restaurantId) === Number(menuItem.restaurantId);

    if (activeCart && !sameRestaurant) {
      await clearOtherActiveCarts(connection, customerId);
      cartId = null;
      sameRestaurant = false;
    }

    if (!cartId) {
      const [insertCart] = await connection.query(
        `INSERT INTO carts (customer_id, restaurant_id, status, created_at, updated_at)
         VALUES (?, ?, 'active', NOW(), NOW())`,
        [customerId, menuItem.restaurantId],
      );
      cartId = insertCart.insertId;
    }

    const [existingRows] = await connection.query(
      `SELECT id, quantity
       FROM cart_items
       WHERE cart_id = ? AND menu_item_id = ?
       LIMIT 1
       FOR UPDATE`,
      [cartId, menuItemId],
    );
    const existing = existingRows[0];

    if (existing) {
      await connection.query(
        `UPDATE cart_items
         SET quantity = quantity + ?, unit_price = ?, note = COALESCE(?, note)
         WHERE id = ?`,
        [quantity, menuItem.price, note, existing.id],
      );
    } else {
      await connection.query(
        `INSERT INTO cart_items (cart_id, menu_item_id, quantity, unit_price, note, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, NOW(), NOW())`,
        [cartId, menuItemId, quantity, menuItem.price, note],
      );
    }

    await connection.commit();
    const cart = await loadCartForRestaurant(customerId, menuItem.restaurantId);
    res.json({ cart });
  } catch (err) {
    await connection.rollback();
    next(err);
  } finally {
    connection.release();
  }
});

router.patch('/items/:itemId', async (req, res, next) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const customerId = req.auth.userId;
    const itemId = Number(req.params.itemId);
    const quantity = Math.max(0, Math.trunc(Number(req.body?.quantity ?? 0)));
    const noteRaw = req.body?.note;
    const note = noteRaw === undefined ? undefined : String(noteRaw).trim().slice(0, 500) || null;

    if (!itemId || !Number.isFinite(quantity)) {
      await connection.rollback();
      return res.status(400).json({ error: 'itemId và quantity hợp lệ là bắt buộc.' });
    }

    const [itemRows] = await connection.query(
      `SELECT
         ci.id,
         ci.cart_id AS cartId,
         ci.menu_item_id AS menuItemId,
         ci.quantity,
         c.restaurant_id AS restaurantId
       FROM cart_items ci
       INNER JOIN carts c ON c.id = ci.cart_id
       WHERE ci.id = ? AND c.customer_id = ? AND c.status = 'active'
       LIMIT 1
       FOR UPDATE`,
      [itemId, customerId],
    );
    const existing = itemRows[0];
    if (!existing) {
      await connection.rollback();
      return res.status(404).json({ error: 'Item không tồn tại.' });
    }

    if (quantity === 0) {
      await connection.query('DELETE FROM cart_items WHERE id = ?', [itemId]);
    } else {
      const updates = ['quantity = ?'];
      const values = [quantity];
      if (note !== undefined) {
        updates.push('note = ?');
        values.push(note);
      }
      updates.push('updated_at = NOW()');
      values.push(itemId);
      await connection.query(`UPDATE cart_items SET ${updates.join(', ')} WHERE id = ?`, values);
    }

    const [remainingRows] = await connection.query(
      'SELECT COUNT(*) AS total FROM cart_items WHERE cart_id = ?',
      [existing.cartId],
    );
    if (Number(remainingRows[0]?.total ?? 0) === 0) {
      await connection.query('DELETE FROM carts WHERE id = ?', [existing.cartId]);
      await connection.commit();
      return res.json({ cart: null });
    }

    await connection.commit();
    const cart = await loadActiveCart(customerId);
    res.json({ cart });
  } catch (err) {
    await connection.rollback();
    next(err);
  } finally {
    connection.release();
  }
});

router.delete('/items/:itemId', async (req, res, next) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const customerId = req.auth.userId;
    const itemId = Number(req.params.itemId);
    if (!itemId) {
      await connection.rollback();
      return res.status(400).json({ error: 'itemId hợp lệ là bắt buộc.' });
    }

    const [itemRows] = await connection.query(
      `SELECT ci.id, ci.cart_id AS cartId
       FROM cart_items ci
       INNER JOIN carts c ON c.id = ci.cart_id
       WHERE ci.id = ? AND c.customer_id = ? AND c.status = 'active'
       LIMIT 1`,
      [itemId, customerId],
    );
    const existing = itemRows[0];
    if (!existing) {
      await connection.rollback();
      return res.status(404).json({ error: 'Item không tồn tại.' });
    }

    await connection.query('DELETE FROM cart_items WHERE id = ?', [itemId]);

    const [remainingRows] = await connection.query(
      'SELECT COUNT(*) AS total FROM cart_items WHERE cart_id = ?',
      [existing.cartId],
    );
    if (Number(remainingRows[0]?.total ?? 0) === 0) {
      await connection.query('DELETE FROM carts WHERE id = ?', [existing.cartId]);
      await connection.commit();
      return res.json({ cart: null });
    }

    await connection.commit();
    const cart = await loadActiveCart(customerId);
    res.json({ cart });
  } catch (err) {
    await connection.rollback();
    next(err);
  } finally {
    connection.release();
  }
});

router.delete('/', async (req, res, next) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const customerId = req.auth.userId;
    await connection.query('DELETE FROM carts WHERE customer_id = ? AND status = \'active\'', [customerId]);

    await connection.commit();
    res.json({ cart: null });
  } catch (err) {
    await connection.rollback();
    next(err);
  } finally {
    connection.release();
  }
});

export default router;
