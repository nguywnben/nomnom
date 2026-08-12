export function validateGhnAddressCodes(payload, { required = true } = {}) {
  const hasAnyCode = ['ghnProvinceId', 'ghnDistrictId', 'ghnWardCode']
    .some((key) => payload[key] !== undefined);

  if (!hasAnyCode && !required) return { ok: true, codes: null };

  const ghnProvinceId = Number(payload.ghnProvinceId);
  const ghnDistrictId = Number(payload.ghnDistrictId);
  const ghnWardCode = String(payload.ghnWardCode ?? '').trim();

  if (!Number.isInteger(ghnProvinceId) || ghnProvinceId <= 0
    || !Number.isInteger(ghnDistrictId) || ghnDistrictId <= 0 || !ghnWardCode) {
    return { ok: false, error: 'Vui lòng chọn đầy đủ Tỉnh/Thành, Quận/Huyện và Phường/Xã theo GHN.' };
  }

  return { ok: true, codes: { ghnProvinceId, ghnDistrictId, ghnWardCode } };
}
