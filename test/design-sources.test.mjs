import assert from 'node:assert/strict';
import { listDesignSources, listDesignDocuments, readDesignSource } from '../dist/design-sources.js';

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
for (const entry of catalog) {
  if (!entry.installed) continue;
  const listing = listDesignDocuments(entry.id);
  assert.ok(listing.documents.includes(entry.mainDocument), entry.id + ' primary skill listed');
  assert.ok(listing.documents.length >= 1);
  assert.ok(listing.documents.every(name => name.endsWith('.md')));
}
const elaya = listDesignDocuments('elaya');
assert.ok(elaya.documents.includes('skills/figma-designer/SKILL.md'));
assert.ok(elaya.documents.includes('skills/landing-page-design/SKILL.md'));
const motion = listDesignDocuments('motion');
assert.ok(motion.documents.includes('skills/design-motion-principles/workflows/audit.md'));
assert.ok(readDesignSource('impeccable', 'skill/reference/polish.md').text.length > 200);
assert.throws(() => listDesignDocuments('unknown'));
console.log('design source catalog, read, and path security tests passed');