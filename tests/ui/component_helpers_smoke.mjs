// UI helper smoke — pure functions from combat/chat/toast helpers (no Vue mount)
import assert from 'node:assert/strict';
import {
    COMBAT_QUICK_ACTIONS,
    filterActiveInitiativeOrder,
    computeActiveTurnIdx,
    resolveFirstWoundedChar,
    buildQuickActionText,
} from '../../js/components/combat_ui_helpers.mjs';
import { toastTitle, formatChatContent } from '../../js/components/chat_format_helpers.mjs';

const roster = [
    { name: 'A', isActive: true, hp: 5, derived: { hp: 10 } },
    { name: 'B', isActive: true, hp: 10, derived: { hp: 10 } },
];
const enemies = [
    { id: 'e1', name: 'Ghoul', hp: 8, maxHp: 12, isDefeated: false },
    { id: 'e2', name: 'Dead', hp: 0, maxHp: 10, isDefeated: true },
];
const order = [
    { id: 'e1', name: 'Ghoul', isEnemy: true },
    { id: 'e2', name: 'Dead', isEnemy: true },
    { id: 'A', name: 'A', isEnemy: false },
    { id: 'B', name: 'B', isEnemy: false },
];

const activeOrder = filterActiveInitiativeOrder(order, enemies, roster);
assert.deepEqual(activeOrder.map((t) => t.name), ['Ghoul', 'A', 'B'], 'filters defeated enemies and dead chars');
assert.strictEqual(computeActiveTurnIdx(5, 3), 2, 'activeTurnIdx wraps modulo');
assert.strictEqual(resolveFirstWoundedChar(roster, roster.filter((c) => c.isActive)), 'A', 'first wounded char');
assert.strictEqual(buildQuickActionText('skill', 'A'), '我对A进行急救。', 'skill quick action text');
assert(COMBAT_QUICK_ACTIONS.length >= 8, 'quick action catalog populated');

assert.strictEqual(toastTitle('success'), '成功', 'toast title success');
assert.strictEqual(toastTitle('unknown'), '提示', 'toast title fallback');
assert.strictEqual(formatChatContent(null), '', 'empty chat content');
assert.strictEqual(
    formatChatContent({ content: 'hello' }),
    'hello',
    'plain chat content'
);
const hpAlert = formatChatContent({
    statusAlert: {
        kind: 'hp_damage',
        name: 'A',
        dmg: 3,
        hp: 7,
        maxHp: 10,
        majorWound: { droppedWeapon: '左轮', bleeding: true },
    },
});
assert(hpAlert.includes('失去 3 点生命'), 'hp damage alert');
assert(hpAlert.includes('武器掉落'), 'major wound weapon drop');
assert(hpAlert.includes('内出血'), 'major wound bleeding');

console.log('component_helpers_smoke: 5 UI helper groups passed');
