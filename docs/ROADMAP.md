# CoC 7th 引擎 — 开发路线图

> **当前版本：18.1.0**（以 `package.json` 为准）· 门禁 **39/39** smoke · AUDIT6 **CLOSED**  
> 架构演进详见 [ROADMAP_V18.md](./ROADMAP_V18.md) · 可选增强见 [OPTIONAL_ENHANCEMENTS.md](./OPTIONAL_ENHANCEMENTS.md)

---

## ✅ V18.1 当前状态（2026-07-06）

### 发布就绪
- [x] 单源 `.mjs` → `build:js` 生成浏览器 `.js`（`build:js:check` + `verify_browser_exports` CI 门禁）
- [x] 39/39 smoke 套件（`npm test`）+ `ci:smoke`（全量 smoke + build drift + exports）
- [x] AUDIT6 七轮审计 **7/7 完成**（见 [AUDIT6_BATCHES.md](./AUDIT6_BATCHES.md)）
- [x] PWA 离线：SW scope 相对路径、iOS meta、内联 icons（`file://`）、vendor 本地化
- [x] 模组库：10 内置 + 8 可下载（含 CC 社区改编），IndexedDB 缓存
- [x] 存档迁移 v1–v7 + IndexedDB 溢出兜底

### 可选增强（2026-07-06 批次）
| # | 项 | 状态 |
|---|-----|------|
| 1 | CDN 本地化（方案 C） | ✅ 完成 |
| 2 | 无障碍 P1/P2 | ✅ 完成 |
| 3 | jsdom / E2E 覆盖（VM 层） | ✅ 完成 |
| 4 | ESM Phase 2 首片 | 🔄 进行中（`?esm=1` 引导；数据层 `.mjs` 为权威源） |

### 进行中 / 延后
- [ ] ESM Phase 2 完全脱离 `window.*`（`index.html` 仍保留 IIFE 回退）
- [ ] Playwright 真浏览器 E2E（沿用 Node VM `flow_lobby_combat_smoke.js`）
- [ ] 组件层 jsdom 全量（需完整 Vue 环境，延后）
- [ ] `window.*` 全局命名统一（ROADMAP_V18 Phase 2–4）

### 已知设计取舍（wontfix，非缺陷）
- 战斗动作菜单为**引导**而非每回合强制校验
- KP 协议引擎**默认开启**，伦敦规则为全局底层协议

---

## 📦 当前交付物

```
CoC_Engine_V18.1.0
  版本: package.json → 18.1.0
  门禁: 39/39 smoke PASS · deep_verify 0/179
  发布: python build.py（自动 build:js + SW 内容哈希注入）
```

**快速验证：**
```bash
npm test              # 39/39 smoke
npm run ci:smoke      # smoke + build:js:check + exports
python build.py       # 发布 ZIP
```

---

## 📋 发布前检查

详见 [PRE_RELEASE_AUDIT.md](./PRE_RELEASE_AUDIT.md)（就绪度 8.5/10 · 零阻塞项）。

---

## 📚 历史归档（V16–V17）

<details>
<summary>V16.4 AUDITFIX8 / V17 迭代（点击展开）</summary>

### V16.4 已完成
- 架构清理：`ground_truth_canvas.md`、`ENGINEERING.md`、`docs/audit/` 索引
- 模块拆分：`ai_logic.js`、`state.js`、`coc.js` BaseSkills
- 质量提升：JSDoc、CSS 提取、`engine_tests.js` 扩展
- ESM 迁移第一阶段：`js/esm/` 包装层 + `app.mjs` 并行入口
- 基础设施：`.github/workflows/test.yml`、CDN/无障碍评估文档

### V17 已完成
- CDN 本地化（vendor + SW ASSETS + Chart 文本降级）
- 无障碍修复（`aria-live`、键盘焦点、`a11y_smoke.js`）
- 测试覆盖增强（`coverage_gap_smoke.js`、ESM 套件、`flow_lobby_combat_smoke.js`）
- ESM Phase 2 启动：`?esm=1` 引导 + `esm_phase2_boot_smoke.mjs`

> V17 原文档中的「12/12 smoke」「V16.4 交付物 ZIP」已过时；以本文 V18.1 节为准。

</details>
