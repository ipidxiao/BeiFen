// GENERATED from js/engines/dice.mjs — do not edit; run: npm run build:js
window.CoCEngine = window.CoCEngine || {};
Object.assign(window.CoCEngine, {
    /**
     * 基础掷骰函数
     * @param {number} count - 骰子数量
     * @param {number} sides - 骰子面数
     * @returns {number} 掷骰总和
     */
    roll: (count, sides) => {
        let total = 0; for (let i = 0; i < count; i++) total += Math.floor(Math.random() * sides) + 1; return total;
    },

    /**
     * 解析骰子表达式 (例如 "1D6+2")
     * @param {string} str - 骰子表达式
     * @returns {number} 计算结果
     */
    parseDice: function(str) {
        if (!str || str === "0") return 0;
        let match = str.toUpperCase().match(/(\d*)D(\d+)([+-]\d+)?/);
        if (!match) return parseInt(str) || 0;
        return this.roll(parseInt(match[1]) || 1, parseInt(match[2])) + (parseInt(match[3]) || 0);
    },

    /**
     * 执行技能检定
     * @param {string} skillName - 技能名称
     * @param {Object} char - 角色对象
     * @param {string} difficulty - 难度等级 ('normal', 'hard', 'extreme')
     * @returns {Object} 检定结果 { success, level, rolledValue, skillValue, targetValue }
     */
    checkSkill: (skillName, char, difficulty = 'normal', options = {}) => {
        const skillValue = window.CoCEngine.getSkillValue(char, skillName);
        // CoC 7e bonus/penalty dice: aligned to the authoritative coc.mjs behaviour
        // so the browser no longer silently drops the options passed by system.js.
        const { bonusDice = 0, penaltyDice = 0 } = options;
        let roll;
        if (bonusDice > 0) {
            roll = window.CoCEngine.rollBonusDice(bonusDice);
        } else if (penaltyDice > 0) {
            roll = window.CoCEngine.rollPenaltyDice(penaltyDice);
        } else {
            roll = Math.floor(Math.random() * 100) + 1;
        }
        let success = false;
        let level = '失败';
        let targetValue = skillValue;
        if (difficulty === 'hard') {
            targetValue = Math.floor(skillValue / 2);
        } else if (difficulty === 'extreme') {
            targetValue = Math.floor(skillValue / 5);
        }
        if (roll <= targetValue) {
            success = true;
            if (roll === 1) {
                level = '大成功';
            } else if (roll <= Math.floor(skillValue / 5)) {
                level = '极难成功';
            } else if (roll <= Math.floor(skillValue / 2)) {
                level = '困难成功';
            } else {
                level = '成功';
            }
        } else {
            // CoC 7e fumble rule: if skill >= 50, 96-100 is fumble; if skill < 50, only 100
            const fumbleThreshold = skillValue < 50 ? 96 : 100;
            if (roll >= fumbleThreshold) {
                level = '大失败';
            }
        }
        var pushable = !success && level !== "大失败" && skillName !== "克苏鲁神话" && skillName !== "运气";
        return { success, level, rolledValue: roll, skillValue, targetValue, pushable };
    },

    roll3D6x5: function() { return this.roll(3, 6) * 5; },

    roll2D6plus6x5: function() { return (this.roll(2, 6) + 6) * 5; },

    rollBonusDice: function(count) {
        count = count || 1;
        var units = Math.floor(Math.random() * 10);
        var bestTens = Math.floor(Math.random() * 10);
        for (var i = 0; i < count; i++) {
            var t = Math.floor(Math.random() * 10);
            if (t < bestTens) bestTens = t;
        }
        var result = bestTens * 10 + units;
        return result === 0 ? 100 : result;
    },

    rollPenaltyDice: function(count) {
        count = count || 1;
        var units = Math.floor(Math.random() * 10);
        var worstTens = Math.floor(Math.random() * 10);
        for (var i = 0; i < count; i++) {
            var t = Math.floor(Math.random() * 10);
            if (t > worstTens) worstTens = t;
        }
        var result = worstTens * 10 + units;
        return result === 0 ? 100 : result;
    },

    /**
     * CoC 7e 推动检定 (pushed roll) — 以相同难度重新检定
     */
    executePushedRoll: function(skillName, char, difficulty) {
        var result = this.checkSkill(skillName, char, difficulty || 'normal');
        result.pushed = true;
        return result;
    },

    /**
     * CoC 7e 运气消费机制 — 玩家可用运气点数调整检定结果 (1:1 消费)
     * @param {Object} char - 角色对象
     * @param {number} amount - 希望消费的运气点数
     * @returns {Object} { success, spent, remainingLuck, message }
     */
    spendLuck: function(char, amount) {
        var luck = (char.attrs && char.attrs.LUCK != null) ? char.attrs.LUCK : 0;
        var spent = Math.max(0, Math.min(Number(amount) || 0, luck));
        if (spent <= 0) return { success: false, spent: 0, remainingLuck: luck, message: '运气不足或消费无效。' };
        char.attrs.LUCK = luck - spent;
        return { success: true, spent: spent, remainingLuck: char.attrs.LUCK,
            message: char.name + ' 消费了 ' + spent + ' 点运气！（剩余 ' + char.attrs.LUCK + '）' };
    },

    /**
     * 运气恢复（Keeper奖励或模组结束）
     */
    recoverLuck: function(char, amount) {
        if (!char || !char.attrs) return { recovered: 0 };
        var rec = Math.max(0, Number(amount) || 0);
        char.attrs.LUCK = (char.attrs.LUCK || 0) + rec;
        return { recovered: rec, currentLuck: char.attrs.LUCK,
            message: char.name + ' 恢复了 ' + rec + ' 点运气。' };
    }
});
