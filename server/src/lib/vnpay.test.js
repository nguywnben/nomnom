import assert from 'node:assert/strict';
import test from 'node:test';

import {
  buildPaymentUrl,
  buildRefundPayload,
  formatVnpayDate,
  signPipeFields,
  signQueryParams,
  verifyQuerySignature,
  verifyRefundResponse,
} from './vnpay.js';

const SECRET = 'sandbox-secret';

test('formatVnpayDate formats an instant in GMT+7', () => {
  assert.equal(formatVnpayDate(new Date('2026-08-03T12:34:56.000Z')), '20260803193456');
});

test('payment URL signs sorted encoded query parameters', () => {
  const result = buildPaymentUrl({
    paymentUrl: 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html',
    secret: SECRET,
    tmnCode: 'DEMO1234',
    txnRef: 'ORD-ABC-1',
    amount: 125000,
    returnUrl: 'http://localhost:5173/app/checkout/vnpay/return',
    ipAddress: '127.0.0.1',
    now: new Date('2026-08-03T12:34:56.000Z'),
  });

  const url = new URL(result.paymentUrl);
  const params = Object.fromEntries(url.searchParams.entries());
  assert.equal(params.vnp_Amount, '12500000');
  assert.equal(params.vnp_TxnRef, 'ORD-ABC-1');
  assert.equal(params.vnp_ExpireDate, '20260803194956');
  assert.equal(verifyQuerySignature(params, SECRET), true);
});

test('query verification rejects a changed amount', () => {
  const params = {
    vnp_Amount: '1000000',
    vnp_ResponseCode: '00',
    vnp_TransactionStatus: '00',
    vnp_TxnRef: 'ORDER-1',
  };
  params.vnp_SecureHash = signQueryParams(params, SECRET);
  assert.equal(verifyQuerySignature(params, SECRET), true);
  assert.equal(verifyQuerySignature({ ...params, vnp_Amount: '999999' }, SECRET), false);
});

test('refund payload follows the documented pipe-delimited checksum contract', () => {
  const payload = buildRefundPayload({
    secret: SECRET,
    tmnCode: 'DEMO1234',
    requestId: 'REFUND-1',
    txnRef: 'ORDER-1',
    amount: 125000,
    transactionNo: '14567890',
    transactionDate: '20260803193456',
    createBy: 'admin-1',
    ipAddress: '127.0.0.1',
    now: new Date('2026-08-03T12:40:00.000Z'),
  });

  assert.equal(payload.vnp_Amount, '12500000');
  assert.equal(payload.vnp_Command, 'refund');
  assert.match(payload.vnp_SecureHash, /^[a-f0-9]{128}$/);
});

test('refund response checksum detects tampering', () => {
  const response = {
    vnp_ResponseId: 'RSP-1',
    vnp_Command: 'refund',
    vnp_ResponseCode: '00',
    vnp_Message: 'Success',
    vnp_TmnCode: 'DEMO1234',
    vnp_TxnRef: 'ORDER-1',
    vnp_Amount: '12500000',
    vnp_BankCode: 'NCB',
    vnp_PayDate: '20260803194000',
    vnp_TransactionNo: '998877',
    vnp_TransactionType: '02',
    vnp_TransactionStatus: '00',
    vnp_OrderInfo: 'Hoan tien ORDER-1',
  };
  response.vnp_SecureHash = signPipeFields(response, [
    'vnp_ResponseId',
    'vnp_Command',
    'vnp_ResponseCode',
    'vnp_Message',
    'vnp_TmnCode',
    'vnp_TxnRef',
    'vnp_Amount',
    'vnp_BankCode',
    'vnp_PayDate',
    'vnp_TransactionNo',
    'vnp_TransactionType',
    'vnp_TransactionStatus',
    'vnp_OrderInfo',
  ], SECRET);

  assert.equal(verifyRefundResponse(response, SECRET), true);
  assert.equal(verifyRefundResponse({ ...response, vnp_Amount: '1' }, SECRET), false);
});
