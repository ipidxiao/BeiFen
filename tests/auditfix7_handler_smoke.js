// ===============================================
// 归属：【QA】 测试用例 / 覆盖验证
// 程序/美术/策划 请勿直接修改测试逻辑
// 修改后放入 roles/qa/ 运行 merge.py 合并
// ===============================================

/** AUDITFIX7 handler smoke — alias: tool-handler-registry (handler delegation from ai_logic) */
const fs = require('fs');
const vm = require('vm');
const path = require('path');
const assert = require('assert');

const store = new Map();
const deterministicMath = Object.create(Math);
deterministicMath.random = () => 0.5;
const sandbox = {
  console,
  setTimeout,
  clearTimeout,
  Date,
  Math: deterministicMath,
  JSON,
  Promise,
  Buffer,
  window: {},
  document: {
    getElementById: () => null,
    createElement: () => ({ click() {}, style: {}, set href(v) {}, set download(v) {} }),
    body: { appendChild() {}, removeChild() {} }
  },
  localStorage: {
    get length() { return store.size; },
    key: (i) => Array.from(store.keys())[i] ?? null,
    getItem: (k) => store.has(k) ? store.get(k) : null,
    setItem: (k, v) => { store.set(k, String(v)); },
    removeItem: (k) => { store.delete(k); }
  },
  Blob: function(parts, opts) { return { parts, opts, size: (parts || []).reduce((n, p) => n + Buffer.byteLength(String(p)), 0) }; },
  URL: { createObjectURL: () => 'blob:test', revokeObjectURL: () => {} }
};
sandbox.window = sandbox;
sandbox.window.Vue = {
  reactive: (x) => x,
  ref: (v) => ({ value: v }),
  computed: (fnOrObj) => ({ get value() { return typeof fnOrObj === 'function' ? fnOrObj() : fnOrObj.get(); }, set value(v) { if (fnOrObj.set) fnOrObj.set(v); } }),
  nextTick: (fn) => (fn ? fn() : Promise.resolve()),
  watch: () => {}
};
sandbox.window.DevLogs = [];
vm.createContext(sandbox);
function run(file) {
  const code = fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
  vm.runInContext(code, sandbox, { filename: file });
}

run('js/core/context_manager.js');
run('js/tools/definitions.js');
run('js/data/skills.js');
run('js/coc.js');
// P0-2: coc.js split into engine modules — load them onto window.CoCEngine
['dice','attributes','skills','combat','healing','sanity','wound','mythos','environmental','poison'].forEach(f => run('js/engines/' + f + '.js'));
run('js/state/core.js');
run('js/state/ui.js');
run('js/state/gameplay.js');
run('js/state/persistence.js');
run('js/state.js');
run('js/tools/handlers/character.js');
run('js/tools/handlers/inventory.js');
run('js/tools/handlers/dice.js');
run('js/tools/handlers/clues.js');
run('js/tools/handlers/map.js');
run('js/tools/handlers/combat.js');
run('js/tools/handlers/npc.js');
run('js/tools/handlers/mythos.js');
run('js/tools/handlers/system.js');
run('js/tools/handlers/index.js');
run('js/ai/network.js');
run('js/ai/tool_dispatch.js');
run('js/data/ai_prompt_config.js');
run('js/ai_logic.js');

const state = sandbox.window.CoCState;
const engine = sandbox.window.CoCEngine;
const defs = sandbox.window.CoCToolDefinitions;
const ai = sandbox.window.CoCAI;
assert(sandbox.window.CoCToolHandlers && typeof sandbox.window.CoCToolHandlers.create === 'function', 'CoCToolHandlers module is loaded');
const handlers = sandbox.window.CoCToolHandlers.create(state, engine);
assert.deepStrictEqual(Array.from(Object.keys(handlers)).sort(), Array.from(ai.getRegisteredToolNames()).sort(), 'CoCAI registry is created from CoCToolHandlers');
const audit = defs.auditAgainstHandlers(Object.keys(handlers), ['request_skill_check', 'push_skill_check']);
assert.strictEqual(audit.ok, true, 'direct handler registry matches tool catalog');

const aiSource = fs.readFileSync(path.join(__dirname, '..', 'js/ai_logic.js'), 'utf8');
assert(!aiSource.includes('const toolHandlers = {'), 'ai_logic.js no longer owns the handler object literal');
assert(aiSource.includes('window.CoCToolHandlers.create'), 'ai_logic.js delegates handler creation to tool_handlers.js');

state.gameState.roster.splice(0, state.gameState.roster.length,
  { name: 'A', isActive: true, hp: 10, sanity: 50, attrs: { DEX: 60, CON: 50, SIZ: 50, POW: 50 }, derived: { hp: 10, maxHp: 10, db: '0' }, equipment: { weapon: '左轮手枪 [弹药:2]' }, skillAllocations: { '手枪': 90, '侦查': 60, '斗殴': 70 } },
  { name: 'B', isActive: true, hp: 12, sanity: 55, attrs: { DEX: 40, CON: 60, SIZ: 60, POW: 55 }, derived: { hp: 12, maxHp: 12, db: '0' }, equipment: {}, skillAllocations: { '侦查': 55 } }
);

assert.strictEqual(handlers.update_inventory({ items: ['银钥匙'] }), '完成', 'direct update_inventory handler runs');
assert(state.gameState.inventory.includes('银钥匙'), 'direct handler mutates inventory');
assert.strictEqual(handlers.consume_inventory_items({ items: ['银钥匙'] }), '完成', 'direct consume_inventory_items handler runs');
assert(!state.gameState.inventory.includes('银钥匙'), 'direct consume handler mutates inventory');

handlers.create_map({ title: '老宅', rooms: [{ id: 'r1', name: '大厅', x: 1, y: 1 }, { id: 'r2', name: '书房', x: 2, y: 1 }] });
assert.strictEqual(state.gameState.sceneMap.title, '老宅', 'direct create_map handler writes sceneMap');
handlers.set_position({ room_id: 'r2' });
assert.strictEqual(state.gameState.currentLocation, '书房', 'direct set_position handler writes currentLocation');

handlers.start_combat({ enemies: [{ name: 'Ghoul', hp: 18, armor: 2 }], location: '书房', notes: '突袭' });
assert(state.gameState.combat.active, 'direct start_combat activates combat');
assert.strictEqual(state.gameState.combat.enemies[0].isEnemy, true, 'direct start_combat marks enemies');
const beforeHp = state.gameState.combat.enemies[0].hp;
const fireResult = handlers.fire_weapon({ shooter_name: 'A', enemy_name: 'Ghoul', damage: '1D10+5' });
assert.strictEqual(state.gameState.roster[0].equipment.weapon.includes('[弹药:1]'), true, 'direct fire_weapon consumes exactly one bullet');
assert(state.gameState.combat.enemies[0].hp < beforeHp, `direct fire_weapon damages enemy: ${fireResult}`);

const oldHp = state.gameState.roster[1].hp;
handlers.enemy_attack({ enemy_name: 'Ghoul', target_name: 'B', damage: 4, description: '撕咬' });
assert.strictEqual(state.gameState.roster[1].hp, oldHp - 4, 'direct enemy_attack damages target');

assert.strictEqual(typeof ai.dispatchToolHandler, 'function', 'CoCAI exposes dispatchToolHandler for tests');
ai.dispatchToolHandler('system_alert', { message: 'handler dispatch ok' });
assert(state.gameState.chatHistory.some(m => String(m.content || '').includes('handler dispatch ok')), 'dispatchToolHandler delegates to direct handler registry');

console.log('AUDITFIX8 handler smoke tests passed');
