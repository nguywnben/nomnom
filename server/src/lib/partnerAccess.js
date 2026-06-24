/**
 * Quy tắc đối tác NomNom — đăng ký chéo merchant/driver và quyền dùng /app.
 *
 * - Pending merchant/driver: vẫn dùng /app như khách (customer).
 * - Active merchant / approved driver: không đặt món trên /app; không đăng ký vai trò còn lại.
 * - Pending một bên: chặn đăng ký bên kia.
 */

export async function loadPartnerStatus(db, userId) {
  const [restRows] = await db.query(
    'SELECT status FROM restaurants WHERE owner_user_id = ? LIMIT 1',
    [userId],
  );
  const [driverRows] = await db.query(
    'SELECT approval_status FROM driver_profiles WHERE user_id = ? LIMIT 1',
    [userId],
  );

  return {
    merchantRestaurantStatus: restRows[0]?.status ?? null,
    driverApprovalStatus: driverRows[0]?.approval_status ?? null,
  };
}

function resolveMerchantApplyBlockReason(merchantRestaurantStatus, driverApprovalStatus) {
  if (merchantRestaurantStatus === 'pending') {
    return 'Hồ sơ quán đang chờ duyệt. Bạn không thể gửi thêm hồ sơ quán mới.';
  }
  if (merchantRestaurantStatus === 'active') {
    return 'Bạn đã có quán đang hoạt động trên NomNom.';
  }
  if (driverApprovalStatus === 'pending') {
    return 'Hồ sơ tài xế đang chờ duyệt — không thể đăng ký quán ăn song song.';
  }
  if (driverApprovalStatus === 'approved' || driverApprovalStatus === 'suspended') {
    return 'Tài khoản đã là tài xế — không thể đăng ký quán ăn.';
  }
  return null;
}

function resolveDriverApplyBlockReason(merchantRestaurantStatus, driverApprovalStatus) {
  if (driverApprovalStatus === 'pending') {
    return 'Hồ sơ tài xế đang chờ duyệt. Bạn không thể gửi thêm hồ sơ tài xế.';
  }
  if (driverApprovalStatus === 'approved' || driverApprovalStatus === 'suspended') {
    return 'Bạn đã là tài xế trên NomNom.';
  }
  if (merchantRestaurantStatus === 'pending') {
    return 'Hồ sơ quán đang chờ duyệt — không thể đăng ký tài xế song song.';
  }
  if (merchantRestaurantStatus === 'active') {
    return 'Bạn đã có quán đang hoạt động — không thể đăng ký tài xế.';
  }
  return null;
}

function resolveCustomerShopBlockReason(merchantRestaurantStatus, driverApprovalStatus, roles) {
  if (!roles.includes('customer')) {
    return 'no_customer';
  }
  if (merchantRestaurantStatus === 'active') {
    return 'established_merchant';
  }
  if (driverApprovalStatus === 'approved' || driverApprovalStatus === 'suspended') {
    return 'established_driver';
  }
  return null;
}

/** @param {{ merchantRestaurantStatus: string|null, driverApprovalStatus: string|null }} partnerStatus */
export function evaluatePartnerAccess(partnerStatus, roles = []) {
  const merchantRestaurantStatus = partnerStatus.merchantRestaurantStatus ?? null;
  const driverApprovalStatus = partnerStatus.driverApprovalStatus ?? null;
  const roleSet = new Set(roles ?? []);

  const merchantApplyBlockReason = resolveMerchantApplyBlockReason(
    merchantRestaurantStatus,
    driverApprovalStatus,
  );
  const driverApplyBlockReason = resolveDriverApplyBlockReason(
    merchantRestaurantStatus,
    driverApprovalStatus,
  );
  const customerShopBlockReason = resolveCustomerShopBlockReason(
    merchantRestaurantStatus,
    driverApprovalStatus,
    roles,
  );

  return {
    merchantRestaurantStatus,
    driverApprovalStatus,
    canShopAsCustomer: customerShopBlockReason === null && roleSet.has('customer'),
    canApplyMerchant: merchantApplyBlockReason === null,
    canApplyDriver: driverApplyBlockReason === null,
    merchantApplyBlockReason,
    driverApplyBlockReason,
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

export function assertCanApplyDriver(access) {
  if (!access.canApplyDriver) {
    const err = new Error(access.driverApplyBlockReason ?? 'Không thể đăng ký tài xế.');
    err.status = 409;
    throw err;
  }
}

export function assertCanResubmitRejectedDriver(partnerStatus) {
  const status = partnerStatus.driverApprovalStatus;
  if (status === 'pending') {
    const err = new Error('Hồ sơ tài xế đang chờ duyệt. Bạn không thể gửi thêm hồ sơ tài xế.');
    err.status = 409;
    throw err;
  }
  if (status === 'approved' || status === 'suspended') {
    const err = new Error('Bạn đã là tài xế trên NomNom.');
    err.status = 409;
    throw err;
  }
}
