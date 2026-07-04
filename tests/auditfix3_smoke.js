// ===============================================
// 归属：【QA】 测试用例 / 覆盖验证
// 程序/美术/策划 请勿直接修改测试逻辑
// 修改后放入 roles/qa/ 运行 merge.py 合并
// ===============================================

/** AUDITFIX3 smoke — alias: state-core (CoCState load, chat compact, roster remove) */
const fs = require('fs');
const vm = require('vm');
const path = require('path');
const assert = require('assert');

const store = new Map();
const sandbox = {
  console,
  setTimeout,
  clearTimeout,
  Date,
  Math,
  JSON,
  Promise,
  window: {},
  document: {
    getElementById: () => null,
    createElement: () => ({ click() {}, style: {}, set href(v) {}, set download(v) {} }),
    body: { appendChild() {}, removeChild() {} }
  },
  localStorage: {
    getItem: (k) => store.has(k) ? store.get(k) : null,
    setItem: (k, v) => { store.set(k, String(v)); },
    removeItem: (k) => { store.delete(k); }
  },
  Blob: function(parts, opts) { return { parts, opts }; },
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
vm.createContext(sandbox);
function run(file) {
  const code = fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
  vm.runInContext(code, sandbox, { filename: file });
}

run('js/core/context_manager.js');
run('js/tools/definitions.js');
run('js/data/skills.js');
run('js/coc.js');
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
run('js/tools/handlers/system.js');
run('js/tools/handlers/index.js');
run('js/ai/network.js');
run('js/ai/tool_dispatch.js');
run('js/data/ai_prompt_config.js');
run('js/ai_logic.js');

const state = sandbox.window.CoCState;
assert(state && state.gameState, 'CoCState loads');
assert.strictEqual(typeof state.showToast, 'function', 'showToast exported');
assert.strictEqual(typeof state.confirmAction, 'function', 'confirmAction exported');
assert.strictEqual(typeof state.compactChatHistory, 'function', 'compactChatHistory exported');
assert(sandbox.window.CoCAI && typeof sandbox.window.CoCAI.handlePlayerAction === 'function', 'CoCAI loads with ContextManager');

for (let i = 0; i < 320; i++) {
  state.gameState.chatHistory.push({ role: i % 2 ? 'assistant' : 'user', content: 'msg ' + i + ' '.repeat(100) });
}
const compact = state.compactChatHistory('smoke');
assert(compact.droppedCount > 0, 'runtime chat compacts when oversized');
assert(state.gameState.chatHistory.length <= 262, 'runtime chat stays bounded');

state.gameState.roster.splice(0, state.gameState.roster.length,
  { name: 'A', isActive: true, hp: 10, attrs: { DEX: 50 }, derived: { hp: 10 } },
  { name: 'B', isActive: true, hp: 10, attrs: { DEX: 50 }, derived: { hp: 10 } },
  { name: 'C', isActive: true, hp: 10, attrs: { DEX: 50 }, derived: { hp: 10 } }
);
state.gameState.selectedCharIndex = 2;
assert.strictEqual(state.removeCharacterAt(2), true, 'removeCharacterAt removes a valid character');
assert.strictEqual(state.gameState.selectedCharIndex, 1, 'selectedCharIndex clamps after removal');

state.gameState.combat.active = true;
state.gameState.combat.enemies = [{ id: 'e1', name: 'Ghoul', hp: 0, isDefeated: true }];
state.gameState.combat.initiativeOrder = [
  { id: 'e1', name: 'Ghoul', isEnemy: true },
  { id: 'A', name: 'A', isEnemy: false }
];
state.cleanupInitiativeOrder();
assert.deepStrictEqual(state.gameState.combat.initiativeOrder.map(t => t.name), ['A'], 'defeated initiative entries are removed');

state.gameState.chatHistory.push({ role: 'assistant', content: '', tool_calls: [{ id: 't1', type: 'function', function: { name: 'update_inventory', arguments: '{"items":["钥匙"]}' } }], isResolved: true });
state.gameState.chatHistory.push({ role: 'tool', name: 'update_inventory', tool_call_id: 't1', content: 'ok' });
const apiMessages = sandbox.window.CoCContextManager.buildApiMessages(state.gameState.chatHistory);
assert(apiMessages.length <= 50, 'AI context is bounded');
const lastAssistant = [...apiMessages].reverse().find(m => m.role === 'assistant' && m.tool_calls);
assert(lastAssistant && lastAssistant.tool_calls[0].id === 't1', 'latest tool-call cluster is preserved');

console.log('AUDITFIX3 smoke tests passed');
