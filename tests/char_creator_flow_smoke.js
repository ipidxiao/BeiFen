// char_creator flow smoke — preset commit, radar roll, skill hold-repeat, scenario resume
const fs = require('fs');
const vm = require('vm');
const path = require('path');
const assert = require('assert');

const root = path.join(__dirname, '..');
const store = new Map();
const radarCanvas = { id: 'radarChart' };

const sandbox = {
  console,
  setTimeout: (fn) => { sandbox.__timeoutFn = fn; return 1; },
  setInterval: (fn) => { sandbox.__intervalFn = fn; return 2; },
  clearTimeout: () => { sandbox.__timeoutFn = null; },
  clearInterval: () => { sandbox.__intervalFn = null; },
  Date,
  Math: Object.create(Math),
  JSON,
  Promise,
  Buffer,
  __chartCreations: 0,
  __chartUpdates: 0,
  __saved: [],
  __scenarioStarted: null,
  window: {},
  document: {
    getElementById: (id) => (id === 'radarChart' ? radarCanvas : null),
    createElement: () => ({ click() {}, style: {}, set href(v) {}, set download(v) {} }),
    body: { appendChild() {}, removeChild() {} },
    addEventListener() {}
  },
  localStorage: {
    get length() { return store.size; },
    key: (i) => Array.from(store.keys())[i] ?? null,
    getItem: (k) => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => { store.set(k, String(v)); },
    removeItem: (k) => { store.delete(k); }
  },
  Chart: function Chart(ctx, config) {
    sandbox.__chartCreations += 1;
    this.canvas = ctx;
    this.data = config.data;
    this.update = () => { sandbox.__chartUpdates += 1; };
    this.destroy = () => {};
  }
};
sandbox.window = sandbox;
sandbox.window.Vue = {
  reactive: (x) => x,
  ref: (v) => ({ value: v }),
  computed: (fnOrObj) => ({
    get value() { return typeof fnOrObj === 'function' ? fnOrObj() : fnOrObj.get(); },
    set value(v) { if (fnOrObj.set) fnOrObj.set(v); }
  }),
  nextTick: (fn) => (fn ? Promise.resolve().then(fn) : Promise.resolve()),
  watch: () => {}
};
vm.createContext(sandbox);

function run(file) {
  vm.runInContext(fs.readFileSync(path.join(root, file), 'utf8'), sandbox, { filename: file });
}

[
  'js/data/jobs.js', 'js/data/experiences.js', 'js/data/items.js', 'js/data/dev_logs.js',
  'js/data/skills.js', 'js/coc.js', 'js/engines/dice.js', 'js/engines/attributes.js',
  'js/engines/skills.js', 'js/engines/combat.js', 'js/engines/healing.js', 'js/engines/sanity.js',
  'js/engines/wound.js', 'js/engines/mythos.js', 'js/engines/environmental.js', 'js/engines/poison.js',
  'js/core/context_manager.js', 'js/tools/definitions.js', 'js/state/core.js', 'js/state/ui.js',
  'js/state/gameplay.js', 'js/state/persistence.js', 'js/state.js'
].forEach(run);

const State = sandbox.window.CoCState;
let switchedTo = '';
State.switchScreen = (s) => {
  switchedTo = s;
  State.gameState.currentScreen = s;
};

run('js/components/char_creator.js');
run('js/components/story_char.js');

const Creator = sandbox.window.CoCCreator;
const preset = Creator.CHARACTER_PRESETS[0];
const acrobatJob = sandbox.window.CoCEngine.Occupations.find((job) => job.name === '杂技演员');

