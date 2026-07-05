// Service Worker cache version, asset completeness, and offline readiness smoke
const fs = require('fs');
const path = require('path');
const assert = require('assert');

const root = path.join(__dirname, '..');
const swSource = fs.readFileSync(path.join(root, 'sw.js'), 'utf8');
const indexHtml = fs.readFileSync(path.join(root, 'index.html'), 'utf8');

const cacheMatch = swSource.match(/const CACHE_NAME = '([^']+)'/);
assert(cacheMatch, 'sw.js defines CACHE_NAME');
assert.strictEqual(cacheMatch[1], 'coc-engine-v18.5', 'CACHE_NAME bumped for offline asset refresh');

const assetsMatch = swSource.match(/const ASSETS = \[([\s\S]*?)\];/);
assert(assetsMatch, 'sw.js defines ASSETS array');

const assets = [...assetsMatch[1].matchAll(/'([^']+)'/g)].map((m) => m[1]);
assert(assets.length > 0, 'ASSETS is non-empty');

const critical = [
  '/index.html',
  '/manifest.json',
  '/favicon.svg',
  '/vendor/vue.global.prod.js',
  '/vendor/bootstrap.min.css',
  '/vendor/chart.min.js',
  '/js/coc.js',
  '/js/app.js',
  '/js/state.js',
  '/js/state/accessor.js',
  '/js/data/ai_prompt_config.js',
  '/js/engines/dice.js',
  '/js/engines/combat.js',
  '/js/components/sanity_effects.js',
  '/js/audio/sfx.js',
];
for (const url of critical) {
  assert(assets.includes(url), `ASSETS lists critical path: ${url}`);
}

// Every local script/css referenced by index.html should be pre-cached
const localRefs = [
  ...indexHtml.matchAll(/<script[^>]+src="\.\/([^"]+)"/g),
  ...indexHtml.matchAll(/<link[^>]+href="\.\/([^"]+)"[^>]*rel="stylesheet"/g),
].map((m) => `/${m[1].replace(/^\.\//, '')}`);
const uniqueRefs = [...new Set(localRefs)];
for (const ref of uniqueRefs) {
  if (ref.startsWith('http')) continue;
  assert(assets.includes(ref), `index.html local ref is in ASSETS: ${ref}`);
  const diskPath = path.join(root, ref.replace(/^\//, '').replace(/\//g, path.sep));
  assert(fs.existsSync(diskPath), `index.html local ref exists on disk: ${ref}`);
}

// Vendor bundle completeness
for (const vendor of ['vue.global.prod.js', 'bootstrap.min.css', 'chart.min.js']) {
  assert(fs.existsSync(path.join(root, 'vendor', vendor)), `vendor/${vendor} present`);
}

// CDN is optional fallback only — no parallel blocking stylesheet from CDN
assert(
  !indexHtml.includes('cdn.jsdelivr.net/npm/bootstrap'),
  'bootstrap loads from local vendor only (CDN removed)'
);
const cdnScripts = [...indexHtml.matchAll(/https?:\/\/[^"']+/g)].map((m) => m[0]);
for (const url of cdnScripts) {
  assert(
    url.includes('unpkg.com/vue') || url.includes('cdn.jsdelivr.net/npm/chart'),
    `CDN URL is Vue/Chart conditional fallback only: ${url}`
  );
}

assert(
  swSource.includes('keys.filter((k) => k !== CACHE_NAME)') || swSource.includes('keys.filter(k => k !== CACHE_NAME)'),
  'activate handler evicts stale caches'
);
assert(swSource.includes('unpkg.com'), 'fetch handler skips unpkg CDN');

console.log(`SW cache smoke: CACHE_NAME and ${assets.length} ASSETS OK; offline refs verified`);
