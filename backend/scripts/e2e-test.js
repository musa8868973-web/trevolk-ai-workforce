/**
 * e2e-test.js — Quick sanity-test runner for the live backend at http://127.0.0.1:4000
 * Run with: node scripts/e2e-test.js
 */
const BASE = 'http://127.0.0.1:4000/api/v1';

const results = [];

function record(name, pass, status, detail) {
  results.push({ name, result: pass ? 'PASS' : 'FAIL', status, detail });
}

async function json(url, opts = {}) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000);
  try {
    const res = await fetch(url, { ...opts, signal: controller.signal });
    clearTimeout(timeoutId);
    let body;
    try {
      body = await res.json();
    } catch {
      body = null;
    }
    return { res, body };
  } catch (e) {
    clearTimeout(timeoutId);
    throw e;
  }
}

// ──────────────────────────── 1. Health checks ────────────────────────────
async function testHealthLive() {
  const name = '1a  GET /health (liveness)';
  try {
    const { res, body } = await json(`${BASE}/health`);
    const status = body?.data?.status || body?.status;
    const ok = res.status === 200 && (status === 'ok' || status === 'degraded');
    const detail = `status="${status}" db=${body?.data?.components?.database}`;
    record(name, ok, res.status, detail);
  } catch (e) {
    record(name, false, '-', e.message);
  }
}

async function testHealthReady() {
  const name = '1b  GET /health/ready (readiness)';
  try {
    const { res, body } = await json(`${BASE}/health/ready`);
    // Note: readiness returns 200 if DB & Redis ready, or 503 if degraded/not ready
    const status = body?.status;
    const ok = res.status === 200 || res.status === 503;
    const detail = `status="${status}" db=${body?.database} redis=${body?.redis}`;
    record(name, ok, res.status, detail);
  } catch (e) {
    record(name, false, '-', e.message);
  }
}

// ──────────────────────────── 2. Auth flow ────────────────────────────────
let accessToken = '';
let workspaceId = '';

async function testRegister() {
  const name = '2a  POST /auth/register';
  const unique = `e2e_${Date.now()}@test.local`;
  try {
    const { res, body } = await json(`${BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: unique,
        password: 'Test1234pass',
        name: 'E2E Tester',
        organizationName: 'E2E Org',
      }),
    });

    const ok = res.status === 201 || res.status === 200;
    if (ok && body?.data) {
      const d = body.data;
      accessToken = d.tokens?.accessToken || d.accessToken || '';
      workspaceId = d.workspace?.workspaceId || d.workspace?.id || d.workspaces?.[0]?.workspaceId || '';
    }
    const detail = ok
      ? `token=${accessToken ? 'RECEIVED' : 'MISSING'} wsId=${workspaceId || 'MISSING'}`
      : JSON.stringify(body?.error || body).slice(0, 80);
    record(name, ok, res.status, detail);
  } catch (e) {
    record(name, false, '-', e.message);
  }
}

async function testLogin() {
  if (accessToken && workspaceId) return;
  const name = '2b  POST /auth/login (fallback)';
  try {
    const { res, body } = await json(`${BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@trevolk.local',
        password: 'Test1234pass',
      }),
    });
    const ok = res.status === 200;
    if (ok && body?.data) {
      const d = body.data;
      accessToken = d.tokens?.accessToken || d.accessToken || '';
      workspaceId = d.workspaces?.[0]?.workspaceId || d.workspace?.workspaceId || d.workspace?.id || '';
    }
    const detail = ok
      ? `token=${accessToken ? 'RECEIVED' : 'MISSING'} wsId=${workspaceId || 'MISSING'}`
      : JSON.stringify(body?.error || body).slice(0, 80);
    record(name, ok, res.status, detail);
  } catch (e) {
    record(name, false, '-', e.message);
  }
}

