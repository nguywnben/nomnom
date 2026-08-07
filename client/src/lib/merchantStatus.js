const STATUS_ALIASES = {
  pending: 'under_review',
  submitted: 'under_review',
  active: 'approved',
  suspended: 'rejected',
  closed: 'rejected',
};

function normalizeStatusValue(status) {
  return String(status ?? '').trim().toLowerCase();
}

export function normalizeMerchantRestaurantStatus(status) {
  const value = normalizeStatusValue(status);
  return STATUS_ALIASES[value] ?? value;
}

export function isMerchantRestaurantApproved(status) {
  return normalizeMerchantRestaurantStatus(status) === 'approved';
}

export function isMerchantRestaurantUnderReview(status) {
  return normalizeMerchantRestaurantStatus(status) === 'under_review';
}

export function isMerchantRestaurantRejected(status) {
  return normalizeMerchantRestaurantStatus(status) === 'rejected';
}