import assert from 'node:assert/strict';
import test from 'node:test';
import { scheduleRoutePreload } from './routePreload.js';

test('scheduleRoutePreload waits for the scheduler before preloading route chunks', async () => {
  const calls = [];
  let scheduledTask;
  const scheduler = (task) => { scheduledTask = task; };

  const cancel = scheduleRoutePreload([
    async () => { calls.push('orders'); },
    async () => { calls.push('settings'); },
  ], scheduler);

  assert.deepEqual(calls, []);
  await scheduledTask();
  assert.deepEqual(calls, ['orders', 'settings']);
  assert.equal(typeof cancel, 'function');
});

test('scheduleRoutePreload cancels scheduled work when the layout unmounts', () => {
  let cancelled = false;
  const scheduler = () => () => { cancelled = true; };

  const cancel = scheduleRoutePreload([], scheduler);
  cancel();

  assert.equal(cancelled, true);
});
