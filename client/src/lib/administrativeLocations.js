export function createAdministrativeLocationsApi(get) {
  return {
    getProvinces: async () => (await get('/api/v1/locations/provinces')).items,
    getDistricts: async (provinceCode) => (await get(`/api/v1/locations/provinces/${encodeURIComponent(provinceCode)}/districts`)).items,
    getWards: async (districtCode) => (await get(`/api/v1/locations/districts/${encodeURIComponent(districtCode)}/wards`)).items,
  };
}
