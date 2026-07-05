// Shared VM sandbox for Node smoke tests that load browser .js bundles.
const fs = require('fs');
const vm = require('vm');
const path = require('path');

function createVmSandbox() {
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
            body: { appendChild() {}, removeChild() {} },
        },
        localStorage: {
            get length() { return store.size; },
            key: (i) => Array.from(store.keys())[i] ?? null,
            getItem: (k) => (store.has(k) ? store.get(k) : null),
            setItem: (k, v) => { store.set(k, String(v)); },
            removeItem: (k) => { store.delete(k); },
        },
        Blob(parts, opts) { return { parts, opts, size: (parts || []).reduce((n, p) => n + Buffer.byteLength(String(p)), 0) }; },
        URL: { createObjectURL: () => 'blob:test', revokeObjectURL: () => {} },
    };
    sandbox.window = sandbox;
    sandbox.window.Vue = {
        reactive: (x) => x,
        ref: (v) => ({ value: v }),
        computed: (fnOrObj) => ({
            get value() { return typeof fnOrObj === 'function' ? fnOrObj() : fnOrObj.get(); },
            set value(v) { if (fnOrObj.set) fnOrObj.set(v); },
        }),
        nextTick: (fn) => (fn ? fn() : Promise.resolve()),
        watch: () => {},
    };
    sandbox.window.DevLogs = [];
    vm.createContext(sandbox);
    return { sandbox, store };
}

function runInSandbox(sandbox, file, rootDir) {
    const code = fs.readFileSync(path.join(rootDir, file), 'utf8');
    vm.runInContext(code, sandbox, { filename: file });
}

function loadCoreEngineStack(sandbox, rootDir) {
    const run = (file) => runInSandbox(sandbox, file, rootDir);
    run('js/data/utils.js');
    run('js/core/context_manager.js');
    run('js/tools/definitions.js');
    run('js/data/skills.js');
    run('js/coc.js');
    ['dice', 'attributes', 'skills', 'combat', 'healing', 'sanity', 'wound', 'mythos', 'environmental', 'poison'].forEach((f) => run(`js/engines/${f}.js`));
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
    run('js/tools/handlers/mythos.js');
    run('js/tools/handlers/system.js');
    run('js/tools/handlers/index.js');
    run('js/ai/network.js');
    run('js/ai/tool_dispatch.js');
    run('js/data/ai_prompt_config.js');
    run('js/ai_logic.js');
}

module.exports = { createVmSandbox, runInSandbox, loadCoreEngineStack };
