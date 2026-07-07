/**
 * ESM Phase 2 boot smoke — verifies ?esm=1 gate and app.mjs import chain (no mount).
 */
import './helpers/browser-mock.mjs';
import { strict as assert } from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const indexHtml = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const appMjs = fs.readFileSync(path.join(root, 'js', 'app.mjs'), 'utf8');
const appJs = fs.readFileSync(path.join(root, 'js', 'app.js'), 'utf8');

assert(indexHtml.includes('__COC_ESM_BOOT__'), 'index.html sets ESM boot flag');
assert(indexHtml.includes('type="module"') && indexHtml.includes("import('./js/app.mjs')"), 'index.html has conditional ESM import');
assert(appMjs.includes('if (!window.__COC_ESM_BOOT__) app.mount'), 'app.mjs guards mount');
assert(appJs.includes('if (!window.__COC_ESM_BOOT__) app.mount'), 'app.js guards mount (generated)');

assert(fs.existsSync(path.join(root, 'tests/ESM_PHASE2_NEXT.md')), 'ESM Phase 2 next-steps doc (OPT-033)');

// Import core ESM assembly without running app bootstrap
const { CoCEngine } = await import('../js/coc.mjs');
assert(CoCEngine && typeof CoCEngine.checkSkill === 'function', 'coc.mjs CoCEngine');
assert(CoCEngine.HealingEngine, 'HealingEngine via ESM');
assert(CoCEngine.SanityEngine, 'SanityEngine via ESM (OPT-031)');
assert(CoCEngine.MajorWoundEngine, 'MajorWoundEngine via ESM (OPT-031)');

const { GLOBALS_REGISTRY } = await import('../js/core/globals_registry.mjs');
assert(GLOBALS_REGISTRY.CoCEngine, 'globals registry ESM import (OPT-036)');

console.log('esm_phase2_boot_smoke: ESM gate + coc.mjs import OK');
