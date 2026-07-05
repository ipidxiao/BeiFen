// GENERATED from js/tools/handlers/system.mjs — do not edit; run: npm run build:js
// ===============================================
// 归属：【程序】 引擎核心 / AI调度 / 状态管理
// 美术/策划/QA 请勿直接修改此文件
// 修改后放入 roles/programmer/ 运行 merge.py 合并
// ===============================================

/**
 * CoC Tool Handlers: System / engine metadata domain (AUDITFIX8)
 */
window.CoCToolHandlerModules = window.CoCToolHandlerModules || {};
window.CoCToolHandlerModules.system = function(ctx) {
    const { gameState, Engine, addJournalEntry } = ctx;

    return {
        system_alert: (args) => {
            gameState.chatHistory.push({ role: 'system', isLocalOnly: true, isAlert: true, content: `⚠️ ${args.message}` });
            return '已警告';
        },

        apply_environmental_damage: (args) => {
            const c = gameState.roster.find(r => r.name === args.target_name);
            if (!c) return `找不到目标: ${args.target_name}`;
            const env = Engine.EnvironmentalEngine;
            let result;
            switch (args.type) {
                case 'fall': result = env.fallDamage(args.value); break;
                case 'fire': result = env.fireDamage(args.intensity || 'moderate'); break;
                case 'drowning': result = env.drowning(c, args.value || 1); break;
                case 'electric': result = env.electricDamage(args.intensity || 'household'); break;
                case 'explosion': result = env.explosionDamage(`${args.value || 2}D6`, args.value || 0); break;
                default: return `未知环境伤害类型: ${args.type}`;
            }
            if (result.damage > 0) {
                ctx.dispatch('update_character_status', {
                    target_name: args.target_name,
                    hp_change: -result.damage,
                    note: result.desc || args.type
                });
                addJournalEntry && addJournalEntry({ type: 'combat', charName: c.name, summary: `${c.name} 受到环境伤害: ${result.desc}` });
            }
            return result;
        },
        apply_poison: (args) => {
            const c = gameState.roster.find(r => r.name === args.target_name);
            if (!c) return `找不到目标: ${args.target_name}`;
            const r = Engine.PoisonEngine.applyPoison(c, args.potency, args.delay_rounds || 0);
            addJournalEntry && addJournalEntry({ type: 'combat', charName: c.name, summary: `${c.name}: ${r.desc}` });
            return r;
        },
        bonus_penalty_roll: (args) => {
            const c = gameState.roster.find(r => r.name === args.target_name);
            if (!c) return `找不到目标: ${args.target_name}`;
            const options = {};
            if (args.bonus_dice > 0) options.bonusDice = args.bonus_dice;
            if (args.penalty_dice > 0) options.penaltyDice = args.penalty_dice;
            const result = Engine.checkSkill(args.skill_name, c, args.difficulty || 'normal', options);
            const targetVal = result.targetValue ?? result.skillValue;
            return {
                ...result,
                description: `${c.name} 进行 ${args.skill_name} 检定` +
                    (args.bonus_dice ? ` (${args.bonus_dice}奖励骰)` : '') +
                    (args.penalty_dice ? ` (${args.penalty_dice}惩罚骰)` : '') +
                    `: ${result.level} (${result.rolledValue}/${targetVal})`
            };
        },
        record_engine_log: (args) => {
            if (window.DevLogs) {
                const exists = window.DevLogs.some(log => log.version === args.version);
                if (!exists) {
                    window.DevLogs.unshift({ version: args.version, date: new Date().toISOString().split('T')[0], title: args.title, changes: args.changes });
                    gameState.chatHistory.push({ role: 'system', isLocalOnly: true, content: `🛠️ [开发者日志] 系统已更新至 ${args.version}：${args.title}` });
                }
                return '日志已记录';
            }
            return '错误：DevLogs 未定义';
        }
    };
};
