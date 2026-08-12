import { Router } from 'express';

const router = Router();
const SOURCE_URL = 'https://provinces.open-api.vn/api/v2/?depth=2';
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
let cache = { expiresAt: 0, provinces: [] };

async function loadProvinces() {
  if (cache.expiresAt > Date.now() && cache.provinces.length) return cache.provinces;
  const response = await fetch(SOURCE_URL, { signal: AbortSignal.timeout(8000) });
  if (!response.ok) throw new Error('Không thể tải danh mục địa giới hành chính.');
  const provinces = await response.json();
  if (!Array.isArray(provinces)) throw new Error('Dữ liệu địa giới hành chính không hợp lệ.');
  cache = { provinces, expiresAt: Date.now() + CACHE_TTL_MS };
  return provinces;
}

function mapProvince(item) { return { code: String(item.code), name: item.name }; }
function mapWard(item) { return { code: String(item.code), name: item.name }; }

router.get('/provinces/:provinceCode/wards', async (req, res, next) => {
  try {
    const province = (await loadProvinces()).find((item) => String(item.code) === req.params.provinceCode);
    if (!province) return res.status(404).json({ error: 'Không tìm thấy Tỉnh/Thành phố.' });
    return res.json({ items: (province.wards ?? []).map(mapWard) });
  } catch (error) { return next(error); }
});

router.get('/provinces', async (_req, res, next) => {
  try { return res.json({ items: (await loadProvinces()).map(mapProvince) }); } catch (error) { return next(error); }
});

export default router;
