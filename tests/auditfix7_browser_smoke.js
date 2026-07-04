// ===============================================
// 归属：【QA】 测试用例 / 覆盖验证
// 程序/美术/策划 请勿直接修改测试逻辑
// 修改后放入 roles/qa/ 运行 merge.py 合并
// ===============================================

/** AUDITFIX7 browser smoke — alias: index-html-load-chain (script order, globals after load) */
const fs = require('fs');
const vm = require('vm');
const path = require('path');
const assert = require('assert');

(async () => {
  const root = path.join(__dirname, '..');
  const indexHtml = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  const localScripts = [...indexHtml.matchAll(/<script src="\.\/(js\/[^\"]+\.js|tests\/engine_tests\.js)"><\/script>/g)].map(m => m[1]);
  const handlerIndex = 'js/tools/handlers/index.js';
  const domainHandlers = [
    'js/tools/handlers/character.js',
    'js/tools/handlers/inventory.js',
    'js/tools/handlers/dice.js',
    'js/tools/handlers/clues.js',
    'js/tools/handlers/map.js',
    'js/tools/handlers/combat.js',
    'js/tools/handlers/npc.js',
    'js/tools/handlers/system.js'
  ];
  assert(localScripts.includes('js/core/context_manager.js'), 'index.html loads core/context_manager.js');
  assert(localScripts.includes('js/tools/definitions.js'), 'index.html loads tools/definitions.js');
  domainHandlers.forEach(file => assert(localScripts.includes(file), `index.html loads ${file}`));
  assert(localScripts.includes(handlerIndex), 'index.html loads tools/handlers/index.js');
  assert(localScripts.indexOf(handlerIndex) > localScripts.indexOf('js/state/core.js','js/state/ui.js','js/state/gameplay.js','js/state/persistence.js','js/state.js'), 'handler index loads after state.js');
  domainHandlers.forEach(file => assert(localScripts.indexOf(file) < localScripts.indexOf(handlerIndex), `${file} loads before handler index`));
  assert(localScripts.indexOf(handlerIndex) < localScripts.indexOf('js/ai_logic.js'), 'handler index loads before ai_logic.js');

  const appRecord = { components: {}, mounted: null, setupResult: null };
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
      getElementById: (id) => id === 'app' || id === 'chatContainer' ? { id, scrollTop: 0, scrollHeight: 0 } : null,
      createElement: () => ({ click() {}, style: {}, set href(v) { this._href = v; }, set download(v) { this._download = v; } }),
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
    URL: { createObjectURL: () => 'blob:test', revokeObjectURL: () => {} },
    Chart: function() {}
  };
  sandbox.window = sandbox;
  sandbox.window.Vue = {
    reactive: (x) => x,
    ref: (v) => ({ value: v }),
    computed: (fnOrObj) => ({ get value() { return typeof fnOrObj === 'function' ? fnOrObj() : fnOrObj.get(); }, set value(v) { if (fnOrObj.set) fnOrObj.set(v); } }),
    nextTick: (fn) => (fn ? fn() : Promise.resolve()),
    watch: () => {},
    createApp: (options) => ({
      component(name, def) { appRecord.components[name] = def; return this; },
      mount(selector) { appRecord.mounted = selector; appRecord.setupResult = options && options.setup ? options.setup() : {}; return appRecord.setupResult; }
    })
  };
  sandbox.window.Chart = sandbox.Chart;
  sandbox.ref=(v)=>v;sandbox.watch=(fn,cb)=>{};sandbox.onMounted=(fn)=>{};sandbox.computed=(fn)=>({value:fn()});
  vm.createContext(sandbox);
  function run(file) {
    const code = fs.readFileSync(path.join(root, file), 'utf8');
    vm.runInContext(code, sandbox, { filename: file });
  }

  localScripts.filter(file => file !== 'tests/engine_tests.js').forEach(run);

  assert.strictEqual(appRecord.mounted, '#app', 'app mounts to #app');
  ['view-lobby', 'view-creator', 'view-story', 'view-dev-log', 'coc-toast-layer', 'coc-confirm-dialog'].forEach(name => {
    assert(appRecord.components[name], `${name} is registered`);
  });
  assert(sandbox.window.CoCState && sandbox.window.CoCAI && sandbox.window.CoCToolHandlers, 'core globals are available after browser load');
  assert.strictEqual(typeof appRecord.setupResult.handlePlayerAction, 'function', 'root setup exposes AI action handler');
  assert.strictEqual(typeof appRecord.setupResult.saveGame, 'function', 'root setup exposes saveGame');

  const jsFiles = fs.readdirSync(path.join(root, 'js'), { recursive: true }).filter(f => String(f).endsWith('.js') && !String(f).includes('components') && !String(f).includes('views') && !String(f).includes('char_creator'));
  const directDialogs = [];
  jsFiles.forEach(f => {
    const source = fs.readFileSync(path.join(root, 'js', f), 'utf8');
    const matches = source.match(/\b(?:window\.)?(?:alert|confirm)\s*\(/g);
    if (matches) directDialogs.push(`${f}:${matches.join(',')}`);
  });
  assert.deepStrictEqual(directDialogs, [], 'source has no direct browser alert/confirm calls');

  const state = sandbox.window.CoCState;
  state.showToast('浏览器 smoke toast', 'success', { timeout: 0 });
  assert(state.gameState.ui.toasts.some(t => t.message === '浏览器 smoke toast'), 'toast state accepts UI messages');
  const confirmPromise = state.confirmAction('确认 smoke？', { title: 'Smoke', okText: '好' });
  assert(state.gameState.ui.confirmDialog && state.gameState.ui.confirmDialog.title === 'Smoke', 'confirm dialog state opens');
  sandbox.window.CocConfirmDialog.methods.resolve(true);
  assert.strictEqual(await confirmPromise, true, 'confirm dialog resolves through component method');

  const storyApi = sandbox.window.ViewStory.setup();
  storyApi.openSaveModal();
  assert.strictEqual(state.gameState.activeModal, 'save', 'story save modal opens through setup API');
  assert.strictEqual(typeof sandbox.window.ViewLobby.setup, 'function', 'lobby setup is available for browser runtime');

  console.log('AUDITFIX8 browser smoke tests passed');
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
