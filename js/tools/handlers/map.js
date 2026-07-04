// GENERATED from js/tools/handlers/map.mjs — do not edit; run: npm run build:js
// ===============================================
// 归属：【程序】 引擎核心 / AI调度 / 状态管理
// 美术/策划/QA 请勿直接修改此文件
// 修改后放入 roles/programmer/ 运行 merge.py 合并
// ===============================================

/**
 * CoC Tool Handlers: Map and position domain (AUDITFIX8)
 */
window.CoCToolHandlerModules = window.CoCToolHandlerModules || {};
window.CoCToolHandlerModules.map = function(ctx) {
    const { gameState, createMap, updateRoom, setPosition } = ctx;

    return {
        create_map: (args) => {
            createMap(args.title, args.rooms || []);
            gameState.chatHistory.push({ role: 'system', isLocalOnly: true, content: `🗺️ [地图] ${args.title} 已绘制（${(args.rooms || []).length} 个区域）` });
            return `场景地图已创建：${args.title}`;
        },
        update_room: (args) => {
            const ok = updateRoom(args.room_id, args.status, args.note);
            return ok ? `房间已更新：${args.room_id}` : `找不到房间：${args.room_id}`;
        },
        set_position: (args) => {
            const ok = setPosition(args.room_id);
            if (ok) gameState.chatHistory.push({ role: 'system', isLocalOnly: true, content: `🚶 [移动] 进入：${gameState.currentLocation}` });
            return ok ? `当前位置：${gameState.currentLocation}` : `找不到房间：${args.room_id}`;
        }
    };
};
