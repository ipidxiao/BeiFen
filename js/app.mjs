// ===============================================
// 归属：【程序】 引擎核心 / AI调度 / 状态管理
// 美术/策划/QA 请勿直接修改此文件
// 修改后放入 roles/programmer/ 运行 merge.py 合并
// ===============================================

/**
 * CoC 7th Engine — ESM Entry Point (V17)
 *
 * Imports all core modules via ES Module imports, then bootstraps
 * the Vue application.  Keeps window.* assignments for backward
 * compatibility with components that still reference globals.
 */

/**
 * @role    程序员 (Programmer)
 * @owner   引擎核心 / AI调度 / 状态管理
 * @caution 策划/美术请勿直接修改此文件
 */
import { CoCBaseSkills } from './data/skills.mjs';
import { CoCJobs } from './data/jobs.mjs';
import { CoCExperiences } from './data/experiences.mjs';
import { CoCItemDB, parseItemData } from './data/items.mjs';
import { DevLogs } from './data/dev_logs.mjs';

import { CoCEngine } from './coc.mjs';
import { CoCContextManager } from './core/context_manager.mjs';
import { CoCToolDefinitions } from './tools/definitions.mjs';
import { CoCToolHandlers } from './tools/handlers/index.mjs';

import { CoCStateCore } from './state/core.mjs';
import { CoCStateUI } from './state/ui.mjs';
import { CoCStateGameplay } from './state/gameplay.mjs';
import { CoCStatePersistence } from './state/persistence.mjs';
import { CoCState } from './state/state.mjs';

import { CoCAI } from './ai_logic.mjs';

// Backward-compat: expose on window.* for legacy component access
window.CoCBaseSkills = CoCBaseSkills;
window.CoCJobs = CoCJobs;
window.CoCExperiences = CoCExperiences;
window.CoCItemDB = CoCItemDB;
window.parseItemData = parseItemData;
window.DevLogs = DevLogs;
window.CoCEngine = CoCEngine;
window.CoCContextManager = CoCContextManager;
window.CoCToolDefinitions = CoCToolDefinitions;
window.CoCToolHandlers = CoCToolHandlers;
window.CoCStateCore = CoCStateCore;
window.CoCStateUI = CoCStateUI;
window.CoCStateGameplay = CoCStateGameplay;
window.CoCStatePersistence = CoCStatePersistence;
window.CoCState = CoCState;
window.CoCAI = CoCAI;

// Bootstrap Vue application (same as legacy app.js)
const { createApp } = window.Vue;

const app = createApp({
    setup() {
        const state = CoCState || { gameState: { currentScreen: 'lobby' } };
        const ai = CoCAI || {};
        return { ...state, ...ai };
    }
});

if (window.ViewLobby) app.component('view-lobby', window.ViewLobby);
else throw new Error("找不到大厅视图！");
if (window.ViewCreator) app.component('view-creator', window.ViewCreator);
else throw new Error("找不到车卡视图！");
if (window.ViewStory) app.component('view-story', window.ViewStory);
else throw new Error("找不到剧情视图！");
if (window.ViewDevLog) app.component('view-dev-log', window.ViewDevLog);
if (window.CocToastLayer) app.component('coc-toast-layer', window.CocToastLayer);
if (window.CocConfirmDialog) app.component('coc-confirm-dialog', window.CocConfirmDialog);
if (window.CocIcon) app.component('coc-icon', window.CocIcon);

if (!window.__COC_ESM_BOOT__) app.mount('#app');
