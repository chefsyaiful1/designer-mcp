import { execFileSync } from 'node:child_process';
import { mkdirSync, existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = import.meta.dirname;
const sources = JSON.parse(readFileSync(join(root, '..', 'design-sources.lock.json'), 'utf8'));
const vendor = join(root, '..', '.designer-sources');
mkdirSync(vendor, { recursive: true });

const dirNames = { taste: 'taste-skill', motion: 'design-motion-principles', elaya: 'ai-design-skills', impeccable: 'impeccable', img2threejs: 'img2threejs' };
function git(...args) {
  execFileSync('git', args, { stdio: 'inherit', timeout: 180000 });
}
function rev(dir) {
  return execFileSync('git', ['-C', dir, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
}
for (const [id, source] of Object.entries(sources)) {
  const target = join(vendor, dirNames[id]);
  if (!existsSync(target)) {
    git('clone', '--depth=1', '--filter=blob:none', '--sparse', 'https://github.com/' + source.repo + '.git', target);
  }
  git('-C', target, 'sparse-checkout', 'set', ...source.paths);
  if (rev(target) !== source.sha) {
    git('-C', target, 'fetch', '--depth=1', 'origin', source.sha);
    git('-C', target, 'checkout', '--detach', source.sha);
  }
  if (rev(target) !== source.sha) throw new Error('Pinned source changed: ' + id);
  console.log(id + ': ' + source.sha.slice(0, 12));
}