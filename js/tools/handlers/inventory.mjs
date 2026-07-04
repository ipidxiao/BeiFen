// ===============================================
// 归属：【程序】 引擎核心 / AI调度 / 状态管理
// 美术/策划/QA 请勿直接修改此文件
// 修改后放入 roles/programmer/ 运行 merge.py 合并
// ===============================================

/**
 * CoC Tool Handlers: Inventory domain (AUDITFIX8)
 */
export function inventory(ctx) {
    const { gameState, addJournalEntry } = ctx;

    return {
        update_inventory: (args) => {
            let added = [];
            (Array.isArray(args.items) ? args.items : [args.items]).forEach(i => {
                let ci = String(i).trim();
                if (ci) { gameState.inventory.push(ci); added.push(ci); }
            });
            if (added.length > 0) {
                gameState.chatHistory.push({ role: 'system', isLocalOnly: true, content: `🎒 [获得物品] ${added.join(', ')}` });
                addJournalEntry({ type: 'item_found', summary: `获得：${added.join('、')}` });
            }
            return "完成";
        },
        consume_inventory_items: (args) => {
            let removed = [];
            (Array.isArray(args.items) ? args.items : [args.items]).forEach(i => {
                let idx = gameState.inventory.findIndex(invItem => invItem.includes(String(i).trim()));
                if (idx !== -1) { removed.push(gameState.inventory[idx]); gameState.inventory.splice(idx, 1); }
            });
            if (removed.length > 0) {
                gameState.chatHistory.push({ role: 'system', isLocalOnly: true, content: `🔽 [消耗/失去] ${removed.join(', ')}` });
                addJournalEntry({ type: 'item_lost', summary: `失去/消耗：${removed.join('、')}` });
            }
            return "完成";
        }
    };
};
