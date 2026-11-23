import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { createServer } from 'node:net';
import { once } from 'node:events';
import { setTimeout as delay } from 'node:timers/promises';

const probe = createServer();
probe.listen(0, '127.0.0.1');
await once(probe, 'listening');
const port = probe.address().port;
await new Promise(resolve => probe.close(resolve));

const child = spawn(process.execPath, ['serve-http.mjs'], {
  cwd: new URL('..', import.meta.url),
  env: { ...process.env, PORT: String(port) },
  stdio: 'ignore',
});
const url = 'http://127.0.0.1:' + port;
async function call(id, method, params = {}) {
  const response = await fetch(url + '/mcp', {
    method: 'POST',
    headers: { 'content-type': 'application/json', accept: 'application/json, text/event-stream' },
    body: JSON.stringify({ jsonrpc: '2.0', id, method, params }),
  });
  assert.equal(response.status, 200, method);
  return response.json();
}
try {
  let ready = false;
  for (let i = 0; i < 40; i++) {
    try { ready = (await fetch(url + '/health')).ok; if (ready) break; } catch {}
    await delay(150);
  }
  assert.ok(ready, 'HTTP MCP started');
  const init = await call(1, 'initialize', { protocolVersion: '2025-06-18', capabilities: {}, clientInfo: { name: 'smoke', version: '1' } });
  assert.equal(init.result.serverInfo.name, 'the-designer');
  const list = await call(2, 'tools/list');
  assert.ok(list.result.tools.find(tool => tool.name === 'read_design_source'));
  const sources = await call(3, 'tools/call', { name: 'list_design_sources', arguments: {} });
  assert.equal(JSON.parse(sources.result.content[0].text).length, 5);
  const guide = await call(4, 'tools/call', { name: 'read_design_source', arguments: { source: 'motion' } });
  assert.ok(guide.result.content[0].text.includes('motion'));
  const blocked = await call(5, 'tools/call', { name: 'read_design_source', arguments: { source: 'taste', document: '../package.json' } });
  assert.equal(blocked.result.isError, true);
  console.log('HTTP MCP initialization, multi-request, and tool security tests passed');
} finally {
  child.kill();
}