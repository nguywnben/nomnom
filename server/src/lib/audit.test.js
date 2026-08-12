import assert from 'node:assert/strict';
import test from 'node:test';
import { logAudit } from './audit.js';

test('logAudit propagates a database write failure', async () => {
  const databaseError = new Error('audit database unavailable');
  const failingConnection = {
    query: async () => {
      throw databaseError;
    },
  };

  await assert.rejects(
    logAudit(failingConnection, {
      adminId: 1,
      action: 'duyet_nha_hang',
      targetType: 'restaurant',
      targetId: 2,
    }),
    databaseError,
  );
});
