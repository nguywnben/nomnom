/**
 * Giỏ hàng & đặt món trên /app — guest, customer chưa là đối tác chính thức,
 * hoặc customer đang chờ duyệt quán ăn.
 */

const RESTRICTION_BY_ROLE = {
  admin: {
    title: 'Không thể đặt món',
    message:
      'Tài khoản quản trị viên dùng để vận hành hệ thống NomNom, không dùng để đặt đồ ăn. Vui lòng đăng xuất và dùng tài khoản khách hàng hoặc duyệt không đăng nhập.',
  },
  merchant: {
    title: 'Không thể đặt món',
    message:
      'Tài khoản đối tác quán ăn dùng để quản lý quán trên NomNom, không dùng để đặt đồ ăn. Vui lòng đăng xuất và dùng tài khoản khách hàng.',
  },
};

const RESTRICTION_BY_PARTNER = {
  established_merchant: {
    title: 'Không thể đặt món',
    message:
      'Tài khoản đối tác quán ăn không dùng để đặt đồ ăn trên NomNom. Hãy dùng khu vực quản lý quán hoặc đăng xuất và dùng tài khoản khách hàng khác.',
  },
  legacy_partner: {
    title: 'Không thể đặt món',
    message:
      'Tài khoản đối tác hoặc quản trị không dùng để đặt món. Hãy đăng xuất và dùng tài khoản khách hàng.',
  },
};

/** @param {{ partnerAccess?: { canShopAsCustomer?: boolean } } | null} user */
export function canShopAsCustomer(user, permittedRoles) {
  if (!user) return true;
  if (user.partnerAccess && typeof user.partnerAccess.canShopAsCustomer === 'boolean') {
    return user.partnerAccess.canShopAsCustomer;
  }
  return Boolean(permittedRoles?.customer);
}

/** @param {{ primaryRole?: string, roles?: string[], partnerAccess?: { customerShopBlockReason?: string } } | null} user */
export function getCustomerCartRestriction(user, permittedRoles) {
  if (!user || canShopAsCustomer(user, permittedRoles)) return null;

  const partnerBlock = user.partnerAccess?.customerShopBlockReason;
  if (partnerBlock && RESTRICTION_BY_PARTNER[partnerBlock]) {
    return RESTRICTION_BY_PARTNER[partnerBlock];
  }

  if (permittedRoles?.admin) return RESTRICTION_BY_ROLE.admin;
  if (permittedRoles?.merchant) return RESTRICTION_BY_ROLE.merchant;

  return {
    title: 'Không thể đặt món',
    message: 'Tài khoản này không có quyền khách hàng. Vui lòng đăng xuất và dùng tài khoản khách hàng.',
  };
}
