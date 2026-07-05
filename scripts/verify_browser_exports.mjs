#!/usr/bin/env node
/**
 * verify_browser_exports.mjs — Assert each GENERATE_PAIRS .mjs export maps to window.* in .js
 *
 * Usage: node scripts/verify_browser_exports.mjs
 * Exit 1 on missing assignments (CI guard for build_browser.mjs drift).
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');

const BROWSER_ONLY = new Set([
    'js/ai/worker.js', 'js/ai/worker_client.js', 'js/audio/sfx.js',
    'js/components/dice_canvas.js', 'js/components/sanity_effects.js',
    'js/state/accessor.js', 'js/coc.js', 'js/audio/sfx.mjs', 'js/components/dice_canvas.mjs',
]);

const HANDLER_EXPORTS = new Set(['character', 'inventory', 'dice', 'clues', 'map', 'combat', 'mythos', 'npc', 'system']);

/** File-scoped bundles: exports are not window globals (loaded in script order). */
const FILE_SCOPED = new Set([
    'js/ai/network.mjs',
    'js/ai/tool_dispatch.mjs',
    'js/data/utils.mjs',
]);

/** Names build_browser must expose on window (mirrors mjsToBrowserJs rules). */
const WINDOW_GLOBAL_PATTERNS = [
    /^CoC[A-Z]/,
    /^CoCScenario[A-Z]/,
    /^View[A-Z]/,
    /^Story[A-Z]/,
    /^Canvas[A-Z]/,
    /^Coc[A-Z]/,
    /^DevLogs$/,
    /^ChatExport$/,
    /^parseItemData$/,
    /^generateNpcFromTemplate$/,
];

function loadGeneratePairs() {
    const src = fs.readFileSync(path.join(ROOT, 'scripts/build_browser.mjs'), 'utf8');
    const block = src.match(/const GENERATE_PAIRS = \[([\s\S]*?)\];/);
    if (!block) throw new Error('GENERATE_PAIRS not found in build_browser.mjs');
    const pairs = [];
    for (const m of block[1].matchAll(/\['([^']+)',\s*'([^']+)'\]/g)) {
        pairs.push([m[1], m[2]]);
    }
    return pairs;
}

function parseMjsExports(src) {
    const names = new Set();
    for (const m of src.matchAll(/^export\s+const\s+(\w+)/gm)) names.add(m[1]);
    for (const m of src.matchAll(/^export\s+function\s+(\w+)/gm)) names.add(m[1]);
    for (const m of src.matchAll(/^export\s+class\s+(\w+)/gm)) names.add(m[1]);
    for (const m of src.matchAll(/^export\s+\{([^}]+)\}(?!\s+from)/gm)) {
        for (const part of m[1].split(',')) {
            const name = part.trim().split(/\s+as\s+/).pop().trim();
            if (name) names.add(name);
        }
    }
    return names;
}

function mustBeOnWindow(name) {
    return WINDOW_GLOBAL_PATTERNS.some((re) => re.test(name));
}

function hasWindowExport(jsSrc, name, mjsRel) {
    if (HANDLER_EXPORTS.has(name) && mjsRel.includes('tools/handlers/') && !mjsRel.endsWith('index.mjs')) {
        return jsSrc.includes(`window.CoCToolHandlerModules.${name}`);
    }
    if (jsSrc.includes(`window.${name} =`) || jsSrc.includes(`window.${name}=`)) return true;
    if (jsSrc.includes(`window.${name} `)) return true;
    return false;
}

function verifyPair(mjsRel, jsRel) {
    if (BROWSER_ONLY.has(mjsRel) || BROWSER_ONLY.has(jsRel)) return null;
    if (mjsRel.endsWith('app.mjs')) return null;
    if (FILE_SCOPED.has(mjsRel)) return null;

    const mjsPath = path.join(ROOT, mjsRel);
    const jsPath = path.join(ROOT, jsRel);
    if (!fs.existsSync(mjsPath)) return `SKIP no source: ${mjsRel}`;
    if (!fs.existsSync(jsPath)) return `MISSING generated: ${jsRel}`;

    const mjsSrc = fs.readFileSync(mjsPath, 'utf8');
    const jsSrc = fs.readFileSync(jsPath, 'utf8');

    if (mjsRel.includes('js/engines/') && mjsRel.endsWith('.mjs')) {
        if (!jsSrc.includes('window.CoCEngine')) {
            return `${jsRel}: engine output missing window.CoCEngine assignment`;
        }
        return null;
    }

    if (mjsRel.endsWith('tools/handlers/index.mjs')) {
        if (!jsSrc.includes('window.CoCToolHandlers')) {
            return `${jsRel}: missing window.CoCToolHandlers`;
        }
        return null;
    }

    const exports = parseMjsExports(mjsSrc);
    const missing = [];
    for (const name of exports) {
        if (!mustBeOnWindow(name)) continue;
        if (!hasWindowExport(jsSrc, name, mjsRel)) missing.push(name);
    }
    if (missing.length) {
        return `${jsRel}: missing window export for: ${missing.join(', ')}`;
    }
    return null;
}

const pairs = loadGeneratePairs();
const errors = [];
let checked = 0;

for (const [mjsRel, jsRel] of pairs) {
    const result = verifyPair(mjsRel, jsRel);
    if (result && !result.startsWith('SKIP')) errors.push(result);
    if (result === null || (result && !result.startsWith('SKIP'))) checked++;
}

if (errors.length) {
    console.error('verify_browser_exports: FAIL\n' + errors.map((e) => `  - ${e}`).join('\n'));
    process.exit(1);
}

console.log(`verify_browser_exports: OK (${checked} pairs checked)`);