(async () => {
  assert(preset && preset.name, 'preset fixture exists');
  assert(acrobatJob, 'acrobat occupation exists');

  // BUG-004: the dice-roll path must create the radar chart after Vue nextTick.
  Creator.rollAllStats();
  await Promise.resolve();
  await Promise.resolve();
  assert.strictEqual(sandbox.__chartCreations, 1, 'rollAllStats creates radar chart');
  assert.deepStrictEqual(
    sandbox.window.CoCState.draftChar.derived,
    sandbox.window.CoCEngine.calculateDerived(sandbox.window.CoCState.draftChar.attrs, sandbox.window.CoCState.draftChar.age),
    'rollAllStats recalculates derived stats'
  );

  // BUG-005: startAutoAdd must add immediately and again through the hold timer.
  Object.assign(State.draftChar.attrs, { STR: 50, CON: 60, SIZ: 50, DEX: 60, APP: 50, INT: 70, POW: 60, EDU: 65, LUCK: 50 });
  State.draftChar.derived = sandbox.window.CoCEngine.calculateDerived(State.draftChar.attrs, State.draftChar.age);
  State.draftChar.skillAllocations = {};
  let repeatJob = null;
  let repeatSkill = '';
  for (const candidate of sandbox.window.CoCEngine.Occupations) {
    State.draftChar.job = candidate;
    repeatSkill = String(candidate.classSkillsString || '').split(/[，,、;；\s]+/).find((skill) => Creator.isClassSkill(skill));
    if (repeatSkill) { repeatJob = candidate; break; }
  }
  assert(repeatJob && repeatSkill, 'found a class skill for hold-repeat');
  Creator.startAutoAdd(repeatSkill, 'occ');
  assert.strictEqual(Creator.getSkillOcc(repeatSkill), 5, 'hold-repeat adds immediately');
  sandbox.__timeoutFn();
  sandbox.__intervalFn();
  sandbox.__intervalFn();
  assert.strictEqual(Creator.getSkillOcc(repeatSkill), 15, 'hold-repeat keeps adding while held');
  Creator.stopAutoAdd();
  assert.strictEqual(sandbox.__intervalFn, null, 'stopAutoAdd clears repeat timer');

  // BUG-008: acrobat occupation points must parse EDU x2 + DEX x2 and never display negative.
  Object.assign(State.draftChar.attrs, { STR: 50, CON: 60, SIZ: 50, DEX: 60, APP: 50, INT: 70, POW: 60, EDU: 65, LUCK: 50 });
  State.draftChar.job = acrobatJob;
  State.draftChar.skillAllocations = { '攀爬': { occ: acrobatJob.calcPoints(State.draftChar.attrs) + 70, per: 0 } };
  assert.strictEqual(acrobatJob.calcPoints(State.draftChar.attrs), 250, 'acrobat occupation formula includes DEX');
  assert(Creator.pointStats.value.occRemain >= 0, 'acrobat occupation remaining display is non-negative');
  assert.strictEqual(Creator.pointStats.value.occOverspent, 70, 'overspent occupation points are tracked separately');
  State.draftChar.skillAllocations = {};
  assert.strictEqual(Creator.pointStats.value.occRemain, 250, 'acrobat occupation starts with valid remaining points');

  // BUG-009/010/011: occupation selection preserves the typed name and keeps radar alive.
  State.draftChar.name = '林若水';
  const updatesBeforeOccupation = sandbox.__chartUpdates;
  State.draftChar.job = acrobatJob;
  Creator.handleOccupationChange('林若水');
  await Promise.resolve();
  await Promise.resolve();
  assert.strictEqual(State.draftChar.name, '林若水', 'occupation selection does not clobber typed name');
  assert(sandbox.__chartUpdates > updatesBeforeOccupation, 'occupation selection repaints existing radar chart');
  assert.strictEqual(State.draftChar.job.name, '杂技演员', 'draft keeps selected occupation');

  // BUG-006: preset quick start commits, resumes pending local scenario, and persists immediately.
  State.draftChar.name = '';
  State.gameState.roster.splice(0);
  State.gameState.scenarioRunner.pendingScenarioId = 'tutorial';
  State.saveGame = (slot, name) => {
    sandbox.__saved.push({ slot, name, roster: State.gameState.roster.length });
    return true;
  };
  sandbox.window.CoCScenarioRunner = {
    startScenario(id) {
      sandbox.__scenarioStarted = id;
      State.gameState.scenarioRunner.active = true;
      State.gameState.scenarioRunner.scenarioId = id;
      return true;
    }
  };

  Creator.applyPreset(preset);

  assert.strictEqual(State.gameState.roster.length, 1, 'applyPreset commits to roster');
  assert.strictEqual(State.gameState.roster[0].name, preset.name, 'roster entry name matches preset');
  assert.strictEqual(State.gameState.roster[0].jobName, preset.job.name, 'roster entry occupation matches preset');
  assert(Object.keys(State.gameState.roster[0].skills).length > 0, 'roster entry has skills for squad list');
  assert.strictEqual(sandbox.__scenarioStarted, 'tutorial', 'applyPreset resumes pending scenario');
  assert.strictEqual(State.gameState.scenarioRunner.pendingScenarioId, null, 'pending scenario is cleared');
  assert.strictEqual(switchedTo, 'story', 'applyPreset navigates to story');
  assert.strictEqual(State.gameState.ui.openStoryTab, 'character', 'applyPreset opens character sheet tab');
  assert.deepStrictEqual(sandbox.__saved[0], { slot: 'auto', name: '自动存档', roster: 1 }, 'applyPreset writes immediate autosave');

  // BUG-007: the story character tab renders an attribute-only sheet for roster entries, including presets.
  const storyEmits = [];
  const storyCharVm = sandbox.window.StoryChar.setup({}, { emit: (event, payload) => storyEmits.push({ event, payload }) });
  assert.strictEqual(storyCharVm.currentChar.value.name, preset.name, 'story character panel selects roster entry');
  assert.strictEqual(storyCharVm.displayAttr(storyCharVm.currentChar.value, 'STR'), preset.attrs.STR, 'story character panel renders attributes');
  storyCharVm.emitSwitchTab('chat');
  assert.deepStrictEqual(storyEmits[0], { event: 'switch-tab', payload: 'chat' }, 'story character panel returns to story tab');

  const creatorView = fs.readFileSync(path.join(root, 'js/views/creator_view.mjs'), 'utf8');
  assert(/@pointerdown\.prevent="startAutoAdd\(skill, 'occ'\)"/.test(creatorView), 'creator_view wires occ pointer hold-repeat');
  assert(/@pointerdown\.prevent="startAutoAdd\(skill, 'per'\)"/.test(creatorView), 'creator_view wires per pointer hold-repeat');
  assert(/@pointerup="stopAutoAdd"/.test(creatorView), 'creator_view stops hold-repeat on pointer up');
  assert(/@pointerleave="stopAutoAdd"/.test(creatorView), 'creator_view stops hold-repeat on pointer leave');
  assert(/@pointercancel="stopAutoAdd"/.test(creatorView), 'creator_view stops hold-repeat on pointer cancel');

  const charCreatorSrc = fs.readFileSync(path.join(root, 'js/components/char_creator.mjs'), 'utf8');
  assert(/commitPresetToRoster/.test(charCreatorSrc), 'char_creator has commitPresetToRoster');
  assert(/paint\(retriesLeft/.test(charCreatorSrc), 'renderRadarChart retries canvas mount');
  assert(/saveGame\('auto', '自动存档'\)/.test(charCreatorSrc), 'preset commit persists immediately');
  assert(/handleOccupationChange/.test(charCreatorSrc), 'occupation select preserves name and repaints radar');

  const lobbyView = fs.readFileSync(path.join(root, 'js/views/lobby_view.mjs'), 'utf8');
  assert(/hasDraftInvestigator/.test(lobbyView), 'lobby shows in-progress draft investigator');
  assert(/draftJobName/.test(lobbyView), 'lobby draft preview shows selected occupation');
  assert(/Object\.keys\(char\.skills\)\.length/.test(lobbyView), 'lobby roster list shows skill count for committed investigators');

  const storyChar = fs.readFileSync(path.join(root, 'js/components/story_char.mjs'), 'utf8');
  const storyCharBundle = fs.readFileSync(path.join(root, 'js/components/story_char.js'), 'utf8');
  const storyView = fs.readFileSync(path.join(root, 'js/views/story_view.mjs'), 'utf8');
  assert(/emitSwitchTab\('chat'\)/.test(storyChar), 'story_char has back-to-story action');
  assert(/基础属性/.test(storyChar), 'story_char renders character attributes');
  assert(/selectedActiveIndex/.test(storyChar), 'story_char has multi-character switcher state');
  assert(/activeRoster\.length > 1/.test(storyChar), 'story_char shows switcher tabs when multiple investigators');
  assert(!/技能摘要/.test(storyChar), 'story_char source is attribute-only');
  assert(!/穿戴装备/.test(storyChar), 'story_char source does not render equipment management');
  assert(!/@click="unequip/.test(storyChar), 'story_char source has no equipment interaction');
  assert(!/notableSkills/.test(storyChar), 'story_char source has no skill summary logic');
  assert(!/管理小队/.test(storyChar), 'story_char must not expose squad management label');
  assert(!/管理小队/.test(storyCharBundle), 'story_char bundle must not expose squad management label');
  assert(!/创建调查员/.test(storyChar), 'story_char must not expose creator label');
  assert(!/创建调查员/.test(storyCharBundle), 'story_char bundle must not expose creator label');
  assert(!/管理\/启用调查员/.test(storyChar), 'story_char must not link to squad management screen');
  assert(!/switchScreen\('character'\)/.test(storyChar), 'story_char must not navigate to squad management');
  assert(!/switchScreen\('creator'\)/.test(storyChar), 'story_char must not navigate to character creator');
  assert(!/switchScreen\('lobby'\)/.test(storyChar), 'story_char must not navigate to lobby');
  assert(!/技能摘要/.test(storyCharBundle), 'story_char bundle is attribute-only');
  assert(!/穿戴装备/.test(storyCharBundle), 'story_char bundle does not render equipment management');
  assert(!/@click="unequip/.test(storyCharBundle), 'story_char bundle has no equipment interaction');
  assert(!/notableSkills/.test(storyCharBundle), 'story_char bundle has no skill summary logic');
  assert(!/switchScreen\('character'\)/.test(storyCharBundle), 'story_char bundle must not navigate to squad management');
  assert(!/switchScreen\('creator'\)/.test(storyCharBundle), 'story_char bundle must not navigate to character creator');
  assert(!/switchScreen\('lobby'\)/.test(storyCharBundle), 'story_char bundle must not navigate to lobby');
  assert(/applyPendingStoryTab/.test(storyView), 'story_view applies pending character tab after preset');
  assert(/switchScreen\('creator'\)/.test(lobbyView), 'tutorial flow opens creator when roster is empty');
  assert(/switchScreen\('roster'\)/.test(lobbyView), 'lobby squad management uses roster screen id');
  assert(!/currentScreen === 'character'/.test(lobbyView), 'lobby must not use legacy character screen id');
  assert(!/请先创建至少一名调查员。/.test(lobbyView), 'empty-roster scenario start uses creator redirect copy');
  assert(/@switch-tab="activeStoryTab = \$event"/.test(storyView), 'story_view handles story_char back event');

  console.log('char_creator_flow_smoke: preset + draft occupation + name/radar preservation OK');
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
