// ===============================================
// 归属：【QA】 测试用例 / 覆盖验证
// 程序/美术/策划 请勿直接修改测试逻辑
// 修改后放入 roles/qa/ 运行 merge.py 合并
// ===============================================

/**
 * ESM Engine Test — full rules engine validation via ESM imports.
 *
 * Run: node tests/esm_engine.mjs
 *
 * Covers: skill checks, combat resolution, healing, age modifiers,
 *         skill visibility, dice parsing, and BaseSkills catalog integrity.
 */
import { strict as assert } from 'node:assert';
import { CoCEngine } from '../js/coc.mjs';
import { CoCBaseSkills } from '../js/data/skills.mjs';

let passed = 0;
const check = (condition, msg) => { assert(condition, msg); passed++; };

const Engine = CoCEngine;

// ═══ 1. Core Dice ═══
const roll = Engine.roll(1, 6);
check(roll >= 1 && roll <= 6, `roll(1,6) in [1,6]: ${roll}`);

check(Engine.parseDice('2D6+3') >= 5, 'parseDice("2D6+3") >= 5');
check(Engine.parseDice('0') === 0, 'parseDice("0") === 0');
check(Engine.parseDice('') === 0, 'parseDice("") === 0');

// ═══ 2. Attribute Evaluation ═══
check(Engine.getAttrEvaluation(0) === '未知', 'eval(0) → 未知');
check(Engine.getAttrEvaluation(15) === '孱弱', 'eval(15) → 孱弱');
check(Engine.getAttrEvaluation(55) === '普通', 'eval(55) → 普通');
check(Engine.getAttrEvaluation(85) === '极佳', 'eval(85) → 极佳');
check(Engine.getAttrEvaluation(95) === '人类顶尖', 'eval(95) → 人类顶尖');

// ═══ 3. Derived Attributes ═══
const d = Engine.calculateDerived({STR:50,CON:50,SIZ:50,DEX:50,APP:50,INT:50,POW:50,EDU:50});
check(d.hp === 10, 'HP = 10');
check(d.mp === 10, 'MP = 10');
check(d.db === '0', 'DB = 0');
check(d.build === 0, 'Build = 0');

const weak = Engine.calculateDerived({STR:30,CON:30,SIZ:30,DEX:30,APP:30,INT:30,POW:30,EDU:30});
check(weak.db === '-2', 'DB = -2 for small chars');
check(weak.hp === 6, 'HP = 6 for CON+SIZ=60');

const strong = Engine.calculateDerived({STR:90,CON:90,SIZ:90,DEX:50,APP:50,INT:50,POW:50,EDU:50});
check(strong.db === '1D6', 'DB = 1D6 for STR+SIZ=180');

// ═══ 4. Age Modifiers ═══
const base = {STR:50,CON:50,SIZ:50,DEX:50,APP:50,INT:50,POW:50,EDU:50,LUCK:50};
const teen = Engine.applyAgeModifiers({...base}, 17);
check(teen.STR === 45 && teen.EDU === 45, 'Age 17: STR-5 EDU-5');
const mid = Engine.applyAgeModifiers({...base}, 45);
check(mid.EDU === 55 && mid.APP === 45, 'Age 45: EDU+5 APP-5');
const old = Engine.applyAgeModifiers({...base}, 70);
check(old.EDU === 70 && old.APP === 30, 'Age 70: EDU+20 APP-20');

// ═══ 5. Skill Aliases ═══
const char = { attrs:{DEX:50,EDU:60}, skillAllocations:{'斗殴':60,'手枪':55,'汽车驾驶':40}, skills:{'侦查':70} };
check(Engine.getSkillValue(char, '格斗：斗殴') === 60, 'alias 格斗：斗殴 → 60');
check(Engine.getSkillValue(char, '射击：手枪') === 55, 'alias 射击：手枪 → 55');
check(Engine.getSkillValue(char, '闪避') === 25, '闪避 DEX/2 = 25');
check(Engine.getSkillValue(char, '图书馆使用') === 20, '图书馆使用 base = 20');
check(Engine.getSkillValue(char, '汽车驾驶') === 40, '汽车驾驶 allocation');
// Unassigned skill returns base
check(Engine.getSkillValue(char, '聆听') === 20, '聆听 base = 20');

// ═══ 6. Skill Check ═══
const origRandom = Math.random;
Math.random = () => 0.00; // roll 1 (CoC 7e: only roll=1 is 大成功)
const crit = Engine.checkSkill('斗殴', char);
check(crit.success && crit.level === '大成功', 'roll 1 vs 60 → 大成功');
Math.random = () => 0.65; // roll 66
const fail = Engine.checkSkill('斗殴', char);
check(!fail.success, 'roll 66 vs 60 → fail');
Math.random = () => 0.99; // roll 100 (fumble for >=50% skill: only on 100)
const fumble = Engine.checkSkill('斗殴', char);
check(fumble.level === '大失败', 'roll 100 → 大失败');

// Hard difficulty
Math.random = () => 0.3; // roll 31
const hard = Engine.checkSkill('斗殴', char, 'hard');
check(hard.targetValue === 30, 'hard target = skill/2');
Math.random = origRandom;

// ═══ 7. Combat Engine ═══
check(typeof Engine.CombatEngine.compareSuccess === 'function', 'compareSuccess exists');
check(Engine.CombatEngine.compareSuccess('大成功','成功') > 0, '大成功 > 成功');
check(Engine.CombatEngine.compareSuccess('失败','大失败') > 0, '失败 > 大失败');
const dmg = Engine.CombatEngine.calculateDamage('1D6', '1D4', 2);
check(typeof dmg === 'number' && dmg >= 0, 'calculateDamage returns number ≥ 0');

// ═══ 8. Skill Visibility ═══
check(Engine.isVisibleSkillName('斗殴'), '斗殴 visible');
check(Engine.isVisibleSkillName('侦查'), '侦查 visible');
check(!Engine.isVisibleSkillName(''), 'empty not visible');
check(Engine.isPlaceholderSecondarySkillName('射击：'), '射击： is placeholder');
check(Engine.isPlaceholderSecondarySkillName('其他格斗'), '其他格斗 is placeholder');
check(!Engine.isPlaceholderSecondarySkillName('手枪'), '手枪 is NOT placeholder');

const visible = Engine.getVisibleSkillNames();
check(visible.includes('斗殴'), 'getVisibleSkillNames includes 斗殴');
check(visible.includes('手枪'), 'getVisibleSkillNames includes 手枪');
check(!visible.includes('射击：'), 'getVisibleSkillNames excludes 射击：');

// ═══ 9. BaseSkills Catalog ═══
check(Object.keys(CoCBaseSkills).length >= 50, 'base skills');
check(CoCBaseSkills['斗殴'].base === 25, '斗殴 base 25');
check(CoCBaseSkills['手枪'].aliases.includes('射击：手枪'), '手枪 alias 射击：手枪');
check(CoCBaseSkills['闪避'].isDynamic === true, '闪避 isDynamic');
check(CoCBaseSkills['技艺'].isParent === true, '技艺 isParent');
check(CoCBaseSkills['射击'].children.includes('手枪'), '射击 children includes 手枪');

// ═══ 10. Class Skill Matching ═══
check(Engine.isClassSkillName('斗殴', '斗殴，手枪，侦查'), 'direct class match');
check(Engine.isClassSkillName('手枪', '射击'), 'child matches parent class');
check(!Engine.isClassSkillName('潜水', '斗殴，手枪'), 'unrelated skill not matched');

console.log(`ESM engine: ALL ${passed} assertions PASSED`);
