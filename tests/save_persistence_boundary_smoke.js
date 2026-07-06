// OPT-017: saveGame quota-exceeded / IDB unavailable boundary tests
const fs = require('fs');
const vm = require('vm');
const path = require('path');
const assert = require('assert');

const store = new Map();
let quotaFail = false;
let toastMessages = [];

const sandbox = {
  console,
  setTimeout,
  clearTimeout,
  Date,
  Math: Object.assign(Object.create(Math), { random: () => 0.5 }),
  JSON,
  Promise,
  Buffer,
  indexedDB: undefined,
  window: {},
  document: {
    getElementById: () => null,
    createElement: () => ({ click() {}, style: {}, set href(v) {}, set download(v) {} }),
    body: { appendChild() {}, removeChild() {} }
  },
  localStorage: {
    get length() { return store.size; },
    key: (i) => Array.from(store.keys())[i] ?? null,
    getItem: (k) => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => {
      if (quotaFail) {
        const err = new Error('QuotaExceededError');
        err.name = 'QuotaExceededError';
        throw err;
      }
      store.set(k, String(v));
    },
    removeItem: (k) => { store.delete(k); }
  },
  Blob: function(parts) {
    return { parts, size: Buffer.byteLength(String((parts || [])[0] || '')) };
  },
  URL: { createObjectURL: () => 'blob:test', revokeObjectURL: () => {} }
};
sandbox.window = sandbox;
sandbox.window.Vue = {
  reactive: (x) => x,
  ref: (v) => ({ value: v }),
  computed: (fn) => ({ get value() { return typeof fn === 'function' ? fn() : fn.get(); } }),
  nextTick: (fn) => (fn ? fn() : Promise.resolve()),
  watch: () => {}
};
sandbox.window.DevLogs = [];
vm.createContext(sandbox);

function run(file) {
  vm.runInContext(fs.readFileSync(path.join(__dirname, '..', file), 'utf8'), sandbox, { filename: file });
}

run('js/data/utils.js');
run('js/core/context_manager.js');
run('js/tools/definitions.js');
run('js/data/skills.js');
run('js/coc.js');
['dice', 'attributes', 'skills', 'combat', 'healing', 'sanity', 'wound', 'mythos', 'environmental', 'poison'].forEach(f => run('js/engines/' + f + '.js'));
run('js/state/core.js');
run('js/state/ui.js');
run('js/state/gameplay.js');
run('js/state/persistence.js');
run('js/state.js');

const state = sandbox.window.CoCState;
state.gameState.roster.push({ name: 'Test', isActive: true, hp: 10, sanity: 50, attrs: {}, derived: { hp: 10, maxHp: 10 }, skills: {} });
state.gameState.activeModuleId = 'default';
state.enterModule('default');

const origToast = state.showToast;
state.showToast = (msg, type, opts) => {
  toastMessages.push(String(msg));
  return origToast ? origToast(msg, type, opts) : 0;
};

// Quota exceeded on localStorage write
quotaFail = true;
toastMessages = [];
const quotaOk = state.saveGame('slot1', 'quota test');
assert.strictEqual(quotaOk, false, 'saveGame returns false when quota exceeded');
assert(
  state.gameState.ui.toasts.some(t => String(t.message || '').includes('空间不足') || String(t.message || '').includes('存档失败'))
  || state.gameState.chatHistory.some(m => String(m.content || '').includes('空间不足')),
  'quota failure surfaced to UI'
);

// IDB unavailable — save still completes without throwing
quotaFail = false;
toastMessages = [];
sandbox.indexedDB = undefined;
const idbOk = state.saveGame('slot2', 'idb fallback test');
assert.strictEqual(typeof idbOk, 'boolean', 'saveGame completes when IDB missing');

console.log('save_persistence_boundary_smoke: OK');
