// ===============================================
// 归属：【QA】 测试用例 / 覆盖验证
// 程序/美术/策划 请勿直接修改测试逻辑
// 修改后放入 roles/qa/ 运行 merge.py 合并
// ===============================================

/** AUDITFIX8 secondary skill visibility smoke — alias: skill-ui-filter (hide unnamed sub-skills) */
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
sandbox.ref=(v)=>v;sandbox.watch=(fn,cb)=>{};sandbox.onMounted=(fn)=>{};sandbox.computed=(fn)=>({value:fn()});
  vm.createContext(sandbox);
function run(file) {
  vm.runInContext(fs.readFileSync(path.join(root, file), 'utf8'), sandbox, { filename: file });
}

[
  'js/data/jobs.js','js/data/experiences.js','js/data/items.js','js/data/dev_logs.js',
  'js/data/skills.js','js/coc.js','js/engines/dice.js','js/engines/attributes.js','js/engines/skills.js','js/engines/combat.js','js/engines/healing.js','js/engines/sanity.js','js/engines/wound.js','js/engines/mythos.js','js/engines/environmental.js','js/engines/poison.js','js/core/context_manager.js','js/state/core.js','js/state/ui.js','js/state/gameplay.js','js/state/persistence.js','js/state.js',
  'js/components/char_creator.js','js/components/story_char.js'
].forEach(run);

const engine = sandbox.window.CoCEngine;
const state = sandbox.window.CoCState;
const creator = sandbox.window.CoCCreator;

assert.strictEqual(engine.isVisibleSkillName('射击'), false, 'generic parent 射击 is hidden until a specialization is named');
assert.strictEqual(engine.isVisibleSkillName('驾驶'), false, 'generic parent 驾驶 is hidden until a specialization is named');
assert.strictEqual(engine.isVisibleSkillName('技艺'), false, 'generic parent 技艺 is hidden until a specialization is named');
assert.strictEqual(engine.isVisibleSkillName('外语'), false, 'generic parent 外语 is hidden until a specialization is named');
assert.strictEqual(engine.isVisibleSkillName('科学'), false, 'generic parent 科学 is hidden until a specialization is named');
assert.strictEqual(engine.isVisibleSkillName('生存'), false, 'generic parent 生存 is hidden until a specialization is named');
assert.strictEqual(engine.isVisibleSkillName('射击：'), false, 'blank colon specialization is hidden');
assert.strictEqual(engine.isVisibleSkillName('格斗①'), false, 'numbered Fighting placeholder is hidden');
assert.strictEqual(engine.isVisibleSkillName('其他格斗'), false, 'generic other Fighting placeholder is hidden');

assert.strictEqual(engine.isVisibleSkillName('斗殴'), true, 'named Fighting specialization 斗殴 remains visible');
assert.strictEqual(engine.isVisibleSkillName('手枪'), true, 'named Firearms specialization 手枪 remains visible');
assert.strictEqual(engine.isVisibleSkillName('汽车驾驶'), true, 'named Drive specialization 汽车驾驶 remains visible');
assert.strictEqual(engine.isVisibleSkillName('射击：步枪'), true, 'custom named specialization 射击：步枪 remains visible');
assert.strictEqual(engine.isVisibleSkillName('生存：森林'), true, 'custom named specialization 生存：森林 remains visible');
assert.strictEqual(engine.isVisibleSkillName('拳击'), true, 'named Fighting branch 拳击 remains visible when explicitly added');

assert.strictEqual(engine.isClassSkillName('手枪', '射击'), true, 'parent class skill 射击 unlocks child 手枪');
assert.strictEqual(engine.isClassSkillName('汽车驾驶', '驾驶'), true, 'parent class skill 驾驶 unlocks 汽车驾驶 via alias 驾驶：汽车');
assert.strictEqual(engine.isClassSkillName('斗殴', '格斗'), true, 'parent label 格斗 unlocks named specialization 斗殴');
assert.strictEqual(engine.isClassSkillName('生存：森林', '生存'), true, 'parent class skill 生存 unlocks named custom specialization');
assert.strictEqual(engine.isClassSkillName('拳击', '格斗'), true, 'alias parent label 格斗 unlocks named branch 拳击');

Object.assign(state.draftChar.attrs, { STR: 50, CON: 50, SIZ: 50, DEX: 50, APP: 50, INT: 50, POW: 50, EDU: 50, LUCK: 50 });
state.draftChar.job = { name: '测试职业', classSkillsString: '射击，驾驶，格斗，生存', calcPoints: () => 200 };
state.draftChar.skillAllocations = {
  '射击': { occ: 50, per: 0 },
  '手枪': { occ: 0, per: 0 },
  '射击：步枪': { occ: 0, per: 0 },
  '生存：森林': { occ: 0, per: 0 },
  '拳击': { occ: 0, per: 0 }
};

const visible = creator.dynamicSkillNames.value;
assert(!visible.includes('射击'), 'creator list hides generic 射击 even if stale allocation exists');
assert(!visible.includes('驾驶'), 'creator list hides generic 驾驶');
assert(visible.includes('手枪'), 'creator list keeps concrete 手枪');
assert(visible.includes('汽车驾驶'), 'creator list keeps concrete 汽车驾驶');
assert(visible.includes('斗殴'), 'creator list keeps concrete 斗殴');
assert(visible.includes('射击：步枪'), 'creator list includes named custom specialization from allocations');
assert(visible.includes('生存：森林'), 'creator list includes named custom survival specialization from allocations');
assert(visible.includes('拳击'), 'creator list includes explicitly named Fighting branch from allocations');
assert.strictEqual(creator.pointStats.value.occSpent, 0, 'hidden stale generic parent allocation does not consume visible points');
assert.strictEqual(creator.isClassSkill('手枪'), true, 'creator class helper enables handgun for 射击 occupation skill');
assert.strictEqual(creator.isClassSkill('汽车驾驶'), true, 'creator class helper enables car driving for 驾驶 occupation skill');
assert.strictEqual(creator.isClassSkill('生存：森林'), true, 'creator class helper enables named survival specialization');
assert.strictEqual(creator.isClassSkill('拳击'), true, 'creator class helper enables named Fighting branch for 格斗 occupation skill');

const char = { attrs: { DEX: 50 }, skillAllocations: { '斗殴': 60, '手枪': 55, '生存：森林': 45 }, skills: { '射击': 70, '手枪': 55 } };
assert.strictEqual(engine.getSkillValue(char, '格斗：斗殴'), 60, 'visible filtering does not break 格斗：斗殴 alias resolution');
assert.strictEqual(engine.getSkillValue(char, '射击：手枪'), 55, 'visible filtering does not break 射击：手枪 alias resolution');
assert.strictEqual(engine.getSkillValue(char, '生存：森林'), 45, 'visible filtering does not break named custom survival skill');

const storyCharSource = fs.readFileSync(path.join(root, 'js/components/story_char.mjs'), 'utf8');
const storyCharBundle = fs.readFileSync(path.join(root, 'js/components/story_char.js'), 'utf8');
assert(!/技能摘要/.test(storyCharSource), 'story character source does not render skill summary');
assert(!/技能摘要/.test(storyCharBundle), 'story character bundle does not render skill summary');
assert(!/notableSkills/.test(storyCharSource), 'story character source has no notable skill helper');
assert(!/notableSkills/.test(storyCharBundle), 'story character bundle has no notable skill helper');

console.log('AUDITFIX8 secondary skill visibility smoke tests passed');
