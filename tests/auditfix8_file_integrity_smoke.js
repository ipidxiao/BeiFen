// ===============================================
// 归属：【QA】 测试用例 / 覆盖验证
// 程序/美术/策划 请勿直接修改测试逻辑
// 修改后放入 roles/qa/ 运行 merge.py 合并
// ===============================================

/** AUDITFIX8 file integrity smoke — alias: release-cleanliness (script graph, no stale artifacts) */
const fs = require('fs');
const path = require('path');
const assert = require('assert');

const root = path.join(__dirname, '..');
const indexHtml = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const localScripts = [...indexHtml.matchAll(/<script src="\.\/(js\/[^\"]+\.js|tests\/[^\"]+\.js)"><\/script>/g)].map(m => m[1]);
const jsFiles = fs.readdirSync(path.join(root, 'js'), { recursive: true })
  .filter(f => String(f).endsWith('.js'))
  .map(f => `js/${String(f).replace(/\\/g, '/')}`)
  .sort();

assert(!localScripts.some(src => src.startsWith('tests/')), 'release index.html does not auto-load tests');
assert(!indexHtml.includes('./tests/engine_tests.js'), 'engine_tests.js is not auto-run in release UI');
assert(indexHtml.includes('escapeHtml'), 'fatal error screen escapes dynamic error text before innerHTML');
assert(!fs.existsSync(path.join(root, 'js/tool_handlers.js')), 'legacy js/tool_handlers.js is absent');
assert(!fs.existsSync(path.join(root, 'js/tool_definitions.js')), 'legacy root tool_definitions.js is absent');
assert(!fs.existsSync(path.join(root, 'js/context_manager.js')), 'legacy root context_manager.js is absent');

const WORKER_FILES = new Set(["js/ai/worker.js", "js/ai/worker_client.js"]);
const LOADED_ENGINE_SCRIPTS = new Set(localScripts.filter(s => s.startsWith('js/engines/')));
// Architecture: items_db.js merged into items.js; kept as thin backward-compat wrapper, not loaded in release
const THIN_WRAPPERS = new Set(["js/data/items_db.js"]);
const missing = jsFiles.filter(file => {
  if (localScripts.includes(file)) return false;
  if (WORKER_FILES.has(file)) return false;
  if (THIN_WRAPPERS.has(file)) return false;
  // P0-2 engine splits on disk; coc.js remains authoritative until wired into index.html
  if (file.startsWith('js/engines/') && !LOADED_ENGINE_SCRIPTS.has(file)) return false;
  return true;
});
assert.deepStrictEqual(missing, [], `every js file is loaded by index.html: missing ${missing.join(', ')}`);

const missingFiles = localScripts.filter(file => !fs.existsSync(path.join(root, file)));
assert.deepStrictEqual(missingFiles, [], `index.html points only to existing local scripts: missing ${missingFiles.join(', ')}`);

const dangerousPatterns = [
  [/\b(?:window\.)?(?:alert|confirm)\s*\(/, 'direct alert/confirm'],
  [/\beval\s*\(/, 'eval'],
  [/\bnew\s+Function\s*\(/, 'new Function'],
  [/\bdocument\.write\s*\(/, 'document.write']
];
const offenders = [];
for (const file of jsFiles) {
  const source = fs.readFileSync(path.join(root, file), 'utf8');
  for (const [regex, label] of dangerousPatterns) {
    if (regex.test(source)) offenders.push(`${file}: ${label}`);
  }
}
assert.deepStrictEqual(offenders, [], 'source has no direct dialog/eval/document.write calls');

const packagedZips = fs.readdirSync(root, { recursive: true }).filter(f => String(f).toLowerCase().endsWith('.zip'));
// Exclude the release bundle zip (self-contained package)
const nonReleaseZips = packagedZips.filter(f => !f.startsWith('CoC_Engine_'));
assert.deepStrictEqual(nonReleaseZips, [], 'release package does not contain nested zip archives');

console.log('AUDITFIX8 file integrity smoke tests passed');
