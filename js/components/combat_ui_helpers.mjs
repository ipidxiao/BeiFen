// Pure combat UI helpers — shared by StoryCombat and Node/jsdom tests.

export const COMBAT_QUICK_ACTIONS = Object.freeze([
    { id: 'melee', label: '🗡️ 近战', text: '我向最近的敌人发起近战攻击！' },
    { id: 'shoot', label: '🔫 射击', text: '我开枪射击！' },
    { id: 'counter', label: '⚔️ 反击', text: '我放弃闪避，对攻击者进行反击！' },
    { id: 'dodge', label: '🛡️ 生存', text: '我尝试闪避并寻找掩体。' },
    { id: 'flee', label: '🏃 逃脱', text: '我们撤退！' },
    { id: 'grapple', label: '🤼 擒抱', text: '我尝试擒抱最近的敌人！' },
    { id: 'skill', label: '💊 技能', buildText: (targetName) => `我对${targetName}进行急救。` },
    { id: 'intimidate', label: '🗣️ 交涉', text: '我尝试威吓敌人！' },
    { id: 'environment', label: '🏚️ 环境', text: '我利用周围的环境（家具/障碍物）获取掩护！' },
]);

export function filterActiveInitiativeOrder(initiativeOrder, enemies, roster) {
    const order = Array.isArray(initiativeOrder) ? initiativeOrder : [];
    const enemyList = Array.isArray(enemies) ? enemies : [];
    const chars = Array.isArray(roster) ? roster : [];
    return order.filter((turn) => {
        if (!turn || typeof turn !== 'object') return false;
        if (turn.isEnemy) {
            const enemy = enemyList.find((en) => en && en.id === turn.id);
            return enemy && !enemy.isDefeated;
        }
        return chars.find((c) => c && c.name === turn.name && c.isActive && c.hp > 0);
    });
}

export function computeActiveTurnIdx(currentTurnIdx, activeOrderLength) {
    const len = Math.max(1, Number(activeOrderLength) || 0);
    const idx = Number(currentTurnIdx) || 0;
    return idx % len;
}

export function resolveFirstWoundedChar(roster, activeChars) {
    const chars = Array.isArray(roster) ? roster : [];
    const active = Array.isArray(activeChars) ? activeChars : chars.filter((c) => c && c.isActive);
    const wounded = chars.find((r) => r && r.isActive && r.hp < (r.derived?.hp || 10));
    if (wounded && wounded.name) return wounded.name;
    return active[0]?.name || '队友';
}

export function buildQuickActionText(actionId, woundedName = '队友') {
    const action = COMBAT_QUICK_ACTIONS.find((a) => a.id === actionId);
    if (!action) return '';
    if (typeof action.buildText === 'function') return action.buildText(woundedName);
    return action.text || '';
}

if (typeof window !== 'undefined') {
    window.CombatUiHelpers = {
        COMBAT_QUICK_ACTIONS,
        filterActiveInitiativeOrder,
        computeActiveTurnIdx,
        resolveFirstWoundedChar,
        buildQuickActionText,
    };
}
