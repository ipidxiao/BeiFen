#!/usr/bin/env node
/**
 * build_browser.mjs — Generate browser IIFE .js from ESM .mjs sources.
 *
 * Mechanical transform only (no esbuild): strips imports, maps exports to window.*.
 * Asset lists (GENERATE_PAIRS, index.html scripts, sw.js ASSETS/CACHE_NAME) live in
 * scripts/asset_manifest.mjs — this script syncs them on every run.
 *
 * LIMITATIONS (regex transform — not a bundler):
 * - Does not resolve or bundle imports; load order in index.html must satisfy deps.
 * - Re-exports (`export { x } from './y'`) and `export default` are not supported.
 * - Multiline export blocks or `export async function` may need manual follow-up.
 * - Engine .mjs files use attach* heuristics; new engine shapes need builder updates.
 * - Hand-maintained BROWSER_ONLY files are never overwritten.
 *
 * Usage:
 *   node scripts/build_browser.mjs          — generate .js + sync sw.js + index.html
 *   node scripts/build_browser.mjs --check  — exit 1 on any drift (CI guard)
 *
 * After adding window-visible exports: npm run test:exports
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
    ROOT,
    GENERATE_PAIRS,
    BROWSER_ONLY_GENERATE,
    getCacheName,
    formatIndexScriptBlock,
    formatSwAssetsArray,
    discoverUnlistedMjs,
} from './asset_manifest.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const BROWSER_ONLY = BROWSER_ONLY_GENERATE;

const HANDLER_EXPORTS = new Set(['character', 'inventory', 'dice', 'clues', 'map', 'combat', 'mythos', 'npc', 'system']);

const INDEX_MARKER_START = '<!-- @generated script-tags — do not edit; run: npm run build:js -->';
const INDEX_MARKER_END = '<!-- @generated-end script-tags -->';

const APP_BROWSER = `// GENERATED from js/app.mjs — do not edit; run: npm run build:js
// Browser bootstrap — globals are set by prior <script> tags in index.html
const { createApp } = window.Vue;

const app = createApp({
    setup() {
        const state = window.CoCState || { gameState: { currentScreen: 'lobby' } };
        const ai = window.CoCAI || {};
        return { ...state, ...ai };
    }
});

if (window.ViewLobby) app.component('view-lobby', window.ViewLobby);
else throw new Error("找不到大厅视图！");
if (window.ViewCreator) app.component('view-creator', window.ViewCreator);
else throw new Error("找不到车卡视图！");
if (window.ViewStory) app.component('view-story', window.ViewStory);
else throw new Error("找不到剧情视图！");
if (window.ViewDevLog) app.component('view-dev-log', window.ViewDevLog);
else throw new Error("找不到开发日志视图！");
if (window.CocToastLayer) app.component('coc-toast-layer', window.CocToastLayer);
else throw new Error("找不到 Toast 组件！");
if (window.CocConfirmDialog) app.component('coc-confirm-dialog', window.CocConfirmDialog);
else throw new Error("找不到确认对话框组件！");
if (window.CocIcon) app.component('coc-icon', window.CocIcon);
else throw new Error("找不到图标组件！");

app.mount('#app');
`;

function stripImports(src) {
    return src
        .replace(/^import\s+[\s\S]*?from\s+['"][^'"]+['"];?\s*$/gm, '')
        .replace(/^import\s+['"][^'"]+['"];?\s*$/gm, '');
}

function stripExports(src) {
    let code = src;
    const exportBlocks = [];
    code = code.replace(/^export\s+\{([^}]+)\}\s*;?\s*$/gm, (_, names) => {
        exportBlocks.push(names);
        return '';
    });
    code = code.replace(/^export\s+default\s+/gm, '');
    code = code.replace(/^export\s+async\s+function\s+(\w+)/gm, 'async function $1');
    code = code.replace(/^export\s+function\s+attach(\w+)\s*\(/gm, 'function attach$1(');
    code = code.replace(/^export\s+function\s+(\w+)/gm, 'function $1');
    code = code.replace(/^export\s+const\s+(\w+)\s*=/gm, 'const $1 =');
    code = code.replace(/^export\s+class\s+(\w+)/gm, 'class $1');
    return { code, exportBlocks };
}

function applyExportBlocks(code, exportBlocks) {
    const lines = [];
    for (const block of exportBlocks) {
        for (const part of block.split(',')) {
            const name = part.trim().split(/\s+as\s+/).pop().trim();
            if (name) lines.push(`window.${name} = ${name};`);
        }
    }
    if (lines.length) code = code.trimEnd() + '\n\n' + lines.join('\n') + '\n';
    return code;
}

function removeRedundantWindowAliases(code) {
    return code.replace(/^window\.(\w+)\s*=\s*\1\s*;\s*$/gm, '');
}

function transformHandlers(code) {
    for (const h of HANDLER_EXPORTS) {
        code = code.replace(
            new RegExp(`^function\\s+${h}\\s*\\(`, 'm'),
            `window.CoCToolHandlerModules = window.CoCToolHandlerModules || {};\nwindow.CoCToolHandlerModules.${h} = function(`
        );
    }
    return code;
}

function transformHandlerIndex(code) {
    code = code.replace(
        /const MODULES = \{ character, inventory, dice, clues, map, combat, mythos, npc, system \};/,
        'const MODULES = window.CoCToolHandlerModules;'
    );
    code = code.replace(/\nwindow\.CoCToolHandlerModules = MODULES;\s*/g, '\n');
    code = code.replace(/window\.CoCToolHandlers = CoCToolHandlers;\s*/g, '');
    if (!code.includes('window.CoCToolHandlers = {')) {
        code = code.replace(
            /const getLoadedModuleNames = \(\) => Object\.keys\(MODULES\)\.sort\(\);/,
            `const getLoadedModuleNames = () => Object.keys(MODULES).sort();

window.CoCToolHandlers = { create, getHandlerNames, getModuleOrder, getLoadedModuleNames };`
        );
    }
    return code;
}

