export async function ensureWallet(conn, userId, ownerType) {
  const [existing] = await conn.query(
    'SELECT id FROM wallets WHERE user_id = ? AND owner_type = ? LIMIT 1',
    [userId, ownerType],
  );
  if (existing.length) return existing[0].id;

  const [result] = await conn.query(
    'INSERT INTO wallets (user_id, owner_type) VALUES (?, ?)',
    [userId, ownerType],
  );
  return result.insertId;
}

export async function insertNotification(conn, { userId, title, body, linkUrl }) {
  const safeBody = String(body ?? '').slice(0, 500);
  await conn.query(
    `INSERT INTO notifications (user_id, type, title, body, link_url)
     VALUES (?, 'kyc_status', ?, ?, ?)`,
    [userId, title, safeBody, linkUrl ?? null],
  );
}

export function serializeRestaurantRow(row) {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    phone: row.phone,
    tagline: row.tagline,
    description: row.description,
    city: row.city,
    district: row.district,
    ward: row.ward,
    addressLine: row.address_line,
    logoUrl: row.logo_url,
    bannerUrl: row.banner_url,
    businessLicenseUrl: row.business_license_url,
    foodSafetyCertUrl: row.food_safety_cert_url,
    status: row.status,
    rejectionReason: row.rejection_reason,
    ownerUserId: row.owner_user_id,
    ownerName: row.owner_name,
    ownerEmail: row.owner_email,
    cuisine: row.cuisine_name,
    submittedAt: row.created_at,
  };
}

export function serializeDriverRow(row) {
  return {
    userId: row.user_id,
    fullName: row.full_name,
    email: row.email,
    phone: row.user_phone ?? row.phone,
    nationalId: row.national_id,
    vehicleType: row.vehicle_type,
    vehicleModel: row.vehicle_model,
    licensePlate: row.license_plate,
    idCardUrl: row.id_card_url,
    driverLicenseUrl: row.driver_license_url,
    portraitUrl: row.portrait_url,
    approvalStatus: row.approval_status,
    submittedAt: row.created_at,
    docs: {
      idCard: Boolean(row.id_card_url),
      license: Boolean(row.driver_license_url),
      portrait: Boolean(row.portrait_url),
    },
  };
}
