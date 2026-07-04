// ===============================================
// 归属：【程序】 引擎核心 / AI调度 / 状态管理
// 美术/策划/QA 请勿直接修改此文件
// 修改后放入 roles/programmer/ 运行 merge.py 合并
// ===============================================

/**
 * CoC Tool Handlers: NPC registry domain (AUDITFIX8)
 */
export function npc(ctx) {
    const { gameState, addJournalEntry, addNpc, updateNpcStatus } = ctx;

    return {
        register_npc: (args) => {
            addNpc({ name: args.name, description: args.description, relation: args.relation, status: args.status || 'alive' });
            addJournalEntry({ type: 'npc_met', charName: null, summary: `初遇 NPC：${args.name}（${args.relation}）` });
            gameState.chatHistory.push({ role: 'system', isLocalOnly: true, content: `🕵️ [NPC登录] ${args.name} — ${args.relation}` });
            return `已记录 ${args.name}`;
        },
        update_npc_status: (args) => {
            const statusLabels = { alive: '存活', dead: '死亡', missing: '失踪', insane: '疯狂', unknown: '未知' };
            const ok = updateNpcStatus(args.name, args.status, args.note);
            if (!ok) return `找不到NPC: ${args.name}`;
            addJournalEntry({ type: 'npc_status', summary: `${args.name} 状态变为：${statusLabels[args.status] || args.status}` });
            gameState.chatHistory.push({ role: 'system', isLocalOnly: true, isAlert: args.status === 'dead', content: `${args.status === 'dead' ? '☠️' : '🔄'} [${statusLabels[args.status] || args.status}] ${args.name}${args.note ? '：' + args.note : ''}` });
            return `${args.name} 状态已更新`;
        }
    };
};
