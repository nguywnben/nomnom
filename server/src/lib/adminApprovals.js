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

function maskBankAccount(value) {
  const digits = String(value ?? '').trim();
  return digits.length > 4 ? `*** ${digits.slice(-4)}` : digits || null;
}

export function serializeRestaurantRow(row, { includeBankAccountNo = false } = {}) {
  return {
    id: Number(row.id),
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
    minOrderAmount: Number(row.min_order_amount ?? 0),
    avgPrepTimeMin: Number(row.avg_prep_time_min ?? 0),
    latitude: row.latitude === null ? null : Number(row.latitude),
    longitude: row.longitude === null ? null : Number(row.longitude),
    bankName: row.bank_name || null,
    bankAccountMasked: maskBankAccount(row.bank_account_no),
    bankAccountHolder: row.bank_account_holder || null,
    ...(includeBankAccountNo ? { bankAccountNo: row.bank_account_no || null } : {}),
    status: row.status,
    isOpenNow: Boolean(row.is_open_now),
    ratingAvg: Number(row.rating_avg ?? 0),
    reviewCount: Number(row.review_count ?? 0),
    rejectionReason: row.rejection_reason,
    approvedAt: row.approved_at,
    createdAt: row.created_at,
    ownerUserId: row.owner_user_id,
    ownerName: row.owner_name,
    ownerEmail: row.owner_email,
    cuisine: row.cuisine_name,
    submittedAt: row.created_at,
  };
}