// ──────────────────────────── 3. Protected APIs ───────────────────────────
async function testAnalytics() {
  const name = '3a  GET /workspaces/:id/analytics/overview';
  if (!accessToken || !workspaceId) {
    record(name, false, '-', 'Skipped — missing auth token or workspaceId');
    return;
  }
  try {
    const { res, body } = await json(
      `${BASE}/workspaces/${workspaceId}/analytics/overview`,
      { headers: { Authorization: `Bearer ${accessToken}` } },
    );
    const ok = res.status === 200 || res.status === 204;
    const detail = ok
      ? `analytics fetched successfully`
      : JSON.stringify(body?.error || body).slice(0, 80);
    record(name, ok, res.status, detail);
  } catch (e) {
    record(name, false, '-', e.message);
  }
}

async function testAuditLogs() {
  const name = '3b  GET /workspaces/:id/audit-logs';
  if (!accessToken || !workspaceId) {
    record(name, false, '-', 'Skipped — missing auth token or workspaceId');
    return;
  }
  try {
    const { res, body } = await json(
      `${BASE}/workspaces/${workspaceId}/audit-logs`,
      { headers: { Authorization: `Bearer ${accessToken}` } },
    );
    const ok = res.status === 200;
    const detail = ok
      ? `audit logs count=${body?.data?.logs?.length ?? body?.data?.length ?? 0}`
      : JSON.stringify(body?.error || body).slice(0, 80);
    record(name, ok, res.status, detail);
  } catch (e) {
    record(name, false, '-', e.message);
  }
}

async function testProtectedNoAuth() {
  const name = '3c  GET /auth/me (no token → 401)';
  try {
    const { res } = await json(`${BASE}/auth/me`);
    const ok = res.status === 401;
    record(name, ok, res.status, ok ? 'Correctly rejected (401 Unauthorized)' : 'Expected 401');
  } catch (e) {
    record(name, false, '-', e.message);
  }
}

// ──────────────────────────── 4. Security headers ─────────────────────────
async function testSecurityHeaders() {
  const name = '4a  Security headers (helmet)';
  try {
    const { res } = await json(`${BASE}/health`);
    const hdrs = Object.fromEntries(res.headers.entries());

    const checks = {
      'x-content-type-options': hdrs['x-content-type-options'] === 'nosniff',
      'x-frame-options': !!hdrs['x-frame-options'],
      'strict-transport-security': !!hdrs['strict-transport-security'],
      'content-security-policy': !!hdrs['content-security-policy'],
      'x-xss-protection': !!hdrs['x-xss-protection'] || hdrs['x-xss-protection'] === '0',
    };

    const present = Object.entries(checks)
      .filter(([, v]) => v)
      .map(([k]) => k);

    const ok = present.length >= 2;
    record(
      name,
      ok,
      res.status,
      `Helmet headers present: ${present.join(', ')}`,
    );
  } catch (e) {
    record(name, false, '-', e.message);
  }
}

// ──────────────────────────── Main Runner ─────────────────────────────────
async function main() {
  console.log('=======================================================');
  console.log('  Trevolk Backend — E2E Integration Sanity Test');
  console.log(`  Target: ${BASE}`);
  console.log('=======================================================\n');

  await testHealthLive();
  await testHealthReady();
  await testRegister();
  await testLogin();
  await testProtectedNoAuth();
  await testAnalytics();
  await testAuditLogs();
  await testSecurityHeaders();

  console.log('\n+--------+-------------------------------------------------+--------+-------------------------------------------------+');
  console.log('| Result | Test                                            | Status | Detail                                          |');
  console.log('+--------+-------------------------------------------------+--------+-------------------------------------------------+');
  for (const r of results) {
    const icon = r.result === 'PASS' ? 'PASS' : 'FAIL';
    const res  = icon.padEnd(6);
    const nm   = r.name.padEnd(47);
    const st   = String(r.status).padEnd(6);
    const det  = (r.detail || '').slice(0, 47).padEnd(47);
    console.log(`| ${res} | ${nm} | ${st} | ${det} |`);
  }
  console.log('+--------+-------------------------------------------------+--------+-------------------------------------------------+');

  const passed = results.filter(r => r.result === 'PASS').length;
  const total  = results.length;
  console.log(`\n  Final Result: ${passed}/${total} tests passed\n`);

  process.exit(passed === total ? 0 : 1);
}

main().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(2);
});
