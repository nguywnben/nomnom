export const PLATFORM_CONFIG_RULES = Object.freeze({
  default_commission_rate: { dataType: 'decimal', min: 0, max: 50 },
  default_driver_share: { dataType: 'decimal', min: 0, max: 100 },
  max_search_radius_km: { dataType: 'decimal', min: 1, max: 100 },
  min_payout_amount: { dataType: 'int', min: 10000, max: 1000000000 },
  order_auto_cancel_minutes: { dataType: 'int', min: 1, max: 120 },
});

export function validatePlatformConfig(key, rawValue) {
  const rule = PLATFORM_CONFIG_RULES[key];
  if (!rule) return { ok: false, reason: 'unsupported_key' };
  const numeric = Number(rawValue);
  if (!Number.isFinite(numeric)) return { ok: false, reason: 'invalid_number' };
  if (rule.dataType === 'int' && !Number.isSafeInteger(numeric)) {
    return { ok: false, reason: 'integer_required' };
  }
  if (numeric < rule.min || numeric > rule.max) {
    return { ok: false, reason: 'out_of_range', min: rule.min, max: rule.max };
  }
  return { ok: true, value: String(numeric), numeric, dataType: rule.dataType };
}
