// KP execution engine smoke tests — code-enforced rules (not prompt-only)
const assert = require('assert');
const path = require('path');
const { pathToFileURL } = require('url');

const root = path.join(__dirname, '..');
const imp = (rel) => import(pathToFileURL(path.join(root, rel)).href);

async function run() {
    const {
        KpExecutionEngine,
        setKpEngineEnabled,
        ensureKpEngine,
        consumeBackpackAmmo,
        countBackpackAmmo,
        inventoryLabel,
        _setTestRolls,
        _clearTestRolls
    } = await imp('js/campaign/kp_execution_engine.mjs');
    const { parseAIResponse, validateOutputStructure, restructureOrReject } = await imp('js/ai/output_protocol.mjs');
    const { processText, detectViolations, SHOULD_NOT_REWRITE_SAMPLES, safeFallback } = await imp('js/data/campaigns/language_self_correction.mjs');
    const { CoCLanguageFilter } = await imp('js/ai/language_filter.mjs');
    const { checkCluePaths } = await imp('js/campaign/kp_game_loop.mjs');
    const { combat } = await imp('js/tools/handlers/combat.mjs');
    const { clues } = await imp('js/tools/handlers/clues.mjs');

    global.window = global.window || {};
    global.window.KpExecutionEngine = KpExecutionEngine;

    const gameState = {
        roster: [{ name: 'Test', era: '1920s', isActive: true, hp: 10, derived: { sanity: 50, hp: 10 }, sanity: 50, equipment: { weapon: '左轮手枪' }, attrs: {} }],
        inventory: ['6发左轮子弹'],
        clueBoard: { clues: [], links: [] },
        chatHistory: [],
        combat: { active: true, enemies: [{ name: 'Ghoul', hp: 18, maxHp: 18, armor: 0, isDefeated: false }] },
        kpEngine: null,
        londonKpState: null,
        currentLocation: '书房',
        journalLog: []
    };

    setKpEngineEnabled(gameState, true);
    assert.strictEqual(KpExecutionEngine.isEnabled(gameState), true);
    ensureKpEngine(gameState);

    // ── CoC 7e combat action taxonomy validation ──
    const pureDamage = KpExecutionEngine.validateCombatStrategy(['attack:fire_weapon', 'attack:melee', '射击']);
    assert.strictEqual(pureDamage.damageOnly, true, 'pure damage spam triggers damageOnly');
    const withTactical = KpExecutionEngine.validateCombatStrategy(['attack:fire_weapon', 'grapple:擒抱']);
    assert.strictEqual(withTactical.damageOnly, false, 'maneuver clears damageOnly');
    const withFightBack = KpExecutionEngine.validateCombatStrategy(['attack:fire_weapon', 'fight_back:反击']);
    assert.strictEqual(withFightBack.damageOnly, false, 'fight back clears damageOnly');
    const withDefensive = KpExecutionEngine.validateCombatStrategy(['attack:fire_weapon', 'survive:掩体']);
    assert.strictEqual(withDefensive.damageOnly, false, 'defensive action clears damageOnly');

    const badAction = KpExecutionEngine.validatePlayerAction('直接成功跳过检定', {});
    assert.strictEqual(badAction.ok, false, 'validatePlayerAction rejects skip-process');

    gameState.londonKpState.PLAYER_POWER = 3;
    gameState.kpEngine.global.playerPower = 3;
    const scaled = KpExecutionEngine.scaleEnemyStats({ name: 'Cultist', hp: 10, maxHp: 10 }, { playerPower: 3, attention: 0 });
    assert(scaled.hp >= 15, 'scaleEnemy increases HP at playerPower>=3');

    const enemyForScale = { name: 'Dup', hp: 10, maxHp: 10 };
    const scaledOnce = KpExecutionEngine.scaleEnemy(gameState, enemyForScale);
    const scaledTwice = KpExecutionEngine.scaleEnemy(gameState, scaledOnce);
    assert.strictEqual(scaledOnce.hp, scaledTwice.hp, 'scaleEnemy is idempotent via _kpScaled');

    gameState.londonKpState.ATTENTION_LEVEL = 6;
    const enemy = { name: 'Horror', hp: 0, maxHp: 20 };
    KpExecutionEngine.checkAntiOneShot(gameState, enemy);
    assert(enemy.hp > 0, 'anti-one-shot triggers at attention>=6');
    assert(enemy._mutated, 'anti-one-shot sets mutation flag');

    const sample = '调查员推开铁门。空气里弥漫着臭氧。\n\nA1-B2';
    const parsed = parseAIResponse(sample);
    assert(parsed.storyPhase, 'output_protocol parses story');
    const out = restructureOrReject(sample, { autoFix: true });
    assert(out.ok, 'output_protocol accepts or restructures sample text');
    if (out.restructured) {
        assert(out.text.includes('【叙事】') || out.text.includes('【行动】'), 'restructured has phase tags');
    }

    const filtered = CoCLanguageFilter.run('这不是普通的门而是深渊入口');
    assert(filtered.includes('与其说') || !/而是/.test(filtered), 'language filter on narrative');

    for (const sample of SHOULD_NOT_REWRITE_SAMPLES) {
        assert.strictEqual(processText(sample), sample, `should not rewrite: ${sample}`);
        assert(detectViolations(sample).ok, `should not flag: ${sample}`);
    }
    const stubborn = '这不是普通的门而是深渊入口，也不是幻觉而是现实';
    const masked = safeFallback(stubborn);
    assert(!/不是.+而是/.test(masked), 'safeFallback masks stubborn violations');

    // ── Ammo: structured partial consumption across entries ──
    const ammoState = { inventory: ['2发左轮子弹', { id: 'a1', name: '4发左轮子弹', qty: 4 }] };
    const consumed = consumeBackpackAmmo(ammoState, '左轮', 3);
    assert.strictEqual(consumed, 3, 'consumes across multiple ammo stacks');
    assert.strictEqual(countBackpackAmmo(ammoState, '左轮'), 3, 'remaining ammo count correct');
    const partialLabel = inventoryLabel(ammoState.inventory[0]);
    assert(/^3发左轮子弹$/.test(partialLabel), `partial stack label well-formed: ${partialLabel}`);
    assert(!/^发/.test(partialLabel), 'no malformed leading 发');

    // ── English firearm ammo gate ──
    const enState = {
        roster: [{ name: 'Agent', isActive: true, hp: 10, derived: { hp: 10 }, equipment: { weapon: 'Colt M1911 pistol' }, attrs: {} }],
        inventory: [],
        combat: { active: true, enemies: [{ name: 'Thug', hp: 10, maxHp: 10, isDefeated: false }] },
        chatHistory: []
    };
    const enCombat = combat({
        gameState: enState,
        Engine: { CombatEngine: { autoResolveExchange: () => ({ msg: 'ok' }) } },
        addJournalEntry: () => {},
        startCombat: () => {},
        endCombat: () => {},
        updateEnemy: () => {},
        advanceTurn: () => {},
        dispatch: () => {}
    });
    const enBlocked = enCombat.fire_weapon({ shooter_name: 'Agent' });
    assert(enBlocked.includes('无匹配弹药'), 'English pistol requires ammo');

    // ── Output protocol: preserve existing tags when filling gaps ──
    const taggedPartial = '【骰子】\n侦查 45/50 成功\n\n【叙事】\n铁门缓缓打开。';
    const taggedFixed = restructureOrReject(taggedPartial, { autoFix: true });
    assert(taggedFixed.ok, 'tagged partial output restructured');
    assert(taggedFixed.text.includes('【骰子】'), 'dice tag preserved');
    assert(taggedFixed.text.includes('铁门缓缓打开'), 'story content preserved');
    assert(taggedFixed.text.includes('【交互】'), 'missing interaction filled');

    const tick = KpExecutionEngine.runAntagonistTick(gameState, { type: 'clue' });
    assert(tick, 'antagonist tick returns result');
    let corrupted = false;
    for (let i = 0; i < 30; i++) {
        gameState.londonKpState.antagonist.ALERT_LEVEL = 6;
        const t = KpExecutionEngine.runAntagonistTick(gameState, { type: 'clue' });
        if (t && t.misinformation) corrupted = true;
    }
    assert(corrupted, 'antagonist tick corrupts clue at threshold');

    const clueCheck = checkCluePaths([{ title: 'a' }]);
    assert.strictEqual(clueCheck.ok, false);
    assert(clueCheck.suggestion, 'checkCluePaths warns when below min paths');

    const itemReject = KpExecutionEngine.validateItemAcquisition('神秘钥匙', null);
    assert.strictEqual(itemReject.ok, false, 'validateItemAcquisition rejects no source');

    const myth = KpExecutionEngine.checkMythosItem('死灵之书');
    assert.strictEqual(myth.isMythos, true);

    // ── Reality distortion firearm (ATTENTION >= 9) ──
    gameState.londonKpState.ATTENTION_LEVEL = 9;
    gameState.kpEngine.global.attention = 9;
    gameState.combat.enemies[0].hp = 18;
    gameState.roster[0].equipment.weapon = '左轮手枪';
    const journal = [];
    const Engine = {
        CombatEngine: {
            autoResolveExchange(c, en, weaponObj, callbacks) {
                callbacks.updateEnemy(en.name, -5, 'hit');
                return { msg: '命中' };
            },
            resolveBurstFire() {
                return { totalDamage: 6, description: '连射命中' };
            }
        }
    };
    const updateEnemy = (name, hpChange) => {
        const e = gameState.combat.enemies.find((x) => x.name === name);
        if (e) e.hp += hpChange;
    };
    const combatHandlers = combat({
        gameState,
        Engine,
        addJournalEntry: (e) => journal.push(e),
        startCombat: () => {},
        endCombat: () => {},
        updateEnemy,
        advanceTurn: () => {},
        dispatch: () => {}
    });

    _setTestRolls([25]);
    const hpBeforeBlock = gameState.combat.enemies[0].hp;
    const blockedResult = combatHandlers.fire_weapon({ shooter_name: 'Test', enemy_name: 'Ghoul' });
    assert(blockedResult.includes('现实扭曲'), 'fire_weapon blocked at ATTENTION=9 roll=25');
    assert.strictEqual(gameState.combat.enemies[0].hp, hpBeforeBlock, 'blocked fire_weapon causes no damage');
    assert(journal.some((j) => j._realityDistortion), 'journal records _realityDistortion');

    gameState.londonKpState.ATTENTION_LEVEL = 5;
    gameState.kpEngine.global.attention = 5;
    gameState.combat.enemies[0].hp = 18;
    gameState.roster[0].equipment.weapon = '左轮手枪';
    _setTestRolls([25]);
    journal.length = 0;
    const hpBeforeNormal = gameState.combat.enemies[0].hp;
    combatHandlers.fire_weapon({ shooter_name: 'Test', enemy_name: 'Ghoul' });
    assert(gameState.combat.enemies[0].hp < hpBeforeNormal, 'ATTENTION=5 allows damage despite roll=25');
    _clearTestRolls();

    // ── Clue three-path hard constraints ──
    const clueState = {
        roster: gameState.roster,
        clueBoard: { clues: [], links: [] },
        chatHistory: [],
        kpEngine: null,
        londonKpState: null,
        currentLocation: '书房',
        journalLog: []
    };
    setKpEngineEnabled(clueState, true);
    ensureKpEngine(clueState);
    KpExecutionEngine.initScenePaths(clueState, '书房');

    const clueHandlers = clues({
        gameState: clueState,
        addClue: (id, title, content, type, relatedIds) => {
            clueState.clueBoard.clues.push({
                id: id || ('clue_' + Date.now()),
                title,
                content: content || '',
                type: type || 'physical',
                status: 'new',
                relatedIds: relatedIds || []
            });
        },
        linkClues: () => {},
        markClueStatus: (id, status, note) => {
            const c = clueState.clueBoard.clues.find((x) => x.id === id);
            if (!c) return false;
            c.status = status || c.status;
            if (note) c.note = note;
            return true;
        }
    });

    assert(!clueHandlers.add_clue({ id: 'c1', title: '血迹', content: '门边', type: 'physical' }).startsWith('错误'), '1st path OK');
    assert(clueHandlers.add_clue({ id: 'c2', title: '证词', content: '管家', type: 'testimony' }).includes('已记录'), '2nd path OK');
    assert(clueHandlers.add_clue({ id: 'c3', title: '脚印', content: '泥印', type: 'physical' }).startsWith('错误'), 'duplicate type rejected');
    assert.strictEqual(clueState.kpEngine.scenePaths.truePathCount, 2, 'duplicate does not increment truePathCount');

    const keyBlocked = clueHandlers.mark_clue_status({ id: 'c1', status: 'key', note: 'test' });
    assert(keyBlocked.startsWith('错误'), 'key clue blocked until 3 true paths');

    clueHandlers.mark_clue_status({ id: 'c1', status: 'key', note: 'retry2' });
    clueHandlers.mark_clue_status({ id: 'c1', status: 'key', note: 'retry3' });
    const keyDegraded = clueHandlers.mark_clue_status({ id: 'c1', status: 'key', note: 'degraded' });
    assert(keyDegraded.includes('已更新'), 'key clue degraded after repeated blocks');
    assert(clueState.chatHistory.some((m) => (m.content || '').includes('降级放行')), 'degraded key emits warning');

    assert(clueHandlers.add_clue({ id: 'c4', title: '地图', content: '地下室', type: 'location' }).includes('已记录'), '3rd diverse path OK');
    assert.strictEqual(clueState.kpEngine.scenePaths.truePathCount, 3, 'three true paths registered');

    const keyOk = clueHandlers.mark_clue_status({ id: 'c1', status: 'key', note: 'test' });
    assert(keyOk.includes('已更新'), 'key clue allowed with 3 true paths');

    const falseBefore = clueState.kpEngine.scenePaths.falsePathCount;
    clueHandlers.add_clue({ id: 'f1', title: '假线索', content: '矛盾', type: 'misleading' });
    assert.strictEqual(clueState.kpEngine.scenePaths.falsePathCount, falseBefore + 1, 'false clue increments falsePathCount');
    assert.strictEqual(clueState.kpEngine.scenePaths.truePathCount, 3, 'false clue does not increment truePathCount');

    // ── AUDIT-P1-14: narrativeListener KP gating & conservative movement ──
    global.window.Vue = {
        reactive: (x) => x,
        ref: (v) => ({ value: v }),
        computed: () => ({ get value() { return null; } }),
        nextTick: (fn) => { if (fn) fn(); return Promise.resolve(); },
        watch: () => {}
    };
    global.window.document = global.window.document || {
        getElementById: () => ({ scrollTop: 0, scrollHeight: 0 }),
        createElement: () => ({ style: {}, appendChild() {}, click() {} }),
        body: { appendChild() {}, removeChild() {} },
        addEventListener() {}
    };
    global.window.CoCKpConfig = { getKpEngine: () => KpExecutionEngine };
    const { CoCEngine } = await imp('js/coc.mjs');
    const { CoCToolDefinitions } = await imp('js/tools/definitions.mjs');
    const { CoCToolHandlers } = await imp('js/tools/handlers/index.mjs');
    const { CoCStateCore } = await imp('js/state/core.mjs');
    const { CoCStateUI } = await imp('js/state/ui.mjs');
    const { CoCStateGameplay } = await imp('js/state/gameplay.mjs');
    const { CoCStatePersistence } = await imp('js/state/persistence.mjs');
    const { CoCAIPromptConfig } = await imp('js/data/ai_prompt_config.mjs');
    Object.assign(global.window, {
        CoCEngine, CoCToolDefinitions, CoCToolHandlers,
        CoCStateCore, CoCStateUI, CoCStateGameplay, CoCStatePersistence, CoCAIPromptConfig
    });
    const { CoCState } = await imp('js/state/state.mjs');
    global.window.CoCState = CoCState;
    const { CoCAI } = await imp('js/ai_logic.mjs');

    const nlState = CoCState.gameState;
    setKpEngineEnabled(nlState, true);
    ensureKpEngine(nlState);
    KpExecutionEngine.initScenePaths(nlState, '书房');
    nlState.clueBoard.clues = [];
    nlState.chatHistory = [];
    nlState.currentLocation = '书房';
    nlState.sceneMap = {
        title: '庄园',
        currentRoomId: 'r_study',
        rooms: [
            { id: 'r_study', name: '书房', status: 'current' },
            { id: 'r_hall', name: '昏暗走廊', status: 'unexplored' }
        ]
    };

    const cluesBefore = nlState.clueBoard.clues.length;
    CoCAI.narrativeListener('你发现了一张带血的纸条线索。');
    assert.strictEqual(nlState.clueBoard.clues.length, cluesBefore + 1, 'narrativeListener adds clue when KP allows');

    const afterFirst = nlState.clueBoard.clues.length;
    CoCAI.narrativeListener('调查员找到一把古旧钥匙物品。');
    assert.strictEqual(nlState.clueBoard.clues.length, afterFirst, 'duplicate KP path type blocked for auto clue');

    const locBeforeSensory = nlState.currentLocation;
    CoCAI.narrativeListener('你听到了走廊深处传来的异常声音。');
    assert.strictEqual(nlState.currentLocation, locBeforeSensory, 'sensory regex does not auto-move');

    CoCAI.narrativeListener('调查员走进昏暗走廊。');
    assert.strictEqual(nlState.currentLocation, '昏暗走廊', 'explicit movement verb updates position');

    console.log('kp_execution_smoke: all assertions passed');
}

run().catch((e) => {
    console.error('kp_execution_smoke FAILED:', e);
    process.exit(1);
});
