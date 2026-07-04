// V18.1 Modular — thin ESM assembly layer
// Rule implementations live in js/engines/*.mjs (mirrors browser engines/*.js)
// ===============================================
// 归属：【程序】 引擎核心 / AI调度 / 状态管理
// 美术/策划/QA 请勿直接修改此文件
// 修改后放入 roles/programmer/ 运行 merge.py 合并
// ===============================================

import { buildCoCEngine } from './engines/index.mjs';

/**
 * CoC 7th Edition Rules Engine — ESM entry (assembled from modular engines).
 * Browser track loads js/coc.js + js/engines/*.js with the same module split.
 */
const CoCEngine = buildCoCEngine();

export { CoCEngine };
