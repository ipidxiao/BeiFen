// ===============================================
// 归属：【QA】 测试用例 / 覆盖验证
// 程序/美术/策划 请勿直接修改测试逻辑
// 修改后放入 roles/qa/ 运行 merge.py 合并
// ===============================================

/** Coverage gap smoke tests */

/**
 * @role    测试/QA (Quality Assurance)
 * @owner   测试用例 / 覆盖验证
 * @caution 程序合并时通过 roles/qa/ 目录接收
 */
const fs = require('fs');
const vm = require('vm');
const path = require('path');
const assert = require('assert');

const store = new Map();
const sandbox = {
  console, setTimeout, clearTimeout, Date, Math, JSON, Promise,
  window: {},
  document: { getElementById: () => null, createElement: () => ({}), body: { appendChild() {}, removeChild() {} } },
  localStorage: { getItem: k => store.has(k) ? store.get(k) : null, setItem: (k,v) => store.set(k,String(v)), removeItem: k => store.delete(k) },
  Blob: function(parts, opts) { return { parts, opts, size: Buffer.byteLength(String(parts[0]||'')) }; },
  URL: { createObjectURL: () => 'blob:', revokeObjectURL() {} }
};
sandbox.window = sandbox;
sandbox.window.Vue = { reactive: x => x, ref: v => ({ value: v }), computed: fn => ({ get value() { return typeof fn==='function'?fn():fn.get(); } }), nextTick: fn => (fn?fn():Promise.resolve()), watch: () => {} };
vm.createContext(sandbox);

function run(file) {
  const code = fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
  vm.runInContext(code, sandbox, { filename: file });
}

run('js/data/utils.js');
run('js/data/skills.js');
run('js/data/jobs.js');
run('js/data/injury_tables.js');
run('js/data/mythos_tomes.js');
run('js/data/spells.js');
run('js/coc.js');
// P0-2: coc.js split into engine modules — load them onto window.CoCEngine
['dice','attributes','skills','combat','healing','sanity','wound','mythos','environmental','poison'].forEach(f => run('js/engines/' + f + '.js'));
const Engine = sandbox.window.CoCEngine;
assert(Engine, 'CoCEngine loaded');

// T1
(function() {
  var char = { name: 'T', attrs: { CON: 50 }, derived: { hp: 5, maxHp: 12 }, status: { hasMajorWound: false } };
  assert.strictEqual(Engine.HealingEngine.applyHealing(char, { type: 'weapon' }).success, false);
  assert.strictEqual(Engine.HealingEngine.applyHealing(char, { type: 'consumable', target: 'HP', heal: '1D3' }).success, true);
  var char2 = { name: 'F', attrs: { CON: 50 }, derived: { hp: 12, maxHp: 12 }, status: {} };
  Engine.HealingEngine.applyHealing(char2, { type: 'consumable', target: 'HP', heal: '10' });
  assert.strictEqual(char2.derived.hp, 12);
  console.log('T1 HealingEngine: OK');
})();

// T2
(function() {
  var b = { STR: 50, CON: 50, SIZ: 50, DEX: 50, APP: 50, INT: 50, POW: 50, EDU: 50, LUCK: 50 };
  assert.strictEqual(Engine.applyAgeModifiers(b, 14).STR, 50);
  assert.strictEqual(Engine.applyAgeModifiers(b, 15).STR, 45);
  assert.strictEqual(Engine.applyAgeModifiers(b, 15).LUCK, 50);
  assert.strictEqual(Engine.applyAgeModifiers(b, 40).EDU, 55);
  assert.strictEqual(Engine.applyAgeModifiers(b, 70).STR, 15);
  console.log('T2 applyAgeModifiers: OK');
})();

// T3
(function() {
  var ch = { name: 'T', skills: { '侦查': 60 } };
  assert.strictEqual(Engine.checkSkill('侦查', ch, 'normal').targetValue, 60);
  assert.strictEqual(Engine.checkSkill('侦查', ch, 'hard').targetValue, 30);
  assert.strictEqual(Engine.checkSkill('侦查', ch, 'extreme').targetValue, 12);
  console.log('T3 checkSkill: OK');
})();

// T4
(function() {
  var e = { name: 'G', isEnemy: true, skills: { '斗殴': 45 } };
  assert.strictEqual(Engine.getSkillValue(e, '斗殴'), 45);
  assert.strictEqual(Engine.getSkillValue(e, '侦查'), 25);
  console.log('T4 enemy path: OK');
})();

// T5
(function() {
  run('js/core/context_manager.js');
  run('js/tools/definitions.js');
  run('js/data/logger.js');
  run('js/state/core.js');
  run('js/state/ui.js');
  run('js/state/gameplay.js');
  run('js/state/persistence.js');
  run('js/state.js');
  run('js/ai/network.js');
  run('js/ai/tool_dispatch.js');
  run('js/tools/handlers/character.js');
  run('js/tools/handlers/inventory.js');
  run('js/tools/handlers/dice.js');
  run('js/tools/handlers/clues.js');
  run('js/tools/handlers/map.js');
  run('js/tools/handlers/combat.js');
  run('js/tools/handlers/mythos.js');
  run('js/tools/handlers/npc.js');
  run('js/tools/handlers/system.js');
  run('js/tools/handlers/index.js');
  run('js/data/ai_prompt_config.js');
  run('js/ai_logic.js');
  var ai = sandbox.window.CoCAI;
  assert(ai, 'CoCAI loaded');
  assert.strictEqual(ai.validateToolArguments('update_inventory', '{"items":"key"}').ok, true);
  assert.strictEqual(ai.validateToolArguments('update_character_status', '{}').ok, false);
  assert.strictEqual(ai.validateToolArguments('system_alert', '{"message":"hi"}').ok, true);
  console.log('T5 validateToolArguments: OK');
})();

// T6
(function() {
  assert(Engine.MajorWoundEngine, 'MajorWoundEngine');
  assert(Engine.SanityEngine, 'SanityEngine');
  assert(Engine.MythosEngine, 'MythosEngine');
  assert(typeof Engine.spendLuck === 'function', 'spendLuck');
  var ch = { name: 'T', attrs: { LUCK: 50 } };
  assert.strictEqual(Engine.spendLuck(ch, 10).success, true);
  assert.strictEqual(ch.attrs.LUCK, 40);
  console.log('T6 Engines: OK');
})();

console.log('\nCOVERAGE GAP: ALL PASSED');
