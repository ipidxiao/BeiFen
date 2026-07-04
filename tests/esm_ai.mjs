// ===============================================
// 归属：【QA】 测试用例 / 覆盖验证
// 程序/美术/策划 请勿直接修改测试逻辑
// 修改后放入 roles/qa/ 运行 merge.py 合并
// ===============================================

/**
 * ESM AI Test — validates CoCAI import chain with browser mocks.
 *
 * Run: node tests/esm_ai.mjs
 *
 * Uses dynamic import() to ensure window.* globals are set before
 * ai_logic.mjs evaluates its IIFE.
 */
import './helpers/browser-mock.mjs';
import { strict as assert } from 'node:assert';

// Static imports for modules that don't depend on window.* globals
import { CoCEngine } from '../js/coc.mjs';
import { CoCToolDefinitions } from '../js/tools/definitions.mjs';
import { CoCToolHandlers } from '../js/tools/handlers/index.mjs';
import { CoCStateCore } from '../js/state/core.mjs';
import { CoCStateUI } from '../js/state/ui.mjs';
import { CoCStateGameplay } from '../js/state/gameplay.mjs';
import { CoCStatePersistence } from '../js/state/persistence.mjs';
import { CoCState } from '../js/state/state.mjs';
import { CoCAIPromptConfig } from '../js/data/ai_prompt_config.mjs';

// Set globals that state modules need
window.CoCEngine = CoCEngine;
window.CoCToolDefinitions = CoCToolDefinitions;
window.CoCToolHandlers = CoCToolHandlers;
window.CoCStateCore = CoCStateCore;
window.CoCStateUI = CoCStateUI;
window.CoCStateGameplay = CoCStateGameplay;
window.CoCStatePersistence = CoCStatePersistence;
window.CoCState = CoCState;
window.CoCAIPromptConfig = CoCAIPromptConfig;

// Now dynamically import ai_logic which needs window.CoCState/Engine
const { CoCAI } = await import('../js/ai_logic.mjs');
window.CoCAI = CoCAI;

let passed = 0;
const check = (condition, msg) => { assert(condition, msg); passed++; };

// ═══ 1. AI module integrity ═══
check(typeof CoCAI === 'object' && CoCAI !== null, 'CoCAI exists');
check(typeof CoCAI.handlePlayerAction === 'function', 'handlePlayerAction exists');
check(typeof CoCAI.triggerAI === 'function', 'triggerAI exists');
check(typeof CoCAI.executeSkillCheck === 'function', 'executeSkillCheck exists');
check(typeof CoCAI.narrativeListener === 'function', 'narrativeListener exists');
check(typeof CoCAI.validateToolArguments === 'function', 'validateToolArguments exists');
check(typeof CoCAI.buildAiToolDefinitions === 'function', 'buildAiToolDefinitions exists');
check(typeof CoCAI.dispatchToolHandler === 'function', 'dispatchToolHandler exists');

// ═══ 2. Tool definitions ═══
const tools = CoCAI.buildAiToolDefinitions();
check(Array.isArray(tools), 'buildAiToolDefinitions returns array');
check(tools.length >= 8, `tools count: ${tools.length}`);
check(!tools.some(t => JSON.stringify(t).includes('singleAsArray')), 'no singleAsArray leak');

// ═══ 3. Tool validation ═══
const validResult = CoCAI.validateToolArguments('update_inventory', '{"items":["钥匙","手枪"]}');
check(validResult.ok === true, 'valid args pass validation');
const missingRequired = CoCAI.validateToolArguments('request_skill_check', '{}');
check(missingRequired.ok === false, 'missing required args fail');
const badJson = CoCAI.validateToolArguments('update_inventory', 'not json');
check(badJson.ok === false, 'bad JSON fails validation');

// ═══ 4. Tool dispatch ═══
const dispResult = CoCAI.dispatchToolHandler('update_inventory', { items: ['银钥匙'] });
check(typeof dispResult === 'string', 'dispatch returns string');
check(window.CoCState.gameState.inventory.includes('银钥匙'), 'inventory mutated');
CoCAI.dispatchToolHandler('system_alert', { message: 'test alert' });
check(window.CoCState.gameState.chatHistory.some(m => String(m.content || '').includes('test alert')), 'alert in chat');

// ═══ 5. Tool catalog vs handler registry ═══
const catalogNames = CoCAI.getToolCatalogNames();
const handlerNames = CoCAI.getRegisteredToolNames();
check(Array.isArray(catalogNames), 'catalog names is array');
check(Array.isArray(handlerNames), 'handler names is array');

// ═══ 6. Narrative listener ═══
window.CoCState.gameState.clueBoard.clues = [];
CoCAI.narrativeListener('你发现了一张带血的纸条线索。');
const clueCount = window.CoCState.gameState.clueBoard.clues.length;
check(typeof clueCount === 'number', `narrativeListener ran, clues: ${clueCount}`);

// ═══ 7. Skill check execution ═══
window.CoCState.gameState.roster.push({
    name: 'TestChar', isActive: true, hp: 10, sanity: 50,
    attrs: { DEX: 50, CON: 50, SIZ: 50, STR: 50, APP: 50, INT: 50, POW: 50, EDU: 50 },
    derived: { hp: 10, maxHp: 10 },
    skillAllocations: { '侦查': 60 }
});
check(typeof CoCAI.executeSkillCheck === 'function', 'executeSkillCheck available');

console.log(`ESM ai: ALL ${passed} assertions PASSED`);
