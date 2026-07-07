# 🗺 CoC 7th Engine — V18 架构演进路线图

> 基于 V17.1 架构审查 · 2026-07-02 · **P4 收尾 2026-07-07**

## 原则
1. **渐进式重构** — 每次改动后跑全量测试，不破坏 smoke 门禁
2. **依赖方向不变** — data→engine→tools→state→ai→components→views
3. **向后兼容** — 所有 window.X 全局保留，V18 增加显式导出

---

## Phase 1: 数据层统一 (P1) — ✅ CLOSED

| # | 任务 | 影响文件 | 收益 | 状态 |
|---|------|---------|------|------|
| 1.1 | items.js + items_db.js → 单一数据源 | items.js, items_db.js, index.html, 10 tests | 消除双DB冲突风险 | ✅ OPT-027 |
| 1.2 | .mjs 全量同步 (ESM parity) | 所有 .mjs 文件 | 双轨一致性 | ✅ build:js |
| 1.3 | char_creator.js → components/ | char_creator.js, index.html, tests | 分层归位 | ✅ OPT-028 |

## Phase 2: 解耦全局状态 (P2) — ✅ 首片 CLOSED

| # | 任务 | 影响文件 | 收益 | 状态 |
|---|------|---------|------|------|
| 2.1 | CoCState 接口提取 (IState) | state_contract.mjs | 定义显式契约 | ✅ OPT-029 |
| 2.2 | 组件层不直接读 window.CoCState | StoryStore, StoryChat | 降低耦合 | ✅ OPT-030 双试点 |
| 2.3 | CoCItemDB 改为只读访问 | story_equip.js, story_inv.js | 防止数据层被组件修改 | ✅ V17.1 |

> **V19+ 延续：** 其余 14 个 story 组件渐进 `stateApi` 注入。

## Phase 3: 引擎拆分 (P2) — ✅ CLOSED

| # | 任务 | 影响文件 | 收益 | 状态 |
|---|------|---------|------|------|
| 3.1 | SanityEngine → js/engines/sanity.js | coc.js | 1665→~300行 | ✅ |
| 3.2 | CombatEngine → js/engines/combat.js | coc.js | 职责分离 | ✅ |
| 3.3 | MythosEngine → js/engines/mythos.js | coc.js | 独立测试 | ✅ |
| 3.4 | MajorWoundEngine → js/engines/wound.js | coc.js | 独立测试 | ✅ |

`coc.js` 现为 **37 行**薄装配层（OPT-031）。

## Phase 4: 模块现代化 (P3) — ✅ 首片 CLOSED

| # | 任务 | 影响文件 | 收益 | 状态 |
|---|------|---------|------|------|
| 4.1 | var → const/let 全量迁移 | handlers/*.mjs | 代码质量 | ✅ OPT-032 |
| 4.2 | IIFE → ESM 渐进迁移 | ?esm=1 boot | 标准化 | ✅ OPT-033 首片 |
| 4.3 | 废弃 .mjs 双轨 | — | 减维护成本 | 🔄 V19+ |

| # | 任务 | 状态 |
|---|------|------|
| Playwright E2E 脚手架 | ✅ OPT-034（未入默认 CI） |
| KP 别名收敛 | ✅ OPT-035 |
| window.* 注册表 | ✅ OPT-036 |

---

## V17.1 已完成架构修复

| 修复 | 状态 |
|------|------|
| story_equip.js 不再直接修改 CoCItemDB | ✅ V17.1 |
| EQUIP_SLOTS/getSlotForItem/canReplace → data layer | ✅ V17.1 |
| items.js + items_db.js 合并 | ✅ items.mjs 权威 + shim |
| char_creator.js → components/ | ✅ |
| CoCState IState 契约 | ✅ state_contract.mjs |
| 组件解耦 window.CoCState | ✅ StoryStore + StoryChat 试点 |
| coc.js 引擎拆分 | ✅ 薄装配 + js/engines/* |
| ESM Phase 2 | ✅ 首片 CLOSED（见 ESM_PHASE2_NEXT.md） |
| Playwright E2E | ✅ 脚手架就绪 |
| KP 别名收敛 | ✅ @deprecated + warn |
| window.* 注册表 | ✅ globals_registry 接入 boot |

---

## V19+ 候选（不在 OPT-001–036 范围）

- ESM Phase 2 切片 1–4（boot module、state ESM entry、component barrel、弃用双轨）
- 组件层全量 stateApi 注入
- Playwright 入默认 CI
- OPT-019 全量 jsdom+Vue 组件单测

---

## 风险矩阵

| 风险 | 影响 | 缓解 |
|------|------|------|
| 引擎拆分破坏测试 | 高 | 每步跑全量测试 |
| 全局解耦导致运行时断裂 | 高 | 保留 window.X 向后兼容 |
| ESM迁移增加加载延迟 | 中 | 保持 IIFE 作为回退 |
