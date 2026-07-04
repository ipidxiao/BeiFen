// GENERATED from js/tools/handlers/clues.mjs — do not edit; run: npm run build:js
// ===============================================
// 归属：【程序】 引擎核心 / AI调度 / 状态管理
// 美术/策划/QA 请勿直接修改此文件
// 修改后放入 roles/programmer/ 运行 merge.py 合并
// ===============================================

/**
 * CoC Tool Handlers: Clue board domain (AUDITFIX8)
 */
window.CoCToolHandlerModules = window.CoCToolHandlerModules || {};
window.CoCToolHandlerModules.clues = function(ctx) {
    const { gameState, addClue, linkClues, markClueStatus } = ctx;

    return {
        add_clue: (args) => {
            addClue(args.id, args.title, args.content, args.type, args.related_ids);
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
            const ok = markClueStatus(args.id, args.status, args.note);
            return ok ? `线索状态已更新：${args.id} → ${args.status}` : `找不到线索：${args.id}`;
        }
    };
};
