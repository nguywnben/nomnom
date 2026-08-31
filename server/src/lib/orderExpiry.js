/**
 * Paid orders require a confirmed gateway/manual refund before cancellation.
 * The background expiry worker may only cancel orders that have no captured funds.
 */
export function canAutomaticallyCancelOrder({ paymentStatus } = {}) {
  return paymentStatus !== 'paid';
}
