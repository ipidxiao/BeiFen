// ESM engine module — source for browser build
// Split from js/engines/combat.js

export function attachCombatEngine(CoCEngine) {
  CoCEngine.CombatEngine = {
    /**
     * 计算伤害
     */
    calculateDamage: function(damageStr, attackerDB, targetArmor = 0) {
        let totalDamage = CoCEngine.parseDice(damageStr);
        if (attackerDB) totalDamage += CoCEngine.parseDice(attackerDB);
        return Math.max(0, totalDamage - targetArmor);
    },

    /**
     * 核心对立判定：攻击 vs 闪避/反击
     */
    resolveCombatExchange: function(attacker, defender, options = {}) {
        const { weapon, difficulty = 'normal' } = options;
        const attackSkill = weapon?.skill || '斗殴';
        const attackRes = CoCEngine.checkSkill(attackSkill, attacker, difficulty);
        if (attackRes.level === '大失败') {
            return { winner: 'defender', damage: 0, msg: `${attacker.name} 遭遇了大失败！攻击不仅落空，还露出了巨大破绽。`, res: attackRes };
        }
        if (!attackRes.success) {
            return { winner: 'defender', damage: 0, msg: `${attacker.name} 的攻击 (${attackRes.rolledValue}/${attackRes.targetValue}) 挥空了。`, res: attackRes };
        }
        if (options.action === 'counter') {
            const counterRes = CoCEngine.checkSkill(options.counterSkill || '斗殴', defender);
            if (counterRes.success && this.compareSuccess(counterRes.level, attackRes.level) > 0) {
                const damage = this.calculateDamage(options.counterDamage || "1D3", defender.derived?.db, attacker.armor || 0);
                return { winner: 'defender', damage, msg: `${defender.name} 完美反击了 ${attacker.name}，造成 ${damage} 点伤害！`, res: counterRes };
            }
        } else {
            const dodgeRes = CoCEngine.checkSkill('闪避', defender);
            if (dodgeRes.success && this.compareSuccess(dodgeRes.level, attackRes.level) >= 0) {
                return { winner: 'defender', damage: 0, msg: `${defender.name} 灵巧地闪避了攻击 (${dodgeRes.rolledValue}/${dodgeRes.targetValue})。`, res: dodgeRes };
            }
        }
        const damage = this.calculateDamage(weapon?.damage || "1D3", attacker.derived?.db, defender.armor || 0);
        let msg = `${attacker.name} 击中了 ${defender.name}，造成 ${damage} 点伤害！`;
        if (attackRes.level === '大成功' || attackRes.level === '极难成功') msg = `【${attackRes.level}】` + msg;
        return { winner: 'attacker', damage, msg, res: attackRes };
    },

    compareSuccess: function(levelA, levelB) {
        const rank = { '大成功': 4, '极难成功': 3, '困难成功': 2, '成功': 1, '失败': 0, '大失败': -1 };
        return (rank[levelA] || 0) - (rank[levelB] || 0);
    },

    /**
     * CoC 7e 连射/全自动射击结算
     */
    resolveBurstFire: function(attacker, defender, weapon, rounds, mode) {
        var actualRounds = Math.max(1, Math.min(Number(rounds) || 1, 30));
        var results = []; var totalDamage = 0; var hits = 0;
        var difficulty = 'normal';
        for (var i = 0; i < actualRounds; i++) {
            if (mode === 'burst' && i > 0) difficulty = 'hard';
            if (mode === 'auto' && i >= 3) difficulty = 'hard';
            if (mode === 'auto' && i >= 6) difficulty = 'extreme';
            var ar = CoCEngine.checkSkill(weapon.skill || '手枪', attacker, difficulty);
            var dr = CoCEngine.checkSkill('闪避', defender, 'normal');
            var hit = ar.success && (ar.level === '大成功' || this.compareSuccess(ar.level, dr.level) > 0);
            var dmg = hit ? this.calculateDamage(weapon.damage || '1D6', attacker.derived?.db, defender.armor || 0) : 0;
            if (hit) { totalDamage += dmg; hits++; }
            results.push({ round: i + 1, hit: hit, damage: dmg, attackRoll: ar.rolledValue, dodgeRoll: dr.rolledValue });
        }
        var desc = attacker.name + ' ' + (mode === 'burst' ? '三发点射' : '全自动扫射') + ' ' + actualRounds + '发！' + hits + '中，' + totalDamage + '伤。' + (actualRounds - hits) + '发落空。';
        return { totalDamage: totalDamage, hits: hits, rounds: actualRounds, mode: mode, results: results, description: desc };
    },

    /**
     * CoC 7e 贯穿规则
     */
    checkImpale: function(weapon, attackResult) {
        if (!weapon || !attackResult) return { impaled: false };
        var canImpale = weapon.impale !== false && (weapon.type === 'firearm' || ['剑','斧','矛','长柄','刀具'].indexOf(weapon.category) >= 0);
        if (!canImpale) return { impaled: false };
        if (attackResult.level === '极难成功' || attackResult.level === '大成功') {
            var d = CoCEngine.parseDice(weapon.damage || '1D6');
            return { impaled: true, impaleDamage: d, desc: '武器贯穿！造成额外伤害。' };
        }
        return { impaled: false };
    },

    /**
     * CoC 7e 火器故障
     */
    checkMalfunction: function(weapon, attackResult) {
        if (!weapon || weapon.type !== 'firearm') return { jammed: false };
        if (attackResult.level === '大失败') {
            var mal = parseInt(weapon.malfunction || '00');
            if (Math.floor(Math.random()*100)+1 <= mal) {
                return { jammed: true, desc: '火器故障！' + (weapon.name||'武器') + '卡壳了！' };
            }
        }
        return { jammed: false };
    },

    autoResolveExchange: function(attacker, defender, weapon, callbacks) {
        const result = this.resolveCombatExchange(attacker, defender, { weapon });
        const mal = this.checkMalfunction(weapon, result.res);
        if (mal.jammed) {
            result.msg = mal.desc;
            result.damage = 0;
            result.winner = 'defender';
            return result;
        }
        let damage = result.damage;
        if (result.winner === 'attacker' && damage > 0 && result.res) {
            const impale = this.checkImpale(weapon, result.res);
            if (impale.impaled) {
                damage += impale.impaleDamage || 0;
                result.msg += ` ${impale.desc}（额外 ${impale.impaleDamage} 伤）`;
                result.damage = damage;
            }
        }
        if (result.winner === 'attacker' && damage > 0) {
            if (defender.isEnemy && callbacks.updateEnemy) {
                callbacks.updateEnemy(defender.name, -damage, result.msg);
            } else if (callbacks.update_character_status) {
                callbacks.update_character_status({ target_name: defender.name, hp_change: -damage });
            }
        } else if (result.winner === 'defender' && damage > 0) {
            if (attacker.isEnemy && callbacks.updateEnemy) {
                callbacks.updateEnemy(attacker.name, -damage, result.msg);
            } else if (callbacks.update_character_status) {
                callbacks.update_character_status({ target_name: attacker.name, hp_change: -damage });
            }
        }
        return result;
    }
};
}
