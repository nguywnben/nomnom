import assert from 'node:assert/strict';
import test from 'node:test';

import { createGhnClient } from './ghn.js';

test('quote gửi Token và ShopId chỉ ở backend', async () => {
  const calls = [];
  const client = createGhnClient({
    token: 'test-token',
    shopId: 42,
    baseUrl: 'https://ghn.test',
    fetchImpl: async (url, options) => {
      calls.push({ url, options });
      return { ok: true, json: async () => ({ code: 200, data: { total: 36000 } }) };
    },
  });

  const quote = await client.quote({
    serviceId: 53320,
    fromDistrictId: 1455,
    toDistrictId: 1442,
    toWardCode: '20107',
  });

  assert.equal(quote.total, 36000);
  assert.equal(calls[0].options.headers.Token, 'test-token');
  assert.equal(calls[0].options.headers.ShopId, '42');
  assert.deepEqual(JSON.parse(calls[0].options.body), {
    service_id: 53320,
    service_type_id: 2,
    from_district_id: 1455,
    to_district_id: 1442,
    to_ward_code: '20107',
    weight: 500,
    length: 20,
    width: 20,
    height: 10,
    insurance_value: 0,
  });
});

test('lỗi GHN không làm lộ Token', async () => {
  const client = createGhnClient({
    token: 'test-token', shopId: 42, baseUrl: 'https://ghn.test',
    fetchImpl: async () => ({ ok: false, status: 401, json: async () => ({ message: 'invalid test-token' }) }),
  });

  await assert.rejects(
    client.getProvinces(),
    (error) => error.code === 'GHN_PROVIDER_ERROR' && !error.message.includes('test-token'),
  );
});

test('lấy đúng shop đã cấu hình từ data.shops của GHN', async () => {
  const client = createGhnClient({
    token: 'test-token', shopId: 42, baseUrl: 'https://ghn.test',
    fetchImpl: async () => ({
      ok: true,
      json: async () => ({ code: 200, data: { shops: [{ _id: 42, district_id: 1455 }] } }),
    }),
  });

  assert.deepEqual(await client.getShop(), { _id: 42, district_id: 1455 });
});
