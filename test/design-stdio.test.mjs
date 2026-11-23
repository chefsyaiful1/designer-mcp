import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { setTimeout as delay } from 'node:timers/promises';

const child = spawn(process.execPath, ['dist/index.js'], { cwd: new URL('..', import.meta.url), stdio: ['pipe', 'pipe', 'ignore'] });
let output = '';
child.stdout.on('data', chunk => { output += chunk.toString(); });
try {
  child.stdin.write(JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2025-06-18', capabilities: {}, clientInfo: { name: 'stdio-smoke', version: '1' } } }) + '\n');
  for (let i = 0; i < 40 && !output.includes('"serverInfo"'); i++) await delay(100);
  assert.ok(output.includes('"serverInfo"'), 'stdio initialization works');
  child.stdin.write(JSON.stringify({ jsonrpc: '2.0', method: 'notifications/initialized' }) + '\n');
  child.stdin.write(JSON.stringify({ jsonrpc: '2.0', id: 2, method: 'tools/list', params: {} }) + '\n');
  for (let i = 0; i < 40 && !output.includes('read_design_source'); i++) await delay(100);
  assert.ok(output.includes('read_design_source'), 'stdio tools/list works');
  console.log('Existing stdio MCP transport preserved');
} finally {
  child.kill();
}