function transformEngineMjs(code, relPath) {
    const flatMatch = code.match(/function attach(\w+)Engine\(CoCEngine\)\s*\{([\s\S]*)\}\s*$/);
    const nestedMatch = code.match(/function attach(\w+)\(CoCEngine\)\s*\{\s*CoCEngine\.(\w+)\s*=\s*([\s\S]*);\s*\}\s*$/);
    const header = `// GENERATED from ${relPath.replace(/\\/g, '/')} — do not edit; run: npm run build:js\nwindow.CoCEngine = window.CoCEngine || {};\n`;

    if (flatMatch) {
        let body = flatMatch[2].trim();
        body = body.replace(/CoCEngine\./g, 'window.CoCEngine.');
        body = body.replace(/(?<!window\.)\bCoCBaseSkills\b/g, 'window.CoCBaseSkills');
        body = body.replace(/(?<!window\.)\bCoCJobs\b/g, 'window.CoCJobs');
        if (body.startsWith('Object.assign(CoCEngine,')) {
            body = body.replace('Object.assign(CoCEngine,', 'Object.assign(window.CoCEngine,');
        } else if (body.startsWith('const parsePoints')) {
            const assignIdx = body.indexOf('Object.assign(CoCEngine,');
            if (assignIdx >= 0) {
                const prefix = body.slice(0, assignIdx);
                const rest = body.slice(assignIdx).replace('Object.assign(CoCEngine,', 'Object.assign(window.CoCEngine,');
                return header + prefix + rest + '\n';
            }
        }
        return header + body + '\n';
    }

    if (nestedMatch) {
        let obj = nestedMatch[3].trim();
        obj = obj.replace(/CoCEngine\./g, 'window.CoCEngine.');
        for (const g of ['CoCInjuryTables', 'CoCInsanityTables', 'CoCMythosTomes', 'CoCSpells', 'CoCStudyState']) {
            obj = obj.replace(new RegExp(`(?<!window\\.)\\b${g}\\b`, 'g'), `window.${g}`);
        }
        return header + `window.CoCEngine.${nestedMatch[2]} = ${obj};\n`;
    }

    return null;
}

function mjsToBrowserJs(src, relPath) {
    if (relPath.endsWith('app.mjs')) {
        return APP_BROWSER;
    }

    if (relPath.endsWith('campaign/london_kp_engine.mjs')) {
        const banner = `// GENERATED from ${relPath.replace(/\\/g, '/')} — do not edit; run: npm run build:js\n`;
        return `${banner}window.CoCLondonKpEngine = window.KpExecutionEngine;\n`;
    }

    if (relPath.includes('js/engines/') && relPath.endsWith('.mjs') && !relPath.endsWith('index.mjs')) {
        const engineOut = transformEngineMjs(stripImports(src.replace(/^\uFEFF/, '')), relPath);
        if (engineOut) return engineOut;
    }

    let code = src.replace(/^\uFEFF/, '');
    code = stripImports(code);
    const { code: stripped, exportBlocks } = stripExports(code);
    code = stripped;

    code = transformHandlers(code);

    const constExports = [...code.matchAll(/^const (CoC\w+|DevLogs|parseItemData|safeJsonParse|safeJsonClone|View\w+|Story\w+|CanvasChat|Coc\w+|generateNpcFromTemplate)\s*=/gm)].map(m => m[1]);
    for (const name of constExports) {
        if (!code.includes(`window.${name} =`)) {
            code = code.replace(new RegExp(`^const ${name}\\s*=`, 'm'), `window.${name} =`);
        }
    }

    if (relPath.endsWith('tools/handlers/index.mjs')) {
        code = transformHandlerIndex(code);
    }

    code = applyExportBlocks(code, exportBlocks);
    code = removeRedundantWindowAliases(code);

    if (relPath.endsWith('state/state.mjs')) {
        code = code.replace(/^const SAVE_SCHEMA_VERSION = \d+;\s*/m, '');
    }

    for (const name of ['StoryInv', 'StoryChat', 'StoryChar', 'StoryEquip', 'StoryDice', 'StoryCombat', 'StoryMap', 'StoryClues', 'StoryStore', 'StoryNpc', 'StoryJournal', 'StoryGrowth', 'CanvasChat', 'ViewLobby', 'ViewCreator', 'ViewStory', 'ViewDevLog', 'CocToastLayer', 'CocIcon', 'CoCScenarioTutorial', 'CoCScenarioDeepOneShadow', 'CoCScenarioCatalog', 'CoCScenarioRunner', 'CoCScenarioPdfImport', 'ChatExport']) {
        if (code.includes(`const ${name} =`) && !code.includes(`window.${name} =`)) {
            code = code.replace(new RegExp(`^const ${name}\\s*=`, 'm'), `window.${name} =`);
        }
    }

    for (const name of ['parseItemData', 'generateNpcFromTemplate']) {
        if (code.includes(`function ${name}(`) && !code.includes(`window.${name}`)) {
            code = code.trimEnd() + `\nwindow.${name} = ${name};\n`;
        }
    }

    const banner = `// GENERATED from ${relPath.replace(/\\/g, '/')} — do not edit; run: npm run build:js\n`;
    if (!code.startsWith('// GENERATED')) {
        code = banner + code;
    }

    return code.trimEnd() + '\n';
}

