// ===============================================
// 归属：【QA】 测试用例 / 覆盖验证
// 程序/美术/策划 请勿直接修改测试逻辑
// 修改后放入 roles/qa/ 运行 merge.py 合并
// ===============================================

/**
 * Bug Hunt — systematic edge-case probing of all functional modules.
 * Run: node tests/bug_hunt.mjs
 */
import './helpers/browser-mock.mjs';
import { strict as assert } from 'node:assert';

let bugs = [];
let passed = 0;
const check = (cond, msg) => { if (cond) passed++; else bugs.push(msg); };

// ── Load engine ──
import { CoCEngine } from '../js/coc.mjs';
import { CoCBaseSkills } from '../js/data/skills.mjs';

// ═══════════════════════════════════════════
// 1. RULES ENGINE — boundary / zero / extremes
// ═══════════════════════════════════════════

// 1a. Dice: zero / negative / huge
check(CoCEngine.roll(0, 6) === 0, 'roll(0,6) → 0');
check(CoCEngine.roll(1, 1) === 1, 'roll(1,1) → 1 (d1 always 1)');
check(CoCEngine.parseDice('0') === 0, 'parseDice("0") → 0');
check(CoCEngine.parseDice('') === 0, 'parseDice("") → 0');
check(CoCEngine.parseDice(null) === 0, 'parseDice(null) → 0');
check(CoCEngine.parseDice('999D999') >= 999, 'parseDice("999D999") works');

// 1b. Skill check: edge values
const char = { attrs:{DEX:50}, skillAllocations:{'斗殴':0}, skills:{} };
check(CoCEngine.getSkillValue(char, '斗殴') === 0, 'skill value 0 → 0 (not fallback to base)');
check(CoCEngine.getSkillValue(char, '不存在的技能') === 0, 'unknown skill → 0');
check(CoCEngine.getSkillValue({}, '斗殴') === 25, 'empty char → base(25)');

// 1c. Skill check with extreme values
const maxChar = { attrs:{DEX:99}, skillAllocations:{'斗殴':99}, skills:{} };
check(CoCEngine.getSkillValue(maxChar, '斗殴') === 99, 'skill 99 → 99');
const negChar = { attrs:{DEX:-5}, skillAllocations:{'斗殴':-10}, skills:{} };
const negVal = CoCEngine.getSkillValue(negChar, '斗殴');
check(typeof negVal === 'number', 'negative skill returns number');

// 1d. checkSkill fumble boundary
const orig = Math.random;
Math.random = () => 0.99; // roll 100
const fumble = CoCEngine.checkSkill('斗殴', { attrs:{}, skillAllocations:{'斗殴':50}, skills:{} });
check(fumble.level === '大失败', 'roll 100 → 大失败');
Math.random = () => 0.0; // roll 1
const crit = CoCEngine.checkSkill('斗殴', { attrs:{}, skillAllocations:{'斗殴':50}, skills:{} });
check(crit.level === '大成功', 'roll 1 → 大成功');
Math.random = orig;

// 1e. Derived attributes: edge values
const zeroAttrs = {STR:0,CON:0,SIZ:0,DEX:0,APP:0,INT:0,POW:0,EDU:0};
const zeroDerived = CoCEngine.calculateDerived(zeroAttrs);
check(zeroDerived.hp === 0, 'HP(0,0) → 0');
check(zeroDerived.mp === 0, 'MP(0) → 0');
check(zeroDerived.db === '-2', 'DB(0) → -2 (after fix)'); // 0 falls in 2-64 range

const maxAttrs = {STR:99,CON:99,SIZ:99,DEX:99,APP:99,INT:99,POW:99,EDU:99};
const maxDerived = CoCEngine.calculateDerived(maxAttrs);
check(maxDerived.hp === 19, 'HP(99,99) → 19');
check(maxDerived.db === '1D6', 'DB(198) → 1D6 (165-204 range)');

// 1f. Age modifiers: boundary
const base = {STR:50,CON:50,SIZ:50,DEX:50,APP:50,INT:50,POW:50,EDU:50,LUCK:50};
check(CoCEngine.applyAgeModifiers({...base}, 0).STR === 50, 'age 0 → no change');
check(CoCEngine.applyAgeModifiers({...base}, 14).STR === 50, 'age 14 → no change');
check(CoCEngine.applyAgeModifiers({...base}, 15).STR === 45, 'age 15 → STR-5');
check(CoCEngine.applyAgeModifiers({...base}, 19).STR === 45, 'age 19 → STR-5');
check(CoCEngine.applyAgeModifiers({...base}, 20).STR === 50, 'age 20 → no change (gap between 19-39)');

