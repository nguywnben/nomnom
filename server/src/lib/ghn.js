export class GhnProviderError extends Error {
  constructor(message = 'Không thể kết nối GHN.') {
    super(message);
    this.name = 'GhnProviderError';
    this.code = 'GHN_PROVIDER_ERROR';
  }
}

export function createGhnClient({ token, shopId, baseUrl, fetchImpl = fetch }) {
  const normalizedBaseUrl = String(baseUrl ?? '').replace(/\/$/, '');
  const normalizedShopId = Number(shopId);

  if (!token || !normalizedBaseUrl || !Number.isInteger(normalizedShopId) || normalizedShopId <= 0) {
    throw new GhnProviderError('Cấu hình GHN chưa đầy đủ.');
  }

  async function request(path, { method = 'GET', body, shopHeader = false } = {}) {
    let response;
    try {
      response = await fetchImpl(`${normalizedBaseUrl}${path}`, {
        method,
        headers: {
          Token: token,
          ...(shopHeader ? { ShopId: String(normalizedShopId) } : {}),
          ...(body ? { 'Content-Type': 'application/json' } : {}),
        },
        ...(body ? { body: JSON.stringify(body) } : {}),
      });
    } catch {
      throw new GhnProviderError();
    }

    let payload;
    try {
      payload = await response.json();
    } catch {
      throw new GhnProviderError('Phản hồi GHN không hợp lệ.');
    }

    if (!response.ok || payload?.code !== 200) {
      throw new GhnProviderError();
    }
    return payload.data;
  }

  return {
    getProvinces: () => request('/master-data/province'),
    getDistricts: (provinceId) => request(`/master-data/district?province_id=${encodeURIComponent(provinceId)}`),
    getWards: (districtId) => request(`/master-data/ward?district_id=${encodeURIComponent(districtId)}`),
    getAvailableServices: (fromDistrictId, toDistrictId) => request('/v2/shipping-order/available-services', {
      method: 'POST',
      body: { shop_id: normalizedShopId, from_district: fromDistrictId, to_district: toDistrictId },
    }),
    async getShop() {
      const shops = await request('/v2/shop/all', { method: 'POST', body: { offset: 0, limit: 50 } });
      const shop = shops?.find((item) => Number(item._id) === normalizedShopId);
      if (!shop) throw new GhnProviderError('Không tìm thấy Shop GHN đã cấu hình.');
      return shop;
    },
    quote: ({ serviceId, fromDistrictId, toDistrictId, toWardCode }) => request('/v2/shipping-order/fee', {
      method: 'POST',
      shopHeader: true,
      body: {
        service_id: serviceId,
        service_type_id: 2,
        from_district_id: fromDistrictId,
        to_district_id: toDistrictId,
        to_ward_code: toWardCode,
        weight: 500,
        length: 20,
        width: 20,
        height: 10,
        insurance_value: 0,
      },
    }),
  };
}