function syncSwJs(checkOnly) {
    const swPath = path.join(ROOT, 'sw.js');
    let sw = fs.readFileSync(swPath, 'utf8');
    const cacheName = getCacheName();
    const cacheLine = `const CACHE_NAME = '${cacheName}';`;
    const assetsBody = formatSwAssetsArray();
    const assetsBlock = `const ASSETS = [\n${assetsBody}\n];`;

    const nextCache = sw.replace(/const CACHE_NAME = '[^']+';/, cacheLine);
    const next = nextCache.replace(/const ASSETS = \[[\s\S]*?\];/, assetsBlock);

    if (next !== sw) {
        if (!checkOnly) {
            fs.writeFileSync(swPath, next, 'utf8');
            console.log(`WROTE sw.js (CACHE_NAME=${cacheName}, ${getSwAssetsCount(next)} assets)`);
        } else {
            console.log('DRIFT sw.js');
        }
        return true;
    }
    return false;
}

function getSwAssetsCount(swSource) {
    const m = swSource.match(/const ASSETS = \[([\s\S]*?)\];/);
    if (!m) return 0;
    return [...m[1].matchAll(/'([^']+)'/g)].length;
}

function syncIndexHtml(checkOnly) {
    const indexPath = path.join(ROOT, 'index.html');
    let html = fs.readFileSync(indexPath, 'utf8');
    if (!html.includes(INDEX_MARKER_START) || !html.includes(INDEX_MARKER_END)) {
        console.warn('WARN index.html missing @generated script-tags markers — skipping sync');
        return false;
    }
    const block = `${INDEX_MARKER_START}\n${formatIndexScriptBlock()}\n    ${INDEX_MARKER_END}`;
    const pattern = new RegExp(
        `${INDEX_MARKER_START.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[\\s\\S]*?${INDEX_MARKER_END.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`
    );
    const next = html.replace(pattern, block);
    if (next !== html) {
        if (!checkOnly) {
            fs.writeFileSync(indexPath, next, 'utf8');
            console.log('WROTE index.html script-tags');
        } else {
            console.log('DRIFT index.html');
        }
        return true;
    }
    return false;
}

const checkOnly = process.argv.includes('--check');
let changed = 0;
let generated = 0;
let skipped = 0;

for (const [mjsRel, jsRel] of GENERATE_PAIRS) {
    if (BROWSER_ONLY.has(mjsRel) || BROWSER_ONLY.has(jsRel)) {
        skipped++;
        continue;
    }
    const mjsPath = path.join(ROOT, mjsRel);
    const jsPath = path.join(ROOT, jsRel);
    if (!fs.existsSync(mjsPath)) {
        console.warn(`SKIP (no source): ${mjsRel}`);
        skipped++;
        continue;
    }
    const src = fs.readFileSync(mjsPath, 'utf8');
    const out = mjsToBrowserJs(src, mjsRel);
    const prev = fs.existsSync(jsPath) ? fs.readFileSync(jsPath, 'utf8') : '';
    if (out !== prev) {
        changed++;
        if (!checkOnly) {
            fs.mkdirSync(path.dirname(jsPath), { recursive: true });
            fs.writeFileSync(jsPath, out, 'utf8');
            console.log(`WROTE ${jsRel}`);
        } else {
            console.log(`DRIFT ${jsRel}`);
        }
    }
    generated++;
}

if (syncSwJs(checkOnly)) changed++;
if (syncIndexHtml(checkOnly)) changed++;

const unlisted = discoverUnlistedMjs();
if (unlisted.length) {
    console.warn(`WARN unlisted .mjs (not in GENERATE_PAIRS): ${unlisted.join(', ')}`);
}

console.log(`\nbuild_browser: ${generated} targets, ${changed} ${checkOnly ? 'drifted' : 'written'}, ${skipped} skipped (browser-only)`);
if (checkOnly && changed > 0) process.exit(1);
