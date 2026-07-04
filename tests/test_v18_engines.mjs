// ===============================================
// 归属：【QA】 测试用例 / 覆盖验证
// 程序/美术/策划 请勿直接修改测试逻辑
// 修改后放入 roles/qa/ 运行 merge.py 合并
// ===============================================

/**
 * V18 Engine Unit Tests — 覆盖 V18 新增引擎
 *
 * Run: node tests/test_v18_engines.mjs
 *
 * Covers: rollBonusDice, rollPenaltyDice, EnvironmentalEngine,
 *         PoisonEngine, SanityEngine, CombatEngine (impale/malfunction)
 */
import { strict as assert } from 'node:assert';
import { CoCEngine } from '../js/coc.mjs';

let passed = 0;
const check = (condition, msg) => { assert(condition, msg); passed++; };

// ═══ 1. rollBonusDice(1): 验证返回值 1-100，多次调用取最小值验证奖励骰倾向低值 ═══
{
    const samples = [];
    for (let i = 0; i < 50; i++) {
        const r = CoCEngine.rollBonusDice(1);
        check(r >= 1 && r <= 100, `rollBonusDice(1) in [1,100]: ${r}`);
        samples.push(r);
    }
    const minVal = Math.min(...samples);
    // 奖励骰取最优十位数，多次采样最小值应倾向低值 (≤30)
    check(minVal <= 30, `rollBonusDice(1) 50样本最小值=${minVal} ≤ 30 (倾向低值)`);
}

// ═══ 2. rollPenaltyDice(2): 验证返回值 1-100，多次调用取最大值验证惩罚骰倾向高值 ═══
{
    const samples = [];
    for (let i = 0; i < 50; i++) {
        const r = CoCEngine.rollPenaltyDice(2);
        check(r >= 1 && r <= 100, `rollPenaltyDice(2) in [1,100]: ${r}`);
        samples.push(r);
    }
    const maxVal = Math.max(...samples);
    // 惩罚骰取最劣十位数，多次采样最大值应倾向高值 (≥70)
    check(maxVal >= 70, `rollPenaltyDice(2) 50样本最大值=${maxVal} ≥ 70 (倾向高值)`);
}

// ═══ 3. EnvironmentalEngine.fallDamage(30): 验证返回 damage>0 ═══
{
    const result = CoCEngine.EnvironmentalEngine.fallDamage(30);
    check(result.damage > 0, `fallDamage(30) damage=${result.damage} > 0`);
    check(typeof result.rawDamage === 'number', `fallDamage(30) rawDamage is number`);
}

// ═══ 4. EnvironmentalEngine.fireDamage('severe'): 验证 damage>=2 ═══
{
    const result = CoCEngine.EnvironmentalEngine.fireDamage('severe');
    check(result.damage >= 2, `fireDamage('severe') damage=${result.damage} >= 2`);
    check(result.intensity === 'severe', `fireDamage('severe') intensity='${result.intensity}'`);
}

// ═══ 5. EnvironmentalEngine.drowning({attrs:{CON:50}}, 30): 验证返回 damage>0 ═══
{
    // CON=50 → cr=25, rounds=30 > 25 → 触发溺水伤害
    const victim = { attrs: { CON: 50 } };
    const result = CoCEngine.EnvironmentalEngine.drowning(victim, 30);
    check(result.damage > 0, `drowning(CON=50, rounds=30) damage=${result.damage} > 0`);
}

// ═══ 6. EnvironmentalEngine.electricDamage('powerline'): 验证 damage>=4 ═══
{
    const result = CoCEngine.EnvironmentalEngine.electricDamage('powerline');
    check(result.damage >= 4, `electricDamage('powerline') damage=${result.damage} >= 4`);
    check(result.voltage === 'powerline', `electricDamage('powerline') voltage='${result.voltage}'`);
}

