// ===============================================
// 归属：【QA】 测试用例 / 覆盖验证
// 程序/美术/策划 请勿直接修改测试逻辑
// 修改后放入 roles/qa/ 运行 merge.py 合并
// ===============================================

/** AUDITFIX7 migration smoke — alias: save-schema-v7 (archive migration, schema upgrade) */
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

run('js/data/utils.js');
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

(async () => {
assert(state && state.__testing, 'CoCState exposes migration test helpers');
assert.strictEqual(state.__testing.SAVE_SCHEMA_VERSION, 7, 'AUDITFIX8 uses schema version 7');

const sysPrompt = state.gameState.chatHistory.find(m => m.role === 'system' && m.isHidden);
const baseRoster = () => ([
  { name: 'A', isActive: true, hp: 10, sanity: 50, attrs: { DEX: 60, CON: 50, SIZ: 50, POW: 50 }, derived: { hp: 10, maxHp: 10, db: '0' }, equipment: { weapon: '左轮手枪 [弹药:1]' }, skillAllocations: { '侦查': 60, '手枪': 90 } },
  { name: 'B', isActive: false, hp: 9, sanity: 45, attrs: { DEX: 45 }, derived: { hp: 9, maxHp: 9, db: '0' }, equipment: {}, skillAllocations: {} }
]);
const oldCombat = () => ({
  active: true,
  round: '2',
  enemies: [{ name: 'Ghoul', hp: '8', maxHp: '12', armor: '2' }],
  initiativeOrder: [
    { name: 'Ghoul', initiative: '44' },
    { id: 'A', name: 'A', initiative: '35', isEnemy: false }
  ],
  currentTurnIdx: 0,
  location: '地下室',
  notes: '旧存档迁移测试'
});
const pendingCluster = () => ([
  sysPrompt,
  { role: 'user', content: '我检查地板。' },
  { role: 'assistant', content: '', isResolved: false, tool_calls: [{ id: 'skill_old', type: 'function', function: { name: 'request_skill_check', arguments: '{"target_name":"A","skill_name":"侦查"}' }, isResolved: false }] }
].filter(Boolean));

function fixture(version) {
  if (version === 1) {
    return {
      roster: baseRoster(),
      inventory: ['旧钥匙'],
      storage: ['旧仓库物品'],
      currentLocation: '地下室',
      knownLocations: ['地下室'],
      chatHistory: pendingCluster(),
      journalLog: [{ type: 'legacy', summary: 'v1 flat save' }],
      combat: oldCombat(),
      selectedCharIndex: 9
    };
  }
  return {
    version,
    savedAt: new Date(2020, 0, version).toISOString(),
    slotName: `v${version} legacy`,
    location: '地下室',
    charNames: 'A、B',
    data: {
      roster: baseRoster(),
      inventory: ['煤油灯'],
      storage: version >= 3 ? ['储物箱'] : undefined,
      currentLocation: '地下室',
      knownLocations: version >= 2 ? ['地下室', '楼梯'] : undefined,
      chatHistory: pendingCluster(),
      journalLog: [{ type: 'legacy', summary: `v${version} structured save` }],
      npcRegistry: version >= 3 ? [{ name: '老管家', status: 'alive', relation: '可疑', notes: [] }] : undefined,
      combat: oldCombat(),
      sceneMap: version >= 4 ? { title: '老宅', rooms: [{ id: 'r1', name: '地下室', x: '1', y: '2' }], currentRoomId: 'r1' } : undefined,
      clueBoard: version >= 4 ? { clues: [{ id: 'c1', title: '血迹', content: '门边血迹', type: 'physical' }], links: [] } : undefined,
      diceHistory: version >= 5 ? [{ notation: '1d6', total: 4 }] : undefined,
      atmosphere: version >= 5 ? { level: 'tense', note: '寒冷' } : undefined,
      contextMeta: version >= 6 ? { runtimeChatMessages: 3, savedChatMessages: 3 } : undefined,
      selectedCharIndex: version % 2 === 0 ? '1' : 99
    }
  };
}

for (let version = 1; version <= 6; version++) {
  const migrated = state.__testing.migrateSaveData(fixture(version));
  assert(migrated, `v${version} fixture migrates`);
  assert.strictEqual(migrated.sourceVersion, version, `v${version} sourceVersion is preserved`);
  assert.strictEqual(migrated.version, 7, `v${version} migrates to schema 7`);
  assert(Array.isArray(migrated.data.inventory), `v${version} inventory normalized`);
  assert(Array.isArray(migrated.data.storage), `v${version} storage normalized`);
  assert(migrated.data.sceneMap && Array.isArray(migrated.data.sceneMap.rooms), `v${version} sceneMap normalized`);
  assert(migrated.data.clueBoard && Array.isArray(migrated.data.clueBoard.clues), `v${version} clueBoard normalized`);
  assert.strictEqual(migrated.data.combat.enemies[0].isEnemy, true, `v${version} enemy gets isEnemy`);
  assert(migrated.data.combat.enemies[0].id, `v${version} enemy gets stable id`);
  const ghoulTurn = migrated.data.combat.initiativeOrder.find(t => t.name === 'Ghoul');
  assert(ghoulTurn && ghoulTurn.isEnemy === true, `v${version} enemy initiative entry survives as enemy`);
  assert(Number.isInteger(migrated.data.selectedCharIndex), `v${version} selectedCharIndex normalized to integer`);

  store.set('coc_save_slot1', JSON.stringify(fixture(version)));
  assert.strictEqual(await state.loadGame('slot1'), true, `v${version} legacy save loads`);
  assert(state.gameState.combat.initiativeOrder.some(t => t.name === 'Ghoul' && t.isEnemy), `v${version} loaded combat order keeps enemy turn`);
  assert(state.gameState.selectedCharIndex <= Math.max(0, state.gameState.roster.filter(c => c.isActive).length - 1), `v${version} loaded selectedCharIndex is clamped`);
  const pending = state.gameState.chatHistory.find(m => m.role === 'assistant' && m.tool_calls && m.tool_calls[0]?.id === 'skill_old');
  assert(pending && pending.isResolved === false, `v${version} pending skill check survives load`);

  assert.strictEqual(state.saveGame('slot2', `roundtrip v${version}`), true, `v${version} roundtrip save succeeds`);
  const roundtrip = JSON.parse(store.get('coc_save_slot2'));
  assert.strictEqual(roundtrip.version, 7, `v${version} roundtrip writes schema 7`);
  assert(roundtrip.data.combat.initiativeOrder.some(t => t.name === 'Ghoul' && t.isEnemy), `v${version} roundtrip preserves enemy initiative`);
  assert(!roundtrip.data.chatHistory.some(m => m.isLocalOnly || m.isLocalError), `v${version} roundtrip excludes local-only UI messages`);
}

// Export/import-equivalent payload roundtrip via internal helpers.
state.gameState.roster.splice(0, state.gameState.roster.length, ...baseRoster());
state.gameState.currentLocation = '档案室';
state.gameState.inventory.splice(0, state.gameState.inventory.length, '黄铜钥匙');
const exportedPayload = state.__testing.buildSaveData('export-roundtrip');
state.gameState.roster.splice(0, state.gameState.roster.length);
state.gameState.inventory.splice(0, state.gameState.inventory.length);
assert.strictEqual(state.__testing.restoreFromData(exportedPayload, 'export-roundtrip'), true, 'export payload restores through the same migration path');
assert.strictEqual(state.gameState.roster[0].name, 'A', 'export/import roundtrip restores roster');
assert(state.gameState.inventory.includes('黄铜钥匙'), 'export/import roundtrip restores inventory');

console.log('AUDITFIX8 migration smoke tests passed');
})().catch(err => { console.error(err); process.exit(1); });
