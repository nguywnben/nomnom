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

  const city = String(body?.city ?? '').trim();
  const district = String(body?.district ?? '').trim();
  const ward = String(body?.ward ?? '').trim();
  if (!city || !district || !ward) {
    const error = new Error('Vui lòng nhập đầy đủ Tỉnh/Thành, Quận/Huyện và Phường/Xã.');
    error.status = 400;
    throw error;
  }

  return { addressLine, city, district, ward };
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
      latitude: row.current_latitude === null ? null : Number(row.current_latitude),
      longitude: row.current_longitude === null ? null : Number(row.current_longitude),
    },
    proposedAddress: {
      addressLine: row.proposed_address_line,
      ward: row.proposed_ward,
      district: row.proposed_district,
      city: row.proposed_city,
      latitude: row.proposed_latitude === null ? null : Number(row.proposed_latitude),
      longitude: row.proposed_longitude === null ? null : Number(row.proposed_longitude),
    },
    rejectionReason: row.rejection_reason ?? null,
    createdAt: row.created_at,
    reviewedAt: row.reviewed_at ?? null,
  };
}
