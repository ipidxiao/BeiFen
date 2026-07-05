// GENERATED from js/tools/handlers/inventory.mjs — do not edit; run: npm run build:js
// ===============================================
// 归属：【程序】 引擎核心 / AI调度 / 状态管理
// 美术/策划/QA 请勿直接修改此文件
// 修改后放入 roles/programmer/ 运行 merge.py 合并
// ===============================================

/**
 * CoC Tool Handlers: Inventory domain (AUDITFIX8)
 */
window.CoCToolHandlerModules = window.CoCToolHandlerModules || {};
window.CoCToolHandlerModules.inventory = function(ctx) {
    const { gameState, addJournalEntry, Engine } = ctx;

    const _kp = () => {
        const cfg = typeof window !== 'undefined' && window.CoCKpConfig;
        if (cfg && typeof cfg.getKpEngine === 'function') return cfg.getKpEngine();
        if (typeof window !== 'undefined' && window.KpExecutionEngine) return window.KpExecutionEngine;
        return null;
    };

    return {
        update_inventory: (args) => {
            const kp = _kp();
            const kpOn = kp && kp.isEnabled && kp.isEnabled(gameState);
            let added = [];
            const source = args.source || args.acquisition_source || 'narrative_grant';
            (Array.isArray(args.items) ? args.items : [args.items]).forEach(i => {
                const raw = typeof i === 'object' && i ? (i.name || i.id || '') : String(i);
                let ci = String(raw).trim();
                if (!ci) return;
                if (kpOn) {
                    const v = kp.validateItemAcquisition(ci, source);
                    if (!v.ok) {
                        gameState.chatHistory.push({ role: 'system', isLocalOnly: true, isAlert: true, content: `🚫 [KP引擎] 物品拒绝：${v.reason}` });
                        return;
                    }
                    const myth = kp.checkMythosItem(ci);
                    if (myth.isMythos && myth.requiresSanCheck) {
                        const active = gameState.roster.find(r => r.isActive) || gameState.roster[0];
                        if (active && Engine && Engine.SanityEngine) {
                            const sanRes = Engine.SanityEngine.applySanLoss(active, Engine.parseDice ? Engine.parseDice('1D3') : 2, myth.cause);
                            gameState.chatHistory.push({ role: 'system', isLocalOnly: true, isAlert: true, content: `🧠 [KP引擎·神话物品] ${active.name} SAN ${sanRes.loss > 0 ? '-' + sanRes.loss : ''}（${myth.cause}）` });
                        }
                    }
                }
                gameState.inventory.push(ci);
                added.push(ci);
            });
            if (added.length > 0) {
                gameState.chatHistory.push({ role: 'system', isLocalOnly: true, content: `🎒 [获得物品] ${added.join(', ')}` });
                addJournalEntry({ type: 'item_found', summary: `获得：${added.join('、')}（来源：${source}）` });
            }
            return added.length ? '完成' : (kpOn ? '物品未添加（KP规则校验失败）' : '完成');
        },
        consume_inventory_items: (args) => {
            let removed = [];
            (Array.isArray(args.items) ? args.items : [args.items]).forEach(i => {
                let idx = gameState.inventory.findIndex(invItem => {
                    const label = typeof invItem === 'string' ? invItem : (invItem && invItem.name) || '';
                    return label.includes(String(i).trim());
                });
                if (idx !== -1) { removed.push(gameState.inventory[idx]); gameState.inventory.splice(idx, 1); }
            });
            if (removed.length > 0) {
                gameState.chatHistory.push({ role: 'system', isLocalOnly: true, content: `🔽 [消耗/失去] ${removed.map(r => typeof r === 'string' ? r : r.name).join(', ')}` });
                addJournalEntry({ type: 'item_lost', summary: `失去/消耗：${removed.map(r => typeof r === 'string' ? r : r.name).join('、')}` });
            }
            return "完成";
        }
    };
};
