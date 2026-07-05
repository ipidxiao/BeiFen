// AUDIT3 remediation smoke tests
const assert = require('assert');
const path = require('path');
const { pathToFileURL } = require('url');

const root = path.join(__dirname, '..');
const imp = (rel) => import(pathToFileURL(path.join(root, rel)).href);

async function run() {
    const { safeJsonClone, safeJsonParse } = await imp('js/data/utils.mjs');
    global.safeJsonClone = safeJsonClone;
    global.safeJsonParse = safeJsonParse;

    const { KpExecutionEngine, setKpEngineEnabled, ensureKpEngine } = await imp('js/campaign/kp_execution_engine.mjs');
    const { combat } = await imp('js/tools/handlers/combat.mjs');
    const { character } = await imp('js/tools/handlers/character.mjs');
    const { dice } = await imp('js/tools/handlers/dice.mjs');
    const { mythos } = await imp('js/tools/handlers/mythos.mjs');
    const { CoCToolDefinitions } = await imp('js/tools/definitions.mjs');
    const { clampSelectedCharIndex } = await imp('js/state/selection.mjs');

    global.window = global.window || {};
    global.window.KpExecutionEngine = KpExecutionEngine;
    global.window.CoCToolDefinitions = CoCToolDefinitions;
    global.window.generateNpcFromTemplate = (tmpl, overrides) => ({
        name: overrides.name || tmpl,
        hp: overrides.hp || 10,
        maxHp: overrides.hp || 10,
        armor: overrides.armor || 0,
        description: overrides.description || 'test npc',
        isEnemy: true,
        isDefeated: false
    });
    global.window.CoCNpcTemplates = { '邪教徒': {} };
    global.window.CoCMythosTomes = {
        necronomicon: { title: '死灵之书', sanLoss: '1D6' }
    };
    global.window.CoCEngine = {
        MajorWoundEngine: null,
        SanityEngine: null,
        MythosEngine: {
            initialBrowse: () => ({ success: true, sanLoss: 0, description: 'browse', spellsLearned: [] }),
            fullStudy: () => ({ success: true, sanLoss: 0, description: 'study', spellsLearned: [] })
        }
    };

    const gs = {
        activeModuleId: 'default',
        roster: [{ name: 'A', era: '1920s', isActive: true, hp: 12, derived: { hp: 12 }, sanity: 50, equipment: {}, attrs: { DEX: 60 } }],
        inventory: [],
        storage: [], journalLog: [], npcRegistry: [],
        chatHistory: [], currentLocation: '书房', knownLocations: ['书房'],
        combat: {
            active: true, round: 1,
            enemies: [{ id: 'e1', name: 'Ghoul', hp: 6, maxHp: 10, armor: 2, isEnemy: true, isDefeated: false }],
            initiativeOrder: [{ id: 'a', name: 'A', initiative: 70, isEnemy: false }],
            currentTurnIdx: 0, location: '', notes: ''
        },
        clueBoard: { clues: [], links: [] }, diceHistory: [], atmosphere: { level: 'calm', note: '' },
        scenarioRunner: { active: false, scenarioId: null, scenarioTitle: '', currentNodeId: null, choices: [], ended: false, flags: {}, pendingBranch: null },
        activeCampaign: null, campaignArchive: null, londonKpState: null,
        kpEngine: { enabled: true, systemName: 'COC_LONDON_KP_ENGINE_V2', global: {}, combatStrategyLog: [] },
        selectedCharIndex: 0, storageStatus: {},
        aiSettings: { apiKey: '', model: 'test', baseUrl: 'http://localhost' }
    };

    setKpEngineEnabled(gs, true);
    ensureKpEngine(gs);
    gs.londonKpState.antagonist = gs.londonKpState.antagonist || { ALERT_LEVEL: 0, KNOWLEDGE_LEVEL: 0, CONTROL_LEVEL: 0 };

    gs.londonKpState.PLAYER_POWER = 0;
    gs.kpEngine.global.playerPower = 0;
    gs.combat._powerTrack = { startHp: [12], damageDealt: 10, hitCount: 1, ammoSpent: 0, startRound: 1 };
    gs.combat.round = 1;
    const pp = KpExecutionEngine.finalizeCombatPower(gs, 'victory');
    assert(pp > 0, 'P1-01: PLAYER_POWER > 0 when player dominates');
    assert.strictEqual(gs.londonKpState.PLAYER_POWER, pp, 'P1-01: londonKpState synced');

    const knowBefore = gs.londonKpState.antagonist.KNOWLEDGE_LEVEL;
    KpExecutionEngine.onPlayerAction(gs, '搜查抽屉');
    const knowAfter = gs.londonKpState.antagonist.KNOWLEDGE_LEVEL;
    assert.strictEqual(knowAfter, knowBefore + 1, 'P1-02: onPlayerAction adds exactly +1 KNOWLEDGE');

    const core = {
        gameState: gs,
        switchScreen: () => {},
        cleanupInitiativeOrder: () => {},
        addJournalEntry: (e) => gs.journalLog.push(e),
        startCombat: (enemies) => {
            gs.combat.enemies = enemies.map((e) => ({ ...e, id: 'e_' + e.name, isEnemy: true, isDefeated: false, maxHp: e.hp }));
            gs.combat.active = true;
            gs.combat.initiativeOrder = [{ id: 'a', name: 'A', initiative: 70, isEnemy: false }];
        },
        endCombat: () => { gs.combat.active = false; },
        updateEnemy: (name, hpChange) => {
            const e = gs.combat.enemies.find((x) => x.name === name);
            if (e) {
                e.hp = Math.max(0, e.hp + hpChange);
                if (e.hp <= 0) e.isDefeated = true;
            }
        },
        advanceTurn: () => {},
        Engine: {
            checkSkill: () => ({ level: '成功', rolledValue: 50, targetValue: 50, success: true }),
            CombatEngine: {
                autoResolveExchange: () => ({ msg: 'ok' }),
                resolveBurstFire: () => ({ totalDamage: 0, description: 'burst' }),
                resolveCombatExchange: () => ({ winner: 'attacker', damage: 0, msg: 'ok' })
            },
            MythosEngine: {
                initialBrowse: () => ({ success: true, sanLoss: 0, description: 'browse', spellsLearned: [] }),
                fullStudy: () => ({ success: true, sanLoss: 0, description: 'study', spellsLearned: [] })
            }
        },
        dispatch: (name, args) => charHandlers[name] ? charHandlers[name](args) : '',
        rollCustomDice: () => ({ total: 50, kept: [50], sides: 100, count: 1, mod: 0 }),
        groupRoll: () => ({ groupResults: [{ name: 'A', roll: 50, skillVal: 50, level: '成功' }] })
    };
    const charHandlers = character(core);
    const combatHandlers = combat(core);
    const diceHandlers = dice(core);
    const mythosHandlers = mythos(core);

    gs.chatHistory.length = 0;
    gs.roster[0].hp = 12;
    combatHandlers.enemy_attack({ enemy_name: 'Ghoul', target_name: 'A', damage: 3 });
    const hpMsgs = gs.chatHistory.filter((m) => m.statusAlert?.kind === 'hp_damage' || (m.content && m.content.includes('失去') && m.content.includes('生命')));
    assert.strictEqual(hpMsgs.length, 1, 'P2-01: enemy_attack logs HP damage once');

    assert.strictEqual(CoCToolDefinitions.getNames().length, 35, 'P2-03: definitions has 35 tools');

    gs.selectedCharIndex = 99;
    clampSelectedCharIndex(gs);
    assert.strictEqual(gs.selectedCharIndex, 0, 'P2-04: clampSelectedCharIndex works');

    gs.londonKpState.DOOM_CLOCK = 0;
    KpExecutionEngine.updateAttention(gs, 1, 'test');
    assert(gs.londonKpState.DOOM_CLOCK >= 1, 'P2-02: DOOM_CLOCK increments on positive ATTENTION');

    let diceKpViaConfig = false;
    global.window.CoCKpConfig = {
        getKpEngine: () => { diceKpViaConfig = true; return KpExecutionEngine; }
    };
    diceHandlers.group_roll({ char_names: ['A'], skill_name: '侦查', context: '' });
    assert(diceKpViaConfig, 'P2-06: dice.mjs resolves KP via CoCKpConfig.getKpEngine');

    const orderBefore = gs.combat.initiativeOrder.length;
    combatHandlers.spawn_npc({ template: '邪教徒', name: 'Cultist' });
    assert(gs.combat.initiativeOrder.length > orderBefore, 'P3-01: spawn_npc adds to initiativeOrder');
    assert(gs.combat.initiativeOrder.some((t) => t.name === 'Cultist'), 'P3-01: spawned npc in initiative');

    const eraBad = '他掏出了智能手机拍照。';
    const eraOut = KpExecutionEngine.validateNarrativeEra(eraBad, { gameState: gs });
    assert(eraOut.ok === false, 'P3-02: era violation detected');
    assert(!eraOut.text.includes('智能手机'), 'P3-02: forbidden term stripped');

    const noTome = mythosHandlers.study_tome({ target_name: 'A', tome_name: 'necronomicon' });
    assert(noTome.includes('未持有'), 'P3-09: rejects study without tome: ' + noTome);
    gs.inventory.push('死灵之书');
    const withTome = mythosHandlers.study_tome({ target_name: 'A', tome_name: 'necronomicon' });
    assert(!withTome.startsWith('错误'), 'P3-09: allows study when tome present');

    console.log('audit3_smoke: all assertions passed');
}

run().catch((e) => {
    console.error(e);
    process.exit(1);
});
