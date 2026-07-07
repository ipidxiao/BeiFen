# 🗺 CoC 7th Engine — V18 架构演进路线图

> 基于 V17.1 架构审查 · 2026-07-02

## 原则
1. **渐进式重构** — 每次改动后跑全量测试，不破坏 18/18 门禁
2. **依赖方向不变** — data→engine→tools→state→ai→components→views
3. **向后兼容** — 所有 window.X 全局保留，V18 增加显式导出

---

## Phase 1: 数据层统一 (P1)

| # | 任务 | 影响文件 | 收益 |
|---|------|---------|------|
| 1.1 | items.js + items_db.js → 单一数据源 | items.js, items_db.js, index.html, 10 tests | 消除双DB冲突风险 |
| 1.2 | .mjs 全量同步 (ESM parity) | 所有 .mjs 文件 | 双轨一致性 |
| 1.3 | char_creator.js → components/ | char_creator.js, index.html, tests | 分层归位 |

## Phase 2: 解耦全局状态 (P2)

| # | 任务 | 影响文件 | 收益 |
|---|------|---------|------|
| 2.1 | CoCState 接口提取 (IState) | state/core.js | 定义显式契约 |
| 2.2 | 组件层不直接读 window.CoCState | 16 components | 降低耦合 |
| 2.3 | CoCItemDB 改为只读访问 | story_equip.js, story_inv.js | 防止数据层被组件修改 |

## Phase 3: 引擎拆分 (P2)

| # | 任务 | 影响文件 | 收益 |
|---|------|---------|------|
| 3.1 | SanityEngine → js/engines/sanity.js | coc.js | 1665→~300行 |
| 3.2 | CombatEngine → js/engines/combat.js | coc.js | 职责分离 |
| 3.3 | MythosEngine → js/engines/mythos.js | coc.js | 独立测试 |
| 3.4 | MajorWoundEngine → js/engines/wound.js | coc.js | 独立测试 |

## Phase 4: 模块现代化 (P3)

| # | 任务 | 影响文件 | 收益 |
|---|------|---------|------|
| 4.1 | var → const/let 全量迁移 | coc.js, handlers | 代码质量 |
| 4.2 | IIFE → ESM 渐进迁移 | 所有 .js | 标准化 |
| 4.3 | 废弃 .mjs 双轨 | — | 减维护成本 |

---

## V17.1 已完成架构修复

| 修复 | 状态 |
|------|------|
| story_equip.js 不再直接修改 CoCItemDB | ✅ V17.1 |
| EQUIP_SLOTS/getSlotForItem/canReplace → data layer | ✅ V17.1 |
| items.js + items_db.js 合并 | ✅ shim 已加（`items_db.mjs/js` 弃用警告） |
| char_creator.js → components/ | ✅ 已在 `js/components/` |
| CoCState IState 契约 | 🔄 `state_contract.mjs` JSDoc 首片 |
| 组件解耦 window.CoCState | 🔄 `StoryStore` 注入试点 |
| coc.js 引擎拆分 | 🔄 薄装配 + `js/engines/*` 已就位 |
| ESM Phase 2 | 🔄 `ESM_PHASE2_NEXT.md` + boot smoke 扩展 |
| Playwright E2E | 🔄 配置脚手架（未入默认 CI） |
| KP 别名收敛 | 🔄 `console.warn` 弃用提示 |
| window.* 注册表 | 🔄 `globals_registry.mjs` |

---

## 风险矩阵

| 风险 | 影响 | 缓解 |
|------|------|------|
| 引擎拆分破坏测试 | 高 | 每步跑全量测试 |
| 全局解耦导致运行时断裂 | 高 | 保留 window.X 向后兼容 |
| ESM迁移增加加载延迟 | 中 | 保持 IIFE 作为回退 |
