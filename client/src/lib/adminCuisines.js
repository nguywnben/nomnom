const INVALID_CUISINE_DATA = 'Dữ liệu loại hình ẩm thực không hợp lệ.';

export function unwrapAdminCuisines(payload) {
  if (!Array.isArray(payload?.data)) {
    throw new Error(INVALID_CUISINE_DATA);
  }
  return payload.data;
}

export function unwrapAdminCuisine(payload) {
  if (!payload?.cuisine || typeof payload.cuisine !== 'object') {
    throw new Error(INVALID_CUISINE_DATA);
  }
  return payload.cuisine;
}
