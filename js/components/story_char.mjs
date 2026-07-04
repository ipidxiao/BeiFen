// ===============================================
// 归属：【程序】 引擎核心 / AI调度 / 状态管理
// 美术/策划/QA 请勿直接修改此文件
// 修改后放入 roles/programmer/ 运行 merge.py 合并
// ===============================================

export const StoryChar = {
    template: `
        <div class="flex-grow-1 overflow-auto p-3 bg-dark">
            <div v-if="activeRoster.length > 0">
                <!-- 角色选择 Tab -->
                <div class="d-flex gap-1 mb-3 overflow-auto pb-2 border-bottom border-secondary no-scrollbar">
                    <button v-for="(char, idx) in activeRoster" :key="idx" 
                        class="btn btn-sm text-nowrap" 
                        :class="selectedCharIndex === idx ? 'btn-warning' : 'btn-outline-secondary'"
                        @click="selectedCharIndex = idx">
                        {{ char.name }}
                    </button>
                    <button class="btn btn-sm btn-outline-success text-nowrap" @click="switchScreen('creator')">+ 加入</button>
                </div>

                <div v-if="currentChar">
                    <h5 class="text-warning text-center border-bottom border-secondary pb-2 mb-3">
                        {{ currentChar.name }} <span class="fs-6 text-muted">({{ currentChar.jobName }})</span>
                    </h5>
                    
                    <div class="row text-center mb-3 g-2">
                        <div class="col-4">
                            <div class="p-2 border border-secondary rounded bg-dark small">
                                <strong class="text-danger">HP</strong>
                                <span v-if="currentChar.hasMajorWound" class="badge bg-danger ms-1" style="font-size:0.5rem; padding: 2px;">重伤</span>
                                <span v-if="currentChar.isDying" class="badge bg-dark border border-danger text-danger ms-1" style="font-size:0.5rem; padding: 2px;">濒死</span>
                                <span v-if="currentChar.isUnconscious" class="badge bg-secondary ms-1" style="font-size:0.5rem; padding: 2px;">昏迷</span>
                                <br><span class="text-white">{{currentChar.hp}} / {{currentChar.derived.hp}}</span>
                            </div>
                        </div>
                        <div class="col-4"><div class="p-2 border border-secondary rounded bg-dark small"><strong class="text-primary">MP</strong><br><span class="text-white">{{currentChar.derived.mp}}</span></div></div>
                        <div class="col-4"><div class="p-2 border border-secondary rounded bg-dark small"><strong class="text-info">SAN</strong><br><span class="text-white">{{currentChar.sanity}}</span></div></div>
                    </div>

                    <h6 class="border-bottom border-dark pb-1" style="color:#d0d0d0;">🎽 穿戴装备 (点击卸下)</h6>
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

                    <h6 class="border-bottom border-dark pb-1" style="color:#d0d0d0;">📊 基础属性</h6>
                    <div class="row g-1 mb-3">
                        <div class="col-4" v-for="(val, key) in currentChar.attrs" :key="key">
                            <div class="attr-grid-box">
                                <div class="attr-title">{{ key }}</div>
                                <div class="attr-val">{{ val }}</div>
                                <div class="attr-sub"><span>半:{{ Math.floor(val/2) }}</span><span>极:{{ Math.floor(val/5) }}</span></div>
                            </div>
                        </div>
                    </div>

                    <h6 class="border-bottom border-dark pb-1" style="color:#d0d0d0;">📚 掌握技能</h6>
                    <div class="d-flex flex-wrap gap-1 mb-5">
                        <template v-for="(val, key) in currentChar.skills" :key="key">
                            <span class="badge" style="background:#1a6a7a; color:#e0f7ff; font-weight:500;" v-if="isNotableSkill(currentChar, key, val)">{{key}} {{val}}</span>
                        </template>
                    </div>
                </div>
            </div>
            <div v-else class="text-center py-5">
                <p class="text-muted">当前小队中没有活跃调查员。</p>
                <button class="btn btn-success" @click="switchScreen('character')">管理小队</button>
            </div>
        </div>
    `,
    setup() {
        const { ref, computed } = window.Vue;
        const state = window.CoCState;
        const engine = window.CoCEngine;
        const gameState = state.gameState;
        
	        const selectedCharIndex = computed({
            get: () => { state.clampSelectedCharIndex(gameState); return gameState.selectedCharIndex; },
            set: (val) => { gameState.selectedCharIndex = Number.isFinite(+val) ? +val : 0; state.clampSelectedCharIndex(gameState); }
        });
        const activeRoster = computed(() => gameState.roster.filter(c => c.isActive));
        const currentChar = computed(() => {
            state.clampSelectedCharIndex(gameState);
            return activeRoster.value[gameState.selectedCharIndex] || activeRoster.value[0] || null;
        });

        const isNotableSkill = (char, skillName, val) => {
            if (!skillName || val === undefined) return false;
            if (engine.isVisibleSkillName && !engine.isVisibleSkillName(skillName)) return false;
            if (skillName === "闪避") return val > Math.floor(char.attrs.DEX / 2);
            
            const skillDef = engine.BaseSkills[skillName];
            let base = 0;
            if (skillDef !== undefined) {
                base = (typeof skillDef === 'number') ? skillDef : (skillDef.base !== undefined ? skillDef.base : 0);
            }
            return val > base;
        };
        
        const unequip = (slot) => {
            if (currentChar.value && currentChar.value.equipment && currentChar.value.equipment[slot]) {
                gameState.inventory.push(currentChar.value.equipment[slot]);
                currentChar.value.equipment[slot] = null;
            }
        };
        
        return { 
            isNotableSkill, unequip, gameState, 
            activeRoster, currentChar, selectedCharIndex,
            switchScreen: state.switchScreen
        };
    }
};

window.StoryChar = StoryChar;
