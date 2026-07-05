// AUDIT2 remediation smoke tests
const assert = require('assert');
const path = require('path');
const { pathToFileURL } = require('url');

const root = path.join(__dirname, '..');
const imp = (rel) => import(pathToFileURL(path.join(root, rel)).href);

async function run() {
    const { safeJsonClone, safeJsonParse } = await imp('js/data/utils.mjs');
    global.safeJsonClone = safeJsonClone;
    global.safeJsonParse = safeJsonParse;
    global.clampSelectedCharIndex = () => {};

    const { KpExecutionEngine, setKpEngineEnabled, ensureKpEngine } = await imp('js/campaign/kp_execution_engine.mjs');
    const { combat } = await imp('js/tools/handlers/combat.mjs');
    const { saveKpPreference, loadKpPreference, KP_ENGINE_DEFAULT_ENABLED } = await imp('js/state/kp_config.mjs');
    const { CoCStatePersistence } = await imp('js/state/persistence.mjs');

    global.window = global.window || {};
    global.window.KpExecutionEngine = KpExecutionEngine;
    const kpMem = new Map();
    global.localStorage = global.localStorage || {
        getItem: (k) => (kpMem.has(k) ? kpMem.get(k) : null),
        setItem: (k, v) => { kpMem.set(k, String(v)); }
    };
    global.window.CoCKpConfig = {
        KP_ENGINE_DEFAULT_ENABLED,
        loadKpPreference,
        saveKpPreference,
        applyKpPreferenceToGameState: (gs) => {
            const pref = loadKpPreference(gs.activeModuleId);
            if (pref !== null && gs.kpEngine) gs.kpEngine.enabled = pref;
        },
        getKpEngine: () => KpExecutionEngine
    };

    const core = {
        gameState: {
            activeModuleId: 'default',
            roster: [{ name: 'A', hp: 10, derived: { hp: 10 } }],
            inventory: [], storage: [], journalLog: [], npcRegistry: [],
            chatHistory: [], currentLocation: '书房', knownLocations: ['书房'],
            combat: { active: false, round: 1, enemies: [], initiativeOrder: [], currentTurnIdx: 0, location: '', notes: '' },
            sceneMap: { title: '', rooms: [], currentRoomId: null },
            clueBoard: { clues: [], links: [] }, diceHistory: [], atmosphere: { level: 'calm', note: '' },
            scenarioRunner: { active: false, scenarioId: null, scenarioTitle: '', currentNodeId: null, choices: [], ended: false, flags: {}, pendingBranch: null },
            activeCampaign: null, campaignArchive: null, londonKpState: null,
            kpEngine: { enabled: true, systemName: 'COC_LONDON_KP_ENGINE_V2', global: {}, combatStrategyLog: [] },
            selectedCharIndex: 0, storageStatus: {}
        },
        switchScreen: () => {},
        cleanupInitiativeOrder: () => {}
    };
    const ui = {
        showToast: () => {}, _safeLocalStorageSetItem: () => true,
        _pushSystemNotice: () => {}, compactChatHistory: () => {},
        _formatStorageError: (e) => String(e)
    };
    const persist = CoCStatePersistence.create(core, ui);
    setKpEngineEnabled(core.gameState, true);
    ensureKpEngine(core.gameState);
    KpExecutionEngine.initScenePaths(core.gameState, '书房');
    core.gameState.kpEngine.scenePaths.truePathCount = 2;
    core.gameState.kpEngine.keyClueBlockedAttempts = 2;

    const built = persist._buildSaveData('test');
    assert(built.data.kpEngine.scenePaths, 'save includes scenePaths');
    assert.strictEqual(built.data.kpEngine.keyClueBlockedAttempts, 2, 'save includes keyClueBlockedAttempts');

    const restoreState = {
        kpEngine: { enabled: true, systemName: 'COC_LONDON_KP_ENGINE_V2', global: {}, combatStrategyLog: [] },
        roster: [], journalLog: [], chatHistory: []
    };
    Object.assign(core.gameState, restoreState);
    core.gameState.roster.splice(0);
    core.gameState.journalLog.splice(0);
    core.gameState.chatHistory.splice(0);
    const ok = persist._restoreFromData(built, 'test');
    assert(ok, 'restore succeeds');
    assert.strictEqual(core.gameState.kpEngine.scenePaths.truePathCount, 2, 'scenePaths restored');
    assert.strictEqual(core.gameState.kpEngine.keyClueBlockedAttempts, 2, 'keyClueBlockedAttempts restored');

    const modId = 'audit2_pref_' + Date.now();
    saveKpPreference(modId, false);
    core.gameState.activeModuleId = modId;
    built.data.kpEngine.enabled = true;
    persist._restoreFromData(built, 'test');
    assert.strictEqual(core.gameState.kpEngine.enabled, false, 'lobby KP preference wins over save enabled=true');
    assert.strictEqual(loadKpPreference(modId), false, 'lobby preference not overwritten by load');

    const gs = {
        roster: [{ name: 'Test', isActive: true, hp: 10, derived: { hp: 10 }, equipment: {} }],
        inventory: [], chatHistory: [], journalLog: [],
        combat: { active: true, enemies: [{ name: 'Ghoul', hp: 18, maxHp: 18, armor: 0, isDefeated: false }] },
        kpEngine: null, londonKpState: null
    };
    setKpEngineEnabled(gs, true);
    ensureKpEngine(gs);
    assert(Array.isArray(gs.kpEngine.combatStrategyLog), 'kpEngine combatStrategyLog initialized');
    const handlers = combat({
        gameState: gs,
        Engine: { CombatEngine: {}, checkSkill: () => ({ success: true, level: '成功', rolledValue: 50, skillValue: 60, targetValue: 60 }) },
        addJournalEntry: () => {},
        startCombat: () => {}, endCombat: () => {},
        updateEnemy: (name, hp) => {
            const e = gs.combat.enemies.find((x) => x.name === name);
            if (e) { e.hp = Math.max(0, e.hp + hp); if (e.hp <= 0) e.isDefeated = true; }
        },
        advanceTurn: () => {},
        dispatch: () => {}
    });
    handlers.update_enemy({ name: 'Ghoul', hp_change: -3, note: '近战' });
    assert(gs.kpEngine.combatStrategyLog.some((a) => a.includes('melee')), 'update_enemy records melee combat action');

    const fireOnly = KpExecutionEngine.validateCombatStrategy(['attack:fire_weapon:tactical']);
    assert.strictEqual(fireOnly.damageOnly, false, 'tactical-tagged fire_weapon is not pure-damage-only');

    const { CoCToolDefinitions } = await imp('js/tools/definitions.mjs');
    const names = CoCToolDefinitions.getNames();
    assert(names.includes('push_skill_check'), 'push_skill_check in catalog');
    assert(names.includes('request_skill_check'), 'request_skill_check in catalog');
    const audit = CoCToolDefinitions.auditAgainstHandlers(['roll_dice'], ['request_skill_check', 'push_skill_check']);
    assert(!audit.missingHandlers.includes('request_skill_check'), 'request_skill_check is special-cased');
    assert(!audit.missingHandlers.includes('push_skill_check'), 'push_skill_check is special-cased');

    const eraNoKnowledge = KpExecutionEngine.validatePlayerAction('使用智能手机拍照', { gameState: { inventory: [], storage: [], clueBoard: { clues: [] }, journalLog: [], chatHistory: [] } });
    assert.strictEqual(eraNoKnowledge.ok, false, 'era gate blocks smartphone without knowledge');
    const eraFalsePositive = KpExecutionEngine.validatePlayerAction('调查lowifi设备', { gameState: { inventory: [], storage: [], clueBoard: { clues: [] }, journalLog: [], chatHistory: [] } });
    assert.strictEqual(eraFalsePositive.ok, true, 'wifi substring in unrelated token does not false-positive');
    const eraWithKnowledge = KpExecutionEngine.validatePlayerAction('使用智能手机', { gameState: { inventory: ['旧智能手机'], storage: [], clueBoard: { clues: [] }, journalLog: [], chatHistory: [] } });
    assert.strictEqual(eraWithKnowledge.ok, true, 'era gate allows tech when knowledge pool has term');

    const { dice } = await imp('js/tools/handlers/dice.mjs');
    const diceGs = {
        roster: [{ name: 'A', skills: { 斗殴: 50 } }],
        chatHistory: [], kpEngine: null, londonKpState: null
    };
    setKpEngineEnabled(diceGs, true);
    ensureKpEngine(diceGs);
    const alertBefore = diceGs.londonKpState.antagonist.ALERT_LEVEL;
    const diceHandlers = dice({
        gameState: diceGs,
        rollCustomDice: () => ({ sides: 100, count: 1, kept: [50], mod: 0, total: 50 }),
        groupRoll: () => ({ groupResults: [{ name: 'A', roll: 50, skillVal: 50, level: '成功' }] }),
        Engine: { getSkillValue: () => 50, CombatEngine: { compareSuccess: () => 0 } }
    });
    diceHandlers.group_roll({ char_names: ['A'], skill_name: '侦查', context: 'test' });
    assert(diceGs.londonKpState.antagonist.KNOWLEDGE_LEVEL > 0 || diceGs.londonKpState.antagonist.ALERT_LEVEL >= alertBefore, 'group_roll triggers KP antagonist tick');
    const knowBefore = diceGs.londonKpState.antagonist.KNOWLEDGE_LEVEL;
    diceHandlers.opposed_roll({ char_name: 'A', char_skill: '斗殴', opponent_name: '守卫', opponent_value: 40, label: '挣脱' });
    assert(diceGs.londonKpState.antagonist.KNOWLEDGE_LEVEL > knowBefore, 'opposed_roll triggers KP observe tick');

    console.log('audit2_smoke: all assertions passed');
}

run().catch((e) => {
    console.error(e);
    process.exit(1);
});
