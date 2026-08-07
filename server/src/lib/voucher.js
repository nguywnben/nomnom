function reject(reason, extra = {}) {
  return { ok: false, reason, ...extra };
}

function asAmount(value) {
  const amount = Number(value);
  return Number.isFinite(amount) ? Math.max(0, amount) : 0;
}

export function evaluateVoucher(voucher, {
  subtotal,
  restaurantId,
  totalUsage = 0,
  customerUsage = 0,
  now = new Date(),
}) {
  if (!voucher) return reject('not_found');
  if (String(voucher.status).toLowerCase() !== 'active') return reject('inactive');
  if (voucher.restaurant_id !== null && voucher.restaurant_id !== undefined
      && Number(voucher.restaurant_id) !== Number(restaurantId)) return reject('wrong_restaurant');

  const currentTime = now.getTime();
  const startsAt = voucher.starts_at ? new Date(voucher.starts_at).getTime() : null;
  const endsAt = voucher.ends_at ? new Date(voucher.ends_at).getTime() : null;
  if ((startsAt && currentTime < startsAt) || (endsAt && currentTime > endsAt)) {
    return reject('expired');
  }

  if (voucher.usage_limit !== null && voucher.usage_limit !== undefined
      && Number(totalUsage) >= Number(voucher.usage_limit)) {
    return reject('usage_limit_reached');
  }
  if (voucher.per_user_limit !== null && voucher.per_user_limit !== undefined
      && Number(customerUsage) >= Number(voucher.per_user_limit)) {
    return reject('per_user_limit_reached');
  }

  const orderSubtotal = asAmount(subtotal);
  const minimum = asAmount(voucher.min_order_amount);
  if (orderSubtotal < minimum) return reject('min_order_not_met', { minOrder: minimum });

  let discountAmount;
  if (voucher.discount_type === 'percent') {
    discountAmount = Math.floor(orderSubtotal * asAmount(voucher.discount_value) / 100);
    if (voucher.max_discount_amount !== null && voucher.max_discount_amount !== undefined) {
      discountAmount = Math.min(discountAmount, asAmount(voucher.max_discount_amount));
    }
  } else if (voucher.discount_type === 'fixed') {
    discountAmount = asAmount(voucher.discount_value);
  } else {
    return reject('invalid_discount_type');
  }

  return {
    ok: true,
    discountAmount: Math.min(orderSubtotal, discountAmount),
  };
}
