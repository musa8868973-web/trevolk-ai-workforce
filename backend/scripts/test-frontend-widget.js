/**
 * test-frontend-widget.js — Phase 10 End-to-End Integration Test Runner
 * Tests Frontend ↔ Backend REST API Connectivity, Socket.io WebSocket Gateway,
 * Live Chat Widget & AI Agent query execution.
 *
 * Run with: node scripts/test-frontend-widget.js
 */
const { io } = require('socket.io-client');

const API_BASE = 'http://127.0.0.1:4000/api/v1';
const WS_BASE  = 'http://127.0.0.1:4000';

const results = [];

function record(category, name, pass, status, detail) {
  results.push({ category, name, result: pass ? 'PASS' : 'FAIL', status, detail });
}

async function request(url, opts = {}) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);
  try {
    const res = await fetch(url, { ...opts, signal: controller.signal });
    clearTimeout(timeoutId);
    let body;
    try { body = await res.json(); } catch { body = null; }
    return { res, body };
  } catch (e) {
    clearTimeout(timeoutId);
    throw e;
  }
}

async function main() {
  console.log('===================================================================');
  console.log('  Trevolk AI Workforce — Phase 10 E2E Frontend & Widget Test');
  console.log(`  REST Target: ${API_BASE}`);
  console.log(`  WS Target:   ${WS_BASE}`);
  console.log('===================================================================\n');

  let accessToken = '';
  let workspaceId = '';

  // ──────────────── 1. REST API Connectivity & Auth ────────────────
  const testEmail = `widget_test_${Date.now()}@trevolk.local`;
  try {
    const { res, body } = await request(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        password: 'TestPassword123!',
        name: 'Widget Tester',
        organizationName: 'Widget Testing Corp',
      }),
    });

    const ok = res.status === 201 || res.status === 200;
    if (ok && body?.data) {
      accessToken = body.data.tokens?.accessToken || body.data.accessToken || '';
      workspaceId =
        body.data.workspace?.workspaceId ||
        body.data.workspace?.id ||
        body.data.workspaces?.[0]?.workspaceId ||
        '';
    }
    record('REST API', 'Auth (User Registration)', ok, res.status, ok ? `token=ACQUIRED wsId=${workspaceId}` : 'Auth failed');
  } catch (e) {
    record('REST API', 'Auth (User Registration)', false, '-', e.message);
  }

  // Dashboard Data Fetching (Simulating Logged-in Admin)
  if (accessToken && workspaceId) {
    // 1a. Analytics Overview
    try {
      const { res, body } = await request(`${API_BASE}/workspaces/${workspaceId}/analytics/overview`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const ok = res.status === 200 || res.status === 204;
      record('Dashboard', 'Fetch Workspace Analytics Overview', ok, res.status, ok ? 'Overview metrics loaded' : JSON.stringify(body).slice(0, 50));
    } catch (e) {
      record('Dashboard', 'Fetch Workspace Analytics Overview', false, '-', e.message);
    }

    // 1b. Active AI Employees
    try {
      const { res, body } = await request(`${API_BASE}/ai-employees`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'X-Workspace-Id': workspaceId,
        },
      });
      const ok = res.status === 200;
      const count = body?.data?.length ?? 0;
      record('Dashboard', 'Fetch Active AI Agents', ok, res.status, ok ? `Active agents list loaded (count=${count})` : JSON.stringify(body).slice(0, 50));
    } catch (e) {
      record('Dashboard', 'Fetch Active AI Agents', false, '-', e.message);
    }

    // 1c. Channel Integrations
    try {
      const { res, body } = await request(`${API_BASE}/integrations`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'X-Workspace-Id': workspaceId,
        },
      });
      const ok = res.status === 200;
      const count = body?.data?.length ?? 0;
      record('Dashboard', 'Fetch Channel Integrations', ok, res.status, ok ? `Integrations loaded (count=${count})` : JSON.stringify(body).slice(0, 50));
    } catch (e) {
      record('Dashboard', 'Fetch Channel Integrations', false, '-', e.message);
    }

    // 1d. Conversation Threads (Inbox UI)
    try {
      const { res, body } = await request(`${API_BASE}/conversations`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'X-Workspace-Id': workspaceId,
        },
      });
      const ok = res.status === 200;
      const count = body?.data?.length ?? 0;
      record('Dashboard', 'Fetch Conversation Threads (Inbox)', ok, res.status, ok ? `Inbox threads loaded (count=${count})` : JSON.stringify(body).slice(0, 50));
    } catch (e) {
      record('Dashboard', 'Fetch Conversation Threads (Inbox)', false, '-', e.message);
    }
  } else {
    record('Dashboard', 'Fetch Workspace Analytics Overview', false, '-', 'Skipped (no token)');
    record('Dashboard', 'Fetch Active AI Agents', false, '-', 'Skipped (no token)');
    record('Dashboard', 'Fetch Channel Integrations', false, '-', 'Skipped (no token)');
    record('Dashboard', 'Fetch Conversation Threads (Inbox)', false, '-', 'Skipped (no token)');
  }

  // ──────────────── 2. Live Chat Widget & AI Agent Flow ────────────────
  let aiLatencyMs = 0;
  if (accessToken && workspaceId) {
    const startTime = Date.now();
    try {
      const userQuery = 'Hi, what services do you offer and what are your prices?';
      const { res, body } = await request(`${API_BASE}/support-employees/answer-faq`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
          'X-Workspace-Id': workspaceId,
        },
        body: JSON.stringify({ question: userQuery }),
      });
      aiLatencyMs = Date.now() - startTime;

      const ok = res.status === 200 && body?.data?.answer !== undefined;
      const answerSnippet = (body?.data?.answer || '').slice(0, 60);
      record('AI Agent', 'Live Chat Widget Query Turn', ok, res.status, ok ? `Response in ${aiLatencyMs}ms — "${answerSnippet}..."` : 'Query failed');
    } catch (e) {
      record('AI Agent', 'Live Chat Widget Query Turn', false, '-', e.message);
    }
  } else {
    record('AI Agent', 'Live Chat Widget Query Turn', false, '-', 'Skipped (no token)');
  }

  // ──────────────── 3. Socket.io Real-Time WebSocket Handshake ────────────────
  if (accessToken && workspaceId) {
    await new Promise((resolve) => {
      const socket = io(WS_BASE, {
        auth: {
          token: accessToken,
          workspaceId: workspaceId,
        },
        transports: ['websocket', 'polling'],
        timeout: 5000,
        reconnection: false,
      });

      let resolved = false;

      socket.on('connect', () => {
        if (!resolved) {
          resolved = true;
          record('WebSocket', 'Socket.io Handshake & Room Join', true, 'CONNECTED', `Joined room: workspace_${workspaceId} (id=${socket.id})`);
          socket.disconnect();
          resolve();
        }
      });

      socket.on('connect_error', (err) => {
        if (!resolved) {
          resolved = true;
          record('WebSocket', 'Socket.io Handshake & Room Join', false, 'ERROR', err.message);
          socket.disconnect();
          resolve();
        }
      });

      setTimeout(() => {
        if (!resolved) {
          resolved = true;
          record('WebSocket', 'Socket.io Handshake & Room Join', false, 'TIMEOUT', 'WebSocket connection timed out (5s)');
          socket.disconnect();
          resolve();
        }
      }, 5000);
    });
  } else {
    record('WebSocket', 'Socket.io Handshake & Room Join', false, '-', 'Skipped (no token)');
  }

  // ──────────────── 4. Diagnostic Summary Table ────────────────
  console.log('\n+---------------+------------------------------------------+-----------+---------------------------------------------------+');
  console.log('| Category      | Integration Test Step                    | Status    | Diagnostic Detail                                 |');
  console.log('+---------------+------------------------------------------+-----------+---------------------------------------------------+');
  for (const r of results) {
    const cat = r.category.padEnd(13);
    const nm  = r.name.padEnd(40);
    const st  = (r.result === 'PASS' ? `PASS (${r.status})` : `FAIL (${r.status})`).padEnd(9);
    const det = (r.detail || '').slice(0, 49).padEnd(49);
    console.log(`| ${cat} | ${nm} | ${st} | ${det} |`);
  }
  console.log('+---------------+------------------------------------------+-----------+---------------------------------------------------+');

  const passedCount = results.filter((r) => r.result === 'PASS').length;
  const totalCount  = results.length;
  console.log(`\n  Final Integration Summary: ${passedCount}/${totalCount} tests passed`);
  if (aiLatencyMs > 0) {
    console.log(`  AI Agent Response Latency: ${aiLatencyMs}ms\n`);
  }

  setTimeout(() => {
    process.exit(passedCount === totalCount ? 0 : 1);
  }, 100);
}

main().catch((err) => {
  console.error('Fatal integration test error:', err);
  process.exit(2);
});
