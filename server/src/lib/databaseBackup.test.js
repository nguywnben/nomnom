import assert from 'node:assert/strict';
import test from 'node:test';

import { getInsertableColumnNames, serializeBackupValue } from './databaseBackup.js';

const escape = (value) => `escaped:${String(value)}`;

test('database backup serializes JSON objects before SQL escaping', () => {
  assert.equal(
    serializeBackupValue({ reason: 'approved', items: [1, 2] }, escape),
    'escaped:{"reason":"approved","items":[1,2]}',
  );
});

test('database backup preserves scalar, date and buffer values for the SQL driver', () => {
  const date = new Date('2026-09-01T00:00:00.000Z');
  const buffer = Buffer.from('NomNom');

  assert.equal(serializeBackupValue(null, escape), 'escaped:null');
  assert.equal(serializeBackupValue(42, escape), 'escaped:42');
  assert.equal(serializeBackupValue(date, (value) => value), date);
  assert.equal(serializeBackupValue(buffer, (value) => value), buffer);
});

test('database backup excludes virtual and stored generated columns from inserts', () => {
  const columns = [
    { Field: 'id', Extra: 'auto_increment' },
    { Field: 'pending_restaurant_id', Extra: 'VIRTUAL GENERATED' },
    { Field: 'normalized_code', Extra: 'STORED GENERATED' },
    { Field: 'created_at', Extra: 'DEFAULT_GENERATED' },
    { Field: 'name', Extra: '' },
  ];

  assert.deepEqual(getInsertableColumnNames(columns), ['id', 'created_at', 'name']);
});
