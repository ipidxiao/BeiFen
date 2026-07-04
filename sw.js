// ===============================================
// 归属：【程序】 引擎核心 / AI调度 / 状态管理
// 美术/策划/QA 请勿直接修改此文件
// 修改后放入 roles/programmer/ 运行 merge.py 合并
// ===============================================

/**

 * Service Worker — offline caching for CoC Engine.

 * 

 * Caches all static assets on first load, serves from cache thereafter.

 * Falls back to network for API calls (DeepSeek).

 */

const CACHE_NAME = 'coc-engine-v18.1';

const ASSETS = [

    '/',

    '/index.html',

    '/css/style.css',

    '/vendor/vue.global.prod.js',

    '/vendor/bootstrap.min.css',

    '/js/data/jobs.js',

    '/js/data/experiences.js',

    '/js/data/items.js',

    '/js/data/items_db.js',

    '/js/data/dev_logs.js',

    '/js/data/skills.js',
  '/js/data/npc_templates.js',
  '/js/components/sanity_effects.js',
  '/js/data/spells.js',
  '/js/data/mythos_tomes.js',
  '/js/components/dice_canvas.js',
  '/js/data/injury_tables.js',
  '/js/audio/sfx.js',
  '/js/data/insanity_tables.js',
  '/js/tools/handlers/mythos.js',

    '/js/data/logger.js',

    '/js/data/utils.js',

    '/js/coc.js',

    '/js/core/context_manager.js',

    '/js/tools/definitions.js',

    '/js/tools/handlers/character.js',

    '/js/tools/handlers/inventory.js',

    '/js/tools/handlers/dice.js',

    '/js/tools/handlers/clues.js',

    '/js/tools/handlers/map.js',

    '/js/tools/handlers/combat.js',

    '/js/tools/handlers/npc.js',

    '/js/tools/handlers/system.js',

    '/js/tools/handlers/index.js',

    '/js/state/core.js',

    '/js/state/ui.js',

    '/js/state/gameplay.js',

    '/js/state/persistence.js',

    '/js/state.js',

    '/js/ai/network.js',

    '/js/ai/tool_dispatch.js',

    '/js/ai_logic.js',

    '/js/components/char_creator.js',

    '/js/components/story_chat.js',

    '/js/components/story_char.js',

    '/js/components/story_inv.js',

    '/js/components/story_store.js',

    '/js/components/story_journal.js',

    '/js/components/story_npc.js',

    '/js/components/story_combat.js',

    '/js/components/story_growth.js',

    '/js/components/story_map.js',

    '/js/components/story_clues.js',

    '/js/components/story_dice.js',

    '/js/components/story_equip.js',

    '/js/components/canvas_chat.js',

    '/js/chat_export.js',

    '/js/components/ui_feedback.js',

    '/js/views/lobby_view.js',

    '/js/views/creator_view.js',

    '/js/views/story_view.js',

    '/js/views/dev_log_view.js',

    '/js/app.js',

];



self.addEventListener('install', (event) => {

    event.waitUntil(

        caches.open(CACHE_NAME).then((cache) => {

            return Promise.allSettled(

                ASSETS.map(url => cache.add(url).catch(() => {}))

            );

        })

    );

    self.skipWaiting();

});



self.addEventListener('activate', (event) => {

    event.waitUntil(

        caches.keys().then((keys) => {

            return Promise.all(

                keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))

            );

        })

    );

    self.clients.claim();

});



self.addEventListener('fetch', (event) => {

    // Skip API calls

    if (event.request.url.includes('api.deepseek.com') || 

        event.request.url.includes('openai.com') ||

        event.request.url.includes('cdn.jsdelivr.net')) {

        return;

    }

    

    event.respondWith(

        caches.match(event.request).then((cached) => {

            const fetchPromise = fetch(event.request).then((response) => {

                if (response && response.status === 200 && response.type === 'basic') {

                    const clone = response.clone();

                    caches.open(CACHE_NAME).then((cache) => {

                        cache.put(event.request, clone);

                    });

                }

                return response;

            }).catch(() => cached);

            

            return cached || fetchPromise;

        })

    );

});

