import assert from 'node:assert/strict';
import { listDesignSources, readDesignSource } from '../dist/design-sources.js';

const catalog = listDesignSources();
assert.equal(catalog.length, 5);
assert.deepEqual(catalog.map(item => item.id), ['taste', 'motion', 'elaya', 'impeccable', 'img2threejs']);
assert.equal(new Set(catalog.map(item => item.id)).size, 5);

for (const document of ['../package.json', '/etc/passwd', 'skills/../../README.md', 'README.txt', 'C:\\Windows\\win.ini']) {
  assert.throws(() => readDesignSource('taste', document));
}
assert.throws(() => readDesignSource('unknown'));
assert.throws(() => readDesignSource('taste', ''));

for (const entry of catalog) {
  if (!entry.installed) continue;
  const doc = readDesignSource(entry.id);
  assert.equal(doc.source, entry.id);
  assert.ok(doc.text.length > 50);
}
console.log('design source catalog, read, and path security tests passed');