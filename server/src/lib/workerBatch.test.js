import assert from 'node:assert/strict';
import test from 'node:test';

import { normalizeWorkerBatchSize } from './workerBatch.js';

test('worker batch size stays within a safe range', () => {
  assert.equal(normalizeWorkerBatchSize(undefined), 100);
  assert.equal(normalizeWorkerBatchSize('25'), 25);
  assert.equal(normalizeWorkerBatchSize('0'), 100);
  assert.equal(normalizeWorkerBatchSize('1000'), 500);
  assert.equal(normalizeWorkerBatchSize('invalid'), 100);
});
