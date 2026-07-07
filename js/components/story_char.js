// GENERATED from js/components/story_char.mjs — do not edit; run: npm run build:js
// ===============================================
// 归属：【程序】 引擎核心 / AI调度 / 状态管理
// 美术/策划/QA 请勿直接修改此文件
// 修改后放入 roles/programmer/ 运行 merge.py 合并
// ===============================================

window.StoryChar = {
    template: `
        <div class="flex-grow-1 overflow-auto p-3 bg-dark">
            <div class="d-flex justify-content-between align-items-center mb-3">
                <h6 class="text-warning m-0">人物档案</h6>
                <button class="btn btn-outline-secondary btn-sm" @click="emitSwitchTab('chat')">← 返回剧情</button>
            </div>
            <div v-if="activeRoster.length > 0">
                <div v-if="activeRoster.length > 1" class="d-flex gap-1 mb-3 overflow-auto pb-2 border-bottom border-secondary no-scrollbar">
                    <button v-for="(entry, idx) in activeRoster" :key="entry.rosterIndex"
                        class="btn btn-sm text-nowrap"
                        :class="selectedActiveIndex === idx ? 'btn-warning' : 'btn-outline-secondary'"
                        @click="selectedActiveIndex = idx">
                        {{ entry.char.name }}
                    </button>
                </div>

                <div v-if="currentChar">
                    <div class="card bg-dark border-warning shadow-sm mb-3">
                        <div class="card-body">
                            <div class="d-flex justify-content-between align-items-start gap-2 mb-3">
                                <div>
                                    <h5 class="text-warning mb-1">{{ currentChar.name }}</h5>
                                    <div class="text-muted small">职业：{{ currentChar.jobName || '无业' }} · 经历：{{ currentChar.expName || '无' }}</div>
                                </div>
                                <div class="text-end">
                                    <span v-if="currentChar.isInsane" class="badge bg-danger">疯狂</span>
                                    <span v-if="currentChar.hasMajorWound" class="badge bg-danger ms-1">重伤</span>
                                    <span v-if="currentChar.isDying" class="badge bg-dark border border-danger text-danger ms-1">濒死</span>
                                    <span v-if="currentChar.isUnconscious" class="badge bg-secondary ms-1">昏迷</span>
                                </div>
                            </div>

                            <div class="row text-center mb-3 g-2">
                                <div class="col-4"><div class="p-2 border border-secondary rounded small"><strong class="text-danger">HP</strong><br><span class="text-white">{{ displayCurrentHp(currentChar) }} / {{ displayMaxHp(currentChar) }}</span></div></div>
                                <div class="col-4"><div class="p-2 border border-secondary rounded small"><strong class="text-primary">MP</strong><br><span class="text-white">{{ displayDerived(currentChar, 'mp') }}</span></div></div>
                                <div class="col-4"><div class="p-2 border border-secondary rounded small"><strong class="text-info">SAN</strong><br><span class="text-white">{{ displaySan(currentChar) }}</span></div></div>
                            </div>

                            <h6 class="border-bottom border-secondary pb-1 text-light">基础属性</h6>
                            <div class="row g-1 mb-3">
                                <div class="col-4" v-for="key in attrOrder" :key="key">
                                    <div class="attr-grid-box">
                                        <div class="attr-title">{{ key }}</div>
                                        <div class="attr-val">{{ displayAttr(currentChar, key) }}</div>
                                        <div class="attr-sub"><span>半:{{ half(displayAttr(currentChar, key)) }}</span><span>极:{{ fifth(displayAttr(currentChar, key)) }}</span></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div v-else class="text-center py-5">
                <p class="text-muted mb-3">当前没有可展示的调查员档案。</p>
                <button class="btn btn-outline-secondary btn-sm" @click="emitSwitchTab('chat')">← 返回剧情</button>
            </div>
        </div>
    `,
    setup(_, context = {}) {
        const emit = context.emit || (() => {});
        const { computed } = window.Vue;
        const acc = window.CoCStateAccessor;
        const state = acc ? acc.getState() : window.CoCState;
        const gameState = acc ? acc.getGameState() : state.gameState;
        const attrOrder = ['STR', 'CON', 'POW', 'DEX', 'APP', 'EDU', 'SIZ', 'INT', 'LUCK'];
        
        const activeRoster = computed(() => gameState.roster
            .map((char, rosterIndex) => ({ char, rosterIndex }))
            .filter(entry => entry.char && entry.char.isActive));
        const selectedActiveIndex = computed({
            get: () => {
                state.clampSelectedCharIndex(gameState);
                return gameState.selectedCharIndex;
            },
            set: (val) => {
                const max = Math.max(0, activeRoster.value.length - 1);
                const idx = Number.isFinite(+val) ? Math.max(0, Math.min(+val, max)) : 0;
                gameState.selectedCharIndex = idx;
                state.clampSelectedCharIndex(gameState);
            }
        });
        const currentChar = computed(() => {
            state.clampSelectedCharIndex(gameState);
            const entry = activeRoster.value[gameState.selectedCharIndex] || activeRoster.value[0] || null;
            return entry ? entry.char : null;
        });

        const numeric = (value, fallback = 0) => {
            const n = Number(value);
            return Number.isFinite(n) ? n : fallback;
        };
        const displayAttr = (char, key) => numeric(char && char.attrs ? char.attrs[key] : 0);
        const displayDerived = (char, key) => numeric(char && char.derived ? char.derived[key] : 0);
        const displayCurrentHp = (char) => numeric(char && char.hp !== undefined ? char.hp : displayDerived(char, 'hp'));
        const displayMaxHp = (char) => numeric(char && char.derived ? (char.derived.maxHp || char.derived.hp || char.hp) : char && char.hp);
        const displaySan = (char) => numeric(char && char.sanity !== undefined ? char.sanity : displayDerived(char, 'san'));
        const half = (val) => Math.floor(numeric(val) / 2);
        const fifth = (val) => Math.floor(numeric(val) / 5);

        const emitSwitchTab = (tab) => emit('switch-tab', tab);
        
        return { 
            gameState,
            activeRoster, currentChar, selectedActiveIndex, attrOrder,
            displayAttr, displayDerived, displayCurrentHp, displayMaxHp, displaySan, half, fifth,
            emitSwitchTab
        };
    }
};
