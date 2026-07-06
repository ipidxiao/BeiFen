// P3 boundary smoke — OPT-012..016, OPT-014, OPT-020, OPT-021, OPT-024
import { strict as assert } from 'node:assert';
import { CoCEngine } from '../js/coc.mjs';
import { CoCToolDefinitions } from '../js/tools/definitions.mjs';
import {
    KpExecutionEngine,
    setKpEngineEnabled,
    ensureKpEngine,
    _setTestRolls,
    _clearTestRolls
} from '../js/campaign/kp_execution_engine.mjs';

let passed = 0;
const check = (cond, msg) => { assert(cond, msg); passed++; };

// OPT-012: applyAgeModifiers boundaries (14/15/19/40/70+)
{
    const b = { STR: 50, CON: 50, SIZ: 50, DEX: 50, APP: 50, INT: 50, POW: 50, EDU: 50, LUCK: 50 };
    check(CoCEngine.applyAgeModifiers(b, 14).STR === 50, 'age 14: no modifier');
    check(CoCEngine.applyAgeModifiers(b, 15).STR === 45, 'age 15: STR -5');
    check(CoCEngine.applyAgeModifiers(b, 15).LUCK === 50, 'age 15: LUCK unchanged');
    check(CoCEngine.applyAgeModifiers(b, 19).EDU === 45, 'age 19: still 15-19 bracket');
    check(CoCEngine.applyAgeModifiers(b, 25).STR === 50, 'age 25: no modifier');
    check(CoCEngine.applyAgeModifiers(b, 40).EDU === 55, 'age 40: EDU +5');
    check(CoCEngine.applyAgeModifiers(b, 70).STR === 15, 'age 70: STR clamped to 15');
    check(CoCEngine.applyAgeModifiers(b, 85).STR === 15, 'age 85: STR clamped to 15');
}

// OPT-013: checkSkill extreme difficulty
{
    const ch = { name: 'T', skills: { '侦查': 65 } };
    const extreme = CoCEngine.checkSkill('侦查', ch, 'extreme');
    check(extreme.targetValue === 13, 'extreme target = floor(65/5)');
    check(extreme.skillValue === 65, 'extreme retains skillValue');
}

// OPT-016: getSkillValue enemy path
{
    const e = { name: 'Ghoul', isEnemy: true, skills: { '斗殴': 45 }, dodge: 30 };
    check(CoCEngine.getSkillValue(e, '斗殴') === 45, 'enemy explicit skill');
    check(CoCEngine.getSkillValue(e, '闪避') === 30, 'enemy dodge fallback');
    check(CoCEngine.getSkillValue(e, '侦查') === 25, 'enemy unknown skill default 25');
}

// OPT-015: HealingEngine branches
{
    const invalid = CoCEngine.HealingEngine.applyHealing({ derived: { hp: 5, maxHp: 10 }, status: {} }, { type: 'weapon' });
    check(invalid.success === false, 'non-consumable rejected');

    const full = { name: 'F', attrs: { CON: 50 }, derived: { hp: 12, maxHp: 12 }, status: {} };
    CoCEngine.HealingEngine.applyHealing(full, { type: 'consumable', target: 'HP', heal: '10' });
    check(full.derived.hp === 12, 'heal capped at maxHp');

    const wounded = {
        name: 'W', attrs: { CON: 50 }, derived: { hp: 3, maxHp: 12 },
        status: { hasMajorWound: true, isDying: true, isUnconscious: true }
    };
    CoCEngine._setTestRolls([10]);
    const healed = CoCEngine.HealingEngine.applyHealing(wounded, {
        type: 'consumable', target: 'HP', heal: '1D3', skill: '急救'
    });
    check(healed.success === true, 'skill healing succeeds');
    check(wounded.status.hasMajorWound === false, 'major wound cleared on success');
    check(wounded.status.isDying === false, 'dying cleared when hp > 0');
    CoCEngine._clearTestRolls();

    const bad = { name: 'B', attrs: { CON: 50 }, derived: { hp: 5, maxHp: 12 }, status: {} };
    CoCEngine._setTestRolls([99]);
    const failed = CoCEngine.HealingEngine.applyHealing(bad, {
        type: 'consumable', target: 'HP', heal: '4', skill: '急救'
    });
    check(failed.success === true && failed.healedAmount === 2, 'failed skill halves heal');
    CoCEngine._clearTestRolls();

    const unsupported = CoCEngine.HealingEngine.applyHealing(
        { derived: { hp: 5, maxHp: 10 }, status: {} },
        { type: 'consumable', target: 'SAN', heal: '1D3' }
    );
    check(unsupported.success === false, 'unsupported target rejected');
}