// ═══ 7. EnvironmentalEngine.explosionDamage('3D6', 0): 验证 damage>=3 ═══
{
    const result = CoCEngine.EnvironmentalEngine.explosionDamage('3D6', 0);
    check(result.damage >= 3, `explosionDamage('3D6', 0) damage=${result.damage} >= 3`);
    check(result.distance === 0, `explosionDamage('3D6', 0) distance=0`);
}

// ═══ 8. PoisonEngine: 完整毒素流程 (applyPoison + processPoisonTick + resistCheck) ═══
{
    const victim = {
        name: '测试目标',
        attrs: { CON: 50 },
        hp: 20,
    };

    // 8a. applyPoison
    const applyResult = CoCEngine.PoisonEngine.applyPoison(victim, 'moderate', 0);
    check(applyResult.applied === true, 'applyPoison → applied=true');
    check(applyResult.potency === 'moderate', "applyPoison → potency='moderate'");
    check(Array.isArray(victim.poison) && victim.poison.length === 1, 'applyPoison → poison array created');

    // 8b. processPoisonTick (round >= delayRounds → 触发伤害)
    const tickResult = CoCEngine.PoisonEngine.processPoisonTick(victim, 1);
    check(tickResult.damage > 0, `processPoisonTick damage=${tickResult.damage} > 0`);
    check(victim.hp < 20, `processPoisonTick reduced HP: ${victim.hp} < 20`);

    // 8c. resistCheck
    const resistResult = CoCEngine.PoisonEngine.resistCheck(victim, 'moderate');
    check(typeof resistResult.success === 'boolean', 'resistCheck → success is boolean');
    check(typeof resistResult.rolled === 'number', 'resistCheck → rolled is number');
    check(typeof resistResult.target === 'number', 'resistCheck → target is number');
}

// ═══ 9. SanityEngine.getSanNarrative(5): 验证返回 intensity='horrifying' ═══
{
    const result = CoCEngine.SanityEngine.getSanNarrative(5);
    check(result.intensity === 'horrifying', `getSanNarrative(5) intensity='${result.intensity}'`);
    check(result.shake === true, 'getSanNarrative(5) shake=true');
    check(result.shock === true, 'getSanNarrative(5) shock=true');
}

// ═══ 10. SanityEngine.getSanNarrative(0): 验证返回 intensity='none' ═══
{
    const result = CoCEngine.SanityEngine.getSanNarrative(0);
    check(result.intensity === 'none', `getSanNarrative(0) intensity='${result.intensity}'`);
    check(!result.shake, 'getSanNarrative(0) shake falsy');
    check(!result.shock, 'getSanNarrative(0) shock falsy');
}

// ═══ 11. CombatEngine.checkImpale: 验证极难成功触发贯穿 ═══
{
    // 可贯穿武器: impale !== false, category in ['剑','斧','矛','长柄','刀具'] or type='firearm'
    const weapon = { impale: true, category: '剑', damage: '1D6', type: 'melee' };
    const attackResult = { level: '极难成功' };
    const result = CoCEngine.CombatEngine.checkImpale(weapon, attackResult);
    check(result.impaled === true, 'checkImpale(剑, 极难成功) → impaled=true');
    check(result.impaleDamage > 0, `checkImpale impaleDamage=${result.impaleDamage} > 0`);
}

// ═══ 12. CombatEngine.checkMalfunction: 验证大失败触发故障 ═══
{
    // 火器武器，malfunction=100 保证必然触发故障
    const weapon = { type: 'firearm', name: '手枪', malfunction: '100' };
    const attackResult = { level: '大失败' };
    const result = CoCEngine.CombatEngine.checkMalfunction(weapon, attackResult);
    check(result.jammed === true, 'checkMalfunction(手枪, 大失败) → jammed=true');
    check(typeof result.desc === 'string' && result.desc.length > 0, 'checkMalfunction → desc non-empty');
}

console.log(`V18 engines: ALL ${passed} assertions PASSED`);