// 1g. Clamp to 15 minimum
const weak = CoCEngine.applyAgeModifiers({STR:10,CON:10,SIZ:10,DEX:10,APP:10,INT:10,POW:10,EDU:10,LUCK:10}, 70);
check(weak.STR === 15, 'age 70: STR clamped to min 15 (not below)');

// ═══════════════════════════════════════════
// 2. COMBAT — damage / defeat / edge
// ═══════════════════════════════════════════

// 2a. calculateDamage: zero / negative
const dmg1 = CoCEngine.CombatEngine.calculateDamage('1D6', null, 0);
check(dmg1 >= 1 && dmg1 <= 6, 'calculateDamage without DB');
const dmg2 = CoCEngine.CombatEngine.calculateDamage('1D6', '1D4', 99);
check(dmg2 === 0, 'armor 99 → 0 damage');
const dmg3 = CoCEngine.CombatEngine.calculateDamage('0', null, 0);
check(dmg3 === 0, 'damage "0" → 0');

// 2b. compareSuccess: all pairs
const ranks = ['大成功','极难成功','困难成功','成功','失败','大失败'];
for (let i = 0; i < ranks.length - 1; i++) {
    check(CoCEngine.CombatEngine.compareSuccess(ranks[i], ranks[i+1]) > 0, `${ranks[i]} > ${ranks[i+1]}`);
}
check(CoCEngine.CombatEngine.compareSuccess('成功', '成功') === 0, '成功 == 成功');
check(CoCEngine.CombatEngine.compareSuccess('invalid', '成功') < 0, 'unknown level < 成功');

// 2c. resolveCombatExchange: attacker fumble
Math.random = () => 0.99; // fumble
const atk = { name:'A', attrs:{DEX:50}, skillAllocations:{'斗殴':50}, derived:{db:'0'}, armor:0 };
const def = { name:'B', attrs:{DEX:50}, skillAllocations:{'闪避':50}, derived:{db:'0'}, armor:0 };
const fumbleRes = CoCEngine.CombatEngine.resolveCombatExchange(atk, def, {weapon:{skill:'斗殴',damage:'1D6'}});
check(fumbleRes.winner === 'defender', 'fumble → defender wins');
check(fumbleRes.damage === 0, 'fumble → 0 damage');
Math.random = orig;

// ═══════════════════════════════════════════
// 3. STATE MANAGEMENT — reactive / bounds
// ═══════════════════════════════════════════
import { CoCStateCore } from '../js/state/core.mjs';
import { CoCStateUI } from '../js/state/ui.mjs';
import { CoCStateGameplay } from '../js/state/gameplay.mjs';
import { CoCStatePersistence } from '../js/state/persistence.mjs';
import { CoCState } from '../js/state/state.mjs';

// 3a. Toast overflow
for (let i = 0; i < 20; i++) CoCState.showToast(`msg ${i}`, 'info');
check(CoCState.gameState.ui.toasts.length <= 5, 'toast limit 5 (default)');

// 3b. showToast with empty message
const emptyId = CoCState.showToast('', 'info');
check(emptyId === null, 'empty toast → null');

// 3c. confirmAction double-call
const p1 = CoCState.confirmAction('first');
const p2 = CoCState.confirmAction('second');
// Second should cancel first
const v1 = await p1; check(v1 === false, 'first confirm cancelled by second');
// Resolve second
CoCState.resolveConfirm(true);
const result = await p2;
check(result === true, 'second confirm resolved true');

// 3d. removeCharacterAt bounds
CoCState.gameState.roster = [{name:'A',isActive:true,attrs:{DEX:50,STR:50,CON:50,SIZ:50,APP:50,INT:50,POW:50,EDU:50},derived:{hp:10,maxHp:10}},{name:'B',isActive:true,attrs:{DEX:50,STR:50,CON:50,SIZ:50,APP:50,INT:50,POW:50,EDU:50},derived:{hp:10,maxHp:10}}];
check(CoCState.removeCharacterAt(-1) === false, 'removeCharacterAt(-1) → false');
check(CoCState.removeCharacterAt(99) === false, 'removeCharacterAt(99) → false');
check(CoCState.removeCharacterAt('abc') === false, 'removeCharacterAt("abc") → false');

// 3e. Combat bounds: no enemies
CoCState.gameState.combat.active = false;
check(typeof CoCState.startCombat === 'function', 'startCombat exists');
CoCState.startCombat([], 'Empty');
check(CoCState.gameState.combat.enemies.length === 0, 'combat with 0 enemies');

// ═══════════════════════════════════════════
// 4. ARCHIVE — migration edge cases
// ═══════════════════════════════════════════

