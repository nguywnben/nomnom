export function validateAddressChangePayload(body) {
  const addressLine = String(body?.addressLine ?? '').trim();

  if (!addressLine) {
    const error = new Error('Vui lòng nhập địa chỉ cụ thể.');
    error.status = 400;
    throw error;
  }

  if (addressLine.length > 500) {
    const error = new Error('Địa chỉ cụ thể vượt quá độ dài cho phép.');
    error.status = 400;
    throw error;
  }

  const ghnProvinceId = Number(body?.ghnProvinceId);
  const ghnDistrictId = Number(body?.ghnDistrictId);
  const ghnWardCode = String(body?.ghnWardCode ?? '').trim();
  if (!Number.isInteger(ghnProvinceId) || ghnProvinceId <= 0
    || !Number.isInteger(ghnDistrictId) || ghnDistrictId <= 0 || !ghnWardCode) {
    const error = new Error('Vui lòng chọn đầy đủ Tỉnh/Thành, Quận/Huyện và Phường/Xã theo GHN.');
    error.status = 400;
    throw error;
  }

  return { addressLine, ghnProvinceId, ghnDistrictId, ghnWardCode };
}

export function serializeAddressChangeRequest(row) {
  if (!row) return null;

  return {
    id: Number(row.id),
    restaurantId: Number(row.restaurant_id),
    restaurantName: row.restaurant_name ?? null,
    ownerName: row.owner_name ?? null,
    status: row.status,
    currentAddress: {
      addressLine: row.current_address_line,
      ward: row.current_ward,
      district: row.current_district,
      city: row.current_city,
      ghnProvinceId: row.current_ghn_province_id === null ? null : Number(row.current_ghn_province_id),
      ghnDistrictId: row.current_ghn_district_id === null ? null : Number(row.current_ghn_district_id),
      ghnWardCode: row.current_ghn_ward_code ?? null,
    },
    proposedAddress: {
      addressLine: row.proposed_address_line,
      ward: row.proposed_ward,
      district: row.proposed_district,
      city: row.proposed_city,
      ghnProvinceId: Number(row.proposed_ghn_province_id),
      ghnDistrictId: Number(row.proposed_ghn_district_id),
      ghnWardCode: row.proposed_ghn_ward_code,
    },
    rejectionReason: row.rejection_reason ?? null,
    createdAt: row.created_at,
    reviewedAt: row.reviewed_at ?? null,
  };
}
