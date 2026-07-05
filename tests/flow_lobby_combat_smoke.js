// Flow smoke: lobby → enterModule → start_combat → save → load (Node VM, no browser)
const assert = require('assert');
const path = require('path');
const { createVmSandbox, loadCoreEngineStack } = require('./helpers/vm_sandbox');

const ROOT = path.join(__dirname, '..');
const { sandbox, store } = createVmSandbox();
loadCoreEngineStack(sandbox, ROOT);

const state = sandbox.window.CoCState;
const handlers = sandbox.window.CoCToolHandlers.create(state, sandbox.window.CoCEngine);

state.gameState.roster.splice(0, state.gameState.roster.length,
    {
        name: 'Investigator',
        isActive: true,
        hp: 10,
        sanity: 50,
        attrs: { DEX: 60, CON: 50, SIZ: 50, POW: 50 },
        derived: { hp: 10, maxHp: 10, db: '0' },
        equipment: { weapon: '左轮手枪 [弹药:2]' },
        skillAllocations: { '手枪': 90, '侦查': 60 },
    }
);

(async () => {
    // Lobby: enter a fresh module (resets runtime state)
    const modId = state.createModule('E2E Flow Module');
    state.enterModule(modId);
    assert.strictEqual(state.gameState.activeModuleId, modId, 'enterModule sets active module');
    assert.strictEqual(state.gameState.combat.active, false, 'enterModule clears combat');
    assert.strictEqual(state.gameState.currentScreen, 'lobby', 'enterModule lands on lobby');

    // Add investigator after module reset
    state.gameState.roster.push({
        name: 'Investigator',
        isActive: true,
        hp: 10,
        sanity: 50,
        attrs: { DEX: 60, CON: 50, SIZ: 50, POW: 50 },
        derived: { hp: 10, maxHp: 10, db: '0' },
        equipment: { weapon: '左轮手枪 [弹药:2]' },
        skillAllocations: { '手枪': 90, '侦查': 60 },
    });
    state.gameState.currentLocation = '废弃仓库';

    // Combat: start via handler (same path as AI tool dispatch)
    handlers.start_combat({
        enemies: [{ name: 'Cultist', hp: 14, maxHp: 14, armor: 0 }],
        location: '废弃仓库',
        notes: 'flow smoke',
    });
    assert.strictEqual(state.gameState.combat.active, true, 'start_combat activates combat');
    assert(state.gameState.combat.enemies.length >= 1, 'start_combat spawns enemies');
    assert.strictEqual(state.gameState.combat.enemies[0].isEnemy, true, 'enemy flagged isEnemy');
    const enemyName = state.gameState.combat.enemies[0].name;

    // Persist combat state
    assert.strictEqual(state.saveGame('slot1', 'flow-combat'), true, 'saveGame during combat');
    const savedRaw = JSON.parse(store.get(`coc_module_${modId}_save_slot1`));
    assert.strictEqual(savedRaw.version, 7, 'saved schema v7');
    assert.strictEqual(savedRaw.data.combat.active, true, 'saved combat active');

    // Wipe runtime and reload
    Object.assign(state.gameState.combat, { active: false, round: 1, enemies: [], initiativeOrder: [], currentTurnIdx: 0, location: '', notes: '' });
    state.gameState.roster.splice(0);
    assert.strictEqual(await state.loadGame('slot1'), true, 'loadGame restores combat save');
    assert.strictEqual(state.gameState.combat.active, true, 'loaded combat active');
    assert(state.gameState.combat.enemies.some((e) => e.name === enemyName), 'loaded enemy roster');
    assert(state.gameState.roster.some((c) => c.name === 'Investigator'), 'loaded investigator roster');
    assert.strictEqual(state.gameState.currentLocation, '废弃仓库', 'loaded location');

    console.log('flow_lobby_combat_smoke: lobby → combat → save → load passed');
})().catch((err) => { console.error(err); process.exit(1); });
