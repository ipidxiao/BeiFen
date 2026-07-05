// Batch 4 robustness smoke — enterModule reset, scaleEnemy idempotency, KP loop throttle
const assert = require('assert');
const path = require('path');
const { pathToFileURL } = require('url');

const root = path.join(__dirname, '..');
const imp = (rel) => import(pathToFileURL(path.join(root, rel)).href);

async function run() {
    const { KpExecutionEngine, setKpEngineEnabled } = await imp('js/campaign/kp_execution_engine.mjs');
    const {
        KpGameLoop,
        registerKpGameLoop,
        unregisterKpGameLoop,
        setKpGameLoopRandom,
        resetKpGameLoopRandom
    } = await imp('js/campaign/kp_game_loop.mjs');
    const injectTimedEvent = KpGameLoop.injectTimedEvent;
    const MIN_INJECTION_GAP_MS = KpGameLoop.MIN_INJECTION_GAP_MS;

    // ── scaleEnemy idempotency (_kpScaled) ──
    const gs = {
        roster: [{ name: 'A', isActive: true, hp: 10, derived: { hp: 10 }, attrs: {} }],
        inventory: [],
        clueBoard: { clues: [], links: [] },
        chatHistory: [],
        combat: { active: false, enemies: [] },
        kpEngine: null,
        londonKpState: null
    };
    setKpEngineEnabled(gs, true);
    gs.londonKpState.PLAYER_POWER = 5;
    gs.kpEngine.global.playerPower = 5;
    const base = { name: 'Ghoul', hp: 10, maxHp: 10, armor: 0 };
    const once = KpExecutionEngine.scaleEnemy(gs, base);
    const twice = KpExecutionEngine.scaleEnemy(gs, once);
    assert.strictEqual(once.hp, twice.hp, 'second scaleEnemy must not multiply HP again');
    assert(once._kpScaled, '_kpScaled flag set');

    // ── KP loop injection throttle + dedupe ──
    const loopGs = {
        roster: [{ name: 'B', isActive: true, hp: 10, derived: { hp: 10 }, attrs: {} }],
        inventory: [],
        clueBoard: { clues: [{ id: 'c1', status: 'active' }], links: [] },
        chatHistory: [],
        combat: { active: false, enemies: [] },
        kpEngine: null,
        londonKpState: null
    };
    setKpEngineEnabled(loopGs, true);
    loopGs.kpEngine.lastEventInjectionAt = Date.now();
    const beforeChat = loopGs.chatHistory.length;
    injectTimedEvent(loopGs);
    assert.strictEqual(loopGs.chatHistory.length, beforeChat, 'injection blocked within MIN_INJECTION_GAP_MS');

    loopGs.kpEngine.lastEventInjectionAt = Date.now() - MIN_INJECTION_GAP_MS - 1;
    loopGs.kpEngine.recentInjectionTypes = ['clue', 'danger', 'choice'];
    let picks = [];
    setKpGameLoopRandom(() => 0);
    injectTimedEvent(loopGs);
    picks.push(loopGs.kpEngine.recentInjectionTypes.slice(-1)[0]);
    assert.strictEqual(picks[0], 'clue', 'dedupe resets pool when all types recent');
    resetKpGameLoopRandom();

    // ── register idempotent for same gameState ──
    registerKpGameLoop(loopGs);
    const firstId = loopGs._kpGameLoopTimerId;
    registerKpGameLoop(loopGs);
    assert.strictEqual(loopGs._kpGameLoopTimerId, firstId, 're-register same state is idempotent');
    unregisterKpGameLoop(loopGs);
    assert.strictEqual(loopGs._kpGameLoopTimerId, null, 'unregister clears instance timer');

    // ── enterModule resets scenarioRunner / KP runtime without forcing KP off ──
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
        document: { getElementById: () => null },
        localStorage: {
            get length() { return store.size; },
            key: (i) => Array.from(store.keys())[i] ?? null,
            getItem: (k) => (store.has(k) ? store.get(k) : null),
            setItem: (k, v) => { store.set(k, String(v)); },
            removeItem: (k) => { store.delete(k); }
        }
    };
    sandbox.window = sandbox;
    sandbox.window.Vue = {
        reactive: (x) => x,
        ref: (v) => ({ value: v }),
        nextTick: (fn) => (fn ? fn() : Promise.resolve()),
        watch: () => {}
    };
    sandbox.window.KpGameLoop = { unregister: () => {} };

    const vm = require('vm');
    vm.createContext(sandbox);
    const runFile = (file) => {
        const fs = require('fs');
        vm.runInContext(fs.readFileSync(path.join(root, file), 'utf8'), sandbox, { filename: file });
    };
    runFile('js/data/utils.js');
    runFile('js/state/kp_config.js');
    runFile('js/state/core.js');
    runFile('js/state/ui.js');
    runFile('js/state/gameplay.js');
    runFile('js/state/persistence.js');
    runFile('js/state.js');

    const state = sandbox.window.CoCState;
    const gs2 = state.gameState;
    sandbox.window.CoCKpConfig.saveKpPreference('mod_a', false);

    gs2.activeModuleId = 'mod_a';
    gs2.scenarioRunner = { active: true, scenarioId: 'x', scenarioTitle: 'T', currentNodeId: 'n1', choices: [1], ended: false, flags: { a: 1 }, pendingBranch: null };
    gs2.activeCampaign = 'masks_london';
    gs2.campaignArchive = { foo: 1 };
    gs2.londonKpState = { ATTENTION_LEVEL: 9, PHASE: 'ACTIVE_HUNT' };
    gs2.kpEngine.enabled = true;
    gs2.kpEngine.global = { attention: 9, playerPower: 7, phase: 'HUNT' };
    gs2.kpEngine.sessionStartedAt = 1;
    gs2.kpEngine.lastEventInjectionAt = 2;
    gs2.kpEngine.combatStrategyLog = ['x'];
    gs2.roster.push({ name: 'Old', isActive: true, hp: 1, derived: { hp: 1 }, attrs: {} });

    state.enterModule('mod_a');

    assert.strictEqual(gs2.scenarioRunner.active, false, 'scenarioRunner reset');
    assert.strictEqual(gs2.scenarioRunner.scenarioId, null);
    assert.strictEqual(gs2.activeCampaign, null);
    assert.strictEqual(gs2.campaignArchive, null);
    assert.strictEqual(gs2.kpEngine.enabled, false, 'KP toggle from kp_config preserved');
    assert.strictEqual(gs2.kpEngine.global.playerPower, 0, 'KP global state reset');
    assert.strictEqual(gs2.kpEngine.sessionStartedAt, null);
    assert.strictEqual(gs2.londonKpState, null, 'londonKpState cleared when KP off');
    assert.strictEqual(gs2.roster.length, 0, 'roster cleared');

    sandbox.window.CoCKpConfig.saveKpPreference('mod_b', true);
    gs2.kpEngine.enabled = true;
    gs2.londonKpState = { ATTENTION_LEVEL: 5 };
    state.enterModule('mod_b');
    assert.strictEqual(gs2.kpEngine.enabled, true, 'KP stays on when module pref is on');
    assert.strictEqual(gs2.londonKpState, null, 'londonKpState cleared before reload');

    console.log('batch4_robustness_smoke: all assertions passed');
}

run().catch((e) => {
    console.error('batch4_robustness_smoke FAILED:', e);
    process.exit(1);
});
