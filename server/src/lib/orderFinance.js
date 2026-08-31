function requireWholeVnd(value) {
  const amount = Number(value);
  if (!Number.isSafeInteger(amount) || amount < 0) {
    const error = new Error('ORDER_FINANCE_INVALID');
    error.code = 'ORDER_FINANCE_INVALID';
    throw error;
  }
  return amount;
}

export function calculateOrderFinance({
  subtotal,
  deliveryFee,
  discountAmount,
  commissionRate,
  isMerchantVoucher = false,
}) {
  const safeSubtotal = requireWholeVnd(subtotal);
  const safeDeliveryFee = requireWholeVnd(deliveryFee);
  const safeDiscountAmount = requireWholeVnd(discountAmount);
  const safeCommissionRate = Number(commissionRate);

  if (!Number.isFinite(safeCommissionRate) || safeCommissionRate < 0 || safeCommissionRate > 100) {
    const error = new Error('ORDER_FINANCE_INVALID');
    error.code = 'ORDER_FINANCE_INVALID';
    throw error;
  }

  const merchantBillableSubtotal = isMerchantVoucher
    ? Math.max(0, safeSubtotal - safeDiscountAmount)
    : safeSubtotal;
  const platformCommission = Math.floor(merchantBillableSubtotal * safeCommissionRate / 100);

  return {
    merchantBillableSubtotal,
    platformCommission,
    merchantEarning: merchantBillableSubtotal - platformCommission,
    platformFee: platformCommission + safeDeliveryFee,
    platformFundedDiscount: isMerchantVoucher ? 0 : safeDiscountAmount,
  };
}
