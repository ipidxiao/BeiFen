// ===============================================
// 归属：【QA】 测试用例 / 覆盖验证
// 程序/美术/策划 请勿直接修改测试逻辑
// 修改后放入 roles/qa/ 运行 merge.py 合并
// ===============================================

/** AUDITFIX6 smoke — alias: combat-map-dice (combat flow, map tools, dice engines) */
const fs = require('fs');
const vm = require('vm');
const path = require('path');
const assert = require('assert');

(async () => {
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
  sandbox.window.COC_AI_RETRY_BACKOFF_MS = [0, 0, 0];
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
run('js/tools/handlers/system.js');
run('js/tools/handlers/index.js');
  run('js/ai/network.js');
run('js/ai/tool_dispatch.js');
run('js/data/ai_prompt_config.js');
run('js/ai_logic.js');

  const state = sandbox.window.CoCState;
  const ai = sandbox.window.CoCAI;
  const defs = sandbox.window.CoCToolDefinitions;
  assert(state && state.gameState, 'CoCState loads');
  assert(ai && typeof ai.triggerAI === 'function', 'CoCAI triggerAI is available');
  assert(defs && typeof defs.buildTools === 'function', 'CoCToolDefinitions loads');

  // API-facing schemas should actively discourage undeclared hidden parameters.
  const apiTools = defs.buildTools();
  function assertObjectSchemasAreStrict(schema, pathLabel) {
    if (!schema || typeof schema !== 'object') return;
    if (schema.type === 'object') {
      assert.strictEqual(schema.additionalProperties, false, `${pathLabel} rejects additional properties`);
      Object.entries(schema.properties || {}).forEach(([key, child]) => assertObjectSchemasAreStrict(child, `${pathLabel}.${key}`));
    }
    if (schema.type === 'array') assertObjectSchemasAreStrict(schema.items, `${pathLabel}[]`);
  }
  apiTools.forEach(t => assertObjectSchemasAreStrict(t.function.parameters, t.function.name));
  assert(!JSON.stringify(apiTools).includes('singleAsArray'), 'API schema still hides validator-only fields');

  const hidden = ai.validateToolArguments('update_inventory', '{"items":["钥匙"],"hidden_state_write":true}');
  assert.strictEqual(hidden.ok, false, 'undeclared top-level tool args are rejected');
  assert(String(hidden.error).includes('hidden_state_write'), 'unknown arg name is surfaced in validation error');
  const nestedHidden = ai.validateToolArguments('create_map', '{"title":"宅邸","rooms":[{"id":"r1","name":"大厅","x":1,"y":2,"secret":true}]}');
  assert.strictEqual(nestedHidden.ok, false, 'undeclared nested tool args are rejected');

  // Static guard: every args.<field> read by a top-level handler must exist in the catalog.
  const handlerDir = path.join(__dirname, '..', 'js/tools/handlers');
  const handlerSource = fs.readdirSync(handlerDir)
    .filter(f => f.endsWith('.js') && f !== 'index.js')
    .map(f => fs.readFileSync(path.join(handlerDir, f), 'utf8'))
    .join('\n');
  const handlerStarts = [...handlerSource.matchAll(/\n        ([a-z_][a-z0-9_]*): \(args\) => \{/g)];
  const hiddenReads = [];
  handlerStarts.forEach((match, idx) => {
    const name = match[1];
    const start = match.index;
    const end = idx + 1 < handlerStarts.length ? handlerStarts[idx + 1].index : handlerSource.indexOf('\n    };', start);
    const segment = handlerSource.slice(start, end > start ? end : undefined);
    const used = [...new Set([...segment.matchAll(/\bargs\.([A-Za-z_][A-Za-z0-9_]*)/g)].map(m => m[1]))];
    const schema = defs.getSchema(name);
    if (!schema) return;
    const allowed = new Set(Object.keys(schema.properties || {}));
    used.forEach(prop => {
      if (!allowed.has(prop)) hiddenReads.push(`${name}.${prop}`);
    });
  });
  assert.deepStrictEqual(hiddenReads, [], 'no top-level handler reads catalog-undeclared args');

  function resetRoster() {
    state.gameState.roster.splice(0, state.gameState.roster.length,
      { name: 'A', isActive: true, hp: 10, sanity: 50, attrs: { DEX: 60, CON: 50, SIZ: 50, POW: 50 }, derived: { hp: 10, maxHp: 10, db: '0' }, equipment: { weapon: '左轮手枪 [弹药:2]' }, skillAllocations: { '侦查': 60, '手枪': 90, '斗殴': 70 } },
      { name: 'B', isActive: true, hp: 12, sanity: 55, attrs: { DEX: 40, CON: 60, SIZ: 60, POW: 55 }, derived: { hp: 12, maxHp: 12, db: '0' }, equipment: {}, skillAllocations: { '侦查': 55 } }
    );
  }
  resetRoster();
  state.gameState.aiSettings.apiKey = 'test-key';
  state.gameState.aiSettings.baseUrl = 'https://example.invalid/chat/completions';
  state.gameState.aiSettings.model = 'test-model';

  async function runToolCall(toolName, args, opts = {}) {
    let fetchCalls = 0;
    const toolId = `${toolName}_${Date.now()}_${Math.floor(Math.random() * 100000)}`;
    sandbox.fetch = async () => {
      fetchCalls += 1;
      if (fetchCalls === 1) {
        return {
          ok: true,
          json: async () => ({
            choices: [{
              message: {
                role: 'assistant',
                content: '',
                tool_calls: [{ id: toolId, type: 'function', function: { name: toolName, arguments: JSON.stringify(args || {}) } }]
              }
            }]
          })
        };
      }
      return { ok: true, json: async () => ({ choices: [{ message: { role: 'assistant', content: `final:${toolName}` } }] }) };
    };
    state.gameState.chatHistory.push({ role: 'user', content: `run ${toolName}` });
    await ai.triggerAI();
    if (!opts.needsUserAction) assert(fetchCalls >= 2, `${toolName} returned a tool result and continued narration`);
    if (opts.needsUserAction) assert.strictEqual(fetchCalls, 1, `${toolName} pauses for user action`);
    return { fetchCalls, toolId };
  }

  await runToolCall('update_character_status', { target_name: 'A', hp_change: -3, san_change: -2 });
  assert.strictEqual(state.gameState.roster.find(c => c.name === 'A').hp, 7, 'update_character_status mutates HP');
  assert.strictEqual(state.gameState.roster.find(c => c.name === 'A').sanity, 48, 'update_character_status mutates SAN');

  await runToolCall('update_inventory', { items: ['黄铜钥匙'] });
  assert(state.gameState.inventory.includes('黄铜钥匙'), 'update_inventory adds inventory');
  await runToolCall('consume_inventory_items', { items: ['黄铜钥匙'] });
  assert(!state.gameState.inventory.includes('黄铜钥匙'), 'consume_inventory_items removes inventory');

  await runToolCall('system_alert', { message: '危险逼近' });
  assert(state.gameState.chatHistory.some(m => String(m.content || '').includes('危险逼近')), 'system_alert writes a local alert');

  const diceBefore = state.gameState.diceHistory.length;
  await runToolCall('roll_dice', { notation: '1d6', label: '门后的声响', context: '测试' });
  assert(state.gameState.diceHistory.length > diceBefore, 'roll_dice records dice history');
  await runToolCall('group_roll', { char_names: ['A', 'B'], skill_name: '侦查', context: '集体搜查' });
  assert(state.gameState.diceHistory[0].isGroup, 'group_roll records group result');
  await runToolCall('opposed_roll', { char_name: 'A', char_skill: '斗殴', opponent_name: '守卫', opponent_value: 40, label: '挣脱' });
  assert(state.gameState.chatHistory.some(m => String(m.content || '').includes('对抗·挣脱')), 'opposed_roll writes opposed-roll result');

  await runToolCall('add_clue', { id: 'c1', title: '血迹', content: '门把手上有血迹', type: 'physical' });
  await runToolCall('add_clue', { id: 'c2', title: '脚印', content: '血迹旁有泥脚印', type: 'physical' });
  assert(state.gameState.clueBoard.clues.some(c => c.id === 'c1'), 'add_clue creates clue');
  await runToolCall('link_clues', { from_id: 'c1', to_id: 'c2', note: '同一方向' });
  assert(state.gameState.clueBoard.links.some(l => l.from === 'c1' && l.to === 'c2'), 'link_clues creates link');
  await runToolCall('mark_clue_status', { id: 'c1', status: 'key', note: '关键证据' });
  assert.strictEqual(state.gameState.clueBoard.clues.find(c => c.id === 'c1').status, 'key', 'mark_clue_status updates clue');

  await runToolCall('create_map', { title: '老宅', rooms: [{ id: 'r1', name: '大厅', x: 1, y: 1, connections: ['r2'] }, { id: 'r2', name: '书房', x: 2, y: 1 }] });
  assert.strictEqual(state.gameState.sceneMap.title, '老宅', 'create_map sets title');
  await runToolCall('update_room', { room_id: 'r2', status: 'dangerous', note: '有低语' });
  assert.strictEqual(state.gameState.sceneMap.rooms.find(r => r.id === 'r2').status, 'dangerous', 'update_room mutates room status');
  await runToolCall('set_position', { room_id: 'r2' });
  assert.strictEqual(state.gameState.currentLocation, '书房', 'set_position mutates current location');

  await runToolCall('start_combat', { enemies: [{ name: 'Ghoul', hp: 12, armor: 2 }, { name: 'Byakhee', hp: 20, armor: 2 }], location: '书房', notes: '突袭' });
  assert(state.gameState.combat.active, 'start_combat activates combat');
  const ghoulBefore = state.gameState.combat.enemies.find(e => e.name === 'Ghoul').hp;
  await runToolCall('update_enemy', { name: 'Ghoul', hp_change: -3, note: '擦伤' });
  assert.strictEqual(state.gameState.combat.enemies.find(e => e.name === 'Ghoul').hp, ghoulBefore - 1, 'update_enemy applies armor exactly once for raw damage');
  const bHpBefore = state.gameState.roster.find(c => c.name === 'B').hp;
  await runToolCall('enemy_attack', { enemy_name: 'Ghoul', target_name: 'B', damage: 2, description: '爪击' });
  assert.strictEqual(state.gameState.roster.find(c => c.name === 'B').hp, bHpBefore - 2, 'enemy_attack damages investigator');
  const byakheeBefore = state.gameState.combat.enemies.find(e => e.name === 'Byakhee').hp;
  await runToolCall('fire_weapon', { shooter_name: 'A', enemy_name: 'Byakhee', damage: '1D6' });
  assert.strictEqual(state.gameState.roster.find(c => c.name === 'A').equipment.weapon, '左轮手枪 [弹药:1]', 'fire_weapon consumes one bullet');
  assert.strictEqual(state.gameState.combat.enemies.find(e => e.name === 'Byakhee').hp, byakheeBefore - 2, 'fire_weapon applies already-armored combat damage without double armor');
  await runToolCall('end_combat', { outcome: 'victory', notes: '敌人溃散' });
  assert.strictEqual(state.gameState.combat.active, false, 'end_combat deactivates combat');

  await runToolCall('register_npc', { name: '阿米莉亚', description: '图书管理员', relation: '线索来源', status: 'alive' });
  assert(state.gameState.npcRegistry.some(n => n.name === '阿米莉亚'), 'register_npc stores NPC');
  await runToolCall('update_npc_status', { name: '阿米莉亚', status: 'missing', note: '夜里失踪' });
  assert.strictEqual(state.gameState.npcRegistry.find(n => n.name === '阿米莉亚').status, 'missing', 'update_npc_status mutates NPC status');

  await runToolCall('record_engine_log', { version: 'AUDITFIX6-test', title: '测试记录', changes: ['端到端工具测试'] });
  assert(sandbox.window.DevLogs.some(log => log.version === 'AUDITFIX6-test'), 'record_engine_log mutates DevLogs');

  const skillRun = await runToolCall('request_skill_check', { target_name: 'A', skill_name: '侦查' }, { needsUserAction: true });
  const pendingMsg = [...state.gameState.chatHistory].reverse().find(m => m.tool_calls && m.tool_calls.some(t => t.id === skillRun.toolId));
  assert(pendingMsg && pendingMsg.tool_calls[0].isResolved === false, 'request_skill_check leaves a pending tool call');
  let finalFetchCalls = 0;
  sandbox.fetch = async () => {
    finalFetchCalls += 1;
    return { ok: true, json: async () => ({ choices: [{ message: { role: 'assistant', content: '检定后继续叙事。' } }] }) };
  };
  await ai.executeSkillCheck(pendingMsg.tool_calls[0], pendingMsg, '侦查', 'A');
  assert.strictEqual(pendingMsg.tool_calls[0].isResolved, true, 'executeSkillCheck resolves pending tool call');
  assert(finalFetchCalls >= 1, 'executeSkillCheck continues narration after resolving pending check');
  assert(state.gameState.journalLog.some(j => j.type === 'skill_check' && j.charName === 'A'), 'executeSkillCheck records skill journal');

  console.log('AUDITFIX6 smoke tests passed');
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
