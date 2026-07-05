/**
 * asset_manifest.mjs — Single source of truth for browser asset lists.
 *
 * Consumed by build_browser.mjs (GENERATE_PAIRS, SW ASSETS, index.html scripts),
 * verify_browser_exports.mjs, and smoke tests.
 */
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const ROOT = path.join(__dirname, '..');

/** Read package.json version for SW cache busting. */
export function getPackageVersion() {
    const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));
    return String(pkg.version || '0.0.0');
}

/** Short hash of bundled asset sources — busts SW cache when content changes without version bump. */
export function getManifestContentHash() {
    const hash = crypto.createHash('sha256');
    for (const [mjs] of GENERATE_PAIRS) {
        const full = path.join(ROOT, mjs);
        if (fs.existsSync(full) && fs.statSync(full).isFile()) hash.update(fs.readFileSync(full));
        hash.update('\0');
    }
    return hash.digest('hex').slice(0, 8);
}

/** Service Worker cache bucket name — version + content hash from package.json + manifest. */
export function getCacheName() {
    return `coc-engine-v${getPackageVersion()}-${getManifestContentHash()}`;
}

/** [mjsRelative, jsRelative] — ESM sources transformed to browser IIFE globals. */
export const GENERATE_PAIRS = [
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
    ['js/scenario/pdf_import.mjs', 'js/scenario/pdf_import.js'],
    ['js/scenario/store.mjs', 'js/scenario/store.js'],
    ['js/scenario/runner.mjs', 'js/scenario/runner.js'],
    ['js/data/logger.mjs', 'js/data/logger.js'],
    ['js/data/utils.mjs', 'js/data/utils.js'],
    ['js/data/ai_prompt_config.mjs', 'js/data/ai_prompt_config.js'],
    ['js/data/campaigns/masks_london_kp_rules.mjs', 'js/data/campaigns/masks_london_kp_rules.js'],
    ['js/data/campaigns/masks_london_antagonist_rules.mjs', 'js/data/campaigns/masks_london_antagonist_rules.js'],
    ['js/data/campaigns/language_self_correction.mjs', 'js/data/campaigns/language_self_correction.js'],
    ['js/data/campaigns/masks_london_master_state.mjs', 'js/data/campaigns/masks_london_master_state.js'],
    ['js/data/campaigns/masks_london_catalog.mjs', 'js/data/campaigns/masks_london_catalog.js'],
    ['js/campaign/kp_execution_engine.mjs', 'js/campaign/kp_execution_engine.js'],
    ['js/campaign/london_kp_engine.mjs', 'js/campaign/london_kp_engine.js'],
    ['js/campaign/kp_game_loop.mjs', 'js/campaign/kp_game_loop.js'],
    ['js/campaign/campaign_loader.mjs', 'js/campaign/campaign_loader.js'],
    ['js/ai/language_filter.mjs', 'js/ai/language_filter.js'],
    ['js/ai/output_protocol.mjs', 'js/ai/output_protocol.js'],
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
    ['js/state/kp_config.mjs', 'js/state/kp_config.js'],
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

/** Hand-maintained browser scripts (not generated from .mjs). */
export const BROWSER_ONLY_SCRIPTS = [
    'js/coc.js',
    'js/state/accessor.js',
    'js/audio/sfx.js',
    'js/components/dice_canvas.js',
    'js/components/sanity_effects.js',
];

/**
 * Ordered script load surface for index.html (dependency order preserved).
 * Generated .js paths plus browser-only scripts interleaved at correct positions.
 */
export const INDEX_SCRIPT_PATHS = [
    'js/data/jobs.js',
    'js/data/experiences.js',
    'js/data/items.js',
    'js/data/dev_logs.js',
    'js/data/skills.js',
    'js/data/scenarios/tutorial.js',
    'js/data/scenarios/deep_one_shadow.js',
    'js/data/scenarios/abandoned_asylum.js',
    'js/data/scenarios/midnight_museum.js',
    'js/data/scenarios/coastal_festival.js',
    'js/data/scenarios/university_occult.js',
    'js/data/scenarios/lighthouse_signal.js',
    'js/data/scenarios/missing_child.js',
    'js/data/scenarios/train_to_nowhere.js',
    'js/data/scenarios/carnival_of_masks.js',
    'js/data/scenarios/remote_catalog.js',
    'js/data/scenarios/catalog.js',
    'js/scenario/pdf_import.js',
    'js/scenario/store.js',
    'js/data/mythos_tomes.js',
    'js/data/spells.js',
    'js/data/injury_tables.js',
    'js/data/npc_templates.js',
    'js/data/insanity_tables.js',
    'js/data/campaigns/masks_london_kp_rules.js',
    'js/data/campaigns/masks_london_antagonist_rules.js',
    'js/data/campaigns/language_self_correction.js',
    'js/data/campaigns/masks_london_master_state.js',
    'js/data/campaigns/masks_london_catalog.js',
    'js/state/kp_config.js',
    'js/campaign/kp_execution_engine.js',
    'js/campaign/london_kp_engine.js',
    'js/campaign/kp_game_loop.js',
    'js/campaign/campaign_loader.js',
    'js/coc.js',
    'js/engines/dice.js',
    'js/engines/attributes.js',
    'js/engines/skills.js',
    'js/engines/combat.js',
    'js/engines/healing.js',
    'js/engines/sanity.js',
    'js/engines/wound.js',
    'js/engines/mythos.js',
    'js/engines/environmental.js',
    'js/engines/poison.js',
    'js/core/context_manager.js',
    'js/tools/definitions.js',
    'js/data/logger.js',
    'js/data/utils.js',
    'js/state/core.js',
    'js/state/ui.js',
    'js/state/gameplay.js',
    'js/state/persistence.js',
    'js/state.js',
    'js/state/accessor.js',
    'js/tools/handlers/character.js',
    'js/tools/handlers/inventory.js',
    'js/tools/handlers/dice.js',
    'js/tools/handlers/clues.js',
    'js/tools/handlers/map.js',
    'js/tools/handlers/combat.js',
    'js/tools/handlers/mythos.js',
    'js/tools/handlers/npc.js',
    'js/tools/handlers/system.js',
    'js/tools/handlers/index.js',
    'js/components/char_creator.js',
    'js/ai/network.js',
    'js/ai/tool_dispatch.js',
    'js/ai/language_filter.js',
    'js/ai/output_protocol.js',
    'js/data/ai_prompt_config.js',
    'js/ai_logic.js',
    'js/scenario/runner.js',
    'js/components/story_chat.js',
    'js/components/story_char.js',
    'js/components/story_inv.js',
    'js/components/story_equip.js',
    'js/components/canvas_chat.js',
    'js/components/story_store.js',
    'js/views/lobby_view.js',
    'js/views/creator_view.js',
    'js/components/story_journal.js',
    'js/components/story_npc.js',
    'js/components/story_combat.js',
    'js/components/story_growth.js',
    'js/components/story_map.js',
    'js/components/story_clues.js',
    'js/audio/sfx.js',
    'js/components/dice_canvas.js',
    'js/components/story_dice.js',
    'js/chat_export.js',
    'js/views/story_view.js',
    'js/views/dev_log_view.js',
    'js/components/sanity_effects.js',
    'js/components/ui_feedback.js',
    'js/app.js',
];

/** Static paths cached by SW but not emitted as index.html script tags. */
export const SW_STATIC_EXTRAS = [
    '/',
    '/index.html',
    '/manifest.json',
    '/favicon.svg',
    '/sw.js',
    '/css/style.css',
    '/vendor/vue.global.prod.js',
    '/vendor/bootstrap.min.css',
    '/vendor/chart.min.js',
    '/vendor/pdf.min.js',
    '/vendor/pdf.worker.min.js',
    '/js/data/scenarios/packages/isolated_lab.json',
    '/js/data/scenarios/packages/haunted_inheritance.json',
    '/js/data/scenarios/packages/cc_asylum_whispers.json',
    '/js/data/scenarios/packages/cc_lighthouse_log.json',
    '/js/data/scenarios/packages/cc_museum_night.json',
    '/js/data/scenarios/packages/cc_green_vicar.json',
    '/js/data/scenarios/packages/cc_white_widow_reef.json',
    '/js/data/scenarios/packages/cc_mayvale_blizzard.json',
];

/** Files kept hand-maintained — never overwrite from build_browser generator. */
export const BROWSER_ONLY_GENERATE = new Set([
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

/** Build ordered SW ASSETS list (deduped, stable order). */
export function getSwAssets() {
    const fromIndex = INDEX_SCRIPT_PATHS.map((p) => `/${p.replace(/\\/g, '/')}`);
    const seen = new Set();
    const out = [];
    for (const url of [...SW_STATIC_EXTRAS, ...fromIndex]) {
        const norm = url.replace(/\\/g, '/');
        if (seen.has(norm)) continue;
        seen.add(norm);
        out.push(norm);
    }
    return out;
}

/** Format index.html script block from manifest. */
export function formatIndexScriptBlock() {
    return INDEX_SCRIPT_PATHS.map((p) => `    <script src="./${p.replace(/\\/g, '/')}"></script>`).join('\n');
}

/** Format sw.js ASSETS array body. */
export function formatSwAssetsArray() {
    return getSwAssets().map((u) => `    '${u}',`).join('\n');
}

/**
 * Discover .mjs files under js/ not listed in GENERATE_PAIRS (drift helper).
 * @returns {string[]} relative paths
 */
export function discoverUnlistedMjs() {
    const listed = new Set(GENERATE_PAIRS.map(([m]) => m.replace(/\\/g, '/')));
    const skipDirs = new Set(['node_modules']);
    const skipFiles = new Set([
        ...BROWSER_ONLY_GENERATE,
        'js/engines/index.mjs',
        'js/ai/worker.mjs',
        'js/ai/worker_client.mjs',
        'js/components/sanity_effects.mjs',
        'js/state/accessor.mjs',
        'js/coc.mjs',
    ]);
    const found = [];

    function walk(dir) {
        for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
            if (skipDirs.has(ent.name)) continue;
            const full = path.join(dir, ent.name);
            const rel = path.relative(ROOT, full).replace(/\\/g, '/');
            if (ent.isDirectory()) walk(full);
            else if (ent.name.endsWith('.mjs') && !listed.has(rel) && !skipFiles.has(rel)) {
                found.push(rel);
            }
        }
    }
    walk(path.join(ROOT, 'js'));
    return found.sort();
}

/** All .js outputs expected from GENERATE_PAIRS (for coverage checks). */
export function getGeneratedJsPaths() {
    return GENERATE_PAIRS.map(([, js]) => js.replace(/\\/g, '/'));
}
