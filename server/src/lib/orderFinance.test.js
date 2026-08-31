import assert from 'node:assert/strict';
import test from 'node:test';

import { calculateOrderFinance } from './orderFinance.js';

test('three-role finance assigns delivery fee to platform operations', () => {
  const finance = calculateOrderFinance({
    subtotal: 200_000,
    deliveryFee: 20_000,
    discountAmount: 0,
    commissionRate: 15,
    isMerchantVoucher: false,
  });

  assert.deepEqual(finance, {
    merchantBillableSubtotal: 200_000,
    platformCommission: 30_000,
    merchantEarning: 170_000,
    platformFee: 50_000,
    platformFundedDiscount: 0,
  });
  assert.equal(finance.merchantEarning + finance.platformFee, 220_000);
});

test('merchant-funded voucher reduces merchant billable subtotal', () => {
  const finance = calculateOrderFinance({
    subtotal: 200_000,
    deliveryFee: 20_000,
    discountAmount: 40_000,
    commissionRate: 10,
    isMerchantVoucher: true,
  });

  assert.equal(finance.merchantEarning, 144_000);
  assert.equal(finance.platformFee, 36_000);
  assert.equal(finance.platformFundedDiscount, 0);
  assert.equal(finance.merchantEarning + finance.platformFee, 180_000);
});

test('platform-funded voucher is tracked as subsidy for reconciliation', () => {
  const finance = calculateOrderFinance({
    subtotal: 200_000,
    deliveryFee: 20_000,
    discountAmount: 40_000,
    commissionRate: 10,
    isMerchantVoucher: false,
  });

  assert.equal(finance.merchantEarning, 180_000);
  assert.equal(finance.platformFee, 40_000);
  assert.equal(finance.platformFundedDiscount, 40_000);
  assert.equal(finance.merchantEarning + finance.platformFee - finance.platformFundedDiscount, 180_000);
});

test('finance rejects invalid or fractional VND inputs', () => {
  assert.throws(() => calculateOrderFinance({
    subtotal: 10.5,
    deliveryFee: 0,
    discountAmount: 0,
    commissionRate: 10,
  }), /ORDER_FINANCE_INVALID/);
});
