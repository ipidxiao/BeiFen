#!/usr/bin/env node
/**
 * build_browser.mjs — Generate browser IIFE .js from ESM .mjs sources.
 *
 * Mechanical transform only (no esbuild): strips imports, maps exports to window.*.
 * Browser-only files are excluded (see BROWSER_ONLY below).
 *
 * Usage: node scripts/build_browser.mjs [--check]
 *   --check  Exit 1 if generated output would differ (CI drift guard).
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');

/** Files kept hand-maintained — never overwrite from generator. */
const BROWSER_ONLY = new Set([
    'js/ai/worker.js',
    'js/ai/worker_client.js',
    'js/audio/sfx.js',
    'js/components/dice_canvas.js',
    'js/components/sanity_effects.js',
    'js/state/accessor.js',
    'js/coc.js',
    'js/audio/sfx.mjs',
    'js/components/dice_canvas.mjs',
]);

const HANDLER_EXPORTS = new Set(['character', 'inventory', 'dice', 'clues', 'map', 'combat', 'mythos', 'npc', 'system']);

/** [mjsRelative, jsRelative] — mirrors index.html load surface. */
const GENERATE_PAIRS = [
    ['js/data/skills.mjs', 'js/data/skills.js'],
    ['js/data/jobs.mjs', 'js/data/jobs.js'],
    ['js/data/experiences.mjs', 'js/data/experiences.js'],
    ['js/data/items.mjs', 'js/data/items.js'],
    ['js/data/dev_logs.mjs', 'js/data/dev_logs.js'],
    ['js/data/scenarios/tutorial.mjs', 'js/data/scenarios/tutorial.js'],
    ['js/data/scenarios/deep_one_shadow.mjs', 'js/data/scenarios/deep_one_shadow.js'],
    ['js/data/scenarios/abandoned_asylum.mjs', 'js/data/scenarios/abandoned_asylum.js'],
    ['js/data/scenarios/midnight_museum.mjs', 'js/data/scenarios/midnight_museum.js'],
    ['js/data/scenarios/coastal_festival.mjs', 'js/data/scenarios/coastal_festival.js'],
    ['js/data/scenarios/university_occult.mjs', 'js/data/scenarios/university_occult.js'],
    ['js/data/scenarios/lighthouse_signal.mjs', 'js/data/scenarios/lighthouse_signal.js'],
    ['js/data/scenarios/missing_child.mjs', 'js/data/scenarios/missing_child.js'],
    ['js/data/scenarios/train_to_nowhere.mjs', 'js/data/scenarios/train_to_nowhere.js'],
    ['js/data/scenarios/carnival_of_masks.mjs', 'js/data/scenarios/carnival_of_masks.js'],
    ['js/data/scenarios/remote_catalog.mjs', 'js/data/scenarios/remote_catalog.js'],
    ['js/data/scenarios/catalog.mjs', 'js/data/scenarios/catalog.js'],
    ['js/scenario/store.mjs', 'js/scenario/store.js'],
    ['js/scenario/runner.mjs', 'js/scenario/runner.js'],
    ['js/data/logger.mjs', 'js/data/logger.js'],
    ['js/data/utils.mjs', 'js/data/utils.js'],
    ['js/data/ai_prompt_config.mjs', 'js/data/ai_prompt_config.js'],
    ['js/data/injury_tables.mjs', 'js/data/injury_tables.js'],
    ['js/data/insanity_tables.mjs', 'js/data/insanity_tables.js'],
    ['js/data/mythos_tomes.mjs', 'js/data/mythos_tomes.js'],
    ['js/data/npc_templates.mjs', 'js/data/npc_templates.js'],
    ['js/data/spells.mjs', 'js/data/spells.js'],
    ['js/engines/dice.mjs', 'js/engines/dice.js'],
    ['js/engines/attributes.mjs', 'js/engines/attributes.js'],
    ['js/engines/skills.mjs', 'js/engines/skills.js'],
    ['js/engines/combat.mjs', 'js/engines/combat.js'],
    ['js/engines/healing.mjs', 'js/engines/healing.js'],
    ['js/engines/sanity.mjs', 'js/engines/sanity.js'],
    ['js/engines/wound.mjs', 'js/engines/wound.js'],
    ['js/engines/mythos.mjs', 'js/engines/mythos.js'],
    ['js/engines/environmental.mjs', 'js/engines/environmental.js'],
    ['js/engines/poison.mjs', 'js/engines/poison.js'],
    ['js/state/core.mjs', 'js/state/core.js'],
    ['js/state/ui.mjs', 'js/state/ui.js'],
    ['js/state/gameplay.mjs', 'js/state/gameplay.js'],
    ['js/state/persistence.mjs', 'js/state/persistence.js'],
    ['js/state/state.mjs', 'js/state.js'],
    ['js/tools/definitions.mjs', 'js/tools/definitions.js'],
    ['js/tools/handlers/character.mjs', 'js/tools/handlers/character.js'],
    ['js/tools/handlers/inventory.mjs', 'js/tools/handlers/inventory.js'],
    ['js/tools/handlers/dice.mjs', 'js/tools/handlers/dice.js'],
    ['js/tools/handlers/clues.mjs', 'js/tools/handlers/clues.js'],
    ['js/tools/handlers/map.mjs', 'js/tools/handlers/map.js'],
    ['js/tools/handlers/combat.mjs', 'js/tools/handlers/combat.js'],
    ['js/tools/handlers/mythos.mjs', 'js/tools/handlers/mythos.js'],
    ['js/tools/handlers/npc.mjs', 'js/tools/handlers/npc.js'],
    ['js/tools/handlers/system.mjs', 'js/tools/handlers/system.js'],
    ['js/tools/handlers/index.mjs', 'js/tools/handlers/index.js'],
    ['js/core/context_manager.mjs', 'js/core/context_manager.js'],
    ['js/ai/network.mjs', 'js/ai/network.js'],
    ['js/ai/tool_dispatch.mjs', 'js/ai/tool_dispatch.js'],
    ['js/ai_logic.mjs', 'js/ai_logic.js'],
    ['js/components/char_creator.mjs', 'js/components/char_creator.js'],
    ['js/components/story_chat.mjs', 'js/components/story_chat.js'],
    ['js/components/story_char.mjs', 'js/components/story_char.js'],
    ['js/components/story_inv.mjs', 'js/components/story_inv.js'],
    ['js/components/story_equip.mjs', 'js/components/story_equip.js'],
    ['js/components/canvas_chat.mjs', 'js/components/canvas_chat.js'],
    ['js/components/story_store.mjs', 'js/components/story_store.js'],
    ['js/components/story_journal.mjs', 'js/components/story_journal.js'],
    ['js/components/story_npc.mjs', 'js/components/story_npc.js'],
    ['js/components/story_combat.mjs', 'js/components/story_combat.js'],
    ['js/components/story_growth.mjs', 'js/components/story_growth.js'],
    ['js/components/story_map.mjs', 'js/components/story_map.js'],
    ['js/components/story_clues.mjs', 'js/components/story_clues.js'],
    ['js/components/story_dice.mjs', 'js/components/story_dice.js'],
    ['js/components/ui_feedback.mjs', 'js/components/ui_feedback.js'],
    ['js/views/lobby_view.mjs', 'js/views/lobby_view.js'],
    ['js/views/creator_view.mjs', 'js/views/creator_view.js'],
    ['js/views/story_view.mjs', 'js/views/story_view.js'],
    ['js/views/dev_log_view.mjs', 'js/views/dev_log_view.js'],
    ['js/chat_export.mjs', 'js/chat_export.js'],
    ['js/app.mjs', 'js/app.js'],
];

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
    code = code.replace(/^export\s+function\s+attach(\w+)\s*\(/gm, 'function attach$1(');
    code = code.replace(/^export\s+function\s+(\w+)/gm, 'function $1');
    code = code.replace(/^export\s+const\s+(\w+)\s*=/gm, 'const $1 =');
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

    if (relPath.includes('js/engines/') && relPath.endsWith('.mjs') && !relPath.endsWith('index.mjs')) {
        const engineOut = transformEngineMjs(stripImports(src.replace(/^\uFEFF/, '')), relPath);
        if (engineOut) return engineOut;
    }

    let code = src.replace(/^\uFEFF/, '');
    code = stripImports(code);
    const { code: stripped, exportBlocks } = stripExports(code);
    code = stripped;

    code = transformHandlers(code);

    // export const Name = already handled by stripExports → const Name =
    // Re-assign const exports that should be global
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

    // Components/views: ensure window assignment for export const pattern
    for (const name of ['StoryInv', 'StoryChat', 'StoryChar', 'StoryEquip', 'StoryDice', 'StoryCombat', 'StoryMap', 'StoryClues', 'StoryStore', 'StoryNpc', 'StoryJournal', 'StoryGrowth', 'CanvasChat', 'ViewLobby', 'ViewCreator', 'ViewStory', 'ViewDevLog', 'CocToastLayer', 'CoCScenarioTutorial', 'CoCScenarioDeepOneShadow', 'CoCScenarioCatalog', 'CoCScenarioRunner', 'ChatExport']) {
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

console.log(`\nbuild_browser: ${generated} targets, ${changed} ${checkOnly ? 'drifted' : 'written'}, ${skipped} skipped (browser-only)`);
if (checkOnly && changed > 0) process.exit(1);