// 4a. migrateSaveData with null/undefined
check(CoCState.__testing.migrateSaveData(null) === null, 'migrateSaveData(null) → null');
check(CoCState.__testing.migrateSaveData(undefined) === null, 'migrateSaveData(undefined) → null');
check(CoCState.__testing.migrateSaveData({}) === null, 'migrateSaveData({}) → null');

// 4b. migrateSaveData: flat→nested migration
const flat = { version: 1, roster: [], inventory: [], chatHistory: [], location: 'Test' };
const migrated = CoCState.__testing.migrateSaveData(flat);
check(migrated !== null, 'flat migrate → not null');
check(migrated.data !== undefined, 'flat migrate → has data');
check(migrated.data.roster !== undefined, 'flat migrate → has roster');

// 4c. migrateSaveData: version forward compat
const future = { version: 99, data: { roster: [] } };
const futureMigrated = CoCState.__testing.migrateSaveData(future);
check(futureMigrated !== null, 'future version → not rejected (forward compat)');

// ═══════════════════════════════════════════
// 5. AI TOOLS — validation edge cases
// ═══════════════════════════════════════════
import { CoCToolDefinitions } from '../js/tools/definitions.mjs';
import { CoCToolHandlers } from '../js/tools/handlers/index.mjs';

// 5a. Schema: empty / null arguments
const schema = CoCToolDefinitions.getSchema('update_inventory');
check(schema !== null, 'update_inventory schema exists');

// 5b. buildTools: verify no internal fields leak
const tools = CoCToolDefinitions.buildTools();
const hasSingleAsArray = tools.some(t => JSON.stringify(t).includes('singleAsArray'));
check(!hasSingleAsArray, 'singleAsArray not leaked to API tools');

// 5c. Handler registry: all expected tools present
import { character } from '../js/tools/handlers/character.mjs';
import { inventory } from '../js/tools/handlers/inventory.mjs';
import { dice } from '../js/tools/handlers/dice.mjs';
import { clues } from '../js/tools/handlers/clues.mjs';
import { map } from '../js/tools/handlers/map.mjs';
import { combat } from '../js/tools/handlers/combat.mjs';
import { npc } from '../js/tools/handlers/npc.mjs';
import { system } from '../js/tools/handlers/system.mjs';

const modules = { character, inventory, dice, clues, map, combat, npc, system };
for (const [name, fn] of Object.entries(modules)) {
    check(typeof fn === 'function', `handler ${name} is function`);
}

// ═══════════════════════════════════════════
// 6. DATA INTEGRITY — cross-module consistency
// ═══════════════════════════════════════════

// 6a. BaseSkills vs engine.BaseSkills
const engineSkills = Object.keys(CoCEngine.BaseSkills);
const catalogSkills = Object.keys(CoCBaseSkills);
check(engineSkills.length === catalogSkills.length, 'engine.BaseSkills matches catalog');
for (const k of engineSkills) {
    check(catalogSkills.includes(k), `skill ${k} in both engine and catalog`);
}

// 6b. Occupations from CoCJobs
import { CoCJobs } from '../js/data/jobs.mjs';
check(CoCEngine.Occupations.length === CoCJobs.length, 'Occupations count matches CoCJobs');

// ═══════════════════════════════════════════
// 7. INVENTORY — item operations
// ═══════════════════════════════════════════
CoCState.gameState.inventory = [];
CoCState.gameState.storage = [];

// Set up tool handlers for dispatch
window.CoCToolDefinitions = CoCToolDefinitions;
window.CoCToolHandlers = CoCToolHandlers;
window.CoCToolHandlerModules = modules;

// Try direct handler invocation (requires ai_logic for dispatch)
// Test via state gameplay methods instead
CoCState.addClue('test1', 'Test Clue', 'content', 'physical');
check(CoCState.gameState.clueBoard.clues.length === 1, 'clue added via state');

CoCState.createMap('TestMap', [{id:'r1',name:'Room1',x:0,y:0}]);
check(CoCState.gameState.sceneMap.title === 'TestMap', 'map created');
CoCState.setPosition('r1');
check(CoCState.gameState.currentLocation === 'Room1', 'position set');

CoCState.addNpc({name:'NPC1',relation:'friend'});
check(CoCState.gameState.npcRegistry.length === 1, 'NPC added');
CoCState.updateNpcStatus('NPC1', 'dead');
check(CoCState.gameState.npcRegistry[0].status === 'dead', 'NPC status updated');


// ── Report ──
if (bugs.length === 0) {
    console.log(`\nBUG HUNT: 0 bugs found, ${passed} checks passed ✅`);
} else {
    console.log(`\nBUG HUNT: ${bugs.length} BUGS FOUND:`);
    bugs.forEach((b, i) => console.log(`  ${i+1}. ${b}`));
    console.log(`${passed} checks passed`);
}
