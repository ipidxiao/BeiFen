// ===============================================
// 归属：【程序】 引擎核心 / AI调度 / 状态管理
// 美术/策划/QA 请勿直接修改此文件
// 修改后放入 roles/programmer/ 运行 merge.py 合并
// ===============================================

export const StoryChar = {
    template: `
        <div class="flex-grow-1 overflow-auto p-3 bg-dark">
            <div class="d-flex justify-content-between align-items-center mb-3">
                <h6 class="text-warning m-0">人物档案</h6>
                <button class="btn btn-outline-secondary btn-sm" @click="emitSwitchTab('chat')">← 返回剧情</button>
            </div>
            <div v-if="activeRoster.length > 0">
                <div class="d-flex gap-1 mb-3 overflow-auto pb-2 border-bottom border-secondary no-scrollbar">
                    <button v-for="(entry, idx) in activeRoster" :key="entry.rosterIndex" 
                        class="btn btn-sm text-nowrap" 
                        :class="selectedActiveIndex === idx ? 'btn-warning' : 'btn-outline-secondary'"
                        @click="selectedActiveIndex = idx">
                        {{ entry.char.name }}
                    </button>
                    <button class="btn btn-sm btn-outline-success text-nowrap" @click="switchScreen('creator')">+ 加入</button>
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

                            <h6 class="border-bottom border-secondary pb-1 text-light">技能摘要</h6>
                            <div v-if="notableSkills(currentChar).length" class="d-flex flex-wrap gap-1 mb-1">
                                <span v-for="skill in notableSkills(currentChar)" :key="skill.name" class="badge" style="background:#1a6a7a; color:#e0f7ff; font-weight:500;">{{ skill.name }} {{ skill.value }}</span>
                            </div>
                            <div v-else class="text-muted small mb-1">暂无高于基础值的技能加点。</div>
                        </div>
                    </div>

                    <h6 class="border-bottom border-dark pb-1" style="color:#d0d0d0;">穿戴装备 (点击卸下)</h6>
                    <div class="paper-doll-container mb-3">
                        <div class="equip-column">
                            <div class="equip-slot" :class="{filled: (currentChar.equipment || {}).head}" @click="unequip('head')"><div class="equip-icon">🎩</div><div class="equip-name">{{ (currentChar.equipment || {}).head || '头部' }}</div></div>
                            <div class="equip-slot" :class="{filled: (currentChar.equipment || {}).acc1}" @click="unequip('acc1')"><div class="equip-icon">📿</div><div class="equip-name">{{ (currentChar.equipment || {}).acc1 || '饰品1' }}</div></div>
                            <div class="equip-slot" :class="{filled: (currentChar.equipment || {}).hands}" @click="unequip('hands')"><div class="equip-icon">🧤</div><div class="equip-name">{{ (currentChar.equipment || {}).hands || '手部' }}</div></div>
                        </div>
                        <div class="avatar-box">👤</div>
                        <div class="equip-column">
                            <div class="equip-slot" :class="{filled: (currentChar.equipment || {}).weapon}" @click="unequip('weapon')"><div class="equip-icon">⚔️</div><div class="equip-name">{{ (currentChar.equipment || {}).weapon || '武器' }}</div></div>
                            <div class="equip-slot" :class="{filled: (currentChar.equipment || {}).acc2}" @click="unequip('acc2')"><div class="equip-icon">💍</div><div class="equip-name">{{ (currentChar.equipment || {}).acc2 || '饰品2' }}</div></div>
                            <div class="equip-slot" :class="{filled: (currentChar.equipment || {}).feet}" @click="unequip('feet')"><div class="equip-icon">🥾</div><div class="equip-name">{{ (currentChar.equipment || {}).feet || '足部' }}</div></div>
                        </div>
                    </div>

                    <div v-if="currentChar.backstory && currentChar.backstory.description" class="small text-muted border-top border-secondary pt-2 mb-4">
                        {{ currentChar.backstory.description }}
                    </div>
                </div>
            </div>
            <div v-else class="text-center py-5">
                <p class="text-muted">当前小队中没有活跃调查员。</p>
                <div class="d-flex flex-column gap-2 align-items-center">
                    <button class="btn btn-success" @click="switchScreen('creator')">+ 创建调查员</button>
                    <button class="btn btn-outline-secondary" @click="switchScreen('character')">管理/启用调查员</button>
                    <button class="btn btn-outline-warning btn-sm" @click="switchScreen('lobby')">返回大厅</button>
                </div>
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
                const idx = activeRoster.value.findIndex(entry => entry.rosterIndex === gameState.selectedCharIndex);
                return idx >= 0 ? idx : 0;
            },
            set: (val) => {
                const idx = Number.isFinite(+val) ? +val : 0;
                const entry = activeRoster.value[idx] || activeRoster.value[0];
                gameState.selectedCharIndex = entry ? entry.rosterIndex : 0;
                state.clampSelectedCharIndex(gameState);
            }
        });
        const currentChar = computed(() => {
            state.clampSelectedCharIndex(gameState);
            const entry = activeRoster.value[selectedActiveIndex.value] || activeRoster.value[0] || null;
            if (entry && gameState.selectedCharIndex !== entry.rosterIndex) gameState.selectedCharIndex = entry.rosterIndex;
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

        const isNotableSkill = (char, skillName, val) => {
            if (!skillName || val === undefined) return false;
            const visible = acc
                ? acc.isVisibleSkillName(skillName)
                : !(window.CoCEngine && window.CoCEngine.isVisibleSkillName && !window.CoCEngine.isVisibleSkillName(skillName));
            if (!visible) return false;
            if (skillName === "闪避") return val > Math.floor(displayAttr(char, 'DEX') / 2);
            
            const skillDef = acc
                ? acc.getSkillDef(skillName)
                : (window.CoCEngine && window.CoCEngine.BaseSkills ? window.CoCEngine.BaseSkills[skillName] : undefined);
            let base = 0;
            if (skillDef !== undefined) {
                base = (typeof skillDef === 'number') ? skillDef : (skillDef.base !== undefined ? skillDef.base : 0);
            }
            return val > base;
        };

        const notableSkills = (char) => {
            if (!char || !char.skills) return [];
            return Object.entries(char.skills)
                .map(([name, value]) => ({ name, value: numeric(value, 0) }))
                .filter(skill => isNotableSkill(char, skill.name, skill.value))
                .sort((a, b) => b.value - a.value || a.name.localeCompare(b.name, 'zh-Hans-CN'))
                .slice(0, 18);
        };
        
        const unequip = (slot) => {
            if (currentChar.value && currentChar.value.equipment && currentChar.value.equipment[slot]) {
                gameState.inventory.push(currentChar.value.equipment[slot]);
                currentChar.value.equipment[slot] = null;
            }
        };

        const emitSwitchTab = (tab) => emit('switch-tab', tab);
        
        return { 
            isNotableSkill, notableSkills, unequip, gameState,
            activeRoster, currentChar, selectedActiveIndex, attrOrder,
            displayAttr, displayDerived, displayCurrentHp, displayMaxHp, displaySan, half, fifth,
            switchScreen: state.switchScreen, emitSwitchTab
        };
    }
};

window.StoryChar = StoryChar;
