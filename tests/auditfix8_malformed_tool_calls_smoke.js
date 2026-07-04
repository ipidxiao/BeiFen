// ===============================================
// 归属：【QA】 测试用例 / 覆盖验证
// 程序/美术/策划 请勿直接修改测试逻辑
// 修改后放入 roles/qa/ 运行 merge.py 合并
// ===============================================

/** AUDITFIX8 malformed tool_calls smoke — alias: bad-tool-call-recovery (sanitize + rollback) */
const fs = require('fs');
const vm = require('vm');
const path = require('path');
const assert = require('assert');

(async () => {
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
  sandbox.window.COC_AI_RETRY_BACKOFF_MS = [0, 0, 0];
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
  state.gameState.aiSettings.apiKey = 'test-key';
  state.gameState.aiSettings.baseUrl = 'https://example.invalid/chat/completions';
  state.gameState.aiSettings.model = 'test-model';

  async function runWithMessages(messages) {
    const sentBodies = [];
    let fetchCalls = 0;
    sandbox.fetch = async (_url, opts) => {
      fetchCalls += 1;
      sentBodies.push(JSON.parse(opts.body));
      const message = messages.shift() || { role: 'assistant', content: `final-${fetchCalls}` };
      return { ok: true, json: async () => ({ choices: [{ message }] }) };
    };
    state.gameState.chatHistory.splice(0, state.gameState.chatHistory.length, { role: 'user', content: 'malformed tool_calls regression' });
    await ai.triggerAI();
    return { fetchCalls, sentBodies, history: state.gameState.chatHistory };
  }

  let result = await runWithMessages([{ role: 'assistant', content: 'bad object tool_calls', tool_calls: { id: 'not-array' } }]);
  assert.strictEqual(result.fetchCalls, 1, 'non-array tool_calls does not trigger a follow-up AI request');
  assert(result.history.some(m => m.isLocalOnly && String(m.content || '').includes('tool_calls 不是数组')), 'non-array tool_calls is surfaced locally');
  assert(!result.history.some(m => m.role === 'tool'), 'non-array tool_calls does not create orphan tool messages');

  result = await runWithMessages([{ role: 'assistant', content: '', tool_calls: [{ id: 'bad_shape_1', type: 'function' }] }]);
  assert.strictEqual(result.fetchCalls, 1, 'malformed tool shape is rejected locally without creating an orphan tool response');
  assert(result.history.some(m => m.isLocalOnly && String(m.content || '').includes('缺少 function')), 'malformed tool shape is surfaced locally');
  assert(!result.history.some(m => m.role === 'tool' && m.tool_call_id === 'bad_shape_1'), 'malformed tool shape does not create an orphan tool message');

  result = await runWithMessages([{ role: 'assistant', content: '', tool_calls: [{ type: 'function', function: { name: 'system_alert', arguments: '{"message":"should not run"}' } }] }]);
  assert.strictEqual(result.fetchCalls, 1, 'missing tool_call_id is rejected locally without follow-up');
  assert(result.history.some(m => m.isLocalOnly && String(m.content || '').includes('缺少有效 tool_call_id')), 'missing id is surfaced locally');
  assert(!result.history.some(m => String(m.content || '').includes('should not run')), 'missing id does not execute side-effectful handler');

  result = await runWithMessages([
    { role: 'assistant', content: '', tool_calls: [{ id: 'bad_json_1', type: 'function', function: { name: 'system_alert', arguments: '{bad json' } }] },
    { role: 'assistant', content: 'after bad json' }
  ]);
  assert.strictEqual(result.fetchCalls, 2, 'bad JSON tool args returns a tool error and continues narration');
  assert(result.history.some(m => m.role === 'tool' && m.tool_call_id === 'bad_json_1' && String(m.content || '').includes('JSON解析失败')), 'bad JSON creates a matching tool error');
  const secondPayload = result.sentBodies[1];
  assert(!JSON.stringify(secondPayload.messages).includes('undefined'), 'follow-up payload does not leak undefined malformed tool fields');

  result = await runWithMessages([
    { role: 'assistant', content: '', tool_calls: [{ id: 'unknown_1', type: 'function', function: { name: 'not_a_real_tool', arguments: '{}' } }] },
    { role: 'assistant', content: 'after unknown tool' }
  ]);
  assert.strictEqual(result.fetchCalls, 2, 'unknown tool with valid id returns a tool error and continues narration');
  assert(result.history.some(m => m.role === 'tool' && m.tool_call_id === 'unknown_1' && String(m.content || '').includes('未知工具')), 'unknown tool creates a matching tool error');

  console.log('AUDITFIX8 malformed tool_calls smoke tests passed');
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
