// GENERATED from js/data/utils.mjs — do not edit; run: npm run build:js
// ===============================================
// 归属：【程序】 引擎核心 / AI调度 / 状态管理
// 美术/策划/QA 请勿直接修改此文件
// 修改后放入 roles/programmer/ 运行 merge.py 合并
// ===============================================

/**
 * CoC Engine Utility Functions
 *
 * Single source of truth for safeJsonParse / safeJsonClone.
 * Load before state.js and ai/network.js.
 */
function safeJsonParse(v, fallback = {}) {
    try {
        if (v === null || v === undefined || v === '') return fallback;
        return typeof v === 'object' ? v : JSON.parse(v);
    } catch (e) { return fallback; }
}

function safeJsonClone(v, fallback = null) {
    try { return safeJsonParse(JSON.stringify(v), fallback); }
    catch (e) { return fallback; }
}
