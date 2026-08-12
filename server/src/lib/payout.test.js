import test from 'node:test';
import assert from 'node:assert/strict';
import { maskBankAccount, resolvePayoutTransition, validatePayoutRequest } from './payout.js';

test('payout validation reserves only available wallet balance', () => {
  assert.equal(validatePayoutRequest({ amount: 400000, balance: 1000000, pendingBalance: 500000, minAmount: 100000, isLocked: false }).ok, true);
  assert.equal(validatePayoutRequest({ amount: 600000, balance: 1000000, pendingBalance: 500000, minAmount: 100000, isLocked: false }).reason, 'insufficient_balance');
});

test('payout validation rejects locked, small, and non-integer requests', () => {
  assert.equal(validatePayoutRequest({ amount: 100000, balance: 1000000, pendingBalance: 0, minAmount: 100000, isLocked: true }).reason, 'wallet_locked');
  assert.equal(validatePayoutRequest({ amount: 99999, balance: 1000000, pendingBalance: 0, minAmount: 100000, isLocked: false }).reason, 'below_minimum');
  assert.equal(validatePayoutRequest({ amount: 10.5, balance: 1000000, pendingBalance: 0, minAmount: 100000, isLocked: false }).reason, 'invalid_amount');
});

test('payout state machine is strict and idempotent', () => {
  assert.deepEqual(resolvePayoutTransition('pending', 'approve'), { ok: true, idempotent: false, status: 'approved' });
  assert.deepEqual(resolvePayoutTransition('approved', 'approve'), { ok: true, idempotent: true, status: 'approved' });
  assert.equal(resolvePayoutTransition('completed', 'reject').reason, 'invalid_transition');
});

test('bank account masking exposes only the final four digits', () => {
  assert.equal(maskBankAccount('037000118822'), '*** 8822');
  assert.equal(maskBankAccount(''), null);
});
