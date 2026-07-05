// Save fixture migration smoke — loads v1–v7 JSON through migrate/restore path
const fs = require('fs');
const path = require('path');
const assert = require('assert');
const { createVmSandbox, loadCoreEngineStack } = require('./helpers/vm_sandbox');

const ROOT = path.join(__dirname, '..');
const FIXTURES_DIR = path.join(__dirname, 'fixtures', 'saves');

const FIXTURES = [
    { file: 'v1_flat_minimal.json', sourceVersion: 1, expectKpDisabled: true },
    { file: 'v2_with_kp_engine.json', sourceVersion: 2, expectKpEnabled: true },
    { file: 'v3_with_scene_map.json', sourceVersion: 3, expectSceneMap: true },
    { file: 'v4_with_clue_board.json', sourceVersion: 4, expectClues: true },
    { file: 'v5_with_atmosphere.json', sourceVersion: 5, expectAtmosphere: true },
    { file: 'v6_with_context_meta.json', sourceVersion: 6, expectContextMeta: true },
    { file: 'v7_current_schema.json', sourceVersion: 7, expectCombat: true },
];

const { sandbox, store } = createVmSandbox();
loadCoreEngineStack(sandbox, ROOT);

const state = sandbox.window.CoCState;
assert(state && state.__testing, 'CoCState exposes __testing helpers');

(async () => {
    for (const spec of FIXTURES) {
        const raw = JSON.parse(fs.readFileSync(path.join(FIXTURES_DIR, spec.file), 'utf8'));
        const migrated = state.__testing.migrateSaveData(raw);
        assert(migrated, `${spec.file} migrates`);
        assert.strictEqual(migrated.version, 7, `${spec.file} → schema 7`);
        assert.strictEqual(migrated.sourceVersion, spec.sourceVersion, `${spec.file} preserves sourceVersion`);
        assert(Array.isArray(migrated.data.roster), `${spec.file} roster array`);
        assert(Array.isArray(migrated.data.inventory), `${spec.file} inventory array`);
        assert(Array.isArray(migrated.data.storage), `${spec.file} storage array`);
        assert(Number.isInteger(migrated.data.selectedCharIndex), `${spec.file} selectedCharIndex int`);

        if (spec.expectKpDisabled) {
            assert.strictEqual(migrated.data.kpEngine.enabled, false, `${spec.file} kpEngine off when absent in v1 flat`);
        }
        if (spec.expectKpEnabled) {
            assert.strictEqual(migrated.data.kpEngine.enabled, true, `${spec.file} kpEngine preserved`);
        }
        if (spec.expectSceneMap) {
            assert(migrated.data.sceneMap.rooms.length >= 1, `${spec.file} sceneMap rooms`);
            const sp = migrated.data.kpEngine?.scenePaths;
            assert(sp && Array.isArray(sp.paths), `${spec.file} scenePaths object schema`);
            assert(Number.isInteger(sp.truePathCount), `${spec.file} scenePaths.truePathCount`);
            assert(Number.isInteger(sp.falsePathCount), `${spec.file} scenePaths.falsePathCount`);
        }
        if (spec.expectClues) {
            assert(migrated.data.clueBoard.clues.length >= 1, `${spec.file} clueBoard clues`);
        }
        if (spec.expectAtmosphere) {
            assert.strictEqual(migrated.data.atmosphere.level, 'tense', `${spec.file} atmosphere`);
        }
        if (spec.expectContextMeta) {
            assert(migrated.data.contextMeta, `${spec.file} contextMeta survives migration`);
        }
        if (spec.expectCombat) {
            assert.strictEqual(migrated.data.combat.active, true, `${spec.file} combat active`);
            assert(migrated.data.combat.enemies[0].id, `${spec.file} enemy id`);
            const sp = migrated.data.kpEngine?.scenePaths;
            assert(sp && Array.isArray(sp.paths), `${spec.file} kpEngine.scenePaths normalized`);
        }

        store.set('coc_save_slot1', JSON.stringify(raw));
        assert.strictEqual(await state.loadGame('slot1'), true, `${spec.file} loadGame succeeds`);
        assert.strictEqual(state.saveGame('slot2', `roundtrip ${spec.file}`), true, `${spec.file} save roundtrip`);
        const roundtrip = JSON.parse(store.get('coc_save_slot2'));
        assert.strictEqual(roundtrip.version, 7, `${spec.file} roundtrip schema 7`);
    }

    // Legacy array scenePaths must not crash migrate/load
    const arrayScenePaths = {
        version: 7,
        savedAt: '2020-01-01T00:00:00.000Z',
        slotName: 'array scenePaths',
        location: '大厅',
        charNames: 'Bob',
        data: {
            roster: [{
                name: 'Bob', isActive: true, hp: 10, sanity: 50,
                attrs: { DEX: 50 }, derived: { hp: 10, maxHp: 10, db: '0' },
                equipment: {}, skillAllocations: {}
            }],
            inventory: [], storage: [], currentLocation: '大厅', knownLocations: ['大厅'],
            chatHistory: [], journalLog: [], npcRegistry: [],
            combat: { active: false, round: 1, enemies: [], initiativeOrder: [], currentTurnIdx: 0, location: '', notes: '' },
            sceneMap: { title: '', rooms: [], currentRoomId: null },
            kpEngine: {
                enabled: true,
                scenePaths: [{ from: 'a', to: 'b', label: 'legacy array' }]
            },
            selectedCharIndex: 0
        }
    };
    const arrayMigrated = state.__testing.migrateSaveData(arrayScenePaths);
    assert(arrayMigrated, 'array scenePaths migrates');
    assert(Array.isArray(arrayMigrated.data.kpEngine.scenePaths.paths), 'array scenePaths → paths[]');
    assert.strictEqual(arrayMigrated.data.kpEngine.scenePaths.truePathCount, 1, 'array scenePaths truePathCount');
    store.set('coc_save_slot1', JSON.stringify(arrayScenePaths));
    assert.strictEqual(await state.loadGame('slot1'), true, 'array scenePaths loadGame');

    console.log(`save_migration_smoke: ${FIXTURES.length} fixtures + array scenePaths passed`);
})().catch((err) => { console.error(err); process.exit(1); });
