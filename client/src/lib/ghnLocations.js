export function createGhnLocationsApi(get, post) {
  return {
    getProvinces: () => get('/api/v1/shipping/ghn/provinces'),
    getDistricts: (provinceId) => get(`/api/v1/shipping/ghn/districts?provinceId=${encodeURIComponent(provinceId)}`),
    getWards: (districtId) => get(`/api/v1/shipping/ghn/wards?districtId=${encodeURIComponent(districtId)}`),
    quote: (addressId) => post('/api/v1/shipping/ghn/quote', { addressId }),
  };
}
