// ===============================================
// 归属：【QA】 测试用例 / 覆盖验证
// 程序/美术/策划 请勿直接修改测试逻辑
// 修改后放入 roles/qa/ 运行 merge.py 合并
// ===============================================

/** AUDITFIX4 smoke — alias: character-inventory (roster, equipment, tool handlers) */
const fs = require('fs');
const vm = require('vm');
const path = require('path');
const assert = require('assert');

(async () => {
  const store = new Map();
  const localStorageMock = {
    get length() { return store.size; },
    key: (i) => Array.from(store.keys())[i] ?? null,
    getItem: (k) => store.has(k) ? store.get(k) : null,
    setItem: (k, v) => { store.set(k, String(v)); },
    removeItem: (k) => { store.delete(k); }
  };

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
    localStorage: localStorageMock,
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
  sandbox.window.COC_AI_RETRY_BACKOFF_MS = [0, 0, 0];

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
  const ai = sandbox.window.CoCAI;
  assert(state && state.gameState, 'CoCState loads');
  assert(ai && typeof ai.validateToolArguments === 'function', 'CoCAI exposes tool argument validator');
  assert.strictEqual(typeof state.getStorageStatus, 'function', 'storage status estimator exported');
  assert.strictEqual(typeof state.formatStorageBytes, 'function', 'storage byte formatter exported');

  const validInv = ai.validateToolArguments('update_inventory', '{"items":"钥匙"}');
  assert.strictEqual(validInv.ok, true, 'single inventory item is normalized');
  assert.deepStrictEqual(Array.from(validInv.args.items), ['钥匙'], 'inventory scalar becomes array');
  const invalidEnemy = ai.validateToolArguments('update_enemy', '{"name":"食尸鬼"}');
  assert.strictEqual(invalidEnemy.ok, false, 'missing required hp_change is rejected');
  const invalidJson = ai.validateToolArguments('system_alert', '{bad json');
  assert.strictEqual(invalidJson.ok, false, 'malformed tool JSON is rejected');

  state.gameState.roster.splice(0, state.gameState.roster.length, {
    name: 'A', isActive: true, hp: 10, sanity: 50, attrs: { DEX: 50 }, derived: { hp: 10 }, equipment: {}, skillAllocations: { '侦查': 60 }
  });
  state.gameState.aiSettings.apiKey = 'test-key';
  state.gameState.aiSettings.baseUrl = 'https://example.invalid/chat/completions';
  state.gameState.aiSettings.model = 'test-model';

  let fetchCalls = 0;
  sandbox.fetch = async () => {
    fetchCalls += 1;
    if (fetchCalls === 1) return { ok: false, status: 500, statusText: 'Server Error', text: async () => 'temporary failure' };
    return { ok: true, json: async () => ({ choices: [{ message: { role: 'assistant', content: '连接恢复。' } }] }) };
  };
  state.playerInput.value = '我听门外的动静。';
  await ai.handlePlayerAction();
  assert.strictEqual(fetchCalls, 2, 'AI request retries once after transient HTTP 500');
  assert(state.gameState.chatHistory.some(m => m.content && String(m.content).includes('[AI重试]')), 'retry notice is recorded');
  assert(state.gameState.chatHistory.some(m => m.role === 'assistant' && m.content === '连接恢复。'), 'assistant response is appended after retry success');

  const sysPrompt = state.gameState.chatHistory.find(m => m.role === 'system' && m.isHidden);
  state.gameState.chatHistory.splice(0, state.gameState.chatHistory.length, sysPrompt);
  state.gameState.chatHistory.push({
    role: 'assistant',
    content: '',
    tool_calls: [{ id: 'skill1', type: 'function', function: { name: 'request_skill_check', arguments: '{"target_name":"A","skill_name":"侦查"}' }, isResolved: false }],
    isResolved: false
  });
  assert.strictEqual(state.saveGame('slot1', 'pending-test'), true, 'save succeeds with pending skill check');
  const savedRaw = store.get('coc_save_slot1');
  assert(savedRaw && JSON.parse(savedRaw).version >= 5, 'new saves use current schema version');
  state.gameState.chatHistory.splice(0, state.gameState.chatHistory.length, sysPrompt);
  assert.strictEqual(await state.loadGame('slot1'), true, 'load succeeds for pending skill check save');
  const pending = state.gameState.chatHistory.find(m => m.role === 'assistant' && m.tool_calls && m.tool_calls[0]?.id === 'skill1');
  assert(pending && pending.isResolved === false, 'pending request_skill_check survives save/load');

  const storageStatus = state.getStorageStatus('slot1', 'pending-test');
  assert(storageStatus.currentSaveBytes > 0, 'storage estimator calculates current save size');
  assert(storageStatus.quotaBytes >= 5 * 1024 * 1024, 'storage estimator uses a practical quota baseline');
  store.set('huge_padding', 'x'.repeat(Math.floor(4.85 * 1024 * 1024)));
  const warningStatus = state.getStorageStatus('slot2', 'large-save-warning');
  assert(warningStatus.projectedRatio > 0.9 && warningStatus.warning, 'storage estimator warns near quota');

  console.log('AUDITFIX4 smoke tests passed');
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
