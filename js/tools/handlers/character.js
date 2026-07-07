// GENERATED from js/tools/handlers/character.mjs — do not edit; run: npm run build:js
// ===============================================
// 归属：【程序】 引擎核心 / AI调度 / 状态管理
// 美术/策划/QA 请勿直接修改此文件
// 修改后放入 roles/programmer/ 运行 merge.py 合并
// ===============================================

/**
 * CoC Tool Handlers: Character domain (AUDITFIX8)
 *
 * Owns investigator HP/SAN mutations and major-wound side effects.
 * Behaviour mirrors the browser (.js) production handler: it delegates to
 * MajorWoundEngine / SanityEngine on window.CoCEngine when available and
 * falls back to direct arithmetic otherwise.
 */
window.CoCToolHandlerModules = window.CoCToolHandlerModules || {};
window.CoCToolHandlerModules.character = function(ctx) {
    const { gameState, addJournalEntry } = ctx;

    return {
        update_character_status: (args) => {
            let c = gameState.roster.find(r => r.name === args.target_name);
            if (!c) return "错误：找不到该角色";
            let resultMsg = `${c.name} 状态已更新：`;
            if (args.hp_change) {
                if (args.hp_change > 0) {
                    c.hp = Math.min(c.hp + args.hp_change, c.derived.hp);
                    gameState.chatHistory.push({ role: 'system', isLocalOnly: true, content: `💖 [恢复] 恢复了 ${args.hp_change} 点生命。` });
                } else {
                    let dmg = -args.hp_change;
                    let maxHp = c.derived.hp;
                    let halfHp = Math.floor(maxHp / 2);
                    c.hp += args.hp_change;
                    const statusAlert = { kind: 'hp_damage', name: c.name, dmg, hp: c.hp, maxHp, lines: [] };
                    let triggeredMajorWound = false;
                    let wound = null;
                    if (window.CoCEngine && window.CoCEngine.MajorWoundEngine) {
                        wound = window.CoCEngine.MajorWoundEngine.checkMajorWound(c, dmg);
                    }
                    if (wound && wound.isMajor) {
                        window.CoCEngine.MajorWoundEngine.applyMajorWound(c, wound);
                        triggeredMajorWound = true;
                        if (!c.status) c.status = {};
                        c.status.hasMajorWound = true;
                        statusAlert.majorWound = {
                            location: wound.location.location,
                            desc: wound.location.desc,
                            unconscious: !!wound.unconscious,
                            droppedWeapon: wound.droppedWeapon || null,
                            bleeding: !!wound.bleeding
                        };
                        statusAlert.lines.push(`⚠️ 【重伤】部位：${wound.location.location} — ${wound.location.desc}`);
                    } else if (dmg >= halfHp && !(c.status && c.status.hasMajorWound)) {
                        if (!c.status) c.status = {}; c.status.hasMajorWound = true;
                        triggeredMajorWound = true;
                        statusAlert.majorWound = { generic: true };
                        statusAlert.lines.push('⚠️ 【重伤】单次伤害过高，遭受致命打击！');
                    }

                    let forceCheck = null;
                    if (c.hp <= 0) {
                        c.hp = 0;
                        if (c.status && c.status.hasMajorWound) {
                            if (!c.status) c.status = {}; c.status.isDying = true;
                            const dc = window.CoCEngine && window.CoCEngine.MajorWoundEngine ? window.CoCEngine.MajorWoundEngine.dyingCheck(c) : null;
                            statusAlert.dying = { description: dc ? dc.description : '玩家倒在血泊中，离死亡仅一步之遥。' };
                            statusAlert.lines.push('💀 【濒死】' + statusAlert.dying.description);
                            if (dc && !dc.passed) { c.status.isDead = true; c.isActive = false; resultMsg += '玩家死亡。'; }
                            else resultMsg += '玩家濒死。';
                        } else {
                            if (!c.status) c.status = {}; c.status.isUnconscious = true;
                            statusAlert.unconscious = true;
                            statusAlert.lines.push('💤 【休克】玩家因剧痛失去了意识。');
                            resultMsg += "玩家昏迷。";
                        }
                    } else if (triggeredMajorWound) {
                        statusAlert.lines.push('⚠️ 请立刻进行体质(CON)检定以保持清醒！');
                        resultMsg += "玩家重伤，系统正强制其进行体质检定。";
                        forceCheck = { skill: "体质", target: c.name };
                    } else {
                        resultMsg += "玩家受到伤害。";
                    }

                    const plainContent = `🩸 [受到伤害] ${c.name} 失去 ${dmg} 点生命（${c.hp}/${maxHp}）`;
                    gameState.chatHistory.push({
                        role: 'system',
                        isLocalOnly: true,
                        isAlert: true,
                        statusAlert,
                        content: plainContent
                    });
                    addJournalEntry({ type: 'hp_loss', charName: c.name, summary: `受到 ${dmg} 点伤害（HP: ${c.hp}/${maxHp}）` });
                    if (forceCheck) return { msg: resultMsg + " 绝对禁止反悔！", forceCheck };
                }
            }
            if (args.san_change) {
                // Sync sanity to derived.sanity for SanityEngine compatibility
                if (c.derived && c.derived.sanity == null) c.derived.sanity = c.sanity || 0;
                if (c.sanity == null) c.sanity = c.derived ? c.derived.sanity : 0;
                const sanLoss = args.san_change < 0 ? -args.san_change : 0;

                if (sanLoss > 0 && window.CoCEngine && window.CoCEngine.SanityEngine) {
                    // Use full sanity engine for losses
                    const sanityResult = window.CoCEngine.SanityEngine.applySanLoss(c, sanLoss, args.note || 'SAN损失');
                    c.sanity = sanityResult.newSan;
                    if (c.derived) c.derived.sanity = sanityResult.newSan;
                    if (sanityResult.tempInsanity || sanityResult.indefInsanity) {
                        gameState.chatHistory.push({ role: 'system', isLocalOnly: true, isAlert: true,
                            content: sanityResult.description });
                    } else if (sanLoss > 0) {
                        gameState.chatHistory.push({ role: 'system', isLocalOnly: true, isAlert: true,
                            content: '[冲击] ' + sanityResult.description });
                    }
                    addJournalEntry({ type: 'san_loss', charName: c.name, summary: sanityResult.description });
                } else if (args.san_change < 0) {
                    // Fallback: direct SAN subtraction
                    c.sanity = Math.max(0, c.sanity + args.san_change);
                    if (c.derived) c.derived.sanity = c.sanity;
                    gameState.chatHistory.push({ role: 'system', isLocalOnly: true, isAlert: true,
                        content: '[冲击] 失去 ' + (-args.san_change) + ' 点理智！(当前 ' + c.sanity + ')' });
                    addJournalEntry({ type: 'san_loss', charName: c.name,
                        summary: '失去 ' + (-args.san_change) + ' 点理智（剩余 ' + c.sanity + '）' });
                } else {
                    // SAN recovery
                    c.sanity = Math.min((c.derived && c.derived.maxSan) || 99, (c.sanity || 0) + args.san_change);
                    if (c.derived) c.derived.sanity = c.sanity;
                    gameState.chatHistory.push({ role: 'system', isLocalOnly: true,
                        content: '[恢复] 恢复 ' + args.san_change + ' 点理智。(当前 ' + c.sanity + ')' });
                    addJournalEntry({ type: 'san_recover', charName: c.name,
                        summary: '恢复 ' + args.san_change + ' 点理智（当前 ' + c.sanity + '）' });
                }
            }
            return resultMsg + " 绝对禁止反悔！";
        },
        spend_luck: (args) => {
            const c = gameState.roster.find(function(r) { return r.name === args.target_name; });
            if (!c) return '错误：找不到调查员 ' + args.target_name;
            const Engine = window.CoCEngine;
            if (!Engine || !Engine.spendLuck) return '错误：引擎未加载。';
            const result = Engine.spendLuck(c, Number(args.amount) || 0);
            if (result.success) {
                gameState.chatHistory.push({ role: 'system', isLocalOnly: true, isAlert: true, content: '🍀 ' + result.message });
                addJournalEntry({ type: 'luck_spend', charName: c.name, summary: result.message });
            }
            return result.message;
        }
    };
};
