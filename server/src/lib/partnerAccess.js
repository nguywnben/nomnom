/**
 * Quy tắc đối tác NomNom cho chủ quán và quyền dùng /app.
 *
 * - Chủ quán đang chờ duyệt vẫn dùng /app như khách.
 * - Chủ quán đã hoạt động không đặt món trên /app và không thể đăng ký thêm quán.
 */

export async function loadPartnerStatus(db, userId) {
  const [restRows] = await db.query(
    'SELECT status FROM restaurants WHERE owner_user_id = ? LIMIT 1',
    [userId],
  );
  return {
    merchantRestaurantStatus: restRows[0]?.status ?? null,
  };
}

function resolveMerchantApplyBlockReason(merchantRestaurantStatus) {
  if (merchantRestaurantStatus === 'pending') {
    return 'Hồ sơ quán đang chờ duyệt. Bạn không thể gửi thêm hồ sơ quán mới.';
  }
  if (merchantRestaurantStatus === 'active') {
    return 'Bạn đã có quán đang hoạt động trên NomNom.';
  }
  return null;
}

function resolveCustomerShopBlockReason(merchantRestaurantStatus, roles) {
  if (!roles.includes('customer')) {
    return 'no_customer';
  }
  if (merchantRestaurantStatus === 'active') {
    return 'established_merchant';
  }
  return null;
}

/** @param {{ merchantRestaurantStatus: string|null }} partnerStatus */
export function evaluatePartnerAccess(partnerStatus, roles = []) {
  const merchantRestaurantStatus = partnerStatus.merchantRestaurantStatus ?? null;
  const roleSet = new Set(roles ?? []);

  const merchantApplyBlockReason = resolveMerchantApplyBlockReason(merchantRestaurantStatus);
  const customerShopBlockReason = resolveCustomerShopBlockReason(
    merchantRestaurantStatus,
    roles,
  );

  return {
    merchantRestaurantStatus,
    canShopAsCustomer: customerShopBlockReason === null && roleSet.has('customer'),
    canApplyMerchant: merchantApplyBlockReason === null,
    merchantApplyBlockReason,
    customerShopBlockReason,
  };
}

export async function loadPartnerAccess(db, userId, roles) {
  const partnerStatus = await loadPartnerStatus(db, userId);
  return evaluatePartnerAccess(partnerStatus, roles);
}

export function assertCanApplyMerchant(access) {
  if (!access.canApplyMerchant) {
    const err = new Error(access.merchantApplyBlockReason ?? 'Không thể đăng ký quán ăn.');
    err.status = 409;
    throw err;
  }
}

