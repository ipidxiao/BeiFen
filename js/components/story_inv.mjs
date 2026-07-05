export const StoryInv = {
    template: `
        <div class="flex-grow-1 overflow-auto p-3 bg-dark story-inv-panel" @click="tooltipItem = null">
            <h5 class="coc-section-title text-center mb-3 d-inline-flex align-items-center justify-content-center gap-2 w-100"><coc-icon name="inventory" :size="20"></coc-icon> 随身行囊</h5>
            
            <div v-if="activeRoster.length > 1" class="alert alert-dark border-secondary p-2 mb-3 small coc-panel-card">
                <i class="text-info">当前正为调查员 <b>{{ selectedCharName }}</b> 进行操作</i>
            </div>

            <ul class="list-group">
                <li v-if="inventory.length === 0" class="list-group-item coc-panel-card empty-state empty-state-compact border-secondary">
                    <coc-icon name="inventory" :size="32" class="empty-state-icon"></coc-icon>
                    <div class="empty-state-title">背包空空如也</div>
                    <div class="empty-state-hint">探索与战斗获得的物品会显示在这里</div>
                </li>
                <li v-for="(item, idx) in inventory" :key="idx" class="list-group-item coc-panel-card text-light border-secondary d-flex justify-content-between align-items-center inv-item" @click.stop="toggleTooltip($event, item, idx)">
                    <div class="d-flex align-items-center gap-2">
                        <span class="item-icon">{{ getItemIcon(item) }}</span>
                        <div>
                            <span class="item-name" style="cursor:pointer;">{{ getItemDisplayName(item) }}</span>
                            <small v-if="getItemSubtitle(item)" class="text-muted d-block" style="font-size:0.65rem;">{{ getItemSubtitle(item) }}</small>
                        </div>
                    </div>
                    <div class="d-flex align-items-center gap-1">
                        <span class="badge me-1" :style="'background:' + getCategoryColor(item) + '; color:#fff; font-size:0.6rem;'">{{ getItemTierLabel(item) || getItemCategory(item) }}</span>
                        <button v-if="isEquippable(item)" class="btn btn-sm btn-warning fw-bold" style="font-size:0.65rem;" @click.stop="smartEquipItem(item, idx)">穿戴</button>
                        <button v-if="isAmmo(item)" class="btn btn-sm btn-danger fw-bold" style="font-size:0.65rem;" @click.stop="loadAmmo(item, idx)">装填</button>
                        <button class="btn btn-sm btn-outline-secondary" style="font-size:0.65rem;" @click.stop="moveToStorage(item, idx)">存入</button>
                    </div>
                </li>
            </ul>

            <!-- APEX-style tooltip -->
            <div v-if="tooltipItem" class="item-tooltip" :style="{left: tooltipX + 'px', top: tooltipY + 'px'}" @click.stop>
                <div class="tooltip-header">
                    <span class="tooltip-icon">{{ getItemIcon(tooltipItem) }}</span>
                    <strong>{{ getItemDisplayName(tooltipItem) }}</strong>
                    <span class="badge ms-2" :style="'background:' + getCategoryColor(tooltipItem) + ';'">{{ getItemCategory(tooltipItem) }}</span>
                </div>
                <div class="tooltip-body">
                    <div v-if="getItemDamage(tooltipItem)" class="tooltip-row">
                        <span class="text-danger">⚔️ 伤害</span>
                        <strong>{{ getItemDamage(tooltipItem) }}</strong>
                    </div>
                    <div v-if="getItemRange(tooltipItem)" class="tooltip-row">
                        <span class="text-info">🎯 射程</span>
                        <span>{{ getItemRange(tooltipItem) }} 码</span>
                    </div>
                    <div v-if="getItemAmmo(tooltipItem)" class="tooltip-row">
                        <span class="text-warning">🔫 弹容</span>
                        <span>{{ getItemAmmo(tooltipItem) }} 发</span>
                    </div>
                    <div v-if="getItemArmor(tooltipItem)" class="tooltip-row">
                        <span class="text-primary">🛡️ 护甲</span>
                        <span>{{ getItemArmor(tooltipItem) }}</span>
                    </div>
                    <div v-if="getItemNotes(tooltipItem)" class="tooltip-row">
                        <span class="text-muted">📝 {{ getItemNotes(tooltipItem) }}</span>
                    </div>
                    <div v-if="!getItemDamage(tooltipItem) && !getItemArmor(tooltipItem)" class="tooltip-row text-muted">
                        <span>暂无详细属性</span>
                    </div>
                </div>
            </div>
        </div>
    `,
    setup(props, context) {
        const { computed, ref } = window.Vue;
        const tooltipItem = ref(null);
        const tooltipItemId = ref(-1);
        const tooltipX = ref(0);
        const tooltipY = ref(0);
        const state = window.CoCState;
        const gameState = state.gameState;
        const notify = (message, type = 'warning') => state.showToast ? state.showToast(message, type) : console.warn(message);
        const activeRoster = computed(() => gameState.roster.filter(c => c.isActive));
        const selectedChar = computed(() => { state.clampSelectedCharIndex(gameState); return activeRoster.value[gameState.selectedCharIndex] || activeRoster.value[0] || null; });
        const selectedCharName = computed(() => selectedChar.value ? selectedChar.value.name : "未知");
        const inventory = computed(() => gameState.inventory || []);

        const resolveItem = (item) => {
            if (!item) return {};
            if (typeof item === 'object' && item.name) return item;
            const name = typeof item === 'string' ? item : (item.name || String(item));
            if (window.CoCItemDB && window.CoCItemDB.resolve) {
                const resolved = window.CoCItemDB.resolve(name);
                if (resolved && resolved.name) return resolved;
            }
            // fallback: parse old-style item string
            if (window.parseItemData) return window.parseItemData(name);
            return { name, category: '杂物' };
        };

        const getItemDisplayName = (item) => {
            const r = resolveItem(item);
            return r.name || String(item);
        };
        const getItemCategory = (item) => {
            const r = resolveItem(item);
            return r.category || '杂物';
        };
        const getItemIcon = (item) => {
            const r = resolveItem(item);
            if (r.category === '手枪' || r.category === '步枪' || r.category === '霰弹枪' || r.category === '冲锋枪') return '🔫';
            if (r.category === '武器' || r.type === 'melee') return '⚔️';
            if (r.category === '护甲' || r.armor) return '🛡️';
            if (r.category === '医疗') return '💊';
            if (r.category === '工具') return '🔧';
            if (r.category === '文件' || r.category === '关键物品') return '📄';
            return '📦';
        };
        const getCategoryColor = (item) => {
            const r = resolveItem(item);
            if (window.CoCItemDB && window.CoCItemDB.getCategoryColor) {
                const tc = window.CoCItemDB.getCategoryColor(r);
                if (tc && tc !== '#6c757d') return tc;
            }
            if (r.tier && window.CoCItemDB && window.CoCItemDB.TIERS && window.CoCItemDB.TIERS[r.tier]) {
                return window.CoCItemDB.TIERS[r.tier].color;
            }
            if (r.category === '手枪' || r.category === '步枪' || r.category === '霰弹枪' || r.category === '冲锋枪') return '#d9534f';
            if (r.category === '武器') return '#f0ad4e';
            if (r.category === '护甲' || r.armor) return '#5bc0de';
            if (r.category === '医疗') return '#5cb85c';
            return '#6c757d';
        };
        const getItemSubtitle = (item) => {
            const r = resolveItem(item);
            if (r.damage) return `伤害 ${r.damage}`;
            if (r.armor) return `护甲 ${r.armor}`;
            return '';
        };
        const getItemDamage = (item) => { const r = resolveItem(item); return r.damage || ''; };
        const getItemRange = (item) => { const r = resolveItem(item); return r.range || ''; };
        const getItemAmmo = (item) => { const r = resolveItem(item); return r.ammo || ''; };
        const getItemArmor = (item) => { const r = resolveItem(item); return r.armor || ''; };
        const getItemNotes = (item) => { const r = resolveItem(item); return r.notes || ''; };
        const getItemTierLabel = (item) => {
            const r = resolveItem(item);
            if (r.tier && window.CoCItemDB && window.CoCItemDB.TIERS && window.CoCItemDB.TIERS[r.tier]) {
                return window.CoCItemDB.TIERS[r.tier].label;
            }
            return null;
        };
        const getItemTierIcon = (item) => {
            const r = resolveItem(item);
            if (r.tier && window.CoCItemDB && window.CoCItemDB.TIERS && window.CoCItemDB.TIERS[r.tier]) {
                return window.CoCItemDB.TIERS[r.tier].icon;
            }
            return '';
        };
        const isEquippable = (item) => {
            const r = resolveItem(item);
            return r.category === '武器' || r.category === '护甲' || r.armor || r.damage;
        };
        const isAmmo = (item) => {
            const r = resolveItem(item);
            return r.category === '弹药' || (typeof item === 'string' && (item.includes('子弹') || item.includes('弹药') || item.includes('ammo')));
        };

        // ✅ Vue-reactive tooltip (replaces raw DOM manipulation)
        const toggleTooltip = (event, item, idx) => {
            if (tooltipItem.value && tooltipItemId.value === idx) {
                tooltipItem.value = null;
                tooltipItemId.value = -1;
                return;
            }
            const rect = event.currentTarget.getBoundingClientRect();
            tooltipItem.value = item;
            tooltipItemId.value = idx;
            tooltipX.value = Math.min(rect.right + 10, window.innerWidth - 300);
            tooltipY.value = Math.min(rect.top, window.innerHeight - 200);
            setTimeout(() => {
                const closer = () => { tooltipItem.value = null; tooltipItemId.value = -1; document.removeEventListener('click', closer); };
                document.addEventListener('click', closer, { once: true });
            }, 10);
        };

        const smartEquipItem = (itemString, idx) => {
            if (!selectedChar.value) { notify("没有活跃的调查员可以穿戴装备！"); return; }
            const itemData = resolveItem(itemString);
            let targetSlot = itemData.type || 'misc';
            const slotMap = { '手枪':'hands', '步枪':'hands', '霰弹枪':'hands', '冲锋枪':'hands', '武器':'hands', 'melee':'hands', '护甲':'body', '头盔':'head', '盾':'hands' };
            targetSlot = slotMap[itemData.category] || targetSlot;
            if (!selectedChar.value.equipment) selectedChar.value.equipment = {};
            selectedChar.value.equipment[targetSlot] = itemData.name || itemString;
            gameState.inventory.splice(idx, 1);
            notify(`已为 ${selectedCharName.value} 装备 ${itemData.name || itemString}。`, 'success');
        };

        const loadAmmo = (item, idx) => {
            if (!selectedChar.value) { notify("没有活跃的调查员！"); return; }
            if (!selectedChar.value.equipment) selectedChar.value.equipment = {};
            selectedChar.value.equipment['弹药'] = (selectedChar.value.equipment['弹药'] || 0) + 1;
            gameState.inventory.splice(idx, 1);
            notify(`已为 ${selectedCharName.value} 装填弹药。`, 'success');
        };

        const moveToStorage = (item, idx) => {
            gameState.storage.push(item);
            gameState.inventory.splice(idx, 1);
            notify('物品已转移至仓库。', 'info');
        };

        const getItemTypeName = (type) => {
            const map = { 'weapon':'武器', 'head':'头部', 'hands':'手套', 'feet':'鞋靴', 'accessory':'饰品', 'consumable':'消耗品', 'ammo':'弹药', 'misc':'杂物' };
            return map[type] || '杂物';
        };

        return { gameState, inventory, activeRoster, selectedCharName, tooltipItem, tooltipItemId, tooltipX, tooltipY, getItemDisplayName, getItemCategory, getItemIcon, getCategoryColor, getItemSubtitle, getItemDamage, getItemRange, getItemAmmo, getItemArmor, getItemNotes, getItemTierLabel, getItemTierIcon, isEquippable, isAmmo, smartEquipItem, loadAmmo, moveToStorage, getItemTypeName, toggleTooltip };
    }
};
window.StoryInv = StoryInv;
