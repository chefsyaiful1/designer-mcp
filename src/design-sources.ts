import { existsSync, readFileSync, realpathSync, readdirSync } from 'node:fs';
import { join, relative, isAbsolute } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../.designer-sources/', import.meta.url));
const catalog = [
  { id: 'taste', directory: 'taste-skill', document: 'skills/taste-skill/SKILL.md', use: 'Art direction, frontend visual quality, and browser consistency gates' },
  { id: 'motion', directory: 'design-motion-principles', document: 'skills/design-motion-principles/SKILL.md', use: 'Purposeful animation creation and motion audits' },
  { id: 'elaya', directory: 'ai-design-skills', document: 'skills/landing-page-design/SKILL.md', use: 'Landing pages and Figma design foundations' },
  { id: 'impeccable', directory: 'impeccable', document: 'skill/SKILL.src.md', use: 'Design critique, anti-pattern detection and polish' },
  { id: 'img2threejs', directory: 'img2threejs', document: 'SKILL.md', use: 'Reference image to procedural, animation-ready Three.js' },
] as const;

export function listDesignSources() {
  return catalog.map(({ id, directory, document, use }) => ({
    id, use, mainDocument: document,
    installed: existsSync(join(root, directory, document)),
  }));
}

export function readDesignSource(id: string, document?: string) {
  const source = catalog.find(item => item.id === id);
  if (!source) throw new Error('Unknown design source');
  const selected = document === undefined ? source.document : document;
  if (typeof selected !== 'string' || !/^[A-Za-z0-9_./-]+\.md$/.test(selected) ||
      selected.split('/').some(part => part === '.' || part === '..') ||
      selected.startsWith('/')) {
    throw new Error('Document must be a safe relative .md path');
  }
  const folder = join(root, source.directory);
  if (!existsSync(folder)) throw new Error('Design sources are not installed; run npm run sync:design');
  const base = realpathSync(folder);
  const target = realpathSync(join(folder, selected));
  const rel = relative(base, target);
  if (!rel || rel === '..' || rel.startsWith('../') || rel.startsWith('..\\') || isAbsolute(rel)) {
    throw new Error('Document is outside its trusted design source');
  }
  const text = readFileSync(target, 'utf8');
  return { source: id, document: selected, text: text.slice(0, 40000), truncated: text.length > 40000 };
}
export function listDesignDocuments(id: string) {
  const source = catalog.find(item => item.id === id);
  if (!source) throw new Error('Unknown design source');
  const folder = join(root, source.directory);
  if (!existsSync(folder)) throw new Error('Design sources are not installed; run npm run sync:design');
  const documents: string[] = [];
  function visit(path: string, depth: number) {
    if (depth > 10) return;
    for (const entry of readdirSync(join(folder, path), { withFileTypes: true })) {
      if (entry.name === '.git' || entry.name === 'node_modules') continue;
      const item = path ? path + '/' + entry.name : entry.name;
      if (entry.isDirectory()) visit(item, depth + 1);
      else if (entry.isFile() && item.endsWith('.md')) documents.push(item);
    }
  }
  visit('', 0);
  return { source: id, documents: documents.sort() };
}
