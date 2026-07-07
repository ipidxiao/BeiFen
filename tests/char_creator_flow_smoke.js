// char_creator flow smoke — preset roster commit, radar retry, skill hold-repeat UI
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
  clearInterval: () => {},
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
    getItem: (k) => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => { store.set(k, String(v)); },
    removeItem: (k) => { store.delete(k); }
  },
  Chart: function Chart() { this.canvas = null; this.data = { datasets: [{ data: [] }] }; this.update = () => {}; this.destroy = () => {}; }
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

const Creator = sandbox.window.CoCCreator;
const preset = Creator.CHARACTER_PRESETS[0];

assert(preset && preset.name, 'preset fixture exists');
assert.strictEqual(State.gameState.roster.length, 0, 'roster starts empty');

Creator.applyPreset(preset);

assert.strictEqual(State.gameState.roster.length, 1, 'applyPreset commits to roster');
assert.strictEqual(State.gameState.roster[0].name, preset.name, 'roster entry name matches preset');
assert(State.gameState.roster[0].attrs.STR > 0, 'roster entry has attrs');
assert.strictEqual(switchedTo, 'story', 'applyPreset navigates to story');

const creatorView = fs.readFileSync(path.join(root, 'js/views/creator_view.mjs'), 'utf8');
assert(/startAutoAdd\(skill, 'occ'\)/.test(creatorView), 'creator_view wires occ hold-repeat');
assert(/startAutoAdd\(skill, 'per'\)/.test(creatorView), 'creator_view wires per hold-repeat');

const charCreatorSrc = fs.readFileSync(path.join(root, 'js/components/char_creator.mjs'), 'utf8');
assert(/commitPresetToRoster/.test(charCreatorSrc), 'char_creator has commitPresetToRoster');
assert(/paint\(retriesLeft/.test(charCreatorSrc), 'renderRadarChart retries canvas mount');

const storyChar = fs.readFileSync(path.join(root, 'js/components/story_char.mjs'), 'utf8');
assert(/switchScreen\('creator'\)/.test(storyChar), 'story_char empty state links to creator');
assert(/switchScreen\('lobby'\)/.test(storyChar), 'story_char empty state links to lobby');

console.log('char_creator_flow_smoke: preset roster + UI patterns OK');
