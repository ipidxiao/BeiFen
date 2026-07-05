// ===============================================
// 归属：【程序】 引擎核心 / AI调度 / 状态管理
// 美术/策划/QA 请勿直接修改此文件
// 修改后放入 roles/programmer/ 运行 merge.py 合并
// ===============================================

import { safeJsonParse, safeJsonClone } from '../data/utils.mjs';
import { CoCStateCore } from './core.mjs';
import { CoCStateUI } from './ui.mjs';
import { CoCStateGameplay } from './gameplay.mjs';
import { CoCStatePersistence } from './persistence.mjs';

/**
 * CoC State — unified entry point.
 *
 * Creates reactive state via CoCStateCore, then composes UI, gameplay,
 * and persistence modules.  The final public API is backward-compatible
 * with the pre-split monolithic state.js.
 */

/**
 * @role    程序员 (Programmer)
 * @owner   引擎核心 / AI调度 / 状态管理
 * @caution 策划/美术请勿直接修改此文件
 */
export const CoCState = (function(Vue) {
    if (!Vue) return {};

    // 1. Core: reactive objects + basic navigation
    const core = CoCStateCore;
    if (!core || !core.gameState) return {};

    // 2. UI: toast/confirm/compaction
    const uiMod = (CoCStateUI && CoCStateUI.create) ? CoCStateUI.create(core) : {};

    // 3. Gameplay: combat/dice/clues/map/growth/NPC
    const gpMod = (CoCStateGameplay && CoCStateGameplay.create) ? CoCStateGameplay.create(core) : {};

    // 4. Persistence: save/load/migration/modules
    const persistMod = (CoCStatePersistence && CoCStatePersistence.create) ? CoCStatePersistence.create(core, uiMod) : {};

    // Merge all public methods
    const api = {
        ...core,
        ...uiMod,
        ...gpMod,
        ...persistMod,
    };

    const { gameState, playerInput, draftChar, activeCreatorTab, scrollToBottom } = core;
    const { compactChatHistory, _pushSystemNotice } = uiMod;
    const { cleanupInitiativeOrder } = gpMod;
    const { saveGame } = persistMod;

    // ── Watchers ──
    let _autoSaveTimer = null;
    Vue.watch(
        () => [gameState.roster.length, gameState.inventory.length, gameState.currentLocation],
        () => {
            if (gameState.roster.length === 0 || gameState.currentScreen !== 'story') return;
            clearTimeout(_autoSaveTimer);
            _autoSaveTimer = setTimeout(() => saveGame('auto', '自动存档'), 8000);
        }
    );

    Vue.watch(
        () => gameState.chatHistory.length,
        (len) => { if (len > 280) compactChatHistory('watch'); }
    );

    Vue.watch(
        () => gameState.roster.map(c => `${c && c.name}:${c && c.isActive}`).join('|') + `:${gameState.roster.length}`,
        () => { clampSelectedCharIndex(gameState); cleanupInitiativeOrder(); }
    );

    // ── Startup init ──
    if (persistMod._ensureModList) persistMod._ensureModList();
    try {
        const modList = safeJsonParse(localStorage.getItem('coc_module_list'), ['default']);
        if (modList.length <= 1) {
            gameState.activeModuleId = modList[0] || 'default';
            gameState.currentScreen = 'lobby';
        }
    } catch(e) { gameState.currentScreen = 'lobby'; }

    // ── Public API (backward-compatible) ──
    return {
        gameState, playerInput, draftChar, activeCreatorTab,
        scrollToBottom: core.scrollToBottom,
        switchScreen: core.switchScreen,
        showModal: core.showModal,
        closeModal: core.closeModal,
        showToast: uiMod.showToast,
        confirmAction: uiMod.confirmAction,
        resolveConfirm: uiMod.resolveConfirm,
        compactChatHistory: uiMod.compactChatHistory,
        saveSettings: uiMod.saveSettings,
        formatText: uiMod.formatText,
        formatStorageBytes: persistMod.formatStorageBytes,
        getStorageStatus: persistMod.getStorageStatus,
        saveGame: persistMod.saveGame,
        loadGame: persistMod.loadGame,
        deleteSave: persistMod.deleteSave,
        getSaveSlots: persistMod.getSaveSlots,
        getAutoSave: persistMod.getAutoSave,
        exportGame: persistMod.exportGame,
        importGame: persistMod.importGame,
        getModules: persistMod.getModules,
        createModule: persistMod.createModule,
        renameModule: persistMod.renameModule,
        deleteModule: persistMod.deleteModule,
        enterModule: persistMod.enterModule,
        addJournalEntry: core.addJournalEntry,
        addNpc: gpMod.addNpc,
        updateNpcStatus: gpMod.updateNpcStatus,
        addNpcNote: gpMod.addNpcNote,
        startCombat: gpMod.startCombat,
        endCombat: gpMod.endCombat,
        updateEnemy: gpMod.updateEnemy,
        advanceTurn: gpMod.advanceTurn,
        cleanupInitiativeOrder: gpMod.cleanupInitiativeOrder,
        clampSelectedCharIndex: (gs) => clampSelectedCharIndex(gs),
        rollImprovement: gpMod.rollImprovement,
        rollEduImprovement: gpMod.rollEduImprovement,
        applyAging: gpMod.applyAging,
        clearSessionSkills: gpMod.clearSessionSkills,
        removeCharacterAt: gpMod.removeCharacterAt,
        createMap: gpMod.createMap,
        updateRoom: gpMod.updateRoom,
        setPosition: gpMod.setPosition,
        addClue: gpMod.addClue,
        linkClues: gpMod.linkClues,
        markClueStatus: gpMod.markClueStatus,
        clearClueBoard: gpMod.clearClueBoard,
        rollCustomDice: gpMod.rollCustomDice,
        groupRoll: gpMod.groupRoll,
        __testing: {
            SAVE_SCHEMA_VERSION: 7,
            migrateSaveData: (save) => persistMod.migrateSaveData(safeJsonClone(save, null)),
            buildSaveData: persistMod._buildSaveData,
            restoreFromData: persistMod._restoreFromData,
            shouldArchiveToIdb: persistMod._shouldArchiveToIdb,
            SAVE_IDB_THRESHOLD_BYTES: persistMod.SAVE_IDB_THRESHOLD_BYTES,
            SAVE_IDB_QUOTA_RATIO: persistMod.SAVE_IDB_QUOTA_RATIO
        }
    };
})(window.Vue);

function clampSelectedCharIndex(gs) {
    if (!gs || !Array.isArray(gs.roster)) return 0;
    const activeCount = gs.roster.filter(c => c && c.isActive).length;
    const max = Math.max(0, activeCount - 1);
    const current = Number.isFinite(gs.selectedCharIndex) ? gs.selectedCharIndex : 0;
    gs.selectedCharIndex = Math.max(0, Math.min(current, max));
    return gs.selectedCharIndex;
}
