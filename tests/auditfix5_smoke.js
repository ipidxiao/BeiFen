// ===============================================
// 归属：【QA】 测试用例 / 覆盖验证
// 程序/美术/策划 请勿直接修改测试逻辑
// 修改后放入 roles/qa/ 运行 merge.py 合并
// ===============================================

/** AUDITFIX5 smoke — alias: clues-npc (clue board, NPC registry, context) */
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
run('js/tools/handlers/mythos.js');
run('js/tools/handlers/system.js');
run('js/tools/handlers/index.js');
run('js/ai/network.js');
run('js/ai/tool_dispatch.js');
run('js/data/ai_prompt_config.js');
run('js/ai_logic.js');

const defs = sandbox.window.CoCToolDefinitions;
const ai = sandbox.window.CoCAI;
assert(defs && typeof defs.buildTools === 'function', 'CoCToolDefinitions loads');
assert(ai && typeof ai.buildAiToolDefinitions === 'function', 'CoCAI exposes tool definition builder');

const names = defs.getNames();
const apiTools = defs.buildTools();
assert(names.length >= 20, 'tool catalog contains expected tools');
assert.strictEqual(apiTools.length, names.length, 'API tool list is generated from catalog');
assert.deepStrictEqual(ai.buildAiToolDefinitions().map(t => t.function.name), names, 'CoCAI uses catalog order directly');
assert(apiTools.every(t => t.type === 'function' && t.function && names.includes(t.function.name)), 'all generated API tools are valid function tools');
assert(!JSON.stringify(apiTools).includes('singleAsArray'), 'validator-only schema flags are stripped from API tools');
assert(JSON.stringify(defs.getSchema('update_inventory')).includes('singleAsArray'), 'validator keeps internal normalization flags');

const inv = ai.validateToolArguments('update_inventory', '{"items":"铜钥匙"}');
assert.strictEqual(inv.ok, true, 'validator still normalizes scalar item');
assert.deepStrictEqual(Array.from(inv.args.items), ['铜钥匙'], 'scalar item is normalized from catalog schema');
const badEnum = ai.validateToolArguments('end_combat', '{"outcome":"win"}');
assert.strictEqual(badEnum.ok, false, 'enum constraint from catalog schema is enforced');
const map = ai.validateToolArguments('create_map', '{"title":"宅邸","rooms":[{"id":"r1","name":"大厅","x":"1","y":"2","connections":"r2"}]}');
assert.strictEqual(map.ok, true, 'nested schema from catalog normalizes map rooms');
assert.strictEqual(map.args.rooms[0].x, 1, 'nested numeric string is converted');
assert.deepStrictEqual(Array.from(map.args.rooms[0].connections), ['r2'], 'nested singleAsArray is applied');

const audit = defs.auditAgainstHandlers(ai.getRegisteredToolNames(), ['request_skill_check', 'push_skill_check']);
assert.strictEqual(audit.ok, true, 'tool catalog and handler registry are consistent');
assert.strictEqual(audit.missingHandlers.length, 0, 'no catalog tool is missing a handler except special tools');
assert.strictEqual(audit.handlersWithoutCatalog.length, 0, 'no handler lacks a catalog entry');

console.log('AUDITFIX5 smoke tests passed');
