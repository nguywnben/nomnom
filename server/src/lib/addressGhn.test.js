import assert from 'node:assert/strict';
import test from 'node:test';

import { validateGhnAddressCodes } from './addressGhn.js';

test('chấp nhận đủ ba mã GHN hợp lệ', () => {
  assert.deepEqual(
    validateGhnAddressCodes({
      ghnProvinceId: 201,
      ghnDistrictId: 1454,
      ghnWardCode: '20308',
    }),
    { ok: true, codes: { ghnProvinceId: 201, ghnDistrictId: 1454, ghnWardCode: '20308' } },
  );
});

test('từ chối bộ mã GHN thiếu hoặc không hợp lệ', () => {
  assert.equal(validateGhnAddressCodes({ ghnProvinceId: 201, ghnDistrictId: 1454 }).ok, false);
  assert.equal(validateGhnAddressCodes({ ghnProvinceId: 'x', ghnDistrictId: 1454, ghnWardCode: '20308' }).ok, false);
  assert.equal(validateGhnAddressCodes({ ghnProvinceId: 201, ghnDistrictId: 1454, ghnWardCode: '   ' }).ok, false);
});

test('nhận biết payload PATCH không gửi mã GHN', () => {
  assert.deepEqual(validateGhnAddressCodes({}, { required: false }), { ok: true, codes: null });
});
