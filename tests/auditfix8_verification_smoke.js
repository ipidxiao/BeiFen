// ===============================================
// 归属：【QA】 测试用例 / 覆盖验证
// 程序/美术/策划 请勿直接修改测试逻辑
// 修改后放入 roles/qa/ 运行 merge.py 合并
// ===============================================

/** AUDITFIX8 verification smoke — alias: architecture-rules-tools (load chain + representative tools) */
const fs = require('fs');
const vm = require('vm');
const path = require('path');
const assert = require('assert');

const root = path.join(__dirname, '..');
const store = new Map();
const sandbox = {
  console,
  setTimeout: (fn) => { if (typeof fn === 'function') fn(); return 1; },
  clearTimeout: () => {},
  Date,
  Math,
  JSON,
  Promise,
  Buffer,
  window: {},
  document: {
    getElementById: () => null,
    createElement: () => ({ click() {}, style: {}, set href(v) {}, set download(v) {} }),
    body: { appendChild() {}, removeChild() {} },
    addEventListener() {}
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
  vm.runInContext(fs.readFileSync(path.join(root, file), 'utf8'), sandbox, { filename: file });
}

assert(fs.existsSync(path.join(root, 'js/core/context_manager.js')), 'core directory exists');
assert(fs.existsSync(path.join(root, 'js/tools/definitions.js')), 'tool definitions moved under tools');
assert(fs.existsSync(path.join(root, 'js/tools/handlers/index.js')), 'handler registry exists');
assert(!fs.existsSync(path.join(root, 'js/tool_handlers.js')), 'legacy monolith tool_handlers.js removed');

const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const scripts = [...html.matchAll(/<script src="\.\/(.*?)"><\/script>/g)].map(m => m[1]);
[
  'js/core/context_manager.js',
  'js/tools/definitions.js',
  'js/state/core.js','js/state/ui.js','js/state/gameplay.js','js/state/persistence.js','js/state.js',
  'js/tools/handlers/character.js',
  'js/tools/handlers/inventory.js',
  'js/tools/handlers/dice.js',
  'js/tools/handlers/clues.js',
  'js/tools/handlers/map.js',
  'js/tools/handlers/combat.js',
  'js/tools/handlers/mythos.js',
  'js/tools/handlers/npc.js',
  'js/tools/handlers/system.js',
  'js/tools/handlers/index.js',
  'js/ai/network.js',
'js/ai/tool_dispatch.js',
'js/data/ai_prompt_config.js',
'js/ai_logic.js'
].forEach((src, idx, arr) => {
  assert(scripts.includes(src), `${src} is listed in index.html`);
  if (idx > 0) assert(scripts.indexOf(arr[idx - 1]) < scripts.indexOf(src), `${arr[idx - 1]} loads before ${src}`);
});

[
  'js/data/jobs.js','js/data/experiences.js','js/data/items.js','js/data/dev_logs.js',
  'js/data/skills.js','js/data/mythos_tomes.js','js/data/spells.js','js/data/insanity_tables.js','js/coc.js','js/engines/dice.js','js/engines/attributes.js','js/engines/skills.js','js/engines/combat.js','js/engines/healing.js','js/engines/sanity.js','js/engines/wound.js','js/engines/mythos.js','js/engines/environmental.js','js/engines/poison.js','js/core/context_manager.js','js/tools/definitions.js','js/state/core.js','js/state/ui.js','js/state/gameplay.js','js/state/persistence.js','js/state.js',
  'js/tools/handlers/character.js','js/tools/handlers/inventory.js','js/tools/handlers/dice.js','js/tools/handlers/clues.js','js/tools/handlers/map.js','js/tools/handlers/combat.js','js/tools/handlers/mythos.js','js/tools/handlers/npc.js','js/tools/handlers/system.js','js/tools/handlers/index.js','js/ai/network.js','js/ai/tool_dispatch.js','js/data/ai_prompt_config.js','js/ai_logic.js'
].forEach(run);

const state = sandbox.window.CoCState;
const engine = sandbox.window.CoCEngine;
const ai = sandbox.window.CoCAI;
assert(state && engine && ai, 'core modules load');
assert(sandbox.window.CoCToolDefinitions.auditAgainstHandlers(ai.getRegisteredToolNames()).ok, 'catalog and handlers match');
assert.strictEqual(ai.buildAiToolDefinitions().some(t => JSON.stringify(t).includes('singleAsArray')), false, 'API tools do not leak validator-only fields');
assert.strictEqual(ai.validateToolArguments('create_map', '{"title":"宅邸","rooms":[{"id":"r1","name":"厅","x":0,"y":0,"secret":true}]}').ok, false, 'nested unknown args rejected');

const char = { attrs: { DEX: 50 }, skillAllocations: { '斗殴': 60, '手枪': 55, '驾驶：汽车': 40 }, skills: { '侦查': 70 } };
assert.strictEqual(engine.getSkillValue(char, '格斗：斗殴'), 60, 'alias 格斗：斗殴 uses canonical 斗殴 allocation');
assert.strictEqual(engine.getSkillValue(char, '射击：手枪'), 55, 'parent child 射击：手枪 uses 手枪 allocation');
assert.strictEqual(engine.getSkillValue({ attrs: { DEX: 50 }, skillAllocations: {}, skills: {} }, '手枪'), 20, 'bare parent child 手枪 returns shooting base');

state.gameState.roster.splice(0, state.gameState.roster.length, {
  name: '调查员A', isActive: true, hp: 10, sanity: 50, attrs: { DEX: 60 }, derived: { hp: 10, db: '0' }, equipment: { weapon: '左轮手枪 [弹药:2]' }, skillAllocations: { '手枪': 90, '侦查': 60 }
});
ai.dispatchToolHandler('update_inventory', { items: ['钥匙'] });
assert(state.gameState.inventory.includes('钥匙'), 'inventory handler mutates state');
ai.dispatchToolHandler('register_npc', { name: '管家', relation: '可疑', status: 'alive' });
assert(state.gameState.npcRegistry.some(n => n.name === '管家'), 'npc handler mutates state');
ai.dispatchToolHandler('add_clue', { id: 'c1', title: '血迹', content: '门口血迹', type: 'physical' });
assert(state.gameState.clueBoard.clues.some(c => c.id === 'c1'), 'clue handler mutates state');
ai.dispatchToolHandler('create_map', { title: '老宅', rooms: [{ id: 'r1', name: '大厅', x: 0, y: 0, connections: [] }] });
ai.dispatchToolHandler('set_position', { room_id: 'r1' });
assert.strictEqual(state.gameState.currentLocation, '大厅', 'map handler updates position');
ai.dispatchToolHandler('start_combat', { enemies: [{ name: '食尸鬼', hp: 10, armor: 0 }], location: '大厅' });
assert.strictEqual(state.gameState.combat.enemies[0].isEnemy, true, 'combat enemies are marked isEnemy');
ai.dispatchToolHandler('update_enemy', { name: '食尸鬼', hp_change: -3, note: 'verification' });
assert.strictEqual(state.gameState.combat.enemies[0].hp, 7, 'combat damage applies once');

console.log('AUDITFIX8 verification smoke tests passed');
