// Service Worker cache version and critical asset list smoke
const fs = require('fs');
const path = require('path');
const assert = require('assert');

const root = path.join(__dirname, '..');
const swSource = fs.readFileSync(path.join(root, 'sw.js'), 'utf8');

const cacheMatch = swSource.match(/const CACHE_NAME = '([^']+)'/);
assert(cacheMatch, 'sw.js defines CACHE_NAME');
assert.strictEqual(cacheMatch[1], 'coc-engine-v18.1', 'CACHE_NAME bumped for V18.1 engine split');

const assetsMatch = swSource.match(/const ASSETS = \[([\s\S]*?)\];/);
assert(assetsMatch, 'sw.js defines ASSETS array');

const assets = [...assetsMatch[1].matchAll(/'([^']+)'/g)].map(m => m[1]);
assert(assets.length > 0, 'ASSETS is non-empty');

const critical = [
  '/index.html',
  '/js/coc.js',
  '/js/app.js',
  '/js/state.js',
  '/js/components/sanity_effects.js',
  '/js/audio/sfx.js',
];
for (const url of critical) {
  assert(assets.includes(url), `ASSETS lists critical path: ${url}`);
}

assert(
  swSource.includes('keys.filter(k => k !== CACHE_NAME)'),
  'activate handler evicts stale caches'
);

console.log('SW cache smoke: CACHE_NAME and critical ASSETS OK');
