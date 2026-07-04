// ===============================================
// 归属：【程序】 引擎核心 / AI调度 / 状态管理
// 美术/策划/QA 请勿直接修改此文件
// 修改后放入 roles/programmer/ 运行 merge.py 合并
// ===============================================

/**
 * CoC Tool Handlers: Dice domain (AUDITFIX8)
 */
export function dice(ctx) {
    const { gameState, rollCustomDice, groupRoll } = ctx;

    const getSuccessLevel = (roll, skillValue) => {
        const fumbleThreshold = skillValue < 50 ? 96 : 100;
        if (roll === 1) return '大成功';
        if (roll <= skillValue * 0.2) return '极难成功';
        if (roll <= skillValue * 0.5) return '困难成功';
        if (roll <= skillValue) return '成功';
        if (roll >= fumbleThreshold) return '大失败';
        return '失败';
    };

    return {
        roll_dice: (args) => {
            const entry = rollCustomDice(args.notation, args.label, '守秘人', args.context);
            if (!entry) return `无效的骰子表示法：${args.notation}`;
            const dieEmoji = entry.sides === 6 && entry.count === 1 ? ['⚀','⚁','⚂','⚃','⚄','⚅'][entry.kept[0] - 1] : null;
            const rollStr = entry.kept.join('+') + (entry.mod ? (entry.mod > 0 ? '+' : '') + entry.mod : '');
            const msg = `🎲 【${args.label}】${args.notation} → ${dieEmoji || ''}  **${entry.total}** （${rollStr}）`;
            gameState.chatHistory.push({ role: 'system', isLocalOnly: true, isDiceRoll: true, content: msg });
            return `骰出 ${entry.total}（${args.notation}）`;
        },
        group_roll: (args) => {
            const entry = groupRoll(args.char_names || [], args.skill_name, args.context);
            const lines = entry.groupResults.map(r => `・${r.name}：${r.roll}/${r.skillVal} → ${r.level}`).join('\n');
            const msg = `🎲 【群体·${args.skill_name}】\n${lines}`;
            gameState.chatHistory.push({ role: 'system', isLocalOnly: true, isDiceRoll: true, content: msg });
            return entry.groupResults.map(r => `${r.name}:${r.level}`).join(',');
        },
        opposed_roll: (args) => {
            const c = gameState.roster.find(r => r.name === args.char_name);
            if (!c) return `找不到调查员：${args.char_name}`;
            const rawCharVal = ctx.Engine && typeof ctx.Engine.getSkillValue === 'function'
                ? ctx.Engine.getSkillValue(c, args.char_skill)
                : (c.skills?.[args.char_skill] ?? c.skillAllocations?.[args.char_skill]);
            const charVal = Number.isFinite(Number(rawCharVal)) ? Number(rawCharVal) : 50;
            const charRoll = Math.floor(Math.random() * 100) + 1;
            const oppRoll = Math.floor(Math.random() * 100) + 1;
            const charSucc = charRoll <= charVal;
            const oppSucc = oppRoll <= args.opponent_value;
            let winner;
            if (charSucc && !oppSucc) {
                winner = args.char_name;
            } else if (!charSucc && oppSucc) {
                winner = args.opponent_name;
            } else if (charSucc && oppSucc) {
                const charLevel = getSuccessLevel(charRoll, charVal);
                const oppLevel = getSuccessLevel(oppRoll, args.opponent_value);
                const cmp = ctx.Engine && ctx.Engine.CombatEngine && typeof ctx.Engine.CombatEngine.compareSuccess === 'function'
                    ? ctx.Engine.CombatEngine.compareSuccess(charLevel, oppLevel)
                    : 0;
                winner = cmp > 0 ? args.char_name : cmp < 0 ? args.opponent_name : '平局';
            } else {
                winner = '平局';
            }
            const charLevelStr = getSuccessLevel(charRoll, charVal);
            const oppLevelStr = getSuccessLevel(oppRoll, args.opponent_value);
            const msg = `⚔️ 【对抗·${args.label}】\n・${args.char_name}：${charRoll}/${charVal} → ${charLevelStr}\n・${args.opponent_name}：${oppRoll}/${args.opponent_value} → ${oppLevelStr}\n→ ${winner}`;
            gameState.chatHistory.push({ role: 'system', isLocalOnly: true, isDiceRoll: true, content: msg });
            rollCustomDice(`1d100`, `对抗·${args.label}（${args.char_name}）`, args.char_name);
            return `对抗结果：${winner} 胜出`;
        }
    };
};
