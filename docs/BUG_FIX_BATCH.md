# BUG 修复批次 — 2026-07-06

> 基线：`27939ed` · 门禁：`npm test` 39/39 · `npm run ci:smoke` PASS

## 发现方法

| 步骤 | 结果 |
|------|------|
| `npm test` | 39/39 PASS（修复前无失败） |
| `npm run ci:smoke` | PASS，`build:js --check` 无 drift |
| `tests/deep_verify.mjs` | 0 bugs, 179 checks |
| `docs/PRE_RELEASE_AUDIT.md` P1 | 无阻塞项；P2 wontfix（战斗菜单、KP 全局规则）已排除 |
| TODO/FIXME/HACK grep | 0 命中 |
| `coverage_gap_smoke.js` | ALL PASSED |
| 源码 spot-check | 发现 a11y 键盘处理与死代码问题 |

## BUG 清单

| ID | Severity | Area | Description | Status |
|----|----------|------|-------------|--------|
| BUG-001 | P1 | `story_clues` | 关联视图 SVG 节点 `@keydown` 调用未定义的 `toggleClueDetail`，键盘 Enter/Space 运行时失败 | **fixed** |
| BUG-002 | P2 | `story_map` | 地图 SVG 节点键盘触发 `goToRoom`（AI 移动），鼠标点击仅切换 `selectedRoom`，行为不一致 | **fixed** |
| BUG-003 | P3 | `state/ui` | `formatText` 死导出，从未消费且含 `<br>` 注入模式，与零 XSS 策略不符 | **fixed** |

## 排除项（非 BUG）

| 项 | 原因 |
|----|------|
| 战斗动作菜单非强制 | intentional design / wontfix |
| KP 默认开启 + 伦敦规则全局底层 | intentional design / wontfix |
| 发布前人工走查（离线/PWA/Tab） | QA 流程，非代码缺陷 |
| Playwright E2E / `window.*` 统一 | ROADMAP backlog |
| 设置页隐私提示 / KP tooltip 补强 | P2 增强，大厅已有 KP 说明与密钥存储提示 |

## 修复摘要

- **BUG-001**：在 `story_clues.mjs` 增加 `toggleClueDetail(clue)`，与 click 逻辑一致。
- **BUG-002**：在 `story_map.mjs` 增加 `toggleRoomDetail(room)`；SVG 节点 click/keyboard 统一为选中切换，「前往此处」按钮仍调用 `goToRoom`。
- **BUG-003**：从 `ui.mjs` / `state.mjs` 移除 `formatText`；`npm run build:js` 同步 `.js`。
- **回归**：`a11y_smoke.js` 增加 `toggleClueDetail` / `toggleRoomDetail` 存在性检查。

## 验证

```bash
npm test
npm run ci:smoke
```
