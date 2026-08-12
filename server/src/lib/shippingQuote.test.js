import assert from 'node:assert/strict';
import test from 'node:test';

import { buildShippingQuote } from './shippingQuote.js';

const address = { ghnProvinceId: 201, ghnDistrictId: 1442, ghnWardCode: '20107' };
const cart = { id: 1, restaurant_id: 7 };
const restaurant = { id: 7 };

test('từ chối quote nếu địa chỉ chưa có mã GHN', async () => {
  await assert.rejects(
    buildShippingQuote({ ghnClient: {}, cart, restaurant, address: {} }),
    (error) => error.code === 'GHN_ADDRESS_NOT_READY',
  );
});

test('từ chối quote nếu GHN không có dịch vụ hàng nhẹ', async () => {
  await assert.rejects(
    buildShippingQuote({
      ghnClient: { getShop: async () => ({ district_id: 1455 }), getAvailableServices: async () => [] },
      cart, restaurant, address,
    }),
    (error) => error.code === 'GHN_SERVICE_UNAVAILABLE',
  );
});

test('báo giá dùng dịch vụ hàng nhẹ đầu tiên', async () => {
  let quoteInput;
  const result = await buildShippingQuote({
    ghnClient: {
      getShop: async () => ({ district_id: 1455 }),
      getAvailableServices: async () => [{ service_id: 1, service_type_id: 1 }, { service_id: 2, service_type_id: 2, short_name: 'Hàng nhẹ' }],
      quote: async (input) => {
        quoteInput = input;
        return { total: 32000 };
      },
    },
    cart, restaurant, address,
  });

  assert.deepEqual(result, {
    serviceId: 2,
    serviceTypeId: 2,
    serviceName: 'Hàng nhẹ',
    total: 32000,
    breakdown: { total: 32000 },
  });
  assert.deepEqual(quoteInput, {
    serviceId: 2,
    fromDistrictId: 1455,
    toDistrictId: 1442,
    toWardCode: '20107',
  });
});

test('báo giá nhận mã GHN theo tên cột từ truy vấn SELECT *', async () => {
  const result = await buildShippingQuote({
    ghnClient: {
      getShop: async () => ({ district_id: 1455 }),
      getAvailableServices: async () => [{ service_id: 2, service_type_id: 2 }],
      quote: async () => ({ total: 32000 }),
    },
    cart,
    restaurant,
    address: {
      ghn_province_id: 201,
      ghn_district_id: 1442,
      ghn_ward_code: '20107',
    },
  });

  assert.equal(result.total, 32000);
});
