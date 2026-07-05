/* ===============================================
   归属：【美术】 视觉样式 / UI皮肤
   程序/策划/QA 请勿直接修改此文件
   修改后放入 roles/artist/ 运行 merge.py 合并
   =============================================== */

/**
 * APEX Legends 风格装备系统 — 搜·打·撤
 * 
 * 装备槽: 头盔 | 护甲 | 背包 | 主武器 | 副武器 | 近战
 * 每个槽位有等级限制，高等级装备可替换低等级
 */
window.CoCItemDB.EQUIP_SLOTS = {
    HELMET:  { id:'helmet',  label:'头盔', iconId:'helmet', desc:'头部防护', acceptTypes:['头盔','护甲'] },
    ARMOR:   { id:'armor',   label:'护甲', iconId:'shield', desc:'身体防护', acceptTypes:['护甲','防具'] },
    BACKPACK:{ id:'backpack',label:'背包', iconId:'inventory', desc:'携带容量', acceptTypes:['背包','工具'] },
    PRIMARY: { id:'primary', label:'主武器', iconId:'rifle', desc:'步枪/霰弹/冲锋', acceptTypes:['步枪','霰弹枪','冲锋枪','弓','弩'] },
    SECONDARY:{ id:'secondary',label:'副武器', iconId:'pistol', desc:'手枪/投掷', acceptTypes:['手枪','投掷','特殊'] },
    MELEE:   { id:'melee',   label:'近战', iconId:'equip', desc:'近身武器', acceptTypes:['徒手','刀具','剑','斧','棍棒','长柄','鞭','指虎','电锯','电棍','锤'] },
};

// ═══════════════════════════════════════════════════════
// EQUIPMENT SLOT LOGIC
// ═══════════════════════════════════════════════════════
window.CoCItemDB.getSlotForItem = function(item) {
    const r = typeof item === 'object' ? item : window.CoCItemDB.resolve(item);
    if (!r) return null;
    const cat = (r.category || '').toLowerCase();
    const type = (r.type || '').toLowerCase();
    
    // Weapons by category
    if (['步枪','霰弹枪','冲锋枪','弓','弩'].includes(r.category)) return 'PRIMARY';
    if (['手枪','投掷'].includes(r.category)) return 'SECONDARY';
    if (['徒手','刀具','剑','斧','棍棒','长柄','鞭','指虎','电锯','电棍','锤','特殊'].includes(r.category) && r.type === 'melee') return 'MELEE';
    if (['武器'].includes(r.category) || r.damage) {
        if (r.type === 'ranged') return r.range > 20 ? 'PRIMARY' : 'SECONDARY';
        return 'MELEE';
    }
    
    // Equipment
    if (r.armor) return 'ARMOR';
    if (cat.includes('头盔') || cat.includes('头')) return 'HELMET';
    if (cat.includes('背包') || cat.includes('工具')) return 'BACKPACK';
    
    return null;
};

// Check if one item can replace another in the same slot (tier comparison)
window.CoCItemDB.canReplace = function(existing, newcomer) {
    const tiers = { 'S':5, 'A':4, 'B':3, 'C':2, 'MYTHIC':6 };
    const existTier = tiers[existing?.tier] || 0;
    const newTier = tiers[newcomer?.tier] || 0;
    return newTier >= existTier;
};

