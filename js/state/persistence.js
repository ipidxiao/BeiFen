// GENERATED from js/state/persistence.mjs — do not edit; run: npm run build:js
// ===============================================
// 归属：【程序】 引擎核心 / AI调度 / 状态管理
// 美术/策划/QA 请勿直接修改此文件
// 修改后放入 roles/programmer/ 运行 merge.py 合并
// ===============================================

function _applyKpPreferenceToGameState(gameState) {
    const cfg = typeof window !== 'undefined' && window.CoCKpConfig;
    if (cfg && cfg.applyKpPreferenceToGameState) cfg.applyKpPreferenceToGameState(gameState);
}

function _saveKpPreference(moduleId, enabled) {
    const cfg = typeof window !== 'undefined' && window.CoCKpConfig;
    if (cfg && cfg.saveKpPreference) cfg.saveKpPreference(moduleId, enabled);
}

const SAVE_SCHEMA_VERSION = 7;
    const SAVE_IDB_THRESHOLD_BYTES = 512 * 1024;
    const SAVE_IDB_QUOTA_RATIO = 0.85;
/**
 * CoC State Persistence — save/load, migration, module management, storage estimation.
 *
 * Factory receives core + ui helpers, returns all persistence methods.
 */
window.CoCStatePersistence = (function() {
    const LOCAL_STORAGE_QUOTA_ESTIMATE_BYTES = 5 * 1024 * 1024;
    const MOD_LIST_KEY = 'coc_module_list';
    const MOD_META_PRE = 'coc_module_';

    const create = function(core, ui) {
        const { gameState, switchScreen } = core;
        const { showToast, _safeLocalStorageSetItem, _pushSystemNotice, compactChatHistory, _formatStorageError } = ui;

        const _getModSavePrefix = () => {
            const id = gameState.activeModuleId || 'default';
            return id === 'default' ? 'coc_save_' : `coc_module_${id}_save_`;
        };

        const _ensureModList = () => {
            try {
                const raw = localStorage.getItem(MOD_LIST_KEY);
                if (!raw) {
                    _safeLocalStorageSetItem(MOD_LIST_KEY, JSON.stringify(['default']), '模组列表初始化');
                    _safeLocalStorageSetItem(MOD_META_PRE + 'default_meta', JSON.stringify({ name: '默认模组', createdAt: new Date().toISOString() }), '默认模组初始化');
                }
            } catch(e) {}
        };

        // ── Module CRUD ──
        const getModules = () => {
            _ensureModList();
            try {
                const list = safeJsonParse(localStorage.getItem(MOD_LIST_KEY), ['default']);
                return list.map(id => {
                    try {
                        const meta = safeJsonParse(localStorage.getItem(MOD_META_PRE + id + '_meta'), {});
                        const savePrefix = id === 'default' ? 'coc_save_' : `coc_module_${id}_save_`;
                        let autoSave = null;
                        try { const raw = localStorage.getItem(savePrefix + 'auto'); if (raw) { const s = migrateSaveData(safeJsonParse(raw, null)); autoSave = s ? { charNames: s.charNames, location: s.location, savedAt: s.savedAt ? new Date(s.savedAt).toLocaleString('zh-CN') : '?' } : null; } } catch(e) {}
                        const hasAnySave = !!localStorage.getItem(savePrefix + 'auto') || !!localStorage.getItem(savePrefix + 'slot1');
                        return { id, name: meta.name || '未命名模组', createdAt: meta.createdAt, lastPlayed: meta.lastPlayed, autoSave, hasAnySave };
                    } catch(e) { return { id, name: id === 'default' ? '默认模组' : id, hasAnySave: false }; }
                });
            } catch(e) { return [{ id: 'default', name: '默认模组', hasAnySave: false }]; }
        };

        const createModule = (name) => {
            _ensureModList();
            const id = 'mod' + Date.now();
            try {
                const list = safeJsonParse(localStorage.getItem(MOD_LIST_KEY), ['default']);
                list.push(id);
                _safeLocalStorageSetItem(MOD_LIST_KEY, JSON.stringify(list), '模组列表保存');
                _safeLocalStorageSetItem(MOD_META_PRE + id + '_meta', JSON.stringify({ name: name || '新模组', createdAt: new Date().toISOString() }), '模组元数据保存');
            } catch(e) {}
            return id;
        };

        const renameModule = (id, newName) => {
            try {
                const meta = safeJsonParse(localStorage.getItem(MOD_META_PRE + id + '_meta'), {});
                meta.name = newName;
                return _safeLocalStorageSetItem(MOD_META_PRE + id + '_meta', JSON.stringify(meta), '模组重命名');
            } catch(e) { return false; }
        };

        const deleteModule = (id) => {
            if (id === 'default') return false;
            try {
                ['auto','slot1','slot2','slot3'].forEach(k => localStorage.removeItem(`coc_module_${id}_save_${k}`));
                localStorage.removeItem(MOD_META_PRE + id + '_meta');
                const list = safeJsonParse(localStorage.getItem(MOD_LIST_KEY), []).filter(i => i !== id);
                return _safeLocalStorageSetItem(MOD_LIST_KEY, JSON.stringify(list), '模组删除');
            } catch(e) { return false; }
        };

        const enterModule = (id) => {
            gameState.activeModuleId = id;
            gameState.roster.splice(0);
            gameState.inventory.splice(0);
            gameState.storage.splice(0);
            gameState.journalLog.splice(0);
            gameState.npcRegistry.splice(0);
            gameState.diceHistory.splice(0);
            gameState.selectedCharIndex = 0;
            gameState.currentLocation = "未知的房间";
            Object.assign(gameState.combat, { active: false, round: 1, enemies: [], initiativeOrder: [], currentTurnIdx: 0, location: '', notes: '' });
            Object.assign(gameState.sceneMap, { title: '', rooms: [], currentRoomId: null });
            Object.assign(gameState.atmosphere, { level: 'calm', note: '' });
            gameState.clueBoard.clues.splice(0); gameState.clueBoard.links.splice(0);
            gameState.knownLocations.splice(0, gameState.knownLocations.length, "未知的房间");
            Object.assign(gameState.scenarioRunner, {
                active: false, scenarioId: null, scenarioTitle: '', currentNodeId: null,
                choices: [], ended: false, flags: {}, pendingBranch: null
            });
            gameState.activeCampaign = null;
            gameState.campaignArchive = null;
            if (typeof window !== 'undefined' && window.KpGameLoop && window.KpGameLoop.unregister) {
                window.KpGameLoop.unregister(gameState);
            }
            if (gameState.kpEngine) {
                Object.assign(gameState.kpEngine, {
                    systemName: 'COC_LONDON_KP_ENGINE_V2',
                    global: { attention: 0, playerPower: 0, phase: 'CALM', doomClock: 0, alertLevel: 0, knowledgeLevel: 0 },
                    rules: null,
                    sessionStartedAt: null,
                    lastEventInjectionAt: null,
                    recentInjectionTypes: [],
                    combatStrategyLog: []
                });
            }
            gameState.londonKpState = null;
            const sysPrompt = gameState.chatHistory.find(m => m.role === 'system' && m.isHidden);
            gameState.chatHistory.splice(0);
            if (sysPrompt) gameState.chatHistory.push(sysPrompt);
            try {
                const meta = safeJsonParse(localStorage.getItem(MOD_META_PRE + id + '_meta'), {});
                meta.lastPlayed = new Date().toISOString();
                _safeLocalStorageSetItem(MOD_META_PRE + id + '_meta', JSON.stringify(meta), '模组最后游玩时间');
            } catch(e) {}
            _applyKpPreferenceToGameState(gameState);
            if (gameState.kpEngine && gameState.kpEngine.enabled && typeof window !== 'undefined' && window.KpExecutionEngine) {
                window.KpExecutionEngine.loadLondonRulesPreset(gameState);
            } else if (gameState.kpEngine && !gameState.kpEngine.enabled) {
                gameState.londonKpState = null;
            }
            switchScreen('lobby');
        };

        /**
         * Normalize kpEngine on load: legacy saves without the field stay off;
         * explicit enabled true/false is preserved.
         * @param {object} rawSave
         * @param {object} d migrated.data
         */
        const migrateKpEngineField = (rawSave, d) => {
            const hadKey = rawSave.kpEngine !== undefined
                || (rawSave.data && rawSave.data.kpEngine !== undefined);
            if (!hadKey) {
                d.kpEngine = { enabled: false };
                return;
            }
            if (d.kpEngine === null || d.kpEngine === undefined) {
                d.kpEngine = { enabled: false };
                return;
            }
            if (typeof d.kpEngine === 'object') {
                d.kpEngine.enabled = d.kpEngine.enabled === undefined ? false : !!d.kpEngine.enabled;
            }
        };

        // ── Save Migration ──
        /**
         * Migrate save data from any previous schema version to the current
         * SAVE_SCHEMA_VERSION.  Handles flat→nested migration, enemy ID
         * normalization, initiative order repair, and chat history trimming.
         * @param {Object|null} save - Raw save object from localStorage or import
         * @returns {Object|null} Migrated save object, or null if invalid
         */
        const migrateSaveData = (save) => {
            if (!save || typeof save !== 'object') return null;
            const migrated = save;
            const sourceVersion = Number(migrated.version || 1);
            if (!migrated.data && (migrated.roster || migrated.chatHistory || migrated.inventory)) {
                migrated.data = {
                    roster: migrated.roster || [],
                    inventory: migrated.inventory || [],
                    storage: migrated.storage || [],
                    currentLocation: migrated.currentLocation || migrated.location || '未知的房间',
                    knownLocations: migrated.knownLocations || ['未知的房间'],
                    chatHistory: migrated.chatHistory || [],
                    journalLog: migrated.journalLog || [],
                    npcRegistry: migrated.npcRegistry || [],
                    combat: migrated.combat || { active: false, round: 1, enemies: [], initiativeOrder: [], currentTurnIdx: 0, location: '', notes: '' },
                    sceneMap: migrated.sceneMap || { title: '', rooms: [], currentRoomId: null },
                    clueBoard: migrated.clueBoard || { clues: [], links: [] },
                    diceHistory: migrated.diceHistory || [],
                    atmosphere: migrated.atmosphere || { level: 'calm', note: '' },
                    scenarioRunner: migrated.scenarioRunner || { active: false, scenarioId: null, scenarioTitle: '', currentNodeId: null, choices: [], ended: false, flags: {}, pendingBranch: null },
                    activeCampaign: migrated.activeCampaign || null,
                    campaignArchive: migrated.campaignArchive || null,
                    londonKpState: migrated.londonKpState || null,
                    kpEngine: migrated.kpEngine || null,
                    selectedCharIndex: migrated.selectedCharIndex || 0
                };
            }
            if (!migrated.data || !Array.isArray(migrated.data.roster)) return null;
            const d = migrated.data;
            d.inventory = Array.isArray(d.inventory) ? d.inventory : [];
            d.storage = Array.isArray(d.storage) ? d.storage : [];
            d.knownLocations = Array.isArray(d.knownLocations) && d.knownLocations.length ? d.knownLocations : ['未知的房间'];
            d.chatHistory = Array.isArray(d.chatHistory) ? d.chatHistory : [];
            if (window.CoCContextManager && window.CoCContextManager.trimForSave) {
                d.chatHistory = window.CoCContextManager.trimForSave(d.chatHistory).messages;
            }
            d.journalLog = Array.isArray(d.journalLog) ? d.journalLog : [];
            d.npcRegistry = Array.isArray(d.npcRegistry) ? d.npcRegistry : [];
            d.diceHistory = Array.isArray(d.diceHistory) ? d.diceHistory : [];
            d.combat = d.combat || { active: false, round: 1, enemies: [], initiativeOrder: [], currentTurnIdx: 0, location: '', notes: '' };
            d.combat.enemies = Array.isArray(d.combat.enemies) ? d.combat.enemies : [];
            d.combat.enemies.forEach((e, idx) => {
                if (!e || typeof e !== 'object') return;
                if (!e.id) e.id = `enemy_migrated_${idx}_${String(e.name || 'unknown').replace(/\s+/g, '_')}`;
                if (e.isEnemy === undefined) e.isEnemy = true;
                e.hp = Number.isFinite(Number(e.hp)) ? Number(e.hp) : 0;
                e.maxHp = Number.isFinite(Number(e.maxHp)) ? Number(e.maxHp) : Math.max(1, e.hp || 1);
                e.armor = Number.isFinite(Number(e.armor)) ? Number(e.armor) : 0;
                if (e.isDefeated === undefined) e.isDefeated = e.hp <= 0;
            });
            d.combat.initiativeOrder = Array.isArray(d.combat.initiativeOrder) ? d.combat.initiativeOrder : [];
            const enemyNamesForMigration = new Set(d.combat.enemies.map(e => e && e.name).filter(Boolean));
            const enemyIdsForMigration = new Set(d.combat.enemies.map(e => e && e.id).filter(Boolean));
            d.combat.initiativeOrder = d.combat.initiativeOrder.map((turn) => {
                if (!turn || typeof turn !== 'object') return null;
                const normalized = { ...turn };
                const matchesEnemy = normalized.isEnemy === true || enemyIdsForMigration.has(normalized.id) || enemyNamesForMigration.has(normalized.name);
                normalized.isEnemy = !!matchesEnemy;
                if (matchesEnemy) {
                    const enemy = d.combat.enemies.find(e => e && ((normalized.id && e.id === normalized.id) || (normalized.name && e.name === normalized.name)));
                    if (enemy) { normalized.id = enemy.id; normalized.name = enemy.name || normalized.name; }
                }
                if (!normalized.id && normalized.name) normalized.id = normalized.name;
                normalized.initiative = Number.isFinite(Number(normalized.initiative)) ? Number(normalized.initiative) : 0;
                return normalized;
            }).filter(Boolean);
            d.sceneMap = d.sceneMap || { title: '', rooms: [], currentRoomId: null };
            d.sceneMap.rooms = Array.isArray(d.sceneMap.rooms) ? d.sceneMap.rooms : [];
            d.clueBoard = d.clueBoard || { clues: [], links: [] };
            d.clueBoard.clues = Array.isArray(d.clueBoard.clues) ? d.clueBoard.clues : [];
            d.clueBoard.links = Array.isArray(d.clueBoard.links) ? d.clueBoard.links : [];
            d.atmosphere = d.atmosphere || { level: 'calm', note: '' };
            d.activeCampaign = d.activeCampaign || null;
            d.campaignArchive = d.campaignArchive || null;
            d.londonKpState = d.londonKpState || null;
            migrateKpEngineField(save, d);
            d.selectedCharIndex = Number.isFinite(Number(d.selectedCharIndex)) ? Math.max(0, Math.floor(Number(d.selectedCharIndex))) : 0;
            migrated.location = migrated.location || d.currentLocation || '未知的房间';
            migrated.charNames = migrated.charNames || d.roster.map(r => r && r.name).filter(Boolean).join('、');
            migrated.version = SAVE_SCHEMA_VERSION;
            migrated.sourceVersion = sourceVersion;
            return migrated;
        };

        const _buildSaveData = (slotName) => {
            const rawChatToSave = gameState.chatHistory.filter(m => !m.isLocalOnly && !m.isLocalError);
            const chatToSave = (window.CoCContextManager && window.CoCContextManager.trimForSave)
                ? window.CoCContextManager.trimForSave(rawChatToSave).messages
                : rawChatToSave;
            return {
                version: SAVE_SCHEMA_VERSION,
                savedAt: new Date().toISOString(),
                slotName: slotName || '存档',
                location: gameState.currentLocation,
                moduleId: gameState.activeModuleId,
                charNames: gameState.roster.map(r => r.name).join('、'),
                data: {
                    roster: safeJsonClone(gameState.roster, []),
                    inventory: [...gameState.inventory],
                    storage: [...gameState.storage],
                    currentLocation: gameState.currentLocation,
                    knownLocations: [...gameState.knownLocations],
                    chatHistory: safeJsonClone(chatToSave, []),
                    journalLog: safeJsonClone(gameState.journalLog, []),
                    npcRegistry: safeJsonClone(gameState.npcRegistry, []),
                    combat: safeJsonClone(gameState.combat, { active: false, round: 1, enemies: [], initiativeOrder: [], currentTurnIdx: 0, location: '', notes: '' }),
                    sceneMap: safeJsonClone(gameState.sceneMap, { title: '', rooms: [], currentRoomId: null }),
                    clueBoard: safeJsonClone(gameState.clueBoard, { clues: [], links: [] }),
                    diceHistory: safeJsonClone(gameState.diceHistory, []),
                    atmosphere: safeJsonClone(gameState.atmosphere, { level: 'calm', note: '' }),
                    scenarioRunner: safeJsonClone(gameState.scenarioRunner, { active: false, scenarioId: null, scenarioTitle: '', currentNodeId: null, choices: [], ended: false, flags: {}, pendingBranch: null }),
                    activeCampaign: gameState.activeCampaign || null,
                    campaignArchive: safeJsonClone(gameState.campaignArchive, null),
                    londonKpState: safeJsonClone(gameState.londonKpState, null),
                    kpEngine: gameState.kpEngine ? safeJsonClone({
                        enabled: gameState.kpEngine.enabled,
                        systemName: gameState.kpEngine.systemName,
                        global: gameState.kpEngine.global,
                        sessionStartedAt: gameState.kpEngine.sessionStartedAt,
                        lastEventInjectionAt: gameState.kpEngine.lastEventInjectionAt,
                        combatStrategyLog: gameState.kpEngine.combatStrategyLog
                    }, null) : null,
                    selectedCharIndex: gameState.selectedCharIndex,
                    contextMeta: { runtimeChatMessages: gameState.chatHistory.length, savedChatMessages: chatToSave.length }
                }
            };
        };

        // ── Storage Estimation ──
        const _estimateStringBytes = (value) => {
            const text = String(value ?? '');
            try { if (typeof Blob !== 'undefined') return new Blob([text]).size; } catch(e) {}
            return text.length * 2;
        };
        const formatStorageBytes = (bytes) => {
            const n = Number(bytes) || 0;
            if (n >= 1024 * 1024) return `${(n / 1024 / 1024).toFixed(2)} MB`;
            if (n >= 1024) return `${(n / 1024).toFixed(1)} KB`;
            return `${Math.round(n)} B`;
        };
        const _estimateLocalStorageUsage = () => {
            let usedBytes = 0;
            try {
                if (typeof localStorage !== 'undefined' && Number.isFinite(localStorage.length)) {
                    for (let i = 0; i < localStorage.length; i++) {
                        const key = localStorage.key(i);
                        if (key === null || key === undefined) continue;
                        const val = localStorage.getItem(key) || '';
                        usedBytes += _estimateStringBytes(key) + _estimateStringBytes(val);
                    }
                }
            } catch(e) {}
            const quotaBytes = LOCAL_STORAGE_QUOTA_ESTIMATE_BYTES;
            return { usedBytes, quotaBytes, usedRatio: quotaBytes ? usedBytes / quotaBytes : 0 };
        };
        /**
         * Estimate localStorage usage and project impact of writing a save.
         * Updates gameState.storageStatus reactively and returns a clone.
         * @param {string} [slotKey='slot1'] - Target slot key
         * @param {string} [slotName='预估存档'] - Label for the estimate
         * @param {string|null} [payloadOverride=null] - Pre-serialized payload for estimation
         * @returns {Object} storageStatus snapshot {usedBytes, quotaBytes, warning, ...}
         */
        const getStorageStatus = (slotKey = 'slot1', slotName = '预估存档', payloadOverride = null) => {
            const current = _estimateLocalStorageUsage();
            const prefix = _getModSavePrefix();
            const targetKey = prefix + (slotKey || 'slot1');
            let existingBytes = 0;
            let payload = payloadOverride;
            try {
                const oldValue = localStorage.getItem(targetKey);
                if (oldValue !== null && oldValue !== undefined) existingBytes = _estimateStringBytes(targetKey) + _estimateStringBytes(oldValue);
            } catch(e) {}
            try {
                if (payload === null || payload === undefined) payload = JSON.stringify(_buildSaveData(slotName));
            } catch(e) { payload = ''; }
            const currentSaveBytes = _estimateStringBytes(payload || '');
            const projectedBytes = Math.max(0, current.usedBytes - existingBytes) + _estimateStringBytes(targetKey) + currentSaveBytes;
            const quotaBytes = current.quotaBytes || LOCAL_STORAGE_QUOTA_ESTIMATE_BYTES;
            const projectedRatio = quotaBytes ? projectedBytes / quotaBytes : 0;
            const usedRatio = quotaBytes ? current.usedBytes / quotaBytes : 0;
            let warning = '';
            if (projectedRatio >= 0.98) warning = '本次存档预计接近 localStorage 上限，建议先导出备份并清理旧存档。';
            else if (projectedRatio >= 0.90) warning = '存储空间已高于 90%，长期战役建议导出备份。';
            else if (projectedRatio >= 0.80) warning = '存储空间已高于 80%，请关注后续自动存档。';
            Object.assign(gameState.storageStatus, {
                usedBytes: current.usedBytes, quotaBytes, usedRatio,
                currentSaveBytes, projectedBytes, projectedRatio, warning, lastCheckedAt: Date.now()
            });
            return safeJsonClone(gameState.storageStatus, { usedBytes: 0, quotaBytes, usedRatio: 0, currentSaveBytes, projectedBytes, projectedRatio, warning, lastCheckedAt: Date.now() });
        };

        // ── Save / Load / Delete ──
        const _restoreFromData = (save, slotName) => {
            save = migrateSaveData(save);
            if (!save) return false;
            const d = save.data;
            if (!d || !d.roster) return false;
            gameState.roster.splice(0, gameState.roster.length, ...d.roster);
            gameState.inventory.splice(0, gameState.inventory.length, ...(d.inventory || []));
            gameState.storage.splice(0, gameState.storage.length, ...(d.storage || []));
            if (d.currentLocation) gameState.currentLocation = d.currentLocation;
            if (d.knownLocations) gameState.knownLocations.splice(0, gameState.knownLocations.length, ...d.knownLocations);
            if (d.journalLog) gameState.journalLog.splice(0, gameState.journalLog.length, ...d.journalLog);
            if (d.npcRegistry) gameState.npcRegistry.splice(0, gameState.npcRegistry.length, ...d.npcRegistry);
            if (d.combat) Object.assign(gameState.combat, d.combat);
            if (d.sceneMap) Object.assign(gameState.sceneMap, d.sceneMap);
            if (d.clueBoard) Object.assign(gameState.clueBoard, d.clueBoard);
            if (d.diceHistory) gameState.diceHistory.splice(0, gameState.diceHistory.length, ...d.diceHistory);
            if (d.atmosphere) Object.assign(gameState.atmosphere, d.atmosphere);
            if (d.scenarioRunner) Object.assign(gameState.scenarioRunner, d.scenarioRunner);
            else Object.assign(gameState.scenarioRunner, { active: false, scenarioId: null, scenarioTitle: '', currentNodeId: null, choices: [], ended: false, flags: {}, pendingBranch: null });
            gameState.activeCampaign = d.activeCampaign || null;
            gameState.campaignArchive = d.campaignArchive ? safeJsonClone(d.campaignArchive, null) : null;
            gameState.londonKpState = d.londonKpState ? safeJsonClone(d.londonKpState, null) : null;
            gameState.kpEngine = d.kpEngine ? safeJsonClone(d.kpEngine, null) : gameState.kpEngine;
            if (gameState.kpEngine) {
                _saveKpPreference(gameState.activeModuleId, gameState.kpEngine.enabled);
            }
            if (gameState.kpEngine && gameState.kpEngine.enabled && typeof window !== 'undefined' && window.KpExecutionEngine) {
                window.KpExecutionEngine.loadLondonRulesPreset(gameState);
            } else if (gameState.kpEngine && !gameState.kpEngine.enabled) {
                gameState.londonKpState = null;
            }
            gameState.selectedCharIndex = d.selectedCharIndex || 0;
            clampSelectedCharIndex(gameState);
            if (core && core.cleanupInitiativeOrder) core.cleanupInitiativeOrder();
            else if (window.CoCState && window.CoCState.cleanupInitiativeOrder) window.CoCState.cleanupInitiativeOrder();
            const sysPrompt = gameState.chatHistory.find(m => m.role === 'system' && m.isHidden);
            gameState.chatHistory.splice(0, gameState.chatHistory.length);
            if (sysPrompt) gameState.chatHistory.push(sysPrompt);
            const savedChat = (d.chatHistory || []).filter(m => !(m.role === 'system' && m.isHidden));
            gameState.chatHistory.push(...savedChat);
            gameState.chatHistory.push({ role: 'system', isLocalOnly: true, content: `📂 [存档] 已载入"${slotName || save.slotName}"（保存于 ${save.savedAt ? new Date(save.savedAt).toLocaleString('zh-CN') : '未知时间'}）` });
            compactChatHistory('load');
            return true;
        };

        /**
         * Save current game state to localStorage under the given slot key.
         * Runs chat compaction first, estimates storage impact, and warns
         * if approaching quota limits.
         * @param {string} slotKey - Save slot key ('auto', 'slot1', 'slot2', 'slot3')
         * @param {string} slotName - Human-readable slot name
         * @returns {boolean} true on success
         */

        // ── IndexedDB async storage (non-blocking) ──
        const _idbName = 'coc-engine-saves';
        const _idbVersion = 1;
        let _idb = null;
        const _openIDB = () => {
            if (_idb) return Promise.resolve(_idb);
            return new Promise((resolve, reject) => {
                if (typeof indexedDB === 'undefined') return reject(new Error('IndexedDB not available'));
                const req = indexedDB.open(_idbName, _idbVersion);
                req.onupgradeneeded = (e) => {
                    const db = e.target.result;
                    if (!db.objectStoreNames.contains('saves')) {
                        db.createObjectStore('saves', { keyPath: 'slotKey' });
                    }
                };
                req.onsuccess = (e) => { _idb = e.target.result; resolve(_idb); };
                req.onerror = () => reject(req.error);
            });
        };
        const _idbSave = async (slotKey, payload) => {
            try {
                const db = await _openIDB();
                return new Promise((resolve, reject) => {
                    const tx = db.transaction('saves', 'readwrite');
                    tx.objectStore('saves').put({ slotKey, payload, savedAt: Date.now() });
                    tx.oncomplete = () => resolve(true);
                    tx.onerror = () => reject(tx.error);
                });
            } catch(e) { return false; }
        };
        const _idbLoad = async (slotKey) => {
            try {
                const db = await _openIDB();
                return new Promise((resolve, reject) => {
                    const tx = db.transaction('saves', 'readonly');
                    const req = tx.objectStore('saves').get(slotKey);
                    req.onsuccess = () => resolve(req.result ? req.result.payload : null);
                    req.onerror = () => reject(req.error);
                });
            } catch(e) { return null; }
        };
        const _idbDelete = async (slotKey) => {
            try {
                const db = await _openIDB();
                return new Promise((resolve, reject) => {
                    const tx = db.transaction('saves', 'readwrite');
                    tx.objectStore('saves').delete(slotKey);
                    tx.oncomplete = () => resolve(true);
                    tx.onerror = () => reject(tx.error);
                });
            } catch(e) { return false; }
        };

        const _idbCache = {};
        let _idbCachePrimed = false;
        const _primeIdbCache = () => {
            if (_idbCachePrimed) return;
            _idbCachePrimed = true;
            _openIDB().then((db) => {
                const tx = db.transaction('saves', 'readonly');
                const req = tx.objectStore('saves').openCursor();
                req.onsuccess = (e) => {
                    const cursor = e.target.result;
                    if (!cursor) return;
                    _idbCache[cursor.value.slotKey] = cursor.value.payload;
                    cursor.continue();
                };
            }).catch(() => {});
        };
        _primeIdbCache();

        const _shouldArchiveToIdb = (payloadBytes, projectedRatio) => {
            const bytes = Number(payloadBytes) || 0;
            const ratio = Number(projectedRatio) || 0;
            return bytes >= SAVE_IDB_THRESHOLD_BYTES || ratio >= SAVE_IDB_QUOTA_RATIO;
        };

        const saveGame = (slotKey, slotName) => {
            try {
                compactChatHistory('save');
                const payload = JSON.stringify(_buildSaveData(slotName));
                const storageReport = getStorageStatus(slotKey, slotName, payload);
                if (storageReport.warning) showToast(storageReport.warning, 'warning', { timeout: 7000 });
                const ok = _safeLocalStorageSetItem(_getModSavePrefix() + slotKey, payload, '存档');
                const archiveToIdb = _shouldArchiveToIdb(storageReport.currentSaveBytes, storageReport.projectedRatio);
                if (archiveToIdb || !ok) {
                    const fullKey = _getModSavePrefix() + slotKey;
                    _idbSave(fullKey, payload).then((saved) => {
                        if (saved) _idbCache[fullKey] = payload;
                    }).catch((e) => { try { showToast('IndexedDB 备份失败（不影响游戏）：' + (e && e.message ? e.message : '未知错误'), 'warning', { timeout: 5000 }); } catch(_) {} });
                }
                getStorageStatus(slotKey, slotName, payload);
                return ok;
            } catch(e) {
                const msg = _formatStorageError(e, '存档失败');
                console.error(msg, e);
                _pushSystemNotice(`💾 [存档失败] ${msg}`, true);
                showToast(msg, 'danger');
                return false;
            }
        };

        /**
         * Load a saved game from localStorage and restore all state.
         * @param {string} slotKey - Save slot key to load from
         * @returns {boolean} true if loaded successfully
         */
        const loadGame = (slotKey) => {
            try {
                const fullKey = _getModSavePrefix() + slotKey;
                const raw = localStorage.getItem(fullKey);
                if (raw) return _restoreFromData(safeJsonParse(raw, null));
                const cached = _idbCache[fullKey];
                if (cached) {
                    const ok = _restoreFromData(safeJsonParse(cached, null));
                    if (ok) showToast('已从 IndexedDB 备份恢复存档。', 'info');
                    return ok;
                }
                _idbLoad(fullKey).then((payload) => {
                    if (payload) _idbCache[fullKey] = payload;
                }).catch(() => {});
                return false;
            } catch(e) { return false; }
        };

        const deleteSave = (slotKey) => {
            try {
                const fullKey = _getModSavePrefix() + slotKey;
                localStorage.removeItem(fullKey);
                delete _idbCache[fullKey];
                _idbDelete(fullKey).catch(() => {});
                getStorageStatus(slotKey, '预估存档');
                return true;
            } catch(e) { return false; }
        };

        const getSaveSlots = () => {
            const prefix = _getModSavePrefix();
            return ['slot1','slot2','slot3'].map((key, i) => {
                try {
                    const raw = localStorage.getItem(prefix + key);
                    if (!raw) return { key, label: '槽位 ' + (i+1), hasData: false };
                    const s = migrateSaveData(safeJsonParse(raw, null));
                    if (!s) return { key, label: '槽位 ' + (i+1), hasData: false };
                    return { key, label: '槽位 ' + (i+1), hasData: true, charNames: s.charNames, location: s.location, savedAt: s.savedAt ? new Date(s.savedAt).toLocaleString('zh-CN') : '?', slotName: s.slotName };
                } catch(e) { return { key, label: '槽位 ' + (i+1), hasData: false }; }
            });
        };

        const getAutoSave = () => {
            try {
                const raw = localStorage.getItem(_getModSavePrefix() + 'auto');
                if (!raw) return null;
                const s = migrateSaveData(safeJsonParse(raw, null));
                if (!s) return null;
                return { key: 'auto', hasData: true, charNames: s.charNames, location: s.location, savedAt: s.savedAt ? new Date(s.savedAt).toLocaleString('zh-CN') : '?', slotName: s.slotName };
            } catch(e) { return null; }
        };

        const exportGame = () => {
            try {
                const saveData = _buildSaveData('导出存档');
                const blob = new Blob([JSON.stringify(saveData, null, 2)], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                const name = gameState.roster.map(r => r.name).join('_') || '调查员';
                const modMeta = safeJsonParse(localStorage.getItem(MOD_META_PRE + gameState.activeModuleId + '_meta'), {});
                a.download = 'CoC_' + (modMeta.name || '模组') + '_' + name + '_' + new Date().toLocaleDateString('zh-CN').replace(/\//g,'-') + '.json';
                document.body.appendChild(a); a.click();
                setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 100);
            } catch(e) { showToast('导出失败：' + (e && e.message ? e.message : e), 'danger'); }
        };

        const importGame = (file) => {
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = (e) => {
                    try {
                        const save = migrateSaveData(safeJsonParse(e.target.result, null));
                        if (!save || !save.data) return reject('文件格式不对，非CoC存档文件。');
                        const ok = _restoreFromData(save, save.slotName);
                        ok ? resolve() : reject('数据恢复失败');
                    } catch(err) { reject('解析失败: ' + err.message); }
                };
                reader.onerror = () => reject('文件读取失败');
                reader.readAsText(file);
            });
        };

        return { formatStorageBytes, getStorageStatus, saveGame, loadGame, deleteSave,
                 getSaveSlots, getAutoSave, exportGame, importGame,
                 getModules, createModule, renameModule, deleteModule, enterModule,
                 migrateSaveData, _buildSaveData, _restoreFromData,
                 _shouldArchiveToIdb, SAVE_IDB_THRESHOLD_BYTES, SAVE_IDB_QUOTA_RATIO };
    };
    return { create };
})();
