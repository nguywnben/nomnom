import { Router } from 'express';
import pool from '../db/pool.js';
import { requireAuth, ensureCustomer } from '../middleware/auth.js';
import { createGhnClient, GhnProviderError } from '../lib/ghn.js';
import { buildShippingQuote } from '../lib/shippingQuote.js';

const router = Router();
router.use(requireAuth);
router.use(ensureCustomer);

function getGhnClient() {
  return createGhnClient({
    token: process.env.GHN_TOKEN,
    shopId: process.env.GHN_SHOP_ID,
    baseUrl: process.env.GHN_API_BASE_URL ?? 'https://online-gateway.ghn.vn/shiip/public-api',
  });
}

function positiveInteger(value) {
  const number = Number(value);
  return Number.isInteger(number) && number > 0 ? number : null;
}

function respondGhnError(res, error) {
  if (error?.code === 'GHN_ADDRESS_NOT_READY' || error?.code === 'GHN_CART_NOT_READY') {
    return res.status(400).json({ error: error.message, code: error.code });
  }
  if (error instanceof GhnProviderError || String(error?.code ?? '').startsWith('GHN_')) {
    return res.status(502).json({ error: error.message, code: error.code ?? 'GHN_PROVIDER_ERROR' });
  }
  throw error;
}

router.get('/ghn/provinces', async (_req, res, next) => {
  try {
    const rows = await getGhnClient().getProvinces();
    res.json((rows ?? []).map((item) => ({ id: item.ProvinceID, name: item.ProvinceName })));
  } catch (error) {
    try { respondGhnError(res, error); } catch (unexpected) { next(unexpected); }
  }
});

router.get('/ghn/districts', async (req, res, next) => {
  const provinceId = positiveInteger(req.query.provinceId);
  if (!provinceId) return res.status(400).json({ error: 'provinceId phải là số dương.' });
  try {
    const rows = await getGhnClient().getDistricts(provinceId);
    res.json((rows ?? []).map((item) => ({ id: item.DistrictID, name: item.DistrictName, provinceId: item.ProvinceID })));
  } catch (error) {
    try { respondGhnError(res, error); } catch (unexpected) { next(unexpected); }
  }
});

router.get('/ghn/wards', async (req, res, next) => {
  const districtId = positiveInteger(req.query.districtId);
  if (!districtId) return res.status(400).json({ error: 'districtId phải là số dương.' });
  try {
    const rows = await getGhnClient().getWards(districtId);
    res.json((rows ?? []).map((item) => ({ code: item.WardCode, name: item.WardName, districtId: item.DistrictID })));
  } catch (error) {
    try { respondGhnError(res, error); } catch (unexpected) { next(unexpected); }
  }
});

router.post('/ghn/quote', async (req, res, next) => {
  const addressId = positiveInteger(req.body?.addressId);
  if (!addressId) return res.status(400).json({ error: 'addressId phải là số dương.' });
  try {
    const [[cart]] = await pool.query(
      "SELECT id, restaurant_id FROM carts WHERE customer_id = ? AND status = 'active' LIMIT 1",
      [req.auth.userId],
    );
    if (!cart) return res.status(400).json({ error: 'Giỏ hàng rỗng.', code: 'GHN_CART_NOT_READY' });

    const [[restaurant]] = await pool.query('SELECT id FROM restaurants WHERE id = ? LIMIT 1', [cart.restaurant_id]);
    const [[address]] = await pool.query(
      `SELECT id, ghn_province_id AS ghnProvinceId, ghn_district_id AS ghnDistrictId, ghn_ward_code AS ghnWardCode
       FROM customer_addresses WHERE id = ? AND customer_id = ? LIMIT 1`,
      [addressId, req.auth.userId],
    );
    if (!address) return res.status(404).json({ error: 'Không tìm thấy địa chỉ.' });

    const quote = await buildShippingQuote({ ghnClient: getGhnClient(), cart, restaurant, address });
    res.json({ quote });
  } catch (error) {
    try { respondGhnError(res, error); } catch (unexpected) { next(unexpected); }
  }
});

export default router;
