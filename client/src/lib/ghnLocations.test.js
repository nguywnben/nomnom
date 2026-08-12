import assert from 'node:assert/strict';
import test from 'node:test';

import { createGhnLocationsApi } from './ghnLocations.js';

test('gọi API địa bàn GHN thông qua backend NomNom', async () => {
  const paths = [];
  const api = createGhnLocationsApi(async (path) => {
    paths.push(path);
    return [];
  });

  await api.getDistricts(201);
  await api.getWards(1454);

  assert.deepEqual(paths, [
    '/api/v1/shipping/ghn/districts?provinceId=201',
    '/api/v1/shipping/ghn/wards?districtId=1454',
  ]);
});
