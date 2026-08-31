import assert from 'node:assert/strict';
import test from 'node:test';

import { createRateLimiter, securityHeaders } from './security.js';

function createResponse() {
  const headers = new Map();
  return {
    headers,
    statusCode: 200,
    payload: null,
    setHeader(name, value) { headers.set(name, value); },
    status(code) { this.statusCode = code; return this; },
    json(payload) { this.payload = payload; return this; },
  };
}

test('security headers block sniffing and framing', () => {
  const res = createResponse();
  let called = false;
  securityHeaders({}, res, () => { called = true; });
  assert.equal(called, true);
  assert.equal(res.headers.get('X-Content-Type-Options'), 'nosniff');
  assert.equal(res.headers.get('X-Frame-Options'), 'DENY');
});

test('rate limiter rejects requests beyond the configured window', () => {
  let now = 1_000;
  const limiter = createRateLimiter({ windowMs: 60_000, max: 2, now: () => now });
  const req = { ip: '127.0.0.1', headers: {} };
  const first = createResponse();
  const second = createResponse();
  const blocked = createResponse();
  let passes = 0;

  limiter(req, first, () => { passes += 1; });
  limiter(req, second, () => { passes += 1; });
  limiter(req, blocked, () => { passes += 1; });

  assert.equal(passes, 2);
  assert.equal(blocked.statusCode, 429);
  now += 60_001;
  limiter(req, createResponse(), () => { passes += 1; });
  assert.equal(passes, 3);
});
