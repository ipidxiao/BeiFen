// ===============================================
// 归属：【程序】 引擎核心 / AI调度 / 状态管理
// 美术/策划/QA 请勿直接修改此文件
// 修改后放入 roles/programmer/ 运行 merge.py 合并
// ===============================================

/**
 * CoC Tool Handlers: Clue board domain (AUDITFIX8)
 */
export function clues(ctx) {
    const { gameState, addClue, linkClues, markClueStatus } = ctx;

    const getKpEng = () => {
        const cfg = typeof window !== 'undefined' && window.CoCKpConfig;
        if (cfg && typeof cfg.getKpEngine === 'function') return cfg.getKpEngine();
        if (typeof window !== 'undefined' && window.KpExecutionEngine) return window.KpExecutionEngine;
        if (typeof window !== 'undefined' && window.CoCLondonKpEngine) return window.CoCLondonKpEngine;
        return null;
    };

    return {
        add_clue: (args) => {
            const kpEng = getKpEng();
            let pathMeta = null;
            if (kpEng && kpEng.isEnabled && kpEng.isEnabled(gameState)) {
                const check = kpEng.canAddClue(args, { gameState });
                if (!check.allowed) {
                    return `错误：${check.reason}`;
                }
                pathMeta = check;
            }
            addClue(args.id, args.title, args.content, args.type, args.related_ids);
            if (kpEng && kpEng.isEnabled && kpEng.isEnabled(gameState) && pathMeta) {
                kpEng.registerPath(
                    gameState,
                    pathMeta.pathType,
                    args.id || ('clue_' + Date.now()),
                    !!pathMeta.isFalse
                );
            }
            const typeLabel = {
                physical: '物证', testimony: '证词', document: '文件', location: '地点',
                event: '事件', person: '人物', supernatural: '异常'
            }[args.type] || args.type;
            gameState.chatHistory.push({ role: 'system', isLocalOnly: true, content: `🔍 [线索] 【${args.title}】（${typeLabel}）` });
            return `线索已记录：${args.title}`;
        },
        link_clues: (args) => {
            linkClues(args.from_id, args.to_id, args.note);
            return `线索已连接：${args.from_id} ↔ ${args.to_id}`;
        },
        mark_clue_status: (args) => {
            const kpEng = getKpEng();
            if (kpEng && kpEng.isEnabled && kpEng.isEnabled(gameState) && args.status === 'key') {
                const evalResult = kpEng.evaluateKeyClueRequest
                    ? kpEng.evaluateKeyClueRequest(gameState)
                    : (kpEng.canTriggerKeyClue(gameState) ? { allowed: true } : { allowed: false });
                if (!evalResult.allowed) {
                    if (kpEng.recordKeyClueBlockedAttempt) kpEng.recordKeyClueBlockedAttempt(gameState);
                    const summary = kpEng.getScenePathSummary ? kpEng.getScenePathSummary(gameState) : { true: 0 };
                    const hint = evalResult.hint ? ` ${evalResult.hint}` : '';
                    const attempts = evalResult.attemptsLeft != null ? `（剩余 ${evalResult.attemptsLeft} 次后将降级放行）` : '';
                    return `错误：${evalResult.reason || `关键线索需要至少3条不同调查路径（当前真 ${summary.true}/3）`}${attempts}${hint}`;
                }
                if (evalResult.mode === 'degraded') {
                    gameState.chatHistory.push({
                        role: 'system',
                        isLocalOnly: true,
                        isAlert: true,
                        content: `⚠️ [KP引擎] ${evalResult.warning || '关键线索路径不足，已降级放行'}`
                    });
                    if (evalResult.hint) {
                        gameState.chatHistory.push({
                            role: 'system',
                            isLocalOnly: true,
                            content: `📋 [KP引擎] ${evalResult.hint}`
                        });
                    }
                }
                kpEng.updateAttention(gameState, 1, 'key_clue');
            }
            const ok = markClueStatus(args.id, args.status, args.note);
            return ok ? `线索状态已更新：${args.id} → ${args.status}` : `找不到线索：${args.id}`;
        }
    };
};
