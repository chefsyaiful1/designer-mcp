import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { createServer } from 'node:net';
import { once } from 'node:events';
import { setTimeout as delay } from 'node:timers/promises';

const probe = createServer();
probe.listen(0, '127.0.0.1');
await once(probe, 'listening');
const port = probe.address().port;
await new Promise(done => probe.close(done));
const child = spawn(process.execPath, ['serve-http.mjs'], {
  cwd: new URL('..', import.meta.url),
  env: {
    ...process.env,
    PORT: String(port),
    DESIGNER_ALLOW_LOCAL_UNAUTH: '0',
    DESIGNER_ACCESS_ISSUER: 'https://example.cloudflareaccess.com',
    DESIGNER_ACCESS_AUD: 'test-audience',
  },
  stdio: 'ignore',
});
try {
  let ready = false;
  for (let n = 0; n < 40; n++) {
    try { ready = (await fetch('http://127.0.0.1:' + port + '/health')).ok; if (ready) break; } catch {}
    await delay(150);
  }
  assert.ok(ready);
  const endpoint = 'http://127.0.0.1:' + port + '/mcp';
  const headers = { 'content-type': 'application/json', accept: 'application/json, text/event-stream' };
  const body = JSON.stringify({jsonrpc:'2.0', id:1, method:'tools/list', params:{}});
  let response = await fetch(endpoint, {method:'POST', headers, body});
  assert.equal(response.status, 401, 'request without Access identity denied');
  response = await fetch(endpoint, {method:'POST', headers:{...headers, 'cf-access-jwt-assertion':'not-a-jwt'}, body});
  assert.equal(response.status, 403, 'forged Access identity denied');
  console.log('Cloudflare Access JWT rejection tests passed');
} finally { child.kill(); }