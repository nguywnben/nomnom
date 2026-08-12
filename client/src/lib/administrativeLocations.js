export function createAdministrativeLocationsApi(get) {
  return {
    getProvinces: async () => (await get('/api/v1/locations/provinces')).items,
    getWards: async (provinceCode) => (await get(`/api/v1/locations/provinces/${encodeURIComponent(provinceCode)}/wards`)).items,
  };
}