// ═══════════════════════════════════════════════════════
// APEX-STYLE EQUIPMENT PANEL COMPONENT
// ═══════════════════════════════════════════════════════
export const StoryEquip = {
    template: `
        <div class="apex-equip-panel story-equip-panel">
            <!-- 装备槽 HUD -->
            <div class="apex-slots">
                <div v-for="slot in slots" :key="slot.id" 
                    class="apex-slot" 
                    :class="getSlotClass(slot)"
                    tabindex="0"
                    role="button"
                    :aria-label="slot.label + '装备槽'"
                    @click="openSlotPicker(slot)"
                    @dragover.prevent
                    @drop="onDrop($event, slot)">
                    <div class="slot-icon"><coc-icon :name="slot.iconId" :size="22" :title="slot.label"></coc-icon></div>
                    <div class="slot-label">{{ slot.label }}</div>
                    <div v-if="getEquipped(slot)" class="slot-item">
                        <div class="slot-item-icon">{{ getEquippedTierIcon(slot) }}</div>
                        <div class="slot-item-name">{{ getEquippedName(slot) }}</div>
                        <div class="slot-tier" :style="'color:' + getEquippedTierColor(slot)">{{ getEquippedTierLabel(slot) }}</div>
                    </div>
                    <div v-else class="slot-empty">空</div>
                </div>
            </div>

            <!-- 弹药/消耗品快捷栏 -->
            <div class="apex-consumables">
                <div class="consumable-slot" v-for="n in 3" :key="'con'+n">
                    <span class="consumable-empty">💊</span>
                </div>
            </div>

            <!-- 拾取弹窗 -->
            <div v-if="pickerSlot" class="apex-picker-overlay" @click="pickerSlot = null">
                <div class="apex-picker" @click.stop>
                    <div class="picker-header">
                        <span class="d-inline-flex align-items-center gap-1"><coc-icon :name="pickerSlot.iconId" :size="16"></coc-icon> {{ pickerSlot.label }}</span>
                        <button class="btn btn-sm btn-outline-light" @click="pickerSlot = null">✕</button>
                    </div>
                    <div class="picker-body">
                        <div v-if="compatibleItems.length === 0" class="text-muted p-3 text-center">
                            没有可装备的物品
                        </div>
                        <div v-for="(item, idx) in compatibleItems" :key="idx"
                            class="picker-item"
                            :class="{ 'picker-selected': isEquipped(item, pickerSlot) }"
                            :style="getPickerItemStyle(item)"
                            @click="equipToSlot(pickerSlot, item, idx)">
                            <span class="picker-item-icon">{{ getItemTierIcon(item) }}</span>
                            <div class="picker-item-info">
                                <strong>{{ getItemName(item) }}</strong>
                                <small class="text-muted">{{ getItemSubtitle(item) }}</small>
                            </div>
                            <span class="badge" :style="'background:' + getItemTierColor(item) + ';'">{{ getItemTierLabel(item) }}</span>
                            <span v-if="isEquipped(item, pickerSlot)" class="text-success ms-2">✓ 已装备</span>
                        </div>
                    </div>
                    <!-- 快速操作 -->
                    <div class="picker-footer">
                        <button class="btn btn-sm btn-outline-danger" @click="unequipSlot(pickerSlot)">卸下</button>
                        <button class="btn btn-sm btn-outline-warning" @click="dropEquipped(pickerSlot)">丢弃</button>
                    </div>
                </div>
            </div>
        </div>
    `,
    setup() {
        const { computed, ref } = window.Vue;
        const acc = window.CoCStateAccessor;
        const state = acc.getState();
        const gameState = acc.getGameState();
        const notify = (msg, type='info') => acc.showToast(msg, type);
        
        const slots = Object.values(acc.getEquipSlots());
        const pickerSlot = ref(null);
        const activeRoster = computed(() => gameState.roster.filter(c => c.isActive));
        const selectedChar = computed(() => {
            state.clampSelectedCharIndex(gameState);
            return activeRoster.value[gameState.selectedCharIndex] || activeRoster.value[0] || null;
        });
        if (!gameState.equipment) gameState.equipment = {};

        const resolve = (item) => acc.resolveItem(item);

        const getEquipped = (slot) => {
            if (!selectedChar.value) return null;
            const equipped = selectedChar.value.equipment;
            if (!equipped) return null;
            return equipped[slot.id] || null;
        };

        const getEquippedName = (slot) => {
            const item = getEquipped(slot);
            return item ? (typeof item === 'object' ? item.name : item) : '';
        };

        const getEquippedTierLabel = (slot) => {
            const item = getEquipped(slot);
            if (!item) return '';
            const r = resolve(item);
            const tier = acc.getItemTier(r.tier);
            if (tier) {
                return tier.label.split('·')[0].trim();
            }
            return '';
        };

        const getEquippedTierColor = (slot) => {
            const item = getEquipped(slot);
            if (!item) return '#666';
            const r = resolve(item);
            const tier = acc.getItemTier(r.tier);
            return tier ? tier.color : '#666';
        };

        const getEquippedTierIcon = (slot) => {
            const item = getEquipped(slot);
            if (!item) return '⬜';
            const r = resolve(item);
            const tier = acc.getItemTier(r.tier);
            return tier ? tier.icon : '📦';
        };

        const getSlotClass = (slot) => {
            const item = getEquipped(slot);
            if (!item) return 'slot-empty-state';
            const r = resolve(item);
            return 'tier-' + (r.tier || 'C');
        };

        const compatibleItems = computed(() => {
            if (!pickerSlot.value || !selectedChar.value) return [];
            const slot = pickerSlot.value;
            return gameState.inventory
                .map((item, idx) => ({ item: resolve(item), idx }))
                .filter(({ item }) => {
                    const slotForItem = acc.getSlotForItem(item);
                    return slotForItem === slot.id.toUpperCase() || slotForItem === 'PRIMARY' && slot.id === 'primary' || slotForItem === 'SECONDARY' && slot.id === 'secondary' || slotForItem === 'MELEE' && slot.id === 'melee';
                });
        });

        const getItemName = (item) => {
            const r = resolve(item);
            return r.name || String(item);
        };

        const getItemTierLabel = (item) => {
            const r = resolve(item);
            const tier = acc.getItemTier(r.tier);
            return tier ? tier.label : '';
        };

        const getItemTierColor = (item) => {
            const r = resolve(item);
            const tier = acc.getItemTier(r.tier);
            return tier ? tier.color : '#666';
        };

        const getItemTierIcon = (item) => {
            const r = resolve(item);
            const tier = acc.getItemTier(r.tier);
            return tier ? tier.icon : '📦';
        };

        const getItemSubtitle = (item) => {
            const r = resolve(item);
            const parts = [];
            if (r.damage) parts.push('⚔'+r.damage);
            if (r.armor) parts.push('🛡'+r.armor);
            if (r.range) parts.push('🎯'+r.range+'m');
            if (r.ammo) parts.push('🔫'+r.ammo);
            return parts.join(' ') || '';
        };

        const getPickerItemStyle = (item) => {
            const r = resolve(item);
            const tier = acc.getItemTier(r.tier);
            return tier ? 'border-left: 3px solid ' + tier.color : '';
        };

        const isEquipped = (item, slot) => {
            const equipped = getEquipped(slot);
            if (!equipped) return false;
            const r = resolve(item);
            return (typeof equipped === 'object' ? equipped.name : equipped) === r.name;
        };

        const openSlotPicker = (slot) => {
            pickerSlot.value = slot;
        };

        const equipToSlot = (slot, item, invIdx) => {
            if (!selectedChar.value) return;
            if (!selectedChar.value.equipment) selectedChar.value.equipment = {};
            const r = resolve(item);
            const equipped = getEquipped(slot);
            
            // If same item, unequip
            if (isEquipped(item, slot)) {
                notify(getItemName(item) + ' 已卸下');
                selectedChar.value.equipment[slot.id] = null;
                pickerSlot.value = null;
                return;
            }
            
            // Check if can replace based on tier
            if (equipped && !acc.canReplaceItem(equipped, r)) {
                notify('需要更高等级或同等级的' + slot.label + '才能替换！', 'warning');
                return;
            }
            
            // Equip: swap with inventory
            if (equipped) {
                gameState.inventory.push(equipped);
            }
            selectedChar.value.equipment[slot.id] = r;
            gameState.inventory.splice(invIdx, 1);
            notify('已装备 ' + getItemName(r) + ' 到' + slot.label, 'success');
            pickerSlot.value = null;
        };

        const unequipSlot = (slot) => {
            if (!selectedChar.value || !selectedChar.value.equipment) return;
            const equipped = getEquipped(slot);
            if (equipped) {
                gameState.inventory.push(equipped);
                selectedChar.value.equipment[slot.id] = null;
                notify('已卸下' + slot.label, 'info');
            }
            pickerSlot.value = null;
        };

        const dropEquipped = (slot) => {
            if (!selectedChar.value || !selectedChar.value.equipment) return;
            const equipped = getEquipped(slot);
            if (equipped) {
                selectedChar.value.equipment[slot.id] = null;
                notify('已丢弃' + slot.label + '上的装备', 'warning');
            }
            pickerSlot.value = null;
        };

        const onDrop = (event, slot) => {
            event.preventDefault();
            const itemName = event.dataTransfer.getData('text/plain');
            if (!itemName) return;
            const idx = gameState.inventory.findIndex(i => {
                const r = resolve(i);
                return r.name === itemName || i === itemName;
            });
            if (idx >= 0) {
                equipToSlot(slot, gameState.inventory[idx], idx);
            }
        };

        return {
            slots, pickerSlot, compatibleItems,
            getEquipped, getEquippedName, getEquippedTierLabel, getEquippedTierColor, getEquippedTierIcon,
            getSlotClass, getItemName, getItemTierLabel, getItemTierColor, getItemTierIcon,
            getItemSubtitle, getPickerItemStyle, isEquipped,
            openSlotPicker, equipToSlot, unequipSlot, dropEquipped, onDrop
        };
    }
};
