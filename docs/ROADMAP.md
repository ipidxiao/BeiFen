# CoC 7th 引擎 — V17 开发路线图

> V16.4 AUDITFIX8 Final — 全部 P0-P3 计划任务已完成。

## ✅ 已完成

### 架构清理
- [x] `ground_truth_canvas.md` 重写（移除 Linux 路径）
- [x] `docs/internal/` 移除
- [x] `ENGINEERING.md` + `humanpending.md` 重写
- [x] `docs/audit/README.md` 审计索引

### 模块拆分
- [x] `ai_logic.js` → `ai/network.js` + `ai/tool_dispatch.js` + `ai_logic.js` (577→113+122+426)
- [x] `state.js` → `state/core.js` + `ui.js` + `gameplay.js` + `persistence.js` + `state.js` (920→73+92+340+418+147)
- [x] `coc.js` BaseSkills → `js/data/skills.js` (490→443)

### 质量提升
- [x] 15 核心函数 JSDoc 补全
- [x] 11 组件内联样式 → CSS 类提取（style.css 107→521 行）
- [x] `engine_tests.js` 扩展（11→34 assertions）
- [x] `tests/run_all_smoke.js` 统一测试入口

### ESM 迁移（第一阶段）
- [x] `js/esm/` 包装层（15 个 .mjs 文件，安全桥接 `window.*` → ESM `import`）
- [x] `js/app.mjs` ESM 入口点（与 `js/app.js` 并行）
- [x] `js/esm/README.md` 迁移路径文档

### 基础设施
- [x] `.github/workflows/test.yml` CI 配置
- [x] `docs/cdn-evaluation.md` CDN 离线化方案
- [x] `docs/a11y-audit.md` 无障碍审查
- [x] `docs/ROADMAP.md` 本文件

---

## ⬜ V17 剩余（下一迭代窗口）

> **2026-07-06 可选增强已启动** — 见下方「已启动」各节。

### ESM 迁移（第二阶段） — 🔄 进行中
将实际逻辑移入 `.mjs` 文件，消除 `window.*` 全局：

1. 数据文件迁移（skills/jobs/experiences/items/dev_logs → data/*.mjs）
2. 引擎迁移（coc.mjs）
3. 工具系统迁移（tools/*.mjs）
4. 状态管理迁移（state/*.mjs）
5. AI 模块迁移（ai/*.mjs）
6. 组件/视图迁移（components/*.mjs, views/*.mjs）
7. `index.html` 切换为单一 `<script type="module" src="js/app.mjs">`
8. Smoke 测试重写为 ESM import

**工期**: 2-3d | **风险**: 高（需同步更新全部测试）

**已启动 (2026-07-06)**:
- [x] `?esm=1` 可选引导：`index.html` 设置 `__COC_ESM_BOOT__`，`app.mjs` 条件挂载
- [x] `tests/esm_phase2_boot_smoke.mjs` 门禁
- [ ] 数据/引擎/状态/AI 逻辑完全脱离 `window.*`（进行中）
- [ ] `index.html` 默认切换为单一 `<script type="module">`（未做，保留 IIFE 回退）

### CDN 本地化 — ✅ 已完成（方案 C）
- [x] `vendor/vue.global.prod.js` + `vendor/bootstrap.min.css` 本地化
- [x] Chart.js / PDF.js 本地化 + CDN `cocLoadCdnFallback` 回退
- [x] `sw.js` ASSETS 含 vendor；`tests/sw_cache_smoke.js` 门禁
- [x] 车卡雷达图 Chart 不可用时的文本降级（`chartUnavailable`）

### 无障碍修复 — ✅ 已完成（P1/P2）
- [x] 聊天 `aria-live`、骰子 `aria-label`、地图/线索/战斗键盘焦点
- [x] `tests/a11y_smoke.js` 回归门禁

### 无障碍修复（原文档）
- P1: 聊天容器 `aria-live`（5 min）
- P2: SVG 组件键盘焦点（40 min）
- 详见 `docs/a11y-audit.md`

### 测试覆盖增强 — 🔄 进行中
- [x] `coverage_gap_smoke.js`（HealingEngine / age / enemy / validateToolArguments）
- [x] `esm_state.mjs` / `esm_ai.mjs`（jsdom/browser-mock）
- [x] `esm_utils_logger.mjs` / `esm_tool_dispatch.mjs`
- [x] `flow_lobby_combat_smoke.js` E2E flow
- [ ] Playwright 真浏览器 E2E（未引入，沿用 Node VM flow smoke）
- [ ] 组件层 jsdom 全量（需完整 Vue 环境，延后）

---

## 📦 当前交付物

```
CoC_Engine_V16_4_AUDITFIX8_VERIFIED_SKILLVIS_REVIEWFIX_FILECHECK.zip
  80 files / 194 KB
  12/12 smoke PASS  |  34 engine assertions  |  0 internal docs
```
