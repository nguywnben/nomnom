import test from 'node:test';
import assert from 'node:assert/strict';
import { validatePlatformConfig } from './platformConfig.js';

test('platform config accepts supported values and preserves the declared type', () => {
  assert.deepEqual(validatePlatformConfig('default_commission_rate', '14.5'), { ok: true, value: '14.5', numeric: 14.5, dataType: 'decimal' });
  assert.equal(validatePlatformConfig('min_payout_amount', '150000').ok, true);
});

test('platform config rejects unknown, fractional integer, and out-of-range values', () => {
  assert.equal(validatePlatformConfig('secret_key', '1').reason, 'unsupported_key');
  assert.equal(validatePlatformConfig('min_payout_amount', '10000.5').reason, 'integer_required');
  assert.equal(validatePlatformConfig('default_commission_rate', '80').reason, 'out_of_range');
});
