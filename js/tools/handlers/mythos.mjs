// ===============================================
// 归属：【程序】 引擎核心 / AI调度 / 状态管理
// 美术/策划/QA 请勿直接修改此文件
// 修改后放入 roles/programmer/ 运行 merge.py 合并
// ===============================================

/**
 * CoC Tool Handlers: Mythos domain — 典籍研读与法术施放
 */
export function mythos(ctx) {
    var gameState = ctx.gameState;
    var addJournalEntry = ctx.addJournalEntry;

    return {
        study_tome: (args) => {
            var Engine = ctx.Engine || (typeof window !== 'undefined' && window.CoCEngine);
            var c = gameState.roster.find(function(r) { return r.name === args.target_name; });
            if (!c) return '错误：找不到调查员 ' + args.target_name;
            if (!Engine || !Engine.MythosEngine) return '错误：神话引擎未加载。';
            var tomes = window.CoCMythosTomes || {};
            var tome = tomes[args.tome_name];
            if (!tome) return '错误：未知典籍 ' + args.tome_name;
            const inv = [...(gameState.inventory || []), ...(c.equipment ? Object.values(c.equipment).filter(Boolean) : [])];
            const hasTome = inv.some((item) => {
                const label = String(item || '').trim().toLowerCase();
                if (label.length < 2) return false;
                const key = String(args.tome_name || '').toLowerCase();
                const title = String(tome.title || args.tome_name || '').toLowerCase();
                return label.includes(key) || label.includes(title) || title.includes(label);
            });
            if (!hasTome) return '错误：' + c.name + ' 背包/装备中未持有典籍「' + (tome.title || args.tome_name) + '」。';
            // Full study if weeks provided; otherwise initial browse
            var result;
            if (args.weeks && Number(args.weeks) > 0) {
                result = Engine.MythosEngine.fullStudy(c, args.tome_name, Number(args.weeks));
            } else {
                result = Engine.MythosEngine.initialBrowse(c, args.tome_name);
            }
            if (result.success && result.sanLoss > 0) {
                gameState.chatHistory.push({ role: 'system', isLocalOnly: true, isAlert: true, content: result.description });
            }
            if (result.spellsLearned && result.spellsLearned.length) {
                addJournalEntry({ type: 'spell_learned', charName: c.name, summary: '学会了' + result.spellsLearned.length + '个法术：' + result.spellsLearned.join('、') });
            }
            addJournalEntry({ type: 'tome_study', charName: c.name, summary: result.description });
            return result.description;
        },
        cast_spell: (args) => {
            var Engine = ctx.Engine || (typeof window !== 'undefined' && window.CoCEngine);
            var c = gameState.roster.find(function(r) { return r.name === args.caster_name; });
            if (!c) return '错误：找不到施法者 ' + args.caster_name;
            var target = args.target_name ? gameState.roster.find(function(r) { return r.name === args.target_name; }) : null;
            if (!target && args.target_name) target = gameState.combat.enemies ? gameState.combat.enemies.find(function(e) { return e.name === args.target_name; }) : null;
            if (!Engine || !Engine.MythosEngine) return '错误：神话引擎未加载。';
            var result = Engine.MythosEngine.castSpell(c, args.spell_name, target);
            gameState.chatHistory.push({ role: 'system', isLocalOnly: true, isAlert: true, content: result.description });
            addJournalEntry({ type: 'spell_cast', charName: c.name, summary: '施放了' + args.spell_name + '。' + result.description });
            if (result.success && result.spellType === 'damage' && target) {
                var dmg = 0;
                if (result.powOpposed === 'caster') dmg = Engine.parseDice('2D6');
                else dmg = Engine.parseDice('1D3');
                if (target.isEnemy) {
                    ctx.updateEnemy(target.name, -dmg, '法术伤害');
                } else if (target.derived) {
                    target.hp = Math.max(0, (target.hp || target.derived.hp) - dmg);
                }
                result.description += ' 造成 ' + dmg + ' 点伤害。';
            }
            return result.description;
        }
    };
};
