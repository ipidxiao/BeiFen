// IndexedDB backup threshold + AI difficulty preset smoke (ESM)
import './helpers/browser-mock.mjs';
import { strict as assert } from 'node:assert';
import { CoCStatePersistence } from '../js/state/persistence.mjs';
import { CoCAIPromptConfig } from '../js/data/ai_prompt_config.mjs';

const persistApi = CoCStatePersistence.create(
    { gameState: { activeModuleId: 'default', roster: [], inventory: [], storage: [], journalLog: [], npcRegistry: [], diceHistory: [], chatHistory: [], currentLocation: '', knownLocations: [], combat: {}, sceneMap: {}, clueBoard: {}, atmosphere: {}, scenarioRunner: {}, selectedCharIndex: 0, storageStatus: {} }, switchScreen() {} },
    { showToast() {}, _safeLocalStorageSetItem() { return true; }, _pushSystemNotice() {}, compactChatHistory() {}, _formatStorageError(e) { return String(e); } }
);

assert(persistApi._shouldArchiveToIdb(600 * 1024, 0.1), 'large save triggers IDB archive');
assert(!persistApi._shouldArchiveToIdb(100 * 1024, 0.5), 'small save below threshold skips IDB');
assert(persistApi._shouldArchiveToIdb(100 * 1024, 0.9), 'high quota ratio triggers IDB archive');
assert.strictEqual(persistApi.SAVE_IDB_THRESHOLD_BYTES, 512 * 1024);

const brutal = CoCAIPromptConfig.buildSystemInjection('测试小队', 'brutal');
const standard = CoCAIPromptConfig.buildSystemInjection('测试小队', 'standard');
assert(brutal.includes('致命'), 'brutal preset injects difficulty text');
assert(!standard.includes('【守秘人难度：致命】'), 'standard preset has no brutal injection');
assert.strictEqual(CoCAIPromptConfig.DIFFICULTY_PRESETS.merciful.label, '仁慈');

console.log('idb_backup_smoke: OK');
