// ===============================================
// 归属：【QA】 测试用例 / 覆盖验证
// 程序/美术/策划 请勿直接修改测试逻辑
// 修改后放入 roles/qa/ 运行 merge.py 合并
// ===============================================

/**
 * ESM Smoke Test — Data + Engine import chain verification.
 *
 * Run: node tests/esm_smoke.mjs
 *
 * Validates that all 5 data modules + the rules engine import cleanly
 * and produce the expected exports in a Node.js ESM context.
 */
import { strict as assert } from 'node:assert';

// ── Data layer ──
import { CoCBaseSkills } from '../js/data/skills.mjs';
import { CoCJobs } from '../js/data/jobs.mjs';
import { CoCExperiences } from '../js/data/experiences.mjs';
import { CoCItemDB, parseItemData } from '../js/data/items.mjs';
import { DevLogs } from '../js/data/dev_logs.mjs';

assert.strictEqual(typeof CoCBaseSkills, 'object', 'CoCBaseSkills is an object');
assert.strictEqual(Object.keys(CoCBaseSkills).length, 60, '60 base skills defined');
assert.strictEqual(CoCBaseSkills['斗殴'].base, 25, '斗殴 base = 25');
assert.strictEqual(CoCBaseSkills['闪避'].isDynamic, true, '闪避 is dynamic');

assert.strictEqual(Array.isArray(CoCJobs), true, 'CoCJobs is an array');
assert(CoCJobs.length > 100, `CoCJobs has ${CoCJobs.length} entries`);

assert.strictEqual(Array.isArray(CoCExperiences), true, 'CoCExperiences is an array');
assert(CoCExperiences.length >= 8, `CoCExperiences has ${CoCExperiences.length} entries`);

assert.strictEqual(typeof CoCItemDB, 'object', 'CoCItemDB is an object');
assert.strictEqual(typeof parseItemData, 'function', 'parseItemData is a function');
const parsed = parseItemData('急救包');
assert.strictEqual(parsed.type, 'consumable', 'parseItemData("急救包") → consumable');

assert.strictEqual(Array.isArray(DevLogs), true, 'DevLogs is an array');
assert(DevLogs.length > 0, 'DevLogs has entries');

// ── Engine layer ──
import { CoCEngine } from '../js/coc.mjs';

assert.strictEqual(typeof CoCEngine, 'object', 'CoCEngine is an object');
assert.strictEqual(typeof CoCEngine.roll, 'function', 'CoCEngine.roll exists');
assert.strictEqual(typeof CoCEngine.checkSkill, 'function', 'CoCEngine.checkSkill exists');
assert.strictEqual(typeof CoCEngine.calculateDerived, 'function', 'CoCEngine.calculateDerived exists');
assert.strictEqual(typeof CoCEngine.getSkillValue, 'function', 'CoCEngine.getSkillValue exists');
assert.strictEqual(typeof CoCEngine.CombatEngine, 'object', 'CoCEngine.CombatEngine exists');

// Verify skill alias resolution
const testChar = { attrs: { DEX: 50 }, skillAllocations: { '斗殴': 60, '手枪': 55 }, skills: { '侦查': 70 } };
assert.strictEqual(CoCEngine.getSkillValue(testChar, '格斗：斗殴'), 60, 'alias 格斗：斗殴 → 60');
assert.strictEqual(CoCEngine.getSkillValue(testChar, '射击：手枪'), 55, 'alias 射击：手枪 → 55');
assert.strictEqual(CoCEngine.getSkillValue(testChar, '闪避'), 25, '闪避 DEX/2 = 25');

// Verify derived attributes
const derived = CoCEngine.calculateDerived({ STR: 60, CON: 60, SIZ: 60, DEX: 50, APP: 50, INT: 50, POW: 50, EDU: 50 });
assert.strictEqual(derived.hp, 12, 'HP = (60+60)/10 = 12');
assert.strictEqual(derived.db, '0', 'DB = 0 for STR+SIZ=120');

// Verify age modifiers
const aged = CoCEngine.applyAgeModifiers({ STR: 50, CON: 50, SIZ: 50, DEX: 50, APP: 50, INT: 50, POW: 50, EDU: 50, LUCK: 50 }, 45);
assert.strictEqual(aged.EDU, 55, 'Age 45: EDU +5');
assert.strictEqual(aged.APP, 45, 'Age 45: APP -5');

// ── Tool definitions ──
import { CoCToolDefinitions } from '../js/tools/definitions.mjs';
assert.strictEqual(typeof CoCToolDefinitions, 'object', 'CoCToolDefinitions exists');
assert.strictEqual(typeof CoCToolDefinitions.buildTools, 'function', 'buildTools exists');
assert.strictEqual(typeof CoCToolDefinitions.getSchema, 'function', 'getSchema exists');

// ── Context manager ──
import { CoCContextManager } from '../js/core/context_manager.mjs';
assert.strictEqual(typeof CoCContextManager, 'object', 'CoCContextManager exists');

console.log(`ESM smoke: ALL ${21} assertions PASSED`);
