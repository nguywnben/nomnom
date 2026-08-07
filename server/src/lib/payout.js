export const PAYOUT_ACTIONS = Object.freeze({
  approve: { from: 'pending', to: 'approved' },
  reject: { from: 'pending', to: 'rejected' },
  complete: { from: 'approved', to: 'completed' },
});

export function validatePayoutRequest({ amount, balance, pendingBalance, minAmount, isLocked }) {
  const value = Number(amount);
  if (!Number.isSafeInteger(value) || value <= 0) {
    return { ok: false, reason: 'invalid_amount' };
  }
  if (isLocked) return { ok: false, reason: 'wallet_locked' };
  if (value < Number(minAmount)) {
    return { ok: false, reason: 'below_minimum', minAmount: Number(minAmount) };
  }
  const availableBalance = Math.max(0, Number(balance) - Number(pendingBalance));
  if (value > availableBalance) {
    return { ok: false, reason: 'insufficient_balance', availableBalance };
  }
  return { ok: true, amount: value, availableBalance };
}

export function resolvePayoutTransition(status, action) {
  const transition = PAYOUT_ACTIONS[action];
  if (!transition) return { ok: false, reason: 'invalid_action' };
  if (status === transition.to) return { ok: true, idempotent: true, status };
  if (status !== transition.from) return { ok: false, reason: 'invalid_transition' };
  return { ok: true, idempotent: false, status: transition.to };
}

export function maskBankAccount(accountNumber) {
  const digits = String(accountNumber || '').replace(/s+/g, '');
  return digits ? '*** ' + digits.slice(-4) : null;
}
