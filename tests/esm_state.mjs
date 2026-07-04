// ===============================================
// 归属：【QA】 测试用例 / 覆盖验证
// 程序/美术/策划 请勿直接修改测试逻辑
// 修改后放入 roles/qa/ 运行 merge.py 合并
// ===============================================

/**
 * ESM State Test — validates CoCState import chain with browser mocks.
 *
 * Run: node tests/esm_state.mjs
 */
import './helpers/browser-mock.mjs';
import { strict as assert } from 'node:assert';

// Import engine first (state depends on it)
import { CoCEngine } from '../js/coc.mjs';
window.CoCEngine = CoCEngine;

// Import state modules
import { CoCStateCore } from '../js/state/core.mjs';
window.CoCStateCore = CoCStateCore;

import { CoCStateUI } from '../js/state/ui.mjs';
window.CoCStateUI = CoCStateUI;

import { CoCStateGameplay } from '../js/state/gameplay.mjs';
window.CoCStateGameplay = CoCStateGameplay;

import { CoCStatePersistence } from '../js/state/persistence.mjs';
window.CoCStatePersistence = CoCStatePersistence;

// Import aggregated state
import { CoCState } from '../js/state/state.mjs';
window.CoCState = CoCState;

let passed = 0;
const check = (condition, msg) => { assert(condition, msg); passed++; };

// ═══ 1. State object integrity ═══
check(typeof CoCState === 'object' && CoCState !== null, 'CoCState exists');
check(typeof CoCState.gameState === 'object', 'gameState exists');
check(typeof CoCState.playerInput === 'object', 'playerInput exists');
check(typeof CoCState.draftChar === 'object', 'draftChar exists');

// ═══ 2. Navigation ═══
check(typeof CoCState.switchScreen === 'function', 'switchScreen exists');
check(typeof CoCState.showModal === 'function', 'showModal exists');
check(typeof CoCState.closeModal === 'function', 'closeModal exists');
CoCState.switchScreen('lobby');
check(CoCState.gameState.currentScreen === 'lobby', 'switchScreen to lobby');

// ═══ 3. Toast/Confirm ═══
check(typeof CoCState.showToast === 'function', 'showToast exists');
const toastId = CoCState.showToast('test', 'info');
check(typeof toastId === 'number', 'showToast returns id');
check(CoCState.gameState.ui.toasts.length > 0, 'toast added to state');

check(typeof CoCState.confirmAction === 'function', 'confirmAction exists');
check(typeof CoCState.resolveConfirm === 'function', 'resolveConfirm exists');

// ═══ 4. Journal ═══
CoCState.addJournalEntry({ type: 'test', summary: 'test entry' });
check(CoCState.gameState.journalLog.length === 1, 'journal entry added');

// ═══ 5. Combat ═══
check(typeof CoCState.startCombat === 'function', 'startCombat exists');
CoCState.startCombat([{ name: 'Ghoul', hp: 12, armor: 1 }], 'Crypt', 'test');
check(CoCState.gameState.combat.active === true, 'combat active');
check(CoCState.gameState.combat.enemies.length === 1, '1 enemy');
check(CoCState.gameState.combat.enemies[0].name === 'Ghoul', 'enemy name');
check(CoCState.gameState.combat.enemies[0].isEnemy === true, 'enemy marked');

CoCState.updateEnemy('Ghoul', -5, 'wounded');
check(CoCState.gameState.combat.enemies[0].hp === 7, 'enemy hp updated');

CoCState.endCombat('victory', 'test done');
check(CoCState.gameState.combat.active === false, 'combat ended');

// ═══ 6. Dice ═══
check(typeof CoCState.rollCustomDice === 'function', 'rollCustomDice exists');
const roll = CoCState.rollCustomDice('2d6', 'test roll', 'tester');
check(roll !== null, 'rollCustomDice returns result');
check(roll.total >= 2 && roll.total <= 12, '2d6 in range [2,12]');
check(CoCState.gameState.diceHistory.length > 0, 'dice history populated');

// ═══ 7. Clue Board ═══
check(typeof CoCState.addClue === 'function', 'addClue exists');
CoCState.addClue('c1', 'Blood', 'Blood on floor', 'physical');
check(CoCState.gameState.clueBoard.clues.length === 1, 'clue added');
CoCState.markClueStatus('c1', 'key', 'important');
check(CoCState.gameState.clueBoard.clues[0].status === 'key', 'clue status key');
check(CoCState.gameState.clueBoard.clues[0].note === 'important', 'clue note set');

// ═══ 8. Scene Map ═══
check(typeof CoCState.createMap === 'function', 'createMap exists');
CoCState.createMap('Mansion', [{ id: 'r1', name: 'Hall', x: 0, y: 0 }]);
check(CoCState.gameState.sceneMap.title === 'Mansion', 'map title');
check(CoCState.gameState.sceneMap.rooms.length === 1, '1 room');

CoCState.setPosition('r1');
check(CoCState.gameState.currentLocation === 'Hall', 'position set');

// ═══ 9. NPC Registry ═══
check(typeof CoCState.addNpc === 'function', 'addNpc exists');
CoCState.addNpc({ name: 'Butler', relation: 'suspicious', status: 'alive' });
check(CoCState.gameState.npcRegistry.length === 1, 'npc added');
CoCState.updateNpcStatus('Butler', 'dead', 'murdered');
check(CoCState.gameState.npcRegistry[0].status === 'dead', 'npc status dead');

// ═══ 10. Character Growth ═══
CoCState.gameState.roster.push({
    name: 'Investigator', isActive: true, hp: 10, sanity: 50,
    attrs: { DEX: 50, CON: 50, SIZ: 50, EDU: 60, STR: 50, APP: 50, INT: 50, POW: 50 },
    derived: { hp: 10, maxHp: 10, db: '0' },
    skillAllocations: { '侦查': 60 },
    skillsUsedThisSession: [{ name: '侦查', currentValue: 60 }]
});
const imp = CoCState.rollImprovement('Investigator', '侦查');
check(imp && typeof imp.roll === 'number', 'rollImprovement returns result');
check(typeof CoCState.clearSessionSkills === 'function', 'clearSessionSkills exists');
check(typeof CoCState.removeCharacterAt === 'function', 'removeCharacterAt exists');

console.log(`ESM state: ALL ${passed} assertions PASSED`);
