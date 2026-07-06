// ===============================================
// 归属：【QA】 测试用例 / 覆盖验证
// 程序/美术/策划 请勿直接修改测试逻辑
// 修改后放入 roles/qa/ 运行 merge.py 合并
// ===============================================

/** AUDITFIX8 review functional smoke — alias: creator-skill-consumers (skill totals, runtime lookups) */
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
  Math: Object.create(Math),
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
sandbox.ref=(v)=>v;sandbox.watch=(fn,cb)=>{};sandbox.onMounted=(fn)=>{};sandbox.computed=(fn)=>({value:fn()});
  vm.createContext(sandbox);
function run(file) {
  vm.runInContext(fs.readFileSync(path.join(root, file), 'utf8'), sandbox, { filename: file });
}
[
  'js/data/jobs.js','js/data/experiences.js','js/data/items.js','js/data/dev_logs.js',
  'js/data/skills.js','js/coc.js','js/engines/dice.js','js/engines/attributes.js','js/engines/skills.js','js/engines/combat.js','js/engines/healing.js','js/engines/sanity.js','js/engines/wound.js','js/engines/mythos.js','js/engines/environmental.js','js/engines/poison.js','js/core/context_manager.js','js/tools/definitions.js','js/state/core.js','js/state/ui.js','js/state/gameplay.js','js/state/persistence.js','js/state.js',
  'js/tools/handlers/character.js','js/tools/handlers/inventory.js','js/tools/handlers/dice.js','js/tools/handlers/clues.js','js/tools/handlers/map.js','js/tools/handlers/combat.js','js/tools/handlers/npc.js','js/tools/handlers/system.js','js/tools/handlers/index.js','js/ai/network.js',
'js/ai/tool_dispatch.js',
'js/data/ai_prompt_config.js',
'js/components/char_creator.js','js/ai_logic.js'
].forEach(run);

const Engine = sandbox.window.CoCEngine;
const State = sandbox.window.CoCState;
const Creator = sandbox.window.CoCCreator;
const AI = sandbox.window.CoCAI;

// Creator draft allocations are {occ, per}; Engine must not treat those objects as final skill values.
const draftLike = { attrs: { DEX: 50 }, skillAllocations: { '手枪': { occ: 10, per: 5 } }, skills: {} };
assert.strictEqual(Engine.getSkillValue(draftLike, '手枪'), 20, 'draft creator allocation object is ignored by base skill lookup');
assert.strictEqual(Engine.getSkillValue({ attrs: { DEX: 50 }, skillAllocations: { '手枪': 55 }, skills: {} }, '手枪'), 55, 'legacy numeric skillAllocations remain supported');
assert.strictEqual(Engine.getSkillValue({ attrs: { DEX: 50 }, skillAllocations: { '手枪': 15 }, skills: { '手枪': 55 } }, '手枪'), 55, 'final skills win over lower numeric deltas');

Object.assign(State.draftChar.attrs, { STR: 50, CON: 50, SIZ: 50, DEX: 50, APP: 50, INT: 50, POW: 50, EDU: 50, LUCK: 50 });
State.draftChar.name = '技能复核员';
State.draftChar.job = { name: '测试职业', classSkillsString: '射击，侦查', calcPoints: () => 50 };
State.draftChar.skillAllocations = { '手枪': { occ: 40, per: 39 }, '侦查': { occ: 10, per: 61 } };
State.draftChar.derived = Engine.calculateDerived(State.draftChar.attrs);
assert.strictEqual(Creator.getSkillTotal('手枪'), 99, 'creator getSkillTotal returns numeric base+occ+per for 手枪');
assert(!String(Creator.getSkillTotal('手枪')).includes('[object Object]'), 'creator total is not string-corrupted');
Creator.saveDraftCharacter();
const savedChar = State.gameState.roster.find(c => c.name === '技能复核员');
assert(savedChar, 'creator saved the character');
assert.strictEqual(savedChar.skills['手枪'], 99, 'saved character stores numeric final skill value');
assert.strictEqual(typeof savedChar.skills['手枪'], 'number', 'saved skill value type is number');
assert(!('射击' in savedChar.skills), 'hidden stale parent 射击 is not saved as a visible skill');

// Runtime dice paths should read final skills, not stale/missing skillAllocations.
State.gameState.roster.splice(0, State.gameState.roster.length, { name: '检定员', isActive: true, attrs: { DEX: 60, EDU: 50 }, skills: { '侦查': 70, '斗殴': 65 }, skillAllocations: {}, derived: { hp: 10, db: '0' }, hp: 10, sanity: 50 });
let seq = [0.69];
sandbox.Math.random = () => seq.shift() ?? 0.5;
const group = State.groupRoll([], '侦查', 'review');
assert.strictEqual(group.groupResults[0].skillVal, 70, 'groupRoll uses character final skills');
assert.strictEqual(group.groupResults[0].level, '成功', 'groupRoll result reflects final skill value');

seq = [0.49, 0.99, 0.5];
sandbox.Math.random = () => seq.shift() ?? 0.5;
const opposedResult = AI.dispatchToolHandler('opposed_roll', { label: '力量较量', char_name: '检定员', char_skill: '斗殴', opponent_name: '食尸鬼', opponent_value: 10 });
assert(String(opposedResult).includes('检定员'), 'opposed_roll uses final skill value high enough to win expected check');

// Growth should increase final skills and remain visible to Engine.getSkillValue.
State.gameState.roster[0].skillsUsedThisSession = [{ name: '侦查', currentValue: 70 }];
seq = [0.90, 0.40]; // d100=91, d10=5
sandbox.Math.random = () => seq.shift() ?? 0.5;
const growth = State.rollImprovement('检定员', '侦查');
assert.strictEqual(growth.oldVal, 70, 'growth starts from final skill value');
assert.strictEqual(growth.newVal, 75, 'growth reports increased final value');
assert.strictEqual(State.gameState.roster[0].skills['侦查'], 75, 'growth writes back to final skills');
assert.strictEqual(Engine.getSkillValue(State.gameState.roster[0], '侦查'), 75, 'Engine reads grown skill value');

console.log('AUDITFIX8 review functional smoke tests passed');
