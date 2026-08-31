import assert from 'node:assert/strict';
import test from 'node:test';

import { classifyRefundGatewayResult, classifyRefundTransportError } from './refundState.js';

test('confirmed signed VNPay success completes the refund', () => {
  assert.deepEqual(classifyRefundGatewayResult({
    httpOk: true,
    signatureValid: true,
    response: {
      vnp_ResponseCode: '00',
      vnp_TransactionStatus: '00',
      vnp_TransactionNo: '14000001',
    },
  }), {
    status: 'succeeded',
    transactionNo: '14000001',
    reason: null,
  });
});

test('signed VNPay rejection is a terminal failure that may be retried', () => {
  const result = classifyRefundGatewayResult({
    httpOk: true,
    signatureValid: true,
    response: { vnp_ResponseCode: '91', vnp_Message: 'Transaction not found' },
  });

  assert.equal(result.status, 'failed');
  assert.match(result.reason, /Transaction not found/);
});

test('invalid or unverifiable gateway response remains pending to prevent a double refund', () => {
  const result = classifyRefundGatewayResult({
    httpOk: true,
    signatureValid: false,
    response: { vnp_ResponseCode: '00', vnp_TransactionStatus: '00' },
  });

  assert.equal(result.status, 'initiated');
  assert.match(result.reason, /xác minh/);
});

test('timeout remains pending because the gateway may have processed the request', () => {
  const error = new Error('request timed out');
  error.name = 'TimeoutError';

  const result = classifyRefundTransportError(error);
  assert.equal(result.status, 'initiated');
  assert.match(result.reason, /đối soát/);
});
