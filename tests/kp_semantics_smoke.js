// KP semantics smoke — migration preservation, unloadCampaign, divine_war hint contract
const assert = require('assert');
const path = require('path');
const { pathToFileURL } = require('url');

const root = path.join(__dirname, '..');
const imp = (rel) => import(pathToFileURL(path.join(root, rel)).href);

async function run() {
    const { KP_ENGINE_DEFAULT_ENABLED } = await imp('js/state/kp_config.mjs');
    const { loadMasksLondonCampaign, unloadCampaign } = await imp('js/campaign/campaign_loader.mjs');
    const { CoCAIPromptConfig } = await imp('js/data/ai_prompt_config.mjs');

    assert.strictEqual(KP_ENGINE_DEFAULT_ENABLED, true, 'fresh session default is enabled');

    // ── Migration: legacy saves without kpEngine must not force-enable ──
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
    const migrate = state.__testing.migrateSaveData;

    const legacyNoKp = {
        version: 5,
        data: {
            roster: [{ name: 'A', isActive: true, hp: 10, sanity: 50, attrs: {}, derived: { hp: 10, maxHp: 10 }, equipment: {}, skillAllocations: {} }],
            inventory: [],
            chatHistory: [],
            combat: { active: false, round: 1, enemies: [], initiativeOrder: [], currentTurnIdx: 0, location: '', notes: '' }
        }
    };
    const migratedLegacy = migrate(legacyNoKp);
    assert.strictEqual(migratedLegacy.data.kpEngine.enabled, false, 'legacy save without kpEngine stays off');

    const explicitOff = {
        version: 7,
        data: {
            roster: legacyNoKp.data.roster,
            inventory: [],
            chatHistory: [],
            combat: legacyNoKp.data.combat,
            kpEngine: { enabled: false }
        }
    };
    assert.strictEqual(migrate(explicitOff).data.kpEngine.enabled, false, 'explicit disabled preserved');

    const explicitOn = {
        version: 7,
        data: {
            roster: legacyNoKp.data.roster,
            inventory: [],
            chatHistory: [],
            combat: legacyNoKp.data.combat,
            kpEngine: { enabled: true, global: { attention: 2, playerPower: 1, phase: 'CALM' } }
        }
    };
    assert.strictEqual(migrate(explicitOn).data.kpEngine.enabled, true, 'explicit enabled preserved');

    // ── unloadCampaign respects user KP toggle ──
    const gs = {
        roster: [],
        inventory: [],
        knownLocations: [],
        chatHistory: [],
        aiSettings: { difficultyPreset: 'divine_war' },
        atmosphere: {},
        scenarioRunner: {},
        kpEngine: { enabled: false, global: { attention: 0, playerPower: 0, phase: 'CALM' } },
        londonKpState: { ATTENTION_LEVEL: 9 },
        activeCampaign: 'masks_london',
        campaignArchive: { x: 1 }
    };
    unloadCampaign(gs);
    assert.strictEqual(gs.kpEngine.enabled, false, 'unloadCampaign does not re-enable KP');
    assert.strictEqual(gs.activeCampaign, null);
    assert.strictEqual(gs.londonKpState, null);
    assert.strictEqual(gs.aiSettings.difficultyPreset, 'standard');

    const gsKpOn = {
        roster: [],
        inventory: [],
        knownLocations: [],
        chatHistory: [],
        aiSettings: { difficultyPreset: 'standard' },
        atmosphere: {},
        scenarioRunner: {},
        kpEngine: { enabled: true },
        londonKpState: { ATTENTION_LEVEL: 9, PHASE: 'ACTIVE_HUNT' },
        activeCampaign: 'masks_london',
        campaignArchive: { x: 1 }
    };
    unloadCampaign(gsKpOn);
    assert.strictEqual(gsKpOn.kpEngine.enabled, true, 'unloadCampaign keeps KP on when user had it on');
    assert(gsKpOn.londonKpState, 'unloadCampaign reinitializes generic london state when KP on');

    // ── divine_war applies prompt tier regardless of KP toggle ──
    const divineOff = { kpEngine: { enabled: false } };
    const injectionOff = CoCAIPromptConfig.buildSystemInjection('【V】', 'divine_war', divineOff);
    assert(injectionOff.includes('神战'), 'divine_war prompt applies when KP off');
    const divineOn = { kpEngine: { enabled: true } };
    const injectionOn = CoCAIPromptConfig.buildSystemInjection('【V】', 'divine_war', divineOn);
    assert(injectionOn.includes('神战'), 'divine_war prompt applies when KP on');

    // ── Per-module KP preference roundtrip (via browser sandbox localStorage) ──
    const cfg = sandbox.window.CoCKpConfig;
    assert(cfg, 'CoCKpConfig mounted');
    cfg.saveKpPreference('mod_test', false);
    assert.strictEqual(cfg.loadKpPreference('mod_test'), false);
    cfg.saveKpPreference('mod_test', true);
    assert.strictEqual(cfg.loadKpPreference('mod_test'), true);

    console.log('kp_semantics_smoke: all assertions passed');
}

run().catch((e) => {
    console.error('kp_semantics_smoke FAILED:', e);
    process.exit(1);
});
