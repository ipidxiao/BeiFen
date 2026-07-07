// ===============================================
// 归属：【程序】 引擎核心 / AI调度 / 状态管理
// 美术/策划/QA 请勿直接修改此文件
// 修改后放入 roles/programmer/ 运行 merge.py 合并
// ===============================================

/**
 * Service Worker — offline caching for CoC Engine.
 *
 * Caches all static assets on first load, serves from cache thereafter.
 * AI API calls (DeepSeek/OpenAI) are not intercepted — they require network.
 */

const CACHE_NAME = 'coc-engine-v18.1.0-fadd1954';

const ASSETS = [
    'index.html',
    'manifest.json',
    'favicon.svg',
    'css/icons.svg',
    'icons/icon-180.png',
    'icons/icon-192.png',
    'icons/icon-512.png',
    'icons/icon-512-maskable.png',
    'sw.js',
    'css/style.css',
    'vendor/vue.global.prod.js',
    'vendor/bootstrap.min.css',
    'vendor/chart.min.js',
    'vendor/pdf.min.js',
    'vendor/pdf.worker.min.js',
    'js/data/scenarios/packages/isolated_lab.json',
    'js/data/scenarios/packages/haunted_inheritance.json',
    'js/data/scenarios/packages/cc_asylum_whispers.json',
    'js/data/scenarios/packages/cc_lighthouse_log.json',
    'js/data/scenarios/packages/cc_museum_night.json',
    'js/data/scenarios/packages/cc_green_vicar.json',
    'js/data/scenarios/packages/cc_white_widow_reef.json',
    'js/data/scenarios/packages/cc_mayvale_blizzard.json',
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
    'js/core/globals_registry.js',
    'js/tools/definitions.js',
    'js/data/logger.js',
    'js/data/utils.js',
    'js/state/core.js',
    'js/state/ui.js',
    'js/state/gameplay.js',
    'js/state/selection.js',
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
    'js/components/combat_ui_helpers.js',
    'js/components/chat_format_helpers.js',
    'js/components/icon_sprite.js',
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

const SKIP_HOSTS = ['api.deepseek.com', 'openai.com', 'cdn.jsdelivr.net', 'unpkg.com', 'cdnjs.cloudflare.com'];

const isSkippableRequest = (url) => SKIP_HOSTS.some((host) => url.hostname.includes(host));

/** .js / .css — stale-while-revalidate; HTML/navigate — network-first with cache fallback. */
const isStaleWhileRevalidateAsset = (url) => {
    const p = url.pathname;
    return p.endsWith('.js') || p.endsWith('.css');
};

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) =>
            Promise.allSettled(ASSETS.map((url) => cache.add(url).catch(() => {})))
        )
    );
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) =>
            Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
        )
    );
    self.clients.claim();
});

self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);
    if (isSkippableRequest(url)) return;
    if (url.origin !== self.location.origin) return;

    if (isStaleWhileRevalidateAsset(url)) {
        event.respondWith(
            caches.open(CACHE_NAME).then((cache) =>
                cache.match(event.request).then((cached) => {
                    const networkFetch = fetch(event.request)
                        .then((response) => {
                            if (response && response.status === 200 && response.type === 'basic') {
                                cache.put(event.request, response.clone());
                            }
                            return response;
                        })
                        .catch(() => cached);
                    return cached || networkFetch;
                })
            )
        );
        return;
    }

    event.respondWith(
        caches.match(event.request).then((cached) => {
            if (cached) return cached;

            return fetch(event.request)
                .then((response) => {
                    if (response && response.status === 200 && response.type === 'basic') {
                        const clone = response.clone();
                        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
                    }
                    return response;
                })
                .catch(() => {
                    if (event.request.mode === 'navigate') {
                        const indexUrl = new URL('index.html', self.location).href;
                        return caches.match(indexUrl);
                    }
                    return caches.match(event.request);
                });
        })
    );
});
