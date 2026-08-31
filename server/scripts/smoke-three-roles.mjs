import assert from 'node:assert/strict';

const baseUrl = String(process.env.NOMNOM_API_URL || 'http://localhost:3000/api/v1').replace(/\/$/, '');
const healthUrl = process.env.NOMNOM_HEALTH_URL || `${new URL(baseUrl).origin}/api/health`;
const password = process.env.NOMNOM_DEMO_PASSWORD;

if (!password) {
  throw new Error('Set NOMNOM_DEMO_PASSWORD before running the three-role smoke test.');
}

const accounts = {
  admin: process.env.NOMNOM_ADMIN_EMAIL || 'admin@nomnom.local',
  customer: process.env.NOMNOM_CUSTOMER_EMAIL || 'khachhang@nomnom.local',
  merchant: process.env.NOMNOM_MERCHANT_EMAIL || 'nhahang@nomnom.local',
};

async function request(path, { token, method = 'GET', body } = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers: {
      Accept: 'application/json',
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(5000),
  });
  const payload = await response.json().catch(() => ({}));
  return { response, payload };
}

async function login(email, expectedRole) {
  const { response, payload } = await request('/auth/login', {
    method: 'POST',
    body: { email, password, rememberMe: false },
  });
  assert.equal(response.status, 200, `Login ${expectedRole} failed: ${payload.error || response.status}`);
  assert.ok(payload.accessToken, `${expectedRole} login did not return an access token`);
  assert.ok(payload.refreshToken, `${expectedRole} login did not return a refresh token`);
  assert.ok(payload.user?.roles?.includes(expectedRole), `${email} is missing role ${expectedRole}`);
  return payload;
}

async function expectStatus(label, path, token, expectedStatus) {
  const { response, payload } = await request(path, { token });
  assert.equal(
    response.status,
    expectedStatus,
    `${label}: expected ${expectedStatus}, received ${response.status} (${payload.error || 'no error message'})`,
  );
}

const sessions = [];
try {
  const healthResponse = await fetch(healthUrl, { signal: AbortSignal.timeout(5000) });
  assert.equal(healthResponse.status, 200, 'API health check failed');

  const admin = await login(accounts.admin, 'admin');
  const customer = await login(accounts.customer, 'customer');
  const merchant = await login(accounts.merchant, 'merchant');
  sessions.push(admin, customer, merchant);

  await expectStatus('Admin overview', '/admin/overview', admin.accessToken, 200);
  await expectStatus('Customer order history', '/me/orders', customer.accessToken, 200);
  await expectStatus('Merchant restaurant', '/merchant/me/restaurant', merchant.accessToken, 200);
  await expectStatus('Merchant orders', '/merchant/me/orders', merchant.accessToken, 200);
  await expectStatus('Customer blocked from admin', '/admin/overview', customer.accessToken, 403);
  await expectStatus('Merchant blocked from admin', '/admin/overview', merchant.accessToken, 403);
  await expectStatus('Customer blocked from merchant orders', '/merchant/me/orders', customer.accessToken, 403);

  console.log('Three-role smoke test passed: Admin, Customer, Merchant and cross-role authorization.');
} finally {
  await Promise.allSettled(sessions.map((session) => request('/auth/logout', {
    method: 'POST',
    body: { refreshToken: session.refreshToken },
  })));
}
