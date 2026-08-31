import assert from 'node:assert/strict';
import test from 'node:test';
import {
  unwrapAdminCuisine,
  unwrapAdminCuisines,
} from './adminCuisines.js';

test('unwrapAdminCuisines returns the cuisine array from the admin API envelope', () => {
  const cuisines = [{ id: 1, name: 'Món Việt' }];

  assert.deepEqual(unwrapAdminCuisines({ data: cuisines }), cuisines);
});

test('unwrapAdminCuisines rejects an invalid list response', () => {
  assert.throws(
    () => unwrapAdminCuisines({ data: null }),
    /Dữ liệu loại hình ẩm thực không hợp lệ/,
  );
});

test('unwrapAdminCuisine returns the cuisine from create and update responses', () => {
  const cuisine = { id: 1, name: 'Món Việt' };

  assert.deepEqual(unwrapAdminCuisine({ cuisine }), cuisine);
});

test('unwrapAdminCuisine rejects an invalid mutation response', () => {
  assert.throws(
    () => unwrapAdminCuisine({ cuisine: null }),
    /Dữ liệu loại hình ẩm thực không hợp lệ/,
  );
});
