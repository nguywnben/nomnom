const GUEST_CART_KEY = 'nomnom_guest_cart';

export function loadGuestCart() {
  if (typeof localStorage === 'undefined') return null;
  try {
    const raw = localStorage.getItem(GUEST_CART_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || !Array.isArray(parsed.items)) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveGuestCart(cart) {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(GUEST_CART_KEY, JSON.stringify(cart));
  } catch {
    // ignore quota errors
  }
}

export function clearGuestCart() {
  if (typeof localStorage === 'undefined') return;
  localStorage.removeItem(GUEST_CART_KEY);
}
