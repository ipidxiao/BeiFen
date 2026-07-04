// ESM engine module — source for browser build
// Split from js/engines/healing.js

export function attachHealingEngine(CoCEngine) {
  CoCEngine.HealingEngine = {
    applyHealing: function(character, item) {
        if (item.type !== 'consumable' || !item.heal || !item.target) {
            return { success: false, message: "不是有效的治疗物品。" };
        }
        let healAmount = CoCEngine.parseDice(item.heal);
        let skillCheckResult = null;
        if (item.skill) {
            skillCheckResult = CoCEngine.checkSkill(item.skill, character, 'normal');
            if (skillCheckResult.level === "极难成功") {
                healAmount *= 2;
            } else if (skillCheckResult.level === "困难成功") {
                healAmount = Math.floor(healAmount * 1.5);
            } else if (!skillCheckResult.success) {
                healAmount = Math.floor(healAmount * 0.5);
            }
        }
        if (item.target === "HP") {
            character.derived.hp = Math.min(character.derived.maxHp, character.derived.hp + healAmount);
            let majorWoundRemoved = false;
            if (character.status.hasMajorWound && skillCheckResult && skillCheckResult.success) {
                character.status.hasMajorWound = false;
                majorWoundRemoved = true;
            }
            if (character.derived.hp > 0) {
                character.status.isDying = false;
                character.status.isUnconscious = false;
            }
            return { success: true, healedAmount: healAmount, skillCheckResult, majorWoundRemoved, message: `恢复了 ${healAmount} 点 HP。` };
        }
        return { success: false, message: "暂不支持该类型治疗。" };
    }
};
}