// OPT-014: resolveCombatExchange / resolveBurstFire boundaries
{
    const attacker = { name: 'A', skills: { '斗殴': 60 }, derived: { db: '0' } };
    const defender = { name: 'D', attrs: { DEX: 50 }, skills: { '闪避': 50 }, armor: 0 };

    CoCEngine._setTestRolls([100]);
    const fumble = CoCEngine.CombatEngine.resolveCombatExchange(attacker, defender, { weapon: { skill: '斗殴', damage: '1D3' } });
    check(fumble.winner === 'defender', '大失败 → defender wins');
    check(fumble.msg.includes('大失败'), '大失败 message');
    CoCEngine._clearTestRolls();

    CoCEngine._setTestRolls([50, 5]);
    const counterWin = CoCEngine.CombatEngine.resolveCombatExchange(attacker, defender, {
        weapon: { skill: '斗殴', damage: '1D3' },
        action: 'counter',
        counterSkill: '斗殴',
        counterDamage: '1D3'
    });
    check(counterWin.winner === 'defender', 'counter path resolves');
    CoCEngine._clearTestRolls();

    const burstAttacker = { name: 'G', skills: { '手枪': 70 }, derived: { db: '0' } };
    const burstDefender = { name: 'E', attrs: { DEX: 40 }, skills: { '闪避': 40 }, armor: 0 };
    CoCEngine._setTestRolls([5, 90, 5, 90, 5, 90]);
    const burst = CoCEngine.CombatEngine.resolveBurstFire(burstAttacker, burstDefender, { skill: '手枪', damage: '1D6' }, 3, 'burst');
    check(burst.rounds === 3, 'burst caps rounds');
    check(typeof burst.totalDamage === 'number', 'burst returns totalDamage');
    CoCEngine._clearTestRolls();
}

// OPT-020: checkMalfunction injectable dice
{
    const weapon = { type: 'firearm', name: '步枪', malfunction: '50' };
    const attackResult = { level: '大失败' };
    CoCEngine._setTestRolls([10]);
    check(CoCEngine.CombatEngine.checkMalfunction(weapon, attackResult).jammed === true, 'malfunction roll 10 ≤ 50');
    CoCEngine._setTestRolls([90]);
    check(CoCEngine.CombatEngine.checkMalfunction(weapon, attackResult).jammed === false, 'malfunction roll 90 > 50');
    CoCEngine._clearTestRolls();
}

// OPT-021: KP antagonist / social infiltration injectable random
{
    const gs = {
        roster: [{ name: 'Inv', isActive: true }],
        npcRegistry: [{ name: 'Ally', status: 'alive', relation: '盟友' }],
        clueBoard: { clues: [], links: [] },
        chatHistory: [],
        kpEngine: null,
        londonKpState: null
    };
    setKpEngineEnabled(gs, true);
    ensureKpEngine(gs);
    gs.londonKpState.antagonist.ALERT_LEVEL = 6;
    gs.londonKpState.antagonist.KNOWLEDGE_LEVEL = 8;

    _setTestRolls([1, 1]);
    const infil = KpExecutionEngine.applySocialInfiltration(gs, { type: 'register', name: 'Ally' });
    check(infil && infil.compromised === 'Ally', 'social infiltration deterministic with roll queue');

    gs.clueBoard.clues = [];
    _setTestRolls([1]);
    const tick = KpExecutionEngine.runAntagonistTick(gs, { type: 'clue' });
    check(tick && tick.misinformation === true, 'antagonist clue corruption deterministic');
    _clearTestRolls();
}

// OPT-024: tool description tiers
{
    check(CoCToolDefinitions.getToolTier('add_clue') === 'required', 'add_clue tier required');
    check(CoCToolDefinitions.getToolTier('fire_weapon') === 'suggested', 'fire_weapon tier suggested');
    check(CoCToolDefinitions.getToolTier('request_skill_check') === 'neutral', 'request_skill_check neutral');
    const tools = CoCToolDefinitions.buildTools();
    const addClue = tools.find(t => t.function.name === 'add_clue');
    const fireWeapon = tools.find(t => t.function.name === 'fire_weapon');
    check(addClue.function.description.startsWith('【必须调用】'), 'add_clue prefixed required');
    check(fireWeapon.function.description.startsWith('【建议调用】'), 'fire_weapon prefixed suggested');
    check(!fireWeapon.function.description.includes('【必须调用】'), 'fire_weapon not hard-required');
}

console.log(`opt_p3_boundary_smoke: ALL ${passed} assertions PASSED`);
